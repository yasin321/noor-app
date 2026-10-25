import { useState, useEffect } from 'react';
import { Bell, Volume2, ShieldCheck } from 'lucide-react';
import { LocalNotifications } from '@capacitor/local-notifications';
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
  const [showExactAlarmIntro, setShowExactAlarmIntro] = useState(false);
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
    if (Capacitor.getPlatform() === 'android') {
      try {
        const { exact_alarm } = await LocalNotifications.checkExactNotificationSetting();
        if (exact_alarm !== 'granted') {
          // Explain the separate Android Settings screen before opening it.
          setShowPermissionIntro(false);
          setShowExactAlarmIntro(true);
          return;
        }
      } catch {
        // Keep the app usable; SettingsScreen explains how to grant exact-alarm access.
      }
    }
    try { localStorage.setItem('noor_permission_intro_seen', 'true'); } catch { /* ignore */ }
    setShowPermissionIntro(false);
    const result = await rescheduleAll(notifEnabled);
    if (result.failed > 0) {
      // The permission dialog has closed; the Settings screen provides actionable diagnostics.
      console.info(`Noor reminders scheduled: ${result.succeeded}; failed: ${result.failed}`);
    }
  };

  const dismissPermissionIntro = () => {
    try { localStorage.setItem('noor_permission_intro_seen', 'true'); } catch { /* ignore */ }
    setShowPermissionIntro(false);
  };

  const allowExactAlarmFromIntro = async () => {
    try {
      await LocalNotifications.changeExactNotificationSetting();
    } catch {
      // The user can enable this later from Settings; do not block the app.
    }
    try { localStorage.setItem('noor_permission_intro_seen', 'true'); } catch { /* ignore */ }
    setShowExactAlarmIntro(false);
    // The app remains usable even if the user chooses not to grant exact alarms.
    const result = await rescheduleAll(notifEnabled);
    if (result.failed > 0) {
      console.info(`Noor reminders scheduled after permission flow: ${result.succeeded}; failed: ${result.failed}`);
    }
  };

  const dismissExactAlarmIntro = () => {
    try { localStorage.setItem('noor_permission_intro_seen', 'true'); } catch { /* ignore */ }
    setShowExactAlarmIntro(false);
  };

  const tabOrder: Tab[] = ['home', 'tasbih', 'library', 'reminders', 'settings'];
  const navigateTo = (nextTab: Tab) => {
    if (nextTab === tab) return;
    setNavigationDirection(tabOrder.indexOf(nextTab) >= tabOrder.indexOf(tab) ? 'forward' : 'backward');
    setTab(nextTab);
  };

  const notifEnabled = profile?.notif_enabled ?? getGuestNotifEnabled();

  // Android Settings does not return the permission result to this web layer.
  // Re-check permissions when Noor becomes visible again, then retry scheduling.
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return;

    let active = true;
    let checking = false;
    const refreshPermissionsAfterReturn = async () => {
      if (document.visibilityState !== 'visible' || checking) return;
      checking = true;
      try {
        const permission = await checkPermission();
        if (!active || permission !== 'granted') return;

        let exactAlarmAllowed = true;
        try {
          const { exact_alarm } = await LocalNotifications.checkExactNotificationSetting();
          exactAlarmAllowed = exact_alarm === 'granted';
        } catch {
          // Older Android/plugin combinations may not expose this check reliably.
        }
        if (!active || !exactAlarmAllowed) return;

        const result = await rescheduleAll(notifEnabled);
        if (result.failed > 0) {
          console.info(`Noor reminders rescheduled after returning from Android Settings: ${result.succeeded} succeeded; ${result.failed} failed`);
        }
      } catch (error) {
        console.info('Noor could not refresh reminder permissions after returning from Android Settings', error);
      } finally {
        checking = false;
      }
    };

    document.addEventListener('visibilitychange', refreshPermissionsAfterReturn);
    window.addEventListener('focus', refreshPermissionsAfterReturn);
    return () => {
      active = false;
      document.removeEventListener('visibilitychange', refreshPermissionsAfterReturn);
      window.removeEventListener('focus', refreshPermissionsAfterReturn);
    };
  }, [loading, notifEnabled]);

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
      {showExactAlarmIntro && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-5" style={{ background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(8px)' }}>
          <section role="dialog" aria-modal="true" aria-labelledby="noor-exact-alarm-title" className="w-full max-w-sm rounded-3xl p-6 shadow-2xl" style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: 'color-mix(in srgb, var(--primary) 15%, transparent)', color: 'var(--primary)' }}><ShieldCheck size={27} /></div>
            <h2 id="noor-exact-alarm-title" className="text-center text-xl font-bold mb-2">برای یادآوری سرِ وقت 🌿</h2>
            <p className="text-center text-sm leading-7 opacity-80 mb-5">مجوز اعلان فعال شد. برای اینکه یادآوری‌های زمان‌بندی‌شده دقیق‌تر اجرا شوند، اندروید ممکن است اجازهٔ جداگانهٔ «آلارم‌ها و یادآوری‌ها» بخواهد. این مرحله در تنظیمات گوشی انجام می‌شود و اختیاری است.</p>
            <button type="button" onClick={() => void allowExactAlarmFromIntro()} className="w-full rounded-2xl py-3 font-bold text-white" style={{ background: 'var(--primary)' }}>رفتن به تنظیمات</button>
            <button type="button" onClick={dismissExactAlarmIntro} className="w-full rounded-2xl py-3 mt-2 text-sm opacity-70">بعداً انجام می‌دهم</button>
          </section>
        </div>
      )}
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
