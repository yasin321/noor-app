import { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { ThemeProvider } from '@/hooks/useTheme';
import { AuthScreen } from '@/components/AuthScreen';
import { BottomNav, type Tab } from '@/components/BottomNav';
import { HomeScreen } from '@/components/HomeScreen';
import { TasbihCounter } from '@/components/TasbihCounter';
import { LibraryScreen } from '@/components/LibraryScreen';
import { RemindersScreen } from '@/components/RemindersScreen';
import { SettingsScreen } from '@/components/SettingsScreen';
import { NotificationPermissionModal } from '@/components/NotificationPermissionModal';
import { AppTutorialModal } from '@/components/AppTutorialModal';
import { rescheduleAll } from '@/lib/reminderService';
import { logEvent } from '@/lib/logger';
import { Capacitor } from '@capacitor/core';

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
  const [tab, setTab] = useState<Tab>('home');
  const [navigationDirection, setNavigationDirection] = useState<'forward' | 'backward'>('forward');
  const [showAuth, setShowAuth] = useState(false);
  const [showFirstTimeGuide, setShowFirstTimeGuide] = useState<boolean>(false);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
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
      }, 1100);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const navigateTo = (nextTab: Tab) => {
    if (nextTab === tab) return;
    setNavigationDirection(tabOrder.indexOf(nextTab) >= tabOrder.indexOf(tab) ? 'forward' : 'backward');
    setTab(nextTab);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement | null;
    if (target && target.closest('input, select, textarea, [data-no-swipe="true"]')) {
      touchStartRef.current = null;
      return;
    }
    const t = e.touches[0];
    if (!t) return;
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      const currentIndex = tabOrder.indexOf(tab);
      if (currentIndex === -1) return;
      // کشیدن انگشت از چپ به راست (dx > 0) => رفتن به تب سمت چپ (currentIndex + 1)
      // کشیدن انگشت از راست به چپ (dx < 0) => رفتن به تب سمت راست (currentIndex - 1)
      if (dx > 0 && currentIndex < tabOrder.length - 1) {
        navigateTo(tabOrder[currentIndex + 1]);
      } else if (dx < 0 && currentIndex > 0) {
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
      void rescheduleAll(notifEnabled).then((res) => {
        logEvent('info', 'AppStartup', 'نتیجه زمان‌بندی مجدد در بدو ورود', res);
      });
    }
  }, [loading, user?.id, notifEnabled]);

  if (showAuth && !user) {
    return <AuthScreen onBack={() => setShowAuth(false)} />;
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
      onTouchStartCapture={handleTouchStart}
      onTouchEndCapture={handleTouchEnd}
    >
      {showFirstTimeGuide && <AppTutorialModal onClose={() => setShowFirstTimeGuide(false)} />}
      <NotificationPermissionModal />
      <main key={tab} className={`page-transition page-transition-${navigationDirection}`} aria-live="polite">
        {tab === 'home' && <HomeScreen onNavigate={navigateTo} />}
        {tab === 'tasbih' && <TasbihCounter onNavigate={navigateTo} />}
        {tab === 'library' && <LibraryScreen onNavigate={navigateTo} />}
        {tab === 'reminders' && <RemindersScreen />}
        {tab === 'settings' && <SettingsScreen onExitGuest={() => setShowAuth(true)} />}
      </main>
      <BottomNav active={tab} onChange={navigateTo} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}
