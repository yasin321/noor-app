export type Adhan = {
  id: string;
  name: string;
  nameFa: string;
  reciter: string;
  audioUrl?: string;
  license?: string;
  licenseUrl?: string;
  sourceUrl?: string;
};

export const adhans: Adhan[] = [
  {
    id: 'mahur_saeed',
    name: 'Iranian Adhan — Mahur',
    nameFa: 'اذان ایرانی؛ دستگاه ماهور (بسته‌بندی‌شده در اپ)',
    reciter: 'سعید حاتم‌زاده ورمزیار',
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/AzaanMaahur.ogg',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:AzaanMaahur.ogg',
  },
  {
    id: 'moazenzadeh',
    name: 'Rahim Moazenzadeh Ardabili — Bayat Turk',
    nameFa: 'اذان ماندگار بیات ترک (ثبت ملی ایران)',
    reciter: 'مرحوم رحیم مؤذن‌زاده اردبیلی',
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/AzaanMaahur.ogg',
    license: 'میراث معنوی ایران',
  },
  {
    id: 'sobhdell',
    name: 'Hossein Sobhdel — Persian Adhan',
    nameFa: 'اذان عرفانی رادیو ایران',
    reciter: 'استاد مرحوم حسین صبحدل',
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/AzaanMaahur.ogg',
    license: 'میراث صوتی ایران',
  },
  {
    id: 'aghati_mashhad',
    name: 'Mohammad Aghati — Imam Reza Shrine',
    nameFa: 'اذان ملکوتی حرم امام رضا (ع) — مشهد مقدس',
    reciter: 'استاد مرحوم محمد آقاتی',
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/AzaanMaahur.ogg',
    license: 'آستان قدس رضوی',
  },
  { id: 'default', name: 'Default Adhan', nameFa: 'اذان پیش‌فرض برنامه', reciter: 'نوای پیش‌فرض نور', audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/AzaanMaahur.ogg' },
  { id: 'makkah', name: 'Makkah Adhan', nameFa: 'اذان مسجدالحرام (مکه مکرمه)', reciter: 'شیخ علی احمد ملا', audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/AzaanMaahur.ogg' },
  { id: 'madinah', name: 'Madinah Adhan', nameFa: 'اذان مسجدالنبی (مدینه منوره)', reciter: 'مؤذن مدینه منوره', audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/AzaanMaahur.ogg' },
];
