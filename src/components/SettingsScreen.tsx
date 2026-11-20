import { createPortal } from 'react-dom';
import { Hero30SelectorModal, loadHeroConfig, saveHeroConfig, resolveActiveHeroDesign, RenderHeroArtworkScene } from '@/components/HeroHorizon30Gallery';
import { ThemePatternWatermark } from '@/components/FigmaLuxuryElements';
import { getTemperatureUnit, setTemperatureUnit, type TempUnit } from '@/lib/weatherService';


import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Palette, Volume2, Bell, LogOut, User, Check, LogIn, MapPin,
  AlertCircle, Type, LayoutGrid, Crown, HelpCircle, ChevronLeft,
  Navigation, BookOpen, Shield, Download, Upload, CloudUpload, Database, RefreshCw, Globe, ChevronRight
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useTheme } from '@/hooks/useTheme';
import { useI18n, LANGUAGE_OPTIONS } from '@/i18n';

import { OCCASION_MOTIFS, getSelectedOccasionMotif, setSelectedOccasionMotif, type OccasionMotifId } from '@/components/ThemeBackdropPattern';

import { useAuth } from '@/hooks/useAuth';
import { themes, getAllThemes } from '@/lib/themes';
import {
  adhans, getAllAdhans, getDownloadedAdhanIds, syncNativeDownloadedAdhans, downloadAndCacheAdhan,
  playAdhanPreview, stopAdhanPreview, getAdhanDurationMode, setAdhanDurationMode,
  getAdhanDurationSeconds, type Adhan, type AdhanPlaybackDurationMode
} from '@/lib/adhans';
import { CITIES, getCityById, getCityDisplayName, getCountryDisplayName, getGuestCityId, setGuestCityId, findNearestCity, saveCustomGpsCoords, getCustomGpsCoords, clearCustomGpsCoords, type City, type CityRegion } from '@/lib/cities';
import { NoorAlarm, cancelAllScheduledNotifications, rescheduleAllReminders, checkPermission, requestPermission } from '@/lib/reminderService';
import { getAvailableMethods, getRecommendedMethodForCountry, getAsrMadhab, saveAsrMadhab, getNightPrayerConfig, saveNightPrayerConfig, getPrayerManualOffsets, savePrayerManualOffsets, hasNonZeroManualOffsets, type AsrMadhab, type NightPrayerConfig, type PrayerManualOffsets } from '@/lib/prayerTimes';
import { getSpiritualDashboardStats, type PeriodRange } from '@/lib/tasbihStorage';
import { getDhikr } from '@/lib/dhikrLibrary';
import { getQuranDisplayMode, setQuranDisplayMode, type QuranDisplayMode } from '@/lib/quranCatalog';
import { getHomeModulesVisibility, setHomeModulesVisibility, type HomeModulesVisibility } from '@/components/HomeScreen';
import { getNeshanApiKey, setNeshanApiKey } from '@/lib/neshanMosqueService';
import { runFullUserCloudSync } from '@/lib/cloudSyncService';
import { getCachedGlobalSyncSnapshot } from '@/lib/globalSyncService';
import { GlobalSyncHubModal } from '@/components/GlobalSyncHubModal';
import { AppTutorialModal } from '@/components/AppTutorialModal';
import { AdhanStudioAndTravelModal } from '@/components/AdhanStudioAndTravelModal';
import { VipAndAnalyticsModal } from '@/components/VipAndAnalyticsModal';
import { getDiagnosticLogs, clearDiagnosticLogs, type AppLogEntry } from '@/lib/logger';
import { toFaDigits, jalaliMonths } from '@/lib/jalali';
import { getUserBirthday, saveUserBirthday, formatBirthdayFa, type UserBirthday } from '@/lib/inboxService';

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

type SettingsSection = 'main' | 'language' | 'typography' | 'adhan' | 'city' | 'method' | 'theme' | 'customize' | 'neshan' | 'backup' | 'logs';

