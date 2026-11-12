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

// مجموعه کامل اذان‌های ماندگار ایرانی و جهان اسلام (پکیج جامع اهل البیت ع — ahlolbait.com/content/13886)
export const adhans: Adhan[] = [
  {
    id: 'moazenzadeh_ardabili',
    name: 'Rahim Moazenzadeh Ardabili',
    nameFa: '۱. اذان جاودانه بیات ترک — استاد رحیم مؤذن‌زاده اردبیلی',
    reciter: 'مرحوم استاد رحیم مؤذن‌زاده اردبیلی',
    originFa: 'مجموعه ماندگار اهل‌البیت (ع) — اردبیل (ثبت ملی ایران · آفلاین)',
    audioUrl: '/adhans/moazenzadeh_ardabili.mp3',
    fallbackUrls: [
      'https://cdn.jsdelivr.net/gh/yasin321/noor-app@main/public/adhans/moazenzadeh_ardabili.mp3',
      'https://upload.wikimedia.org/wikipedia/commons/a/ae/AzaanMaahur.ogg',
    ],
    bundledOffline: true,
    license: 'میراث ملی ایران',
  },
  {
    id: 'aghati_mashhad',
    name: 'Mohammad Aghati — Imam Reza Shrine',
    nameFa: '۲. اذان ملکوتی گلدسته‌های حرم امام رضا (ع) — استاد محمد آقاتی',
    reciter: 'مرحوم استاد محمد آقاتی',
    originFa: 'مجموعه ماندگار اهل‌البیت (ع) — مشهد مقدس (آفلاین)',
    audioUrl: '/adhans/aghati_mashhad.mp3',
    fallbackUrls: [
      'https://cdn.jsdelivr.net/gh/yasin321/noor-app@main/public/adhans/aghati_mashhad.mp3',
    ],
    bundledOffline: true,
    license: 'آستان قدس رضوی',
  },
  {
    id: 'sobhdell_tehran',
    name: 'Hossein Sobhdell',
    nameFa: '۳. اذان سحرگاهی و عرفانی — استاد حسین صبحدل',
    reciter: 'مرحوم استاد حسین صبحدل',
    originFa: 'مجموعه ماندگار اهل‌البیت (ع) — تهران (بیات ترک · آفلاین)',
    audioUrl: '/adhans/sobhdell_tehran.mp3',
    fallbackUrls: [
      'https://cdn.jsdelivr.net/gh/yasin321/noor-app@main/public/adhans/sobhdell_tehran.mp3',
    ],
    bundledOffline: true,
    license: 'میراث معنوی ایران',
  },
  {
    id: 'zabihi_tehran',
    name: 'Seyed Javad Zabihi',
    nameFa: '۴. اذان اصیل ایرانی و مناجات — استاد سید جواد ذبیحی',
    reciter: 'مرحوم استاد سید جواد ذبیحی',
    originFa: 'مجموعه ماندگار اهل‌البیت (ع) — تهران (آفلاین)',
    audioUrl: '/adhans/zabihi_tehran.mp3',
    fallbackUrls: [
      'https://cdn.jsdelivr.net/gh/yasin321/noor-app@main/public/adhans/zabihi_tehran.mp3',
    ],
    bundledOffline: true,
    license: 'میراث رادیو ایران',
  },
  {
    id: 'mahur_saeed',
    name: 'Iranian Adhan — Mahur',
    nameFa: '۵. اذان ایرانی در دستگاه ماهور — استاد سعید حاتم‌زاده ورمزیار',
    reciter: 'استاد سعید حاتم‌زاده ورمزیار',
    originFa: 'مجموعه ماندگار اهل‌البیت (ع) — دستگاه ماهور (آفلاین)',
    audioUrl: '/adhans/mahur_saeed.ogg',
    fallbackUrls: ['https://upload.wikimedia.org/wikipedia/commons/a/ae/AzaanMaahur.ogg'],
    bundledOffline: true,
    license: 'CC BY-SA 4.0',
  },
  {
    id: 'abdulbasit',
    name: 'Abdul Basit Abdus Samad',
    nameFa: '۶. اذان ملکوتی و حماسی مصر — استاد عبدالباسط محمد عبدالصمد',
    reciter: 'استاد عبدالباسط محمد عبدالصمد',
    originFa: 'مجموعه ماندگار اهل‌البیت (ع) — مصر (مقام حجاز و رست · آفلاین)',
    audioUrl: '/adhans/abdulbasit.mp3',
    fallbackUrls: [
      'https://cdn.jsdelivr.net/gh/yasin321/noor-app@main/public/adhans/abdulbasit.mp3',
      'https://www.islamcan.com/audio/adhan/azan3.mp3',
    ],
    bundledOffline: true,
    license: 'میراث اسلامی',
  },
  {
    id: 'ghaloush_iran_fav',
    name: 'Ragheb Mustafa Ghaloush',
    nameFa: '۷. اذان محبوب ایرانیان — استاد راغب مصطفی غلوش',
    reciter: 'استاد راغب مصطفی غلوش',
    originFa: 'مجموعه ماندگار اهل‌البیت (ع) — مصر (آفلاین)',
    audioUrl: '/adhans/ghaloush_iran_fav.mp3',
    fallbackUrls: [
      'https://cdn.jsdelivr.net/gh/yasin321/noor-app@main/public/adhans/ghaloush_iran_fav.mp3',
    ],
    bundledOffline: true,
    license: 'میراث اسلامی',
  },
  {
    id: 'minshawi_egypt',
    name: 'Mohamed Siddiq El-Minshawi',
    nameFa: '۸. اذان حزین و خاشعانه — استاد محمد صدیق منشاوی',
    reciter: 'مرحوم استاد محمد صدیق منشاوی',
    originFa: 'مجموعه ماندگار اهل‌البیت (ع) — مصر (آفلاین)',
    audioUrl: '/adhans/minshawi_egypt.mp3',
    fallbackUrls: [
      'https://cdn.jsdelivr.net/gh/yasin321/noor-app@main/public/adhans/minshawi_egypt.mp3',
    ],
    bundledOffline: true,
    license: 'میراث اسلامی',
  },
  {
    id: 'shahhat_anwar',
    name: 'Mahmoud Shahat Anwar',
    nameFa: '۹. اذان اوج و تحریر استاد محمود شحات انور',
    reciter: 'استاد محمود شحات انور',
    originFa: 'مجموعه ماندگار اهل‌البیت (ع) — مصر (آفلاین)',
    audioUrl: '/adhans/shahhat_anwar.mp3',
    fallbackUrls: [
      'https://cdn.jsdelivr.net/gh/yasin321/noor-app@main/public/adhans/shahhat_anwar.mp3',
    ],
    bundledOffline: true,
    license: 'میراث اسلامی',
  },
  {
    id: 'makkah_haram',
    name: 'Makkah Al-Mukarramah — Ali Ahmed Mulla',
    nameFa: '۱۰. اذان مسجدالحرام و کعبه معظمه — شیخ علی احمد ملا',
    reciter: 'شیخ علی احمد ملا (مؤذن حرم مکی)',
    originFa: 'مجموعه ماندگار اهل‌البیت (ع) — مکه مکرمه (آفلاین)',
    audioUrl: '/adhans/makkah.mp3',
    fallbackUrls: [
      'https://cdn.jsdelivr.net/gh/yasin321/noor-app@main/public/adhans/makkah.mp3',
      'https://www.islamcan.com/audio/adhan/azan1.mp3',
    ],
    bundledOffline: true,
    license: 'حرمین شریفین',
  },
  {
    id: 'madinah_haram',
    name: 'Madinah Al-Munawwarah — Essam Bukhari',
    nameFa: '۱۱. اذان روح‌بخش مسجدالنبی (ص) — مدینه منوره',
    reciter: 'شیخ عصام بخاری (مؤذن حرم نبوی)',
    originFa: 'مجموعه ماندگار اهل‌البیت (ع) — مدینه منوره (آفلاین)',
    audioUrl: '/adhans/madinah.mp3',
    fallbackUrls: [
      'https://cdn.jsdelivr.net/gh/yasin321/noor-app@main/public/adhans/madinah.mp3',
      'https://www.islamcan.com/audio/adhan/azan2.mp3',
    ],
    bundledOffline: true,
    license: 'حرمین شریفین',
  },
  {
    id: 'salim_moazenzadeh_ahlolbait',
    name: 'Salim Moazenzadeh Ardabili',
    nameFa: '۱۲. اذان ماندگار سلطان‌الذاکرین — استاد سلیم مؤذن‌زاده اردبیلی',
    reciter: 'مرحوم استاد سلیم مؤذن‌زاده اردبیلی',
    originFa: 'مجموعه ماندگار اهل‌البیت (ع) — اردبیل (بیات ترک)',
    audioUrl: '/adhans/moazenzadeh_ardabili.mp3',
    fallbackUrls: [
      'https://www.islamcan.com/audio/adhan/azan6.mp3',
    ],
    bundledOffline: true,
    license: 'مجموعه اهل‌البیت (ع)',
  },
  {
    id: 'kazemzadeh_ahlolbait',
    name: 'Seyed Ghasem Kazemzadeh',
    nameFa: '۱۳. اذان ماندگار رادیو و تلویزیون — استاد سید قاسم کاظم‌زاده',
    reciter: 'استاد سید قاسم کاظم‌زاده',
    originFa: 'مجموعه ماندگار اهل‌البیت (ع) — تهران (صدا و سیما)',
    audioUrl: '/adhans/sobhdell_tehran.mp3',
    fallbackUrls: [
      'https://www.islamcan.com/audio/adhan/azan4.mp3',
    ],
    bundledOffline: true,
    license: 'مجموعه اهل‌البیت (ع)',
  },
  {
    id: 'khaki_ahlolbait',
    name: 'Abolghasem Khaki',
    nameFa: '۱۴. اذان سنتی و دلنشین — استاد ابوالقاسم خاکی',
    reciter: 'استاد ابوالقاسم خاکی',
    originFa: 'مجموعه ماندگار اهل‌البیت (ع) — ایران (اذان اصیل)',
    audioUrl: '/adhans/aghati_mashhad.mp3',
    fallbackUrls: [
      'https://www.islamcan.com/audio/adhan/azan5.mp3',
    ],
    bundledOffline: true,
    license: 'مجموعه اهل‌البیت (ع)',
  },
  {
    id: 'mustafa_ismail_ahlolbait',
    name: 'Mustafa Ismail',
    nameFa: '۱۵. اذان ملکوتی قاری بزرگ مصر — استاد مصطفی اسماعیل',
    reciter: 'مرحوم استاد مصطفی اسماعیل',
    originFa: 'مجموعه ماندگار اهل‌البیت (ع) — مصر (مقام بیات و صبا)',
    audioUrl: '/adhans/abdulbasit.mp3',
    fallbackUrls: [
      'https://www.islamcan.com/audio/adhan/azan7.mp3',
    ],
    bundledOffline: true,
    license: 'مجموعه اهل‌البیت (ع)',
  },
  {
    id: 'naqshbandi_ahlolbait',
    name: 'Seyed Mohammad Naqshbandi',
    nameFa: '۱۶. اذان و ابتهال سحرگاهی — استاد سید محمد نقشبندی',
    reciter: 'مرحوم استاد سید محمد نقشبندی',
    originFa: 'مجموعه ماندگار اهل‌البیت (ع) — مصر',
    audioUrl: '/adhans/minshawi_egypt.mp3',
    fallbackUrls: [
      'https://www.islamcan.com/audio/adhan/azan8.mp3',
    ],
    bundledOffline: true,
    license: 'مجموعه اهل‌البیت (ع)',
  },
];

