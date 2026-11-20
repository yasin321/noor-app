import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface LocalPhoneAccount {
  id: string;
  phone: string;
  displayName: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocalAuthSession {
  userId: string;
  phone: string;
  displayName: string;
  loggedInAt: string;
}

const ACCOUNTS_KEY = 'noor_phone_accounts_v1';
const SESSION_KEY = 'noor_phone_session_v1';

export function toEnglishDigits(input: string): string {
  return String(input || '')
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
}

export function normalizeIranPhone(raw: string): string {
  let digits = toEnglishDigits(raw).replace(/[^0-9]/g, '');
  if (digits.startsWith('0098')) digits = '0' + digits.slice(4);
  else if (digits.startsWith('98') && digits.length >= 12) digits = '0' + digits.slice(2);
  else if (digits.startsWith('9') && digits.length === 10) digits = '0' + digits;
  return digits.slice(0, 11);
}

export function isValidIranPhone(raw: string): boolean {
  return /^09[0-9]{9}$/.test(normalizeIranPhone(raw));
}

export function formatIranPhoneDisplay(raw: string): string {
  const n = normalizeIranPhone(raw);
  if (n.length <= 4) return n;
  if (n.length <= 7) return n.slice(0, 4) + ' ' + n.slice(4);
  return n.slice(0, 4) + ' ' + n.slice(4, 7) + ' ' + n.slice(7);
}

export function phoneToSyntheticEmail(rawPhone: string): string {
  const n = normalizeIranPhone(rawPhone);
  return '98' + n.slice(1) + '@phone.noor.app';
}

export function evaluatePasswordStrength(password: string): {
  score: 0 | 1 | 2 | 3;
  label: string;
  color: string;
} {
  if (!password) return { score: 0, label: '', color: 'transparent' };
  let pts = 0;
  if (password.length >= 6) pts += 1;
  if (password.length >= 8 && /[0-9]/.test(password)) pts += 1;
  if (/[a-zA-Z]/.test(password) && /[^a-zA-Z0-9 \t\n\r]/.test(password)) pts += 1;
  else if (password.length >= 10 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password)) pts += 1;

  if (pts <= 1) return { score: 1, label: 'ضعیف (حداقل ۶ کاراکتر و ترجیحاً عدد و حرف)', color: '#f87171' };
  if (pts === 2) return { score: 2, label: 'متوسط و قابل قبول', color: '#fbbf24' };
  return { score: 3, label: 'قوی و ایمن', color: '#34d399' };
}

async function hashPasswordSafe(password: string, phone: string): Promise<string> {
  const salted = 'noor_v1:' + phone + ':' + password;
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const buf = new TextEncoder().encode(salted);
      const digest = await crypto.subtle.digest('SHA-256', buf);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {}
  let h = 2166136261;
  for (let i = 0; i < salted.length; i++) {
    h ^= salted.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return 'fnv_' + (h >>> 0).toString(16);
}

function loadLocalAccounts(): LocalPhoneAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalAccounts(list: LocalPhoneAccount[]): void {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list));
  } catch {}
}

export function getLocalAuthSession(): LocalAuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.userId === 'string' && typeof parsed.phone === 'string') {
      return parsed as LocalAuthSession;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearLocalAuthSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {}
}

