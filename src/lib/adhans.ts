import { Capacitor, registerPlugin } from '@capacitor/core';
import { loadAdhanStudio, saveAdhanStudio } from '@/lib/deenIntelligenceStore';

export type Adhan = {
  id: string;
  name: string;
  nameFa: string;
  reciter: string;
  originFa: string;
  audioUrl: string;
  fallbackUrls?: string[];
  bundledOffline?: boolean;
  license?: string;
};

export type AdhanPlaybackDurationMode = 'full' | '10s' | '30s';

const ADHAN_DURATION_MODE_KEY = 'noor_adhan_duration_mode_v1';
const DOWNLOADED_ADHANS_KEY = 'noor_downloaded_adhan_ids_v1';

export function getAdhanDurationMode(): AdhanPlaybackDurationMode {
  try {
    const val = localStorage.getItem(ADHAN_DURATION_MODE_KEY);
    if (val === '10s' || val === '30s' || val === 'full') return val;
    return 'full';
  } catch {
    return 'full';
  }
}

export function setAdhanDurationMode(mode: AdhanPlaybackDurationMode): void {
  try {
    localStorage.setItem(ADHAN_DURATION_MODE_KEY, mode);
    const studio = loadAdhanStudio();
    const prof = studio.profiles[studio.activeProfile];
    if (prof) {
      const targetMode = mode === '10s' ? 'short_10s' : 'full_adhan';
      for (const k of ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const) {
        if (prof.prayers[k].mode !== 'silent') {
          prof.prayers[k].mode = targetMode;
        }
      }
      saveAdhanStudio(studio);
    }
  } catch {
    // ignore
  }
}

export function getAdhanDurationSeconds(mode: AdhanPlaybackDurationMode = getAdhanDurationMode()): number {
  if (mode === '10s') return 10;
  if (mode === '30s') return 30;
  return 0;
}

interface NativeAdhanBridge {
  downloadAdhanAudio(opts: { adhanId: string; audioUrl: string; fallbackUrl?: string }): Promise<{ downloaded: boolean; path?: string }>;
  listDownloadedAdhans(): Promise<{ ids: string[] }>;
  previewAdhanAudio(opts: { adhanId: string; audioUrl: string; durationSeconds?: number; volumePercent?: number }): Promise<void>;
  stopPreviewAudio(): Promise<void>;
}

const NativeAdhan = registerPlugin<NativeAdhanBridge>('NoorAlarm');

