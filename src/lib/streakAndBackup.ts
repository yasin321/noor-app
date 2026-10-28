import { getDayCompletionPercent } from '@/lib/reminderStorage';
import { getTodayTotal } from '@/lib/tasbihStorage';
import { loadQuranContinuity, loadMuhasabaEntries } from '@/lib/deenIntelligenceStore';

const STREAK_STORAGE_KEY = 'noor_spiritual_streak_v1';

export interface SpiritualStreakInfo {
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  todayActive: boolean;
  badgeTitle: string;
  badgeIcon: string;
  nextMilestone: number;
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getBadgeForStreak(days: number): { title: string; icon: string; next: number } {
  if (days >= 40) return { title: 'چله‌نشین نورانی', icon: '👑', next: 100 };
  if (days >= 14) return { title: 'یار دیرین سحر', icon: '🌟', next: 40 };
  if (days >= 7) return { title: 'ذاکر باوفا', icon: '🔥', next: 14 };
  if (days >= 3) return { title: 'همراه بااراده', icon: '🌱', next: 7 };
  return { title: 'رهجوی آغازین', icon: '✨', next: 3 };
}

export function evaluateAndGetStreak(userId?: string | null): SpiritualStreakInfo {
  const now = new Date();
  const todayStr = toIsoDate(now);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = toIsoDate(yesterday);

  // بررسی فعالیت امروز کاربر در هر یک از بخش‌های معنوی
  const reminderPct = getDayCompletionPercent(now);
  const tasbihToday = getTodayTotal(userId);
  const quranState = loadQuranContinuity();
  const muhasabaList = loadMuhasabaEntries();

  const quranToday = quranState.lastReadIso ? quranState.lastReadIso.slice(0, 10) === todayStr : false;
  const muhasabaToday = muhasabaList.some((e) => (e.createdAt || '').slice(0, 10) === todayStr);

  const isTodayActive = reminderPct > 0 || tasbihToday > 0 || quranToday || muhasabaToday;

  let stored = { currentStreak: 1, bestStreak: 1, lastActiveDate: todayStr };
  try {
    const raw = localStorage.getItem(STREAK_STORAGE_KEY);
    if (raw) {
      stored = JSON.parse(raw);
    }
  } catch {
    // ignore storage errors
  }

  if (isTodayActive) {
    if (stored.lastActiveDate === yesterdayStr) {
      stored.currentStreak += 1;
      stored.lastActiveDate = todayStr;
    } else if (stored.lastActiveDate !== todayStr) {
      stored.currentStreak = Math.max(1, stored.currentStreak);
      stored.lastActiveDate = todayStr;
    }
  } else {
    if (stored.lastActiveDate !== todayStr && stored.lastActiveDate !== yesterdayStr) {
      stored.currentStreak = 1;
    }
  }

  if (stored.currentStreak > stored.bestStreak) {
    stored.bestStreak = stored.currentStreak;
  }

  try {
    localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // ignore
  }

  const badge = getBadgeForStreak(stored.currentStreak);
  return {
    currentStreak: stored.currentStreak,
    bestStreak: stored.bestStreak,
    lastActiveDate: stored.lastActiveDate,
    todayActive: isTodayActive,
    badgeTitle: badge.title,
    badgeIcon: badge.icon,
    nextMilestone: badge.next,
  };
}

export function exportFullUserBackup(): string {
  const data: Record<string, string | null> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('noor') || key.includes('tasbih') || key.includes('reminder') || key.includes('guest'))) {
      data[key] = localStorage.getItem(key);
    }
  }
  const payload = {
    app: 'Noor Spiritual Assistant',
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    entriesCount: Object.keys(data).length,
    storage: data,
  };
  return JSON.stringify(payload, null, 2);
}

export function triggerBackupDownload(): number {
  const jsonStr = exportFullUserBackup();
  const parsed = JSON.parse(jsonStr);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const datePart = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `noor-backup-${datePart}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
  return parsed.entriesCount || 0;
}

export function importFullUserBackup(jsonText: string): { ok: boolean; restoredKeys: number; error?: string } {
  try {
    const parsed = JSON.parse(jsonText);
    if (!parsed || typeof parsed.storage !== 'object') {
      return { ok: false, restoredKeys: 0, error: 'ساختار فایل پشتیبان معتبر نیست.' };
    }
    let count = 0;
    for (const [k, v] of Object.entries(parsed.storage)) {
      if (typeof k === 'string' && typeof v === 'string') {
        localStorage.setItem(k, v);
        count++;
      }
    }
    return { ok: true, restoredKeys: count };
  } catch {
    return { ok: false, restoredKeys: 0, error: 'خطا در خواندن فایل JSON پشتیبان.' };
  }
}
