import { useState, useEffect, useRef } from 'react';
import {
  Palette, Volume2, Bell, LogOut, User, Check, LogIn, MapPin,
  AlertCircle, Type, LayoutGrid, Crown, HelpCircle, ChevronLeft,
  Navigation, BookOpen, Shield, Download, Upload, CloudUpload, Database
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { themes } from '@/lib/themes';
import {
  adhans, getDownloadedAdhanIds, syncNativeDownloadedAdhans, downloadAndCacheAdhan,
  playAdhanPreview, stopAdhanPreview, getAdhanDurationMode, setAdhanDurationMode,
  getAdhanDurationSeconds, type Adhan, type AdhanPlaybackDurationMode
} from '@/lib/adhans';
import { CITIES, getCityById, getGuestCityId, setGuestCityId, type City } from '@/lib/cities';
import { cancelAllScheduledNotifications, rescheduleAllReminders, checkPermission, requestPermission } from '@/lib/reminderService';
import { getAvailableMethods } from '@/lib/prayerTimes';
import { getSpiritualDashboardStats, type PeriodRange } from '@/lib/tasbihStorage';
import { getDhikr } from '@/lib/dhikrLibrary';
import { getQuranDisplayMode, setQuranDisplayMode, type QuranDisplayMode } from '@/lib/quranCatalog';
import { getHomeModulesVisibility, setHomeModulesVisibility, type HomeModulesVisibility } from '@/components/HomeScreen';
import { getNeshanApiKey, setNeshanApiKey } from '@/lib/neshanMosqueService';
import { syncLocalStateToCloud } from '@/lib/cloudSyncService';
import { AppTutorialModal } from '@/components/AppTutorialModal';
import { VipAndAnalyticsModal } from '@/components/VipAndAnalyticsModal';
import { getDiagnosticLogs, clearDiagnosticLogs, type AppLogEntry } from '@/lib/logger';
import { toFaDigits } from '@/lib/jalali';

const GUEST_NOTIF_KEY = 'noor_guest_notif_enabled';
const GUEST_ADHAN_KEY = 'noor_guest_adhan_id';

function getGuestAdhanId(): string {
  try { return localStorage.getItem(GUEST_ADHAN_KEY) || 'mahur_saeed'; } catch { return 'mahur_saeed'; }
}

function getGuestNotifEnabled(): boolean {
  try { return localStorage.getItem(GUEST_NOTIF_KEY) !== 'false'; } catch { return true; }
}

function setGuestNotifEnabled(enabled: boolean): void {
  try { localStorage.setItem(GUEST_NOTIF_KEY, enabled ? 'true' : 'false'); } catch {}
}

type SettingsSection = 'main' | 'typography' | 'adhan' | 'city' | 'method' | 'theme' | 'customize' | 'neshan' | 'backup' | 'logs';

const FONT_OPTIONS = [
  { id: 'Vazirmatn', nameFa: 'فونت وزیرمتن (استاندارد مدرن)', desc: 'بهترین خوانایی در رابط کاربری مدرن', sample: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ — همراه معنوی نور' },
  { id: 'BNazanin', nameFa: 'فونت نازنین و کتابی (B Nazanin)', desc: 'فونت محبوب و کلاسیک متون فارسی و ادعیه', sample: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ — همراه معنوی نور' },
  { id: 'Nastaliq', nameFa: 'فونت نستعلیق و خوشنویسی ایرانی', desc: 'حس اصیل ایرانی ویژه اشعار، مناجات و ادعیه', sample: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ — همراه معنوی نور' },
  { id: 'Parastoo', nameFa: 'فونت پرستو (نرم و چشم‌نواز)', desc: 'بسیار لطیف و مناسب مطالعه طولانی', sample: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ — همراه معنوی نور' },
  { id: 'Samim', nameFa: 'فونت صمیم (درشت ویژه سالمندان)', desc: 'حروف باز و خوانا برای چشمان حساس', sample: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ — همراه معنوی نور' },
  { id: 'AmiriQuran', nameFa: 'فونت نسخ قرآنی (عثمان طه / امیری)', desc: 'رسم‌الخط اصیل مصحف شریف و مفاتیح‌الجنان', sample: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ — همراه معنوی نور' },
];

export function SettingsScreen({ onExitGuest }: { onExitGuest?: () => void }) {
  const { theme, themeId, setThemeId } = useTheme();
  const { profile, signOut, updateProfile, user } = useAuth();
  const [section, setSection] = useState<SettingsSection>('main');

  const [guestCityId, setGuestCityIdState] = useState(getGuestCityId());
  const [citySearch, setCitySearch] = useState('');
  const [guestNotif, setGuestNotif] = useState(getGuestNotifEnabled());
  const [guestAdhanId, setGuestAdhanId] = useState(getGuestAdhanId());
  const [downloadedAdhans, setDownloadedAdhans] = useState<string[]>(() => getDownloadedAdhanIds());
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [adhanNotice, setAdhanNotice] = useState<string | null>(null);
  const [durationMode, setDurationModeState] = useState<AdhanPlaybackDurationMode>(() => getAdhanDurationMode());

  const [fontFamily, setFontFamily] = useState<string>(() => {
    try { return localStorage.getItem('noor_font_family') || 'Vazirmatn'; } catch { return 'Vazirmatn'; }
  });
  const [fontScale, setFontScale] = useState<string>(() => {
    try { return localStorage.getItem('noor_font_scale') || 'normal'; } catch { return 'normal'; }
  });
  const [quranViewMode, setQuranViewModeState] = useState<QuranDisplayMode>(() => getQuranDisplayMode());
  const [homeModules, setHomeModules] = useState<HomeModulesVisibility>(() => getHomeModulesVisibility());
  const [neshanKey, setNeshanKey] = useState<string>(() => getNeshanApiKey());

  const [showVipModal, setShowVipModal] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [notifSupported, setNotifSupported] = useState(true);
  const [notifMessage, setNotifMessage] = useState<string | null>(null);
  const [backupNotice, setBackupNotice] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodRange>(30);
  const [logs, setLogs] = useState<AppLogEntry[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [guestMethod, setGuestMethod] = useState(() => {
    try { return localStorage.getItem('noor_guest_calc_method') || 'tehran'; } catch { return 'tehran'; }
  });

  const dash = getSpiritualDashboardStats(period);
  const topDhikrObj = getDhikr(dash.topDhikrId);
  const notifEnabled = profile?.notif_enabled ?? guestNotif;

  // قطع خودکار صدای پیش‌نمایش اذان هنگام خروج از تب تنظیمات
  useEffect(() => {
    setNotifSupported(Capacitor.isNativePlatform());
    return () => {
      stopAdhanPreview();
    };
  }, []);

  useEffect(() => {
    const mapFont: Record<string, string> = {
      Vazirmatn: "'Vazirmatn', system-ui, sans-serif",
      BNazanin: "'BNazaninWeb', 'Parastoo', 'Vazirmatn', serif",
      Nastaliq: "'Gulzar', 'Mirza', 'Parastoo', serif",
      Parastoo: "'Parastoo', 'Vazirmatn', serif",
      Samim: "'Samim', 'Vazirmatn', sans-serif",
      AmiriQuran: "'Amiri', 'Amiri Quran', 'Parastoo', serif",
    };
    const chosen = mapFont[fontFamily] ?? mapFont.Vazirmatn;
    document.documentElement.style.setProperty('--app-font', chosen);
    document.body.style.fontFamily = chosen;
    try { localStorage.setItem('noor_font_family', fontFamily); } catch {}
  }, [fontFamily]);

  useEffect(() => {
    const sizeMap: Record<string, string> = {
      normal: '16.8px',
      medium: '18.2px',
      senior: '20px',
    };
    document.documentElement.style.fontSize = sizeMap[fontScale] ?? '16px';
    try { localStorage.setItem('noor_font_scale', fontScale); } catch {}
  }, [fontScale]);

  const toggleNotifications = async () => {
    setNotifMessage(null);
    const next = !notifEnabled;

    if (next && Capacitor.isNativePlatform()) {
      let permission = await checkPermission();
      if (permission !== 'granted') permission = await requestPermission();
      if (permission !== 'granted') {
        setNotifMessage('مجوز اعلان داده نشد؛ از تنظیمات گوشی، اعلان‌های نور را فعال کنید.');
        return;
      }
      if (Capacitor.getPlatform() === 'android') {
        try {
          const { exact_alarm } = await LocalNotifications.checkExactNotificationSetting();
          if (exact_alarm !== 'granted') {
            setNotifMessage('برای پخش دقیق اذان، دسترسی «آلارم‌ها و یادآوری‌ها» را فعال کنید.');
            return;
          }
        } catch {}
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
      setNotifMessage(`${toFaDigits(result.succeeded)} برنامه یادآوری زمان‌بندی شد.`);
    } else {
      await cancelAllScheduledNotifications();
      setNotifMessage('اعلان‌های یادآوری خاموش شدند.');
    }
  };

  const handleExportLocalBackup = () => {
    try {
      const backupData: Record<string, string | null> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('noor_')) {
          backupData[k] = localStorage.getItem(k);
        }
      }
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `noor-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupNotice('✅ فایل پشتیبان با موفقیت در گوشی شما دانلود شد.');
    } catch {
      setBackupNotice('⚠️ خطا در ساخت فایل پشتیبان.');
    }
  };

  const handleImportLocalBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result || '{}'));
        if (!parsed || typeof parsed !== 'object') throw new Error('Invalid');
        let restoredCount = 0;
        for (const [k, v] of Object.entries(parsed)) {
          if (k.startsWith('noor_') && typeof v === 'string') {
            localStorage.setItem(k, v);
            restoredCount++;
          }
        }
        await rescheduleAllReminders(notifEnabled);
        setBackupNotice(`✅ ${toFaDigits(restoredCount)} بخش از اطلاعات و چله‌های شما با موفقیت بازیابی شد!`);
      } catch {
        setBackupNotice('⚠️ فایل انتخابی معتبر نیست.');
      }
    };
    reader.readAsText(file);
  };

  const handleCloudSyncNow = async () => {
    if (!user?.id) {
      setBackupNotice('برای پشتیبان‌گیری ابری، ابتدا وارد حساب کاربری شوید یا از دانلود فایل پشتیبان در گوشی استفاده کنید.');
      return;
    }
    setBackupNotice('در حال همگام‌سازی با سرور ابری...');
    const ok = await syncLocalStateToCloud(user.id);
    setBackupNotice(ok ? '✅ تمام چله‌ها، موضع قرآن و تنظیمات در حساب ابری شما ذخیره شد.' : '⚠️ خطا در ارتباط با سرور ابری.');
  };

  const currentCityId = profile?.city_id ?? guestCityId;
  const currentCity = getCityById(currentCityId);
  const currentMethod = profile?.calculation_method ?? guestMethod;
  const methods = getAvailableMethods();
  const selectedAdhanId = profile?.adhan_id ?? guestAdhanId;
  const selectedAdhanObj = adhans.find((a) => a.id === selectedAdhanId) ?? adhans[0];
  const selectedFontObj = FONT_OPTIONS.find((f) => f.id === fontFamily) ?? FONT_OPTIONS[0];

  const applyCity = async (id: string) => {
    if (profile) await updateProfile({ city_id: id });
    else {
      setGuestCityId(id);
      setGuestCityIdState(id);
    }
    setSection('main');
  };

  const applyTheme = async (id: string) => {
    setThemeId(id);
    if (profile) await updateProfile({ theme_id: id });
  };

  const applyAdhan = async (id: string) => {
    if (profile) await updateProfile({ adhan_id: id });
    else {
      try { localStorage.setItem(GUEST_ADHAN_KEY, id); } catch {}
      setGuestAdhanId(id);
    }
  };

  const applyMethod = async (id: string) => {
    try { localStorage.setItem('noor_guest_calc_method', id); } catch {}
    setGuestMethod(id);
    if (profile) await updateProfile({ calculation_method: id });
    setSection('main');
  };

  // هدر مشترک زیرصفحه‌های تنظیمات
  const SubHeader = ({ title }: { title: string }) => (
    <div className="flex items-center justify-between pb-3 mb-5 border-b" style={{ borderColor: theme.border }}>
      <h1 className="text-xl font-black text-app">{title}</h1>
      <button
        type="button"
        onClick={() => {
          stopAdhanPreview();
          setPreviewingId(null);
          setSection('main');
        }}
        className="px-3.5 py-2 rounded-xl text-xs font-bold border"
        style={{ borderColor: theme.border, color: theme.primary }}
      >
        بازگشت →
      </button>
    </div>
  );

  // ۱. زیرصفحه فونت، اندازه نوشته و حالت نمایش قرآن
  if (section === 'typography') {
    return (
      <div className="w-full max-w-xl mx-auto px-3.5 pt-4 pb-28 animate-fade-in" dir="rtl">
        <SubHeader title="فونت، اندازه متن و نمایش قرآن" />

        <div className="space-y-5">
          <div>
            <p className="text-xs font-bold text-muted mb-2.5 px-1">۱. انتخاب فونت اپلیکیشن (با لمس هر گزینه درجا اعمال می‌شود):</p>
            <div className="space-y-2.5">
              {FONT_OPTIONS.map((f) => {
                const active = fontFamily === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFontFamily(f.id)}
                    className="w-full card-flat p-4 text-right flex items-center justify-between gap-3 transition-all"
                    style={{
                      borderColor: active ? theme.primary : theme.border,
                      background: active ? `color-mix(in srgb, ${theme.primary} 12%, ${theme.surface})` : theme.surface,
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-app">{f.nameFa}</p>
                      <p className="text-[11px] text-muted mt-0.5">{f.desc}</p>
                      <p className="text-xs text-primary mt-2">{f.sample}</p>
                    </div>
                    {active && <Check size={20} color={theme.primary} className="shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card-flat p-4 space-y-3">
            <p className="text-xs font-bold text-app">۲. اندازه نوشته‌ها (مناسب گروه‌های سنی مختلف):</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'normal', label: 'عادی (استاندارد)' },
                { id: 'medium', label: 'متوسط (خوانا)' },
                { id: 'senior', label: 'درشت (سالمندان)' },
              ].map((sz) => (
                <button
                  key={sz.id}
                  type="button"
                  onClick={() => setFontScale(sz.id)}
                  className="py-2.5 px-2 rounded-xl text-xs font-bold border transition-all"
                  style={{
                    borderColor: fontScale === sz.id ? theme.primary : theme.border,
                    background: fontScale === sz.id ? theme.primary : 'transparent',
                    color: fontScale === sz.id ? theme.bg : theme.textMuted,
                  }}
                >
                  {sz.label}
                </button>
              ))}
            </div>
          </div>

          <div className="card-flat p-4 space-y-3">
            <p className="text-xs font-bold text-app">۳. نحوه نمایش آیات در بخش قرآن کریم (۱۱۴ سوره):</p>
            <div className="grid grid-cols-3 gap-2">
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
                  className="py-2.5 px-2 rounded-xl text-xs font-bold border transition-all"
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
        </div>
      </div>
    );
  }

  // ۲. زیرصفحه شخصی‌سازی امکانات صفحه اول (کم و زیاد کردن کارت‌ها توسط کاربر)
  if (section === 'customize') {
    const toggleMod = (key: keyof HomeModulesVisibility) => {
      const next = { ...homeModules, [key]: !homeModules[key] };
      setHomeModules(next);
      setHomeModulesVisibility(next);
    };

    return (
      <div className="w-full max-w-xl mx-auto px-3.5 pt-4 pb-28 animate-fade-in" dir="rtl">
        <SubHeader title="شخصی‌سازی بخش‌های صفحه اول" />
        <p className="text-xs text-muted mb-4 leading-relaxed">
          اگر دوست دارید صفحهٔ اول برنامه خلوت‌تر باشد یا فقط اوقات شرعی را ببینید، می‌توانید هر یک از بخش‌های زیر را به دلخواه روشن یا خاموش کنید:
        </p>

        <div className="space-y-3">
          {[
            {
              key: 'showDeenWidgets' as const,
              title: 'کارت‌های استودیو اذان، مسجد و ادامه قرآن',
              desc: 'نمایش دو کارت میان‌بر وضعیت سفر/مسجد و آخرین آیه خوانده‌شده در صفحه اول',
            },
            {
              key: 'showContextualTip' as const,
              title: 'پیشنهاد معنوی هوشمند ساعتی و روزانه',
              desc: 'پیشنهاد ذکر و سوره متناسب با روز هفته (چهارشنبه امام رضا ع، شب جمعه و...) و ساعت روز',
            },
            {
              key: 'showDailySummary' as const,
              title: 'کارت خلاصه فعالیت و تعداد ذکر امروز',
              desc: 'نمایش آمار ذکرهای گفته‌شده امروز در پایین صفحه اول',
            },
          ].map((item) => {
            const on = homeModules[item.key];
            return (
              <div key={item.key} className="card-flat p-4 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-app">{item.title}</p>
                  <p className="text-[11px] text-muted mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleMod(item.key)}
                  className="w-11 h-6 rounded-full transition-all relative shrink-0"
                  style={{
                    background: on ? theme.primary : `color-mix(in srgb, ${theme.textMuted} 25%, transparent)`,
                  }}
                >
                  <div
                    className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                    style={{ right: on ? '2px' : '22px' }}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ۳. زیرصفحه پشتیبان‌گیری و بازیابی اطلاعات (Backup & Restore)
  if (section === 'backup') {
    return (
      <div className="w-full max-w-xl mx-auto px-3.5 pt-4 pb-28 animate-fade-in" dir="rtl">
        <SubHeader title="پشتیبان‌گیری و حفظ اطلاعات" />

        {backupNotice && (
          <div
            className="mb-4 rounded-2xl px-4 py-3 text-xs font-bold text-center shadow-lg"
            style={{ background: theme.primary, color: theme.bg }}
          >
            {backupNotice}
          </div>
        )}

        <div className="space-y-3.5">
          <div className="card-flat p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Download size={18} color={theme.primary} />
              <p className="text-sm font-bold text-app">۱. دانلود فایل پشتیبان در حافظه گوشی</p>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              تمام چله‌های ۴۰ روزه، یادآوری‌ها، آخرین آیه قرآن، دفترچه محاسبه نفس و آمار تسبیح خود را در یک فایل ذخیره کنید تا حتی در صورت تعویض گوشی، هرگز پاک نشوند.
            </p>
            <button
              type="button"
              onClick={handleExportLocalBackup}
              className="w-full py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2"
              style={{ background: theme.primary, color: theme.bg }}
            >
              <Download size={16} />
              <span>دانلود فایل پشتیبان (JSON)</span>
            </button>
          </div>

          <div className="card-flat p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Upload size={18} color={theme.accent} />
              <p className="text-sm font-bold text-app">۲. بازیابی اطلاعات از فایل پشتیبان</p>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              اگر قبلاً فایل پشتیبان نور را ذخیره کرده‌اید، آن را انتخاب کنید تا تمام برنامه‌ها و کارنامه شما فوراً بازگردد:
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImportLocalBackup}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border"
              style={{ borderColor: theme.accent, color: theme.accent }}
            >
              <Upload size={16} />
              <span>انتخاب فایل پشتیبان و بازیابی</span>
            </button>
          </div>

          <div className="card-flat p-4 space-y-3">
            <div className="flex items-center gap-2">
              <CloudUpload size={18} color={theme.primary} />
              <p className="text-sm font-bold text-app">۳. همگام‌سازی ابری (حساب کاربری)</p>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              ذخیره مستقیم تنظیمات، موضع قرآن و چله‌ها در سرور ابری برای کاربران عضو:
            </p>
            <button
              type="button"
              onClick={() => void handleCloudSyncNow()}
              className="w-full py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border"
              style={{ borderColor: theme.primary, color: theme.primary }}
            >
              <CloudUpload size={16} />
              <span>بروزرسانی پشتیبان ابری من</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ۴. زیرصفحه تنظیمات نقشه و مسجدیاب نشان
  if (section === 'neshan') {
    return (
      <div className="w-full max-w-xl mx-auto px-3.5 pt-4 pb-28 animate-fade-in" dir="rtl">
        <SubHeader title="تنظیمات مسجدیاب و نقشه نشان" />
        <div className="card-flat p-4 space-y-3">
          <p className="text-sm font-bold text-app">🔑 کلید وب‌سرویس نشان (Neshan API Key)</p>
          <p className="text-xs text-muted leading-relaxed">
            اپلیکیشن نور به صورت پیش‌فرض به کلید رسمی سرویس «نشان» متصل است. در صورت تمایل به تغییر کلید، کد <code>service.xxx</code> خود را وارد کنید:
          </p>
          <input
            type="text"
            dir="ltr"
            value={neshanKey}
            onChange={(e) => setNeshanKey(e.target.value)}
            placeholder="service.xxxxxxxxxxxxxxxxxxxxxxxx"
            className="w-full px-3.5 py-3 rounded-2xl text-xs font-mono text-app border outline-none"
            style={{ borderColor: theme.border, background: theme.bg }}
          />
          <button
            type="button"
            onClick={() => {
              setNeshanApiKey(neshanKey);
              setSection('main');
            }}
            className="w-full py-3 rounded-2xl text-xs font-bold"
            style={{ background: theme.primary, color: theme.bg }}
          >
            ذخیره کلید وب‌سرویس نشان
          </button>
        </div>
      </div>
    );
  }

  // ۵. زیرصفحه پوسته‌ها
  if (section === 'theme') {
    return (
      <div className="w-full max-w-xl mx-auto px-3.5 pt-4 pb-28 animate-fade-in" dir="rtl">
        <SubHeader title="پوسته و رنگ‌بندی برنامه" />
        <div className="grid grid-cols-2 gap-3">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => void applyTheme(t.id)}
              className="card-flat p-4 text-right relative overflow-hidden"
              style={{ borderColor: themeId === t.id ? t.primary : theme.border }}
            >
              <div className="w-full h-20 rounded-xl mb-3" style={{ background: t.gradient }} />
              <p className="text-app font-bold text-sm">{t.nameFa}</p>
              <p className="text-muted text-xs">{t.name}</p>
              {themeId === t.id && (
                <div
                  className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: t.primary }}
                >
                  <Check size={14} color={t.bg} />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ۶. زیرصفحه انتخاب شهر
  if (section === 'city') {
    const filteredCities = CITIES.filter(
      (c) =>
        !citySearch.trim() ||
        c.nameFa.includes(citySearch.trim()) ||
        c.name.toLowerCase().includes(citySearch.trim().toLowerCase())
    );
    const grouped = filteredCities.reduce<Record<string, City[]>>((acc, c) => {
      (acc[c.countryFa] ??= []).push(c);
      return acc;
    }, {});

    return (
      <div className="w-full max-w-xl mx-auto px-3.5 pt-4 pb-28 animate-fade-in" dir="rtl">
        <SubHeader title="انتخاب شهر و افق شرعی" />
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
                  onClick={() => void applyCity(c.id)}
                  className="w-full card-flat p-4 flex items-center justify-between"
                  style={{ borderColor: currentCityId === c.id ? theme.primary : theme.border }}
                >
                  <div className="text-right">
                    <p className="text-app font-medium text-sm">{c.nameFa}</p>
                    <p className="text-muted text-xs" dir="ltr">{c.timezone}</p>
                  </div>
                  {currentCityId === c.id && <Check size={18} color={theme.primary} />}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ۷. زیرصفحه روش محاسبه
  if (section === 'method') {
    return (
      <div className="w-full max-w-xl mx-auto px-3.5 pt-4 pb-28 animate-fade-in" dir="rtl">
        <SubHeader title="روش محاسبه اوقات شرعی" />
        <div className="space-y-2">
          {methods.map((m) => (
            <button
              key={m.id}
              onClick={() => void applyMethod(m.id)}
              className="w-full card-flat p-4 flex items-center justify-between"
              style={{ borderColor: currentMethod === m.id ? theme.primary : theme.border }}
            >
              <p className="text-app font-medium text-sm">{m.name}</p>
              {currentMethod === m.id && <Check size={18} color={theme.primary} />}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ۸. زیرصفحه کلکسیون مؤذنان (ایران، مصر، ترکیه، حرمین) + انتخاب مدت پخش
  if (section === 'adhan') {
    const handleChangeDurationMode = (m: AdhanPlaybackDurationMode) => {
      setDurationModeState(m);
      setAdhanDurationMode(m);
      const label = m === '10s' ? '۱۰ ثانیه اول (خلاصه)' : m === '30s' ? '۳۰ ثانیه اول (ملایم)' : 'پخش کامل اذان';
      setAdhanNotice(`✨ مدت پخش اذان روی «${label}» تنظیم شد.`);
    };

    const handleDownloadAdhan = async (a: Adhan) => {
      setDownloadingId(a.id);
      const res = await downloadAndCacheAdhan(a);
      const synced = await syncNativeDownloadedAdhans();
      setDownloadedAdhans(synced);
      setDownloadingId(null);
      if (res.ok) {
        await applyAdhan(a.id);
        setAdhanNotice(`✅ صدای «${a.reciter}» فعال شد!`);
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
      <div className="w-full max-w-xl mx-auto px-3.5 pt-4 pb-28 animate-fade-in" dir="rtl">
        <SubHeader title="کلکسیون مؤذنان و مدت پخش اذان" />

        {adhanNotice && (
          <div
            className="mb-4 rounded-2xl px-4 py-3 text-xs font-bold text-center shadow-lg"
            style={{ background: theme.primary, color: theme.bg }}
          >
            {adhanNotice}
          </div>
        )}

        <div
          className="mb-5 p-4 rounded-3xl border space-y-3"
          style={{
            borderColor: `color-mix(in srgb, ${theme.primary} 35%, ${theme.border})`,
            background: `radial-gradient(circle at top right, color-mix(in srgb, ${theme.primary} 14%, transparent), ${theme.surface})`,
          }}
        >
          <div>
            <h2 className="text-sm font-black text-app">⏱️ مدت زمان پخش در وقت اذان</h2>
            <p className="text-[11px] text-muted mt-0.5">
              انتخاب کنید موقع اذان، کل اذان پخش شود یا فقط ۱۰ ثانیه اول
            </p>
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

        <div className="space-y-3">
          {adhans.map((a) => {
            const isSelected = selectedAdhanId === a.id;
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
                      <Check size={12} /> فعال
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
                    {isPreviewing ? '⏹️ توقف صدا' : '▶️ شنیدن صدا'}
                  </button>

                  {!isDownloaded ? (
                    <button
                      type="button"
                      disabled={isDownloading}
                      onClick={() => void handleDownloadAdhan(a)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold"
                      style={{ background: theme.primary, color: theme.bg }}
                    >
                      {isDownloading ? 'در حال دریافت...' : '📥 انتخاب این مؤذن'}
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
                      {isSelected ? '✓ مؤذن فعال شما' : 'انتخاب این مؤذن'}
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

  // ۹. زیرصفحه لاگ‌های فنی
  if (section === 'logs') {
    return (
      <div className="w-full max-w-xl mx-auto px-3.5 pt-4 pb-28 animate-fade-in" dir="rtl">
        <SubHeader title="گزارش فنی و وضعیت سیستم" />
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => setLogs(getDiagnosticLogs())}
            className="px-3.5 py-2 rounded-xl text-xs font-bold"
            style={{ background: theme.primary, color: theme.bg }}
          >
            بروزرسانی گزارش
          </button>
          <button
            type="button"
            onClick={() => {
              clearDiagnosticLogs();
              setLogs([]);
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border text-muted"
            style={{ borderColor: theme.border }}
          >
            پاک کردن
          </button>
        </div>
        {logs.length === 0 ? (
          <p className="text-muted text-xs py-8 text-center">گزارشی ثبت نشده است.</p>
        ) : (
          <div className="space-y-2 text-left" dir="ltr">
            {logs.map((l, idx) => (
              <div key={idx} className="p-2.5 rounded-xl text-[10px] font-mono border" style={{ borderColor: theme.border }}>
                <div className="font-bold" style={{ color: l.level === 'error' ? '#fca5a5' : theme.primary }}>
                  [{l.level.toUpperCase()}] {l.scope} - {l.timestamp.slice(11, 19)}
                </div>
                <div className="text-app mt-0.5" dir="rtl">{l.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // صفحه اصلی تنظیمات: طراحی تیترمحور، تمیز، خلوت و دسته‌بندی‌شده (Figma Clean List)
  // ============================================================================
  const RowItem = ({
    icon: Icon,
    title,
    value,
    onClick,
    accent,
  }: {
    icon: typeof Palette;
    title: string;
    value: string;
    onClick: () => void;
    accent?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className="w-full card-flat px-4 py-3.5 flex items-center justify-between gap-3 transition-transform active:scale-[0.99]"
      style={{ borderColor: accent ? theme.accent : theme.border }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: accent
              ? `color-mix(in srgb, ${theme.accent} 16%, transparent)`
              : `color-mix(in srgb, ${theme.primary} 12%, transparent)`,
          }}
        >
          <Icon size={18} color={accent ? theme.accent : theme.primary} />
        </div>
        <span className="text-app font-bold text-sm truncate">{title}</span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-muted text-xs truncate max-w-[135px]">{value}</span>
        <ChevronLeft size={16} color={theme.textMuted} />
      </div>
    </button>
  );

  return (
    <div className="w-full max-w-xl mx-auto px-3.5 pt-4 pb-28 animate-fade-in" dir="rtl">
      {showGuide && <AppTutorialModal onClose={() => setShowGuide(false)} />}
      {showVipModal && <VipAndAnalyticsModal initialTab="vip" onClose={() => setShowVipModal(false)} />}

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-black text-app">تنظیمات و کارنامه</h1>
        <button
          type="button"
          onClick={() => setShowGuide(true)}
          className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1"
          style={{ background: `color-mix(in srgb, ${theme.primary} 15%, transparent)`, color: theme.primary }}
        >
          <HelpCircle size={14} />
          <span>راهنمای برنامه</span>
        </button>
      </div>

      {/* کارت خلاصه کارنامه و حساب کاربری در یک قاب یکپارچه و تمیز */}
      <div className="card p-4 mb-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: theme.primary }}>
              <User size={20} color={theme.bg} />
            </div>
            <div>
              <p className="text-app font-bold text-sm">{profile?.display_name || (user ? 'کاربر نور' : 'کاربر مهمان')}</p>
              <p className="text-xs font-bold text-primary">{dash.levelTitle}</p>
            </div>
          </div>
          <div className="flex gap-1">
            {([7, 30, 90] as PeriodRange[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setPeriod(d)}
                className="px-2 py-1 rounded-lg text-[10px] font-bold"
                style={{
                  background: period === d ? theme.primary : `color-mix(in srgb, ${theme.primary} 10%, transparent)`,
                  color: period === d ? theme.bg : theme.textMuted,
                }}
              >
                {d === 7 ? '۷ روز' : d === 30 ? '۱ ماه' : 'فصلی'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center pt-1">
          <div className="card-flat p-2">
            <p className="text-base font-black text-primary">{dash.totalCount.toLocaleString('fa-IR')}</p>
            <p className="text-[10px] text-muted">کل اذکار</p>
          </div>
          <div className="card-flat p-2">
            <p className="text-base font-black text-accent">{dash.totalRounds.toLocaleString('fa-IR')}</p>
            <p className="text-[10px] text-muted">دور تسبیح</p>
          </div>
          <div className="card-flat p-2">
            <p className="text-base font-black text-primary">{dash.streakDays.toLocaleString('fa-IR')} روز</p>
            <p className="text-[10px] text-muted">زنجیره تداوم 🔥</p>
          </div>
        </div>
        {topDhikrObj && (
          <p className="text-[11px] text-muted text-center">
            محبوب‌ترین ذکر شما: <strong className="text-app">{topDhikrObj.arabic}</strong>
          </p>
        )}
      </div>

      {/* دسته‌بندی ۱: ظاهر، فونت و شخصی‌سازی */}
      <p className="text-xs font-bold text-muted mb-2 px-1">ظاهر، فونت و شخصی‌سازی</p>
      <div className="space-y-2 mb-5">
        <RowItem
          icon={Type}
          title="فونت، اندازه متن و نمایش قرآن"
          value={selectedFontObj.nameFa.replace('فونت ', '').split(' ')[0]}
          onClick={() => setSection('typography')}
        />
        <RowItem
          icon={Palette}
          title="پوسته و رنگ‌بندی"
          value={themes.find((t) => t.id === themeId)?.nameFa ?? 'زمردی'}
          onClick={() => setSection('theme')}
        />
        <RowItem
          icon={LayoutGrid}
          title="شخصی‌سازی بخش‌های صفحه اول"
          value="کم یا زیاد کردن کارت‌ها"
          onClick={() => setSection('customize')}
        />
      </div>

      {/* دسته‌بندی ۲: اذان، اوقات شرعی و مسجدیاب نشان */}
      <p className="text-xs font-bold text-muted mb-2 px-1">اذان، اوقات شرعی و مکان‌یابی</p>
      <div className="space-y-2 mb-5">
        <RowItem
          icon={Volume2}
          title="صدای مؤذن و مدت پخش اذان"
          value={selectedAdhanObj.reciter.replace('مرحوم ', '').replace('استاد ', '')}
          onClick={() => setSection('adhan')}
        />
        <RowItem
          icon={MapPin}
          title="شهر و موقعیت اوقات شرعی"
          value={currentCity.nameFa}
          onClick={() => setSection('city')}
        />
        <RowItem
          icon={BookOpen}
          title="روش محاسبه اوقات شرعی"
          value={methods.find((m) => m.id === currentMethod)?.name ?? 'جعفری'}
          onClick={() => setSection('method')}
        />
        <RowItem
          icon={Navigation}
          title="مسجدیاب و کلید نقشه نشان"
          value={neshanKey ? 'متصل به نشان ✓' : 'رادار پیش‌فرض فعال'}
          onClick={() => setSection('neshan')}
        />
      </div>

      {/* دسته‌بندی ۳: داشبورد تحلیلی، پشتیبان‌گیری و اعلان‌ها */}
      <p className="text-xs font-bold text-muted mb-2 px-1">پشتیبان‌گیری، داشبورد و اعلان‌ها</p>
      <div className="space-y-2 mb-5">
        <RowItem
          icon={Crown}
          title="داشبورد تحلیلی BI، نشان‌ها و امکانات VIP"
          value="مشاهده کامل (باز)"
          onClick={() => setShowVipModal(true)}
          accent
        />

        <RowItem
          icon={Database}
          title="پشتیبان‌گیری و بازیابی اطلاعات (Backup)"
          value="ذخیره در گوشی / ابر"
          onClick={() => {
            setBackupNotice(null);
            setSection('backup');
          }}
        />

        <div className="card-flat px-4 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `color-mix(in srgb, ${theme.primary} 12%, transparent)` }}
              >
                <Bell size={18} color={theme.primary} />
              </div>
              <span className="text-app font-bold text-sm">اعلان‌ها و یادآوری‌های هوشمند</span>
            </div>
            <button
              type="button"
              onClick={() => void toggleNotifications()}
              className="w-11 h-6 rounded-full transition-all relative"
              style={{
                background: notifEnabled ? theme.primary : `color-mix(in srgb, ${theme.textMuted} 25%, transparent)`,
              }}
            >
              <div
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                style={{ right: notifEnabled ? '2px' : '22px' }}
              />
            </button>
          </div>
          {notifMessage && <p className="text-xs text-primary mt-2 pr-12">{notifMessage}</p>}
          {!notifSupported && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t text-muted text-[11px]" style={{ borderColor: theme.border }}>
              <AlertCircle size={13} color={theme.accent} />
              <span>آلارم قفل صفحه در نسخه اندروید فعال است.</span>
            </div>
          )}
        </div>

        <RowItem
          icon={Shield}
          title="گزارش فنی آلارم‌ها"
          value="بررسی وضعیت"
          onClick={() => {
            setLogs(getDiagnosticLogs());
            setSection('logs');
          }}
        />
      </div>

      {user ? (
        <button
          onClick={() => void signOut()}
          className="w-full mt-4 py-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold"
          style={{ background: 'rgba(239,68,68,0.12)', color: '#fca5a5' }}
        >
          <LogOut size={16} /> خروج از حساب کاربری
        </button>
      ) : onExitGuest ? (
        <button
          onClick={onExitGuest}
          className="w-full mt-4 py-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold"
          style={{ background: theme.primary, color: theme.bg }}
        >
          <LogIn size={16} /> ورود یا ساخت حساب پشتیبان ابری
        </button>
      ) : null}
    </div>
  );
}