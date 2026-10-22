
import { useState, useEffect } from 'react';
import { Palette, Volume2, Bell, LogOut, User, Check, LogIn, MapPin, AlertCircle } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { themes } from '@/lib/themes';
import { adhans } from '@/lib/adhans';
import { CITIES, getCityById, getGuestCityId, setGuestCityId, type City } from '@/lib/cities';
import { cancelAllScheduledNotifications, rescheduleAllReminders, checkPermission, requestPermission } from '@/lib/reminderService';
import { getAvailableMethods } from '@/lib/prayerTimes';

const GUEST_NOTIF_KEY = 'noor_guest_notif_enabled';
const GUEST_ADHAN_KEY = 'noor_guest_adhan_id';

function getGuestAdhanId(): string {
  try { return localStorage.getItem(GUEST_ADHAN_KEY) || 'default'; } catch { return 'default'; }
}

function getGuestNotifEnabled(): boolean {
  try {
    return localStorage.getItem(GUEST_NOTIF_KEY) === 'true';
  } catch {
    return false;
  }
}

function setGuestNotifEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(GUEST_NOTIF_KEY, enabled ? 'true' : 'false');
  } catch {
    // ignore
  }
}

export function SettingsScreen({ onExitGuest }: { onExitGuest?: () => void }) {
  const { theme, themeId, setThemeId } = useTheme();
  const { profile, signOut, updateProfile, user } = useAuth();
  const [section, setSection] = useState<'main' | 'theme' | 'adhan' | 'city' | 'method'>('main');
  const [guestCityId, setGuestCityIdState] = useState(getGuestCityId());
  const [guestNotif, setGuestNotif] = useState(getGuestNotifEnabled());
  const [guestAdhanId, setGuestAdhanId] = useState(getGuestAdhanId());
  const [notifSupported, setNotifSupported] = useState(true);
  const [notifMessage, setNotifMessage] = useState<string | null>(null);

  useEffect(() => {
    setNotifSupported(Capacitor.isNativePlatform());
    if (Capacitor.isNativePlatform()) {
      void checkPermission().then((permission) => {
        if (permission !== 'granted' && (profile?.notif_enabled ?? getGuestNotifEnabled())) {
          setNotifMessage('اعلان‌ها روشن‌اند، اما اجازهٔ اندروید هنوز داده نشده است. برای فعال‌کردن واقعی، دکمهٔ اجازه را بزن.');
        }
      });
    }
  }, [profile?.notif_enabled]);

  const notifEnabled = profile?.notif_enabled ?? guestNotif;

  const toggleNotifications = async () => {
    setNotifMessage(null);
    const next = !notifEnabled;

    if (next && Capacitor.isNativePlatform()) {
      let permission = await checkPermission();
      if (permission !== 'granted') permission = await requestPermission();

      if (permission !== 'granted') {
        setNotifMessage('مجوز اعلان داده نشد؛ یادآوری‌ها هنوز ارسال نمی‌شوند. از تنظیمات گوشی، اعلان‌های نور را مجاز کن.');
        return;
      }
    }

    if (profile) {
      await updateProfile({ notif_enabled: next });
    } else {
      setGuestNotifEnabled(next);
      setGuestNotif(next);
    }

    if (next) {
      const result = await rescheduleAllReminders(true);

      if (result.failed > 0) {
        setNotifMessage(
          `از ${result.total} یادآوری ذخیره‌شده، ${result.succeeded} مورد زمان‌بندی شد و ${result.failed} مورد ناموفق بود. تنظیمات اعلان و آلارم دقیق گوشی را بررسی کن.`
        );
      } else {
        setNotifMessage(
          `${result.succeeded} یادآوری دوباره زمان‌بندی شد. توجه: این تنظیم به‌تنهایی پخش فایل صوتی اذان را تضمین نمی‌کند.`
        );
      }
    } else {
      await cancelAllScheduledNotifications();
      setNotifMessage('اعلان‌های یادآوری خاموش شدند.');
    }
  };

  const requestNotificationAccess = async () => {
    const permission = await requestPermission();

    if (permission === 'granted') {
      if (profile) {
        await updateProfile({ notif_enabled: true });
      } else {
        setGuestNotifEnabled(true);
        setGuestNotif(true);
      }

      const result = await rescheduleAllReminders(true);

      if (result.failed > 0) {
        setNotifMessage(
          `اجازهٔ اعلان داده شد؛ ${result.succeeded} یادآوری زمان‌بندی شد و ${result.failed} مورد ناموفق بود. تنظیمات اعلان و آلارم دقیق اندروید را بررسی کن.`
        );
      } else {
        setNotifMessage(
          `اجازهٔ اعلان داده شد؛ ${result.succeeded} یادآوری زمان‌بندی شد.`
        );
      }
    } else {
      setNotifMessage('اندروید اجازه را نداد. از تنظیمات گوشی ← برنامه‌ها ← نور ← اعلان‌ها آن را فعال کن.');
    }
  };

  const currentCityId = profile?.city_id ?? guestCityId;
  const currentCity = getCityById(currentCityId);

  const applyCity = async (id: string) => {
    if (profile) {
      await updateProfile({ city_id: id });
    } else {
      setGuestCityId(id);
      setGuestCityIdState(id);
    }
  };

  const applyTheme = async (id: string) => {
    setThemeId(id);
    if (profile) {
      await updateProfile({ theme_id: id });
    }
  };

  const applyAdhan = async (id: string) => {
    if (profile) {
      await updateProfile({ adhan_id: id });
    } else {
      try { localStorage.setItem(GUEST_ADHAN_KEY, id); } catch { /* ignore unavailable storage */ }
      setGuestAdhanId(id);
    }
  };

  const applyMethod = async (id: string) => {
    if (profile) {
      await updateProfile({ calculation_method: id });
    }
  };

  const currentMethod = profile?.calculation_method ?? 'jafari';
  const methods = getAvailableMethods();

  if (section === 'theme') {
    return (
      <div className="px-5 pt-6 pb-28 animate-fade-in">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => setSection('main')} className="text-muted text-sm">بازگشت</button>
          <h1 className="text-2xl font-bold text-app">پوسته‌ها</h1>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => applyTheme(t.id)}
              className="card-flat p-4 text-right relative overflow-hidden"
              style={{ borderColor: themeId === t.id ? t.primary : theme.border }}
            >
              <div className="w-full h-20 rounded-xl mb-3" style={{ background: t.gradient }} />
              <p className="text-app font-bold text-sm">{t.nameFa}</p>
              <p className="text-muted text-xs">{t.name}</p>
              {themeId === t.id && (
                <div className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: t.primary }}>
                  <Check size={14} color={t.bg} />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (section === 'city') {
    const grouped = CITIES.reduce<Record<string, City[]>>((acc, c) => {
      (acc[c.countryFa] ??= []).push(c);
      return acc;
    }, {});

    return (
      <div className="px-5 pt-6 pb-28 animate-fade-in">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => setSection('main')} className="text-muted text-sm">بازگشت</button>
          <h1 className="text-2xl font-bold text-app">انتخاب شهر</h1>
        </div>
        <p className="text-muted text-xs mb-4">شهر خود را برای محاسبه اوقات شرعی انتخاب کنید</p>
        {Object.entries(grouped).map(([country, cities]) => (
          <div key={country} className="mb-5">
            <p className="text-muted text-xs font-semibold mb-2">{country}</p>
            <div className="space-y-2">
              {cities.map((c) => (
                <button
                  key={c.id}
                  onClick={() => applyCity(c.id)}
                  className="w-full card-flat p-4 flex items-center justify-between"
                  style={{ borderColor: currentCityId === c.id ? theme.primary : theme.border }}
                >
                  <div>
                    <p className="text-app font-medium text-sm">{c.nameFa}</p>
                    <p className="text-muted text-xs" dir="ltr">{c.timezone}</p>
                  </div>
                  {currentCityId === c.id && (
                    <Check size={18} color={theme.primary} />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (section === 'method') {
    return (
      <div className="px-5 pt-6 pb-28 animate-fade-in">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => setSection('main')} className="text-muted text-sm">بازگشت</button>
          <h1 className="text-2xl font-bold text-app">روش محاسبه</h1>
        </div>
        <p className="text-muted text-xs mb-4">روش محاسبه اوقات شرعی را انتخاب کنید</p>
        <div className="space-y-2">
          {methods.map((m) => (
            <button
              key={m.id}
              onClick={() => applyMethod(m.id)}
              className="w-full card-flat p-4 flex items-center justify-between"
              style={{ borderColor: currentMethod === m.id ? theme.primary : theme.border }}
            >
              <p className="text-app font-medium text-sm">{m.name}</p>
              {currentMethod === m.id && (
                <Check size={18} color={theme.primary} />
              )}
            </button>
          ))}
        </div>
        {!profile && (
          <p className="text-muted text-xs mt-4 opacity-60">
            برای ذخیره روش محاسبه باید وارد حساب شوید. در حالت مهمان، روش جعفری استفاده می‌شود.
          </p>
        )}
      </div>
    );
  }

  if (section === 'adhan') {
    return (
      <div className="px-5 pt-6 pb-28 animate-fade-in">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => setSection('main')} className="text-muted text-sm">بازگشت</button>
          <h1 className="text-2xl font-bold text-app">اذان‌ها</h1>
        </div>
        <p className="text-muted text-xs mb-4">اذان‌های شیعه ایرانی</p>
        <div className="space-y-2">
          {adhans.map((a) => (
            <button
              key={a.id}
              onClick={() => applyAdhan(a.id)}
              className="w-full card-flat p-4 flex items-center justify-between"
              style={{ borderColor: (profile?.adhan_id ?? guestAdhanId) === a.id ? theme.primary : theme.border }}
            >
              <div>
                <p className="text-app font-medium text-sm">{a.nameFa}</p>
                <p className="text-muted text-xs">{a.reciter}</p>
              </div>
              {(profile?.adhan_id ?? guestAdhanId) === a.id && (
                <Check size={18} color={theme.primary} />
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pt-6 pb-28 animate-fade-in">
      <h1 className="text-2xl font-bold text-app mb-6">تنظیمات</h1>

      <div className="card p-5 mb-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: theme.primary }}>
          <User size={24} color={theme.bg} />
        </div>
        <div className="flex-1">
          <p className="text-app font-bold">{profile?.display_name || (user ? 'کاربر' : 'مهمان')}</p>
          <p className="text-muted text-xs" dir="ltr">{user?.email || 'حالت آفلاین'}</p>
        </div>
      </div>

      <div className="space-y-2">
        <button onClick={() => setSection('theme')} className="w-full card-flat p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Palette size={20} color={theme.primary} />
            <span className="text-app font-medium text-sm">پوسته و رنگ</span>
          </div>
          <span className="text-muted text-xs">{themes.find((t) => t.id === themeId)?.nameFa}</span>
        </button>

        <button onClick={() => setSection('city')} className="w-full card-flat p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin size={20} color={theme.primary} />
            <span className="text-app font-medium text-sm">شهر و موقعیت</span>
          </div>
          <span className="text-muted text-xs">{currentCity.nameFa}</span>
        </button>

        <button onClick={() => setSection('method')} className="w-full card-flat p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin size={20} color={theme.primary} />
            <span className="text-app font-medium text-sm">روش محاسبه</span>
          </div>
          <span className="text-muted text-xs">{methods.find((m) => m.id === currentMethod)?.name}</span>
        </button>

        <button onClick={() => setSection('adhan')} className="w-full card-flat p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Volume2 size={20} color={theme.primary} />
            <span className="text-app font-medium text-sm">صدای اذان</span>
          </div>
          <span className="text-muted text-xs">{adhans.find((a) => a.id === (profile?.adhan_id ?? guestAdhanId))?.nameFa}</span>
        </button>

        <div className="card-flat p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell size={20} color={theme.primary} />
              <span className="text-app font-medium text-sm">اعلان‌های یادآوری</span>
            </div>
            <button
              onClick={toggleNotifications}
              className="w-11 h-6 rounded-full transition-all relative"
              style={{ background: notifEnabled ? theme.primary : `color-mix(in srgb, ${theme.textMuted} 25%, transparent)` }}
            >
              <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ right: notifEnabled ? '2px' : '22px' }} />
            </button>
          </div>
          {!notifSupported && (
            <div className="flex items-start gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${theme.border}` }}>
              <AlertCircle size={14} color={theme.accent} className="flex-shrink-0 mt-0.5" />
              <p className="text-muted text-xs leading-relaxed">
                اعلان زمان‌بندی‌شده فقط در نسخه اندروید کار می‌کند. در مرورگر، یادآوری‌ها فقط وقتی برنامه باز است نمایش داده می‌شوند.
              </p>
            </div>
          )}
          {notifMessage && (
            <div className="mt-3 p-3 rounded-xl" style={{ background: `color-mix(in srgb, ${theme.accent} 10%, transparent)`, border: `1px solid ${theme.border}` }}>
              <p className="text-muted text-xs leading-relaxed">{notifMessage}</p>
              {notifSupported && (
                <button type="button" onClick={requestNotificationAccess} className="mt-2 text-sm font-bold" style={{ color: theme.primary }}>
                  بررسی / درخواست اجازهٔ اعلان
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {user ? (
        <button onClick={signOut} className="w-full mt-6 py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-medium" style={{ background: 'rgba(239,68,68,0.12)', color: '#fca5a5' }}>
          <LogOut size={18} /> خروج از حساب
        </button>
      ) : onExitGuest ? (
        <button onClick={onExitGuest} className="w-full mt-6 py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold" style={{ background: theme.primary, color: theme.bg }}>
          <LogIn size={18} /> ورود به حساب
        </button>
      ) : null}
    </div>
  );
}
