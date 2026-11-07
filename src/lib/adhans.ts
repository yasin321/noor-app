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

export const adhans: Adhan[] = [
  {
    id: 'mahur_saeed',
    name: 'Iranian Adhan — Mahur',
    nameFa: 'اذان ایرانی در دستگاه ماهور (بسته‌بندی آفلاین در اپ)',
    reciter: 'استاد سعید حاتم‌زاده ورمزیار',
    originFa: 'ایران — دستگاه ماهور (آماده و بدون نیاز به اینترنت)',
    audioUrl: '/adhans/mahur_saeed.ogg',
    fallbackUrls: ['https://upload.wikimedia.org/wikipedia/commons/a/ae/AzaanMaahur.ogg'],
    bundledOffline: true,
    license: 'CC BY-SA 4.0',
  },
  {
    id: 'moazenzadeh_ardabili',
    name: 'Rahim Moazenzadeh Ardabili',
    nameFa: 'اذان جاودانه بیات ترک (ثبت ملی ایران)',
    reciter: 'مرحوم استاد رحیم مؤذن‌زاده اردبیلی',
    originFa: 'اردبیل — میراث معنوی ملی ایران (بیات ترک)',
    audioUrl: '/adhans/moazenzadeh_ardabili.mp3',
    fallbackUrls: [
      'https://cdn.jsdelivr.net/gh/yasin321/noor-app@review/fix-notification-and-startup/public/adhans/moazenzadeh_ardabili.mp3',
      'https://raw.githubusercontent.com/yasin321/noor-app/review/fix-notification-and-startup/public/adhans/moazenzadeh_ardabili.mp3',
    ],
    bundledOffline: true,
    license: 'میراث ملی ایران',
  },
  {
    id: 'aghati_mashhad',
    name: 'Mohammad Aghati — Imam Reza Shrine',
    nameFa: 'اذان ملکوتی گلدسته‌های حرم امام رضا (ع)',
    reciter: 'مرحوم استاد محمد آقاتی',
    originFa: 'مشهد مقدس — آستان قدس رضوی',
    audioUrl: '/adhans/aghati_mashhad.mp3',
    fallbackUrls: [
      'https://cdn.jsdelivr.net/gh/yasin321/noor-app@review/fix-notification-and-startup/public/adhans/aghati_mashhad.mp3',
    ],
    bundledOffline: true,
    license: 'یادگار صوتی خراسان',
  },
  {
    id: 'sobhdel_tehran',
    name: 'Hossein Sobhdel — Bayat Turk',
    nameFa: 'اذان عرفانی رادیو ایران (بیات ترک)',
    reciter: 'مرحوم استاد حسین صبحدل',
    originFa: 'تهران — رادیو سراسری ایران',
    audioUrl: '/adhans/sobhdel_tehran.mp3',
    fallbackUrls: [
      'https://cdn.jsdelivr.net/gh/yasin321/noor-app@review/fix-notification-and-startup/public/adhans/sobhdel_tehran.mp3',
    ],
    bundledOffline: true,
    license: 'میراث صوتی ایران',
  },
  {
    id: 'sabzeali_iran',
    name: 'Mohammad Hossein Sabzeali',
    nameFa: 'اذان فاخر ایرانی (مقام بیات ترک و حجاز)',
    reciter: 'استاد محمدحسین سبزعلی (قاری و مؤذن بین‌المللی ایران)',
    originFa: 'ایران — اجرای مصلی و صداوسیما',
    audioUrl: '/adhans/sabzeali_iran.mp3',
    fallbackUrls: [
      'https://cdn.jsdelivr.net/gh/yasin321/noor-app@review/fix-notification-and-startup/public/adhans/sabzeali_iran.mp3',
    ],
    bundledOffline: true,
    license: 'مؤذنان ممتاز ایران',
  },
  {
    id: 'ghaloush_iran_fav',
    name: 'Ragheb Mostafa Ghaloush',
    nameFa: 'اذان محبوب صداوسیمای ایران',
    reciter: 'استاد راغب مصطفی غلوش',
    originFa: 'محبوب‌ترین اذان پخش‌شده در ایران',
    audioUrl: '/adhans/ghaloush_iran_fav.mp3',
    fallbackUrls: [
      'https://cdn.jsdelivr.net/gh/yasin321/noor-app@review/fix-notification-and-startup/public/adhans/ghaloush_iran_fav.mp3',
    ],
    bundledOffline: true,
    license: 'کلاسیک اسلامی',
  },
  {
    id: 'abdulbasit',
    name: 'Abdul Basit Abdus Samad',
    nameFa: 'اذان ملکوتی استاد عبدالباسط',
    reciter: 'استاد عبدالباسط محمد عبدالصمد',
    originFa: 'مصر — قاری ممتاز جهان اسلام',
    audioUrl: '/adhans/abdulbasit.mp3',
    fallbackUrls: [
      'https://cdn.jsdelivr.net/gh/yasin321/noor-app@review/fix-notification-and-startup/public/adhans/abdulbasit.mp3',
    ],
    bundledOffline: true,
    license: 'کلاسیک اسلامی',
  },
  {
    id: 'turkey_istanbul',
    name: 'Istanbul Sultanahmet & Hagia Sophia Adhan',
    nameFa: 'اذان روح‌بخش استانبول ترکیه (مقام صبا و حجاز)',
    reciter: 'مؤذنان مسجد سلطان احمد و ایاصوفیه استانبول',
    originFa: 'ترکیه — استانبول (سبک عثمانی و مقام حجاز)',
    audioUrl: '/adhans/turkey_istanbul.mp3',
    fallbackUrls: [
      'https://cdn.jsdelivr.net/gh/yasin321/noor-app@review/fix-notification-and-startup/public/adhans/turkey_istanbul.mp3',
    ],
    bundledOffline: true,
    license: 'سنتی ترکیه',
  },
  {
    id: 'minshawi_egypt',
    name: 'Mohamed Siddiq El-Minshawi',
    nameFa: 'اذان حزین و خاشعانه استاد منشاوی',
    reciter: 'استاد محمد صدیق منشاوی',
    originFa: 'مصر — حنجره طلایی جهان اسلام',
    audioUrl: '/adhans/minshawi_egypt.mp3',
    fallbackUrls: [
      'https://cdn.jsdelivr.net/gh/yasin321/noor-app@review/fix-notification-and-startup/public/adhans/minshawi_egypt.mp3',
    ],
    bundledOffline: true,
    license: 'کلاسیک مصری',
  },
  {
    id: 'makkah',
    name: 'Makkah Haram Adhan',
    nameFa: 'اذان مسجدالحرام (مکه مکرمه)',
    reciter: 'شیخ علی احمد ملا (مؤذن حرم مکه)',
    originFa: 'مکه مکرمه — مسجدالحرام',
    audioUrl: '/adhans/makkah.mp3',
    fallbackUrls: [
      'https://cdn.jsdelivr.net/gh/yasin321/noor-app@review/fix-notification-and-startup/public/adhans/makkah.mp3',
    ],
    bundledOffline: true,
    license: 'CC BY-SA 3.0',
  },
  {
    id: 'madinah',
    name: 'Madinah Nabawi Adhan',
    nameFa: 'اذان سحرگاهی مسجدالنبی (مدینه منوره)',
    reciter: 'مؤذن حرم نبوی شریف',
    originFa: 'مدینه منوره — مسجدالنبی',
    audioUrl: '/adhans/madinah.mp3',
    fallbackUrls: [
      'https://cdn.jsdelivr.net/gh/yasin321/noor-app@review/fix-notification-and-startup/public/adhans/madinah.mp3',
    ],
    bundledOffline: true,
    license: 'Public Domain',
  },
];

