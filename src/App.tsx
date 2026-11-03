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
  const [showRoyalSplash, setShowRoyalSplash] = useState<boolean>(true);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const tabOrder: Tab[] = ['home', 'tasbih', 'library', 'reminders', 'settings'];

  useEffect(() => {
    const timer = setTimeout(() => setShowRoyalSplash(false), 2600);
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
      {/* صفحه آغازین (Splash) تذهیب ایرانی-اسلامی با شمسه طلایی و کتیبه نستعلیق */}
      {showRoyalSplash && (
        <div
          onClick={() => setShowRoyalSplash(false)}
          className="fixed inset-0 z-[3000] flex flex-col items-center justify-between py-10 px-5 text-center select-none overflow-hidden animate-fade-in"
          style={{
            background: 'radial-gradient(circle at 50% 38%, #0F3D33 0%, #071A16 64%, #030C0A 100%)',
          }}
          dir="rtl"
        >
          {/* قاب تذهیب طلایی دور تا دور صفحه */}
          <div
            className="pointer-events-none absolute inset-3.5 rounded-[28px]"
            style={{
              border: '1.5px solid rgba(251, 191, 36, 0.28)',
              boxShadow: 'inset 0 0 40px rgba(16, 185, 129, 0.12)',
            }}
          />

          {/* سرلوحه قرآنی بالا */}
          <div className="relative z-10 pt-2">
            <div
              className="inline-block px-5 py-1.5 rounded-full border text-sm font-bold"
              style={{
                fontFamily: "'Amiri Quran', serif",
                color: '#FDE68A',
                borderColor: 'rgba(251, 191, 36, 0.35)',
                background: 'rgba(13, 46, 38, 0.75)',
              }}
            >
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </div>
          </div>

          {/* شمسه اسلیمی ۲۴ پر و گنبد و قندیل حرم (با نسبت ۱:۱ دقیق بدون کشیدگی) */}
          <div className="relative z-10 flex flex-col items-center my-auto">
            <div className="relative w-64 h-64 flex items-center justify-center mb-4">
              <svg viewBox="0 0 260 260" className="w-full h-full drop-shadow-2xl">
                <defs>
                  <radialGradient id="shamsaGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.45" />
                    <stop offset="65%" stopColor="#059669" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#071A16" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="royalGold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FEF08A" />
                    <stop offset="45%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#B45309" />
                  </linearGradient>
                  <linearGradient id="emeraldGlass" x1="50%" y1="0%" x2="50%" y2="100%">
                    <stop offset="0%" stopColor="#114B3E" />
                    <stop offset="100%" stopColor="#06201A" />
                  </linearGradient>
                </defs>

                <circle cx="130" cy="130" r="122" fill="url(#shamsaGlow)" />

                {/* گلبرگ‌های شمسه اسلیمی طلایی */}
                <g stroke="url(#royalGold)" strokeWidth="1.4" fill="rgba(245, 158, 11, 0.06)">
                  <rect x="48" y="48" width="164" height="164" rx="22" transform="rotate(0 130 130)" />
                  <rect x="48" y="48" width="164" height="164" rx="22" transform="rotate(30 130 130)" />
                  <rect x="48" y="48" width="164" height="164" rx="22" transform="rotate(60 130 130)" />
                </g>

                {/* حلقه فیروزه‌ای تذهیب */}
                <circle cx="130" cy="130" r="92" fill="url(#emeraldGlass)" stroke="url(#royalGold)" strokeWidth="3" />
                <circle cx="130" cy="130" r="84" fill="none" stroke="#34D399" strokeWidth="1" strokeDasharray="3 3" />

                {/* طاق محراب متوازن اسلامی در مرکز شمسه */}
                <path
                  d="M130 56 C96 78 82 108 82 148 L82 184 L178 184 L178 148 C178 108 164 78 130 56 Z"
                  fill="rgba(4, 20, 16, 0.72)"
                  stroke="url(#royalGold)"
                  strokeWidth="2.8"
                />
                <path
                  d="M130 68 C104 86 92 112 92 148 L92 176 L168 176 L168 148 C168 112 156 86 130 68 Z"
                  fill="none"
                  stroke="#34D399"
                  strokeWidth="1.1"
                  strokeOpacity="0.65"
                />

                {/* زنجیر و قندیل نورانی آویخته از محراب */}
                <line x1="130" y1="68" x2="130" y2="98" stroke="#FDE68A" strokeWidth="1.8" />
                <path d="M120 104 Q130 92 140 104 L136 120 Q130 126 124 120 Z" fill="url(#royalGold)" />
                <circle cx="130" cy="112" r="16" fill="#FDE68A" fillOpacity="0.22" />

                {/* ستاره هشت‌پر نور در دل محراب */}
                <path
                  d="M130 134 L134 145 L145 149 L134 153 L130 164 L126 153 L115 149 L126 145 Z"
                  fill="#34D399"
                />
                <circle cx="130" cy="149" r="3" fill="#FEF08A" />

                {/* پایه مرمرین و زرین محراب */}
                <rect x="72" y="184" width="116" height="5" rx="2.5" fill="url(#royalGold)" />
              </svg>
            </div>

            <h1
              className="text-3xl font-black tracking-tight mb-1"
              style={{ color: '#ECFDF5', textShadow: '0 4px 18px rgba(16, 185, 129, 0.45)' }}
            >
              همراه معنوی نور
            </h1>
            <p className="text-xs font-bold mb-5" style={{ color: '#6EE7B7' }}>
              نسخه ویژه افق شهرهای ایران
            </p>

            {/* کتیبه خوشنویسی نستعلیق زرین دعای حضرت صاحب‌الزمان (عج) */}
            <div
              className="relative px-6 py-4 rounded-3xl border max-w-sm mx-auto"
              style={{
                background: 'linear-gradient(135deg, rgba(17, 62, 51, 0.88) 0%, rgba(7, 26, 22, 0.94) 100%)',
                borderColor: 'rgba(251, 191, 36, 0.55)',
                boxShadow: '0 14px 36px rgba(0, 0, 0, 0.55), inset 0 0 24px rgba(251, 191, 36, 0.12)',
              }}
            >
              <span
                className=" -top-2.5 right-6 absolute px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: '#F59E0B', color: '#071A16' }}
              >
                ✨ ذکر آغازین و تبرک
              </span>
              <p
                style={{
                  fontFamily: "'Noto Nastaliq Urdu', 'Gulzar', 'IranNastaliq', 'Amiri Quran', serif",
                  fontSize: '21px',
                  lineHeight: '2.45',
                  color: '#FEF08A',
                  textShadow: '0 2px 12px rgba(245, 158, 11, 0.35)',
                }}
              >
                اللَّهُمَّ بَارِكْ لِمَوْلَانَا صَاحِبِ الزَّمَانِ (عج)
              </p>
              <p className="text-[11px] font-medium mt-1" style={{ color: '#D1FAE5' }}>
                خدایا برای مولای ما حضرت صاحب‌الزمان (عج) برکت و گشایش قرار ده
              </p>
            </div>
          </div>

          <div className="relative z-10 pb-1 flex items-center gap-2 text-[11px] font-bold" style={{ color: '#A7F3D0' }}>
            <span className="w-2 h-2 rounded-full animate-ping" style={{ background: '#34D399' }} />
            <span>اوقات شرعی دقیق · مصحف عثمان طه · رادار مسجدیاب نشان</span>
          </div>
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