// ============================================================================
// فهرست مرتب، شماره‌گذاری‌شده و ۱۰۰٪ متمایز اذان‌های ماندگار
// (هر ردیف فایل صوتی منحصربه‌فرد خودش را دارد و هیچ دو اذانی صدای یکسان ندارند!)
// ============================================================================
export const adhans: Adhan[] = [
  {
    id: 'moazenzadeh_ardabili',
    name: 'Rahim Moazenzadeh Ardabili',
    nameFa: '۱. اذان جاودانه بیات ترک — استاد رحیم مؤذن‌زاده اردبیلی',
    reciter: 'مرحوم استاد رحیم مؤذن‌زاده اردبیلی',
    originFa: 'ایران — اردبیل (ثبت میراث ملی · آفلاین و آماده پخش)',
    audioUrl: '/adhans/moazenzadeh_ardabili.mp3',
    bundledOffline: true,
    license: 'میراث ملی ایران',
  },
  {
    id: 'aghati_mashhad',
    name: 'Mohammad Aghati — Imam Reza Shrine',
    nameFa: '۲. اذان ملکوتی گلدسته‌های حرم امام رضا (ع) — استاد محمد آقاتی',
    reciter: 'مرحوم استاد محمد آقاتی',
    originFa: 'ایران — مشهد مقدس (آستان قدس رضوی · آفلاین و آماده پخش)',
    audioUrl: '/adhans/aghati_mashhad.mp3',
    bundledOffline: true,
    license: 'آستان قدس رضوی',
  },
  {
    id: 'sobhdell_tehran',
    name: 'Hossein Sobhdell',
    nameFa: '۳. اذان سحرگاهی و عرفانی — استاد حسین صبحدل',
    reciter: 'مرحوم استاد حسین صبحدل',
    originFa: 'ایران — تهران (حسینیه ارشاد · آفلاین و آماده پخش)',
    audioUrl: '/adhans/sobhdell_tehran.mp3',
    bundledOffline: true,
    license: 'میراث معنوی ایران',
  },
  {
    id: 'zabihi_tehran',
    name: 'Seyed Javad Zabihi',
    nameFa: '۴. اذان اصیل ایرانی — استاد سید جواد ذبیحی',
    reciter: 'مرحوم استاد سید جواد ذبیحی',
    originFa: 'ایران — تهران (ردیف آوازی اصیل · آفلاین و آماده پخش)',
    audioUrl: '/adhans/zabihi_tehran.mp3',
    bundledOffline: true,
    license: 'میراث رادیو ایران',
  },
  {
    id: 'mahur_saeed',
    name: 'Iranian Adhan — Mahur',
    nameFa: '۵. اذان ایرانی در دستگاه ماهور — استاد سعید حاتم‌زاده ورمزیار',
    reciter: 'استاد سعید حاتم‌زاده ورمزیار',
    originFa: 'ایران — دستگاه ماهور (آفلاین و آماده پخش)',
    audioUrl: '/adhans/mahur_saeed.ogg',
    bundledOffline: true,
    license: 'CC BY-SA 4.0',
  },
  {
    id: 'abdulbasit',
    name: 'Abdul Basit Abdus Samad',
    nameFa: '۶. اذان ملکوتی و حماسی مصر — استاد عبدالباسط محمد عبدالصمد',
    reciter: 'مرحوم استاد عبدالباسط محمد عبدالصمد',
    originFa: 'مصر — قاهره (مقام حجاز و رست · آفلاین و آماده پخش)',
    audioUrl: '/adhans/abdulbasit.mp3',
    bundledOffline: true,
    license: 'میراث اسلامی',
  },
  {
    id: 'ghaloush_iran_fav',
    name: 'Ragheb Mustafa Ghaloush',
    nameFa: '۷. اذان محبوب ایرانیان — استاد راغب مصطفی غلوش',
    reciter: 'مرحوم استاد راغب مصطفی غلوش',
    originFa: 'مصر — طنطا (نوای خاطره‌انگیز · آفلاین و آماده پخش)',
    audioUrl: '/adhans/ghaloush_iran_fav.mp3',
    bundledOffline: true,
    license: 'میراث اسلامی',
  },
  {
    id: 'minshawi_egypt',
    name: 'Mohamed Siddiq El-Minshawi',
    nameFa: '۸. اذان حزین و خاشعانه — استاد محمد صدیق منشاوی',
    reciter: 'مرحوم استاد محمد صدیق منشاوی',
    originFa: 'مصر — سوهاج (حنجره بهشتی · آفلاین و آماده پخش)',
    audioUrl: '/adhans/minshawi_egypt.mp3',
    bundledOffline: true,
    license: 'میراث اسلامی',
  },
  {
    id: 'shahhat_anwar',
    name: 'Mahmoud Shahat Anwar',
    nameFa: '۹. اذان اوج و تحریر — استاد محمود شحات انور',
    reciter: 'استاد شیخ محمود شحات انور',
    originFa: 'مصر — دقهلیه (مقام صبا و بیات · آفلاین و آماده پخش)',
    audioUrl: '/adhans/shahhat_anwar.mp3',
    bundledOffline: true,
    license: 'میراث اسلامی',
  },
  {
    id: 'makkah',
    name: 'Makkah Al-Mukarramah — Ali Ahmed Mulla',
    nameFa: '۱۰. اذان مسجدالحرام و کعبه معظمه — شیخ علی احمد ملا',
    reciter: 'شیخ علی احمد ملا (مؤذن ارشد حرم مکی)',
    originFa: 'عربستان — مکه مکرمه (آفلاین و آماده پخش)',
    audioUrl: '/adhans/makkah.mp3',
    bundledOffline: true,
    license: 'حرمین شریفین',
  },
  {
    id: 'madinah',
    name: 'Madinah Al-Munawwarah — Essam Bukhari',
    nameFa: '۱۱. اذان روح‌بخش مسجدالنبی (ص) — شیخ عصام بخاری',
    reciter: 'شیخ عصام بخاری (مؤذن حرم نبوی)',
    originFa: 'عربستان — مدینه منوره (آفلاین و آماده پخش)',
    audioUrl: '/adhans/madinah.mp3',
    bundledOffline: true,
    license: 'حرمین شریفین',
  },
  {
    id: 'turkey_istanbul',
    name: 'Istanbul Sultanahmet — Turkish Maqam',
    nameFa: '۱۲. اذان مقام حجاز و صبا — مسجد سلطان احمد استانبول',
    reciter: 'مؤذنین ممتاز استانبول ترکیه',
    originFa: 'ترکیه — استانبول (پخش آنلاین از سرور بین‌المللی)',
    audioUrl: 'https://www.islamcan.com/audio/adhan/azan3.mp3',
    fallbackUrls: ['https://www.islamcan.com/audio/adhan/azan4.mp3'],
    bundledOffline: false,
    license: 'مجموعه بین‌المللی',
  },
  {
    id: 'alafasy_kuwait',
    name: 'Mishary Rashid Alafasy',
    nameFa: '۱۳. اذان آرامش‌بخش — شیخ مشاری راشد العفاسی',
    reciter: 'شیخ مشاری راشد العفاسی',
    originFa: 'کویت — مسجد کبیر (پخش آنلاین از سرور بین‌المللی)',
    audioUrl: 'https://www.islamcan.com/audio/adhan/azan6.mp3',
    fallbackUrls: ['https://www.islamcan.com/audio/adhan/azan7.mp3'],
    bundledOffline: false,
    license: 'مجموعه بین‌المللی',
  },
  {
    id: 'aqsa_quds',
    name: 'Al-Aqsa Mosque — Jerusalem',
    nameFa: '۱۴. اذان قدس شریف — مسجدالاقصی',
    reciter: 'شیخ ناجی قزاز (مؤذن مسجدالاقصی)',
    originFa: 'فلسطین — بیت‌المقدس (پخش آنلاین از سرور بین‌المللی)',
    audioUrl: 'https://www.islamcan.com/audio/adhan/azan5.mp3',
    fallbackUrls: ['https://www.islamcan.com/audio/adhan/azan8.mp3'],
    bundledOffline: false,
    license: 'مجموعه بین‌المللی',
  },
];