export async function localSignUpWithPhone(
  rawPhone: string,
  password: string,
  displayName: string
): Promise<{ session: LocalAuthSession | null; error: string | null }> {
  const phone = normalizeIranPhone(rawPhone);
  if (!isValidIranPhone(phone)) {
    return { session: null, error: 'شماره موبایل معتبر نیست (مثال: 09123456789)' };
  }
  if (!password || password.length < 6) {
    return { session: null, error: 'رمز عبور باید حداقل ۶ کاراکتر باشد' };
  }
  const cleanName = displayName.trim() || 'کاربر نور';
  const accounts = loadLocalAccounts();
  if (accounts.some((a) => a.phone === phone)) {
    return { session: null, error: 'این شماره موبایل قبلاً ثبت شده است؛ از تب «ورود» وارد شوید.' };
  }

  const nowIso = new Date().toISOString();
  const passwordHash = await hashPasswordSafe(password, phone);
  const newAcc: LocalPhoneAccount = {
    id: 'local_' + phone,
    phone,
    displayName: cleanName,
    passwordHash,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  saveLocalAccounts([...accounts, newAcc]);

  const session: LocalAuthSession = {
    userId: newAcc.id,
    phone: newAcc.phone,
    displayName: newAcc.displayName,
    loggedInAt: nowIso,
  };
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {}

  return { session, error: null };
}

export async function localSignInWithPhone(
  rawPhone: string,
  password: string
): Promise<{ session: LocalAuthSession | null; error: string | null }> {
  const phone = normalizeIranPhone(rawPhone);
  if (!isValidIranPhone(phone)) {
    return { session: null, error: 'شماره موبایل معتبر نیست (باید با 09 شروع شود و ۱۱ رقم باشد)' };
  }
  const accounts = loadLocalAccounts();
  const found = accounts.find((a) => a.phone === phone);
  if (!found) {
    return { session: null, error: 'حسابی با این شماره موبایل پیدا نشد؛ ابتدا ثبت‌نام کنید.' };
  }
  const hash = await hashPasswordSafe(password, phone);
  if (hash !== found.passwordHash) {
    return { session: null, error: 'رمز عبور اشتباه است' };
  }

  const session: LocalAuthSession = {
    userId: found.id,
    phone: found.phone,
    displayName: found.displayName,
    loggedInAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {}

  return { session, error: null };
}

export function updateLocalAccountDisplayName(userId: string, displayName: string): void {
  const accounts = loadLocalAccounts();
  const updated = accounts.map((a) =>
    a.id === userId ? { ...a, displayName, updatedAt: new Date().toISOString() } : a
  );
  saveLocalAccounts(updated);
  const sess = getLocalAuthSession();
  if (sess && sess.userId === userId) {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ ...sess, displayName }));
    } catch {}
  }
}

// =========================================================================
// بازیابی رمز عبور با کد تایید پیامکی (متصل به Supabase Edge Function: sms-otp)
// =========================================================================
export async function requestPasswordResetOtp(
  rawPhone: string
): Promise<{ ok: boolean; error?: string; cooldownSec?: number }> {
  const phone = normalizeIranPhone(rawPhone);
  if (!isValidIranPhone(phone)) {
    return { ok: false, error: 'شماره موبایل معتبر ۱۱ رقمی وارد کنید (مثال: 09157331216)' };
  }
  if (!isSupabaseConfigured) {
    return { ok: false, error: 'اتصال سرور ابری در این نسخه فعال نیست.' };
  }

  try {
    const { data, error } = await supabase.functions.invoke('sms-otp', {
      body: { action: 'send', phone },
    });
    if (error) {
      return {
        ok: false,
        error:
          'سرویس پیامک بازیابی رمز (پنل پیامکی ایران) هنوز روی سرور فعال نشده است. پس از ثبت کلید کاوه‌نگار یا SMS.ir در Supabase، پیامک کد تایید خودکار ارسال می‌شود.',
      };
    }
    if (data && data.error) {
      return { ok: false, error: String(data.error) };
    }
    return { ok: true, cooldownSec: Number(data?.cooldownSec || 120) };
  } catch {
    return {
      ok: false,
      error: 'ارتباط با سرویس پیامک برقرار نشد؛ اینترنت خود را بررسی کنید یا از بخش ارتباط با سازنده پیام دهید.',
    };
  }
}

export async function verifyOtpAndResetPassword(
  rawPhone: string,
  rawCode: string,
  newPassword: string
): Promise<{ ok: boolean; error?: string }> {
  const phone = normalizeIranPhone(rawPhone);
  const code = toEnglishDigits(rawCode).replace(/[^0-9]/g, '');
  if (!isValidIranPhone(phone)) {
    return { ok: false, error: 'شماره موبایل معتبر نیست' };
  }
  if (code.length < 4 || code.length > 6) {
    return { ok: false, error: 'کد تایید پیامکی را به‌درستی وارد کنید' };
  }
  if (!newPassword || newPassword.length < 6) {
    return { ok: false, error: 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد' };
  }
  if (!isSupabaseConfigured) {
    return { ok: false, error: 'اتصال سرور ابری فعال نیست.' };
  }

  try {
    const { data, error } = await supabase.functions.invoke('sms-otp', {
      body: { action: 'verify_and_reset', phone, code, newPassword },
    });
    if (error) {
      return { ok: false, error: 'کد تایید نامعتبر یا منقضی است؛ دوباره درخواست کد دهید.' };
    }
    if (data && data.error) {
      return { ok: false, error: String(data.error) };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'خطا در برقراری ارتباط با سرور برای تغییر رمز عبور.' };
  }
}