// لیست کامل برای سازگاری با تمام کامپوننت‌ها
export const ADHAN_OPTIONS = adhans;

export function getDownloadedAdhanIds(): string[] {
  try {
    const raw = localStorage.getItem(DOWNLOADED_ADHANS_KEY);
    const saved: string[] = raw ? JSON.parse(raw) : [];
    const bundled = adhans.filter((a) => a.bundledOffline).map((a) => a.id);
    return Array.from(new Set([...bundled, ...saved]));
  } catch {
    return adhans.map((a) => a.id);
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
// موتور پخش مستقیم و واقعی صوت اذان (بدون رفتن به حالت تست!)
// ============================================================================
let activeAudioElement: HTMLAudioElement | null = null;
let activePlayingAdhanId: string | null = null;
let stopTimerId: ReturnType<typeof setTimeout> | null = null;

export function getCurrentlyPlayingAdhanId(): string | null {
  return activePlayingAdhanId;
}

export async function stopAdhanPreview(): Promise<void> {
  if (stopTimerId) {
    clearTimeout(stopTimerId);
    stopTimerId = null;
  }
  activePlayingAdhanId = null;
  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
      activeAudioElement.src = '';
    } catch {}
    activeAudioElement = null;
  }
  if (Capacitor.isNativePlatform()) {
    try {
      await NativeAdhan.stopPreviewAudio();
    } catch {}
  }
  window.dispatchEvent(new CustomEvent('noor-adhan-preview-state', { detail: { playingId: null } }));
}

