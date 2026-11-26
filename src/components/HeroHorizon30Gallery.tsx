import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Check, Sparkles, MapPin } from 'lucide-react';
import { getCachedRemoteWallpapers, getCachedRemoteThemes, GLOBAL_SYNC_UPDATED_EVENT } from '@/lib/globalSyncService';

export type HeroCategoryKey =
  | 'all'
  | 'shrines'
  | 'prayer_times'
  | 'occ_ramadan_mahdi'
  | 'muharram_safar'
  | 'iranian_occasions'
  | 'nature_cosmos'
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
  isRemoteOta?: boolean;
  isFeatured?: boolean;
}

export const HERO_RELIGIOUS_CATEGORIES: { id: HeroCategoryKey; labelFa: string }[] = [
  { id: 'all', labelFa: 'همه (۴۰)' },
  { id: 'shrines', labelFa: 'حرم‌های مطهر' },
  { id: 'nature_cosmos', labelFa: 'طبیعت و کیهان' },
  { id: 'iranian_occasions', labelFa: 'آیین‌های ایرانی' },
  { id: 'occ_ramadan_mahdi', labelFa: 'رجب، شعبان و رمضان' },
  { id: 'prayer_times', labelFa: 'اوقات نماز' },
  { id: 'muharram_safar', labelFa: 'محرم و صفر' },
  { id: 'islamic_arch', labelFa: 'مساجد و شهرها' },
];

