import { useState, useEffect } from 'react';
import { Check, Sparkles, MapPin, Compass } from 'lucide-react';

export type HeroCategoryKey =
  | 'all'
  | 'shrines'
  | 'prayer_times'
  | 'occ_ramadan_mahdi'
  | 'muharram_safar'
  | 'islamic_arch';

export interface HeroArtDesign {
  fallbackGradient?: string;
  crownTextFa?: string;
  imageUrl?: string;
  id: string;
  order: number;
  titleFa: string;
  subtitleFa: string;
  dhikrFa: string;
  usageGuideFa: string;
  category: Exclude<HeroCategoryKey, 'all'>;
  cityMatch?: string[];
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  accent: string;
  glow: string;
  archType: 'shrine_gold' | 'karbala_twin' | 'kaaba' | 'mosque_turquoise' | 'ramadan_lanterns' | 'muharram_flag' | 'mahdi_dawn' | 'persian_mihrab';
  hasMoon?: boolean;
  hasLanterns?: boolean;
  hasStars?: boolean;
  hasBirds?: boolean;
}

export const HERO_RELIGIOUS_CATEGORIES: { id: HeroCategoryKey; labelFa: string; icon: string }[] = [
  { id: 'all', labelFa: 'همه ۲۰ طرح', icon: '✨' },
  { id: 'shrines', labelFa: 'حرم‌ها و اعتاب مقدسه', icon: '🕋' },
  { id: 'prayer_times', labelFa: 'اوقات نماز و مناجات', icon: '🕌' },
  { id: 'occ_ramadan_mahdi', labelFa: 'رمضان، جمعه و اعیاد', icon: '🌙' },
  { id: 'muharram_safar', labelFa: 'محرم و صفر حسینی', icon: '🏴' },
  { id: 'islamic_arch', labelFa: 'مساجد تاریخی ایران', icon: '🏛️' },
];

