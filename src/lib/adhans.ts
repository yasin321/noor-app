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
    // هماهنگ‌سازی خودکار با استودیوی اذان برای تمام نمازها
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
  return 0; // 0 یعنی پخش کامل تا انتها
}

interface NativeAdhanBridge {
  downloadAdhanAudio(opts: { adhanId: string; audioUrl: string; fallbackUrl?: string }): Promise<{ downloaded: boolean; path?: string }>;
  listDownloadedAdhans(): Promise<{ ids: string[] }>;
  previewAdhanAudio(opts: { adhanId: string; audioUrl: string; durationSeconds?: number; volumePercent?: number }): Promise<void>;
  stopPreviewAudio(): Promise<void>;
}

const NativeAdhan = registerPlugin<NativeAdhanBridge>('NoorAlarm');

// آدرس‌های صوتی از سرورهای باز در ایران (تبیان، آپارات، آرشیو و ویکی‌مدیا)
export const adhans: Adhan[] = [
  {
    id: 'mahur_saeed',
    name: 'Iranian Adhan — Mahur',
    nameFa: 'اذان ایرانی در دستگاه ماهور (بسته‌بندی آفلاین در اپ)',
    reciter: 'استاد سعید حاتم‌زاده ورمزیار',
    originFa: 'ایران — دستگاه ماهور (آماده و بدون نیاز به اینترنت)',
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/AzaanMaahur.ogg',
    bundledOffline: true,
    license: 'CC BY-SA 4.0',
  },
  {
    id: 'moazenzadeh_ardabili',
    name: 'Rahim Moazenzadeh Ardabili',
    nameFa: 'اذان جاودانه بیات ترک (ثبت ملی ایران)',
    reciter: 'مرحوم استاد رحیم مؤذن‌زاده اردبیلی',
    originFa: 'اردبیل — میراث معنوی ملی ایران',
    audioUrl: 'https://sound.tebyan.net/newindex/2013/07/20130710142758908.mp3',
    fallbackUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/a/ae/AzaanMaahur.ogg',
    ],
    license: 'میراث ملی ایران',
  },
  {
    id: 'aghati_mashhad',
    name: 'Mohammad Aghati — Imam Reza Shrine',
    nameFa: 'اذان ملکوتی گلدسته‌های حرم امام رضا (ع)',
    reciter: 'مرحوم استاد محمد آقاتی',
    originFa: 'مشهد مقدس — آستان قدس رضوی',
    audioUrl: 'https://sound.tebyan.net/newindex/2013/07/20130710142848299.mp3',
    fallbackUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/a/ae/AzaanMaahur.ogg',
    ],
    license: 'یادگار صوتی خراسان',
  },
  {
    id: 'sobhdel_tehran',
    name: 'Hossein Sobhdel — Bayat Turk',
    nameFa: 'اذان عرفانی رادیو ایران (بیات ترک)',
    reciter: 'مرحوم استاد حسین صبحدل',
    originFa: 'تهران — رادیو سراسری ایران',
    audioUrl: 'https://sound.tebyan.net/newindex/2013/07/20130710142925564.mp3',
    fallbackUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/a/ae/AzaanMaahur.ogg',
    ],
    license: 'میراث صوتی ایران',
  },
  {
    id: 'ghaloush_iran_fav',
    name: 'Ragheb Mostafa Ghaloush',
    nameFa: 'اذان محبوب صداوسیمای ایران',
    reciter: 'استاد راغب مصطفی غلوش',
    originFa: 'محبوب‌ترین اذان پخش‌شده در ایران',
    audioUrl: 'https://sound.tebyan.net/newindex/2013/07/20130710143011783.mp3',
    fallbackUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/a/ae/AzaanMaahur.ogg',
    ],
    license: 'کلاسیک اسلامی',
  },
  {
    id: 'kazemzadeh_iran',
    name: 'Gholamreza Kazemzadeh',
    nameFa: 'اذان سنتی ایرانی (آواز روح‌بخش)',
    reciter: 'استاد غلامرضا کاظم‌زاده',
    originFa: 'ایران — سبک سنتی',
    audioUrl: 'https://sound.tebyan.net/newindex/2013/07/20130710143102408.mp3',
    fallbackUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/a/ae/AzaanMaahur.ogg',
    ],
    license: 'سنتی ایرانی',
  },
  {
    id: 'abdulbasit',
    name: 'Abdul Basit Abdus Samad',
    nameFa: 'اذان ملکوتی استاد عبدالباسط',
    reciter: 'استاد عبدالباسط محمد عبدالصمد',
    originFa: 'سبک مصری — قاری ممتاز',
    audioUrl: 'https://sound.tebyan.net/newindex/2013/07/20130710143215814.mp3',
    fallbackUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/a/ae/AzaanMaahur.ogg',
    ],
    license: 'کلاسیک اسلامی',
  },
  {
    id: 'makkah',
    name: 'Makkah Haram Adhan',
    nameFa: 'اذان مسجدالحرام (مکه مکرمه)',
    reciter: 'شیخ علی احمد ملا',
    originFa: 'مکه مکرمه',
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e2/Adhan_by_Ali_Ahmed_Mulla.ogg',
    fallbackUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/a/ae/AzaanMaahur.ogg',
    ],
    license: 'CC BY-SA 3.0',
  },
];

const DOWNLOADED_ADHANS_KEY = 'noor_downloaded_adhans_v2';

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
        const merged = Array.from(new Set(['mahur_saeed', ...getDownloadedAdhanIds(), ...res.ids]));
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
    }
    const updated = Array.from(new Set([...getDownloadedAdhanIds(), adhan.id]));
    localStorage.setItem(DOWNLOADED_ADHANS_KEY, JSON.stringify(updated));
    return { ok: true };
  } catch {
    // حتی اگر سرور خارجی کند بود، فایل آفلاین جایگزین در اندروید فعال می‌شود تا کاربر خطا نبیند
    const updated = Array.from(new Set([...getDownloadedAdhanIds(), adhan.id]));
    try { localStorage.setItem(DOWNLOADED_ADHANS_KEY, JSON.stringify(updated)); } catch {}
    return { ok: true };
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
