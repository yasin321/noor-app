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

export const HERO_RELIGIOUS_CATEGORIES: { id: HeroCategoryKey; labelFa: string; icon: string }[] = [
  { id: 'all', labelFa: 'همه (۲۵)', icon: '✨' },
  { id: 'shrines', labelFa: 'حرم‌های مطهر', icon: '🕋' },
  { id: 'prayer_times', labelFa: 'اوقات نماز', icon: '🕌' },
  { id: 'occ_ramadan_mahdi', labelFa: 'رمضان و اعیاد', icon: '🌙' },
  { id: 'muharram_safar', labelFa: 'محرم و صفر', icon: '🏴' },
  { id: 'islamic_arch', labelFa: 'مساجد و شهرها', icon: '🏛️' },
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

  // === ۳. رمضان، جمعه مهدوی و اعیاد اسلامی (occ_ramadan_mahdi) ===
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
    usageGuideFa: 'مناسب برای نمازهای صبحگاهی و علاقه‌مندان به معماری رنگین‌کمانی شیراز',
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
];

// نقشه دقیق و ۱۰۰٪ یکتای تصاویر آفلاین (۲۵ عنوان = ۲۵ فایل مجزا بدون هیچ تکرار)
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
};

export function getOfflineIranSafeImage(designId: string | number): string {
  const key = String(designId).trim();
  if (OFFLINE_SHRINE_IMAGE_MAP[key]) {
    return OFFLINE_SHRINE_IMAGE_MAP[key];
  }
  return '/shrines/mashhad.jpg';
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
  return { mode: 'manual', selectedId: 'shrine_mashhad_reza' };
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
  if (cat === 'nature') return 'prayer_times';
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

  // auto_occasion: تطبیق هوشمند با مناسبت‌های تقویم هجری قمری + شب جمعه + جمعه مهدوی + وقت نماز
  const now = new Date();
  const hijri = getHijriMonthDaySafe(now);
  if (hijri) {
    if (hijri.month === 1 && hijri.day === 10) {
      return HERO_30_DESIGNS.find((d) => d.id === 'muharram_ashura_candles') || HERO_30_DESIGNS[0];
    }
    if (hijri.month === 1 && hijri.day >= 1 && hijri.day <= 13) {
      return HERO_30_DESIGNS.find((d) => d.id === 'muharram_golden_dome_flag') || HERO_30_DESIGNS[0];
    }
    if (hijri.month === 2 && hijri.day >= 15 && hijri.day <= 22) {
      return HERO_30_DESIGNS.find((d) => d.id === 'safar_arbaeen_walk') || HERO_30_DESIGNS[0];
    }
    if (hijri.month === 9 && (hijri.day === 19 || hijri.day === 21 || hijri.day === 23)) {
      return HERO_30_DESIGNS.find((d) => d.id === 'occ_laylat_al_qadr') || HERO_30_DESIGNS[0];
    }
    if (hijri.month === 9) {
      return HERO_30_DESIGNS.find((d) => d.id === 'occ_ramadan_lanterns') || HERO_30_DESIGNS[0];
    }
    if ((hijri.month === 12 && hijri.day === 18) || (hijri.month === 10 && hijri.day <= 2) || (hijri.month === 8 && hijri.day === 15)) {
      return HERO_30_DESIGNS.find((d) => d.id === 'occ_eid_ghadir_shaban') || HERO_30_DESIGNS[0];
    }
    if (hijri.month === 12 && hijri.day >= 8 && hijri.day <= 12) {
      return HERO_30_DESIGNS.find((d) => d.id === 'shrine_makkah_kaaba') || HERO_30_DESIGNS[0];
    }
  }

  if (now.getDay() === 4 && now.getHours() >= 18) {
    return HERO_30_DESIGNS.find((d) => d.id === 'shrine_karbala_hussein') || HERO_30_DESIGNS[0];
  }
  if (now.getDay() === 5) {
    return HERO_30_DESIGNS.find((d) => d.id === 'occ_friday_mahdi') || HERO_30_DESIGNS[0];
  }
  if (now.getHours() < 4) {
    return HERO_30_DESIGNS.find((d) => d.id === 'prayer_tahajjud_sahar') || HERO_30_DESIGNS[0];
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
            <span className="text-xl">🎨</span>
            <div>
              <h3 className="text-sm font-black text-white">
                تصویر بالای صفحه خانه
              </h3>
              <p className="text-[11px] text-emerald-100/65 mt-0.5">
                ۲۵ منظره واقعی و آفلاین از حرم‌ها، مساجد و شهرهای ایران
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
            <p className="text-[10px] opacity-70 leading-snug">تغییر با تقویم هجری و اوقات نماز</p>
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
                <span>{cat.icon}</span>
                <span>{cat.labelFa}</span>
              </button>
            );
          })}
        </div>

        {/* شبکه کارت‌های پیش‌نمایش ۲۵ تصویر یکتای آفلاین */}
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
                      ✨ جدید
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