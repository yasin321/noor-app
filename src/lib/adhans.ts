import { Capacitor, registerPlugin } from '@capacitor/core';
import { loadAdhanStudio, saveAdhanStudio } from '@/lib/deenIntelligenceStore';
import { getCachedOtaMediaCatalog } from '@/lib/globalSyncService';

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
  isRemoteOta?: boolean;
  isFeatured?: boolean;
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

export const adhans: Adhan[] = [
  {
    "id": "moazenzadeh_ardabili",
    "name": "Ahlolbait Adhan 1",
    "nameFa": "۱. استاد رحیم مؤذن‌زاده اردبیلی (بیات ترک)",
    "reciter": "زنده یاد استاد رحیم مؤذن‌زاده اردبیلی",
    "originFa": "پخش آفلاین · شماره ۱",
    "audioUrl": "/adhans/ahlolbait_01.mp3",
    "fallbackUrls": [
      "https://static.ahlolbait.com/files/ahlolbait/old/u12/download/rahim_moazenzadeh.mp3"
    ],
    "bundledOffline": true,
    "license": "مؤسسه تحقیقات و نشر معارف اهل‌البیت (ع)"
  },
  {
    "id": "ahlolbait_2",
    "name": "Ahlolbait Adhan 2",
    "nameFa": "۲. استاد سلیم مؤذن‌زاده اردبیلی",
    "reciter": "زنده یاد استاد سلیم مؤذن‌زاده اردبیلی",
    "originFa": "پخش آفلاین · شماره ۲",
    "audioUrl": "/adhans/ahlolbait_02.mp3",
    "fallbackUrls": [
      "https://static.ahlolbait.com/files/ahlolbait/old/u12/download/salim_moazenzadeh.mp3"
    ],
    "bundledOffline": true,
    "license": "مؤسسه تحقیقات و نشر معارف اهل‌البیت (ع)"
  },
  {
    "id": "ahlolbait_3",
    "name": "Ahlolbait Adhan 3",
    "nameFa": "۳. استاد حسین صبحدل (۱)",
    "reciter": "استاد حسین صبحدل",
    "originFa": "پخش آفلاین · شماره ۳",
    "audioUrl": "/adhans/ahlolbait_03.mp3",
    "fallbackUrls": [
      "https://static.ahlolbait.com/files/ahlolbait/old/u12/01/A0030.mp3"
    ],
    "bundledOffline": true,
    "license": "مؤسسه تحقیقات و نشر معارف اهل‌البیت (ع)"
  },
  {
    "id": "ahlolbait_4",
    "name": "Ahlolbait Adhan 4",
    "nameFa": "۴. استاد حسین صبحدل (۲)",
    "reciter": "استاد حسین صبحدل",
    "originFa": "پخش آفلاین · شماره ۴",
    "audioUrl": "/adhans/ahlolbait_04.mp3",
    "fallbackUrls": [
      "https://static.ahlolbait.com/files/ahlolbait/old/u12/download/13920230000576.mp3"
    ],
    "bundledOffline": true,
    "license": "مؤسسه تحقیقات و نشر معارف اهل‌البیت (ع)"
  },
  {
    "id": "ahlolbait_5",
    "name": "Ahlolbait Adhan 5",
    "nameFa": "۵. استاد محمد الطوخی (۱)",
    "reciter": "استاد محمد الطوخی",
    "originFa": "پخش آفلاین · شماره ۵",
    "audioUrl": "/adhans/ahlolbait_05.mp3",
    "fallbackUrls": [
      "https://static.ahlolbait.com/files/ahlolbait/old/u12/download/13920305000907.mp3"
    ],
    "bundledOffline": true,
    "license": "مؤسسه تحقیقات و نشر معارف اهل‌البیت (ع)"
  },
  {
    "id": "ahlolbait_6",
    "name": "Ahlolbait Adhan 6",
    "nameFa": "۶. استاد محمد الطوخی (۲)",
    "reciter": "استاد محمد الطوخی",
    "originFa": "پخش آفلاین · شماره ۶",
    "audioUrl": "/adhans/ahlolbait_06.mp3",
    "fallbackUrls": [
      "https://static.ahlolbait.com/files/ahlolbait/old/u12/download/13920305000909.mp3"
    ],
    "bundledOffline": true,
    "license": "مؤسسه تحقیقات و نشر معارف اهل‌البیت (ع)"
  },
  {
    "id": "ahlolbait_7",
    "name": "Ahlolbait Adhan 7",
    "nameFa": "۷. استاد مصطفی اسماعیل (مقام حجاز)",
    "reciter": "استاد مصطفی اسماعیل",
    "originFa": "پخش آفلاین · شماره ۷",
    "audioUrl": "/adhans/ahlolbait_07.mp3",
    "fallbackUrls": [
      "https://static.ahlolbait.com/files/ahlolbait/old/u12/download/13920305000910.mp3"
    ],
    "bundledOffline": true,
    "license": "مؤسسه تحقیقات و نشر معارف اهل‌البیت (ع)"
  },
  {
    "id": "ahlolbait_8",
    "name": "Ahlolbait Adhan 8",
    "nameFa": "۸. استاد عبدالباسط محمد عبدالصمد",
    "reciter": "استاد عبدالباسط محمد عبدالصمد",
    "originFa": "پخش آنلاین · شماره ۸",
    "audioUrl": "https://static.ahlolbait.com/files/ahlolbait/old/u12/download/13920305000915.mp3",
    "fallbackUrls": [
      "https://static.ahlolbait.com/files/ahlolbait/old/u12/download/13920305000915.mp3"
    ],
    "bundledOffline": false,
    "license": "مؤسسه تحقیقات و نشر معارف اهل‌البیت (ع)"
  },
  {
    "id": "ahlolbait_9",
    "name": "Ahlolbait Adhan 9",
    "nameFa": "۹. استاد محمد صدیق منشاوی",
    "reciter": "استاد محمد صدیق منشاوی",
    "originFa": "پخش آنلاین · شماره ۹",
    "audioUrl": "https://static.ahlolbait.com/files/ahlolbait/old/u12/download/13920305000918.mp3",
    "fallbackUrls": [
      "https://static.ahlolbait.com/files/ahlolbait/old/u12/download/13920305000918.mp3"
    ],
    "bundledOffline": false,
    "license": "مؤسسه تحقیقات و نشر معارف اهل‌البیت (ع)"
  },
  {
    "id": "ahlolbait_10",
    "name": "Ahlolbait Adhan 10",
    "nameFa": "۱۰. استاد راغب مصطفی غلوش (محبوب ایران)",
    "reciter": "استاد راغب مصطفی غلوش",
    "originFa": "پخش آنلاین · شماره ۱۰",
    "audioUrl": "https://static.ahlolbait.com/files/ahlolbait/old/u12/download/13920305000921.mp3",
    "fallbackUrls": [
      "https://static.ahlolbait.com/files/ahlolbait/old/u12/download/13920305000921.mp3"
    ],
    "bundledOffline": false,
    "license": "مؤسسه تحقیقات و نشر معارف اهل‌البیت (ع)"
  },
  {
    "id": "ahlolbait_11",
    "name": "Ahlolbait Adhan 11",
    "nameFa": "۱۱. استاد شحات محمد انور",
    "reciter": "استاد شحات محمد انور",
    "originFa": "پخش آنلاین · شماره ۱۱",
    "audioUrl": "https://static.ahlolbait.com/files/ahlolbait/old/u12/download/13920305000925.mp3",
    "fallbackUrls": [
      "https://static.ahlolbait.com/files/ahlolbait/old/u12/download/13920305000925.mp3"
    ],
    "bundledOffline": false,
    "license": "مؤسسه تحقیقات و نشر معارف اهل‌البیت (ع)"
  },
  {
    "id": "ahlolbait_12",
    "name": "Ahlolbait Adhan 12",
    "nameFa": "۱۲. استاد سید جواد ذبیحی (بیات ترک اصیل)",
    "reciter": "زنده یاد سید جواد ذبیحی",
    "originFa": "پخش آنلاین · شماره ۱۲",
    "audioUrl": "https://static.ahlolbait.com/files/ahlolbait/old/u12/download/13920305000927.mp3",
    "fallbackUrls": [
      "https://static.ahlolbait.com/files/ahlolbait/old/u12/download/13920305000927.mp3"
    ],
    "bundledOffline": false,
    "license": "مؤسسه تحقیقات و نشر معارف اهل‌البیت (ع)"
  },
  {
    "id": "ahlolbait_13",
    "name": "Ahlolbait Adhan 13",
    "nameFa": "۱۳. استاد محمود شحات انور",
    "reciter": "استاد محمود شحات انور",
    "originFa": "پخش آنلاین · شماره ۱۳",
    "audioUrl": "https://static.ahlolbait.com/files/ahlolbait/old/u12/download/13920305000932.mp3",
    "fallbackUrls": [
      "https://static.ahlolbait.com/files/ahlolbait/old/u12/download/13920305000932.mp3"
    ],
    "bundledOffline": false,
    "license": "مؤسسه تحقیقات و نشر معارف اهل‌البیت (ع)"
  },
  {
    "id": "ahlolbait_14",
    "name": "Ahlolbait Adhan 14",
    "nameFa": "۱۴. استاد سید متولی عبدالعال",
    "reciter": "استاد سید متولی عبدالعال",
    "originFa": "پخش آنلاین · شماره ۱۴",
    "audioUrl": "https://static.ahlolbait.com/files/ahlolbait/old/u12/download/13920305000938.mp3",
    "fallbackUrls": [
      "https://static.ahlolbait.com/files/ahlolbait/old/u12/download/13920305000938.mp3"
    ],
    "bundledOffline": false,
    "license": "مؤسسه تحقیقات و نشر معارف اهل‌البیت (ع)"
  },
  {
    "id": "ahlolbait_15",
    "name": "Ahlolbait Adhan 15",
    "nameFa": "۱۵. استاد ابوالعینین شعیشع",
    "reciter": "استاد ابوالعینین شعیشع",
    "originFa": "پخش آنلاین · شماره ۱۵",
    "audioUrl": "https://static.ahlolbait.com/files/ahlolbait/old/u12/download/13920305000946.mp3",
    "fallbackUrls": [
      "https://static.ahlolbait.com/files/ahlolbait/old/u12/download/13920305000946.mp3"
    ],
    "bundledOffline": false,
    "license": "مؤسسه تحقیقات و نشر معارف اهل‌البیت (ع)"
  },
  {
    "id": "ahlolbait_16",
    "name": "Ahlolbait Adhan 16",
    "nameFa": "۱۶. استاد کامل یوسف البهتیمی",
    "reciter": "استاد کامل یوسف البهتیمی",
    "originFa": "پخش آنلاین · شماره ۱۶",
    "audioUrl": "https://static.ahlolbait.com/files/ahlolbait/old/u12/download/13920305000948.mp3",
    "fallbackUrls": [
      "https://static.ahlolbait.com/files/ahlolbait/old/u12/download/13920305000948.mp3"
    ],
    "bundledOffline": false,
    "license": "مؤسسه تحقیقات و نشر معارف اهل‌البیت (ع)"
  },
  {
    "id": "ahlolbait_17",
    "name": "Ahlolbait Adhan 17",
    "nameFa": "۱۷. استاد عبدالفتاح شعشاعی",
    "reciter": "استاد عبدالفتاح شعشاعی",
    "originFa": "پخش آنلاین · شماره ۱۷",
    "audioUrl": "https://static.ahlolbait.com/files/ahlolbait/old/u12/download/13920305000950.mp3",
    "fallbackUrls": [
      "https://static.ahlolbait.com/files/ahlolbait/old/u12/download/13920305000950.mp3"
    ],
    "bundledOffline": false,
    "license": "مؤسسه تحقیقات و نشر معارف اهل‌البیت (ع)"
  },
  {
    "id": "ahlolbait_18",
    "name": "Ahlolbait Adhan 18",
    "nameFa": "۱۸. استاد طه الفشنی (مقام بیات)",
    "reciter": "استاد طه الفشنی",
    "originFa": "پخش آنلاین · شماره ۱۸",
    "audioUrl": "https://static.ahlolbait.com/files/ahlolbait/old/u12/download/13920305000951.mp3",
    "fallbackUrls": [
      "https://static.ahlolbait.com/files/ahlolbait/old/u12/download/13920305000951.mp3"
    ],
    "bundledOffline": false,
    "license": "مؤسسه تحقیقات و نشر معارف اهل‌البیت (ع)"
  },
  {
    "id": "ahlolbait_19",
    "name": "Ahlolbait Adhan 19",
    "nameFa": "۱۹. استاد نصرالدین طوبار",
    "reciter": "استاد نصرالدین طوبار",
    "originFa": "پخش آنلاین · شماره ۱۹",
    "audioUrl": "https://static.ahlolbait.com/files/ahlolbait/old/u12/download/13920305000953.mp3",
    "fallbackUrls": [
      "https://static.ahlolbait.com/files/ahlolbait/old/u12/download/13920305000953.mp3"
    ],
    "bundledOffline": false,
    "license": "مؤسسه تحقیقات و نشر معارف اهل‌البیت (ع)"
  },
  {
    "id": "ahlolbait_20",
    "name": "Ahlolbait Adhan 20",
    "nameFa": "۲۰. استاد سید نقشبندی",
    "reciter": "استاد سید نقشبندی",
    "originFa": "پخش آنلاین · شماره ۲۰",
    "audioUrl": "https://static.ahlolbait.com/files/ahlolbait/old/u12/download/13920305000954.mp3",
    "fallbackUrls": [
      "https://static.ahlolbait.com/files/ahlolbait/old/u12/download/13920305000954.mp3"
    ],
    "bundledOffline": false,
    "license": "مؤسسه تحقیقات و نشر معارف اهل‌البیت (ع)"
  },
  {
    "id": "ahlolbait_21",
    "name": "Ahlolbait Adhan 21",
    "nameFa": "۲۱. استاد محمد عمران",
    "reciter": "استاد محمد عمران",
    "originFa": "پخش آنلاین · شماره ۲۱",
    "audioUrl": "https://static.ahlolbait.com/files/ahlolbait/old/u12/download/13920305000955.mp3",
    "fallbackUrls": [
      "https://static.ahlolbait.com/files/ahlolbait/old/u12/download/13920305000955.mp3"
    ],
    "bundledOffline": false,
    "license": "مؤسسه تحقیقات و نشر معارف اهل‌البیت (ع)"
  },
  {
    "id": "ahlolbait_22",
    "name": "Ahlolbait Adhan 22",
    "nameFa": "۲۲. استاد حامد شاکرنژاد",
    "reciter": "استاد حامد شاکرنژاد",
    "originFa": "پخش آنلاین · شماره ۲۲",
    "audioUrl": "https://static.ahlolbait.com/files/ahlolbait/old/u12/download/13920305000956.mp3",
    "fallbackUrls": [
      "https://static.ahlolbait.com/files/ahlolbait/old/u12/download/13920305000956.mp3"
    ],
    "bundledOffline": false,
    "license": "مؤسسه تحقیقات و نشر معارف اهل‌البیت (ع)"
  },
  {
    "id": "ahlolbait_23",
    "name": "Ahlolbait Adhan 23",
    "nameFa": "۲۳. استاد روح‌الله کاظم‌زاده (انتظار)",
    "reciter": "استاد روح‌الله کاظم‌زاده",
    "originFa": "پخش آنلاین · شماره ۲۳",
    "audioUrl": "https://static.ahlolbait.com/files/ahlolbait/old/u12/download/entezar_2.mp3",
    "fallbackUrls": [
      "https://static.ahlolbait.com/files/ahlolbait/old/u12/download/entezar_2.mp3"
    ],
    "bundledOffline": false,
    "license": "مؤسسه تحقیقات و نشر معارف اهل‌البیت (ع)"
  },
  {
    "id": "ahlolbait_24",
    "name": "Ahlolbait Adhan 24",
    "nameFa": "۲۴. استاد محمدحسین ابوریه (لبنان)",
    "reciter": "استاد محمدحسین ابوریه",
    "originFa": "پخش آفلاین · شماره ۲۴",
    "audioUrl": "/adhans/ahlolbait_24.mp3",
    "fallbackUrls": [
      "https://static.ahlolbait.com/files/ahlolbait/old/u12/download/mohammad_hossein_aborieh.mp3"
    ],
    "bundledOffline": true,
    "license": "مؤسسه تحقیقات و نشر معارف اهل‌البیت (ع)"
  },
  {
    "id": "ahlolbait_25",
    "name": "Ahlolbait Adhan 25",
    "nameFa": "۲۵. استاد روحانی‌نژاد",
    "reciter": "استاد روحانی‌نژاد",
    "originFa": "پخش آنلاین · شماره ۲۵",
    "audioUrl": "https://static.ahlolbait.com/files/ahlolbait/old/u12/download/Rowhani%20Nejad.mp3",
    "fallbackUrls": [
      "https://static.ahlolbait.com/files/ahlolbait/old/u12/download/Rowhani%20Nejad.mp3"
    ],
    "bundledOffline": false,
    "license": "مؤسسه تحقیقات و نشر معارف اهل‌البیت (ع)"
  },
  {
    "id": "ahlolbait_26",
    "name": "Ahlolbait Adhan 26",
    "nameFa": "۲۶. شهید حاج محسن حاجی‌حسنی کارگر",
    "reciter": "شهید محسن حاجی‌حسنی کارگر",
    "originFa": "پخش آنلاین · شماره ۲۶",
    "audioUrl": "https://static.ahlolbait.com/files/ahlolbait/old/u12/download/azan-Mohsen-Haji-Hasani.mp3",
    "fallbackUrls": [
      "https://static.ahlolbait.com/files/ahlolbait/old/u12/download/azan-Mohsen-Haji-Hasani.mp3"
    ],
    "bundledOffline": false,
    "license": "مؤسسه تحقیقات و نشر معارف اهل‌البیت (ع)"
  },
  {
    "id": "ahlolbait_27",
    "name": "Ahlolbait Adhan 27",
    "nameFa": "۲۷. استاد محمدجواد پناهی (حرم رضوی)",
    "reciter": "استاد محمدجواد پناهی",
    "originFa": "پخش آنلاین · شماره ۲۷",
    "audioUrl": "https://static.ahlolbait.com/files/ahlolbait/old/u12/13950331000621.mp3",
    "fallbackUrls": [
      "https://static.ahlolbait.com/files/ahlolbait/old/u12/13950331000621.mp3"
    ],
    "bundledOffline": false,
    "license": "مؤسسه تحقیقات و نشر معارف اهل‌البیت (ع)"
  },
  {
    "id": "ahlolbait_28",
    "name": "Ahlolbait Adhan 28",
    "nameFa": "۲۸. استاد ابوالقاسم دوستی (حرم رضوی)",
    "reciter": "استاد ابوالقاسم دوستی",
    "originFa": "پخش آنلاین · شماره ۲۸",
    "audioUrl": "https://static.ahlolbait.com/files/ahlolbait/old/u12/13950331000620.mp3",
    "fallbackUrls": [
      "https://static.ahlolbait.com/files/ahlolbait/old/u12/13950331000620.mp3"
    ],
    "bundledOffline": false,
    "license": "مؤسسه تحقیقات و نشر معارف اهل‌البیت (ع)"
  },
  {
    "id": "ahlolbait_29",
    "name": "Ahlolbait Adhan 29",
    "nameFa": "۲۹. استاد قاسم مقدمی",
    "reciter": "استاد قاسم مقدمی",
    "originFa": "پخش آنلاین · شماره ۲۹",
    "audioUrl": "https://static.ahlolbait.com/files/ahlolbait/old/u12/13950331000615.mp3",
    "fallbackUrls": [
      "https://static.ahlolbait.com/files/ahlolbait/old/u12/13950331000615.mp3"
    ],
    "bundledOffline": false,
    "license": "مؤسسه تحقیقات و نشر معارف اهل‌البیت (ع)"
  },
  {
    "id": "ahlolbait_30",
    "name": "Ahlolbait Adhan 30",
    "nameFa": "۳۰. استاد کریم منصوری",
    "reciter": "استاد کریم منصوری",
    "originFa": "پخش آنلاین · شماره ۳۰",
    "audioUrl": "https://static.ahlolbait.com/files/ahlolbait/old/u12/13950331000618.mp3",
    "fallbackUrls": [
      "https://static.ahlolbait.com/files/ahlolbait/old/u12/13950331000618.mp3"
    ],
    "bundledOffline": false,
    "license": "مؤسسه تحقیقات و نشر معارف اهل‌البیت (ع)"
  },
  {
    "id": "ahlolbait_31",
    "name": "Ahlolbait Adhan 31",
    "nameFa": "۳۱. استاد احمد ابوالقاسمی",
    "reciter": "استاد احمد ابوالقاسمی",
    "originFa": "پخش آفلاین · شماره ۳۱",
    "audioUrl": "/adhans/ahlolbait_31.mp3",
    "fallbackUrls": [
      "https://static.ahlolbait.com/files/ahlolbait/old/u12/13950331000617.mp3"
    ],
    "bundledOffline": true,
    "license": "مؤسسه تحقیقات و نشر معارف اهل‌البیت (ع)"
  },
  {
    "id": "ahlolbait_32",
    "name": "Ahlolbait Adhan 32",
    "nameFa": "۳۲. و اقامه مصری ماندگار",
    "reciter": "مؤذن ممتاز مصری",
    "originFa": "پخش آنلاین · شماره ۳۲",
    "audioUrl": "https://static.ahlolbait.com/files/ahlolbait/old/u12/22q.mp3",
    "fallbackUrls": [
      "https://static.ahlolbait.com/files/ahlolbait/old/u12/22q.mp3"
    ],
    "bundledOffline": false,
    "license": "مؤسسه تحقیقات و نشر معارف اهل‌البیت (ع)"
  },
  {
    "id": "ahlolbait_33",
    "name": "Ahlolbait Adhan 33",
    "nameFa": "۳۳. مقدمه و نوای ملکوتی مکبری حرم مطهر",
    "reciter": "مجموعه مکبری اهل‌البیت (ع)",
    "originFa": "پخش آنلاین · شماره ۳۳",
    "audioUrl": "https://static.ahlolbait.com/files/ahlolbait/old/download/12/1%20%20%20Muqadameh%20%20Barname%20%20Mukaberi.mp3",
    "fallbackUrls": [
      "https://static.ahlolbait.com/files/ahlolbait/old/download/12/1%20%20%20Muqadameh%20%20Barname%20%20Mukaberi.mp3"
    ],
    "bundledOffline": false,
    "license": "مؤسسه تحقیقات و نشر معارف اهل‌البیت (ع)"
  },
  {
    "id": "turkey_istanbul",
    "name": "Ahlolbait Adhan 34",
    "nameFa": "۳۴. آموزش و نغمه اصیل مکبری و اذان",
    "reciter": "مجموعه مکبری اهل‌البیت (ع)",
    "originFa": "پخش آنلاین · شماره ۳۴",
    "audioUrl": "https://static.ahlolbait.com/files/ahlolbait/old/download/12/2%20%20%20Amozeshe%20%20Mukaberi.mp3",
    "fallbackUrls": [
      "https://static.ahlolbait.com/files/ahlolbait/old/download/12/2%20%20%20Amozeshe%20%20Mukaberi.mp3"
    ],
    "bundledOffline": false,
    "license": "مؤسسه تحقیقات و نشر معارف اهل‌البیت (ع)"
  }
];

