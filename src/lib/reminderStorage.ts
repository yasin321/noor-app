export type ReminderType = 'recurring' | 'once';

export type LocalReminder = {
  id: string;
  title: string;
  body: string;
  time: string;
  days: number[];
  enabled: boolean;
  dhikrId: string | null;
  type: ReminderType;
  date: string | null;
  createdAt: string;
  updatedAt: string;
  durationDays?: number | null;
  intervalDays?: number | null;
  categoryTag?: 'prayer' | 'quran' | 'charity' | 'parents' | 'chilla' | 'general';
};

type ReminderStore = {
  version: number;
  reminders: Record<string, LocalReminder>;
};

const STORAGE_KEY = 'noor_reminders_store';
const COMPLETION_LOG_KEY = 'noor_reminders_completion_log_v1';
const SCHEMA_VERSION = 2;

function defaultStore(): ReminderStore {
  return { version: SCHEMA_VERSION, reminders: {} };
}

function getLocalDateKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function migrate(raw: unknown): ReminderStore {
  if (!raw || typeof raw !== 'object') return defaultStore();
  const obj = raw as Partial<ReminderStore> & { reminders?: Record<string, Record<string, unknown>> };

  if (!obj.version || obj.version < 1) return defaultStore();
  if (!obj.reminders || typeof obj.reminders !== 'object') return defaultStore();

  const reminders: Record<string, LocalReminder> = {};
  for (const [id, r] of Object.entries(obj.reminders)) {
    if (!r || typeof r.title !== 'string' || typeof r.time !== 'string' ||
        !Array.isArray(r.days) || typeof r.enabled !== 'boolean') {
      continue;
    }
    const type = (r.type === 'once' || r.type === 'recurring')
      ? (r.type as ReminderType)
      : 'recurring';
    const date = typeof r.date === 'string' ? r.date : null;
    reminders[id] = {
      id,
      title: r.title,
      body: typeof r.body === 'string' ? r.body : '',
      time: r.time,
      days: r.days as number[],
      enabled: r.enabled,
      dhikrId: typeof r.dhikrId === 'string' ? r.dhikrId : null,
      type,
      date,
      createdAt: typeof r.createdAt === 'string' ? r.createdAt : new Date().toISOString(),
      updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : new Date().toISOString(),
      durationDays: typeof r.durationDays === 'number' ? r.durationDays : null,
      intervalDays: typeof r.intervalDays === 'number' ? r.intervalDays : null,
      categoryTag: typeof r.categoryTag === 'string' ? (r.categoryTag as LocalReminder['categoryTag']) : 'general',
    };
  }
  return { version: SCHEMA_VERSION, reminders };
}

export function loadReminders(): LocalReminder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const store = migrate(JSON.parse(raw));
    return Object.values(store.reminders).sort((a, b) => a.time.localeCompare(b.time));
  } catch {
    return [];
  }
}

export function loadReminder(id: string): LocalReminder | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const store = migrate(JSON.parse(raw));
    return store.reminders[id] ?? null;
  } catch {
    return null;
  }
}

function saveReminders(reminders: Record<string, LocalReminder>): void {
  try {
    const store: ReminderStore = { version: SCHEMA_VERSION, reminders };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // storage full or unavailable
  }
}

export function saveReminder(reminder: LocalReminder): void {
  const all = loadReminders();
  const map: Record<string, LocalReminder> = {};
  for (const r of all) map[r.id] = r;
  map[reminder.id] = reminder;
  saveReminders(map);
}

export function deleteReminderFromStorage(id: string): void {
  const all = loadReminders();
  const map: Record<string, LocalReminder> = {};
  for (const r of all) if (r.id !== id) map[r.id] = r;
  saveReminders(map);
}

export function clearAllReminders(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function generateReminderId(): string {
  return `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// سیستم ثبت و گزارش Planned vs. Actual (تیک زدن انجام کارهای برنامه‌ریزی‌شده)
type CompletionLogMap = Record<string, string[]>; // dateKey -> array of reminderIds completed that day

function loadCompletionLog(): CompletionLogMap {
  try {
    const raw = localStorage.getItem(COMPLETION_LOG_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as CompletionLogMap) : {};
  } catch {
    return {};
  }
}

function saveCompletionLog(log: CompletionLogMap): void {
  try {
    localStorage.setItem(COMPLETION_LOG_KEY, JSON.stringify(log));
  } catch {
    // ignore
  }
}

export function isReminderCompletedOnDate(reminderId: string, date: Date = new Date()): boolean {
  const key = getLocalDateKey(date);
  const log = loadCompletionLog();
  return Boolean(log[key]?.includes(reminderId));
}

export function toggleReminderCompletionOnDate(reminderId: string, date: Date = new Date()): boolean {
  const key = getLocalDateKey(date);
  const log = loadCompletionLog();
  const list = new Set(log[key] ?? []);
  let nextState = false;
  if (list.has(reminderId)) {
    list.delete(reminderId);
    nextState = false;
  } else {
    list.add(reminderId);
    nextState = true;
  }
  log[key] = Array.from(list);
  saveCompletionLog(log);
  return nextState;
}

export function getReminderTotalCompletedDays(reminderId: string): number {
  const log = loadCompletionLog();
  let count = 0;
  for (const ids of Object.values(log)) {
    if (Array.isArray(ids) && ids.includes(reminderId)) count++;
  }
  return count;
}

export function getPlannedVsActualStats(days: number = 30): {
  todayPlanned: number;
  todayCompleted: number;
  todayPercent: number;
  periodCompletedTotal: number;
} {
  const all = loadReminders().filter((r) => r.enabled);
  const today = new Date();
  const ourDay = (today.getDay() + 1) % 7;

  const todayReminders = all.filter((r) => {
    if (r.type === 'once') {
      return r.date === getLocalDateKey(today);
    }
    return r.days.length === 0 || r.days.includes(ourDay);
  });

  const todayPlanned = todayReminders.length;
  const todayCompleted = todayReminders.filter((r) => isReminderCompletedOnDate(r.id, today)).length;
  const todayPercent = todayPlanned > 0 ? Math.round((todayCompleted / todayPlanned) * 100) : 0;

  const log = loadCompletionLog();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffKey = getLocalDateKey(cutoff);

  let periodCompletedTotal = 0;
  for (const [dateKey, ids] of Object.entries(log)) {
    if (dateKey >= cutoffKey && Array.isArray(ids)) {
      periodCompletedTotal += ids.length;
    }
  }

  return {
    todayPlanned,
    todayCompleted,
    todayPercent,
    periodCompletedTotal,
  };
}

export { STORAGE_KEY, SCHEMA_VERSION };

export function getDayCompletionPercent(date: Date): number {
  const all = loadReminders().filter((r) => r.enabled);
  const ourDay = (date.getDay() + 1) % 7;
  const dateKey = getLocalDateKey(date);
  const planned = all.filter((r) => r.type === "once" ? r.date === dateKey : (r.days.length === 0 || r.days.includes(ourDay)));
  if (planned.length === 0) return 0;
  const done = planned.filter((r) => isReminderCompletedOnDate(r.id, date)).length;
  return Math.round((done / planned.length) * 100);
}

export function reminderIdToNotifId(id: string, slotIndex = 0): number {
  let hash = 0;
  const key = `${id}#${slotIndex}`;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return (Math.abs(hash) % 900000) + 100000;
}
