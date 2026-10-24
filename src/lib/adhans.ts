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
    nameFa: 'اذان ایرانی؛ دستگاه ماهور',
    reciter: 'سعید حاتم‌زاده ورمزیار',
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/AzaanMaahur.ogg',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:AzaanMaahur.ogg',
  },
  { id: 'default', name: 'Default Adhan', nameFa: 'اذان پیش‌فرض', reciter: 'صدای پیش‌فرض برنامه' },
  { id: 'makkah', name: 'Makkah Adhan', nameFa: 'اذان مکه', reciter: 'مسجدالحرام' },
  { id: 'madinah', name: 'Madinah Adhan', nameFa: 'اذان مدینه', reciter: 'مسجدالنبی' },
  { id: 'shia_traditional', name: 'Shia Traditional', nameFa: 'اذان شیعی سنتی', reciter: 'سبک سنتی شیعی' },
];
