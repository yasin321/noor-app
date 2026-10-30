import { calculatePrayerTimes } from './prayerTimes';
import { getCityById, getGuestCityId, getCustomGpsCoords } from './cities';
import { addMinutesToTimeStr, PRE_ADHAN_CHANT_OPTIONS } from './deenIntelligenceStore';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import {
  loadReminders,
  saveReminder,
  deleteReminderFromStorage,
  generateReminderId,
  reminderIdToNotifId,
  type LocalReminder,
} from './reminderStorage';
import { dhikrLibrary } from './dhikrLibrary';
import { logEvent } from './logger';
import { getAdhanDurationMode, getAdhanDurationSeconds } from './adhans';

export { loadReminders, type LocalReminder };

export interface NoorAlarmPluginInterface {
  scheduleNativeAlarm(options: {
    id: number;
    triggerAtMillis: number;
    title: string;
    body: string;
    soundType: string;
    adhanId?: string;
    durationSeconds?: number;
    volumePercent?: number;
  }): Promise<{ scheduled: boolean }>;
  cancelNativeAlarm(options: { id: number }): Promise<void>;
  stopActiveAlarm(): Promise<void>;
  openBatteryOptimizationSettings(): Promise<void>;
  requestAndGetLocation(): Promise<{ hasCoords: boolean; lat?: number; lng?: number; provider?: string }>;
  updatePrayerWidget(options: { nextPrayerText: string; subtitleText: string }): Promise<void>;
}

export const NoorAlarm = registerPlugin<NoorAlarmPluginInterface>('NoorAlarm');

const DAY_LABELS_FA: Record<number, string> = {
  6: 'شنبه',
  0: 'یکشنبه',
  1: 'دوشنبه',
  2: 'سه‌شنبه',
  3: 'چهارشنبه',
  4: 'پنجشنبه',
  5: 'جمعه',
};

export function getDayLabel(day: number): string {
  return DAY_LABELS_FA[day] ?? '';
}

function resolvePrayerAlarmParams(reminderId: string, reminderTitle = ''): {
  soundType: string;
  adhanId: string;
  durationSeconds: number;
  volumePercent: number;
} {
  const selectedAdhan = (() => {
    try {
      return localStorage.getItem('noor_guest_adhan_id') || 'mahur_saeed';
    } catch {
      return 'mahur_saeed';
    }
  })();

  // اگر یادآور از نوع «تواشیح و دعای قبل از اذان» است، صدای تواشیح/مناجات مربوطه پخش شود نه اذان کامل
  if (reminderId.startsWith('pre_adhan_') || reminderTitle.includes('مانده تا اذان') || reminderTitle.includes('دقیقه تا اذان')) {
    const matchedChant = PRE_ADHAN_CHANT_OPTIONS.find((c) => reminderTitle.includes(c.titleFa));
    return {
      soundType: 'short_10s',
      adhanId: matchedChant ? matchedChant.audioAdhanId : 'moazenzadeh_ardabili',
      durationSeconds: matchedChant ? matchedChant.durationSec : 16,
      volumePercent: 100,
    };
  }

  const globalMode = getAdhanDurationMode();
  const globalDurSec = getAdhanDurationSeconds(globalMode);

  if (!reminderId.startsWith('prayer_auto_')) {
    return {
      soundType: 'alarm',
      adhanId: selectedAdhan,
      durationSeconds: 15,
      volumePercent: 100,
    };
  }

  return {
    soundType: globalMode === '10s' ? 'short_10s' : 'adhan',
    adhanId: selectedAdhan,
    durationSeconds: globalDurSec,
    volumePercent: 100,
  };
}

