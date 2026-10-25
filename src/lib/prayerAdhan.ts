import { registerPlugin } from '@capacitor/core';
import { calculatePrayerTimes } from '@/lib/prayerTimes';
import type { City } from '@/lib/cities';

type NativePrayerAlarm = {
  schedule(options: { id: string; title: string; at: number; audioUrl: string }): Promise<void>;
  cancel(options: { id: string }): Promise<void>;
  cancelAll(): Promise<void>;
  checkFullScreenAccess(): Promise<{ allowed: boolean }>;
  checkExactAlarmAccess(): Promise<{ allowed: boolean }>;
  openExactAlarmSettings(): Promise<void>;
  openFullScreenSettings(): Promise<void>;
};

const NativeAlarm = registerPlugin<NativePrayerAlarm>('NoorAlarm');
const STORAGE_KEY = 'noor_prayer_adhan_alarm_ids';
const SYNC_STATE_KEY = 'noor_prayer_adhan_sync_state';
export const PRAYER_ADHAN_ENABLED_KEY = 'noor_prayer_adhan_enabled';
const HORIZON_DAYS = 30;
const RESYNC_AFTER_MS = 12 * 60 * 60 * 1000;

let syncQueue: Promise<unknown> = Promise.resolve();

type SyncState = { signature: string; syncedAt: number; localDate: string };

function getSyncState(): SyncState | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(SYNC_STATE_KEY) || 'null');
    if (!value || typeof value !== 'object') return null;
    const state = value as Partial<SyncState>;
    if (typeof state.signature !== 'string' || typeof state.syncedAt !== 'number' || typeof state.localDate !== 'string') return null;
    return state as SyncState;
  } catch {
    return null;
  }
}

function getLocalDateKey(date: Date, timezone: string): string {
  const parts = getLocalDateParts(date, timezone);
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}
const PRAYERS = [
  { key: 'fajr', name: 'اذان صبح' },
  { key: 'dhuhr', name: 'اذان ظهر' },
  { key: 'asr', name: 'اذان عصر' },
  { key: 'maghrib', name: 'اذان مغرب' },
  { key: 'isha', name: 'اذان عشاء' },
] as const;

function getLocalDateParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: value('year'), month: value('month'), day: value('day') };
}

function zonedDateTimeToTimestamp(
  year: number, month: number, day: number, hour: number, minute: number, timezone: string,
): number {
  const targetAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  let guess = targetAsUtc;
  for (let i = 0; i < 4; i++) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date(guess));
    const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
    const representedAsUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'));
    const correction = targetAsUtc - representedAsUtc;
    guess += correction;
    if (correction === 0) break;
  }
  return guess;
}

