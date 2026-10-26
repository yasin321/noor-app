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
    id: 'moazenzadeh',
    name: 'Rahim Moazenzadeh Ardabili — Bayat Turk',
    nameFa: 'اذان ماندگار بیات ترک (ثبت ملی ایران)',
    reciter: 'مرحوم رحیم مؤذن‌زاده اردبیلی',
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d6/ Rahim_Moazenzadeh_Ardabili_-_Azan.ogg'.replace(' ', ''),
    license: 'Public Domain (Iran National Heritage)',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Rahim_Moazenzadeh_Ardabili_-_Azan.ogg',
  },
  {
    id: 'mahur_saeed',
    name: 'Iranian Adhan — Mahur',
    nameFa: 'اذان ایرانی؛ دستگاه ماهور (بسته‌بندی آفلاین در اپ)',
    reciter: 'سعید حاتم‌زاده ورمزیار',
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/AzaanMaahur.ogg',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:AzaanMaahur.ogg',
  },
  {
    id: 'makkah',
    name: 'Makkah Adhan',
    nameFa: 'اذان مسجدالحرام (مکه مکرمه)',
    reciter: 'مؤذن مسجدالحرام',
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e2/Adhan_by_Sheikh_Ali_Ahmed_Mulla.ogg',
    license: 'CC BY-SA 3.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Adhan_by_Sheikh_Ali_Ahmed_Mulla.ogg',
  },
  {
    id: 'madinah',
    name: 'Madinah Adhan',
    nameFa: 'اذان سحرگاهی مسجدالنبی (مدینه منوره)',
    reciter: 'مؤذن مدینه منوره',
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/59/Adhan_Madinah.ogg',
    license: 'CC0 / Public Domain',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Adhan_Madinah.ogg',
  },
  {
    id: 'shia_traditional',
    name: 'Shia Traditional Adhan',
    nameFa: 'اذان شیعی با شهادت به ولایت امیرالمؤمنین (ع)',
    reciter: 'نوای سنتی شیعی',
    audioUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Azan_shia.ogg',
    license: 'CC BY-SA 3.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Azan_shia.ogg',
  },
];
