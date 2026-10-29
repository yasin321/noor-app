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

function resolvePrayerAlarmParams(reminderId: string): {
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
  if (!Capacitor.isNativePlatform() || channelReady) return;
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
  } catch (err) {
    console.warn('[ReminderService] createChannel failed:', err);
  }
}

export type PermissionStatus = 'granted' | 'denied' | 'prompt';

export async function checkPermission(): Promise<PermissionStatus> {
  if (!Capacitor.isNativePlatform()) {
    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'granted') return 'granted';
      if (Notification.permission === 'denied') return 'denied';
    }
    return 'prompt';
  }
  try {
    const { display } = await LocalNotifications.checkPermissions();
    if (display === 'granted') return 'granted';
    if (display === 'denied') return 'denied';
    return 'prompt';
  } catch {
    return 'denied';
  }
}

export async function requestPermission(): Promise<PermissionStatus> {
  if (!Capacitor.isNativePlatform()) {
    if (typeof Notification !== 'undefined') {
      const res = await Notification.requestPermission();
      return res === 'granted' ? 'granted' : res === 'denied' ? 'denied' : 'prompt';
    }
    return 'denied';
  }
  try {
    const { display } = await LocalNotifications.requestPermissions();
    if (display === 'granted') return 'granted';
    if (display === 'denied') return 'denied';
    return 'prompt';
  } catch {
    return 'denied';
  }
}

export function buildNotificationBody(reminder: LocalReminder): string {
  if (reminder.body.trim()) return reminder.body.trim();
  if (reminder.dhikrId) {
    const d = dhikrLibrary.find((x) => x.id === reminder.dhikrId);
    if (d) return `${d.arabic} — ${d.meaningFa} (${d.count} بار)`;
  }
  return 'وقت یادآوری ذکر و نیایش است';
}

export function computeNextOccurrences(
  timeStr: string,
  days: number[],
  horizonDays = 14
): Date[] {
  const [hour, minute] = timeStr.split(':').map(Number);
  if (isNaN(hour) || isNaN(minute)) return [];

  const now = new Date();
  const results: Date[] = [];

  for (let offset = 0; offset < horizonDays; offset++) {
    const candidate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + offset,
      hour,
      minute,
      0,
      0
    );
    if (candidate <= now) continue;

    if (days.length === 0 || days.includes(candidate.getDay())) {
      results.push(candidate);
    }
  }

  return results;
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
  if (!Capacitor.isNativePlatform()) return;

  const existingIds = scheduledSlotMap.get(reminderId) ?? [];
  const fallbackIds = Array.from({ length: 14 }, (_, i) => reminderIdToNotifId(reminderId, i));
  const allIds = Array.from(new Set([...existingIds, ...fallbackIds]));

  try {
    await LocalNotifications.cancel({
      notifications: allIds.map((id) => ({ id })),
    });
    if (Capacitor.getPlatform() === 'android') {
      for (const id of allIds.slice(0, 14)) {
        try {
          await NoorAlarm.cancelNativeAlarm({ id });
        } catch {
          // ignore
        }
      }
    }
    scheduledSlotMap.delete(reminderId);
  } catch (err) {
    console.warn('[ReminderService] cancel failed:', err);
  }
}

