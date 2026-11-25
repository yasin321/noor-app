import { useState, useEffect } from 'react';
import { Bell, X, Check, ShieldCheck } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useTheme } from '@/hooks/useTheme';
import { checkPermission, requestPermission, rescheduleAll } from '@/lib/reminderService';
import {
  checkFullScreenIntentPermission,
  openFullScreenIntentSettings,
} from '@/lib/nativeAlarmPermissions';
import { useBackHandler } from '@/lib/backNavigation';
import { logEvent } from '@/lib/logger';

const ONBOARDING_PROMPT_KEY = 'noor_notif_onboarding_prompted_v1';
const FULLSCREEN_PROMPT_KEY = 'noor_fullscreen_onboarding_prompted_v1';
const GUEST_NOTIF_KEY = 'noor_guest_notif_enabled';

interface Props {
  onGranted?: () => void;
}

export function NotificationPermissionModal({ onGranted }: Props) {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<'notifications' | 'fullscreen'>('notifications');
  const [submitting, setSubmitting] = useState(false);

  const handleDismiss = () => {
    if (step === 'fullscreen') {
      localStorage.setItem(FULLSCREEN_PROMPT_KEY, 'true');
    } else {
      localStorage.setItem(ONBOARDING_PROMPT_KEY, 'true');
    }
    setVisible(false);
  };

  useBackHandler(visible, handleDismiss);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const checkInitialPrompt = async () => {
      const isNative = Capacitor.isNativePlatform();
      if (!isNative) return;

      const alreadyPrompted = localStorage.getItem(ONBOARDING_PROMPT_KEY) === 'true';
      const fsPrompted = localStorage.getItem(FULLSCREEN_PROMPT_KEY) === 'true';
      const perm = await checkPermission();
      const fsStatus = await checkFullScreenIntentPermission();

      logEvent('info', 'OnboardingModal', 'بررسی سازگاری مجوزهای اندروید در بدو ورود', {
        permission: perm,
        apiLevel: fsStatus.apiLevel,
        fullScreenGranted: fsStatus.granted,
      });

      if (perm !== 'granted' && !alreadyPrompted) {
        timer = setTimeout(() => {
          setStep('notifications');
          setVisible(true);
        }, 900);
        return;
      }

      if (perm === 'granted') {
        localStorage.setItem(ONBOARDING_PROMPT_KEY, 'true');
        if (fsStatus.needsSettings && !fsStatus.granted && !fsPrompted) {
          timer = setTimeout(() => {
            setStep('fullscreen');
            setVisible(true);
          }, 1100);
        }
      }
    };

    void checkInitialPrompt();
    return () => clearTimeout(timer);
  }, []);

  const handleAllowNotifications = async () => {
    setSubmitting(true);
    const result = await requestPermission();
    localStorage.setItem(ONBOARDING_PROMPT_KEY, 'true');

    if (result === 'granted') {
      try {
        localStorage.setItem(GUEST_NOTIF_KEY, 'true');
      } catch {}

      if (Capacitor.getPlatform() === 'android') {
        try {
          await LocalNotifications.checkExactNotificationSetting();
        } catch {}
      }

      await rescheduleAll(true);
      onGranted?.();

      // در اندروید ۱۴، ۱۵ و ۱۶ بررسی مجوز نمایش تمام‌صفحه روی قفل گوشی
      const fsStatus = await checkFullScreenIntentPermission();
      if (fsStatus.needsSettings && !fsStatus.granted) {
        setSubmitting(false);
        setStep('fullscreen');
        return;
      }
    }

    setSubmitting(false);
    setVisible(false);
  };

  const handleOpenFullScreenSettings = async () => {
    setSubmitting(true);
    localStorage.setItem(FULLSCREEN_PROMPT_KEY, 'true');
    await openFullScreenIntentSettings();
    setSubmitting(false);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5 animate-fade-in"
      style={{ background: 'rgba(0, 0, 0, 0.72)', backdropFilter: 'blur(5px)' }}
      dir="rtl"
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
          style={{
            background:
              step === 'fullscreen'
                ? 'rgba(251, 191, 36, 0.16)'
                : `color-mix(in srgb, ${theme.primary} 15%, transparent)`,
          }}
        >
          {step === 'fullscreen' ? (
            <ShieldCheck size={30} color={theme.accent} />
          ) : (
            <Bell size={30} color={theme.primary} />
          )}
        </div>

        {step === 'notifications' ? (
          <>
            <h2 className="text-lg font-bold text-app mb-2">
              اعلان اذان و یادآوری‌ها را فعال کنید 🌿
            </h2>
            <p className="text-muted text-xs leading-relaxed mb-6">
              با فعال کردن اعلان‌ها، همراه معنوی «نور» سر وقت دقیق اذان، تواشیح و تلاوت سوره‌های انتخابی را برایتان پخش می‌کند.
            </p>
            <div className="space-y-2.5">
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleAllowNotifications()}
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
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold text-app mb-2">
              نمایش صفحه اذان روی قفل گوشی ✨
            </h2>
            <p className="text-muted text-xs leading-relaxed mb-6">
              در اندروید ۱۴ و ۱۵ برای اینکه هنگام اذان یا پخش سوره، صفحه طلایی آلارم و دکمه توقف روی قفل گوشی نمایش داده شود، کافیست گزینه «اعلان‌های تمام‌صفحه» را برای نور روشن کنید.
            </p>
            <div className="space-y-2.5">
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleOpenFullScreenSettings()}
                className="w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: theme.accent, color: theme.bg }}
              >
                <ShieldCheck size={18} />
                <span>فعال‌سازی نمایش روی قفل صفحه</span>
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDismiss}
                className="w-full py-2.5 rounded-2xl text-xs font-medium text-muted"
              >
                بعداً از تنظیمات صدای مؤذن انجام می‌دهم
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
