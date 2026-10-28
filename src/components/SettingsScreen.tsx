import { getQuranDisplayMode, setQuranDisplayMode, type QuranDisplayMode } from '@/lib/quranCatalog';
import { useState, useEffect } from 'react';
import { Palette, Volume2, Bell, LogOut, User, Check, LogIn, MapPin, AlertCircle } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { themes } from '@/lib/themes';
import { adhans, getDownloadedAdhanIds, syncNativeDownloadedAdhans, downloadAndCacheAdhan, playAdhanPreview, stopAdhanPreview, getAdhanDurationMode, setAdhanDurationMode, getAdhanDurationSeconds, type Adhan, type AdhanPlaybackDurationMode } from '@/lib/adhans';
import { CITIES, getCityById, getGuestCityId, setGuestCityId, type City } from '@/lib/cities';
import { cancelAllScheduledNotifications, rescheduleAllReminders, checkPermission, requestPermission, NoorAlarm } from '@/lib/reminderService';
import { getAvailableMethods } from '@/lib/prayerTimes';
import { getSpiritualDashboardStats, type PeriodRange } from '@/lib/tasbihStorage';
import { getDhikr } from '@/lib/dhikrLibrary';
import { AppTutorialModal } from '@/components/AppTutorialModal';
import { VipAndAnalyticsModal } from '@/components/VipAndAnalyticsModal';
import { getDiagnosticLogs, clearDiagnosticLogs, type AppLogEntry } from '@/lib/logger';

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
  const [citySearch, setCitySearch] = useState("");
  const [guestNotif, setGuestNotif] = useState(getGuestNotifEnabled());
  const [guestAdhanId, setGuestAdhanId] = useState(getGuestAdhanId());
  const [downloadedAdhans, setDownloadedAdhans] = useState<string[]>(() => getDownloadedAdhanIds());
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [adhanNotice, setAdhanNotice] = useState<string | null>(null);
  const [quranViewMode, setQuranViewModeState] = useState<QuranDisplayMode>(() => getQuranDisplayMode());
  const [durationMode, setDurationModeState] = useState<AdhanPlaybackDurationMode>(() => getAdhanDurationMode());
  const [fontScale, setFontScale] = useState<string>(() => { try { return localStorage.getItem("noor_font_scale") || "normal"; } catch { return "normal"; } });
  const [showVipModal, setShowVipModal] = useState(false);
  const [fontFamily, setFontFamily] = useState<string>(() => {
    try { return localStorage.getItem('noor_font_family') || 'Vazirmatn'; } catch { return 'Vazirmatn'; }
  });
  const [notifSupported, setNotifSupported] = useState(true);
  const [notifMessage, setNotifMessage] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodRange>(30);
  const [showGuide, setShowGuide] = useState(false);
  const [largeFont, setLargeFont] = useState<boolean>(() => {
    try { return localStorage.getItem('noor_large_font_enabled') === 'true'; } catch { return false; }
  });
  const dash = getSpiritualDashboardStats(period);
  const topDhikrObj = getDhikr(dash.topDhikrId);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState<AppLogEntry[]>([]);

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

  useEffect(() => {
    const mapFont: Record<string, string> = {
      Vazirmatn: "'Vazirmatn', system-ui, sans-serif",
      Estedad: "'Estedad', 'Vazirmatn', sans-serif",
      Parastoo: "'Parastoo', 'Vazirmatn', serif",
      Shabnam: "'Shabnam', 'Vazirmatn', sans-serif",
      Samim: "'Samim', 'Vazirmatn', sans-serif",
      AmiriQuran: "'Amiri', 'Parastoo', 'Vazirmatn', serif",
    };
    const chosen = mapFont[fontFamily] ?? mapFont.Vazirmatn;
    document.documentElement.style.setProperty('--app-font', chosen);
    document.body.style.fontFamily = chosen;
    try { localStorage.setItem('noor_font_family', fontFamily); } catch {}
  }, [fontFamily]);

  useEffect(() => {
    const sizeMap: Record<string, string> = {
      normal: '16px',
      medium: '17.5px',
      senior: '19.5px',
    };
    document.documentElement.style.fontSize = sizeMap[fontScale] ?? '16px';
    try { localStorage.setItem('noor_font_scale', fontScale); } catch {}
  }, [fontScale]);

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

  const [guestMethod, setGuestMethod] = useState(() => {
    try { return localStorage.getItem('noor_guest_calc_method') || 'jafari'; } catch { return 'jafari'; }
  });
  const applyMethod = async (id: string) => {
    try { localStorage.setItem('noor_guest_calc_method', id); } catch {}
    setGuestMethod(id);
    if (profile) {
      await updateProfile({ calculation_method: id });
    }
  };

  const currentMethod = profile?.calculation_method ?? guestMethod;
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
    const filteredCities = CITIES.filter((c) => !citySearch.trim() || c.nameFa.includes(citySearch.trim()) || c.name.toLowerCase().includes(citySearch.trim().toLowerCase()));
    const grouped = filteredCities.reduce<Record<string, City[]>>((acc, c) => {
      (acc[c.countryFa] ??= []).push(c);
      return acc;
    }, {});

    return (
      <div className="px-5 pt-6 pb-28 animate-fade-in">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => setSection('main')} className="text-muted text-sm">بازگشت</button>
          <h1 className="text-2xl font-bold text-app">انتخاب شهر</h1>
        </div>
        <p className="text-muted text-xs mb-3">شهر خود را برای محاسبه اوقات شرعی جستجو یا انتخاب کنید</p>
        <input
          type="text"
          value={citySearch}
          onChange={(e) => setCitySearch(e.target.value)}
          placeholder="🔍 جستجوی نام شهر (مثلاً: مشهد، تهران، قم، کربلا...)"
          className="w-full px-4 py-3 rounded-2xl text-xs text-app border outline-none mb-4"
          style={{ borderColor: theme.border, background: theme.surface }}
        />
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
    const selectedId = profile?.adhan_id ?? guestAdhanId;

    const handleChangeDurationMode = (m: AdhanPlaybackDurationMode) => {
      setDurationModeState(m);
      setAdhanDurationMode(m);
      const label = m === '10s' ? '۱۰ ثانیه اول (خلاصه)' : m === '30s' ? '۳۰ ثانیه اول (ملایم)' : 'پخش کامل اذان';
      setAdhanNotice(`✨ مدت پخش اذان روی «${label}» تنظیم شد.`);
    };

    const handleDownloadAdhan = async (a: Adhan) => {
      setDownloadingId(a.id);
      setAdhanNotice(`در حال آماده‌سازی صدای ${a.reciter}...`);
      const res = await downloadAndCacheAdhan(a);
      const synced = await syncNativeDownloadedAdhans();
      setDownloadedAdhans(synced);
      setDownloadingId(null);
      if (res.ok) {
        await applyAdhan(a.id);
        setAdhanNotice(`✅ صدای «${a.reciter}» فعال و در گوشی ذخیره شد!`);
      }
    };

    const handlePreview = async (a: Adhan) => {
      if (previewingId === a.id) {
        stopAdhanPreview();
        setPreviewingId(null);
        return;
      }
      setPreviewingId(a.id);
      const dur = getAdhanDurationSeconds(durationMode);
      try {
        await playAdhanPreview(a, dur, 95);
        if (dur > 0) {
          setTimeout(() => {
            setPreviewingId((prev) => (prev === a.id ? null : prev));
          }, dur * 1000);
        }
      } catch {
        setPreviewingId(null);
      }
    };

    return (
      <div className="px-5 pt-6 pb-28 animate-fade-in" dir="rtl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-black text-app">تنظیمات صدای اذان و مؤذن</h1>
          <button
            type="button"
            onClick={() => {
              stopAdhanPreview();
              setPreviewingId(null);
              setSection('main');
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-bold border"
            style={{ borderColor: theme.border, color: theme.text }}
          >
            بازگشت →
          </button>
        </div>

        {adhanNotice && (
          <div
            className="mb-4 rounded-2xl px-4 py-3 text-xs font-bold text-center shadow-lg"
            style={{ background: theme.primary, color: theme.bg }}
          >
            {adhanNotice}
          </div>
        )}

        {/* کارت Figma-Grade انتخاب مدت زمان پخش اذان (حق انتخاب کامل یا ۱۰ ثانیه) */}
        <div
          className="mb-5 p-4 rounded-3xl border space-y-3"
          style={{
            borderColor: `color-mix(in srgb, ${theme.primary} 35%, ${theme.border})`,
            background: `radial-gradient(circle at top right, color-mix(in srgb, ${theme.primary} 14%, transparent), ${theme.surface})`,
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-app">⏱️ مدت زمان پخش در وقت اذان</h2>
              <p className="text-[11px] text-muted mt-0.5">
                انتخاب کنید موقع اذان، کل اذان پخش شود یا فقط ۱۰ ثانیه اول
              </p>
            </div>
          </div>

          <div
            className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl"
            style={{ background: theme.bg, border: `1px solid ${theme.border}` }}
          >
            {[
              { id: 'full' as AdhanPlaybackDurationMode, title: '🕌 اذان کامل', sub: 'پخش تا انتها' },
              { id: '10s' as AdhanPlaybackDurationMode, title: '⚡ ۱۰ ثانیه اول', sub: 'فقط تکبیر اول' },
              { id: '30s' as AdhanPlaybackDurationMode, title: '🌿 ۳۰ ثانیه اول', sub: 'نیمه اول اذان' },
            ].map((opt) => {
              const active = durationMode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleChangeDurationMode(opt.id)}
                  className="py-2.5 px-2 rounded-xl text-center transition-all"
                  style={{
                    background: active ? theme.primary : 'transparent',
                    color: active ? theme.bg : theme.text,
                    boxShadow: active ? `0 6px 16px color-mix(in srgb, ${theme.primary} 30%, transparent)` : 'none',
                  }}
                >
                  <span className="text-xs font-black block">{opt.title}</span>
                  <span
                    className="text-[10px] block mt-0.5"
                    style={{ color: active ? theme.bg : theme.textMuted, opacity: active ? 0.9 : 0.75 }}
                  >
                    {opt.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-xs font-bold text-muted mb-2.5 px-1">
          انتخاب صدای مؤذن ({durationMode === '10s' ? 'پخش ۱۰ ثانیه‌ای فعال است' : durationMode === '30s' ? 'پخش ۳۰ ثانیه‌ای فعال است' : 'پخش کامل فعال است'}):
        </p>

        <div className="space-y-3">
          {adhans.map((a) => {
            const isSelected = selectedId === a.id;
            const isDownloaded = downloadedAdhans.includes(a.id) || Boolean(a.bundledOffline);
            const isDownloading = downloadingId === a.id;
            const isPreviewing = previewingId === a.id;

            return (
              <div
                key={a.id}
                className="w-full card-flat p-4 transition-all"
                style={{
                  borderColor: isSelected ? theme.primary : theme.border,
                  background: isSelected ? `color-mix(in srgb, ${theme.primary} 8%, ${theme.surface})` : theme.surface,
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-app font-bold text-sm">{a.nameFa}</p>
                    <p className="text-primary text-xs font-semibold mt-0.5">{a.reciter}</p>
                    <p className="text-muted text-[11px] mt-0.5">{a.originFa}</p>
                  </div>
                  {isSelected && (
                    <span
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shrink-0"
                      style={{ background: theme.primary, color: theme.bg }}
                    >
                      <Check size={12} /> مؤذن فعال
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-3 pt-2.5 border-t" style={{ borderColor: theme.border }}>
                  <button
                    type="button"
                    onClick={() => void handlePreview(a)}
                    className="px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all"
                    style={{
                      borderColor: isPreviewing ? '#f87171' : theme.accent,
                      color: isPreviewing ? '#fca5a5' : theme.accent,
                    }}
                  >
                    {isPreviewing ? '⏹️ توقف پیش‌نمایش' : '▶️ شنیدن صدا'}
                  </button>

                  {!isDownloaded ? (
                    <button
                      type="button"
                      disabled={isDownloading}
                      onClick={() => void handleDownloadAdhan(a)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold"
                      style={{ background: theme.primary, color: theme.bg }}
                    >
                      {isDownloading ? 'در حال دریافت...' : '📥 دریافت و انتخاب مؤذن'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={async () => {
                        await applyAdhan(a.id);
                        setAdhanNotice(`✅ «${a.reciter}» به عنوان مؤذن اصلی انتخاب شد.`);
                      }}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold"
                      style={{
                        background: isSelected ? `color-mix(in srgb, ${theme.primary} 18%, transparent)` : theme.primary,
                        color: isSelected ? theme.primary : theme.bg,
                      }}
                    >
                      {isSelected ? '✓ انتخاب‌شده برای وقت اذان' : 'انتخاب این مؤذن'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pt-6 pb-28 animate-fade-in">
      {showGuide && <AppTutorialModal onClose={() => setShowGuide(false)} />}
      {showVipModal && <VipAndAnalyticsModal initialTab="vip" onClose={() => setShowVipModal(false)} />}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-app">تنظیمات و کارنامه من</h1>
        <button type="button" onClick={() => setShowGuide(true)} className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background: `color-mix(in srgb, ${theme.primary} 15%, transparent)`, color: theme.primary }}>راهنمای تصویری</button>
      </div>

      {/* داشبورد کارنامه معنوی من (سبک Power BI & Strava) */}
      <div className="card p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-bold text-primary">{dash.levelTitle}</p>
            <h2 className="text-sm font-bold text-app mt-0.5">داشبورد استمرار و کارنامه معنوی</h2>
          </div>
          <div className="flex gap-1">
            {([7, 30, 90] as PeriodRange[]).map((d) => (
              <button key={d} type="button" onClick={() => setPeriod(d)} className="px-2 py-1 rounded-lg text-[10px] font-bold" style={{ background: period === d ? theme.primary : `color-mix(in srgb, ${theme.primary} 10%, transparent)`, color: period === d ? theme.bg : theme.textMuted }}>
                {d === 7 ? '۷ روز' : d === 30 ? '۱ ماه' : '۳ ماه (فصلی)'}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center mb-3">
          <div className="card-flat p-2.5">
            <p className="text-lg font-black text-primary">{dash.totalCount.toLocaleString('fa-IR')}</p>
            <p className="text-[10px] text-muted">کل اذکار</p>
          </div>
          <div className="card-flat p-2.5">
            <p className="text-lg font-black text-accent">{dash.totalRounds.toLocaleString('fa-IR')}</p>
            <p className="text-[10px] text-muted">دور تسبیح</p>
          </div>
          <div className="card-flat p-2.5">
            <p className="text-lg font-black text-primary">{dash.streakDays.toLocaleString('fa-IR')} روز</p>
            <p className="text-[10px] text-muted">زنجیره تداوم 🔥</p>
          </div>
        </div>
        {topDhikrObj && (
          <p className="text-[11px] text-muted text-center">محبوب‌ترین ذکر شما در این بازه: <strong className="text-app">{topDhikrObj.arabic}</strong></p>
        )}
      </div>

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
        <div className="card-flat p-4 flex items-center justify-between">
          <div>
            <p className="text-app font-medium text-sm">درشت‌نمایی نوشته‌ها (ویژه مطالعه راحت)</p>
            <p className="text-muted text-[11px] mt-0.5">بزرگ‌تر شدن متون عربی و فارسی در کل برنامه</p>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = !largeFont;
              setLargeFont(next);
              document.documentElement.style.fontSize = next ? '18.5px' : '16px';
              try { localStorage.setItem('noor_large_font_enabled', next ? 'true' : 'false'); } catch {}
            }}
            className="w-11 h-6 rounded-full transition-all relative"
            style={{ background: largeFont ? theme.primary : `color-mix(in srgb, ${theme.textMuted} 25%, transparent)` }}
          >
            <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ right: largeFont ? '2px' : '22px' }} />
          </button>
        </div>

        <button type="button" onClick={() => setShowVipModal(true)} className="w-full card-flat p-4 flex items-center justify-between" style={{ borderColor: theme.accent }}>
          <span className="text-app font-bold text-sm">👑 داشبورد تحلیلی BI، نشان‌های افتخار و VIP</span>
          <span className="text-xs font-bold" style={{ color: theme.accent }}>مشاهده ←</span>
        </button>

        <div className="card-flat p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-app font-bold text-sm block">فونت و خوانایی نوشته‌ها (مناسب همه سنین)</span>
              <span className="text-muted text-[11px]">با لمس هر گزینه، فونت کل برنامه درجا تغییر می‌کند</span>
            </div>
            <span className="text-xs font-bold text-primary">{fontFamily}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'Vazirmatn', label: 'وزیرمتن (استاندارد مدرن)', sample: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ' },
              { id: 'Estedad', label: 'استعداد (محبوب‌ترین فونت اپ‌های ایرانی)', sample: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ' },
              { id: 'Parastoo', label: 'پرستو (اصیل، کتابی و بسیار چشم‌نواز)', sample: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ' },
              { id: 'Shabnam', label: 'شبنم (درشت و خوانا برای همه سنین)', sample: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ' },
              { id: 'Samim', label: 'صمیم (ویژه مطالعه راحت و سالمندان)', sample: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ' },
              { id: 'AmiriQuran', label: 'امیری و نسخ قرآنی (ویژه ادعیه و آیات)', sample: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ' },
            ].map((f) => {
              const active = fontFamily === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFontFamily(f.id)}
                  className="p-2.5 rounded-2xl text-right border transition-all"
                  style={{
                    borderColor: active ? theme.primary : theme.border,
                    background: active ? `color-mix(in srgb, ${theme.primary} 16%, transparent)` : 'transparent',
                  }}
                >
                  <span className="text-xs font-bold block" style={{ color: active ? theme.primary : theme.text }}>
                    {f.label}
                  </span>
                  <span className="text-[11px] text-muted mt-0.5 block">{f.sample}</span>
                </button>
              );
            })}
          </div>
          <div className="pt-2 border-t flex items-center justify-between gap-2" style={{ borderColor: theme.border }}>
            <span className="text-xs font-bold text-muted">اندازه متن برای سنین مختلف:</span>
            <div className="flex gap-1.5">
              {[
                { id: 'normal', label: 'عادی' },
                { id: 'medium', label: 'خوانا (متوسط)' },
                { id: 'senior', label: 'درشت (سالمندان)' },
              ].map((sz) => (
                <button
                  key={sz.id}
                  type="button"
                  onClick={() => setFontScale(sz.id)}
                  className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold"
                  style={{
                    background: fontScale === sz.id ? theme.primary : `color-mix(in srgb, ${theme.primary} 10%, transparent)`,
                    color: fontScale === sz.id ? theme.bg : theme.textMuted,
                  }}
                >
                  {sz.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        
        <div className="card-flat p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-app font-bold text-sm block">حالت نمایش آیات قرآن کریم (۱۱۴ سوره)</span>
              <span className="text-muted text-[11px]">انتخاب کنید سوره‌ها صفحه‌ای (مصحف کامل) باز شوند یا چند آیه با هم</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'page' as QuranDisplayMode, label: '📄 صفحه‌ای (مصحف)' },
              { id: 'chunk5' as QuranDisplayMode, label: '📑 ۵ آیه با هم' },
              { id: 'single' as QuranDisplayMode, label: '🔍 تک‌آیه درشت' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setQuranViewModeState(m.id);
                  setQuranDisplayMode(m.id);
                }}
                className="py-2 px-2 rounded-xl text-xs font-bold border transition-all"
                style={{
                  borderColor: quranViewMode === m.id ? theme.primary : theme.border,
                  background: quranViewMode === m.id ? theme.primary : 'transparent',
                  color: quranViewMode === m.id ? theme.bg : theme.textMuted,
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

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

      <div className="mt-4 card-flat p-4">
        <div className="flex items-center justify-between">
          <span className="text-app font-medium text-xs">گزارش فنی و لاگ‌های آلارم</span>
          <button
            type="button"
            onClick={() => { setLogs(getDiagnosticLogs()); setShowLogs((v) => !v); }}
            className="text-xs font-bold"
            style={{ color: theme.primary }}
          >
            {showLogs ? 'بستن گزارش' : 'مشاهده لاگ‌ها'}
          </button>
        </div>
        {showLogs && (
          <div className="mt-3 space-y-2">
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => { setLogs(getDiagnosticLogs()); }}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold"
                style={{ background: theme.primary, color: theme.bg }}
              >
                بروزرسانی
              </button>
              <button
                type="button"
                onClick={() => { clearDiagnosticLogs(); setLogs([]); }}
                className="px-3 py-1.5 rounded-lg text-[11px] text-muted border"
                style={{ borderColor: theme.border }}
              >
                پاک کردن لاگ‌ها
              </button>
            </div>
            {logs.length === 0 ? (
              <p className="text-muted text-xs">هنوز لاگی ثبت نشده است.</p>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-1.5 text-left" dir="ltr">
                {logs.map((l, idx) => (
                  <div key={idx} className="p-2 rounded-lg text-[10px] font-mono border" style={{ borderColor: theme.border }}>
                    <div className="font-bold" style={{ color: l.level === 'error' ? '#fca5a5' : theme.primary }}>[{l.level.toUpperCase()}] {l.scope} - {l.timestamp.slice(11, 19)}</div>
                    <div className="text-app mt-0.5" dir="rtl">{l.message}</div>
                    {l.meta && <div className="text-muted truncate">{JSON.stringify(l.meta)}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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