export const HERO_30_DESIGNS: HeroArtDesign[] = [
  // === ۱. اعتاب مقدسه و حرم‌های مطهر (shrines) ===
  {
    id: 'shrine_mashhad_reza',
    order: 1,
    titleFa: '۱. حرم مطهر امام رضا (ع) — مشهد مقدس',
    subtitleFa: 'گنبد طلایی، گلدسته‌ها و صحن انقلاب در شب زیارتی',
    dhikrFa: 'اللَّهُمَّ صَلِّ عَلَى عَلِيِّ بْنِ مُوسَى الرِّضَا الْمُرْتَضَى (ع)',
    usageGuideFa: 'مناسب برای همه ایام سال، چهارشنبه‌های امام رضایی و افق مشهد مقدس',
    category: 'shrines',
    cityMatch: ['مشهد', ' نیشابور', 'سبزوار', 'تربت'],
    skyTop: '#041B15',
    skyMid: '#0B3B2D',
    skyBottom: '#165B46',
    accent: '#FBBF24',
    glow: 'rgba(251, 191, 36, 0.45)',
    archType: 'shrine_gold',
    hasStars: true,
    hasBirds: true,
  },
  {
    id: 'shrine_karbala_hussein',
    order: 2,
    titleFa: '۲. بین‌الحرمین شریفین — کربلای معلی',
    subtitleFa: 'گنبدهای نورانی حضرت سیدالشهدا (ع) و قمر بنی‌هاشم (ع)',
    dhikrFa: 'السَّلَامُ عَلَى الْحُسَيْنِ وَ عَلَى أَوْلَادِ الْحُسَيْنِ وَ عَلَى أَصْحَابِ الْحُسَيْنِ',
    usageGuideFa: 'مناسب برای شب‌های جمعه (شب زیارتی سیدالشهدا ع) و عاشقان کربلا',
    category: 'shrines',
    cityMatch: ['کربلا'],
    skyTop: '#1A070A',
    skyMid: '#3B0D16',
    skyBottom: '#591623',
    accent: '#F59E0B',
    glow: 'rgba(245, 158, 11, 0.45)',
    archType: 'karbala_twin',
    hasStars: true,
    hasMoon: true,
  },
  {
    id: 'shrine_najaf_ali',
    order: 3,
    titleFa: '۳. ایوان طلای نجف اشرف — حرم امیرالمؤمنین (ع)',
    subtitleFa: 'گنبد و بارگاه ملکوتی حضرت علی (ع) در نجف اشرف',
    dhikrFa: 'أَشْهَدُ أَنَّ عَلِيّاً وَلِيُّ اللَّهِ — السَّلَامُ عَلَيْكَ يَا أَمِيرَ الْمُؤْمِنِينَ',
    usageGuideFa: 'مناسب برای ایام امیرالمؤمنین (ع)، روز پدر، غدیر و توسل به مولا علی (ع)',
    category: 'shrines',
    cityMatch: ['نجف'],
    skyTop: '#071726',
    skyMid: '#0F3152',
    skyBottom: '#1E4E7A',
    accent: '#FDE047',
    glow: 'rgba(253, 224, 71, 0.45)',
    archType: 'shrine_gold',
    hasStars: true,
  },
  {
    id: 'shrine_makkah_kaaba',
    order: 4,
    titleFa: '۴. مسجدالحرام و کعبه معظمه — مکه مکرمه',
    subtitleFa: 'قبله مسلمین جهان با کسوه مشکین و حزام طلایی',
    dhikrFa: 'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ',
    usageGuideFa: 'مناسب برای اوقات نماز، دهه ذی‌الحجه، عید قربان و حال‌وهوای حج',
    category: 'shrines',
    cityMatch: ['مکه'],
    skyTop: '#050B14',
    skyMid: '#0F2038',
    skyBottom: '#193559',
    accent: '#FBBF24',
    glow: 'rgba(251, 191, 36, 0.4)',
    archType: 'kaaba',
    hasStars: true,
    hasMoon: true,
  },
  {
    id: 'shrine_madinah_prophet',
    order: 5,
    titleFa: '۵. مسجدالنبی (ص) و گنبد خضراء — مدینه منوره',
    subtitleFa: 'گنبد سبز حرم پیامبر رحمت حضرت محمد مصطفی (ص) و بقیع',
    dhikrFa: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَ آلِ مُحَمَّدٍ وَ عَجِّلْ فَرَجَهُمْ',
    usageGuideFa: 'مناسب برای روزهای شنبه (روز پیامبر اکرم ص)، مبعث و هفته وحدت',
    category: 'shrines',
    cityMatch: ['مدینه'],
    skyTop: '#031C14',
    skyMid: '#084231',
    skyBottom: '#11694F',
    accent: '#34D399',
    glow: 'rgba(52, 211, 153, 0.45)',
    archType: 'mosque_turquoise',
    hasStars: true,
    hasBirds: true,
  },
  {
    id: 'shrine_qom_jamkaran',
    order: 6,
    titleFa: '۶. حرم حضرت معصومه (س) و مسجد جمکران — قم',
    subtitleFa: 'گنبد طلایی کریمه اهل‌بیت (س) و فیروزه مهدوی جمکران',
    dhikrFa: 'يَا فَاطِمَةُ اشْفَعِي لِي فِي الْجَنَّةِ — يَا صَاحِبَ الزَّمَانِ أَدْرِكْنِي',
    usageGuideFa: 'مناسب برای شب‌های چهارشنبه (جمکران)، دهه کرامت و افق شهر قم',
    category: 'shrines',
    cityMatch: ['قم'],
    skyTop: '#061B24',
    skyMid: '#0E3E52',
    skyBottom: '#166280',
    accent: '#38BDF8',
    glow: 'rgba(56, 189, 248, 0.45)',
    archType: 'shrine_gold',
    hasStars: true,
  },

  // === ۲. اوقات نماز و مناجات شبانه (prayer_times) ===
  {
    id: 'prayer_tahajjud_sahar',
    order: 7,
    titleFa: '۷. خلوت سحرگاهی و مناجات نماز شب',
    subtitleFa: 'آسمان پرستاره سحر و محراب فیروزه‌ای در آرامش شب',
    dhikrFa: 'إِلَهِي هَبْ لِي كَمَالَ الانْقِطَاعِ إِلَيْكَ وَ أَنِرْ أَبْصَارَ قُلُوبِنَا بِضِيَاءِ نَظَرِهَا إِلَيْكَ',
    usageGuideFa: 'مناسب برای سحرگاه، نماز شب، استغفار سحر و آرامش شبانگاهی',
    category: 'prayer_times',
    skyTop: '#030B17',
    skyMid: '#091E3A',
    skyBottom: '#103561',
    accent: '#38BDF8',
    glow: 'rgba(56, 189, 248, 0.4)',
    archType: 'mosque_turquoise',
    hasStars: true,
    hasMoon: true,
  },
  {
    id: 'prayer_fajr_horizon',
    order: 8,
    titleFa: '۸. سپیده‌دم و طلوع فجر صادق (نماز صبح)',
    subtitleFa: 'نسیم صبحگاهی و روشنایی فجر بر فراز گنبد و مناره',
    dhikrFa: 'أَصْبَحْنَا وَ أَصْبَحَ الْمُلْكُ لِلَّهِ رَبِّ الْعَالَمِينَ',
    usageGuideFa: 'مناسب برای وقت نماز صبح، قرائت دعای عهد و شروع روزی پرخیر و برکت',
    category: 'prayer_times',
    skyTop: '#082032',
    skyMid: '#15475E',
    skyBottom: '#2C7873',
    accent: '#6EE7B7',
    glow: 'rgba(110, 231, 183, 0.42)',
    archType: 'mahdi_dawn',
    hasBirds: true,
  },
  {
    id: 'prayer_dhuhr_emerald',
    order: 9,
    titleFa: '۹. ظهر ملکوتی و گلدسته‌های فیروزه‌ای',
    subtitleFa: 'طنین اذان ظهر در صحن فیروزه‌ای و آسمان زلال',
    dhikrFa: 'حَيَّ عَلَى الصَّلَاةِ — حَيَّ عَلَى خَيْرِ الْعَمَلِ',
    usageGuideFa: 'مناسب برای وقت اذان ظهر و عصر و یادآوری اول وقت نماز',
    category: 'prayer_times',
    skyTop: '#052923',
    skyMid: '#0D5245',
    skyBottom: '#177A68',
    accent: '#FBBF24',
    glow: 'rgba(251, 191, 36, 0.38)',
    archType: 'persian_mihrab',
    hasBirds: true,
  },
  {
    id: 'prayer_maghrib_golden',
    order: 10,
    titleFa: '۱۰. شفق طلایی و اذان مغرب در صحن مطهر',
    subtitleFa: 'تلالو نور طلایی غروب آفتاب بر گنبد و مناره‌های مسجد',
    dhikrFa: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ بِإِقْبَالِ لَيْلِكَ وَ إِدْبَارِ نَهَارِكَ أَنْ تَغْفِرَ لِي ذُنُوبِي',
    usageGuideFa: 'مناسب برای وقت اذان مغرب و عشاء و تلاوت سوره واقعه در شب',
    category: 'prayer_times',
    skyTop: '#1A1026',
    skyMid: '#3D1E42',
    skyBottom: '#7A3E3E',
    accent: '#FBBF24',
    glow: 'rgba(251, 191, 36, 0.45)',
    archType: 'shrine_gold',
    hasStars: true,
    hasMoon: true,
  },

  // === ۳. رمضان، جمعه مهدوی و اعیاد اسلامی (occ_ramadan_mahdi) ===
  {
    id: 'occ_friday_mahdi',
    order: 11,
    titleFa: '۱۱. صبح جمعه و عهد منتظران حضرت مهدی (عج)',
    subtitleFa: 'افق سبز و طلایی انتظار با دعای سلامتی امام زمان (عج)',
    dhikrFa: 'اللَّهُمَّ كُنْ لِوَلِيِّكَ الْحُجَّةِ بْنِ الْحَسَنِ صَلَوَاتُكَ عَلَيْهِ وَ عَلَى آبَائِهِ',
    usageGuideFa: 'مناسب برای روزهای جمعه (دعای ندبه و سمات)، نیمه شعبان و عهد مهدوی',
    category: 'occ_ramadan_mahdi',
    skyTop: '#042419',
    skyMid: '#0A4F38',
    skyBottom: '#167A59',
    accent: '#FDE047',
    glow: 'rgba(253, 224, 71, 0.48)',
    archType: 'mahdi_dawn',
    hasBirds: true,
    hasStars: true,
  },
  {
    id: 'occ_ramadan_lanterns',
    order: 12,
    titleFa: '۱۲. ماه مبارک رمضان (فانوس‌های نورانی و هلال ماه)',
    subtitleFa: 'فانوس‌های طلایی آویزان در ایوان مسجد و هلال رمضان',
    dhikrFa: 'شَهْرُ رَمَضَانَ الَّذِي أُنْزِلَ فِيهِ الْقُرْآنُ — اللَّهُمَّ رَبَّ شَهْرِ رَمَضَانَ',
    usageGuideFa: 'مناسب برای کل ماه مبارک رمضان، افطار، سحر و دعای افتتاح و ابوحمزه',
    category: 'occ_ramadan_mahdi',
    skyTop: '#06152D',
    skyMid: '#0F2C59',
    skyBottom: '#1A4684',
    accent: '#FBBF24',
    glow: 'rgba(251, 191, 36, 0.5)',
    archType: 'ramadan_lanterns',
    hasMoon: true,
    hasLanterns: true,
    hasStars: true,
  },
  {
    id: 'occ_laylat_al_qadr',
    order: 13,
    titleFa: '۱۳. شب‌های قدر و نزول ملائکه تا مطلع الفجر',
    subtitleFa: 'آسمان لاجوردی شب قدر، نور قرآن و نیایش جوشن کبیر',
    dhikrFa: 'سَلَامٌ هِيَ حَتَّى مَطْلَعِ الْفَجْرِ — سُبْحَانَكَ يَا لَا إِلَهَ إِلَّا أَنْتَ الْغَوْثَ الْغَوْثَ',
    usageGuideFa: 'مناسب برای شب‌های ۱۹، ۲۱ و ۲۳ ماه رمضان (لیالی قدر) و تلاوت قرآن',
    category: 'occ_ramadan_mahdi',
    skyTop: '#020813',
    skyMid: '#081836',
    skyBottom: '#112E5E',
    accent: '#93C5FD',
    glow: 'rgba(147, 197, 253, 0.45)',
    archType: 'mosque_turquoise',
    hasStars: true,
    hasMoon: true,
  },
  {
    id: 'occ_eid_ghadir_shaban',
    order: 14,
    titleFa: '۱۴. عید سعید غدیر خم و اعیاد شعبانیه',
    subtitleFa: 'چراغانی طلایی و فیروزه‌ای حرم در جشن ولایت و امامت',
    dhikrFa: 'الْحَمْدُ لِلَّهِ الَّذِي جَعَلَنَا مِنَ الْمُتَمَسِّكِينَ بِوِلاَيَةِ أَمِيرِ الْمُؤْمِنِينَ وَ الأَئِمَّةِ (ع)',
    usageGuideFa: 'مناسب برای عید غدیر، عید فطر، مبعث، میلاد ائمه اطهار (ع) و اعیاد شعبانیه',
    category: 'occ_ramadan_mahdi',
    skyTop: '#05261F',
    skyMid: '#0C5242',
    skyBottom: '#168068',
    accent: '#FDE047',
    glow: 'rgba(253, 224, 71, 0.5)',
    archType: 'ramadan_lanterns',
    hasLanterns: true,
    hasStars: true,
  },

  // === ۴. محرم، صفر و ایام سوگواری حسینی (muharram_safar) ===
  {
    id: 'muharram_golden_dome_flag',
    order: 15,
    titleFa: '۱۵. ایام محرم الحرام (گنبد طلایی و بیرق سرخ حسینی)',
    subtitleFa: 'پرچم یا حسین (ع) بر فراز گنبد طلایی در آسمان سرخ محرم',
    dhikrFa: 'السَّلَامُ عَلَيْكَ يَا أَبَا عَبْدِ اللَّهِ وَ عَلَى الْأَرْوَاحِ الَّتِي حَلَّتْ بِفِنَائِكَ',
    usageGuideFa: 'مناسب برای دهه اول محرم، قرائت زیارت عاشورا و ایام عزاداری سیدالشهدا (ع)',
    category: 'muharram_safar',
    skyTop: '#1A0507',
    skyMid: '#3B0A11',
    skyBottom: '#5E111B',
    accent: '#F87171',
    glow: 'rgba(248, 113, 113, 0.45)',
    archType: 'muharram_flag',
    hasStars: true,
  },
  {
    id: 'muharram_ashura_candles',
    order: 16,
    titleFa: '۱۶. شام غریبان و شمع‌های روشن در صحن عزا',
    subtitleFa: 'فانوس‌ها و شمع‌های سوگواری در تاریکی شب عاشورا',
    dhikrFa: 'صَلَّى اللَّهُ عَلَيْكَ يَا أَبَا عَبْدِ اللَّهِ — يَا لَيْتَنَا كُنَّا مَعَكُمْ فَنَفُوزَ فَوْزاً عَظِيماً',
    usageGuideFa: 'مناسب برای تاسوعا و عاشورای حسینی، شهادت ائمه (ع) و ایام فاطمیه',
    category: 'muharram_safar',
    skyTop: '#0D0406',
    skyMid: '#24080E',
    skyBottom: '#3D0F18',
    accent: '#FBBF24',
    glow: 'rgba(251, 191, 36, 0.35)',
    archType: 'karbala_twin',
    hasLanterns: true,
  },
  {
    id: 'safar_arbaeen_walk',
    order: 17,
    titleFa: '۱۷. طریق‌الحسین (ع) و پیاده‌روی اربعین حسینی',
    subtitleFa: 'عمودهای مسیر نجف تا کربلا و افق گنبد سیدالشهدا (ع)',
    dhikrFa: 'اللَّهُمَّ ارْزُقْنِي شَفَاعَةَ الْحُسَيْنِ يَوْمَ الْوُرُودِ وَ ثَبِّتْ لِي قَدَمَ صِدْقٍ عِنْدَكَ',
    usageGuideFa: 'مناسب برای ماه صفر، ایام پیاده‌روی اربعین و زیارت از راه دور',
    category: 'muharram_safar',
    skyTop: '#170B08',
    skyMid: '#381B12',
    skyBottom: '#5C2E1F',
    accent: '#F59E0B',
    glow: 'rgba(245, 158, 11, 0.42)',
    archType: 'muharram_flag',
    hasMoon: true,
  },

  // === ۵. مساجد تاریخی و معماری اسلامی ایران (islamic_arch) ===
  {
    id: 'arch_goharshad_mashhad',
    order: 18,
    titleFa: '۱۸. مسجد جامع گوهرشاد — ایوان مقصوره و گنبد فیروزه‌ای',
    subtitleFa: 'شاهکار معماری اسلامی و کتیبه‌های قرآنی در جوار حرم رضوی',
    dhikrFa: 'إِنَّمَا يَعْمُرُ مَسَاجِدَ اللَّهِ مَنْ آمَنَ بِاللَّهِ وَ الْيَوْمِ الْآخِرِ وَ أَقَامَ الصَّلَاةَ',
    usageGuideFa: 'مناسب برای علاقه‌مندان به معماری اصیل مساجد ایرانی و کاشی‌کاری فیروزه‌ای',
    category: 'islamic_arch',
    cityMatch: ['مشهد'],
    skyTop: '#041E24',
    skyMid: '#0A4552',
    skyBottom: '#136B7D',
    accent: '#38BDF8',
    glow: 'rgba(56, 189, 248, 0.45)',
    archType: 'persian_mihrab',
    hasBirds: true,
  },
  {
    id: 'arch_isfahan_lotfollah',
    order: 19,
    titleFa: '۱۹. مسجد شیخ لطف‌الله و مسجد امام — اصفهان',
    subtitleFa: 'نقوش اسلیمی طلایی و گنبد لاجوردی نصف جهان',
    dhikrFa: 'اللَّهُ نُورُ السَّمَاوَاتِ وَ الْأَرْضِ مَثَلُ نُورِهِ كَمِشْكَاةٍ فِيهَا مِصْبَاحٌ',
    usageGuideFa: 'مناسب برای افق اصفهان و دوستداران هنر اسلیمی و محراب‌های فیروزه‌ای',
    category: 'islamic_arch',
    cityMatch: ['اصفهان', 'کاشان'],
    skyTop: '#06182E',
    skyMid: '#103663',
    skyBottom: '#1B5799',
    accent: '#FBBF24',
    glow: 'rgba(251, 191, 36, 0.45)',
    archType: 'persian_mihrab',
    hasStars: true,
  },
  {
    id: 'arch_shiraz_nasir_al_mulk',
    order: 20,
    titleFa: '۲۰. شبستان مسجد نصیرالملک و حرم شاهچراغ (ع) — شیراز',
    subtitleFa: 'تلالو نور صبحگاهی از شیشه‌های هفت‌رنگ بر فرش سجده‌گاه',
    dhikrFa: 'سُبْحَانَ رَبِّيَ الْأَعْلَى وَ بِحَمْدِهِ — اللَّهُمَّ نَوِّرْ قُلُوبَنَا بِالْقُرْآنِ',
    usageGuideFa: 'مناسب برای افق شیراز، حرم حضرت احمد بن موسی شاهچراغ (ع) و نمازهای روزانه',
    category: 'islamic_arch',
    cityMatch: ['شیراز', 'یزد', 'کرمان'],
    skyTop: '#091E1C',
    skyMid: '#134742',
    skyBottom: '#21736B',
    accent: '#34D399',
    glow: 'rgba(52, 211, 153, 0.45)',
    archType: 'mosque_turquoise',
    hasLanterns: true,
  },
];

