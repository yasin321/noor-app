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
  const [showLaunchArt, setShowLaunchArt] = useState<boolean>(true);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const tabOrder: Tab[] = ['home', 'tasbih', 'library', 'reminders', 'settings'];

  useEffect(() => {
    const timer = setTimeout(() => setShowLaunchArt(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  const navigateTo = (nextTab: Tab) => {
    if (nextTab === tab) return;
    setNavigationDirection(tabOrder.indexOf(nextTab) >= tabOrder.indexOf(tab) ? 'forward' : 'backward');
    setTab(nextTab);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA')) {
      touchStartRef.current = null;
      return;
    }
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(dx) > 72 && Math.abs(dx) > Math.abs(dy) * 1.6) {
      const currentIndex = tabOrder.indexOf(tab);
      if (dx < 0 && currentIndex < tabOrder.length - 1) {
        navigateTo(tabOrder[currentIndex + 1]);
      } else if (dx > 0 && currentIndex > 0) {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="w-14 h-14 rounded-full animate-pulse" style={{ background: 'var(--primary)', opacity: 0.3 }} />
      </div>
    );
  }

  if (showAuth && !user) {
    return <AuthScreen onBack={() => setShowAuth(false)} />;
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {showLaunchArt && (
        <div
          onClick={() => setShowLaunchArt(false)}
          className="fixed inset-0 z-[2000] flex flex-col items-center justify-between py-12 px-6 text-center select-none animate-fade-in"
          style={{
            background: 'radial-gradient(circle at 50% 35%, #134E42 0%, #071A16 62%, #030B09 100%)',
          }}
          dir="rtl"
        >
          <div className="text-sm font-bold tracking-wider" style={{ color: '#A7F3D0', fontFamily: "'Amiri Quran', 'Parastoo', serif" }}>
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </div>

          <div className="flex flex-col items-center max-w-xs">
            <div className="relative flex items-center justify-center mb-5">
              <svg width="188" height="206" viewBox="0 0 180 200" fill="none">
                <defs>
                  <linearGradient id="archGold" x1="90" y1="8" x2="90" y2="192" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FEF08A" />
                    <stop offset="50%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#B45309" />
                  </linearGradient>
                  <radialGradient id="innerGlow" cx="50%" cy="45%" r="50%">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.42" />
                    <stop offset="100%" stopColor="#071A16" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <circle cx="90" cy="95" r="85" fill="url(#innerGlow)" />
                <path
                  d="M90 14 C46 46 28 88 28 144 L28 178 L152 178 L152 144 C152 88 134 46 90 14 Z"
                  stroke="url(#archGold)"
                  strokeWidth="4.5"
                  fill="rgba(13, 46, 38, 0.65)"
                />
                <path
                  d="M90 28 C54 56 40 92 40 142 L40 168 L140 168 L140 142 C140 92 126 56 90 28 Z"
                  stroke="#34D399"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                  fill="none"
                />
                <line x1="90" y1="28" x2="90" y2="68" stroke="#FBBF24" strokeWidth="2.2" />
                <circle cx="90" cy="78" r="11" fill="url(#archGold)" />
                <path d="M90 104 L95 115 L106 119 L95 123 L90 134 L85 123 L74 119 L85 115 Z" fill="#34D399" />
                <circle cx="62" cy="96" r="2.8" fill="#FDE68A" />
                <circle cx="118" cy="96" r="2.8" fill="#FDE68A" />
                <circle cx="66" cy="138" r="2.2" fill="#A7F3D0" />
                <circle cx="116" cy="136" r="2.2" fill="#A7F3D0" />
                <rect x="18" y="178" width="144" height="6" rx="3" fill="url(#archGold)" />
              </svg>
            </div>

            <h1 className="text-3xl font-black tracking-tight mb-2" style={{ color: '#ECFDF5' }}>
              همراه معنوی نور
            </h1>

            <div
              className="mt-3 px-5 py-3 rounded-2xl border"
              style={{
                fontFamily: "'Gulzar', 'Amiri Quran', 'Scheherazade New', 'Parastoo', serif",
                fontSize: '23px',
                lineHeight: '2.1',
                color: '#FEF08A',
                borderColor: 'rgba(251, 191, 36, 0.45)',
                background: 'rgba(15, 52, 43, 0.72)',
                boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
              }}
            >
              اللَّهُمَّ بَارِكْ لِمَوْلَانَا صَاحِبِ الزَّمَانِ (عج)
            </div>
          </div>

          <p className="text-[11px] font-bold opacity-80" style={{ color: '#A7F3D0' }}>
            اوقات شرعی دقیق · مصحف عثمان طه · گنجینه اذکار و مسجدیاب
          </p>
        </div>
      )}
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
