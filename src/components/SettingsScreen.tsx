import { useState, useEffect } from 'react';
import { Palette, Volume2, Bell, LogOut, User, Check, LogIn, MapPin, AlertCircle } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { themes } from '@/lib/themes';
import { adhans } from '@/lib/adhans';
import { CITIES, getCityById, getGuestCityId, setGuestCityId, type City } from '@/lib/cities';
import { cancelAllScheduledNotifications, rescheduleAllReminders, checkPermission, requestPermission } from '@/lib/reminderService';
import { getAvailableMethods } from '@/lib/prayerTimes';
import {
  PRAYER_ADHAN_ENABLED_KEY,
  syncPrayerAdhanAlarms,
  checkPrayerAdhanExactAlarmAccess,
  openPrayerAdhanExactAlarmSettings,
  checkPrayerAdhanFullScreenAccess,
  openPrayerAdhanFullScreenSettings,
  checkPrayerExactAlarmAccess,
  openPrayerExactAlarmSettings,
} from '@/lib/prayerAdhan';

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
  const [prayerAdhanEnabled, setPrayerAdhanEnabled] = useState(() => {
    try { return localStorage.getItem(PRAYER_ADHAN_ENABLED_KEY) === 'true'; } catch { return false; }
  });
  const [prayerAdhanMessage, setPrayerAdhanMessage] = useState<string | null>(null);
  const [fullScreenAllowed, setFullScreenAllowed] = useState(false);
  const [exactAlarmAllowed, setExactAlarmAllowed] = useState(false);
  const [exactAlarmAllowed, setExactAlarmAllowed] = useState(false);

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

      if (Capacitor.getPlatform() === 'android') {
        try {
          const { exact_alarm } = await LocalNotifications.checkExactNotificationSetting();
          if (exact_alarm !== 'granted') {
            setNotifMessage('برای یادآوری دقیق، دسترسی «آلارم‌ها و یادآوری‌ها» را هم فعال کن.');
            return;
          }
        } catch {
          setNotifMessage('وضعیت آلارم دقیق بررسی نشد. از تنظیمات اندروید، دسترسی «آلارم‌ها و یادآوری‌ها» را بررسی کن.');
          return;
        }
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
    setNotifMessage(null);
    let permission = await checkPermission();
    if (permission !== 'granted') permission = await requestPermission();

    if (permission !== 'granted') {
      setNotifMessage('اندروید اجازهٔ اعلان را نداد. از تنظیمات گوشی ← برنامه‌ها ← نور ← اعلان‌ها آن را فعال کن.');
      return;
    }

    if (Capacitor.getPlatform() === 'android') {
      try {
        let { exact_alarm } = await LocalNotifications.checkExactNotificationSetting();
        if (exact_alarm !== 'granted') {
          const result = await LocalNotifications.changeExactNotificationSetting();
          exact_alarm = result.exact_alarm;
        }

        if (exact_alarm !== 'granted') {
          setNotifMessage('دسترسی آلارم دقیق هنوز فعال نیست. آن را در صفحهٔ تنظیمات اندروید فعال کن و دوباره بررسی را بزن.');
          return;
        }
      } catch {
        setNotifMessage('نتوانستم صفحهٔ دسترسی آلارم دقیق را باز یا بررسی کنم. از تنظیمات گوشی ← برنامه‌ها ← نور ← آلارم‌ها و یادآوری‌ها بررسی کن.');
        return;
      }
    }

    if (profile) {
      await updateProfile({ notif_enabled: true });
    } else {
      setGuestNotifEnabled(true);
      setGuestNotif(true);
    }

    const result = await rescheduleAllReminders(true);

    if (result.failed > 0) {
      setNotifMessage(
        `اجازه‌ها بررسی شد؛ ${result.succeeded} یادآوری زمان‌بندی شد و ${result.failed} مورد ناموفق بود. تنظیمات اعلان و آلارم دقیق اندروید را بررسی کن.`
      );
    } else {
      setNotifMessage(`اجازه‌ها بررسی شد؛ ${result.succeeded} یادآوری زمان‌بندی شد.`);
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
  const selectedAdhanId = profile?.adhan_id ?? guestAdhanId;
  const selectedAdhan = adhans.find((item) => item.id === selectedAdhanId);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return;
    void checkPrayerAdhanFullScreenAccess().then(setFullScreenAllowed);
    void checkPrayerExactAlarmAccess().then(setExactAlarmAllowed);
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return;
    let cancelled = false;
    void syncPrayerAdhanAlarms({
      enabled: prayerAdhanEnabled,
      city: currentCity,
      method: currentMethod,
      adhanId: selectedAdhanId,
      audioUrl: selectedAdhan?.audioUrl,
    }).then((result) => {
      if (cancelled) return;
      if (!prayerAdhanEnabled) {
        setPrayerAdhanMessage('پخش خودکار اذان خاموش است؛ یادآوری‌های معمولی جداگانه کار می‌کنند.');
      } else if (result.error) {
        setPrayerAdhanMessage(result.error);
      } else {
        setPrayerAdhanMessage(String(result.scheduled) + ' زمان اذان برای ۳۰ روز آینده زمان‌بندی شد.');
      }
    }).catch((error) => {
      if (!cancelled) setPrayerAdhanMessage('زمان‌بندی اذان ناموفق بود: ' + String(error));
    });
    return () => { cancelled = true; };
  }, [prayerAdhanEnabled, currentCity, currentMethod, selectedAdhanId, selectedAdhan?.audioUrl]);

  const togglePrayerAdhan = () => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
      setPrayerAdhanMessage('پخش خودکار اذان فقط در نسخهٔ اندروید پشتیبانی می‌شود.');
      return;
    }
    const next = !prayerAdhanEnabled;
    if (next && !exactAlarmAllowed) {
      setPrayerAdhanMessage('برای پخش دقیق اذان، ابتدا اجازهٔ «آلارم‌ها و یادآوری‌ها» را در اندروید فعال کن.');
      void openPrayerAdhanExactAlarmSettings().catch(() => setPrayerAdhanMessage('تنظیمات آلارم دقیق باز نشد؛ از تنظیمات گوشی ← برنامه‌ها ← نور ← آلارم‌ها و یادآوری‌ها آن را فعال کن.'));
      return;
    }
    try { localStorage.setItem(PRAYER_ADHAN_ENABLED_KEY, String(next)); } catch { /* storage unavailable */ }
    setPrayerAdhanEnabled(next);
    setPrayerAdhanMessage(next
      ? 'در حال زمان‌بندی اذان‌ها؛ باید فایل صوتی واقعی برای صدای انتخاب‌شده موجود باشد.'
      : 'پخش خودکار اذان خاموش شد.');
  };

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
        <p className="text-muted text-xs mb-3">انتخاب صدا و شنیدن نمونهٔ اذان‌های ایرانی</p>
        <p className="text-muted text-xs mb-4 leading-relaxed">پخش خودکار اذان از زنگ یادآوری جداست. در حال حاضر فقط صدای ماهور فایل آنلاین قابل استفاده دارد؛ برای پخش، اینترنت لازم است.</p>
        <div className="card-flat p-4 mb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <p className="text-app font-semibold text-sm">پخش خودکار در وقت نماز</p>
              <p className="text-muted text-xs mt-1">فقط فایل اذان انتخاب‌شده پخش می‌شود؛ صدای زنگ جایگزین اذان نخواهد شد.</p>
            </div>
            <button type="button" role="switch" aria-checked={prayerAdhanEnabled} onClick={togglePrayerAdhan}
              className="w-12 h-7 rounded-full relative flex-shrink-0"
              style={{ background: prayerAdhanEnabled ? theme.primary : theme.border }}>
              <span className="absolute top-1 w-5 h-5 rounded-full bg-white transition-all" style={{ right: prayerAdhanEnabled ? '3px' : '23px' }} />
            </button>
          </div>
          {prayerAdhanMessage && <p className="text-muted text-xs mt-3 leading-relaxed">{prayerAdhanMessage}</p>}
          {Capacitor.getPlatform() === 'android' && !exactAlarmAllowed && (
            <button type="button"
              onClick={() => void openPrayerExactAlarmSettings().then(() => setPrayerAdhanMessage('در تنظیمات اندروید، اجازهٔ «آلارم‌ها و یادآوری‌ها» را فعال کن؛ بعد به نور برگرد.')).catch(() => setPrayerAdhanMessage('تنظیمات آلارم دقیق باز نشد. از تنظیمات گوشی ← برنامه‌ها ← نور ← آلارم‌ها و یادآوری‌ها را فعال کن.'))}
              className="mt-3 w-full rounded-xl p-3 text-sm font-semibold"
              style={{ background: 'color-mix(in srgb, ' + theme.primary + ' 12%, transparent)', color: theme.primary }}>
              اجازهٔ زمان‌بندی دقیق اذان
            </button>
          )}
          {Capacitor.getPlatform() === 'android' && !fullScreenAllowed && (
            <button type="button"
              onClick={() => void openPrayerAdhanFullScreenSettings().then(() => setPrayerAdhanMessage('اجازهٔ نمایش تمام‌صفحه را در تنظیمات اندروید فعال کن و سپس به برنامه برگرد.')).catch(() => setPrayerAdhanMessage('تنظیمات نمایش تمام‌صفحه باز نشد؛ از تنظیمات برنامهٔ نور بررسی کن.'))}
              className="mt-3 w-full rounded-xl p-3 text-sm font-semibold"
              style={{ background: 'color-mix(in srgb, ' + theme.primary + ' 12%, transparent)', color: theme.primary }}>
              اجازهٔ نمایش آلارم روی صفحهٔ قفل
            </button>
          )}
        </div>
        <div className="space-y-3">
          {adhans.map((a) => (
            <div
              key={a.id}
              className="w-full card-flat p-4"
              style={{ borderColor: (profile?.adhan_id ?? guestAdhanId) === a.id ? theme.primary : theme.border }}
            >
              <button
                type="button"
                onClick={() => a.audioUrl && applyAdhan(a.id)}
                disabled={!a.audioUrl}
                aria-label={a.audioUrl ? `انتخاب ${a.nameFa}` : `${a.nameFa}، فایل صوتی هنوز آماده نیست`}
                className="w-full flex items-center justify-between text-right disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div>
                  <p className="text-app font-medium text-sm">{a.nameFa}</p>
                  <p className="text-muted text-xs mt-1">{a.reciter}</p>
                  {!a.audioUrl && <p className="text-muted text-[11px] mt-1">به‌زودی؛ فایل صوتی هنوز آماده نیست</p>}
                </div>
                {(profile?.adhan_id ?? guestAdhanId) === a.id && (
                  <Check size={18} color={theme.primary} />
                )}
              </button>
              {a.audioUrl ? (
                <div className="mt-3">
                  <audio controls preload="none" src={a.audioUrl} className="w-full" aria-label={`نمونهٔ صوتی ${a.nameFa}`} />
                  <p className="text-muted text-xs mt-2 leading-relaxed">
                    مجوز: {a.license}. صاحب اثر: {a.reciter}.
                    {' '}<a href={a.sourceUrl} target="_blank" rel="noreferrer" className="underline">منبع فایل</a>
                    {' '}· <a href={a.licenseUrl} target="_blank" rel="noreferrer" className="underline">متن مجوز</a>
                  </p>
                </div>
              ) : (
                <p className="text-muted text-xs mt-2">فایل صوتی این گزینه هنوز به‌صورت مجاز به برنامه اضافه نشده است.</p>
              )}
            </div>
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
