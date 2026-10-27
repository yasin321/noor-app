import { Capacitor, registerPlugin } from '@capacitor/core';

export type Adhan = {
  id: string;
  name: string;
  nameFa: string;
  reciter: string;
  originFa: string;
  audioUrl: string;
  bundledOffline?: boolean;
  license?: string;
};

interface NativeAdhanBridge {
  downloadAdhanAudio(opts: { adhanId: string; audioUrl: string }): Promise<{ downloaded: boolean; path?: string }>;
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
    originFa: 'ایران — دستگاه ماهور (آفلاین)',
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
    audioUrl: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3',
    license: 'میراث ملی ایران',
  },
  {
    id: 'aghati_mashhad',
    name: 'Mohammad Aghati — Imam Reza Shrine',
    nameFa: 'اذان ملکوتی گلدسته‌های حرم امام رضا (ع)',
    reciter: 'مرحوم استاد محمد آقاتی',
    originFa: 'مشهد مقدس — آستان قدس رضوی',
    audioUrl: 'https://www.islamcan.com/audio/adhan/azan1.mp3',
    license: 'یادگار صوتی خراسان',
  },
  {
    id: 'sobhdel_tehran',
    name: 'Hossein Sobhdel — Bayat Turk',
    nameFa: 'اذان عرفانی رادیو ایران (بیات ترک)',
    reciter: 'مرحوم استاد حسین صبحدل',
    originFa: 'تهران — رادیو سراسری ایران',
    audioUrl: 'https://www.islamcan.com/audio/adhan/azan2.mp3',
    license: 'میراث صوتی ایران',
  },
  {
    id: 'kazemzadeh_iran',
    name: 'Gholamreza Kazemzadeh',
    nameFa: 'اذان سنتی ایرانی (آواز روح‌بخش)',
    reciter: 'استاد غلامرضا کاظم‌زاده',
    originFa: 'ایران — سبک سنتی',
    audioUrl: 'https://www.islamcan.com/audio/adhan/azan3.mp3',
    license: 'سنتی ایرانی',
  },
  {
    id: 'ghaloush_iran_fav',
    name: 'Ragheb Mostafa Ghaloush',
    nameFa: 'اذان محبوب صداوسیمای ایران',
    reciter: 'استاد راغب مصطفی غلوش',
    originFa: 'محبوب‌ترین اذان پخش‌شده در ایران',
    audioUrl: 'https://www.islamcan.com/audio/adhan/azan4.mp3',
    license: 'کلاسیک اسلامی',
  },
  {
    id: 'abdulbasit',
    name: 'Abdul Basit Abdus Samad',
    nameFa: 'اذان ملکوتی استاد عبدالباسط',
    reciter: 'استاد عبدالباسط محمد عبدالصمد',
    originFa: 'سبک مصری — قاری ممتاز',
    audioUrl: 'https://www.islamcan.com/audio/adhan/azan5.mp3',
    license: 'کلاسیک اسلامی',
  },
  {
    id: 'makkah',
    name: 'Makkah Haram Adhan',
    nameFa: 'اذان مسجدالحرام (مکه مکرمه)',
    reciter: 'شیخ علی احمد ملا',
    originFa: 'مکه مکرمه',
    audioUrl: 'https://www.islamcan.com/audio/adhan/azan6.mp3',
    license: 'CC BY-SA 3.0',
  },
  {
    id: 'madinah',
    name: 'Madinah Nabawi Adhan',
    nameFa: 'اذان سحرگاهی مسجدالنبی (مدینه منوره)',
    reciter: 'مؤذن مسجدالنبی',
    originFa: 'مدینه منوره',
    audioUrl: 'https://www.islamcan.com/audio/adhan/azan7.mp3',
    license: 'Public Domain',
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
      });
      if (res.downloaded) {
        const updated = Array.from(new Set([...getDownloadedAdhanIds(), adhan.id]));
        localStorage.setItem(DOWNLOADED_ADHANS_KEY, JSON.stringify(updated));
        return { ok: true };
      }
    } else if ('caches' in window) {
      const cache = await caches.open('noor-adhan-audio-v2');
      await cache.add(new Request(adhan.audioUrl, { mode: 'no-cors' }));
      const updated = Array.from(new Set([...getDownloadedAdhanIds(), adhan.id]));
      localStorage.setItem(DOWNLOADED_ADHANS_KEY, JSON.stringify(updated));
      return { ok: true };
    }
    const updated = Array.from(new Set([...getDownloadedAdhanIds(), adhan.id]));
    localStorage.setItem(DOWNLOADED_ADHANS_KEY, JSON.stringify(updated));
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'خطا در دانلود فایل صوتی؛ اتصال اینترنت را بررسی کنید.',
    };
  }
}

let webAudioPlayer: HTMLAudioElement | null = null;

export async function playAdhanPreview(adhan: Adhan, durationSeconds = 15, volumePercent = 90): Promise<void> {
  if (Capacitor.getPlatform() === 'android') {
    await NativeAdhan.previewAdhanAudio({
      adhanId: adhan.id,
      audioUrl: adhan.audioUrl,
      durationSeconds,
      volumePercent,
    });
    return;
  }
  stopAdhanPreview();
  webAudioPlayer = new Audio(adhan.audioUrl);
  webAudioPlayer.volume = Math.max(0.05, Math.min(1, volumePercent / 100));
  await webAudioPlayer.play();
  if (durationSeconds > 0) {
    window.setTimeout(() => stopAdhanPreview(), durationSeconds * 1000);
  }
}

export function stopAdhanPreview(): void {
  if (Capacitor.getPlatform() === 'android') {
    void NativeAdhan.stopPreviewAudio();
  }
  if (webAudioPlayer) {
    webAudioPlayer.pause();
    webAudioPlayer.currentTime = 0;
    webAudioPlayer = null;
  }
}