export type HeroSelectionMode = 'auto_occasion' | 'auto_city' | 'manual';

export interface HeroUserConfig {
  mode: HeroSelectionMode;
  selectedId: string;
}

const HERO_CONFIG_KEY = 'noor_hero_gallery_config_v3';

export function loadHeroConfig(): HeroUserConfig {
  try {
    const raw = localStorage.getItem(HERO_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.mode && parsed.selectedId) return parsed;
    }
  } catch {}
  return { mode: 'manual', selectedId: 'shrine_mashhad_reza' };
}

export function saveHeroConfig(cfg: HeroUserConfig): void {
  try {
    localStorage.setItem(HERO_CONFIG_KEY, JSON.stringify(cfg));
    window.dispatchEvent(new Event('noor-hero-config-changed'));
  } catch {}
}

export function resolveActiveHeroDesign(cityName: string = 'مشهد', nextPrayerKey: string = 'fajr'): HeroArtDesign {
  const cfg = loadHeroConfig();
  if (cfg.mode === 'manual') {
    return HERO_30_DESIGNS.find((d) => d.id === cfg.selectedId) || HERO_30_DESIGNS[0];
  }
  if (cfg.mode === 'auto_city') {
    const matched = HERO_30_DESIGNS.find((d) => d.cityMatch?.some((c) => cityName.includes(c.trim())));
    if (matched) return matched;
  }
  // auto_occasion: انتخاب هوشمند بر اساس روز هفته (جمعه مهدوی) و وقت نماز
  const now = new Date();
  if (now.getDay() === 5) {
    return HERO_30_DESIGNS.find((d) => d.id === 'occ_friday_mahdi') || HERO_30_DESIGNS[0];
  }
  if (nextPrayerKey === 'fajr') {
    return HERO_30_DESIGNS.find((d) => d.id === 'prayer_fajr_horizon') || HERO_30_DESIGNS[0];
  }
  if (nextPrayerKey === 'dhuhr' || nextPrayerKey === 'asr') {
    return HERO_30_DESIGNS.find((d) => d.id === 'prayer_dhuhr_emerald') || HERO_30_DESIGNS[0];
  }
  if (nextPrayerKey === 'maghrib' || nextPrayerKey === 'isha') {
    return HERO_30_DESIGNS.find((d) => d.id === 'prayer_maghrib_golden') || HERO_30_DESIGNS[0];
  }
  return HERO_30_DESIGNS[0];
}

