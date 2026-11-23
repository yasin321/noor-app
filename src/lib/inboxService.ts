import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getJalaliParts, jalaliMonths, toFaDigits } from '@/lib/jalali';

export type InboxCategory = 'update' | 'dhikr' | 'audio' | 'occasion' | 'news' | 'tip' | 'birthday';

export interface InboxMessage {
  id: string;
  title_fa: string;
  title_en?: string | null;
  title_es?: string | null;
  body_fa: string;
  body_en?: string | null;
  body_es?: string | null;
  category: InboxCategory;
  priority: 'normal' | 'high';
  show_popup: boolean;
  action_label_fa: string;
  action_label_en?: string | null;
  action_label_es?: string | null;
  action_target: string;
  created_at: string;
}

export function getLocalizedInboxMessage(
  msg: InboxMessage,
  lang: 'fa' | 'en' | 'es' = 'fa'
): { title: string; body: string; actionLabel: string } {
  const title =
    lang === 'en'
      ? (msg.title_en || msg.title_fa)
      : lang === 'es'
      ? (msg.title_es || msg.title_en || msg.title_fa)
      : msg.title_fa;
  const body =
    lang === 'en'
      ? (msg.body_en || msg.body_fa)
      : lang === 'es'
      ? (msg.body_es || msg.body_en || msg.body_fa)
      : msg.body_fa;
  const actionLabel =
    lang === 'en'
      ? (msg.action_label_en || msg.action_label_fa)
      : lang === 'es'
      ? (msg.action_label_es || msg.action_label_en || msg.action_label_fa)
      : msg.action_label_fa;
  return { title, body, actionLabel };
}

export interface UserBirthday {
  month: number;
  day: number;
  year?: number | null;
  calendar?: 'jalali' | 'gregorian';
}

const INBOX_CACHE_KEY = 'noor_inbox_messages_v1';
const INBOX_READ_IDS_KEY = 'noor_inbox_read_ids_v1';
const INBOX_POPPED_IDS_KEY = 'noor_inbox_popped_ids_v1';
const USER_BIRTHDAY_KEY = 'noor_user_birthday_v1';
const BIRTHDAY_CELEBRATED_YEAR_KEY = 'noor_birthday_celebrated_jy_v1';

export const INBOX_UPDATED_EVENT = 'noor-inbox-updated';
export const INBOX_LIVE_POPUP_EVENT = 'noor-inbox-live-popup';

