import { Capacitor } from '@capacitor/core';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const recentFingerprints = new Map<string, number>();
const DEDUPE_WINDOW_MS = 60_000;
let telemetryInstalled = false;

function getAppVersionString(): string {
  return String(import.meta.env.VITE_APP_VERSION_NAME || 'v3.0.0');
}

function getPlatformName(): string {
  try {
    return Capacitor.getPlatform();
  } catch {
    return 'web';
  }
}

export async function reportCloudError(input: {
  level?: 'error' | 'fatal' | 'warn';
  scope: string;
  message: string;
  stack?: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  if (!isSupabaseConfigured) return;

  const cleanMsg = String(input.message || 'Unknown error').slice(0, 1800);
  const cleanScope = String(input.scope || 'Global').slice(0, 80);
  const fingerprint = cleanScope + '::' + cleanMsg.slice(0, 160);

  const now = Date.now();
  const prevTs = recentFingerprints.get(fingerprint) ?? 0;
  if (now - prevTs < DEDUPE_WINDOW_MS) return;
  recentFingerprints.set(fingerprint, now);

  try {
    let userId: string | null = null;
    try {
      const { data } = await supabase.auth.getSession();
      userId = data?.session?.user?.id ?? null;
    } catch {}

    await supabase.from('app_error_logs').insert({
      user_id: userId,
      level: input.level || 'error',
      scope: cleanScope,
      message: cleanMsg,
      stack: String(input.stack || '').slice(0, 3500),
      app_version: getAppVersionString(),
      platform: getPlatformName(),
      meta: input.meta ?? {},
    });
  } catch {
    // هرگز خطای تلِمتری نباید باعث حلقه خطا شود
  }
}

export function installGlobalErrorTelemetry(): void {
  if (telemetryInstalled || typeof window === 'undefined') return;
  telemetryInstalled = true;

  window.addEventListener('error', (event) => {
    const msg = event.message || event.error?.message || 'Unhandled window error';
    const stack =
      event.error?.stack ||
      String(event.filename || '') + ':' + String(event.lineno || 0) + ':' + String(event.colno || 0);
    void reportCloudError({
      level: 'error',
      scope: 'WindowError',
      message: msg,
      stack,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg =
      typeof reason === 'string'
        ? reason
        : reason?.message || 'Unhandled promise rejection';
    const stack = typeof reason === 'object' && reason?.stack ? String(reason.stack) : '';
    void reportCloudError({
      level: 'error',
      scope: 'UnhandledPromise',
      message: msg,
      stack,
    });
  });
}
