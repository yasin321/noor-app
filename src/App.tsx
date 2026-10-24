import { useState, useEffect } from 'react';
import { Bell, Volume2, ShieldCheck } from 'lucide-react';
import { checkPermission, requestPermission } from '@/lib/reminderService';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { ThemeProvider } from '@/hooks/useTheme';
import { AuthScreen } from '@/components/AuthScreen';
import { BottomNav, type Tab } from '@/components/BottomNav';
import { HomeScreen } from '@/components/HomeScreen';
import { TasbihCounter } from '@/components/TasbihCounter';
import { LibraryScreen } from '@/components/LibraryScreen';
import { RemindersScreen } from '@/components/RemindersScreen';
import { SettingsScreen } from '@/components/SettingsScreen';
import { rescheduleAll } from '@/lib/reminderService';
import { Capacitor } from '@capacitor/core';
import { getCityById, getGuestCityId } from '@/lib/cities';
import { adhans } from '@/lib/adhans';
import { PRAYER_ADHAN_ENABLED_KEY, syncPrayerAdhanAlarms } from '@/lib/prayerAdhan';

function getGuestNotifEnabled(): boolean {
  try {
    return localStorage.getItem('noor_guest_notif_enabled') === 'true';
  } catch {
    return false;
  }
}

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [tab, setTab] = useState<Tab>('home');
  const [navigationDirection, setNavigationDirection] = useState<'forward' | 'backward'>('forward');
  const [showAuth, setShowAuth] = useState(false);
  const [showPermissionIntro, setShowPermissionIntro] = useState(false);
  const [permissionIntroMessage, setPermissionIntroMessage] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !Capacitor.isNativePlatform()) return;
    let active = true;
    void (async () => {
      try {
        if (localStorage.getItem('noor_permission_intro_seen') === 'true') return;
        const permission = await checkPermission();
        if (active && permission !== 'granted') setShowPermissionIntro(true);
      } catch { /* permissions are requested only on native platforms */ }
    })();
    return () => { active = false; };
  }, [loading]);

  const allowNotificationsFromIntro = async () => {
    setPermissionIntroMessage(null);
    const permission = await requestPermission();
    if (permission !== 'granted') {
      setPermissionIntroMessage('اجازه داده نشد. یادآوری‌ها تا زمان فعال‌شدن اجازهٔ اعلان ممکن است بی‌صدا یا غیرفعال باشند.');
      return;
    }
    try { localStorage.setItem('noor_permission_intro_seen', 'true'); } catch { /* ignore */ }
    setShowPermissionIntro(false);
    const result = await rescheduleAll(notifEnabled);
    if (result.failed > 0) {
      setPermissionIntroMessage(`${result.succeeded} یادآوری فعال شد و ${result.failed} مورد ناموفق بود. اجازهٔ آلارم دقیق اندروید را هم بررسی کن.`);
    }
  };

  const dismissPermissionIntro = () => {
    try { localStorage.setItem('noor_permission_intro_seen', 'true'); } catch { /* ignore */ }
    setShowPermissionIntro(false);
  };

  const tabOrder: Tab[] = ['home', 'tasbih', 'library', 'reminders', 'settings'];
  const navigateTo = (nextTab: Tab) => {
    if (nextTab === tab) return;
    setNavigationDirection(tabOrder.indexOf(nextTab) >= tabOrder.indexOf(tab) ? 'forward' : 'backward');
    setTab(nextTab);
  };

  const notifEnabled = profile?.notif_enabled ?? getGuestNotifEnabled();

  useEffect(() => {
    if (loading || Capacitor.getPlatform() !== 'android') return;

    const refreshPrayerAlarms = () => {
      let enabled = false;
      let guestAdhanId = 'default';
      try {
        enabled = localStorage.getItem(PRAYER_ADHAN_ENABLED_KEY) === 'true';
        guestAdhanId = localStorage.getItem('noor_guest_adhan_id') || 'default';
      } catch {
        // If storage is unavailable, do not create new alarms unexpectedly.
      }
      if (!enabled) return;
      const city = getCityById(profile?.city_id ?? getGuestCityId());
      const adhanId = profile?.adhan_id ?? guestAdhanId;
      const adhan = adhans.find((item) => item.id === adhanId);
      if (!adhan?.audioUrl) return;
      void syncPrayerAdhanAlarms({
        enabled: true,
        city,
        method: profile?.calculation_method ?? 'jafari',
        adhanId,
        audioUrl: adhan.audioUrl,
      });
    };

    refreshPrayerAlarms();
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshPrayerAlarms();
    };
    window.addEventListener('focus', refreshPrayerAlarms);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', refreshPrayerAlarms);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [loading, profile?.city_id, profile?.adhan_id, profile?.calculation_method]);

  useEffect(() => {
    // Wait for the auth/profile state before rescheduling. Otherwise the initial
    // default (enabled) can briefly override a saved disabled preference.
    if (!loading && Capacitor.isNativePlatform()) {
      void rescheduleAll(notifEnabled);
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
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <main key={tab} className={`page-transition page-transition-${navigationDirection}`} aria-live="polite">
        {tab === 'home' && <HomeScreen onNavigate={navigateTo} />}
        {tab === 'tasbih' && <TasbihCounter />}
        {tab === 'library' && <LibraryScreen onNavigate={navigateTo} />}
        {tab === 'reminders' && <RemindersScreen />}
        {tab === 'settings' && <SettingsScreen onExitGuest={() => setShowAuth(true)} />}
      </main>
      <BottomNav active={tab} onChange={navigateTo} />
      {showPermissionIntro && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-5" style={{ background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(8px)' }}>
          <section role="dialog" aria-modal="true" aria-labelledby="noor-permission-title" className="w-full max-w-sm rounded-3xl p-6 shadow-2xl" style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: 'color-mix(in srgb, var(--primary) 15%, transparent)', color: 'var(--primary)' }}><Bell size={27} /></div>
            <h2 id="noor-permission-title" className="text-center text-xl font-bold mb-2">اجازه بده نور به‌موقع خبرت کند</h2>
            <p className="text-center text-sm leading-7 opacity-80 mb-5">برای اینکه یادآوری‌ها زنگ بزنند و وقت نماز را از دست ندهی، اجازهٔ اعلان لازم است. پخش خودکار اذان جداگانه فعال می‌شود و صدای انتخابی خودت را دارد.</p>
            <div className="space-y-3 mb-5 text-sm">
              <div className="flex items-start gap-3"><Volume2 size={19} className="mt-0.5 shrink-0" style={{ color: 'var(--primary)' }} /><p>یادآوری‌ها با صدای اعلان گوشی هشدار می‌دهند.</p></div>
              <div className="flex items-start gap-3"><ShieldCheck size={19} className="mt-0.5 shrink-0" style={{ color: 'var(--primary)' }} /><p>برای هشدار دقیق و نمایش روی صفحهٔ قفل، ممکن است اجازه‌های جداگانهٔ اندروید هم لازم باشد.</p></div>
            </div>
            {permissionIntroMessage && <p role="status" className="text-sm leading-6 mb-3" style={{ color: 'var(--primary)' }}>{permissionIntroMessage}</p>}
            <button type="button" onClick={() => void allowNotificationsFromIntro()} className="w-full rounded-2xl py-3 font-bold text-white" style={{ background: 'var(--primary)' }}>اجازه می‌دهم</button>
            <button type="button" onClick={dismissPermissionIntro} className="w-full rounded-2xl py-3 mt-2 text-sm opacity-70">فعلاً نه</button>
          </section>
        </div>
      )}
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