// محاسبه داینامیک ساعت دقیق اذان یا یادآور قبل از اذان برای هر تاریخ مشخص در آینده
function computeDynamicPrayerDate(reminder: LocalReminder, baseCandidate: Date): Date {
  try {
    const isAutoPrayer = reminder.id.startsWith('prayer_auto_');
    const isPreAdhan = reminder.id.startsWith('pre_adhan_') || reminder.title.includes('دقیقه تا اذان') || reminder.title.includes('مانده تا اذان');
    if (!isAutoPrayer && !isPreAdhan) return baseCandidate;

    const city = getCityById(getGuestCityId());
    const exactGps = getCustomGpsCoords();
    const lat = exactGps ? exactGps.lat : city.lat;
    const lng = exactGps ? exactGps.lng : city.lng;
    const method = localStorage.getItem('noor_guest_calc_method') || 'tehran';
    const dayTimes = calculatePrayerTimes(baseCandidate, lat, lng, city.timezone, method);

    let pKey: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | null = null;
    if (reminder.id.includes('fajr') || reminder.title.includes('صبح')) pKey = 'fajr';
    else if (reminder.id.includes('dhuhr') || reminder.title.includes('ظهر')) pKey = 'dhuhr';
    else if (reminder.id.includes('asr') || reminder.title.includes('عصر')) pKey = 'asr';
    else if (reminder.id.includes('maghrib') || reminder.title.includes('مغرب')) pKey = 'maghrib';
    else if (reminder.id.includes('isha') || reminder.title.includes('عشاء')) pKey = 'isha';

    if (!pKey) return baseCandidate;

    let targetHHMM = dayTimes[pKey];
    if (isPreAdhan) {
      const mMatch = reminder.id.match(/pre_adhan_[a-z]+_(d+)/);
      const offsetMin = mMatch ? Number(mMatch[1]) : 10;
      targetHHMM = addMinutesToTimeStr(targetHHMM, -offsetMin);
    }

    const [h, m] = targetHHMM.split(':').map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      const shifted = new Date(baseCandidate);
      shifted.setHours(h, m, 0, 0);
      return shifted;
    }
  } catch {}
  return baseCandidate;
} {
  const selectedAdhan = (() => {
    try {
      return localStorage.getItem('noor_guest_adhan_id') || 'mahur_saeed';
    } catch {
      return 'mahur_saeed';
    }
  })();
  const globalMode = getAdhanDurationMode();
  const globalDurSec = getAdhanDurationSeconds(globalMode);

  if (!reminderId.startsWith('prayer_auto_')) {
    return {
      soundType: 'alarm',
      adhanId: selectedAdhan,
      durationSeconds: 15,
      volumePercent: 100,
    };
  }

  return {
    soundType: globalMode === '10s' ? 'short_10s' : 'adhan',
    adhanId: selectedAdhan,
    durationSeconds: globalDurSec,
    volumePercent: 100,
  };
}

let channelReady = false;

export const ADHAN_CHANNEL_ID = 'noor_adhan_channel_v4';
export const REMINDER_CHANNEL_ID = 'noor_reminders_v4';

export async function ensureChannel(): Promise<void> {
  if (channelReady) return;
  try {
    await LocalNotifications.createChannel({
      id: REMINDER_CHANNEL_ID,
      name: 'یادآوری‌های اذکار و نیایش',
      description: 'اعلان و هشدار صوتی یادآوری اذکار روزانه با صدای زنگ',
      importance: 5,
      visibility: 1,
      vibration: true,
      lights: true,
    });
    await LocalNotifications.createChannel({
      id: ADHAN_CHANNEL_ID,
      name: 'پخش اذان و اوقات شرعی',
      description: 'اعلان با اولویت بالا و پخش صدای اذان در اوقات شرعی',
      importance: 5,
      visibility: 1,
      sound: 'adhan_mahur',
      vibration: true,
      lights: true,
    });
    channelReady = true;
  } catch {
    // ignore on web
  }
}

export type PermissionStatus = 'granted' | 'denied' | 'prompt';

export async function checkPermission(): Promise<PermissionStatus> {
  try {
    const { display } = await LocalNotifications.checkPermissions();
    if (display === 'granted') return 'granted';
    if (display === 'denied') return 'denied';
    return 'prompt';
  } catch {
    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'granted') return 'granted';
      if (Notification.permission === 'denied') return 'denied';
      return 'prompt';
    }
    return 'denied';
  }
}

