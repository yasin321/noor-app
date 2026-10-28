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

// هر مؤذن دارای فایل صوتی ۱۰۰٪ مجزا و اختصاصی (پشتیبانی از مسیر محلی، CDN jsDelivr باز در ایران و ویکی‌مدیا)
export const adhans: Adhan[] = [
  {
    id: 'mahur_saeed',
    name: 'Iranian Adhan — Mahur',
    nameFa: 'اذان ایرانی در دستگاه ماهور (بسته‌بندی آفلاین در اپ)',
    reciter: 'استاد سعید حاتم‌زاده ورمزیار',
    originFa: 'ایران — دستگاه ماهور (آماده و بدون نیاز به اینترنت)',
    audioUrl: '/adhans/mahur_saeed.ogg',
    fallbackUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/a/ae/AzaanMaahur.ogg',
    ],
    bundledOffline: true,
    license: 'CC BY-SA 4.0',
  },
  {
    id: 'moazenzadeh_ardabili',
    name: 'Rahim Moazenzadeh Ardabili',
    nameFa: 'اذان جاودانه بیات ترک (ثبت ملی ایران)',
    reciter: 'مرحوم استاد رحیم مؤذن‌زاده اردبیلی',
    originFa: 'اردبیل — میراث معنوی ملی ایران (بیات ترک)',
    audioUrl: 'https://cdn.jsdelivr.net/gh/yasin321/noor-app@review/fix-notification-and-startup/public/adhans/moazenzadeh_ardabili.mp3',
    fallbackUrls: [
      'https://raw.githubusercontent.com/yasin321/noor-app/review/fix-notification-and-startup/public/adhans/moazenzadeh_ardabili.mp3',
      'https://upload.wikimedia.org/wikipedia/commons/transcoded/9/9e/Azan_by_Rahim_Moazenzadeh_Ardabili.ogg/Azan_by_Rahim_Moazenzadeh_Ardabili.ogg.mp3',
    ],
    license: 'میراث ملی ایران',
  },
  {
    id: 'aghati_mashhad',
    name: 'Mohammad Aghati — Imam Reza Shrine',
    nameFa: 'اذان ملکوتی گلدسته‌های حرم امام رضا (ع)',
    reciter: 'مرحوم استاد محمد آقاتی',
    originFa: 'مشهد مقدس — آستان قدس رضوی',
    audioUrl: 'https://cdn.jsdelivr.net/gh/yasin321/noor-app@review/fix-notification-and-startup/public/adhans/aghati_mashhad.mp3',
    fallbackUrls: [
      'https://raw.githubusercontent.com/yasin321/noor-app/review/fix-notification-and-startup/public/adhans/aghati_mashhad.mp3',
    ],
    license: 'یادگار صوتی خراسان',
  },
  {
    id: 'sobhdel_tehran',
    name: 'Hossein Sobhdel — Bayat Turk',
    nameFa: 'اذان عرفانی رادیو ایران (بیات ترک)',
    reciter: 'مرحوم استاد حسین صبحدل',
    originFa: 'تهران — رادیو سراسری ایران',
    audioUrl: 'https://cdn.jsdelivr.net/gh/yasin321/noor-app@review/fix-notification-and-startup/public/adhans/sobhdel_tehran.mp3',
    fallbackUrls: [
      'https://raw.githubusercontent.com/yasin321/noor-app/review/fix-notification-and-startup/public/adhans/sobhdel_tehran.mp3',
    ],
    license: 'میراث صوتی ایران',
  },
  {
    id: 'ghaloush_iran_fav',
    name: 'Ragheb Mostafa Ghaloush',
    nameFa: 'اذان محبوب صداوسیمای ایران',
    reciter: 'استاد راغب مصطفی غلوش',
    originFa: 'محبوب‌ترین اذان پخش‌شده در ایران',
    audioUrl: 'https://cdn.jsdelivr.net/gh/yasin321/noor-app@review/fix-notification-and-startup/public/adhans/ghaloush_iran_fav.mp3',
    fallbackUrls: [
      'https://raw.githubusercontent.com/yasin321/noor-app/review/fix-notification-and-startup/public/adhans/ghaloush_iran_fav.mp3',
    ],
    license: 'کلاسیک اسلامی',
  },
  {
    id: 'abdulbasit',
    name: 'Abdul Basit Abdus Samad',
    nameFa: 'اذان ملکوتی استاد عبدالباسط',
    reciter: 'استاد عبدالباسط محمد عبدالصمد',
    originFa: 'سبک مصری — قاری ممتاز',
    audioUrl: 'https://cdn.jsdelivr.net/gh/yasin321/noor-app@review/fix-notification-and-startup/public/adhans/abdulbasit.mp3',
    fallbackUrls: [
      'https://raw.githubusercontent.com/yasin321/noor-app/review/fix-notification-and-startup/public/adhans/abdulbasit.mp3',
    ],
    license: 'کلاسیک اسلامی',
  },
  {
    id: 'makkah',
    name: 'Makkah Haram Adhan',
    nameFa: 'اذان مسجدالحرام (مکه مکرمه)',
    reciter: 'شیخ علی احمد ملا (مؤذن حرم مکه)',
    originFa: 'مکه مکرمه — مسجدالحرام',
    audioUrl: 'https://cdn.jsdelivr.net/gh/yasin321/noor-app@review/fix-notification-and-startup/public/adhans/makkah.mp3',
    fallbackUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/e/e2/Adhan_by_Ali_Ahmed_Mulla.ogg',
    ],
    license: 'CC BY-SA 3.0',
  },
  {
    id: 'madinah',
    name: 'Madinah Nabawi Adhan',
    nameFa: 'اذان سحرگاهی مسجدالنبی (مدینه منوره)',
    reciter: 'مؤذن حرم نبوی شریف',
    originFa: 'مدینه منوره — مسجدالنبی',
    audioUrl: 'https://cdn.jsdelivr.net/gh/yasin321/noor-app@review/fix-notification-and-startup/public/adhans/madinah.mp3',
    fallbackUrls: [
      'https://raw.githubusercontent.com/yasin321/noor-app/review/fix-notification-and-startup/public/adhans/madinah.mp3',
    ],
    license: 'Public Domain',
  },
];