export function getUserBirthday(): UserBirthday | null {
  try {
    const raw = localStorage.getItem(USER_BIRTHDAY_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (
      typeof p?.month === 'number' &&
      typeof p?.day === 'number' &&
      p.month >= 1 &&
      p.month <= 12 &&
      p.day >= 1 &&
      p.day <= 31
    ) {
      return {
        month: p.month,
        day: p.day,
        year: typeof p.year === 'number' ? p.year : null,
        calendar: p.calendar === 'gregorian' ? 'gregorian' : 'jalali',
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveUserBirthday(
  b: UserBirthday | null,
  userId?: string | null
): Promise<void> {
  try {
    if (!b) localStorage.removeItem(USER_BIRTHDAY_KEY);
    else localStorage.setItem(USER_BIRTHDAY_KEY, JSON.stringify(b));
  } catch {}

  if (userId && isSupabaseConfigured && !userId.startsWith('local_')) {
    try {
      await supabase
        .from('profiles')
        .update({
          birth_month: b?.month ?? null,
          birth_day: b?.day ?? null,
          birth_year: b?.year ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    } catch {}
  }
  window.dispatchEvent(new Event(INBOX_UPDATED_EVENT));
}

export function formatBirthdayFa(b: UserBirthday | null): string {
  if (!b) return 'تنظیم نشده';
  const mName = jalaliMonths[b.month - 1] || '';
  const base = toFaDigits(b.day) + ' ' + mName;
  return b.year ? base + ' ' + toFaDigits(b.year) : base;
}

export function isTodayUserBirthday(
  now = new Date()
): { isBirthday: boolean; jy: number; birthday: UserBirthday | null } {
  const b = getUserBirthday();
  const { jy, jm, jd } = getJalaliParts(now);
  if (!b) return { isBirthday: false, jy, birthday: null };
  if (b.calendar === 'gregorian') {
    const gm = now.getMonth() + 1;
    const gd = now.getDate();
    return { isBirthday: b.month === gm && b.day === gd, jy, birthday: b };
  }
  return { isBirthday: b.month === jm && b.day === jd, jy, birthday: b };
}

export function shouldShowBirthdayPopupToday(now = new Date()): boolean {
  const check = isTodayUserBirthday(now);
  if (!check.isBirthday) return false;
  try {
    return Number(localStorage.getItem(BIRTHDAY_CELEBRATED_YEAR_KEY) || 0) !== check.jy;
  } catch {
    return true;
  }
}

export function markBirthdayCelebratedThisYear(now = new Date()): void {
  const { jy } = getJalaliParts(now);
  try {
    localStorage.setItem(BIRTHDAY_CELEBRATED_YEAR_KEY, String(jy));
  } catch {}
}

export function getReadMessageIds(): string[] {
  try {
    const raw = localStorage.getItem(INBOX_READ_IDS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function markMessageRead(id: string): void {
  const cur = getReadMessageIds();
  if (!cur.includes(id)) {
    try {
      localStorage.setItem(INBOX_READ_IDS_KEY, JSON.stringify([...cur, id].slice(-200)));
    } catch {}
    window.dispatchEvent(new Event(INBOX_UPDATED_EVENT));
  }
}

export function markAllMessagesRead(ids: string[]): void {
  const merged = Array.from(new Set([...getReadMessageIds(), ...ids])).slice(-200);
  try {
    localStorage.setItem(INBOX_READ_IDS_KEY, JSON.stringify(merged));
  } catch {}
  window.dispatchEvent(new Event(INBOX_UPDATED_EVENT));
}

function getPoppedMessageIds(): string[] {
  try {
    const raw = localStorage.getItem(INBOX_POPPED_IDS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function markMessagePopped(id: string): void {
  const cur = getPoppedMessageIds();
  if (!cur.includes(id)) {
    try {
      localStorage.setItem(INBOX_POPPED_IDS_KEY, JSON.stringify([...cur, id].slice(-200)));
    } catch {}
  }
}

function buildBirthdayInboxMessage(displayName?: string | null): InboxMessage | null {
  const check = isTodayUserBirthday(new Date());
  if (!check.isBirthday) return null;
  const name = displayName?.trim() || 'همراه عزیز نور';
  return {
    id: 'birthday_' + check.jy,
    title_fa: '🎂 تولدت مبارک ' + name + ' جان!',
    body_fa:
      'آغاز سال جدید عمرت سرشار از نور، عافیت، آرامش دل و برکت الهی باد. همراه معنوی نور برای تو بهترین‌ها را آرزو دارد.',
    category: 'birthday',
    priority: 'high',
    show_popup: true,
    action_label_fa: '',
    action_target: '',
    created_at: new Date().toISOString(),
  };
}

export function getCachedInboxMessages(displayName?: string | null): InboxMessage[] {
  let list: InboxMessage[] = [];
  try {
    const raw = localStorage.getItem(INBOX_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed as InboxMessage[];
    }
  } catch {}

  const bMsg = buildBirthdayInboxMessage(displayName);
  if (bMsg && !list.some((m) => m.id === bMsg.id)) {
    return [bMsg, ...list];
  }
  return list;
}

export function getUnreadInboxCount(displayName?: string | null): number {
  const msgs = getCachedInboxMessages(displayName);
  const readSet = new Set(getReadMessageIds());
  return msgs.filter((m) => !readSet.has(m.id)).length;
}

function saveInboxCache(messages: InboxMessage[]): void {
  try {
    localStorage.setItem(INBOX_CACHE_KEY, JSON.stringify(messages.slice(0, 60)));
  } catch {}
  window.dispatchEvent(new Event(INBOX_UPDATED_EVENT));
}

async function showLocalSystemNotifIfNative(msg: InboxMessage): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') return;
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 75000 + Math.floor(Math.random() * 900),
          title: msg.title_fa,
          body: msg.body_fa,
          schedule: { at: new Date(Date.now() + 600) },
        },
      ],
    });
  } catch {}
}

export async function fetchInboxMessages(displayName?: string | null): Promise<{
  messages: InboxMessage[];
  pendingPopup: InboxMessage | null;
}> {
  const cached = getCachedInboxMessages(displayName);
  if (!isSupabaseConfigured) {
    return { messages: cached, pendingPopup: null };
  }

  try {
    const { data, error } = await supabase
      .from('app_notifications')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(40);

    if (error || !Array.isArray(data)) {
      return { messages: cached, pendingPopup: null };
    }

    const list = data as InboxMessage[];
    saveInboxCache(list);

    const readSet = new Set(getReadMessageIds());
    const poppedSet = new Set(getPoppedMessageIds());
    const pendingPopup =
      list.find((m) => m.show_popup && !readSet.has(m.id) && !poppedSet.has(m.id)) ?? null;

    return { messages: getCachedInboxMessages(displayName), pendingPopup };
  } catch {
    return { messages: cached, pendingPopup: null };
  }
}

export function subscribeLiveInbox(onLiveMessage: (msg: InboxMessage) => void): () => void {
  if (!isSupabaseConfigured) return () => {};

  const channel = supabase
    .channel('noor-inbox-live')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'app_notifications' },
      (payload) => {
        const rec = payload.new as InboxMessage | undefined;
        if (!rec || !rec.id || !rec.title_fa) return;
        const current = getCachedInboxMessages().filter((m) => !m.id.startsWith('birthday_'));
        if (!current.some((m) => m.id === rec.id)) {
          saveInboxCache([rec, ...current]);
        }
        void showLocalSystemNotifIfNative(rec);
        onLiveMessage(rec);
        window.dispatchEvent(new CustomEvent(INBOX_LIVE_POPUP_EVENT, { detail: rec }));
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
