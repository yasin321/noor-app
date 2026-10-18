import { LocalNotifications } from '@capacitor/local-notifications';
import {
  LocalReminder,
  loadReminders,
  saveReminder,
  deleteReminderFromStorage,
  generateReminderId,
} from '@/lib/reminderStorage';

export { loadReminders } from '@/lib/reminderStorage';
import { getDhikr } from '@/lib/dhikrLibrary';

export type PermissionState = 'granted' | 'denied' | 'prompt' | 'unknown';

export type ScheduleResult = {
  success: boolean;
  error?: string;
  scheduledIds?: number[];
};

const ROLLING_HORIZON_DAYS = 14;

const DAY_NAMES_FA = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];

function ourDayToJsDay(ourDay: number): number {
  return (ourDay + 6) % 7;
}

function jsDayToOurDay(jsDay: number): number {
  return (jsDay + 1) % 7;
}

export function getDayLabel(ourDay: number): string {
  return DAY_NAMES_FA[ourDay] ?? '';
}

export { jsDayToOurDay, ourDayToJsDay };

export function getNextOccurrence(
  time: string,
  days: number[],
  fromNow: Date = new Date(),
  horizonDays: number = ROLLING_HORIZON_DAYS,
): Date | null {
  const [h, m] = time.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;

  for (let i = 0; i <= horizonDays; i++) {
    const candidate = new Date(fromNow.getFullYear(), fromNow.getMonth(), fromNow.getDate() + i, h, m, 0, 0);
    const jsDay = candidate.getDay();
    const ourDay = jsDayToOurDay(jsDay);
    const dayMatches = days.length === 0 || days.includes(ourDay);
    if (dayMatches && candidate.getTime() > fromNow.getTime()) {
      return candidate;
    }
  }
  return null;
}

export function getUpcomingOccurrences(
  time: string,
  days: number[],
  fromNow: Date = new Date(),
  horizonDays: number = ROLLING_HORIZON_DAYS,
): Date[] {
  const result: Date[] = [];
  const [h, m] = time.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return result;

  for (let i = 0; i <= horizonDays; i++) {
    const candidate = new Date(fromNow.getFullYear(), fromNow.getMonth(), fromNow.getDate() + i, h, m, 0, 0);
    const jsDay = candidate.getDay();
    const ourDay = jsDayToOurDay(jsDay);
    const dayMatches = days.length === 0 || days.includes(ourDay);
    if (dayMatches && candidate.getTime() > fromNow.getTime()) {
      result.push(candidate);
    }
  }
  return result;
}

export function parseDateTime(dateStr: string, time: string): Date | null {
  const [h, m] = time.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  const [y, mo, d] = dateStr.split('-').map(Number);
  if (isNaN(y) || isNaN(mo) || isNaN(d)) return null;
  return new Date(y, mo - 1, d, h, m, 0, 0);
}

export function isOneTimePast(date: string | null, time: string, now: Date = new Date()): boolean {
  if (!date) return true;
  const dt = parseDateTime(date, time);
  if (!dt) return true;
  return dt.getTime() <= now.getTime();
}

function reminderOccurrenceId(reminderId: string, occurrenceIndex: number): number {
  let hash = 0;
  const str = `${reminderId}:${occurrenceIndex}`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & 0x7fffffff;
  }
  return (hash % 900000) + 100000;
}

export function getReminderNotificationIds(reminderId: string, count: number = ROLLING_HORIZON_DAYS + 2): number[] {
  const ids: number[] = [];
  for (let i = 0; i < count; i++) {
    ids.push(reminderOccurrenceId(reminderId, i));
  }
  return ids;
}