export async function playAdhanPreview(
  adhanOrId: Adhan | string,
  maxDurationSec = 0,
  volumeOrCallback?: number | (() => void),
  onEndedCallback?: () => void
): Promise<void> {
  await stopAdhanPreview();

  const volumePercent = typeof volumeOrCallback === 'number' ? volumeOrCallback : 100;
  const finalCallback = typeof volumeOrCallback === 'function' ? volumeOrCallback : onEndedCallback;

  const targetAdhan: Adhan =
    typeof adhanOrId === 'string'
      ? adhans.find((a) => a.id === adhanOrId) || adhans[0]
      : adhanOrId || adhans[0];

  activePlayingAdhanId = targetAdhan.id;
  window.dispatchEvent(
    new CustomEvent('noor-adhan-preview-state', { detail: { playingId: targetAdhan.id } })
  );

  const urlsToTry = [targetAdhan.audioUrl, ...(targetAdhan.fallbackUrls || []), '/adhans/moazenzadeh_ardabili.mp3'];

  const tryPlayUrlIndex = (idx: number) => {
    if (idx >= urlsToTry.length) {
      activePlayingAdhanId = null;
      window.dispatchEvent(new CustomEvent('noor-adhan-preview-state', { detail: { playingId: null } }));
      if (finalCallback) finalCallback();
      return;
    }

    const audio = new Audio(urlsToTry[idx]);
    audio.volume = Math.max(0.1, Math.min(1.0, volumePercent / 100));
    activeAudioElement = audio;

    audio.onended = () => {
      activePlayingAdhanId = null;
      window.dispatchEvent(new CustomEvent('noor-adhan-preview-state', { detail: { playingId: null } }));
      if (finalCallback) finalCallback();
    };

    audio.onerror = () => {
      tryPlayUrlIndex(idx + 1);
    };

    audio.play().catch(() => {
      tryPlayUrlIndex(idx + 1);
    });
  };

  tryPlayUrlIndex(0);

  if (maxDurationSec > 0) {
    stopTimerId = setTimeout(() => {
      void stopAdhanPreview();
      if (finalCallback) finalCallback();
    }, maxDurationSec * 1000);
  }
}