function loadScheduledIds(): string[] {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export async function checkPrayerAdhanExactAlarmAccess(): Promise<boolean> {
  try {
    const result = await NativeAlarm.checkExactAlarmAccess();
    return result.allowed;
  } catch {
    return false;
  }
}

export async function openPrayerAdhanExactAlarmSettings(): Promise<void> {
  await NativeAlarm.openExactAlarmSettings();
}

export async function checkPrayerAdhanFullScreenAccess(): Promise<boolean> {
  try {
    const result = await NativeAlarm.checkFullScreenAccess();
    return result.allowed;
  } catch {
    return false;
  }
}


export async function openPrayerAdhanFullScreenSettings(): Promise<void> {
  await NativeAlarm.openFullScreenSettings();
}

/**
 * Schedules a rolling month of prayer alarms independently from user-created reminders.
 * Only adhan records with a real audio URL can be scheduled; no ringtone fallback is used.
 */
export function syncPrayerAdhanAlarms(options: {
  enabled: boolean;
  city: City;
  method: string;
  adhanId: string;
  audioUrl?: string;
}): Promise<{ scheduled: number; error?: string }> {
  // Serialize callers from startup, focus and visibility events so two syncs
  // cannot cancel each other's alarms while scheduling a new rolling horizon.
  const task = syncQueue.then(() => syncPrayerAdhanAlarmsInternal(options));
  syncQueue = task.then(() => undefined, () => undefined);
  return task;
}

async function syncPrayerAdhanAlarmsInternal(options: {
  enabled: boolean;
  city: City;
  method: string;
  adhanId: string;
  audioUrl?: string;
}): Promise<{ scheduled: number; error?: string }> {
  const signature = JSON.stringify({
    enabled: options.enabled,
    cityId: options.city.id,
    latitude: options.city.lat,
    longitude: options.city.lng,
    timezone: options.city.timezone,
    method: options.method,
    adhanId: options.adhanId,
    audioUrl: options.audioUrl ?? '',
  });
  const now = new Date();
  const localDateKey = getLocalDateKey(now, options.city.timezone);

  // Permission can be revoked in Android Settings while the app is backgrounded.
  // Never trust the cached schedule until Android confirms exact-alarm access;
  // clear only the cache marker so a later return/regrant performs a full resync.
  if (options.enabled) {
    let exactAlarmAllowed = false;
    try {
      const permission = await NativeAlarm.checkExactAlarmAccess();
      exactAlarmAllowed = permission.allowed === true;
    } catch {
      exactAlarmAllowed = false;
    }
    if (!exactAlarmAllowed) {
      try { localStorage.removeItem(SYNC_STATE_KEY); } catch { /* ignore unavailable storage */ }
      return { scheduled: 0, error: 'برای پخش به‌موقع اذان، اجازه آلارم دقیق اندروید را فعال کن.' };
    }
  }

  const previousState = getSyncState();
  if (options.enabled && previousState?.signature === signature
      && previousState.localDate === localDateKey
      && now.getTime() - previousState.syncedAt < RESYNC_AFTER_MS) {
    return { scheduled: loadScheduledIds().length };
  }

  const oldIds = loadScheduledIds();
  for (const id of oldIds) {
    try { await NativeAlarm.cancel({ id }); } catch { /* stale alarm */ }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));

  if (!options.enabled) {
    try { localStorage.removeItem(SYNC_STATE_KEY); } catch { /* ignore unavailable storage */ }
    return { scheduled: 0 };
  }
  if (!options.audioUrl || !options.audioUrl.startsWith('https://')) {
    return { scheduled: 0, error: 'برای این اذان هنوز فایل صوتی قابل پخش آماده نیست.' };
  }

  const local = getLocalDateParts(now, options.city.timezone);
  const start = new Date(Date.UTC(local.year, local.month - 1, local.day, 12));
  const ids: string[] = [];
  let failed = 0;

  for (let offset = 0; offset < HORIZON_DAYS; offset++) {
    const day = new Date(start.getTime() + offset * 86400000);
    const year = day.getUTCFullYear();
    const month = day.getUTCMonth() + 1;
    const date = day.getUTCDate();
    const calcDate = new Date(Date.UTC(year, month - 1, date, 12));
    const times = calculatePrayerTimes(calcDate, options.city.lat, options.city.lng, options.city.timezone, options.method);

    for (const prayer of PRAYERS) {
      const time = times[prayer.key];
      const match = /^(\d{2}):(\d{2})$/.exec(time);
      if (!match) continue;
      const at = zonedDateTimeToTimestamp(year, month, date, Number(match[1]), Number(match[2]), options.city.timezone);
      if (at <= Date.now() + 5000) continue;
      const id = `prayer-${options.city.id}-${options.method}-${options.adhanId}-${year}${String(month).padStart(2, '0')}${String(date).padStart(2, '0')}-${prayer.key}`;
      try {
        await NativeAlarm.schedule({ id, title: prayer.name, at, audioUrl: options.audioUrl });
        ids.push(id);
      } catch {
        failed++;
      }
    }
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  if (ids.length === 0) {
    try { localStorage.removeItem(SYNC_STATE_KEY); } catch { /* ignore unavailable storage */ }
    return { scheduled: 0, error: 'هیچ آلارم اذانی زمان‌بندی نشد؛ مجوز آلارم دقیق و اتصال اینترنت را بررسی کن.' };
  }
  if (failed === 0) {
    try {
      localStorage.setItem(SYNC_STATE_KEY, JSON.stringify({ signature, syncedAt: Date.now(), localDate: localDateKey } satisfies SyncState));
    } catch { /* a future app focus can retry if sync state cannot be persisted */ }
  } else {
    try { localStorage.removeItem(SYNC_STATE_KEY); } catch { /* ignore unavailable storage */ }
  }
  return {
    scheduled: ids.length,
    error: failed ? `${failed} آلارم از زمان‌بندی ناموفق بود.` : undefined,
  };
}