export async function requestPermission(): Promise<PermissionStatus> {
  try {
    const { display } = await LocalNotifications.requestPermissions();
    if (display === 'granted') return 'granted';
    if (display === 'denied') return 'denied';
    return 'prompt';
  } catch {
    if (typeof Notification !== 'undefined') {
      const res = await Notification.requestPermission();
      return res === 'granted' ? 'granted' : res === 'denied' ? 'denied' : 'prompt';
    }
    return 'denied';
  }
}

export function buildNotificationBody(reminder: LocalReminder): string {
  if (reminder.body.trim()) return reminder.body.trim();
  if (reminder.dhikrId) {
    const d = dhikrLibrary.find((x) => x.id === reminder.dhikrId);
    if (d) return `${d.arabic} — ${d.translation} (${d.count} بار)`;
  }
  return 'وقت یادآوری ذکر و نیایش است';
}

export function getUpcomingOccurrences(
  timeStr: string,
  days: number[],
  fromDate: Date = new Date(),
  horizonDays = 14
): Date[] {
  const parts = timeStr.split(':');
  if (parts.length !== 2) return [];
  const hour = Number(parts[0]);
  const minute = Number(parts[1]);
  if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return [];
  }

  const results: Date[] = [];
  for (let offset = 0; offset <= horizonDays; offset++) {
    const candidate = new Date(
      fromDate.getFullYear(),
      fromDate.getMonth(),
      fromDate.getDate() + offset,
      hour,
      minute,
      0,
      0
    );
    if (candidate <= fromDate) continue;
    if (days.length === 0 || days.includes(candidate.getDay())) {
      results.push(candidate);
    }
  }
  return results;
}

export function computeNextOccurrences(
  timeStr: string,
  days: number[],
  horizonDays = 14
): Date[] {
  return getUpcomingOccurrences(timeStr, days, new Date(), horizonDays);
}

export function computeSingleOccurrence(dateStr: string | null, timeStr: string): Date | null {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  if ([year, month, day, hour, minute].some(isNaN)) return null;

  const target = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (target <= new Date()) return null;
  return target;
}

const scheduledSlotMap = new Map<string, number[]>();

export async function cancelReminder(reminderId: string): Promise<void> {
  const existingIds = scheduledSlotMap.get(reminderId) ?? [];
  const fallbackIds = Array.from({ length: 15 }, (_, i) => reminderIdToNotifId(reminderId, i));
  const allIds = Array.from(new Set([...existingIds, ...fallbackIds]));

  try {
    await LocalNotifications.cancel({
      notifications: allIds.map((id) => ({ id })),
    });
  } catch {
    // ignore
  }

  if (Capacitor.getPlatform() === 'android') {
    for (const id of allIds.slice(0, 15)) {
      try {
        await NoorAlarm.cancelNativeAlarm({ id });
      } catch {
        // ignore
      }
    }
  }
  scheduledSlotMap.delete(reminderId);
}

