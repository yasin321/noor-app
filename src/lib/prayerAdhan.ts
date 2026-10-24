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
export const PRAYER_ADHAN_ENABLED_KEY = 'noor_prayer_adhan_enabled';
const HORIZON_DAYS = 30;
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

export async function checkPrayerAdhanFullScreenAccess(): Promise<boolean> {
  try {
    const result = await NativeAlarm.checkFullScreenAccess();
    return result.allowed;
  } catch {
    return false;
  }
}

export async function checkPrayerExactAlarmAccess(): Promise<boolean> {
  try { return (await NativeAlarm.checkExactAlarmAccess()).allowed; } catch { return false; }
}

export async function openPrayerExactAlarmSettings(): Promise<void> {
  await NativeAlarm.openExactAlarmSettings();
}

export async function openPrayerAdhanFullScreenSettings(): Promise<void> {
  await NativeAlarm.openFullScreenSettings();
}

/**
 * Schedules a rolling month of prayer alarms independently from user-created reminders.
 * Only adhan records with a real audio URL can be scheduled; no ringtone fallback is used.
 */
export async function syncPrayerAdhanAlarms(options: {
  enabled: boolean;
  city: City;
  method: string;
  adhanId: string;
  audioUrl?: string;
}): Promise<{ scheduled: number; error?: string }> {
  const oldIds = loadScheduledIds();
  for (const id of oldIds) {
    try { await NativeAlarm.cancel({ id }); } catch { /* stale alarm */ }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));

  if (!options.enabled) return { scheduled: 0 };
  if (!options.audioUrl || !options.audioUrl.startsWith('https://')) {
    return { scheduled: 0, error: 'برای این اذان هنوز فایل صوتی قابل پخش آماده نیست.' };
  }

  const now = new Date();
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
  if (ids.length === 0) return { scheduled: 0, error: 'هیچ آلارم اذانی زمان‌بندی نشد؛ مجوز آلارم دقیق و اتصال اینترنت را بررسی کن.' };
  return {
    scheduled: ids.length,
    error: failed ? `${failed} آلارم از زمان‌بندی ناموفق بود.` : undefined,
  };
}
