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
    if (target && target.closest('input, select, textarea, [data-no-swipe="true"]')) {
      touchStartRef.current = null;
      return;
    }
    const t = e.touches[0];
    if (!t) return;
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
      onTouchMoveCapture={handleTouchMove}
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