export const HERO_30_DESIGNS: HeroArtDesign[] = [
  // === ۱. اعتاب مقدسه و حرم‌های مطهر (shrines) ===
  {
    id: 'shrine_mashhad_reza',
    order: 1,
    titleFa: '۱. حرم امام رضا (ع)',
    subtitleFa: 'گنبد طلایی، گلدسته‌ها و صحن انقلاب در شب زیارتی',
    dhikrFa: 'اللَّهُمَّ صَلِّ عَلَى عَلِيِّ بْنِ مُوسَى الرِّضَا الْمُرْتَضَى (ع)',
    usageGuideFa: 'مناسب برای همه ایام سال، چهارشنبه‌های امام رضایی و افق مشهد مقدس',
    category: 'shrines',
    cityMatch: ['مشهد', 'نیشابور', 'سبزوار', 'تربت', 'بجنورد', 'بیرجند'],
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
    titleFa: '۲. بین‌الحرمین کربلا',
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
    titleFa: '۳. حرم امیرالمؤمنین (ع)',
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
    titleFa: '۴. مسجدالحرام و کعبه',
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
    titleFa: '۵. مسجدالنبی (ص)',
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
    titleFa: '۶. حرم حضرت معصومه (س)',
    subtitleFa: 'گنبد طلایی کریمه اهل‌بیت (س) و فیروزه مهدوی قم',
    dhikrFa: 'يَا فَاطِمَةُ اشْفَعِي لِي فِي الْجَنَّةِ — يَا صَاحِبَ الزَّمَانِ أَدْرِكْنِي',
    usageGuideFa: 'مناسب برای شب‌های چهارشنبه، دهه کرامت و افق شهر مقدس قم',
    category: 'shrines',
    cityMatch: ['قم', 'ساوه'],
    skyTop: '#061B24',
    skyMid: '#0E3E52',
    skyBottom: '#166280',
    accent: '#38BDF8',
    glow: 'rgba(56, 189, 248, 0.45)',
    archType: 'shrine_gold',
    hasStars: true,
  },

  // === ۲. اوقات نماز شبانه‌روز (prayer_times) ===
  {
    id: 'prayer_tahajjud_sahar',
    order: 7,
    titleFa: '۷. خلوت سحر و نماز شب',
    subtitleFa: 'آرامش شبانگاهی صحن و ایوان در وقت نماز شب',
    dhikrFa: 'إِلَهِي هَبْ لِي كَمَالَ الانْقِطَاعِ إِلَيْكَ وَ أَنِرْ أَبْصَارَ قُلُوبِنَا بِضِيَاءِ نَظَرِهَا إِلَيْكَ',
    usageGuideFa: 'مناسب برای سحرگاه، نماز شب، استغفار سحر و خلوت شبانگاهی',
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
    titleFa: '۸. سپیده‌دم و فجر صادق',
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
    titleFa: '۹. افق اذان ظهر',
    subtitleFa: 'طنین اذان ظهر در روشنایی صحن و آسمان زلال',
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
    titleFa: '۱۰. شفق طلایی مغرب',
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

  // === ۳. رجب، شعبان، رمضان، جمعه مهدوی و اعیاد اسلامی (occ_ramadan_mahdi) ===
  {
    id: 'occ_friday_mahdi',
    order: 11,
    titleFa: '۱۱. صبح جمعه و انتظار (جمکران)',
    subtitleFa: 'مسجد مقدس جمکران با دعای سلامتی امام زمان (عج)',
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
    titleFa: '۱۲. ضیافت ماه رمضان',
    subtitleFa: 'حال‌وهوای تلاوت قرآن و انس با کتاب خدا در ماه رمضان',
    dhikrFa: 'شَهْرُ رَمَضَانَ الَّذِي أُنْزِلَ فِيهِ الْقُرْآنُ — اللَّهُمَّ رَبَّ شَهْرِ رَمَضَانَ',
    usageGuideFa: 'مناسب برای کل ماه مبارک رمضان، تلاوت روزانه و دعای افتتاح',
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
    titleFa: '۱۳. شب‌های پرنور قدر',
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
    titleFa: '۱۴. عید غدیر و اعیاد',
    subtitleFa: 'چراغانی طلایی و باشکوه حرم در جشن ولایت و اعیاد اسلامی',
    dhikrFa: 'الْحَمْدُ لِلَّهِ الَّذِي جَعَلَنَا مِنَ الْمُتَمَسِّكِينَ بِوِلاَيَةِ أَمِيرِ الْمُؤْمِنِينَ وَ الأَئِمَّةِ (ع)',
    usageGuideFa: 'مناسب برای عید غدیر، عید فطر، مبعث و میلاد ائمه اطهار (ع)',
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
    titleFa: '۱۵. محرم و بیرق حسینی',
    subtitleFa: 'شور عزاداری حسینی و پرچم سیدالشهدا (ع) در ماه محرم',
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
    titleFa: '۱۶. شام غریبان عاشورا',
    subtitleFa: 'سوگواری و شمع‌های شام غریبان در غم سیدالشهدا (ع)',
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
    titleFa: '۱۷. مسیر اربعین حسینی',
    subtitleFa: 'کاروان زائران و پیاده‌روی اربعین حسینی به سوی کربلا',
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

  // === ۵. مساجد تاریخی و آثار شاخص شهرهای ایران (islamic_arch) ===
  {
    id: 'arch_goharshad_mashhad',
    order: 18,
    titleFa: '۱۸. مسجد جامع گوهرشاد',
    subtitleFa: 'ایوان مقصوره و کاشی‌کاری فیروزه‌ای در جوار حرم رضوی',
    dhikrFa: 'إِنَّمَا يَعْمُرُ مَسَاجِدَ اللَّهِ مَنْ آمَنَ بِاللَّهِ وَ الْيَوْمِ الْآخِرِ وَ أَقَامَ الصَّلَاةَ',
    usageGuideFa: 'مناسب برای علاقه‌مندان به معماری اصیل مساجد ایرانی و کاشی‌کاری فیروزه‌ای',
    category: 'islamic_arch',
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
    titleFa: '۱۹. مسجد شیخ لطف‌الله اصفهان',
    subtitleFa: 'نقوش اسلیمی طلایی و گنبد لاجوردی نصف جهان',
    dhikrFa: 'اللَّهُ نُورُ السَّمَاوَاتِ وَ الْأَرْضِ مَثَلُ نُورِهِ كَمِشْكَاةٍ فِيهَا مِصْبَاحٌ',
    usageGuideFa: 'مناسب برای افق اصفهان، کاشان و دوستداران هنر اسلیمی و محراب‌های فیروزه‌ای',
    category: 'islamic_arch',
    cityMatch: ['اصفهان', 'کاشان', 'شهرکرد', 'نجف‌آباد'],
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
    titleFa: '۲۰. مسجد نصیرالملک شیراز',
    subtitleFa: 'تلالو نور صبحگاهی از شیشه‌های هفت‌رنگ بر فرش سجده‌گاه',
    dhikrFa: 'سُبْحَانَ رَبِّيَ الْأَعْلَى وَ بِحَمْدِهِ — اللَّهُمَّ نَوِّرْ قُلُوبَنَا بِالْقُرْآنِ',
    usageGuideFa: 'تصویر پیش‌فرض نور؛ مناسب برای نمازهای صبحگاهی و معماری رنگین‌کمانی شیراز',
    category: 'islamic_arch',
    skyTop: '#091E1C',
    skyMid: '#134742',
    skyBottom: '#21736B',
    accent: '#34D399',
    glow: 'rgba(52, 211, 153, 0.45)',
    archType: 'mosque_turquoise',
    hasLanterns: true,
  },
  {
    id: 'city_tehran_abdolazim',
    order: 21,
    titleFa: '۲۱. حرم شاه‌عبدالعظیم (ع) تهران',
    subtitleFa: 'بارگاه ملکوتی حضرت عبدالعظیم حسنی (ع) در شهرری و افق تهران',
    dhikrFa: 'السَّلَامُ عَلَيْكَ يَا أَبَا الْقَاسِمِ بْنَ السِّبْطِ الْمُنْتَجَبِ الْمُجْتَبَى',
    usageGuideFa: 'مناسب برای افق تهران، شهرری، کرج و استان البرز',
    category: 'islamic_arch',
    cityMatch: ['تهران', 'شهرری', 'کرج', 'البرز', 'سمنان', 'قزوین', 'همدان', 'اراک'],
    skyTop: '#051D21',
    skyMid: '#0D3E45',
    skyBottom: '#18636B',
    accent: '#FBBF24',
    glow: 'rgba(251, 191, 36, 0.42)',
    archType: 'shrine_gold',
    hasStars: true,
  },
  {
    id: 'city_tabriz_blue_mosque',
    order: 22,
    titleFa: '۲۲. مسجد کبود تبریز',
    subtitleFa: 'فیروزه جهان اسلام و سردر تاریخی کاشی‌معرق آذربایجان',
    dhikrFa: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَ فِي الْآخِرَةِ حَسَنَةً',
    usageGuideFa: 'مناسب برای افق تبریز، اردبیل، ارومیه، زنجان و خطه آذربایجان',
    category: 'islamic_arch',
    cityMatch: ['تبریز', 'ارومیه', 'اردبیل', 'زنجان', 'مراغه', 'رشت', 'ساری', 'گرگان'],
    skyTop: '#07182B',
    skyMid: '#12365E',
    skyBottom: '#1F568F',
    accent: '#38BDF8',
    glow: 'rgba(56, 189, 248, 0.42)',
    archType: 'persian_mihrab',
    hasBirds: true,
  },
  {
    id: 'city_yazd_jameh',
    order: 23,
    titleFa: '۲۳. مسجد جامع کبیر یزد',
    subtitleFa: 'مناره‌های سربه‌فلک‌کشیده و ایوان باشکوه دارالعباده یزد',
    dhikrFa: 'فَاذْكُرُونِي أَذْكُرْكُمْ وَ اشْكُرُوا لِي وَ لَا تَكْفُرُونِ',
    usageGuideFa: 'مناسب برای افق یزد، میبد، اردکان و شهرهای تاریخی کویر',
    category: 'islamic_arch',
    cityMatch: ['یزد', 'میبد', 'اردکان'],
    skyTop: '#16110B',
    skyMid: '#362717',
    skyBottom: '#594025',
    accent: '#FBBF24',
    glow: 'rgba(251, 191, 36, 0.4)',
    archType: 'persian_mihrab',
    hasStars: true,
  },
  {
    id: 'city_kerman_jameh',
    order: 24,
    titleFa: '۲۴. مسجد جامع کرمان',
    subtitleFa: 'کاشی‌کاری معرق صفوی و صحن آرامش‌بخش مسجد جامع کرمان',
    dhikrFa: 'وَمَنْ يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ',
    usageGuideFa: 'مناسب برای افق کرمان، رفسنجان، زاهدان، بندرعباس و جنوب شرق ایران',
    category: 'islamic_arch',
    cityMatch: ['کرمان', 'رفسنجان', 'زاهدان', 'بندرعباس', 'چابهار'],
    skyTop: '#071D26',
    skyMid: '#104154',
    skyBottom: '#1B6885',
    accent: '#38BDF8',
    glow: 'rgba(56, 189, 248, 0.42)',
    archType: 'persian_mihrab',
    hasBirds: true,
  },
  {
    id: 'city_shiraz_shahcheragh',
    order: 25,
    titleFa: '۲۵. حرم مطهر شاهچراغ (ع) شیراز',
    subtitleFa: 'سومین حرم اهل‌بیت (ع) در ایران، آستان مقدس حضرت احمد بن موسی (ع)',
    dhikrFa: 'السَّلَامُ عَلَيْكَ يَا سَيِّدَ السَّادَاتِ أَحْمَدَ بْنَ مُوسَى الْكَاظِمِ (ع)',
    usageGuideFa: 'مناسب برای افق شیراز، بوشهر، یاسوج، اهواز و جنوب ایران',
    category: 'shrines',
    cityMatch: ['شیراز', 'بوشهر', 'یاسوج', 'اهواز', 'آبادان', 'خرم‌آباد', 'کرمانشاه', 'سنندج', 'ایلام'],
    skyTop: '#051E19',
    skyMid: '#0D453A',
    skyBottom: '#176E5D',
    accent: '#FDE047',
    glow: 'rgba(253, 224, 71, 0.45)',
    archType: 'shrine_gold',
    hasStars: true,
  },

  // === ۶. آیین‌های سنتی و فصلی ایران (iranian_occasions) ===
  {
    id: 'occ_iran_nowruz',
    order: 26,
    titleFa: '۲۶. نوروز و هفت‌سین بهاری',
    subtitleFa: 'آغاز بهار طبیعت و سال نو ایرانی با دعای تحویل سال',
    dhikrFa: 'يَا مُقَلِّبَ الْقُلُوبِ وَ الْأَبْصَارِ، يَا مُدَبِّرَ اللَّيْلِ وَ النَّهَارِ، حَوِّلْ حَالَنَا إِلَى أَحْسَنِ الْحَالِ',
    usageGuideFa: 'نمایش خودکار در ایام عید نوروز (۱ تا ۱۲ فروردین) و طراوت بهاری',
    category: 'iranian_occasions',
    skyTop: '#062619',
    skyMid: '#0F4D34',
    skyBottom: '#1C7852',
    accent: '#4ADE80',
    glow: 'rgba(74, 222, 128, 0.45)',
    archType: 'mahdi_dawn',
    hasBirds: true,
  },
  {
    id: 'occ_iran_chaharshanbe',
    order: 27,
    titleFa: '۲۷. چهارشنبه‌سوری و آیین نور',
    subtitleFa: 'آیین کهن آخرین چهارشنبه سال و استقبال از بهار',
    dhikrFa: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَ فِي الْآخِرَةِ حَسَنَةً — اللَّهُمَّ بَارِكْ لَنَا فِي خِتَامِ عَامِنَا',
    usageGuideFa: 'نمایش خودکار در شب چهارشنبه‌سوری (آخرین سه‌شنبه اسفند هر سال)',
    category: 'iranian_occasions',
    skyTop: '#1F0C05',
    skyMid: '#4A1D0A',
    skyBottom: '#783210',
    accent: '#FB923C',
    glow: 'rgba(251, 146, 60, 0.48)',
    archType: 'ramadan_lanterns',
    hasStars: true,
  },
  {
    id: 'occ_iran_sizdah_bedar',
    order: 28,
    titleFa: '۲۸. سیزده‌به‌در و روز طبیعت',
    subtitleFa: 'دشت سرسبز بهاری و شکرگزاری از نعمت طبیعت ایران',
    dhikrFa: 'سُبْحَانَ الَّذِي خَلَقَ الْأَزْوَاجَ كُلَّهَا مِمَّا تُنْبِتُ الْأَرْضُ — الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
    usageGuideFa: 'نمایش خودکار در ۱۳ فروردین (روز طبیعت) و روزهای بهاری',
    category: 'iranian_occasions',
    skyTop: '#05241C',
    skyMid: '#0E4E3D',
    skyBottom: '#1D7C62',
    accent: '#34D399',
    glow: 'rgba(52, 211, 153, 0.45)',
    archType: 'mahdi_dawn',
    hasBirds: true,
  },
  {
    id: 'occ_iran_yalda',
    order: 29,
    titleFa: '۲۹. شب یلدا و انار ایرانی',
    subtitleFa: 'بلندترین شب سال، صله رحم، دورهمی خانواده و برکت زمستان',
    dhikrFa: 'اللَّهُمَّ بَارِكْ لَنَا فِي أَهْلِنَا وَ أَحِبَّتِنَا — رَبِّ زِدْنِي عِلْماً وَ رَحْمَةً',
    usageGuideFa: 'نمایش خودکار در شب یلدا (۳۰ آذر) و حال‌وهوای گرم زمستان',
    category: 'iranian_occasions',
    skyTop: '#1F050B',
    skyMid: '#450B18',
    skyBottom: '#6E1328',
    accent: '#F87171',
    glow: 'rgba(248, 113, 113, 0.45)',
    archType: 'ramadan_lanterns',
    hasLanterns: true,
  },

  // === ۷. ماه رجب، اعیاد شعبانیه و رمضان بیشتر (occ_ramadan_mahdi) ===
  {
    id: 'occ_rajab_raghaib',
    order: 30,
    titleFa: '۳۰. ماه رجب و لیلةالرغائب',
    subtitleFa: 'ماه استغفار، مناجات شبانه، شب آرزوها و عید مبعث',
    dhikrFa: 'أَسْتَغْفِرُ اللَّهَ وَ أَسْأَلُهُ التَّوْبَةَ — يَا مَنْ أَرْجُوهُ لِكُلِّ خَيْرٍ',
    usageGuideFa: 'نمایش خودکار در سراسر ماه رجب، لیلةالرغائب، ۱۳ رجب و مبعث',
    category: 'occ_ramadan_mahdi',
    skyTop: '#071429',
    skyMid: '#122E59',
    skyBottom: '#1F4B8A',
    accent: '#FBBF24',
    glow: 'rgba(251, 191, 36, 0.45)',
    archType: 'ramadan_lanterns',
    hasLanterns: true,
    hasStars: true,
  },
  {
    id: 'occ_shaban_celebration',
    order: 31,
    titleFa: '۳۱. اعیاد شعبانیه و نیمه‌شعبان',
    subtitleFa: 'چراغانی و سرور ماه شعبان، مناجات شعبانیه و میلاد منجی',
    dhikrFa: 'إِلَهِي هَبْ لِي كَمَالَ الانْقِطَاعِ إِلَيْكَ — اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَ آلِ مُحَمَّدٍ',
    usageGuideFa: 'نمایش خودکار در ماه مبارک شعبان، اعیاد شعبانیه و نیمه شعبان',
    category: 'occ_ramadan_mahdi',
    skyTop: '#06241C',
    skyMid: '#0F4F3E',
    skyBottom: '#1A7D63',
    accent: '#FDE047',
    glow: 'rgba(253, 224, 71, 0.5)',
    archType: 'shrine_gold',
    hasStars: true,
  },
  {
    id: 'occ_ramadan_iftar',
    order: 32,
    titleFa: '۳۲. مهتاب و افطار ماه رمضان',
    subtitleFa: 'آرامش لحظه افطار و نیایش شبانه در ماه میهمانی خدا',
    dhikrFa: 'اللَّهُمَّ لَكَ صُمْنَا وَ عَلَى رِزْقِكَ أَفْطَرْنَا فَتَقَبَّلْ مِنَّا إِنَّكَ أَنْتَ السَّمِيعُ الْعَلِيمُ',
    usageGuideFa: 'نمایش خودکار در غروب و شب‌های ماه رمضان (وقت افطار و مغرب)',
    category: 'occ_ramadan_mahdi',
    skyTop: '#050C1D',
    skyMid: '#102347',
    skyBottom: '#1D3C75',
    accent: '#FDE047',
    glow: 'rgba(253, 224, 71, 0.45)',
    archType: 'ramadan_lanterns',
    hasMoon: true,
    hasStars: true,
  },
  {
    id: 'occ_ramadan_crescent',
    order: 33,
    titleFa: '۳۳. هلال ماه مبارک رمضان',
    subtitleFa: 'رویت هلال نورانی ماه رمضان در آسمان بیکران',
    dhikrFa: 'اللَّهُمَّ أَهِلَّهُ عَلَيْنَا بِالْأَمْنِ وَ الْإِيمَانِ وَ السَّلَامَةِ وَ الْإِسْلَامِ',
    usageGuideFa: 'نمایش خودکار در آغاز ماه رمضان و سحرگاهان ماه مبارک',
    category: 'occ_ramadan_mahdi',
    skyTop: '#030817',
    skyMid: '#0B1A3D',
    skyBottom: '#16316B',
    accent: '#93C5FD',
    glow: 'rgba(147, 197, 253, 0.48)',
    archType: 'mosque_turquoise',
    hasMoon: true,
    hasStars: true,
  },

  // === ۸. شکوه طبیعت و اعماق کیهان — یادآور عظمت آفریدگار (nature_cosmos) ===
  {
    id: 'nature_damavand_peak',
    order: 34,
    titleFa: '۳۴. شکوه کوهستان و قله دماوند',
    subtitleFa: 'عظمت کوه‌های استوار به عنوان نشانه‌ای از قدرت آفریدگار',
    dhikrFa: 'وَالْجِبَالَ أَوْتَاداً — فَتَبَارَكَ اللَّهُ أَحْسَنُ الْخَالِقِينَ',
    usageGuideFa: 'یادآور عظمت و استواری آفرینش خداوند در کوهستان‌های بلند',
    category: 'nature_cosmos',
    skyTop: '#071929',
    skyMid: '#123859',
    skyBottom: '#1F5A8C',
    accent: '#7DD3FC',
    glow: 'rgba(125, 211, 252, 0.45)',
    archType: 'mahdi_dawn',
    hasBirds: true,
  },
  {
    id: 'nature_mirror_lake',
    order: 35,
    titleFa: '۳۵. دریاچه آینه‌ای کوهستان',
    subtitleFa: 'آرامش زلال آب و انعکاس آسمان در سکوت طبیعت',
    dhikrFa: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ — فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ',
    usageGuideFa: 'مناسب برای لحظات آرامش، تفکر و حس حضور در طبیعت بکر',
    category: 'nature_cosmos',
    skyTop: '#041C24',
    skyMid: '#0B4052',
    skyBottom: '#146985',
    accent: '#38BDF8',
    glow: 'rgba(56, 189, 248, 0.45)',
    archType: 'mosque_turquoise',
  },
  {
    id: 'nature_forest_waterfall',
    order: 36,
    titleFa: '۳۶. جنگل مه‌آلود و آبشار بهشتی',
    subtitleFa: 'جریان آب زنده در میان درختان سرسبز و نعمت‌های الهی',
    dhikrFa: 'وَجَعَلْنَا مِنَ الْمَاءِ كُلَّ شَيْءٍ حَيٍّ — سُبْحَانَ اللَّهِ وَ بِحَمْدِهِ',
    usageGuideFa: 'مناسب برای حس طراوت، شکرگزاری و یادآوری رحمت گسترده خداوند',
    category: 'nature_cosmos',
    skyTop: '#041F17',
    skyMid: '#0B4736',
    skyBottom: '#167056',
    accent: '#34D399',
    glow: 'rgba(52, 211, 153, 0.45)',
    archType: 'mahdi_dawn',
  },
  {
    id: 'nature_aurora_sky',
    order: 37,
    titleFa: '۳۷. شفق قطبی و آسمان شب',
    subtitleFa: 'رقص نور زمردی در آسمان شب و شگفتی آفرینش الهی',
    dhikrFa: 'اللَّهُ نُورُ السَّمَاوَاتِ وَ الْأَرْضِ — سُبْحَانَ رَبِّيَ الْعَظِيمِ',
    usageGuideFa: 'جلوه‌ای شگفت‌انگیز از نور و رنگ در آسمان شب آفرینش',
    category: 'nature_cosmos',
    skyTop: '#031418',
    skyMid: '#08333D',
    skyBottom: '#0F5763',
    accent: '#2DD4BF',
    glow: 'rgba(45, 212, 191, 0.5)',
    archType: 'mosque_turquoise',
    hasStars: true,
  },
  {
    id: 'nature_ocean_sunrise',
    order: 38,
    titleFa: '۳۸. اقیانوس بیکران و طلوع آفتاب',
    subtitleFa: 'گستردگی دریاها و طلوع امیدبخش خورشید بر پهنه آب',
    dhikrFa: 'وَإِنْ تَعُدُّوا نِعْمَةَ اللَّهِ لَا تُحْصُوهَا — الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
    usageGuideFa: 'مناسب برای صبح‌های پرانرژی و حس وسعت بی‌کران رحمت الهی',
    category: 'nature_cosmos',
    skyTop: '#1A1124',
    skyMid: '#4A2838',
    skyBottom: '#8A4B38',
    accent: '#FBBF24',
    glow: 'rgba(251, 191, 36, 0.48)',
    archType: 'mahdi_dawn',
  },
  {
    id: 'cosmos_milkyway_stars',
    order: 39,
    titleFa: '۳۹. کهکشان راه شیری و ستارگان',
    subtitleFa: 'میلیاردها ستاره در پهنه آسمان؛ نشانه‌ای از بزرگی بی‌انتهای خدا',
    dhikrFa: 'تَبَارَكَ الَّذِي جَعَلَ فِي السَّمَاءِ بُرُوجاً — إِنَّ فِي خَلْقِ السَّمَاوَاتِ وَ الْأَرْضِ لَآيَاتٍ لِأُولِي الْأَلْبَابِ',
    usageGuideFa: 'تفکر در بزرگی کیهان و ستارگان؛ یادآور عظمت بی‌حد آفریدگار',
    category: 'nature_cosmos',
    skyTop: '#020612',
    skyMid: '#0A1633',
    skyBottom: '#172C5C',
    accent: '#93C5FD',
    glow: 'rgba(147, 197, 253, 0.5)',
    archType: 'mosque_turquoise',
    hasStars: true,
  },
  {
    id: 'cosmos_jameswebb_nebula',
    order: 40,
    titleFa: '۴۰. اعماق کیهان و سحابی (جیمز وب)',
    subtitleFa: 'تصویر واقعی تلسکوپ جیمز وب از زادگاه ستارگان در سحابی کارینا',
    dhikrFa: 'سَنُرِيهِمْ آيَاتِنَا فِي الْآفَاقِ وَ فِي أَنْفُسِهِمْ — وَالسَّمَاءَ بَنَيْنَاهَا بِأَيْدٍ وَإِنَّا لَمُوسِعُونَ',
    usageGuideFa: 'شاهکار واقعی اعماق کیهان؛ یادآور اینکه خدا بی‌نهایت بزرگ‌تر از تصور ماست',
    category: 'nature_cosmos',
    skyTop: '#0A0714',
    skyMid: '#241433',
    skyBottom: '#4A2736',
    accent: '#FBBF24',
    glow: 'rgba(251, 191, 36, 0.52)',
    archType: 'mosque_turquoise',
    hasStars: true,
  },
];

// نقشه دقیق و ۱۰۰٪ یکتای تصاویر آفلاین (۴۰ عنوان = ۴۰ فایل مجزا بدون هیچ تکرار)
export const OFFLINE_SHRINE_IMAGE_MAP: Record<string, string> = {
  shrine_mashhad_reza: '/shrines/mashhad.jpg',
  shrine_karbala_hussein: '/shrines/karbala.jpg',
  shrine_najaf_ali: '/shrines/najaf.jpg',
  shrine_makkah_kaaba: '/shrines/makkah.jpg',
  shrine_madinah_prophet: '/shrines/madinah.jpg',
  shrine_qom_jamkaran: '/shrines/qom.jpg',
  prayer_tahajjud_sahar: '/shrines/sahar.jpg',
  prayer_fajr_horizon: '/shrines/fajr.jpg',
  prayer_dhuhr_emerald: '/shrines/dhuhr.jpg',
  prayer_maghrib_golden: '/shrines/maghrib.jpg',
  occ_friday_mahdi: '/shrines/jamkaran.jpg',
  occ_ramadan_lanterns: '/shrines/ramadan.jpg',
  occ_laylat_al_qadr: '/shrines/qadr.jpg',
  occ_eid_ghadir_shaban: '/shrines/ghadir.jpg',
  muharram_golden_dome_flag: '/shrines/muharram.jpg',
  muharram_ashura_candles: '/shrines/ashura.jpg',
  safar_arbaeen_walk: '/shrines/arbaeen.jpg',
  arch_goharshad_mashhad: '/shrines/goharshad.jpg',
  arch_isfahan_lotfollah: '/shrines/isfahan.jpg',
  arch_shiraz_nasir_al_mulk: '/shrines/shiraz.jpg',
  city_tehran_abdolazim: '/shrines/tehran.jpg',
  city_tabriz_blue_mosque: '/shrines/tabriz.jpg',
  city_yazd_jameh: '/shrines/yazd.jpg',
  city_kerman_jameh: '/shrines/kerman.jpg',
  city_shiraz_shahcheragh: '/shrines/shahcheragh.jpg',
  occ_iran_nowruz: '/shrines/nowruz.jpg',
  occ_iran_chaharshanbe: '/shrines/chaharshanbe.jpg',
  occ_iran_sizdah_bedar: '/shrines/sizdah_bedar.jpg',
  occ_iran_yalda: '/shrines/yalda.jpg',
  occ_rajab_raghaib: '/shrines/rajab.jpg',
  occ_shaban_celebration: '/shrines/shaban.jpg',
  occ_ramadan_iftar: '/shrines/ramadan_iftar.jpg',
  occ_ramadan_crescent: '/shrines/ramadan_crescent.jpg',
  nature_damavand_peak: '/shrines/nature_damavand.jpg',
  nature_mirror_lake: '/shrines/nature_lake.jpg',
  nature_forest_waterfall: '/shrines/nature_forest_waterfall.jpg',
  nature_aurora_sky: '/shrines/nature_aurora.jpg',
  nature_ocean_sunrise: '/shrines/nature_ocean_sunrise.jpg',
  cosmos_milkyway_stars: '/shrines/cosmos_milkyway.jpg',
  cosmos_jameswebb_nebula: '/shrines/cosmos_nebula.jpg',
};

export function getOfflineIranSafeImage(designId: string | number): string {
  const key = String(designId).trim();
  if (OFFLINE_SHRINE_IMAGE_MAP[key]) {
    return OFFLINE_SHRINE_IMAGE_MAP[key];
  }
  return '/shrines/shiraz.jpg';
}

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
  return { mode: 'manual', selectedId: 'arch_shiraz_nasir_al_mulk' };
}

export function saveHeroConfig(cfg: HeroUserConfig): void {
  try {
    localStorage.setItem(HERO_CONFIG_KEY, JSON.stringify(cfg));
    window.dispatchEvent(new Event('noor-hero-config-changed'));
  } catch {}
}

function mapRemoteWallpaperCategory(cat: string): Exclude<HeroCategoryKey, 'all'> {
  if (cat === 'mosque') return 'islamic_arch';
  if (cat === 'occasion') return 'occ_ramadan_mahdi';
  if (cat === 'nature') return 'nature_cosmos';
  return 'shrines';
}

export function getAllHeroDesigns(): HeroArtDesign[] {
  const remoteWallpapers: HeroArtDesign[] = getCachedRemoteWallpapers()
    .filter((w) => Boolean(w.image_url))
    .map((w, idx) => ({
      id: 'ota_wp_' + w.id,
      order: idx + 1,
      titleFa: w.title_fa,
      subtitleFa: w.subtitle_fa || 'والپیپر جدید آنلاین',
      dhikrFa: w.occasion_tag || 'اضافه شده از همگام‌سازی سراسری نور',
      usageGuideFa: w.subtitle_fa || 'تصویر جدید و باکیفیت دریافت‌شده از سرور نور',
      category: mapRemoteWallpaperCategory(w.category),
      imageUrl: w.image_url,
      skyTop: '#041B15',
      skyMid: '#0B3B2D',
      skyBottom: '#165B46',
      accent: '#FBBF24',
      glow: 'rgba(251, 191, 36, 0.42)',
      archType: 'shrine_gold',
      isRemoteOta: true,
      isFeatured: Boolean(w.is_featured),
    }));

  const themeWallpapers: HeroArtDesign[] = getCachedRemoteThemes()
    .filter((t) => Boolean(t.wallpaper_url))
    .map((t, idx) => ({
      id: 'ota_theme_wp_' + t.id,
      order: 100 + idx,
      titleFa: 'منظره تم ' + t.name_fa,
      subtitleFa: t.occasion_fa || 'والپیپر هماهنگ با تم مناسبتی',
      dhikrFa: t.occasion_fa || t.name_fa,
      usageGuideFa: 'هماهنگ با رنگ‌بندی تم ' + t.name_fa,
      category: 'occ_ramadan_mahdi',
      imageUrl: t.wallpaper_url,
      skyTop: t.bg_color || '#041B15',
      skyMid: t.surface_color || '#0B3B2D',
      skyBottom: t.surface_alt_color || '#165B46',
      accent: t.accent_color || '#FBBF24',
      glow: 'rgba(251, 191, 36, 0.42)',
      archType: 'shrine_gold',
      isRemoteOta: true,
      isFeatured: Boolean(t.is_featured),
    }));

  return [...remoteWallpapers, ...themeWallpapers, ...HERO_30_DESIGNS];
}

// تبدیل دقیق تاریخ میلادی به شمسی (مستقل از Intl، ۱۰۰٪ سازگار با اندروید ۷ تا ۱۶)
export function gregorianToJalali(gyInput: number, gm: number, gd: number): { jy: number; jm: number; jd: number } {
  const gdm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let gy = gyInput;
  let jy = gy <= 1600 ? 0 : 979;
  gy -= gy <= 1600 ? 621 : 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) -
    80 +
    gd +
    gdm[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return { jy, jm, jd };
}

function getHijriMonthDaySafe(date: Date): { month: number; day: number } | null {
  try {
    const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      month: 'numeric',
      day: 'numeric',
    }).formatToParts(date);
    const m = Number(parts.find((p) => p.type === 'month')?.value);
    const d = Number(parts.find((p) => p.type === 'day')?.value);
    if (Number.isFinite(m) && Number.isFinite(d) && m >= 1 && m <= 12 && d >= 1 && d <= 30) {
      return { month: m, day: d };
    }
  } catch {}
  return null;
}

