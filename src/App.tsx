import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { ThemeProvider } from '@/hooks/useTheme';
import { LanguageProvider, useI18n } from '@/i18n';
const AuthScreen = lazy(() => import('@/components/AuthScreen').then((m) => ({ default: m.AuthScreen })));
import { BottomNav, type Tab } from '@/components/BottomNav';
import { HomeScreen } from '@/components/HomeScreen';
const TasbihCounter = lazy(() => import('@/components/TasbihCounter').then((m) => ({ default: m.TasbihCounter })));
const LibraryScreen = lazy(() => import('@/components/LibraryScreen').then((m) => ({ default: m.LibraryScreen })));
const RemindersScreen = lazy(() => import('@/components/RemindersScreen').then((m) => ({ default: m.RemindersScreen })));
const SettingsScreen = lazy(() => import('@/components/SettingsScreen').then((m) => ({ default: m.SettingsScreen })));
import { NotificationPermissionModal } from '@/components/NotificationPermissionModal';
const AppTutorialModal = lazy(() => import('@/components/AppTutorialModal').then((m) => ({ default: m.AppTutorialModal })));
import { rescheduleAll, purgeLegacyPrePostAdhanReminders } from '@/lib/reminderService';
import { syncAllSurahNativeAlarms } from '@/lib/surahAlarmService';
import { runGlobalSync } from '@/lib/globalSyncService';
import { runFullUserCloudSync, installAutoCloudSync } from '@/lib/cloudSyncService';
import { GlobalUpdateBanner } from '@/components/GlobalUpdateBanner';
import { LiveNotificationPopup, BirthdayCelebrationModal } from '@/components/InboxAndBirthdayModal';
import {
  fetchInboxMessages,
  subscribeLiveInbox,
  shouldShowBirthdayPopupToday,
  type InboxMessage,
} from '@/lib/inboxService';
import { logEvent } from '@/lib/logger';
import { Capacitor } from '@capacitor/core';
import { useBackHandler } from '@/lib/backNavigation';