// رندرکننده گرافیکی برداری و سه‌بعدی (۱۰۰٪ آفلاین، بدون هیچ عکس شکسته و بسیار سریع)
export function RenderHeroArtworkScene({ design }: { design: HeroArtDesign }) {
  const isTurquoise = design.archType === 'mosque_turquoise' || design.archType === 'persian_mihrab';
  const domeColorStart = isTurquoise ? '#67E8F9' : '#FEF08A';
  const domeColorMid = isTurquoise ? '#06B6D4' : '#F59E0B';
  const domeColorEnd = isTurquoise ? '#0E7490' : '#92400E';

  return (
    <svg
      viewBox="0 0 400 190"
      className="w-full h-full object-cover select-none pointer-events-none"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={`sky_${design.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={design.skyTop} />
          <stop offset="55%" stopColor={design.skyMid} />
          <stop offset="100%" stopColor={design.skyBottom} />
        </linearGradient>
        <linearGradient id={`dome_${design.id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={domeColorStart} />
          <stop offset="50%" stopColor={domeColorMid} />
          <stop offset="100%" stopColor={domeColorEnd} />
        </linearGradient>
        <radialGradient id={`glow_${design.id}`} cx="50%" cy="68%" r="50%">
          <stop offset="0%" stopColor={design.accent} stopOpacity="0.42" />
          <stop offset="100%" stopColor={design.accent} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* آسمان */}
      <rect width="400" height="190" fill={`url(#sky_${design.id})`} />

      {/* هاله نورانی افق */}
      <circle cx="200" cy="135" r="115" fill={`url(#glow_${design.id})`} />

      {/* ستارگان */}
      {design.hasStars && (
        <g fill="#FEF08A" opacity="0.75">
          <circle cx="45" cy="28" r="1.3" />
          <circle cx="95" cy="18" r="1.8" />
          <circle cx="155" cy="32" r="1.2" />
          <circle cx="260" cy="22" r="1.6" />
          <circle cx="320" cy="35" r="1.4" />
          <circle cx="365" cy="19" r="1.7" />
        </g>
      )}

      {/* هلال ماه */}
      {design.hasMoon && (
        <path
          d="M330 26 A16 16 0 1 0 348 48 A13 13 0 1 1 330 26 Z"
          fill="#FEF08A"
          opacity="0.92"
        />
      )}

      {/* فانوس‌های آویزان */}
      {design.hasLanterns && (
        <g stroke="#FBBF24" strokeWidth="1" fill="rgba(245, 158, 11, 0.7)">
          <line x1="65" y1="0" x2="65" y2="38" />
          <polygon points="65,38 73,50 65,64 57,50" />
          <line x1="335" y1="0" x2="335" y2="34" />
          <polygon points="335,34 343,46 335,60 327,46" />
        </g>
      )}

      {/* معماری کعبه معظمه */}
      {design.archType === 'kaaba' ? (
        <g>
          <rect x="162" y="88" width="76" height="72" rx="4" fill="#0B0F17" stroke="#FBBF24" strokeWidth="1.5" />
          <rect x="162" y="104" width="76" height="9" fill="#FBBF24" />
          <rect x="206" y="118" width="16" height="26" rx="2" fill="#D97706" />
        </g>
      ) : design.archType === 'karbala_twin' ? (
        /* بین‌الحرمین با دو گنبد نورانی */
        <g>
          <path d="M95 148 C95 112 155 112 155 148 Z" fill={`url(#dome_${design.id})`} />
          <rect x="82" y="96" width="6" height="52" fill="#D97706" />
          <rect x="162" y="96" width="6" height="52" fill="#D97706" />
          <path d="M245 148 C245 115 300 115 300 148 Z" fill={`url(#dome_${design.id})`} />
          <rect x="233" y="100" width="6" height="48" fill="#D97706" />
          <rect x="306" y="100" width="6" height="48" fill="#D97706" />
          <rect x="60" y="146" width="280" height="24" fill="#1F090E" />
        </g>
      ) : (
        /* گنبد و مناره باشکوه حرم و مسجد */
        <g>
          {/* گلدسته‌های طرفین */}
          <rect x="128" y="76" width="8.5" height="74" fill="#D97706" opacity="0.9" />
          <path d="M128 76 C128 67 136.5 67 136.5 76 Z" fill="#FEF08A" />
          <rect x="263.5" y="76" width="8.5" height="74" fill="#D97706" opacity="0.9" />
          <path d="M263.5 76 C263.5 67 272 67 272 76 Z" fill="#FEF08A" />

          {/* گنبد مرکزی */}
          <path d="M154 136 C154 84 246 84 246 136 Z" fill={`url(#dome_${design.id})`} />
          <rect x="198.5" y="72" width="3" height="16" fill="#FEF08A" />

          {/* بیرق سرخ یا سبز برای طرح‌های محرم یا مهدوی */}
          {design.archType === 'muharram_flag' && (
            <path d="M201 72 L228 78 L201 85 Z" fill="#EF4444" />
          )}
          {design.archType === 'mahdi_dawn' && (
            <path d="M201 72 L228 78 L201 85 Z" fill="#10B981" />
          )}

          {/* ایوان و رواق‌ها */}
          <rect x="115" y="135" width="170" height="32" rx="4" fill="#0B2E25" stroke={design.accent} strokeWidth="1" />
          <path d="M184 167 L184 146 C184 138 216 138 216 146 L216 167 Z" fill="#041511" stroke={design.accent} strokeWidth="1" />
        </g>
      )}

      {/* کبوتران حرم */}
      {design.hasBirds && (
        <g stroke="#FEF08A" strokeWidth="1.4" fill="none" opacity="0.8">
          <path d="M110 62 Q114 57 118 62 Q122 57 126 62" />
          <path d="M280 54 Q284 49 288 54 Q292 49 296 54" />
        </g>
      )}

      {/* افق محو شونده پایین برای ترکیب نرم با کارت‌های صفحه خانه */}
      <rect x="0" y="152" width="400" height="40" fill={design.skyBottom} opacity="0.65" />
    </svg>
  );
}

// مدال انتخابگر پوسته و تصویر بالای صفحه خانه (برای باز شدن از داخل صفحه تنظیمات!)
export function Hero30SelectorModal({
  cityName = 'مشهد',
  onClose,
  onSelectConfig,
}: {
  cityName?: string;
  onClose: () => void;
  onSelectConfig?: (cfg: HeroUserConfig) => void;
}) {
  const [cfg, setCfg] = useState<HeroUserConfig>(() => loadHeroConfig());
  const [activeCategory, setActiveCategory] = useState<HeroCategoryKey>('all');

  const filteredDesigns = HERO_30_DESIGNS.filter(
    (d) => activeCategory === 'all' || d.category === activeCategory
  );

  const handleConfirm = () => {
    saveHeroConfig(cfg);
    if (onSelectConfig) onSelectConfig(cfg);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      style={{ background: 'rgba(2, 10, 18, 0.88)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
      dir="rtl"
    >
      <div
        className="w-full max-w-lg rounded-[30px] p-4 border shadow-2xl flex flex-col max-h-[90vh]"
        style={{
          background: 'linear-gradient(180deg, #0B192C 0%, #06101E 100%)',
          borderColor: 'rgba(251, 191, 36, 0.35)',
          color: '#ECFDF5',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* هدر مدال */}
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🎨</span>
            <div>
              <h3 className="text-sm font-black text-white">
                پوسته و تصویر معنوی بالای صفحه خانه (Hero)
              </h3>
              <p className="text-[11px] text-emerald-100/65 mt-0.5">
                دسته‌بندی‌شده بر اساس حرم‌ها، اوقات نماز، رمضان، محرم و مساجد
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs border"
            style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.15)' }}
          >
            ✕
          </button>
        </div>

        {/* ۳ کارت حالت انتخاب (انتخاب دستی / خودکار مناسبتی و اوقات نماز / متناسب با شهر) */}
        <div className="grid grid-cols-3 gap-2 my-3">
          <button
            type="button"
            onClick={() => setCfg({ ...cfg, mode: 'manual' })}
            className="p-2.5 rounded-2xl border text-right transition-all"
            style={{
              background: cfg.mode === 'manual' ? 'rgba(251, 191, 36, 0.14)' : 'rgba(255,255,255,0.03)',
              borderColor: cfg.mode === 'manual' ? '#FBBF24' : 'rgba(255,255,255,0.1)',
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-black text-white">انتخاب دستی</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black" style={{ background: 'rgba(251,191,36,0.2)', color: '#FBBF24' }}>پیشنهادی</span>
            </div>
            <p className="text-[10px] opacity-70 leading-snug">انتخاب مستقیم طرح دلخواه شما</p>
          </button>

          <button
            type="button"
            onClick={() => setCfg({ ...cfg, mode: 'auto_occasion' })}
            className="p-2.5 rounded-2xl border text-right transition-all"
            style={{
              background: cfg.mode === 'auto_occasion' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255,255,255,0.03)',
              borderColor: cfg.mode === 'auto_occasion' ? '#34D399' : 'rgba(255,255,255,0.1)',
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-black text-white">خودکار زمانی</span>
              <Sparkles size={12} color="#34D399" />
            </div>
            <p className="text-[10px] opacity-70 leading-snug">تغییر در صبح، ظهر، مغرب و جمعه</p>
          </button>

          <button
            type="button"
            onClick={() => setCfg({ ...cfg, mode: 'auto_city' })}
            className="p-2.5 rounded-2xl border text-right transition-all"
            style={{
              background: cfg.mode === 'auto_city' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.03)',
              borderColor: cfg.mode === 'auto_city' ? '#38BDF8' : 'rgba(255,255,255,0.1)',
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-black text-white">متناسب با شهر</span>
              <MapPin size={12} color="#38BDF8" />
            </div>
            <p className="text-[10px] opacity-70 leading-snug">حرم و مسجد شاخص ({cityName})</p>
          </button>
        </div>

        {/* تب‌های دسته‌بندی کارشناسی مذهبی */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 shrink-0">
          {HERO_RELIGIOUS_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className="px-3 py-1.5 rounded-full text-[11px] font-black whitespace-nowrap border flex items-center gap-1 transition-all"
                style={{
                  background: isActive ? '#FBBF24' : 'rgba(255,255,255,0.05)',
                  borderColor: isActive ? '#FBBF24' : 'rgba(255,255,255,0.12)',
                  color: isActive ? '#041511' : '#ECFDF5',
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.labelFa}</span>
              </button>
            );
          })}
        </div>

        {/* شبکه کارت‌های پیش‌نمایش زنده (بدون هیچ عکس شکسته!) + نمایش توضیح کاربرد مذهبی هر طرح */}
        <div className="grid grid-cols-2 gap-2.5 overflow-y-auto py-2 pr-0.5 flex-1">
          {filteredDesigns.map((d) => {
            const isSelected = cfg.selectedId === d.id && cfg.mode === 'manual';
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setCfg({ mode: 'manual', selectedId: d.id })}
                className="rounded-2xl overflow-hidden border text-right flex flex-col transition-transform active:scale-[0.98] relative"
                style={{
                  background: '#081526',
                  borderColor: isSelected ? '#FBBF24' : 'rgba(255,255,255,0.1)',
                  boxShadow: isSelected ? '0 0 0 2px rgba(251, 191, 36, 0.35)' : 'none',
                }}
              >
                {/* تصویر گرافیکی زنده بالای کارت (بدون تگ img شکسته!) */}
                <div className="w-full h-24 relative overflow-hidden">
                  <RenderHeroArtworkScene design={d} />
                  {isSelected && (
                    <div
                      className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center shadow-lg"
                      style={{ background: '#FBBF24', color: '#041511' }}
                    >
                      <Check size={14} strokeWidth={3} />
                    </div>
                  )}
                </div>

                {/* مشخصات و راهنمای مناسبت هر طرح */}
                <div className="p-2.5 space-y-1 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] font-black text-white leading-snug line-clamp-1">
                      {d.titleFa}
                    </div>
                    <div className="text-[9px] text-amber-300/90 truncate mt-0.5">
                      {d.dhikrFa}
                    </div>
                  </div>
                  <div
                    className="text-[9px] px-1.5 py-1 rounded-lg mt-1 leading-relaxed"
                    style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(209, 250, 229, 0.75)' }}
                  >
                    💡 {d.usageGuideFa}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* دکمه تایید پایین مدال */}
        <div className="pt-3 border-t mt-1" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full py-3 rounded-2xl font-black text-xs shadow-xl transition-transform active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #FBBF24 0%, #D97706 100%)',
              color: '#041511',
            }}
          >
            ✓ تأیید و نمایش در بالای صفحه خانه
          </button>
        </div>
      </div>
    </div>
  );
}
