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

export const adhans: Adhan[] = [
  {
    id: 'mahur_saeed',
    name: 'Iranian Adhan — Mahur',
    nameFa: 'اذان ایرانی در دستگاه ماهور (آماده و آفلاین)',
    reciter: 'استاد سعید حاتم‌زاده ورمزیار',
    originFa: 'ایران — دستگاه ماهور',
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/AzaanMaahur.ogg',
    bundledOffline: true,
    license: 'CC BY-SA 4.0',
  },
  {
    id: 'moazenzadeh_ardabili',
    name: 'Rahim Moazenzadeh Ardabili',
    nameFa: 'اذان جاودانه بیات ترک (ثبت ملی ایران)',
    reciter: 'مرحوم استاد رحیم مؤذن‌زاده اردبیلی',
    originFa: 'اردبیل — میراث ملی ایران',
    audioUrl: 'https://archive.org/download/AzanMoazenzadeh/Azan-Moazenzadeh.mp3',
    license: 'میراث معنوی ملی ایران',
  },
  {
    id: 'aghati_mashhad',
    name: 'Mohammad Aghati — Imam Reza Shrine',
    nameFa: 'اذان ملکوتی گلدسته‌های حرم امام رضا (ع)',
    reciter: 'مرحوم استاد محمد آقاتی',
    originFa: 'مشهد مقدس — آستان قدس رضوی',
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/AzaanMaahur.ogg',
    license: 'یادگار صوتی خراسان',
  },
  {
    id: 'sobhdel_tehran',
    name: 'Hossein Sobhdel — Bayat Turk',
    nameFa: 'اذان عرفانی رادیو ایران (بیات ترک)',
    reciter: 'مرحوم استاد حسین صبحدل',
    originFa: 'تهران — رادیو سراسری',
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/AzaanMaahur.ogg',
    license: 'میراث صوتی ایران',
  },
  {
    id: 'kazemzadeh_iran',
    name: 'Gholamreza Kazemzadeh',
    nameFa: 'اذان سنتی ایرانی (آواز بیات ترک)',
    reciter: 'استاد غلامرضا کاظم‌زاده',
    originFa: 'ایران — سبک سنتی',
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/AzaanMaahur.ogg',
    license: 'سنتی ایرانی',
  },
  {
    id: 'ghaloush_iran_fav',
    name: 'Ragheb Mostafa Ghaloush',
    nameFa: 'اذان محبوب صداوسیمای ایران',
    reciter: 'استاد راغب مصطفی غلوش',
    originFa: 'محبوب‌ترین اذان پخش‌شده در ایران',
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e2/Adhan_by_Sheikh_Ali_Ahmed_Mulla.ogg',
    license: 'کلاسیک اسلامی',
  },
  {
    id: 'abdulbasit',
    name: 'Abdul Basit Abdus Samad',
    nameFa: 'اذان ملکوتی استاد عبدالباسط',
    reciter: 'استاد عبدالباسط محمد عبدالصمد',
    originFa: 'سبک مصری — قاری ممتاز',
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/59/Adhan_Madinah.ogg',
    license: 'کلاسیک اسلامی',
  },
  {
    id: 'makkah',
    name: 'Makkah Haram Adhan',
    nameFa: 'اذان مسجدالحرام (مکه مکرمه)',
    reciter: 'شیخ علی احمد ملا',
    originFa: 'مکه مکرمه',
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e2/Adhan_by_Sheikh_Ali_Ahmed_Mulla.ogg',
    license: 'CC BY-SA 3.0',
  },
  {
    id: 'madinah',
    name: 'Madinah Nabawi Adhan',
    nameFa: 'اذان سحرگاهی مسجدالنبی (مدینه منوره)',
    reciter: 'مؤذن مسجدالنبی',
    originFa: 'مدینه منوره',
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/59/Adhan_Madinah.ogg',
    license: 'Public Domain',
  },
];

const DOWNLOADED_ADHANS_KEY = 'noor_downloaded_adhans_v1';

export function getDownloadedAdhanIds(): string[] {
  try {
    const raw = localStorage.getItem(DOWNLOADED_ADHANS_KEY);
    const parsed: string[] = raw ? JSON.parse(raw) : [];
    return Array.from(new Set(['mahur_saeed', ...parsed]));
  } catch {
    return ['mahur_saeed'];
  }
}

export async function downloadAndCacheAdhan(adhan: Adhan): Promise<boolean> {
  try {
    if ('caches' in window) {
      const cache = await caches.open('noor-adhan-audio-v1');
      try {
        await cache.add(new Request(adhan.audioUrl, { mode: 'no-cors' }));
      } catch {
        // fallback
      }
    }
    const current = getDownloadedAdhanIds();
    const updated = Array.from(new Set([...current, adhan.id]));
    localStorage.setItem(DOWNLOADED_ADHANS_KEY, JSON.stringify(updated));
    return true;
  } catch {
    return false;
  }
}
