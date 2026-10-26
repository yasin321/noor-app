import { supabase } from '@/lib/supabase';

export type TasbihSession = {
  dhikrId: string;
  count: number;
  target: number;
  completed: number;
};

export type TasbihRecord = {
  id: string;
  dhikrId: string;
  count: number;
  completed: number;
  date: string;
  createdAt: string;
};

const GUEST_STORE_KEY = 'noor_tasbih_store';
const GUEST_SESSION_KEY = 'noor_tasbih_session';

type GuestStore = {
  records: TasbihRecord[];
};

function loadGuestStore(): GuestStore {
  try {
    const raw = localStorage.getItem(GUEST_STORE_KEY);
    if (!raw) return { records: [] };
    return JSON.parse(raw);
  } catch {
    return { records: [] };
  }
}

function saveGuestStore(store: GuestStore): void {
  try {
    localStorage.setItem(GUEST_STORE_KEY, JSON.stringify(store));
  } catch {
    // storage unavailable
  }
}

function getLocalDateString(date: Date = new Date()): string {
  const d = date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const DEFAULT_SESSION: TasbihSession = { dhikrId: '', count: 0, target: 33, completed: 0 };

function nonNegativeInteger(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : fallback;
}

export function getSession(): TasbihSession {
  try {
    const raw = localStorage.getItem(GUEST_SESSION_KEY);
    if (!raw) return { ...DEFAULT_SESSION };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_SESSION };
    const s = parsed as Partial<TasbihSession>;
    const target = typeof s.target === 'number' && Number.isSafeInteger(s.target) && s.target > 0 && s.target <= 100000
      ? s.target
      : DEFAULT_SESSION.target;
    const count = Math.min(nonNegativeInteger(s.count, 0), target - 1);
    return {
      dhikrId: typeof s.dhikrId === 'string' ? s.dhikrId : '',
      count,
      target,
      completed: nonNegativeInteger(s.completed, 0),
    };
  } catch {
    return { ...DEFAULT_SESSION };
  }
}

export function saveSession(session: TasbihSession): void {
  try {
    localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));
  } catch {
    // storage unavailable
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(GUEST_SESSION_KEY);
  } catch {
    // ignore
  }
}

export function startSession(dhikrId: string, target: number): void {
  const safeTarget = Number.isSafeInteger(target) && target > 0 && target <= 100000 ? target : DEFAULT_SESSION.target;
  saveSession({ dhikrId: typeof dhikrId === 'string' ? dhikrId : '', count: 0, target: safeTarget, completed: 0 });
}

export function incrementCount(userId?: string | null): { count: number; completed: number; reachedTarget: boolean } {
  const session = getSession();
  if (!session.dhikrId) {
    return { count: session.count, completed: session.completed, reachedTarget: false };
  }
  let newCount = session.count + 1;
  let newCompleted = session.completed;
  let reachedTarget = false;

  if (newCount >= session.target) {
    newCount = 0;
    newCompleted += 1;
    reachedTarget = true;
    saveRecord(session.dhikrId, session.target, 1, userId);
  }

  saveSession({ ...session, count: newCount, completed: newCompleted });
  return { count: newCount, completed: newCompleted, reachedTarget };
}

export function resetSession(): void {
  const session = getSession();
  saveSession({ ...session, count: 0 });
}

export function saveRecord(dhikrId: string, count: number, completed: number, userId?: string | null): void {
  const date = getLocalDateString();
  const now = new Date().toISOString();

  if (userId) {
    supabase.from('tasbih_counts')
      .insert({ dhikr_id: dhikrId, count, completed, date, user_id: userId })
      .then(({ error }) => {
        if (error) {
          saveGuestRecord(dhikrId, count, completed, date, now);
        }
      });
  } else {
    saveGuestRecord(dhikrId, count, completed, date, now);
  }
}

function saveGuestRecord(dhikrId: string, count: number, completed: number, date: string, createdAt: string): void {
  const store = loadGuestStore();
  store.records.push({
    id: `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    dhikrId,
    count,
    completed,
    date,
    createdAt,
  });
  if (store.records.length > 1000) store.records = store.records.slice(-1000);
  saveGuestStore(store);
}

export function getTodayTotal(userId?: string | null): number {
  const today = getLocalDateString();
  if (userId) {
    return 0;
  }
  const store = loadGuestStore();
  return store.records
    .filter((r) => r.date === today)
    .reduce((sum, r) => sum + r.count * r.completed, 0);
}

export function getTodayRounds(userId?: string | null): number {
  const today = getLocalDateString();
  if (userId) {
    return 0;
  }
  const store = loadGuestStore();
  return store.records
    .filter((r) => r.date === today)
    .reduce((sum, r) => sum + r.completed, 0);
}

export async function fetchTodayStats(userId: string): Promise<{ total: number; rounds: number }> {
  const today = getLocalDateString();
  const { data, error } = await supabase
    .from('tasbih_counts')
    .select('count, completed')
    .eq('user_id', userId)
    .eq('date', today);

  if (error || !data) return { total: 0, rounds: 0 };
  const total = data.reduce((sum, r) => sum + r.count * r.completed, 0);
  const rounds = data.reduce((sum, r) => sum + r.completed, 0);
  return { total, rounds };
}


export type PeriodRange = 7 | 30 | 90 | 365;

export function getSpiritualDashboardStats(days: PeriodRange = 30): {
  totalCount: number;
  totalRounds: number;
  activeDays: number;
  streakDays: number;
  topDhikrId: string | null;
  levelTitle: string;
} {
  const store = loadGuestStore();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = getLocalDateString(cutoff);

  const filtered = store.records.filter((r) => r.date >= cutoffStr);
  const totalCount = filtered.reduce((sum, r) => sum + r.count * r.completed, 0);
  const totalRounds = filtered.reduce((sum, r) => sum + r.completed, 0);
  const uniqueDates = new Set(filtered.map((r) => r.date));

  const byDhikr: Record<string, number> = {};
  for (const r of filtered) {
    byDhikr[r.dhikrId] = (byDhikr[r.dhikrId] ?? 0) + r.count * r.completed;
  }
  let topDhikrId: string | null = null;
  let maxVal = 0;
  for (const [id, val] of Object.entries(byDhikr)) {
    if (val > maxVal) {
      maxVal = val;
      topDhikrId = id;
    }
  }

  let streakDays = 0;
  const cursor = new Date();
  for (let i = 0; i < 365; i++) {
    const dStr = getLocalDateString(cursor);
    if (store.records.some((r) => r.date === dStr)) {
      streakDays++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (i === 0) {
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  const allTimeCount = store.records.reduce((s, r) => s + r.count * r.completed, 0);
  let levelTitle = "رهجوی آغازگر 🌱";
  if (allTimeCount >= 10000) levelTitle = "سفره‌دار نور و ذکر 👑";
  else if (allTimeCount >= 3000) levelTitle = "ذاکر مداوم 💎";
  else if (allTimeCount >= 500) levelTitle = "همراه روشنایی ✨";

  return {
    totalCount,
    totalRounds,
    activeDays: uniqueDates.size,
    streakDays,
    topDhikrId,
    levelTitle,
  };
}