export function getGuestNotifEnabled(): boolean {
  try {
    const val = localStorage.getItem('noor_guest_notif_enabled');
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

function AppContent() {
  const { user, profile, loading } = useAuth();
  const { isRtl } = useI18n();
  const [tab, setTab] = useState<Tab>('home');
  const [navigationDirection, setNavigationDirection] = useState<'forward' | 'backward'>('forward');
  const [showAuth, setShowAuth] = useState(false);
  const [showFirstTimeGuide, setShowFirstTimeGuide] = useState<boolean>(false);
  const [livePopupMsg, setLivePopupMsg] = useState<InboxMessage | null>(null);
  const [showBirthdayModal, setShowBirthdayModal] = useState<boolean>(false);

  const touchStartRef = useRef<{ x: number; y: number; id: number; multi: boolean } | null>(null);
  const tabOrder: Tab[] = ['tasbih', 'library', 'home', 'reminders', 'settings'];

  // به محض اینکه دیتای اولیه برنامه آماده شد، صفحه گرافیکی آغازین (در index.html) را به نرمی کنار بزن
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        const bootSplash = document.getElementById('noor-instant-boot-splash');
        if (bootSplash) {
          bootSplash.classList.add('splash-hidden');
          setTimeout(() => bootSplash.remove(), 500);
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const navigateTo = (nextTab: Tab) => {
    if (nextTab === tab) return;
    setNavigationDirection(tabOrder.indexOf(nextTab) >= tabOrder.indexOf(tab) ? 'forward' : 'backward');
    setTab(nextTab);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    // اگر بیش از یک انگشت روی صفحه باشد یا روی بخش ذکرشمار/عناصر قفل‌شده باشیم، سوایپ تعویض تب را کاملاً غیرفعال کن
    if (e.touches.length > 1) {
      touchStartRef.current = null;
      return;
    }
    const target = e.target as HTMLElement | null;
    if (target) {
      if (target.closest('input, select, textarea, [data-no-swipe="true"], [role="dialog"], .fixed.inset-0')) {
        touchStartRef.current = null;
        return;
      }
      // اگر لمس داخل هر لیست یا نوار اسکرول‌شونده افقی شروع شده باشد، سوایپ تعویض تب غیرفعال شود
      let node: HTMLElement | null = target;
      while (node && node !== e.currentTarget) {
        if (node.scrollWidth > node.clientWidth + 4) {
          const ovx = window.getComputedStyle(node).overflowX;
          if (ovx === 'auto' || ovx === 'scroll') {
            touchStartRef.current = null;
            return;
          }
        }
        node = node.parentElement;
      }
    }
    const t = e.touches[0];
    if (!t) return;
    if (typeof window !== 'undefined' && (t.clientX < 28 || t.clientX > window.innerWidth - 28)) {
      touchStartRef.current = null;
      return;
    }
    touchStartRef.current = { x: t.clientX, y: t.clientY, id: t.identifier, multi: false };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 1 && touchStartRef.current) {
      touchStartRef.current.multi = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const start = touchStartRef.current;
    // اگر در طول لمس بیش از یک انگشت درگیر بوده یا هنوز انگشت دیگری روی صفحه است، صفحه عوض نشود
    if (start.multi || e.touches.length > 0 || e.changedTouches.length > 1) {
      touchStartRef.current = null;
      return;
    }
    const t = Array.from(e.changedTouches).find((ct) => ct.identifier === start.id);
    touchStartRef.current = null;
    if (!t) return;

    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;

    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.45) {
      const currentIndex = tabOrder.indexOf(tab);
      if (currentIndex === -1) return;
      const moveNext = isRtl ? dx > 0 : dx < 0;
      if (moveNext && currentIndex < tabOrder.length - 1) {
        navigateTo(tabOrder[currentIndex + 1]);
      } else if (!moveNext && currentIndex > 0) {
        navigateTo(tabOrder[currentIndex - 1]);
      }
    }
  };

  const notifEnabled = profile?.notif_enabled ?? getGuestNotifEnabled();

  useEffect(() => {
    if (!loading && Capacitor.isNativePlatform()) {
      logEvent('info', 'AppStartup', 'شروع زمان‌بندی مجدد یادآوری‌ها در بدو ورود', {
        notifEnabled,
        userId: user?.id ?? 'guest',
      });
      void purgeLegacyPrePostAdhanReminders().then(async () => {
        const tawashih = await import('@/components/TawashihAndAdhanReminderSection');
        void tawashih.syncAllTawashihNativeAlarms(tawashih.loadTawashihConfig());
        void syncAllSurahNativeAlarms();
      });
      void rescheduleAll(notifEnabled).then((res) => {
        logEvent('info', 'AppStartup', 'نتیجه زمان‌بندی مجدد در بدو ورود', res);
      });
    }
  }, [loading, user?.id, notifEnabled]);

  // همگام‌سازی غیربلاکه و سبک با سرور (سینک گلوبال محتوا/نسخه + بکاپ ابری کاربر)
  useEffect(() => {
    if (loading) return;
    const timer = window.setTimeout(() => {
      void runGlobalSync();
      if (user?.id) {
        void runFullUserCloudSync(user.id);
      }
    }, 900);
    return () => window.clearTimeout(timer);
  }, [loading, user?.id]);

  // سینک خودکار استاندارد (Debounce 8s + پس‌زمینه + بازگشت اینترنت)
  useEffect(() => {
    if (loading || !user?.id) return;
    return installAutoCloudSync(user.id);
  }, [loading, user?.id]);

  useEffect(() => {
    if (loading) return;
    const timer = window.setTimeout(() => {
      void fetchInboxMessages(profile?.display_name).then((res) => {
        if (res.pendingPopup) setLivePopupMsg(res.pendingPopup);
      });
      if (shouldShowBirthdayPopupToday()) {
        setShowBirthdayModal(true);
      }
    }, 1100);
    return () => window.clearTimeout(timer);
  }, [loading, profile?.display_name]);

  useEffect(() => {
    const unsub = subscribeLiveInbox((msg) => {
      if (msg.show_popup) setLivePopupMsg(msg);
    });
    return unsub;
  }, []);

  useBackHandler(tab !== 'home', () => navigateTo('home'));
  useBackHandler(showFirstTimeGuide, () => setShowFirstTimeGuide(false));
  useBackHandler(Boolean(livePopupMsg), () => setLivePopupMsg(null));
  useBackHandler(showBirthdayModal, () => setShowBirthdayModal(false));
  useBackHandler(showAuth && !user, () => setShowAuth(false));

  if (showAuth && !user) {
    return (
      <Suspense fallback={<div className="min-h-screen" style={{ background: 'var(--bg)' }} />}>
        <AuthScreen onBack={() => setShowAuth(false)} />
      </Suspense>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
      onTouchStartCapture={handleTouchStart}
      onTouchMoveCapture={handleTouchMove}
      onTouchEndCapture={handleTouchEnd}
    >
      {showFirstTimeGuide && <Suspense fallback={null}><AppTutorialModal onClose={() => setShowFirstTimeGuide(false)} /></Suspense>}
      <NotificationPermissionModal />
      <GlobalUpdateBanner />
      {livePopupMsg && (
        <LiveNotificationPopup
          message={livePopupMsg}
          onClose={() => setLivePopupMsg(null)}
          onNavigate={navigateTo}
        />
      )}
      {showBirthdayModal && (
        <BirthdayCelebrationModal
          displayName={profile?.display_name}
          onClose={() => setShowBirthdayModal(false)}
        />
      )}
      <main key={tab} className={`page-transition page-transition-${navigationDirection}`} aria-live="polite">
        <Suspense
          fallback={
            <div className="min-h-[60vh] flex items-center justify-center">
              <div className="w-7 h-7 rounded-full border-2 border-emerald-400/30 border-t-emerald-400 animate-spin" />
            </div>
          }
        >
          {tab === 'home' && <HomeScreen onNavigate={navigateTo} />}
          {tab === 'tasbih' && <TasbihCounter onNavigate={navigateTo} />}
          {tab === 'library' && <LibraryScreen onNavigate={navigateTo} />}
          {tab === 'reminders' && <RemindersScreen />}
          {tab === 'settings' && <SettingsScreen onExitGuest={() => setShowAuth(true)} />}
        </Suspense>
      </main>
      <BottomNav active={tab} onChange={navigateTo} />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