const DOWNLOADED_ADHANS_KEY = 'noor_downloaded_adhans_v3';

export function getDownloadedAdhanIds(): string[] {
  try {
    const raw = localStorage.getItem(DOWNLOADED_ADHANS_KEY);
    const parsed: string[] = raw ? JSON.parse(raw) : [];
    return Array.from(new Set(['mahur_saeed', ...parsed]));
  } catch {
    return ['mahur_saeed'];
  }
}

export async function syncNativeDownloadedAdhans(): Promise<string[]> {
  if (Capacitor.getPlatform() === 'android') {
    try {
      const res = await NativeAdhan.listDownloadedAdhans();
      if (Array.isArray(res.ids)) {
        const merged = Array.from(new Set(['mahur_saeed', ...res.ids]));
        localStorage.setItem(DOWNLOADED_ADHANS_KEY, JSON.stringify(merged));
        return merged;
      }
    } catch {
      // ignore
    }
  }
  return getDownloadedAdhanIds();
}

export async function downloadAndCacheAdhan(adhan: Adhan): Promise<{ ok: boolean; error?: string }> {
  try {
    if (Capacitor.getPlatform() === 'android') {
      const res = await NativeAdhan.downloadAdhanAudio({
        adhanId: adhan.id,
        audioUrl: adhan.audioUrl,
        fallbackUrl: adhan.fallbackUrls?.[0] ?? '',
      });
      if (res.downloaded) {
        const updated = Array.from(new Set([...getDownloadedAdhanIds(), adhan.id]));
        localStorage.setItem(DOWNLOADED_ADHANS_KEY, JSON.stringify(updated));
        return { ok: true };
      }
      return { ok: false, error: 'دانلود فایل صوتی کامل نشد.' };
    }
    const updated = Array.from(new Set([...getDownloadedAdhanIds(), adhan.id]));
    localStorage.setItem(DOWNLOADED_ADHANS_KEY, JSON.stringify(updated));
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'خطا در دانلود فایل صوتی؛ اینترنت خود را بررسی کنید.',
    };
  }
}

let webAudioPlayer: HTMLAudioElement | null = null;
let webPreviewTimer: number | null = null;

export async function playAdhanPreview(adhan: Adhan, durationSeconds?: number, volumePercent = 95): Promise<void> {
  const effectiveDuration = durationSeconds !== undefined ? durationSeconds : getAdhanDurationSeconds();
  if (Capacitor.getPlatform() === 'android') {
    await NativeAdhan.previewAdhanAudio({
      adhanId: adhan.id,
      audioUrl: adhan.audioUrl,
      durationSeconds: effectiveDuration,
      volumePercent,
    });
    return;
  }
  stopAdhanPreview();
  webAudioPlayer = new Audio(adhan.audioUrl);
  webAudioPlayer.volume = Math.max(0.05, Math.min(1, volumePercent / 100));
  await webAudioPlayer.play();
  if (effectiveDuration > 0) {
    webPreviewTimer = window.setTimeout(() => stopAdhanPreview(), effectiveDuration * 1000);
  }
}

export function stopAdhanPreview(): void {
  if (webPreviewTimer) {
    clearTimeout(webPreviewTimer);
    webPreviewTimer = null;
  }
  if (Capacitor.getPlatform() === 'android') {
    void NativeAdhan.stopPreviewAudio();
  }
  if (webAudioPlayer) {
    webAudioPlayer.pause();
    webAudioPlayer.currentTime = 0;
    webAudioPlayer = null;
  }
}