export function resolveCityMatchedHeroDesign(cityName: string): HeroArtDesign | null {
  const cleanCity = (cityName || '').trim();
  if (!cleanCity) return null;

  let bestDesign: HeroArtDesign | null = null;
  let bestScore = 0;

  for (const design of HERO_30_DESIGNS) {
    if (!design.cityMatch) continue;
    for (const rawToken of design.cityMatch) {
      const token = rawToken.trim();
      if (!token) continue;
      if (cleanCity === token) {
        return design;
      }
      if (cleanCity.includes(token) && token.length > bestScore) {
        bestScore = token.length;
        bestDesign = design;
      }
    }
  }
  return bestDesign;
}

export function resolveOccasionHeroDesign(
  now: Date = new Date(),
  nextPrayerKey: string = 'fajr',
  hijriOverride?: { month: number; day: number } | null
): HeroArtDesign {
  const byId = (id: string) => HERO_30_DESIGNS.find((d) => d.id === id) || HERO_30_DESIGNS[0];

  // ۱. مناسبت‌های کلیدی هجری قمری (عاشورا، محرم، اربعین، قدر، رمضان، رجب، شعبان، غدیر و حج)
  const hijri = hijriOverride !== undefined ? hijriOverride : getHijriMonthDaySafe(now);
  if (hijri) {
    if (hijri.month === 1 && hijri.day === 10) return byId('muharram_ashura_candles');
    if (hijri.month === 1 && hijri.day >= 1 && hijri.day <= 13) return byId('muharram_golden_dome_flag');
    if (hijri.month === 2 && hijri.day >= 15 && hijri.day <= 22) return byId('safar_arbaeen_walk');
    if (hijri.month === 9 && (hijri.day === 19 || hijri.day === 21 || hijri.day === 23)) return byId('occ_laylat_al_qadr');
    if (hijri.month === 9) {
      if (nextPrayerKey === 'maghrib' || nextPrayerKey === 'isha') return byId('occ_ramadan_iftar');
      if (hijri.day <= 3 || nextPrayerKey === 'fajr') return byId('occ_ramadan_crescent');
      return byId('occ_ramadan_lanterns');
    }
    if ((hijri.month === 12 && hijri.day === 18) || (hijri.month === 10 && hijri.day <= 2)) {
      return byId('occ_eid_ghadir_shaban');
    }
    if (hijri.month === 12 && hijri.day >= 8 && hijri.day <= 12) return byId('shrine_makkah_kaaba');
  }

  // ۲. آیین‌های سنتی و فصلی ایران (نوروز، سیزده‌به‌در، شب یلدا، چهارشنبه‌سوری)
  const jalali = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  if (jalali.jm === 1 && jalali.jd === 13) return byId('occ_iran_sizdah_bedar');
  if (jalali.jm === 1 && jalali.jd >= 1 && jalali.jd <= 12) return byId('occ_iran_nowruz');
  if ((jalali.jm === 9 && jalali.jd === 30) || (jalali.jm === 10 && jalali.jd === 1 && now.getHours() < 6)) {
    return byId('occ_iran_yalda');
  }
  if (jalali.jm === 12 && (now.getDay() === 2 || (now.getDay() === 3 && now.getHours() < 12))) {
    const plusDays = now.getDay() === 2 ? 7 : 6;
    const probe = new Date(now.getFullYear(), now.getMonth(), now.getDate() + plusDays);
    const probeJ = gregorianToJalali(probe.getFullYear(), probe.getMonth() + 1, probe.getDate());
    if (probeJ.jm === 1) return byId('occ_iran_chaharshanbe');
  }

  // ۳. ماه‌های پر فضیلت رجب و شعبان (اعیاد شعبانیه، نیمه شعبان، لیلةالرغائب و مبعث)
  if (hijri) {
    if (hijri.month === 8) return byId('occ_shaban_celebration');
    if (hijri.month === 7) return byId('occ_rajab_raghaib');
  }

  // ۴. شب جمعه (کربلا)، روز جمعه (جمکران) و اوقات نماز شبانه‌روز
  if (now.getDay() === 4 && now.getHours() >= 18) return byId('shrine_karbala_hussein');
  if (now.getDay() === 5) return byId('occ_friday_mahdi');
  if (now.getHours() < 4) return byId('prayer_tahajjud_sahar');
  if (nextPrayerKey === 'fajr') return byId('prayer_fajr_horizon');
  if (nextPrayerKey === 'dhuhr' || nextPrayerKey === 'asr') return byId('prayer_dhuhr_emerald');
  if (nextPrayerKey === 'maghrib' || nextPrayerKey === 'isha') return byId('prayer_maghrib_golden');
  return byId('arch_shiraz_nasir_al_mulk');
}