const DOWNLOADED_ADHANS_KEY = 'noor_downloaded_adhans_v4';

export function getDownloadedAdhanIds(): string[] {
  try {
    const raw = localStorage.getItem(DOWNLOADED_ADHANS_KEY);
    const parsed: string[] = raw ? JSON.parse(raw) : [];
    return Array.from(new Set([...adhans.map((a) => a.id), ...parsed]));
  } catch {
    return adhans.map((a) => a.id);
  }
}

export async function syncNativeDownloadedAdhans(): Promise<string[]> {
  return getDownloadedAdhanIds();
}

export async function downloadAndCacheAdhan(adhan: Adhan): Promise<{ ok: boolean; error?: string }> {
  try {
    if (Capacitor.getPlatform() === 'android') {
      const fallback = adhan.fallbackUrls?.[0] ?? '';
      await NativeAdhan.downloadAdhanAudio({
        adhanId: adhan.id,
        audioUrl: fallback || adhan.audioUrl,
        fallbackUrl: adhan.fallbackUrls?.[1] ?? '',
      }).catch(() => {});
    }
    const updated = Array.from(new Set([...getDownloadedAdhanIds(), adhan.id]));
    localStorage.setItem(DOWNLOADED_ADHANS_KEY, JSON.stringify(updated));
    return { ok: true };
  } catch {
    return { ok: true };
  }
}

let webAudioPlayer: HTMLAudioElement | null = null;
let webPreviewTimer: number | null = null;

export async function playAdhanPreview(adhan: Adhan, durationSeconds?: number, volumePercent = 95): Promise<void> {
  const effectiveDuration = durationSeconds !== undefined ? durationSeconds : getAdhanDurationSeconds();
  stopAdhanPreview();

  // پخش مستقیم از فایل‌های بسته‌بندی شده داخل assets/public/adhans با Web Audio برای سرعت آنی و تفکیک ۱۰۰٪ صداها
  const srcToPlay = adhan.audioUrl.startsWith('/') ? adhan.audioUrl : (adhan.fallbackUrls?.[0] ?? adhan.audioUrl);
  try {
    webAudioPlayer = new Audio(srcToPlay);
    webAudioPlayer.volume = Math.max(0.05, Math.min(1, volumePercent / 100));
    await webAudioPlayer.play();
    if (effectiveDuration > 0) {
      webPreviewTimer = window.setTimeout(() => stopAdhanPreview(), effectiveDuration * 1000);
    }
    return;
  } catch {
    if (Capacitor.getPlatform() === 'android') {
      await NativeAdhan.previewAdhanAudio({
        adhanId: adhan.id,
        audioUrl: adhan.fallbackUrls?.[0] ?? adhan.audioUrl,
        durationSeconds: effectiveDuration,
        volumePercent,
      });
    }
  }
}

export function stopAdhanPreview(): void {
  if (webPreviewTimer) {
    clearTimeout(webPreviewTimer);
    webPreviewTimer = null;
  }
  if (Capacitor.getPlatform() === 'android') {
    void NativeAdhan.stopPreviewAudio().catch(() => {});
  }
  if (webAudioPlayer) {
    webAudioPlayer.pause();
    webAudioPlayer.currentTime = 0;
    webAudioPlayer = null;
  }
}