export async function checkPermission(): Promise<PermissionState> {
  try {
    const { display } = await LocalNotifications.checkPermissions();
    if (display === 'granted') return 'granted';
    if (display === 'denied') return 'denied';
    if (display === 'prompt') return 'prompt';
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

export async function requestPermission(): Promise<PermissionState> {
  try {
    const { display } = await LocalNotifications.requestPermissions();
    if (display === 'granted') return 'granted';
    if (display === 'denied') return 'denied';
    return 'prompt';
  } catch {
    return 'unknown';
  }
}

async function ensureChannel(): Promise<void> {
  try {
    await LocalNotifications.createChannel({
      id: 'noor-reminders',
      name: 'یادآوری‌های نور',
      description: 'یادآوری‌های ذکر و نماز',
      importance: 4,
      visibility: 1,
      sound: undefined,
    });
  } catch {
    // channel may already exist or not supported on web
  }
}

export async function cancelReminder(reminderId: string): Promise<ScheduleResult> {
  const ids = getReminderNotificationIds(reminderId);
  try {
    await LocalNotifications.cancel({ notifications: ids.map((id) => ({ id })) });
    return { success: true, scheduledIds: ids };
  } catch (err) {
    return { success: false, error: `خطا در لغو: ${err}` };
  }
}

export async function scheduleReminder(reminder: LocalReminder, notifEnabled: boolean = true): Promise<ScheduleResult> {
  if (!reminder.enabled) {
    // Clear any previously scheduled occurrences when a reminder is disabled.
    await cancelReminder(reminder.id);
    return { success: true, scheduledIds: [] };
  }

  if (!notifEnabled) {
    await cancelReminder(reminder.id);
    return { success: true, scheduledIds: [] };
  }

  const perm = await checkPermission();
  if (perm !== 'granted') {
    return { success: false, error: 'اجازه اعلان داده نشده است' };
  }

  await ensureChannel();

  const dhikr = reminder.dhikrId ? getDhikr(reminder.dhikrId) : null;
  const body = reminder.body || (dhikr ? dhikr.translation : 'یادآوری ذکر');

  await cancelReminder(reminder.id);

  if (reminder.type === 'once') {
    if (isOneTimePast(reminder.date, reminder.time)) {
      return { success: false, error: 'تاریخ و زمان یادآوری یکباره در گذشته است' };
    }
    const at = parseDateTime(reminder.date ?? '', reminder.time);
    if (!at) {
      return { success: false, error: 'تاریخ یا زمان نامعتبر است' };
    }
    const notifId = reminderOccurrenceId(reminder.id, 0);
    try {
      await LocalNotifications.schedule({
        notifications: [{
          id: notifId,
          title: reminder.title,
          body,
          channelId: 'noor-reminders',
          schedule: { at, allowWhileIdle: true },
          smallIcon: 'ic_stat_icon',
        }],
      });
      return { success: true, scheduledIds: [notifId] };
    } catch (err) {
      return { success: false, error: `خطا در زمان‌بندی: ${err}` };
    }
  }

  const occurrences = getUpcomingOccurrences(reminder.time, reminder.days);
  if (occurrences.length === 0) {
    return { success: false, error: 'هیچ زمان مناسبی برای زمان‌بندی یافت نشد' };
  }

  const scheduledIds: number[] = [];
  const failed: string[] = [];
  for (let i = 0; i < occurrences.length; i++) {
    const notifId = reminderOccurrenceId(reminder.id, i);
    try {
      await LocalNotifications.schedule({
        notifications: [{
          id: notifId,
          title: reminder.title,
          body,
          channelId: 'noor-reminders',
          schedule: { at: occurrences[i], allowWhileIdle: true },
          smallIcon: 'ic_stat_icon',
        }],
      });
      scheduledIds.push(notifId);
    } catch (err) {
      failed.push(`${occurrences[i].toISOString()}: ${err}`);
    }
  }

  if (scheduledIds.length === 0) {
    return { success: false, error: `خطا در زمان‌بندی همه موارد: ${failed.join('; ')}` };
  }
  return { success: true, scheduledIds };
}

export async function createReminder(params: {
  title: string;
  time: string;
  days: number[];
  dhikrId: string | null;
  body?: string;
  type: 'recurring' | 'once';
  date?: string | null;
  notifEnabled?: boolean;
}): Promise<{ reminder: LocalReminder; schedule: ScheduleResult }> {
  const id = generateReminderId();
  const now = new Date().toISOString();

  if (params.type === 'once') {
    if (isOneTimePast(params.date ?? null, params.time)) {
      return {
        reminder: {
          id, title: params.title, body: params.body ?? '', time: params.time,
          days: [], enabled: false, dhikrId: params.dhikrId,
          type: 'once', date: params.date ?? null,
          createdAt: now, updatedAt: now,
        },
        schedule: { success: false, error: 'تاریخ و زمان در گذشته است' },
      };
    }
  }

  const reminder: LocalReminder = {
    id,
    title: params.title,
    body: params.body ?? '',
    time: params.time,
    days: params.type === 'once' ? [] : params.days,
    enabled: true,
    dhikrId: params.dhikrId,
    type: params.type,
    date: params.type === 'once' ? (params.date ?? null) : null,
    createdAt: now,
    updatedAt: now,
  };

  saveReminder(reminder);
  const notifEnabled = params.notifEnabled ?? true;
  const schedule = await scheduleReminder(reminder, notifEnabled);

  if (!schedule.success) {
    reminder.enabled = false;
    reminder.updatedAt = new Date().toISOString();
    saveReminder(reminder);
  }

  return { reminder, schedule };
}

export async function updateReminder(
  id: string,
  updates: Partial<Pick<LocalReminder, 'title' | 'time' | 'days' | 'dhikrId' | 'body' | 'enabled' | 'type' | 'date'>>,
  notifEnabled: boolean = true,
): Promise<{ reminder: LocalReminder | null; schedule: ScheduleResult }> {
  const all = loadReminders();
  const existing = all.find((r) => r.id === id);
  if (!existing) return { reminder: null, schedule: { success: false, error: 'یادآوری یافت نشد' } };

  const updated: LocalReminder = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveReminder(updated);

  await cancelReminder(id);
  const schedule = await scheduleReminder(updated, notifEnabled);

  if (!schedule.success && updates.enabled !== false) {
    updated.enabled = false;
    updated.updatedAt = new Date().toISOString();
    saveReminder(updated);
  }

  return { reminder: updated, schedule };
}

export async function toggleReminder(id: string, notifEnabled: boolean = true): Promise<{ reminder: LocalReminder | null; schedule: ScheduleResult }> {
  const all = loadReminders();
  const existing = all.find((r) => r.id === id);
  if (!existing) return { reminder: null, schedule: { success: false, error: 'یادآوری یافت نشد' } };

  if (existing.enabled) {
    await cancelReminder(id);
    return updateReminder(id, { enabled: false }, notifEnabled);
  } else {
    return updateReminder(id, { enabled: true }, notifEnabled);
  }
}

export async function deleteReminder(id: string): Promise<ScheduleResult> {
  const schedule = await cancelReminder(id);
  deleteReminderFromStorage(id);
  return schedule;
}

export async function rescheduleAll(notifEnabled: boolean = true): Promise<{ total: number; succeeded: number; failed: number }> {
  const all = loadReminders();
  let succeeded = 0;
  let failed = 0;

  for (const reminder of all) {
    if (!reminder.enabled) continue;
    const result = await scheduleReminder(reminder, notifEnabled);
    if (result.success) succeeded++;
    else failed++;
  }

  return { total: all.length, succeeded, failed };
}

export async function getPendingNotifications(): Promise<number[]> {
  try {
    const { notifications } = await LocalNotifications.getPending();
    return notifications.map((n) => n.id);
  } catch {
    return [];
  }
}

export async function cancelAllScheduledNotifications(): Promise<void> {
  const all = loadReminders();
  for (const r of all) {
    await cancelReminder(r.id);
  }
}

export async function rescheduleAllReminders(notifEnabled: boolean = true): Promise<void> {
  await rescheduleAll(notifEnabled);
}

export type { LocalReminder };
export { DAY_NAMES_FA, ROLLING_HORIZON_DAYS };