export function resolveActiveHeroDesign(cityName: string = 'مشهد', nextPrayerKey: string = 'fajr'): HeroArtDesign {
  const cfg = loadHeroConfig();
  const allDesigns = getAllHeroDesigns();
  if (cfg.mode === 'manual') {
    return allDesigns.find((d) => d.id === cfg.selectedId) || HERO_30_DESIGNS[0];
  }
  if (cfg.mode === 'auto_city') {
    const matched = resolveCityMatchedHeroDesign(cityName);
    if (matched) return matched;
  }
  return resolveOccasionHeroDesign(new Date(), nextPrayerKey);
}

export function RenderHeroArtworkScene({ design }: { design: HeroArtDesign }) {
  const localSafeImg = getOfflineIranSafeImage(design.id);
  const preferredImg = design.imageUrl || localSafeImg;
  const [src, setSrc] = useState<string>(preferredImg);
  const [imgHidden, setImgHidden] = useState<boolean>(false);

  useEffect(() => {
    setSrc(design.imageUrl || getOfflineIranSafeImage(design.id));
    setImgHidden(false);
  }, [design.id, design.imageUrl]);

  return (
    <div
      className="w-full h-full relative overflow-hidden select-none pointer-events-none"
      style={{
        background: `linear-gradient(165deg, ${design.skyTop} 0%, ${design.skyMid} 52%, ${design.skyBottom} 100%)`,
      }}
    >
      {!imgHidden && (
        <img
          src={src}
          alt=""
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-300"
          style={{ filter: 'brightness(0.96) contrast(1.06) saturate(1.12)' }}
          onError={() => {
            if (src !== localSafeImg) {
              setSrc(localSafeImg);
            } else if (src !== '/hero-default.jpg') {
              setSrc('/hero-default.jpg');
            } else {
              setImgHidden(true);
            }
          }}
        />
      )}

      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 35%, ${design.accent}22 0%, transparent 65%), linear-gradient(180deg, rgba(3, 16, 13, 0.28) 0%, rgba(5, 24, 19, 0.08) 48%, ${design.skyBottom}CC 100%)`,
        }}
      />
    </div>
  );
}

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
  const [syncTick, setSyncTick] = useState(0);
  useEffect(() => {
    const onSync = () => setSyncTick((t) => t + 1);
    window.addEventListener(GLOBAL_SYNC_UPDATED_EVENT, onSync);
    return () => window.removeEventListener(GLOBAL_SYNC_UPDATED_EVENT, onSync);
  }, []);
  void syncTick;

  const allDesigns = getAllHeroDesigns();
  const filteredDesigns = allDesigns.filter(
    (d) => activeCategory === 'all' || d.category === activeCategory
  );

  const handleConfirm = () => {
    saveHeroConfig(cfg);
    if (onSelectConfig) onSelectConfig(cfg);
    onClose();
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
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
            <div
              className="w-9 h-9 rounded-2xl flex items-center justify-center border shrink-0"
              style={{ background: 'rgba(251, 191, 36, 0.14)', borderColor: 'rgba(251, 191, 36, 0.38)' }}
            >
              <Sparkles size={17} color="#FBBF24" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                تصویر بالای صفحه خانه
              </h3>
              <p className="text-[11px] text-emerald-100/65 mt-0.5">
                ۴۰ منظره مستند آفلاین از حرم‌ها، آیین‌های ایرانی، طبیعت و کیهان
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

        {/* ۳ کارت حالت انتخاب */}
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
              <span className="text-[11px] font-black text-white">خودکار مناسبت</span>
              <Sparkles size={12} color="#34D399" />
            </div>
            <p className="text-[10px] opacity-70 leading-snug">مناسبت‌های شمسی، قمری و اوقات نماز</p>
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

        {/* تب‌های دسته‌بندی (ایزوله در برابر سوایپ تعویض تب) */}
        <div
          data-no-swipe="true"
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-2.5 pt-0.5 shrink-0 touch-pan-x"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {HERO_RELIGIOUS_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-black whitespace-nowrap border flex items-center gap-1.5 transition-all"
                style={{
                  background: isActive ? '#FBBF24' : 'rgba(255,255,255,0.05)',
                  borderColor: isActive ? '#FBBF24' : 'rgba(255,255,255,0.12)',
                  color: isActive ? '#041511' : '#ECFDF5',
                }}
              >
                <span>{cat.labelFa}</span>
              </button>
            );
          })}
        </div>

        {/* شبکه کارت‌های پیش‌نمایش ۴۰ تصویر یکتای آفلاین */}
        <div className="grid grid-cols-2 auto-rows-max gap-2.5 overflow-y-auto py-2 pr-0.5 flex-1">
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
                <div className="w-full h-24 relative overflow-hidden">
                  <RenderHeroArtworkScene design={d} />
                  {d.isRemoteOta && (
                    <span
                      className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-black shadow"
                      style={{ background: 'rgba(16, 185, 129, 0.92)', color: '#041511' }}
                    >
                      جدید
                    </span>
                  )}
                  {isSelected && (
                    <div
                      className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center shadow-lg"
                      style={{ background: '#FBBF24', color: '#041511' }}
                    >
                      <Check size={14} strokeWidth={3} />
                    </div>
                  )}
                </div>

                <div className="p-2.5 space-y-1 flex-1 flex flex-col justify-between h-[156px] min-h-[156px] shrink-0">
                  <div>
                    <div className="text-[11px] font-black text-white leading-snug line-clamp-1">
                      {d.titleFa}
                    </div>
                    <div className="text-[9px] text-amber-300/90 truncate mt-0.5">
                      {d.dhikrFa}
                    </div>
                  </div>
                  <div
                    className="text-[9px] px-1.5 py-1 rounded-lg mt-1 leading-relaxed line-clamp-3"
                    style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(209, 250, 229, 0.78)' }}
                  >
                    {d.usageGuideFa}
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
            ✓ اعمال تصویر انتخابی
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}