export async function scheduleReminder(
  reminder: LocalReminder,
  globalNotifEnabled = true
): Promise<{ success: boolean; scheduledCount: number; scheduledIds: number[]; error?: string }> {
  await cancelReminder(reminder.id);

  if (!reminder.enabled || !globalNotifEnabled) {
    return { success: true, scheduledCount: 0, scheduledIds: [] };
  }

  const perm = await checkPermission();
  if (perm !== 'granted') {
    const requested = await requestPermission();
    if (requested !== 'granted') {
      return {
        success: false,
        scheduledCount: 0,
        scheduledIds: [],
        error: 'مجوز اعلان داده نشده است. لطفاً از تنظیمات گوشی، اعلان‌های برنامه نور را فعال کنید.',
      };
    }
  }

  if (typeof LocalNotifications.checkExactNotificationSetting === 'function') {
    try {
      const exactRes = await LocalNotifications.checkExactNotificationSetting();
      if (exactRes && exactRes.exact_alarm && exactRes.exact_alarm !== 'granted') {
        return {
          success: false,
          scheduledCount: 0,
          scheduledIds: [],
          error: 'برای پخش دقیق اذان و یادآوری در زمان قفل بودن صفحه، دسترسی «آلارم‌ها و یادآوری‌ها» را فعال کنید.',
        };
      }
    } catch {
      // ignore if unsupported on web
    }
  }

  await ensureChannel();
  const body = buildNotificationBody(reminder);
  const isPrayerAdhan = reminder.id.startsWith('prayer_auto_') || reminder.title.includes('اذان');
  const targetChannelId = isPrayerAdhan ? ADHAN_CHANNEL_ID : REMINDER_CHANNEL_ID;

  if (reminder.type === 'once') {
    const target = computeSingleOccurrence(reminder.date, reminder.time);
    if (!target) {
      return {
        success: false,
        scheduledCount: 0,
        scheduledIds: [],
        error: 'تاریخ و ساعت انتخاب‌شده در گذشته است. لطفاً زمان آینده انتخاب کنید.',
      };
    }

    const notifId = reminderIdToNotifId(reminder.id, 0);
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: notifId,
            title: reminder.title,
            body,
            channelId: targetChannelId,
            sound: isPrayerAdhan ? 'adhan_mahur' : undefined,
            schedule: { at: target, allowWhileIdle: true },
            extra: { reminderId: reminder.id, dhikrId: reminder.dhikrId ?? '' },
          },
        ],
      });
      if (Capacitor.getPlatform() === 'android') {
        try {
          const p = resolvePrayerAlarmParams(reminder.id, reminder.title);
          await NoorAlarm.scheduleNativeAlarm({
            id: notifId,
            triggerAtMillis: target.getTime(),
            title: reminder.title,
            body,
            ...p,
          });
        } catch {
          // ignore
        }
      }
      scheduledSlotMap.set(reminder.id, [notifId]);
      logEvent('info', 'ReminderService', `آلارم یک‌باره زمان‌بندی شد: ${reminder.title}`, {
        at: target.toISOString(),
      });
      return { success: true, scheduledCount: 1, scheduledIds: [notifId] };
    } catch (err) {
      logEvent('error', 'ReminderService', 'خطا در زمان‌بندی آلارم یک‌باره', { error: String(err) });
      return { success: false, scheduledCount: 0, scheduledIds: [], error: 'خطا در ثبت اعلان در سیستم‌عامل.' };
    }
  }

  const occurrences = getUpcomingOccurrences(reminder.time, reminder.days, new Date(), 14);
  if (occurrences.length === 0) {
    return { success: true, scheduledCount: 0, scheduledIds: [] };
  }

  const scheduledIds: number[] = [];
  try {
    for (let idx = 0; idx < occurrences.length; idx++) {
      const atDate = computeDynamicPrayerDate(reminder, occurrences[idx]);
      const notifId = reminderIdToNotifId(reminder.id, idx);
      scheduledIds.push(notifId);
      await LocalNotifications.schedule({
        notifications: [
          {
            id: notifId,
            title: reminder.title,
            body,
            channelId: targetChannelId,
            sound: isPrayerAdhan ? 'adhan_mahur' : undefined,
            schedule: { at: atDate, allowWhileIdle: true },
            extra: { reminderId: reminder.id, dhikrId: reminder.dhikrId ?? '' },
          },
        ],
      });
      if (Capacitor.getPlatform() === 'android') {
        try {
          const p = resolvePrayerAlarmParams(reminder.id, reminder.title);
          await NoorAlarm.scheduleNativeAlarm({
            id: notifId,
            triggerAtMillis: atDate.getTime(),
            title: reminder.title,
            body,
            ...p,
          });
        } catch {
          // ignore
        }
      }
    }
    scheduledSlotMap.set(reminder.id, scheduledIds);
    logEvent('info', 'ReminderService', `یادآور تکرارشونده زمان‌بندی شد: ${reminder.title}`, {
      count: scheduledIds.length,
      time: reminder.time,
    });
    return { success: true, scheduledCount: scheduledIds.length, scheduledIds };
  } catch (err) {
    logEvent('error', 'ReminderService', 'خطا در زمان‌بندی یادآور تکرارشونده', { error: String(err) });
    return { success: false, scheduledCount: 0, scheduledIds: [], error: 'خطا در زمان‌بندی اعلان.' };
  }
}