export async function scheduleReminder(
  reminder: LocalReminder,
  globalNotifEnabled = true
): Promise<{ success: boolean; scheduledCount: number; error?: string }> {
  await cancelReminder(reminder.id);

  if (!reminder.enabled || !globalNotifEnabled) {
    return { success: true, scheduledCount: 0 };
  }

  if (!Capacitor.isNativePlatform()) {
    return { success: true, scheduledCount: 1 };
  }

  const perm = await checkPermission();
  if (perm !== 'granted') {
    const requested = await requestPermission();
    if (requested !== 'granted') {
      return {
        success: false,
        scheduledCount: 0,
        error: 'مجوز اعلان داده نشده است. لطفاً از تنظیمات گوشی، اعلان‌های برنامه نور را فعال کنید.',
      };
    }
  }

  if (Capacitor.getPlatform() === 'android') {
    try {
      const { exact_alarm } = await LocalNotifications.checkExactNotificationSetting();
      if (exact_alarm !== 'granted') {
        try {
          await LocalNotifications.changeExactNotificationSetting();
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
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
        error: 'تاریخ و ساعت انتخاب‌شده در گذشته است. لطفاً زمان آینده انتخاب کنید.',
      };
    }

    const notifId = reminderIdToNotifId(reminder.id, 0);
    try {
      if (Capacitor.getPlatform() === 'android') {
        const p = resolvePrayerAlarmParams(reminder.id);
        await NoorAlarm.scheduleNativeAlarm({
          id: notifId,
          triggerAtMillis: target.getTime(),
          title: reminder.title,
          body,
          ...p,
        });
      } else {
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
      }
      scheduledSlotMap.set(reminder.id, [notifId]);
      logEvent('info', 'ReminderService', `آلارم یک‌باره زمان‌بندی شد: ${reminder.title}`, {
        at: target.toISOString(),
      });
      return { success: true, scheduledCount: 1 };
    } catch (err) {
      logEvent('error', 'ReminderService', 'خطا در زمان‌بندی آلارم یک‌باره', { error: String(err) });
      return { success: false, scheduledCount: 0, error: 'خطا در ثبت اعلان در سیستم‌عامل.' };
    }
  }

  const occurrences = computeNextOccurrences(reminder.time, reminder.days, 14);
  if (occurrences.length === 0) {
    return { success: true, scheduledCount: 0 };
  }

  const scheduledIds: number[] = [];
  const notifications = occurrences.map((atDate, idx) => {
    const notifId = reminderIdToNotifId(reminder.id, idx);
    scheduledIds.push(notifId);
    return {
      id: notifId,
      title: reminder.title,
      body,
      channelId: targetChannelId,
      sound: isPrayerAdhan ? 'adhan_mahur' : undefined,
      schedule: { at: atDate, allowWhileIdle: true },
      extra: { reminderId: reminder.id, dhikrId: reminder.dhikrId ?? '' },
    };
  });

  try {
    if (Capacitor.getPlatform() === 'android') {
      for (let i = 0; i < occurrences.length; i++) {
        const notifId = reminderIdToNotifId(reminder.id, i);
        try {
          const p = resolvePrayerAlarmParams(reminder.id);
          await NoorAlarm.scheduleNativeAlarm({
            id: notifId,
            triggerAtMillis: occurrences[i].getTime(),
            title: reminder.title,
            body,
            ...p,
          });
        } catch {
          // ignore
        }
      }
    } else {
      await LocalNotifications.schedule({ notifications });
    }
    scheduledSlotMap.set(reminder.id, scheduledIds);
    logEvent('info', 'ReminderService', `یادآور تکرارشونده زمان‌بندی شد: ${reminder.title}`, {
      count: notifications.length,
      time: reminder.time,
    });
    return { success: true, scheduledCount: notifications.length };
  } catch (err) {
    logEvent('error', 'ReminderService', 'خطا در زمان‌بندی یادآور تکرارشونده', { error: String(err) });
    return { success: false, scheduledCount: 0, error: 'خطا در زمان‌بندی اعلان.' };
  }
}

export async function rescheduleAllReminders(
  globalNotifEnabled = true
): Promise<{ total: number; succeeded: number }> {
  const reminders = loadReminders();
  let succeeded = 0;
  for (const r of reminders) {
    const res = await scheduleReminder(r, globalNotifEnabled);
    if (res.success) succeeded++;
  }
  return { total: reminders.length, succeeded };
}

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

export async function createReminder(params: {
  title: string;
  body?: string;
  time: string;
  days: number[];
  dhikrId?: string | null;
  type: 'once' | 'recurring';
  date?: string | null;
  notifEnabled?: boolean;
}): Promise<{ reminder: LocalReminder; scheduleResult: { success: boolean; error?: string } }> {
  const now = new Date().toISOString();
  const reminder: LocalReminder = {
    id: generateReminderId(),
    title: params.title.trim(),
    body: (params.body ?? '').trim(),
    time: params.time,
    days: params.type === 'recurring' ? params.days : [],
    enabled: true,
    dhikrId: params.dhikrId ?? null,
    type: params.type,
    date: params.type === 'once' ? (params.date ?? null) : null,
    createdAt: now,
    updatedAt: now,
  };

  saveReminder(reminder);
  const res = await scheduleReminder(reminder, params.notifEnabled ?? true);
  return { reminder, scheduleResult: { success: res.success, error: res.error } };
}

export async function updateReminder(
  id: string,
  patch: Partial<Omit<LocalReminder, 'id' | 'createdAt'>>,
  notifEnabled = true
): Promise<{ reminder: LocalReminder | null; scheduleResult: { success: boolean; error?: string } }> {
  const all = loadReminders();
  const existing = all.find((r) => r.id === id);
  if (!existing) {
    return { reminder: null, scheduleResult: { success: false, error: 'یادآوری یافت نشد' } };
  }

  const updated: LocalReminder = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  saveReminder(updated);
  const res = await scheduleReminder(updated, notifEnabled);
  return { reminder: updated, scheduleResult: { success: res.success, error: res.error } };
}

export async function deleteReminder(id: string): Promise<void> {
  await cancelReminder(id);
  deleteReminderFromStorage(id);
}