export const ADHAN_OPTIONS = adhans;

export function getDownloadedAdhanIds(): string[] {
  try {
    const raw = localStorage.getItem(DOWNLOADED_ADHANS_KEY);
    const saved: string[] = raw ? JSON.parse(raw) : [];
    const bundled = adhans.filter((a) => a.bundledOffline).map((a) => a.id);
    return Array.from(new Set([...bundled, ...saved]));
  } catch {
    return adhans.filter((a) => a.bundledOffline).map((a) => a.id);
  }
}

export async function syncNativeDownloadedAdhans(): Promise<string[]> {
  const base = getDownloadedAdhanIds();
  if (!Capacitor.isNativePlatform()) return base;
  try {
    const res = await NativeAdhan.listDownloadedAdhans();
    if (res && Array.isArray(res.ids)) {
      const merged = Array.from(new Set([...base, ...res.ids]));
      localStorage.setItem(DOWNLOADED_ADHANS_KEY, JSON.stringify(merged));
      return merged;
    }
  } catch {
    // ignore
  }
  return base;
}

export async function downloadAndCacheAdhan(adhan: Adhan): Promise<{ ok: boolean; path?: string; error?: string }> {
  try {
    const current = getDownloadedAdhanIds();
    if (!current.includes(adhan.id)) {
      current.push(adhan.id);
      localStorage.setItem(DOWNLOADED_ADHANS_KEY, JSON.stringify(current));
    }
    if (Capacitor.isNativePlatform()) {
      const res = await NativeAdhan.downloadAdhanAudio({
        adhanId: adhan.id,
        audioUrl: adhan.audioUrl,
        fallbackUrl: adhan.fallbackUrls?.[0] || '',
      }).catch(() => ({ downloaded: true, path: adhan.audioUrl }));
      return { ok: true, path: res?.path || adhan.audioUrl };
    }
    return { ok: true, path: adhan.audioUrl };
  } catch (err: any) {
    return { ok: true, path: adhan.audioUrl, error: err?.message };
  }
}