export async function rescheduleAllReminders(
  globalNotifEnabled = true
): Promise<{ total: number; succeeded: number; failed: string[] }> {
  const reminders = loadReminders();
  let succeeded = 0;
  const failed: string[] = [];
  for (const r of reminders) {
    const res = await scheduleReminder(r, globalNotifEnabled);
    if (res.success) {
      succeeded++;
    } else if (res.error) {
      failed.push(res.error);
    }
  }
  return { total: reminders.length, succeeded, failed };
}

export const rescheduleAll = rescheduleAllReminders;

export async function cancelAllScheduledNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({
        notifications: pending.notifications.map((n) => ({ id: n.id })),
      });
    }
    scheduledSlotMap.clear();
  } catch (err) {
    console.warn('[ReminderService] cancelAll failed:', err);
  }
}

export interface ReminderMutationResult {
  reminder: LocalReminder;
  schedule: { success: boolean; error?: string };
  scheduleResult: { success: boolean; error?: string };
}

export async function createReminder(params: {
  title: string;
  body?: string;
  time: string;
  days: number[];
  dhikrId?: string | null;
  type?: 'once' | 'recurring';
  date?: string | null;
  notifEnabled?: boolean;
}): Promise<ReminderMutationResult> {
  const now = new Date().toISOString();
  const rType = params.type ?? 'recurring';
  const reminder: LocalReminder = {
    id: generateReminderId(),
    title: params.title.trim(),
    body: (params.body ?? '').trim(),
    time: params.time,
    days: rType === 'recurring' ? params.days : [],
    enabled: true,
    dhikrId: params.dhikrId ?? null,
    type: rType,
    date: rType === 'once' ? (params.date ?? null) : null,
    createdAt: now,
    updatedAt: now,
  };

  saveReminder(reminder);
  const res = await scheduleReminder(reminder, params.notifEnabled ?? true);
  const statusObj = { success: res.success, error: res.error };
  return { reminder, schedule: statusObj, scheduleResult: statusObj };
}

export async function updateReminder(
  id: string,
  patch: Partial<Omit<LocalReminder, 'id' | 'createdAt'>>,
  notifEnabled = true
): Promise<{ reminder: LocalReminder | null; schedule: { success: boolean; error?: string }; scheduleResult: { success: boolean; error?: string } }> {
  const all = loadReminders();
  const existing = all.find((r) => r.id === id);
  if (!existing) {
    const errObj = { success: false, error: 'یادآوری یافت نشد' };
    return { reminder: null, schedule: errObj, scheduleResult: errObj };
  }

  const updated: LocalReminder = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  saveReminder(updated);
  const res = await scheduleReminder(updated, notifEnabled);
  const statusObj = { success: res.success, error: res.error };
  return { reminder: updated, schedule: statusObj, scheduleResult: statusObj };
}

export async function toggleReminder(
  id: string,
  notifEnabled = true
): Promise<{ reminder: LocalReminder | null; schedule: { success: boolean; error?: string }; scheduleResult: { success: boolean; error?: string } }> {
  const all = loadReminders();
  const existing = all.find((r) => r.id === id);
  if (!existing) {
    const errObj = { success: false, error: 'یادآوری یافت نشد' };
    return { reminder: null, schedule: errObj, scheduleResult: errObj };
  }
  return updateReminder(id, { enabled: !existing.enabled }, notifEnabled);
}

export async function deleteReminder(id: string): Promise<void> {
  await cancelReminder(id);
  deleteReminderFromStorage(id);
}