const FONT_OPTIONS = [
  { id: 'Vazirmatn', nameFa: 'وزیرمتن (پیش‌فرض)', desc: 'بهترین خوانایی در رابط کاربری مدرن', sample: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ — همراه معنوی نور' },
  { id: 'BNazanin', nameFa: 'نازنین (کتابی)', desc: 'فونت محبوب و کلاسیک متون فارسی و ادعیه', sample: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ — همراه معنوی نور' },
  { id: 'Nastaliq', nameFa: 'نستعلیق ایرانی', desc: 'حس اصیل ایرانی ویژه اشعار، مناجات و ادعیه', sample: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ — همراه معنوی نور' },
  { id: 'Parastoo', nameFa: 'پرستو (نرم)', desc: 'بسیار لطیف و مناسب مطالعه طولانی', sample: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ — همراه معنوی نور' },
  { id: 'Samim', nameFa: 'صمیم (درشت)', desc: 'حروف باز و خوانا برای چشمان حساس', sample: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ — همراه معنوی نور' },
  { id: 'AmiriQuran', nameFa: 'نسخ قرآنی (عثمان طه)', desc: 'رسم‌الخط اصیل مصحف شریف و مفاتیح‌الجنان', sample: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ — همراه معنوی نور' },
];



function ThemeHeroSelectorCard({ theme }: { theme: { surface: string; primary: string; bg: string; border: string } }) {
  const [showHeroGalleryModal, setShowHeroGalleryModal] = useState(false);
  const [heroCfg, setHeroCfg] = useState(() => loadHeroConfig());
  useEffect(() => {
    const syncHero = () => setHeroCfg(loadHeroConfig());
    window.addEventListener('noor-hero-config-changed', syncHero);
    return () => window.removeEventListener('noor-hero-config-changed', syncHero);
  }, []);
  const currentHeroDesign = resolveActiveHeroDesign('مشهد', 'fajr');

  return (
    <>
      {showHeroGalleryModal && (
        <Hero30SelectorModal
          cityName="مشهد"
          onClose={() => setShowHeroGalleryModal(false)}
          onSelectConfig={(next) => setHeroCfg(next)}
        />
      )}

      <div
        className="rounded-3xl p-4 border shadow-xl space-y-3 mb-4"
        style={{ background: theme.surface, borderColor: theme.primary }}
      >
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-app">
              🕌 تصویر بالای صفحه خانه
            </h3>
            <p className="text-[11px] text-muted mt-0.5">
              انتخاب منظره حرم‌ها، مساجد و مناسبت‌ها
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowHeroGalleryModal(true)}
            className="px-3.5 py-2 rounded-2xl text-xs font-black shadow-md transition-transform active:scale-95 shrink-0"
            style={{ background: theme.primary, color: theme.bg }}
          >
            🖼️ تغییر منظره ({heroCfg.mode === 'manual' ? 'دستی' : 'هوشمند'})
          </button>
        </div>

        <div
          onClick={() => setShowHeroGalleryModal(true)}
          role="button"
          tabIndex={0}
          className="rounded-2xl overflow-hidden border relative h-28 cursor-pointer"
          style={{ borderColor: theme.border }}
        >
          <RenderHeroArtworkScene design={currentHeroDesign} />
          <div
            className="absolute inset-x-0 bottom-0 px-3 py-1.5 flex items-center justify-between text-[11px] font-black"
            style={{ background: 'rgba(2, 12, 9, 0.84)', color: '#FEF08A' }}
          >
            <span className="truncate">{currentHeroDesign.titleFa}</span>
            <span className="text-[10px] text-emerald-300 shrink-0 mr-2">۲۰ منظره ←</span>
          </div>
        </div>
      </div>

      <p className="text-xs font-bold text-muted mb-2.5 px-1">🎨 انتخاب پوسته رنگی</p>
    </>
  );
}

function ContactYasinModal({ onClose }: { onClose: () => void }) {
  const [senderName, setSenderName] = useState('');
  const [subject, setSubject] = useState('پیشنهاد یا گزارش درباره اپلیکیشن همراه معنوی نور');
  const [message, setMessage] = useState('');
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const sanitizeText = (val: string) => val.replace(/[<>]/g, '').trim();

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText('ycnakbari@gmail.com');
      setStatusMsg({ type: 'ok', text: 'آدرس ایمیل ycnakbari@gmail.com کپی شد.' });
    } catch {
      setStatusMsg({ type: 'ok', text: 'ایمیل سازنده: ycnakbari@gmail.com' });
    }
  };

  const handleDirectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!navigator.onLine) {
      setIsOnline(false);
      setStatusMsg({
        type: 'err',
        text: 'اتصال اینترنت برقرار نیست! برای ارسال پیام به سازنده، لطفاً اینترنت گوشی را روشن کنید.',
      });
      return;
    }
    const cleanMsg = sanitizeText(message);
    const cleanSubj = sanitizeText(subject) || 'پیام کاربر همراه معنوی نور';
    const cleanName = sanitizeText(senderName) || 'کاربر همراه معنوی نور';

    if (cleanMsg.length < 3) {
      setStatusMsg({ type: 'err', text: 'لطفاً متن پیام یا پیشنهاد خود را وارد فرمایید.' });
      return;
    }

    setSending(true);
    setStatusMsg(null);
    try {
      const resp = await fetch('https://formsubmit.co/ajax/ycnakbari@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          subject: cleanSubj,
          message: cleanMsg,
          _captcha: 'false',
        }),
      });
      if (resp.ok) {
        setStatusMsg({
          type: 'ok',
          text: 'پیام شما با موفقیت به ایمیل سازنده (ycnakbari@gmail.com) ارسال شد.',
        });
        setMessage('');
      } else {
        const mailto = `mailto:ycnakbari@gmail.com?subject=${encodeURIComponent(cleanSubj)}&body=${encodeURIComponent(cleanMsg)}`;
        window.location.href = mailto;
        setStatusMsg({
          type: 'ok',
          text: 'در حال باز کردن برنامه ایمیل برای ارسال مستقیم به ycnakbari@gmail.com...',
        });
      }
    } catch {
      const mailto = `mailto:ycnakbari@gmail.com?subject=${encodeURIComponent(cleanSubj)}&body=${encodeURIComponent(cleanMsg)}`;
      window.location.href = mailto;
      setStatusMsg({
        type: 'ok',
        text: 'در حال انتقال به برنامه ایمیل برای ارسال به ycnakbari@gmail.com...',
      });
    } finally {
      setSending(false);
    }
  };

  const modalUi = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(2, 12, 10, 0.86)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
      dir="rtl"
    >
      <div
        className="w-full max-w-md rounded-3xl p-4 border shadow-2xl space-y-3"
        style={{
          maxHeight: '85vh',
          overflowY: 'auto',
          margin: 'auto',
          background: 'linear-gradient(165deg, #0D382C 0%, #051B15 100%)',
          borderColor: 'rgba(52, 211, 153, 0.4)',
          color: '#ECFDF5',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <div>
            <h3 className="text-sm font-black text-emerald-300">✉️ ارتباط با سازنده</h3>
            <p className="text-[11px] opacity-75 mt-0.5">ارسال مستقیم نظر، پیشنهاد یا گزارش به یاسین اکبری</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl border flex items-center justify-center text-xs"
            style={{ borderColor: 'rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)' }}
          >
            ✕
          </button>
        </div>

        <div
          className="rounded-2xl p-2.5 border flex items-center justify-between text-xs"
          style={{
            background: isOnline ? 'rgba(16, 185, 129, 0.14)' : 'rgba(239, 68, 68, 0.18)',
            borderColor: isOnline ? 'rgba(52, 211, 153, 0.35)' : 'rgba(248, 113, 113, 0.45)',
          }}
        >
          <span>{isOnline ? '🟢 اینترنت متصل است (آماده ارسال)' : '🔴 اینترنت قطع است! لطفاً متصل شوید'}</span>
          <button
            type="button"
            onClick={handleCopyEmail}
            className="px-2.5 py-1 rounded-lg text-[10px] font-bold border"
            style={{ borderColor: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)' }}
          >
            کپی ایمیل
          </button>
        </div>

        <div className="rounded-2xl p-2.5 border flex items-center justify-between text-xs" style={{ background: 'rgba(0,0,0,0.25)', borderColor: 'rgba(255,255,255,0.1)' }}>
          <span className="text-[11px] opacity-75">پست الکترونیک رسمی سازنده:</span>
          <strong className="font-mono text-amber-300 select-all">ycnakbari@gmail.com</strong>
        </div>

        <form onSubmit={handleDirectSubmit} className="space-y-2.5">
          <div>
            <label className="block text-[11px] font-bold mb-1 opacity-85">نام شما (اختیاری):</label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="مثلاً: علی رضایی"
              className="w-full rounded-xl px-3 py-2 text-xs border bg-black/30 text-white outline-none"
              style={{ borderColor: 'rgba(255,255,255,0.16)' }}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold mb-1 opacity-85">موضوع پیام:</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-xs border bg-black/30 text-white outline-none"
              style={{ borderColor: 'rgba(255,255,255,0.16)' }}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold mb-1 opacity-85">متن پیام، پیشنهاد یا گزارش شما:</label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="پیام خود را اینجا بنویسید..."
              className="w-full rounded-xl p-3 text-xs border bg-black/30 text-white outline-none resize-none"
              style={{ borderColor: 'rgba(255,255,255,0.16)' }}
            />
          </div>

          {statusMsg && (
            <div
              className="p-2.5 rounded-xl text-[11px] font-bold border"
              style={{
                background: statusMsg.type === 'ok' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.22)',
                borderColor: statusMsg.type === 'ok' ? '#34D399' : '#F87171',
              }}
            >
              {statusMsg.text}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={sending}
              className="flex-1 py-2.5 rounded-2xl font-black text-xs shadow-lg transition-transform active:scale-95"
              style={{ background: '#34D399', color: '#041511' }}
            >
              {sending ? 'در حال ارسال...' : '🚀 ارسال مستقیم به یاسین'}
            </button>
            <a
              href={`mailto:ycnakbari@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`}
              className="px-3 py-2.5 rounded-2xl font-bold text-[11px] border text-center"
              style={{ borderColor: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)' }}
            >
              برنامه ایمیل
            </a>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalUi, document.body) : modalUi;
}

export function SettingsScreen({ onExitGuest }: { onExitGuest?: () => void }) {
  const { theme, themeId, setThemeId } = useTheme();
  const { lang, dir, isRtl, setLang, t, formatDigits } = useI18n();
  const [showContactDeveloperModal, setShowContactDeveloperModal] = useState(false);
  const [contactSubject, setContactSubject] = useState('پیشنهاد یا گزارش درباره اپلیکیشن همراه معنوی نور');
  const [contactBody, setContactBody] = useState('');
  const [copiedEmailToast, setCopiedEmailToast] = useState(false);
  const [showAdhanStudioInSettings, setShowAdhanStudioInSettings] = useState(false);
  const { profile, signOut, updateProfile, user } = useAuth();
  const [section, setSection] = useState<SettingsSection>('main');

  const [guestCityId, setGuestCityIdState] = useState(getGuestCityId());
  const [citySearch, setCitySearch] = useState('');
  const [cityRegion, setCityRegion] = useState<'all' | CityRegion>('all');
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [gpsStatusMsg, setGpsStatusMsg] = useState<string | null>(null);
  const [customGps, setCustomGps] = useState(() => getCustomGpsCoords());
  const [asrMadhab, setAsrMadhabState] = useState<AsrMadhab>(() => getAsrMadhab());
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
  const [neshanKey, setNeshanKey] = useState<string>('');
  const [nightPrayerCfg, setNightPrayerCfg] = useState<NightPrayerConfig>(() => getNightPrayerConfig());

  const [showVipModal, setShowVipModal] = useState(false);
  const [showPreAdhanModal, setShowPreAdhanModal] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showGlobalSyncHub, setShowGlobalSyncHub] = useState(false);
  const [birthday, setBirthday] = useState<UserBirthday | null>(() => getUserBirthday());
  const [showBirthdayEditor, setShowBirthdayEditor] = useState(false);
  const [bMonth, setBMonth] = useState<number>(() => getUserBirthday()?.month ?? 1);
  const [bDay, setBDay] = useState<number>(() => getUserBirthday()?.day ?? 1);
  const [bYear, setBYear] = useState<string>(() => (getUserBirthday()?.year ? String(getUserBirthday()?.year) : ''));
  const [notifSupported, setNotifSupported] = useState(true);
  const [notifMessage, setNotifMessage] = useState<string | null>(null);
  const [backupNotice, setBackupNotice] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodRange>(30);
  const [logs, setLogs] = useState<AppLogEntry[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [guestMethod, setGuestMethod] = useState(() => {
    try { return localStorage.getItem('noor_guest_calc_method') || 'tehran'; } catch { return 'tehran'; }
  });
  const [manualOffsets, setManualOffsets] = useState<PrayerManualOffsets>(() => getPrayerManualOffsets());
  const [showManualOffsets, setShowManualOffsets] = useState(false);

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
    try { localStorage.setItem('noor_font_family', fontFamily); } catch {}
    if (lang === 'fa') {
      const chosen = mapFont[fontFamily] ?? mapFont.Vazirmatn;
      document.documentElement.style.setProperty('--app-font', chosen);
      document.body.style.fontFamily = chosen;
    }
  }, [fontFamily, lang]);

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
    setBackupNotice('در حال همگام‌سازی دوطرفه با سرور ابری نور...');
    const { ok } = await runFullUserCloudSync(user.id);
    setBackupNotice(ok ? '✅ آمار ذکرها، چله‌ها، نشانک‌های قرآن و تنظیمات شما با ابر همگام شد.' : '⚠️ خطا در ارتباط با سرور ابری؛ اتصال اینترنت را بررسی کنید.');
  };

  const currentCityId = profile?.city_id ?? guestCityId;
  const currentCity = getCityById(currentCityId);
  const currentMethod = profile?.calculation_method ?? guestMethod;
  const methods = getAvailableMethods();
  const selectedAdhanId = profile?.adhan_id ?? guestAdhanId;
  const allAdhans = getAllAdhans();
  const allThemes = getAllThemes();
  const selectedAdhanObj = allAdhans.find((a) => a.id === selectedAdhanId) ?? adhans[0];
  const selectedFontObj = FONT_OPTIONS.find((f) => f.id === fontFamily) ?? FONT_OPTIONS[0];

  const applyCity = async (id: string) => {
    clearCustomGpsCoords();
    setCustomGps(null);
    setGuestCityId(id);
    setGuestCityIdState(id);
    if (profile) await updateProfile({ city_id: id });
    window.dispatchEvent(new Event('noor-city-changed'));
    await rescheduleAllReminders(notifEnabled);
    setSection('main');
  };

  const handleDetectGpsLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsStatusMsg('⚠️ دستگاه یا مرورگر شما از مکان‌یابی GPS پشتیبانی نمی‌کند.');
      return;
    }
    setGpsDetecting(true);
    setGpsStatusMsg('در حال دریافت مختصات دقیق GPS...');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = Number(pos.coords.latitude.toFixed(5));
          const lng = Number(pos.coords.longitude.toFixed(5));
          const { city: nearest, distanceKm } = findNearestCity(lat, lng);
          const label = distanceKm <= 35 ? nearest.nameFa + ' (مکان دقیق GPS)' : 'مکان دقیق GPS (نزدیک ' + nearest.nameFa + ')';
          saveCustomGpsCoords(lat, lng, label);
          setCustomGps({ lat, lng, labelFa: label });
          setGuestCityId(nearest.id);
          setGuestCityIdState(nearest.id);
          if (profile) await updateProfile({ city_id: nearest.id });

          const recMethod = getRecommendedMethodForCountry(nearest.countryCode);
          if (recMethod !== currentMethod && nearest.countryCode !== 'IR') {
            setGpsStatusMsg(
              '✅ مکان دقیق ثبت شد: ' +
                label +
                ' · روش پیشنهادی این منطقه: ' +
                (methods.find((m) => m.id === recMethod)?.name || recMethod)
            );
          } else {
            setGpsStatusMsg('✅ مکان دقیق GPS روی ' + label + ' تنظیم و اوقات شرعی به‌روزرسانی شد.');
          }
          window.dispatchEvent(new Event('noor-city-changed'));
          await rescheduleAllReminders(notifEnabled);
        } finally {
          setGpsDetecting(false);
        }
      },
      () => {
        setGpsDetecting(false);
        setGpsStatusMsg('⚠️ دسترسی مکان (GPS) داده نشد یا لوکیشن گوشی خاموش است.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const applyTheme = async (id: string) => {
    setThemeId(id);
    const matched = getAllThemes().find((t) => t.id === id);
    if (matched?.wallpaperUrl) {
      saveHeroConfig({ mode: 'manual', selectedId: 'ota_theme_wp_' + matched.id });
    }
    if (profile) await updateProfile({ theme_id: id });
  };

  const applyAdhan = async (id: string) => {
    try { localStorage.setItem(GUEST_ADHAN_KEY, id); } catch {}
    setGuestAdhanId(id);
    if (profile) await updateProfile({ adhan_id: id });
    window.dispatchEvent(new Event('noor-adhan-config-changed'));
    await rescheduleAllReminders(notifEnabled);
  };

  const applyMethod = async (id: string) => {
    try { localStorage.setItem('noor_guest_calc_method', id); } catch {}
    setGuestMethod(id);
    if (profile) await updateProfile({ calculation_method: id });
    window.dispatchEvent(new Event('noor-calc-method-changed'));
    await rescheduleAllReminders(notifEnabled);
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
        {isRtl ? t('common.back') + ' →' : '← ' + t('common.back')}
      </button>
    </div>
  );

  // ۰. زیرصفحه انتخاب زبان برنامه (فارسی / English / Español)
  if (section === 'language') {
    return (
      <div className="w-full max-w-xl mx-auto px-3.5 pt-4 pb-28 animate-fade-in" dir={dir}>
        <SubHeader title={t('lang.title')} />

        <div
          className="rounded-2xl p-3.5 border mb-4 text-xs text-muted leading-relaxed"
          style={{
            background: 'color-mix(in srgb, ' + theme.primary + ' 10%, ' + theme.surface + ')',
            borderColor: 'color-mix(in srgb, ' + theme.primary + ' 35%, ' + theme.border + ')',
          }}
        >
          {t('lang.intro')}
        </div>

        <div className="space-y-3">
          {LANGUAGE_OPTIONS.map((opt) => {
            const active = lang === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setLang(opt.id);
                }}
                className="w-full card-flat p-4 flex items-center justify-between gap-3 transition-all active:scale-[0.99]"
                style={{
                  borderColor: active ? theme.primary : theme.border,
                  background: active
                    ? 'color-mix(in srgb, ' + theme.primary + ' 14%, ' + theme.surface + ')'
                    : theme.surface,
                }}
              >
                <div className={isRtl ? 'text-right' : 'text-left'}>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-app">{opt.nativeName}</span>
                    <span className="text-[11px] font-bold text-muted">({opt.englishName})</span>
                  </div>
                  <p className="text-[11px] text-muted mt-1">{opt.regionNote}</p>
                </div>
                {active ? (
                  <span
                    className="px-2.5 py-1 rounded-full text-[10px] font-black flex items-center gap-1 shrink-0"
                    style={{ background: theme.primary, color: theme.bg }}
                  >
                    <Check size={12} /> {t('lang.currentBadge')}
                  </span>
                ) : (
                  <span
                    className="px-2.5 py-1 rounded-full text-[10px] font-bold border text-muted shrink-0"
                    style={{ borderColor: theme.border }}
                  >
                    {opt.dir.toUpperCase()}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ۱. زیرصفحه فونت، اندازه نوشته و حالت نمایش قرآن
  if (section === 'typography') {
    return (
      <div className="w-full max-w-xl mx-auto px-3.5 pt-4 pb-28 animate-fade-in" dir={dir}>
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
      <div className="w-full max-w-xl mx-auto px-3.5 pt-4 pb-28 animate-fade-in" dir={dir}>
        <SubHeader title="شخصی‌سازی بخش‌های صفحه اول" />
        <p className="text-xs text-muted mb-4 leading-relaxed">
          اگر دوست دارید صفحهٔ اول برنامه خلوت‌تر باشد یا فقط اوقات شرعی را ببینید، می‌توانید هر یک از بخش‌های زیر را به دلخواه روشن یا خاموش کنید:
        </p>

        <div className="space-y-3">
          {[
            {
              key: 'showDeenWidgets' as const,
              title: 'کارت‌های میانبر صفحه خانه',
              desc: 'نمایش دو کارت میان‌بر وضعیت سفر/مسجد و آخرین آیه خوانده‌شده در صفحه اول',
            },
            {
              key: 'showContextualTip' as const,
              title: 'پیشنهاد معنوی روزانه',
              desc: 'پیشنهاد ذکر و سوره متناسب با روز هفته (چهارشنبه امام رضا ع، شب جمعه و...) و ساعت روز',
            },
            {
              key: 'showDailySummary' as const,
              title: 'خلاصه فعالیت امروز',
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
      <div className="w-full max-w-xl mx-auto px-3.5 pt-4 pb-28 animate-fade-in" dir={dir}>
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

  // ۴. امنیت توکن نشان: مدیریت توکن به صورت کامل در لایه سرویس داخلی انجام می‌شود

  // ۵. زیرصفحه پوسته‌ها
  if (section === 'theme') {
    return (
      <div className="w-full max-w-xl mx-auto px-3.5 pt-4 pb-28 animate-fade-in" dir={dir}>
        <SubHeader title="پوسته و ظاهر" />
          <ThemeHeroSelectorCard theme={theme} />
        <div className="grid grid-cols-2 gap-3">
          {allThemes.map((t) => (
            <button
              key={t.id}
              onClick={() => void applyTheme(t.id)}
              className="card-flat p-4 text-right relative overflow-hidden"
              style={{ borderColor: themeId === t.id ? t.primary : theme.border }}
            >
              <div className="w-full h-20 rounded-xl mb-3" style={{ background: t.gradient }} />
              {t.isRemoteOta && (
                <span
                  className="inline-block mb-1 px-2 py-0.5 rounded-full text-[9px] font-black"
                  style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}
                >
                  ✨ {t.occasionFa || 'پوسته جدید آنلاین'}
                </span>
              )}
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

  // ۶. زیرصفحه انتخاب شهر و مکان‌یابی جهانی
  if (section === 'city') {
    const q = citySearch.trim().toLowerCase();
    const filteredCities = CITIES.filter((c) => {
      if (cityRegion !== 'all' && c.region !== cityRegion) return false;
      if (!q) return true;
      return (
        c.nameFa.includes(q) ||
        c.countryFa.includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        (c.nameEs || '').toLowerCase().includes(q) ||
        (c.countryEs || '').toLowerCase().includes(q)
      );
    });
    const grouped = filteredCities.reduce<Record<string, City[]>>((acc, c) => {
      const cName = getCountryDisplayName(c, lang);
      (acc[cName] ??= []).push(c);
      return acc;
    }, {});

    const regionTabs: { id: 'all' | CityRegion; label: string }[] = [
      { id: 'all', label: t('city.regionAll') + ' (' + formatDigits(CITIES.length) + ')' },
      { id: 'iran', label: t('city.regionIran') },
      { id: 'middle_east', label: t('city.regionMiddleEast') },
      { id: 'europe', label: t('city.regionEurope') },
      { id: 'north_america', label: t('city.regionNorthAmerica') },
      { id: 'latin_america', label: t('city.regionLatinAmerica') },
      { id: 'asia_oceania', label: t('city.regionAsiaOceania') },
      { id: 'africa', label: t('city.regionAfrica') },
    ];

    return (
      <div className="w-full max-w-xl mx-auto px-3.5 pt-4 pb-28 animate-fade-in" dir={dir}>
        <SubHeader title={t('city.title')} />

        {/* کارت مکان‌یابی سریع GPS برای دقت ۱۰۰٪ روی مختصات واقعی کاربر در کل دنیا */}
        <div
          className="rounded-3xl p-4 border mb-4 space-y-2.5 shadow-lg"
          style={{
            background: 'radial-gradient(circle at top left, color-mix(in srgb, ' + theme.primary + ' 18%, ' + theme.surface + '), ' + theme.surface + ')',
            borderColor: 'color-mix(in srgb, ' + theme.primary + ' 45%, ' + theme.border + ')',
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-black text-app">{t('city.gpsTitle')}</p>
              <p className="text-[10.5px] text-muted mt-0.5">
                {customGps
                  ? t('city.gpsActivePrefix') + ' ' + (customGps.labelFa || getCityDisplayName(currentCity, lang))
                  : t('city.gpsDesc')}
              </p>
            </div>
            {customGps && (
              <button
                type="button"
                onClick={() => {
                  clearCustomGpsCoords();
                  setCustomGps(null);
                  setGpsStatusMsg('مختصات GPS پاک شد و روی مرکز شهر انتخابی برگشت.');
                  window.dispatchEvent(new Event('noor-city-changed'));
                }}
                className="px-2.5 py-1 rounded-xl text-[10px] font-bold border text-muted shrink-0"
                style={{ borderColor: theme.border }}
              >
                حذف GPS
              </button>
            )}
          </div>

          <button
            type="button"
            disabled={gpsDetecting}
            onClick={handleDetectGpsLocation}
            className="w-full py-2.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-transform active:scale-[0.99] disabled:opacity-60"
            style={{ background: theme.primary, color: theme.bg }}
          >
            <Navigation size={14} />
            <span>{gpsDetecting ? t('city.gpsDetecting') : t('city.gpsBtn')}</span>
          </button>

          {gpsStatusMsg && (
            <p className="text-[11px] font-bold text-primary leading-relaxed">{gpsStatusMsg}</p>
          )}
        </div>

        <input
          type="text"
          value={citySearch}
          onChange={(e) => setCitySearch(e.target.value)}
          placeholder={t('city.searchPlaceholder')}
          className="w-full px-4 py-3 rounded-2xl text-xs text-app border outline-none mb-3"
          style={{ borderColor: theme.border, background: theme.surface }}
        />

        {/* فیلتر سریع مناطق جهان */}
        <div className="flex gap-1.5 overflow-x-auto pb-3 mb-2">
          {regionTabs.map((rt) => {
            const active = cityRegion === rt.id;
            return (
              <button
                key={rt.id}
                type="button"
                onClick={() => setCityRegion(rt.id)}
                className="px-3 py-1.5 rounded-full text-[10.5px] font-bold border shrink-0 transition-all"
                style={{
                  borderColor: active ? theme.primary : theme.border,
                  background: active ? theme.primary : theme.surface,
                  color: active ? theme.bg : theme.textMuted,
                }}
              >
                {rt.label}
              </button>
            );
          })}
        </div>

        {Object.keys(grouped).length === 0 ? (
          <p className="text-xs text-muted text-center py-8">
            {t('city.empty')}
          </p>
        ) : (
          Object.entries(grouped).map(([country, cities]) => (
            <div key={country} className="mb-5">
              <p className="text-muted text-xs font-semibold mb-2">
                {country} ({toFaDigits(cities.length)})
              </p>
              <div className="space-y-2">
                {cities.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => void applyCity(c.id)}
                    className="w-full card-flat p-4 flex items-center justify-between"
                    style={{ borderColor: currentCityId === c.id && !customGps ? theme.primary : theme.border }}
                  >
                    <div className="text-right">
                      <p className="text-app font-bold text-sm">{getCityDisplayName(c, lang)} {lang === 'fa' && <span className="text-[11px] font-normal text-muted">({c.name})</span>}</p>
                      <p className="text-muted text-[11px]" dir="ltr">{c.timezone}</p>
                    </div>
                    {currentCityId === c.id && !customGps && <Check size={18} color={theme.primary} />}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  // ۷. زیرصفحه روش محاسبه
  if (section === 'method') {
    const updateOffset = (key: keyof PrayerManualOffsets, delta: number) => {
      const next: PrayerManualOffsets = {
        ...manualOffsets,
        [key]: Math.max(-5, Math.min(5, manualOffsets[key] + delta)),
      };
      setManualOffsets(next);
      savePrayerManualOffsets(next);
      void rescheduleAllReminders(notifEnabled);
    };

    const resetOffsets = () => {
      const zero: PrayerManualOffsets = { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
      setManualOffsets(zero);
      savePrayerManualOffsets(zero);
      void rescheduleAllReminders(notifEnabled);
    };

    return (
      <div className="w-full max-w-xl mx-auto px-3.5 pt-4 pb-28 animate-fade-in" dir={dir}>
        <SubHeader title={t('method.title')} />

        <div
          className="rounded-2xl p-3.5 border mb-4 text-[11px] text-muted leading-relaxed"
          style={{
            background: 'color-mix(in srgb, ' + theme.primary + ' 10%, ' + theme.surface + ')',
            borderColor: 'color-mix(in srgb, ' + theme.primary + ' 35%, ' + theme.border + ')',
          }}
        >
          {t('method.intro')}
        </div>

        <div className="space-y-2">
          {methods.map((m) => (
            <button
              key={m.id}
              onClick={() => void applyMethod(m.id)}
              className="w-full card-flat p-4 flex items-center justify-between"
              style={{ borderColor: currentMethod === m.id ? theme.primary : theme.border }}
            >
              <div className="text-right">
                <p className="text-app font-bold text-sm">{lang === 'en' ? m.nameEn : lang === 'es' ? m.nameEs : m.name}</p>
                <p className="text-[10.5px] mt-0.5" style={{ color: m.id === 'tehran' ? theme.primary : theme.textMuted }}>
                  {lang === 'en' ? m.regionEn : lang === 'es' ? m.regionEs : m.regionFa}
                </p>
              </div>
              {currentMethod === m.id && <Check size={18} color={theme.primary} />}
            </button>
          ))}
        </div>

        {/* انتخابگر فقه وقت عصر (استاندارد / حنفی برای کاربران جهانی) */}
        <div className="mt-5 rounded-3xl p-4 border space-y-2.5" style={{ background: theme.surface, borderColor: theme.border }}>
          <div>
            <p className="text-xs font-black text-app">{t('method.asrTitle')}</p>
            <p className="text-[10.5px] text-muted mt-0.5">
              {t('method.asrDesc')}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { id: 'standard' as AsrMadhab, label: t('method.asrStandard') },
                { id: 'hanafi' as AsrMadhab, label: t('method.asrHanafi') },
              ]
            ).map((opt) => {
              const active = asrMadhab === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setAsrMadhabState(opt.id);
                    saveAsrMadhab(opt.id);
                    void rescheduleAllReminders(notifEnabled);
                  }}
                  className="py-2.5 px-2 rounded-2xl text-[11px] font-black border transition-all"
                  style={{
                    borderColor: active ? theme.primary : theme.border,
                    background: active ? theme.primary : theme.bg,
                    color: active ? theme.bg : theme.textMuted,
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* کشوی اختیاری تنظیم احتیاط شرعی دستی (بسته به صورت پیش‌فرض) */}
        <div className="mt-5 rounded-3xl border overflow-hidden" style={{ background: theme.surface, borderColor: theme.border }}>
          <button
            type="button"
            onClick={() => setShowManualOffsets((v) => !v)}
            className="w-full px-4 py-3.5 flex items-center justify-between text-right"
          >
            <div>
              <p className="text-xs font-black text-app">{t('method.manualTitle')}</p>
              <p className="text-[10.5px] text-muted mt-0.5">
                {hasNonZeroManualOffsets(manualOffsets)
                  ? t('method.manualActive')
                  : t('method.manualDefault')}
              </p>
            </div>
            <span className="text-xs font-bold text-primary shrink-0">
              {showManualOffsets ? t('method.manualClose') : t('method.manualOpen')}
            </span>
          </button>

          {showManualOffsets && (
            <div className="px-4 pb-4 pt-2 border-t space-y-2.5" style={{ borderColor: theme.border }}>
              <p className="text-[10.5px] text-muted leading-relaxed">
                {t('method.manualHint')}
              </p>
              {(
                [
                  { key: 'fajr', label: 'اذان صبح' },
                  { key: 'dhuhr', label: 'اذان ظهر' },
                  { key: 'asr', label: 'اذان عصر' },
                  { key: 'maghrib', label: 'اذان مغرب' },
                  { key: 'isha', label: 'اذان عشاء' },
                ] as const
              ).map((item) => {
                const v = manualOffsets[item.key];
                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between py-1.5 px-3 rounded-xl border"
                    style={{ background: theme.bg, borderColor: theme.border }}
                  >
                    <span className="text-xs font-bold text-app">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateOffset(item.key, -1)}
                        className="w-7 h-7 rounded-lg border text-xs font-black text-app"
                        style={{ borderColor: theme.border }}
                      >
                        −
                      </button>
                      <span
                        dir="ltr"
                        className="w-14 text-center text-xs font-black"
                        style={{ color: v === 0 ? theme.textMuted : theme.primary }}
                      >
                        {v > 0 ? '+' + toFaDigits(v) : toFaDigits(v)} دقیقه
                      </span>
                      <button
                        type="button"
                        onClick={() => updateOffset(item.key, 1)}
                        className="w-7 h-7 rounded-lg border text-xs font-black text-app"
                        style={{ borderColor: theme.border }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
              {hasNonZeroManualOffsets(manualOffsets) && (
                <button
                  type="button"
                  onClick={resetOffsets}
                  className="w-full py-2 rounded-xl text-[11px] font-black border"
                  style={{ borderColor: theme.primary, color: theme.primary }}
                >
                  {t('method.manualReset')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ۸. زیرصفحه کلکسیون مؤذنان (ایران، مصر، ترکیه، حرمین) + انتخاب مدت پخش
  if (section === 'adhan') {
    const handleChangeDurationMode = (m: AdhanPlaybackDurationMode) => {
      setDurationModeState(m);
      setAdhanDurationMode(m);
      window.dispatchEvent(new Event('noor-adhan-config-changed'));
      void rescheduleAllReminders(notifEnabled);
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
        await playAdhanPreview(a, dur, 100, () => {
          setPreviewingId((prev) => (prev === a.id ? null : prev));
        });
      } catch {
        setPreviewingId(null);
      }
    };

    return (
      <div className="w-full max-w-xl mx-auto px-3.5 pt-4 pb-28 animate-fade-in" dir={dir}>
        {/* بنر تست واقعی ۵ ثانیه بعد اذان در حالت قفل صفحه */}
        <div className="max-w-lg mx-auto px-4 pt-3">
          <div className="p-4 rounded-3xl border space-y-2" style={{ background: 'rgba(16, 185, 129, 0.14)', borderColor: '#34D399' }}>
            <p className="text-xs font-black text-white">⏱️ تست اذان در صفحه قفل</p>
            <p className="text-[11px] text-emerald-200/90 leading-relaxed">
              دکمه زیر را بزنید و بلافاصله صفحه گوشی را قفل کنید؛ ۵ ثانیه بعد صدای مؤذن انتخابی روی صفحه قفل پخش می‌شود:
            </p>
            <button
              type="button"
              onClick={async () => {
                const chosenId = localStorage.getItem('noor_guest_adhan_id') || 'moazenzadeh_ardabili';
                const chosenObj = allAdhans.find((a) => a.id === chosenId) || adhans[0];
                const durSec = getAdhanDurationSeconds(durationMode);
                const durLabel = durSec === 10 ? '۱۰ ثانیه اول' : durSec === 30 ? '۳۰ ثانیه اول' : 'اذان کامل';
                if (Capacitor.isNativePlatform()) {
                  await NoorAlarm.scheduleNativeAlarm({
                    id: 70998,
                    triggerAtMillis: Date.now() + 5000,
                    title: '🕌 تست پخش اذان روی صفحه قفل',
                    body: `همراه معنوی نور — ${chosenObj?.nameFa || 'اذان انتخابی شما'} (${durLabel})`,
                    soundType: 'adhan',
                    adhanId: chosenId,
                    audioUrl: chosenObj?.audioUrl || '',
                    durationSeconds: durSec,
                    volumePercent: 100,
                  });
                  setAdhanNotice(`⏱️ تست اذان (${durLabel}) برای ۵ ثانیه دیگر کوک شد! همین الان صفحه گوشی را قفل کنید.`);
                } else {
                  void playAdhanPreview(chosenObj, durSec, 100);
                  setAdhanNotice(`🔊 در حال پخش پیش‌نمایش (${durLabel})...`);
                }
              }}
              className="w-full py-2.5 rounded-2xl text-xs font-black shadow-md transition-transform active:scale-95"
              style={{ background: '#10B981', color: '#041B15' }}
            >
              🚀 اجرای تست (۵ ثانیه بعد)
            </button>
          </div>
        </div>
        <SubHeader title="انتخاب مؤذن و اذان" />

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
            <h2 className="text-sm font-black text-app">⏱️ مدت پخش اذان</h2>
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
          {allAdhans.map((a) => {
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
      <div className="w-full max-w-xl mx-auto px-3.5 pt-4 pb-28 animate-fade-in" dir={dir}>
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
        {isRtl ? <ChevronLeft size={16} color={theme.textMuted} /> : <ChevronRight size={16} color={theme.textMuted} />}
      </div>
    </button>
  );

  return (
    <div className="w-full max-w-xl mx-auto px-3.5 pt-4 pb-28 animate-fade-in" dir={dir}>
      {showGuide && <AppTutorialModal onClose={() => setShowGuide(false)} />}
      {showPreAdhanModal && <AdhanStudioAndTravelModal initialSection="studio" onClose={() => setShowPreAdhanModal(false)} />}
      {showVipModal && <VipAndAnalyticsModal initialTab="vip" onClose={() => setShowVipModal(false)} />}
      {showGlobalSyncHub && (
        <GlobalSyncHubModal
          onClose={() => setShowGlobalSyncHub(false)}
          onOpenAuth={onExitGuest}
          onAppliedAdhan={(id) => setGuestAdhanId(id)}
        />
      )}

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-black text-app">{t('settings.title')}</h1>
        <button
          type="button"
          onClick={() => setShowGuide(true)}
          className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1"
          style={{ background: `color-mix(in srgb, ${theme.primary} 15%, transparent)`, color: theme.primary }}
        >
          <HelpCircle size={14} />
          <span>{t('settings.guide')}</span>
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
              <p className="text-app font-bold text-sm">{profile?.display_name || (user ? t('common.noorUser') : t('common.guest'))}</p>
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
                {d === 7 ? t('settings.period7') : d === 30 ? t('settings.period30') : t('settings.period90')}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center pt-1">
          <div className="card-flat p-2">
            <p className="text-base font-black text-primary">{dash.totalCount.toLocaleString('fa-IR')}</p>
            <p className="text-[10px] text-muted">{t('settings.statTotalDhikr')}</p>
          </div>
          <div className="card-flat p-2">
            <p className="text-base font-black text-accent">{dash.totalRounds.toLocaleString('fa-IR')}</p>
            <p className="text-[10px] text-muted">{t('settings.statRounds')}</p>
          </div>
          <div className="card-flat p-2">
            <p className="text-base font-black text-primary">{dash.streakDays.toLocaleString('fa-IR')} روز</p>
            <p className="text-[10px] text-muted">{t('settings.statStreak')}</p>
          </div>
        </div>
        {topDhikrObj && (
          <p className="text-[11px] text-muted text-center">
            محبوب‌ترین ذکر شما: <strong className="text-app">{topDhikrObj.arabic}</strong>
          </p>
        )}

        {/* تنظیم تاریخ تولد شمسی برای تبریک ویژه روز تولد */}
        <div className="pt-2.5 border-t space-y-2" style={{ borderColor: theme.border }}>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted font-bold">{t('settings.birthdayLabel')}</span>
            <button
              type="button"
              onClick={() => setShowBirthdayEditor((v) => !v)}
              className="text-primary font-black text-[11px]"
            >
              {birthday ? formatBirthdayFa(birthday) + ' (ویرایش)' : 'ثبت تاریخ تولد ←'}
            </button>
          </div>
          {showBirthdayEditor && (
            <div className="p-3 rounded-2xl border space-y-2" style={{ background: theme.bg, borderColor: theme.border }}>
              <div className="grid grid-cols-3 gap-1.5">
                <select
                  value={bDay}
                  onChange={(e) => setBDay(Number(e.target.value))}
                  className="px-2 py-2 rounded-xl text-xs text-app border outline-none"
                  style={{ background: theme.surface, borderColor: theme.border }}
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>{toFaDigits(d)}</option>
                  ))}
                </select>
                <select
                  value={bMonth}
                  onChange={(e) => setBMonth(Number(e.target.value))}
                  className="px-2 py-2 rounded-xl text-xs text-app border outline-none"
                  style={{ background: theme.surface, borderColor: theme.border }}
                >
                  {jalaliMonths.map((mName, idx) => (
                    <option key={mName} value={idx + 1}>{mName}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1300}
                  max={1415}
                  value={bYear}
                  onChange={(e) => setBYear(e.target.value)}
                  placeholder="سال (اختیاری)"
                  className="px-2 py-2 rounded-xl text-xs text-app border outline-none"
                  style={{ background: theme.surface, borderColor: theme.border }}
                />
              </div>
              <button
                type="button"
                onClick={async () => {
                  const parsedYear = parseInt(bYear, 10);
                  const nextB: UserBirthday = {
                    month: bMonth,
                    day: bDay,
                    year: Number.isFinite(parsedYear) && parsedYear >= 1300 && parsedYear <= 1415 ? parsedYear : null,
                  };
                  await saveUserBirthday(nextB, user?.id);
                  setBirthday(nextB);
                  setShowBirthdayEditor(false);
                }}
                className="w-full py-2 rounded-xl text-xs font-black"
                style={{ background: theme.primary, color: theme.bg }}
              >
                ذخیره تاریخ تولد 🎂
              </button>
            </div>
          )}
        </div>
      </div>

      {/* دسته‌بندی ۱: زبان، ظاهر و شخصی‌سازی */}
      <p className="text-xs font-bold text-muted mb-2 px-1">{t('settings.catAppearance')}</p>
      <div className="space-y-2 mb-5">
        <RowItem
          icon={Globe}
          title={t('settings.rowLanguage')}
          value={LANGUAGE_OPTIONS.find((l) => l.id === lang)?.nativeName ?? 'فارسی'}
          onClick={() => setSection('language')}
          accent
        />
        <RowItem
          icon={Type}
          title={t('settings.rowTypography')}
          value={selectedFontObj.nameFa.replace('فونت ', '').split(' ')[0]}
          onClick={() => setSection('typography')}
        />
        <RowItem
          icon={Palette}
          title={t('settings.rowTheme')}
          value={allThemes.find((th) => th.id === themeId)?.[lang === 'fa' ? 'nameFa' : 'nameEn'] ?? 'Emerald'}
          onClick={() => setSection('theme')}
        />
        <RowItem
          icon={LayoutGrid}
          title={t('settings.rowCustomize')}
          value={t('settings.rowCustomizeVal')}
          onClick={() => setSection('customize')}
        />
      </div>

      {/* دسته‌بندی ۲: اذان، اوقات شرعی و مکان‌یابی جهانی */}
      <p className="text-xs font-bold text-muted mb-2 px-1">{t('settings.catPrayer')}</p>
      <div className="space-y-2 mb-5">
        <RowItem
          icon={Volume2}
          title={t('settings.rowAdhan')}
          value={selectedAdhanObj.reciter.replace('مرحوم ', '').replace('استاد ', '')}
          onClick={() => setSection('adhan')}
        />
        <RowItem
          icon={MapPin}
          title={t('settings.rowCity')}
          value={customGps ? 'GPS · ' + getCityDisplayName(currentCity, lang) : getCityDisplayName(currentCity, lang)}
          onClick={() => setSection('city')}
        />
        <RowItem
          icon={BookOpen}
          title={t('settings.rowMethod')}
          value={(() => {
            const m = methods.find((x) => x.id === currentMethod);
            if (!m) return 'Tehran';
            return lang === 'en' ? m.nameEn : lang === 'es' ? m.nameEs : m.name;
          })()}
          onClick={() => setSection('method')}
        />
        
      </div>

      {/* دسته‌بندی ۳: سینک گلوبال، گزارش معنوی، پشتیبان‌گیری و اعلان‌ها */}
      <p className="text-xs font-bold text-muted mb-2 px-1">{t('settings.catCloud')}</p>
      <div className="space-y-2 mb-5">
        <RowItem
          icon={RefreshCw}
          title={t('settings.rowGlobalSync')}
          value={
            getCachedGlobalSyncSnapshot().updateAvailable
              ? t('settings.rowGlobalSyncUpdate')
              : formatDigits(getCachedGlobalSyncSnapshot().mediaItems.length) + ' ' + t('settings.rowGlobalSyncCount')
          }
          onClick={() => setShowGlobalSyncHub(true)}
          accent
        />

        <RowItem
          icon={Crown}
          title={t('settings.rowAnalytics')}
          value={t('settings.rowAnalyticsVal')}
          onClick={() => setShowVipModal(true)}
        />

        <RowItem
          icon={Database}
          title={t('settings.rowBackup')}
          value={t('settings.rowBackupVal')}
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
              <span className="text-app font-bold text-sm">{t('settings.rowNotifications')}</span>
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
              <span>{t('settings.notifAndroidOnly')}</span>
            </div>
          )}
        </div>

        
      </div>

        {/* دسته‌بندی ویژه: ارتباط با سازنده و پشتیبانی مستقیم */}
        <p className="text-xs font-bold text-muted mb-2 mt-5 px-1">{t('settings.catSupport')}</p>
        <div
          onClick={() => setShowContactDeveloperModal(true)}
          role="button"
          tabIndex={0}
          className="w-full p-4 rounded-3xl border flex items-center justify-between text-right mb-4 cursor-pointer transition-transform active:scale-[0.99] shadow-lg"
          style={{
            background: `linear-gradient(135deg, color-mix(in srgb, ${theme.primary} 18%, ${theme.surface}) 0%, ${theme.surface} 100%)`,
            borderColor: theme.primary,
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg shrink-0"
              style={{ background: theme.primaryGlow, border: `1px solid ${theme.primary}` }}
            >
              ✉️
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-black text-white">{t('settings.supportTitle')}</p>
              <p className="text-[11px] text-emerald-200/90 mt-0.5 truncate" dir="ltr">
                ycnakbari@gmail.com
              </p>
              <p className="text-[10px] text-muted mt-0.5">
                {t('settings.supportSubtitle')}
              </p>
            </div>
          </div>
          <span
            className="px-3 py-1.5 rounded-xl text-xs font-black shrink-0"
            style={{ background: theme.primary, color: theme.bg }}
          >
            {isRtl ? t('settings.supportBtn') + ' ←' : t('settings.supportBtn') + ' →'}
          </span>
        </div>

        {/* مودال اختصاصی ارسال پیام به ایمیل سازنده (ycnakbari@gmail.com) */}
        {showContactDeveloperModal && <ContactYasinModal onClose={() => setShowContactDeveloperModal(false)} />}


      {user ? (
        <button
          onClick={() => void signOut()}
          className="w-full mt-4 py-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold"
          style={{ background: 'rgba(239,68,68,0.12)', color: '#fca5a5' }}
        >
          <LogOut size={16} /> {t('settings.signOut')}
        </button>
      ) : onExitGuest ? (
        <button
          onClick={onExitGuest}
          className="w-full mt-4 py-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold"
          style={{ background: theme.primary, color: theme.bg }}
        >
          <LogIn size={16} /> {t('settings.signInCta')}
        </button>
      ) : null}
    </div>
  );
}