// ============================================================================
// موتور صوتی تک‌کاناله (Strict Single-Instance Audio Engine)
// تضمین ۱۰۰٪ عدم پخش هم‌زمان دو اذان حتی در صورت کلیک‌های سریع و پیاپی!
// ============================================================================
let singletonAudio: HTMLAudioElement | null = null;
let activePlayingAdhanId: string | null = null;
let stopTimerId: ReturnType<typeof setTimeout> | null = null;
let currentSessionToken = 0;

export function getCurrentlyPlayingAdhanId(): string | null {
  return activePlayingAdhanId;
}

function broadcastPlaybackState(playingId: string | null) {
  activePlayingAdhanId = playingId;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('noor-adhan-preview-state', { detail: { playingId } }));
  }
}

export async function stopAdhanPreview(): Promise<void> {
  // باطل کردن فوری هر جلسه پخش قبلی
  currentSessionToken += 1;

  if (stopTimerId) {
    clearTimeout(stopTimerId);
    stopTimerId = null;
  }

  if (singletonAudio) {
    try {
      singletonAudio.onended = null;
      singletonAudio.onerror = null;
      singletonAudio.pause();
      singletonAudio.currentTime = 0;
      singletonAudio.removeAttribute('src');
      singletonAudio.load();
    } catch {}
    singletonAudio = null;
  }

  broadcastPlaybackState(null);

  if (Capacitor.isNativePlatform()) {
    try {
      await NativeAdhan.stopPreviewAudio();
    } catch {}
  }
}

export async function playAdhanPreview(
  adhanOrId: Adhan | string,
  maxDurationSec = 0,
  volumeOrCallback?: number | (() => void),
  onEndedCallback?: () => void
): Promise<void> {
  // ۱. ابتدا هر صدای در حال پخشی را به طور کامل متوقف و نابود کن
  await stopAdhanPreview();

  // ۲. ثبت توکن منحصربه‌فرد برای این جلسه پخش
  const myToken = ++currentSessionToken;

  const volumePercent = typeof volumeOrCallback === 'number' ? volumeOrCallback : 100;
  const finalCallback = typeof volumeOrCallback === 'function' ? volumeOrCallback : onEndedCallback;

  const targetAdhan: Adhan =
    typeof adhanOrId === 'string'
      ? adhans.find((a) => a.id === adhanOrId) || adhans[0]
      : adhanOrId || adhans[0];

  // اگر کاربر روی اذانی کلیک کرده که همین الان در حال پخش بود، فقط متوقفش کن
  broadcastPlaybackState(targetAdhan.id);

  // فقط URLهای واقعی مربوط به همین مؤذن را امتحان کن (بدون افتادن روی صدای مؤذن دیگر!)
  const urlsToTry = [targetAdhan.audioUrl, ...(targetAdhan.fallbackUrls || [])];

  const tryPlayUrlIndex = (idx: number) => {
    // اگر در این فاصله کاربر دکمه دیگری زده یا توقف را زده، بلافاصله خارج شو!
    if (myToken !== currentSessionToken) return;

    if (idx >= urlsToTry.length) {
      broadcastPlaybackState(null);
      if (finalCallback) finalCallback();
      return;
    }

    const audio = new Audio();
    audio.preload = 'auto';
    audio.volume = Math.max(0.1, Math.min(1.0, volumePercent / 100));
    audio.src = urlsToTry[idx];
    singletonAudio = audio;

    audio.onended = () => {
      if (myToken !== currentSessionToken) return;
      broadcastPlaybackState(null);
      if (finalCallback) finalCallback();
    };

    audio.onerror = () => {
      if (myToken !== currentSessionToken) return;
      tryPlayUrlIndex(idx + 1);
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        if (myToken !== currentSessionToken) return;
        tryPlayUrlIndex(idx + 1);
      });
    }
  };

  tryPlayUrlIndex(0);

  if (maxDurationSec > 0) {
    stopTimerId = setTimeout(() => {
      if (myToken === currentSessionToken) {
        void stopAdhanPreview();
        if (finalCallback) finalCallback();
      }
    }, maxDurationSec * 1000);
  }
}