export const ADHAN_OPTIONS = adhans;

export function getAllAdhans(): Adhan[] {
  const remoteAdhans: Adhan[] = getCachedOtaMediaCatalog()
    .filter((item) => item.category === 'adhan' && Boolean(item.audio_url))
    .map((item) => ({
      id: item.id,
      name: item.title_fa,
      nameFa: item.title_fa,
      reciter: item.reciter_fa || item.subtitle_fa || 'مؤذن جدید نور',
      originFa: '✨ نوای جدید آنلاین' + (item.duration_fa ? ' · ' + item.duration_fa : ''),
      audioUrl: item.audio_url,
      fallbackUrls: [item.audio_url],
      bundledOffline: false,
      isRemoteOta: true,
      isFeatured: Boolean(item.is_featured),
    }));
  const builtInIds = new Set(adhans.map((a) => a.id));
  return [...remoteAdhans.filter((r) => !builtInIds.has(r.id)), ...adhans];
}

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
  await stopAdhanPreview();
  const myToken = ++currentSessionToken;

  const volumePercent = typeof volumeOrCallback === 'number' ? volumeOrCallback : 100;
  const finalCallback = typeof volumeOrCallback === 'function' ? volumeOrCallback : onEndedCallback;

  let targetAdhan: Adhan;
  if (typeof adhanOrId === 'string') {
    const cleanKey = adhanOrId.replace(/^\/adhans\//, '').replace(/\.mp3$/, '');
    if (cleanKey.startsWith('post_') || cleanKey.startsWith('chant_')) {
      targetAdhan = {
        id: cleanKey,
        name: cleanKey,
        nameFa: cleanKey,
        reciter: 'تلاوت و نیایش',
        originFa: 'همراه معنوی نور',
        audioUrl: `/adhans/${cleanKey}.mp3`,
        bundledOffline: true,
      };
    } else {
      targetAdhan = getAllAdhans().find((a) => a.id === adhanOrId) || adhans[0];
    }
  } else {
    targetAdhan = adhanOrId || adhans[0];
  }

  broadcastPlaybackState(targetAdhan.id);

  const urlsToTry = Array.from(new Set([targetAdhan.audioUrl, ...(targetAdhan.fallbackUrls || [])]));

  const tryPlayUrlIndex = (idx: number) => {
    if (myToken !== currentSessionToken) return;
    if (idx >= urlsToTry.length) {
      broadcastPlaybackState(null);
      if (finalCallback) finalCallback();
      return;
    }

    const audio = new Audio();
    audio.preload = 'auto';
    audio.volume = Math.max(0.1, Math.min(1.0, volumePercent / 100));
    try {
      const isPreOrPost = targetAdhan.id.startsWith('post_') || targetAdhan.id.startsWith('chant_') || targetAdhan.audioUrl.includes('post_') || targetAdhan.audioUrl.includes('chant_');
      if (isPreOrPost) {
        const savedSpeed = parseFloat(localStorage.getItem('noor_pre_post_playback_speed') || '1');
        if (Number.isFinite(savedSpeed) && savedSpeed >= 0.5 && savedSpeed <= 3.0) {
          audio.playbackRate = savedSpeed;
          audio.defaultPlaybackRate = savedSpeed;
        }
      }
    } catch {}
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
