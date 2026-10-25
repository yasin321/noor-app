import { useState, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useTheme } from '@/hooks/useTheme';
import { checkPermission, requestPermission, rescheduleAll } from '@/lib/reminderService';
import { logEvent } from '@/lib/logger';

const ONBOARDING_PROMPT_KEY = 'noor_notif_onboarding_prompted_v1';
const GUEST_NOTIF_KEY = 'noor_guest_notif_enabled';

interface Props {
  onGranted?: () => void;
}

export function NotificationPermissionModal({ onGranted }: Props) {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const checkInitialPrompt = async () => {
      const isNative = Capacitor.isNativePlatform();
      const alreadyPrompted = localStorage.getItem(ONBOARDING_PROMPT_KEY) === 'true';
      const perm = await checkPermission();

      logEvent('info', 'OnboardingModal', 'بررسی اولیه وضعیت مجوز در بدو ورود', {
        isNative,
        alreadyPrompted,
        permission: perm,
      });

      if (perm === 'granted') {
        localStorage.setItem(ONBOARDING_PROMPT_KEY, 'true');
        return;
      }

      // نمایش مودال در اولین ورود اگر هنوز مجوز داده نشده است
      if (!alreadyPrompted && (isNative || 'Notification' in window)) {
        timer = setTimeout(() => {
          setVisible(true);
          logEvent('info', 'OnboardingModal', 'مودال معرفی مجوز اعلان به کاربر نمایش داده شد');
        }, 900);
      }
    };

    void checkInitialPrompt();
    return () => clearTimeout(timer);
  }, []);

  const handleAllow = async () => {
    setSubmitting(true);
    logEvent('info', 'OnboardingModal', 'کاربر روی دکمه فعال کردن یادآوری‌ها کلیک کرد');

    const result = await requestPermission();
    localStorage.setItem(ONBOARDING_PROMPT_KEY, 'true');

    logEvent(result === 'granted' ? 'info' : 'warn', 'OnboardingModal', 'پاسخ سیستم به درخواست مجوز اعلان', {
      result,
    });

    if (result === 'granted') {
      try {
        localStorage.setItem(GUEST_NOTIF_KEY, 'true');
      } catch {
        // ignore
      }

      if (Capacitor.getPlatform() === 'android') {
        try {
          const exact = await LocalNotifications.checkExactNotificationSetting();
          logEvent('info', 'OnboardingModal', 'وضعیت مجوز Exact Alarm بررسی شد', {
            exact_alarm: exact.exact_alarm,
          });
        } catch (err) {
          logEvent('warn', 'OnboardingModal', 'خطا در بررسی Exact Alarm', { error: String(err) });
        }
      }

      await rescheduleAll(true);
      onGranted?.();
    }

    setSubmitting(false);
    setVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(ONBOARDING_PROMPT_KEY, 'true');
    logEvent('info', 'OnboardingModal', 'کاربر گزینه فعلاً نه را انتخاب کرد');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5 animate-fade-in"
      style={{ background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6 text-center relative shadow-2xl border"
        style={{ background: theme.surface, borderColor: theme.border }}
      >
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="بستن"
          className="absolute top-4 left-4 text-muted"
        >
          <X size={20} />
        </button>

        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: `color-mix(in srgb, ${theme.primary} 15%, transparent)` }}
        >
          <Bell size={30} color={theme.primary} />
        </div>

        <h2 className="text-lg font-bold text-app mb-2">
          یادت نره ذکر امروزت رو بگی! 🌿
        </h2>

        <p className="text-muted text-xs leading-relaxed mb-6">
          با فعال کردن یادآوری‌ها، برنامهٔ «نور» در زمان مناسب بهت یادآوری می‌کنه که چند لحظه برای آرامش، ذکر و نماز وقت بذاری.
        </p>

        <div className="space-y-2.5">
          <button
            type="button"
            disabled={submitting}
            onClick={handleAllow}
            className="w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: theme.primary, color: theme.bg }}
          >
            <Check size={18} />
            {submitting ? 'در حال دریافت مجوز...' : 'فعال کردن یادآوری‌ها'}
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={handleDismiss}
            className="w-full py-2.5 rounded-2xl text-xs font-medium text-muted"
          >
            فعلاً نه، بعداً از تنظیمات فعال می‌کنم
          </button>
        </div>
      </div>
    </div>
  );
}
