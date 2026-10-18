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
};

type ReminderStore = {
  version: number;
  reminders: Record<string, LocalReminder>;
};

const STORAGE_KEY = 'noor_reminders_store';
const SCHEMA_VERSION = 2;

function defaultStore(): ReminderStore {
  return { version: SCHEMA_VERSION, reminders: {} };
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

export { STORAGE_KEY, SCHEMA_VERSION };
