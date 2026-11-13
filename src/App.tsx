import { useState, useEffect, useRef, useCallback } from 'react';
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

const TAB_ORDER: Tab[] = ['tasbih', 'library', 'home', 'reminders', 'settings'];

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [tab, setTab] = useState<Tab>('home');
  const [slideDir, setSlideDir] = useState<'left' | 'right' | 'none'>('none');
  const [showAuth, setShowAuth] = useState(false);

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    const bootSplash = document.getElementById('noor-instant-boot-splash');
    if (!bootSplash) return;
    if (typeof navigator !== 'undefined' && navigator.webdriver) {
      bootSplash.remove();
      return;
    }
    if (!loading) {
      const timer = setTimeout(() => {
        bootSplash.classList.add('splash-hidden');
        setTimeout(() => bootSplash.remove(), 300);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const navigateTo = useCallback((nextTab: Tab) => {
    setTab((prevTab) => {
      if (nextTab === prevTab) return prevTab;
      const prevIdx = TAB_ORDER.indexOf(prevTab);
      const nextIdx = TAB_ORDER.indexOf(nextTab);
      setSlideDir(nextIdx > prevIdx ? 'left' : 'right');
      return nextTab;
    });
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement | null;
    if (target && target.closest('input, select, textarea, [data-no-swipe="true"]')) {
      touchStartRef.current = null;
      return;
    }
    const t = e.touches[0];
    if (!t) return;
    touchStartRef.current = { x: t.clientX, y: t.clientY, time: performance.now() };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    const dt = performance.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    const minSwipeDistance = dt < 260 ? 32 : 46;
    if (Math.abs(dx) > minSwipeDistance && Math.abs(dx) > Math.abs(dy) * 1.25) {
      const currentIndex = TAB_ORDER.indexOf(tab);
      if (currentIndex === -1) return;
      if (dx > 0 && currentIndex < TAB_ORDER.length - 1) {
        navigateTo(TAB_ORDER[currentIndex + 1]);
      } else if (dx < 0 && currentIndex > 0) {
        navigateTo(TAB_ORDER[currentIndex - 1]);
      }
    }
  };

  const notifEnabled = profile?.notif_enabled ?? getGuestNotifEnabled();

  useEffect(() => {
    if (!loading && Capacitor.isNativePlatform()) {
      logEvent('info', 'AppStartup', 'شروع زمان‌بندی مجدد یادآوری‌ها در بدو ورود', {
        notifEnabled,
      });
      if (notifEnabled) {
        void rescheduleAll();
      }
    }
  }, [loading, notifEnabled]);

  if (showAuth && !user) {
    return <AuthScreen onBack={() => setShowAuth(false)} />;
  }

  const animClass =
    slideDir === 'left'
      ? 'noor-anim-slide-left'
      : slideDir === 'right'
        ? 'noor-anim-slide-right'
        : '';

  return (
    <div
      className="min-h-screen bg-app text-app relative overflow-x-hidden select-none"
      onTouchStartCapture={handleTouchStart}
      onTouchEndCapture={handleTouchEnd}
    >
      {!(typeof navigator !== 'undefined' && navigator.webdriver) && <NotificationPermissionModal />}

      <main key={tab} className={`relative w-full ${animClass}`}>
        {tab === 'home' && <HomeScreen onNavigate={navigateTo} />}
        {tab === 'tasbih' && <TasbihCounter />}
        {tab === 'library' && <LibraryScreen />}
        {tab === 'reminders' && <RemindersScreen />}
        {tab === 'settings' && <SettingsScreen onExitGuest={() => setShowAuth(true)} />}
      </main>

      <BottomNav active={tab} onChange={navigateTo} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
