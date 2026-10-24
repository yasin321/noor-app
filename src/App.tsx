import { useState, useEffect } from 'react';
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
import { getGuestCityId } from '@/lib/cities';

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

  const tabOrder: Tab[] = ['home', 'tasbih', 'library', 'reminders', 'settings'];
  const navigateTo = (nextTab: Tab) => {
    if (nextTab === tab) return;
    setNavigationDirection(tabOrder.indexOf(nextTab) >= tabOrder.indexOf(tab) ? 'forward' : 'backward');
    setTab(nextTab);
  };

  const notifEnabled = profile?.notif_enabled ?? getGuestNotifEnabled();

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
