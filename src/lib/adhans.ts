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

const COMMONS_REDIRECT = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/';

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
  {
    id: 'default',
    name: 'Arabic Adhan — Standard',
    nameFa: 'اذان عربی؛ نسخهٔ عمومی',
    reciter: 'صدای ضبط‌شدهٔ عمومی',
    audioUrl: COMMONS_REDIRECT + 'Adhan.ogg',
    license: 'CC0 1.0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Adhan.ogg',
  },
  {
    id: 'makkah',
    name: 'Arabic Adhan — Beautiful',
    nameFa: 'اذان عربی؛ نسخهٔ زیبا',
    reciter: 'صدای ضبط‌شدهٔ عمومی',
    audioUrl: COMMONS_REDIRECT + 'Beautiful_adhan.ogg',
    license: 'CC0 1.0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Beautiful_adhan.ogg',
  },
  {
    id: 'madinah',
    name: 'Adhan from the Prophet’s Mosque',
    nameFa: 'اذان مسجدالنبی؛ مدینه',
    reciter: 'ضبط‌شده در مسجدالنبی',
    audioUrl: COMMONS_REDIRECT + '33937_ejaz215_call-to-prayer-from-the-prophet-s-mo.ogg',
    license: 'CC BY 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/3.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:33937_ejaz215_call-to-prayer-from-the-prophet-s-mo.ogg',
  },
  {
    id: 'shia_traditional',
    name: 'Arabic Adhan — Traditional',
    nameFa: 'اذان عربی؛ نسخهٔ سنتی',
    reciter: 'صدای ضبط‌شدهٔ عمومی',
    audioUrl: COMMONS_REDIRECT + 'Azan.ogg',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Azan.ogg',
  },
];
