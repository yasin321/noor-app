import { useState, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Check, X, Palette } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export type HeroSelectionMode = 'manual' | 'smart_occasion' | 'city_match';

export interface HeroArtDesign {
  id: string;
  titleFa: string;
  crownTextFa: string;
  category: 'showcase12' | 'cities' | 'sacred' | 'nature';
  cityKeywords?: string[];
  imageUrl: string;
  fallbackGradient: string;
  accentColor: string;
}

// پکیج ۳۰ عکس واقعی، سینمایی و باکیفیت معماری اسلامی، شهرهای ایران و مناسبت‌ها
export const HERO_30_DESIGNS: HeroArtDesign[] = [
  // === ۱۲ طرح اصلی ویترین (مطابق آلبوم ارسالی شما) ===
  {
    id: 'classic_mosque',
    titleFa: '۱. طرح کلاسیک (مسجد فیروزه‌ای در شب)',
    crownTextFa: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَ آلِ مُحَمَّدٍ',
    category: 'showcase12',
    imageUrl: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=1000&q=85',
    fallbackGradient: 'linear-gradient(180deg, #061A2E 0%, #0F3456 52%, #071A16 100%)',
    accentColor: '#38BDF8',
  },
  {
    id: 'ramadan_mubarak',
    titleFa: '۲. طرح ماه رمضان (فانوس‌های نورانی و هلال)',
    crownTextFa: 'رمضان مبارک · شَهْرُ رَمَضَانَ الَّذِي أُنزِلَ فِيهِ الْقُرْآنُ',
    category: 'showcase12',
    imageUrl: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=1000&q=85',
    fallbackGradient: 'linear-gradient(180deg, #07132B 0%, #173469 52%, #071A16 100%)',
    accentColor: '#FBBF24',
  },
  {
    id: 'yalda_night',
    titleFa: '۳. طرح شب یلدا (انار سرخ و شمع روشن)',
    crownTextFa: 'شب یلدا مبارک · اللَّهُمَّ بَارِكْ لِمَوْلَانَا صَاحِبِ الزَّمَانِ (عج)',
    category: 'showcase12',
    imageUrl: 'https://images.unsplash.com/photo-1541344999736-83eca272f6fc?auto=format&fit=crop&w=1000&q=85',
    fallbackGradient: 'linear-gradient(180deg, #28080D 0%, #5C161E 52%, #071A16 100%)',
    accentColor: '#FB7185',
  },
  {
    id: 'muharram_haram',
    titleFa: '۴. طرح محرم (گنبد طلایی و بیرق حسینی)',
    crownTextFa: 'محرم الحرام · السَّلَامُ عَلَيْكَ يَا أَبَا عَبْدِ اللَّهِ الْحُسَيْنِ (ع)',
    category: 'showcase12',
    imageUrl: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=1000&q=85',
    fallbackGradient: 'linear-gradient(180deg, #140507 0%, #3B0D12 52%, #071A16 100%)',
    accentColor: '#EF4444',
  },
  {
    id: 'nowruz_spring',
    titleFa: '۵. طرح نوروز (شکوفه‌های بهاری و معماری ایرانی)',
    crownTextFa: 'بهار مبارک · يَا مُقَلِّبَ الْقُلُوبِ وَ الْأَبْصَارِ',
    category: 'showcase12',
    imageUrl: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=1000&q=85',
    fallbackGradient: 'linear-gradient(180deg, #163E56 0%, #3E6B89 50%, #071A16 100%)',
    accentColor: '#F472B6',
  },
  {
    id: 'iran_persepolis',
    titleFa: '۶. طرح بناهای تاریخی (تخت جمشید در غروب طلایی)',
    crownTextFa: 'ایران زیبا · اللَّهُمَّ بَارِكْ لِمَوْلَانَا صَاحِبِ الزَّمَانِ (عج)',
    category: 'showcase12',
    cityKeywords: ['شیراز', 'فارس', 'مرودشت'],
    imageUrl: 'https://images.unsplash.com/photo-1577948000111-9c970dfe3743?auto=format&fit=crop&w=1000&q=85',
    fallbackGradient: 'linear-gradient(180deg, #3D2314 0%, #854D27 52%, #071A16 100%)',
    accentColor: '#FBBF24',
  },
  {
    id: 'mashhad_shrine',
    titleFa: '۷. طرح حرم مطهر (مشهد مقدس · گنبد طلایی)',
    crownTextFa: 'مشهد مقدس · اللَّهُمَّ صَلِّ عَلَى عَلِيِّ بْنِ مُوسَى الرِّضَا (ع)',
    category: 'showcase12',
    cityKeywords: ['مشهد', 'خراسان', 'نیشابور', 'سبزوار'],
    imageUrl: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=1000&q=85',
    fallbackGradient: 'linear-gradient(180deg, #071E36 0%, #143C5E 52%, #071A16 100%)',
    accentColor: '#FBBF24',
  },
  {
    id: 'iran_desert_yazd',
    titleFa: '۸. طرح طبیعت و کویر ایران (بادگیر و کویر یزد)',
    crownTextFa: 'کویر ایران · اللَّهُمَّ بَارِكْ لِمَوْلَانَا صَاحِبِ الزَّمَانِ (عج)',
    category: 'showcase12',
    cityKeywords: ['یزد', 'کرمان', 'زاهدان', 'سمنان', 'کاشان'],
    imageUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1000&q=85',
    fallbackGradient: 'linear-gradient(180deg, #1E4273 0%, #7C6A53 55%, #071A16 100%)',
    accentColor: '#FDE047',
  },
  {
    id: 'winter_snow',
    titleFa: '۹. طرح زمستان دلنشین (مسجد و کاج‌های برفی)',
    crownTextFa: 'زمستان دلنشین · اللَّهُمَّ بَارِكْ لِمَوْلَانَا صَاحِبِ الزَّمَانِ (عج)',
    category: 'showcase12',
    cityKeywords: ['تبریز', 'اردبیل', 'ارومیه', 'همدان', 'زنجان', 'شهرکرد', 'سنندج'],
    imageUrl: 'https://images.unsplash.com/photo-1517299321609-52687d1bc55a?auto=format&fit=crop&w=1000&q=85',
    fallbackGradient: 'linear-gradient(180deg, #172B47 0%, #33557D 52%, #071A16 100%)',
    accentColor: '#7DD3FC',
  },
  {
    id: 'qadr_nights',
    titleFa: '۱۰. طرح شب‌های قدر (هلال ماه و آسمان پرستاره)',
    crownTextFa: 'شب‌های قدر · سَلَامٌ هِيَ حَتَّىٰ مَطْلَعِ الْفَجْرِ',
    category: 'showcase12',
    imageUrl: 'https://images.unsplash.com/photo-1507400492013-162706c8c05e?auto=format&fit=crop&w=1000&q=85',
    fallbackGradient: 'linear-gradient(180deg, #090D24 0%, #1D2554 52%, #071A16 100%)',
    accentColor: '#FDE047',
  },
  {
    id: 'modern_iran_azadi',
    titleFa: '۱۱. طرح ایران مدرن (برج آزادی تهران در شب)',
    crownTextFa: 'ایران مدرن · اللَّهُمَّ بَارِكْ لِمَوْلَانَا صَاحِبِ الزَّمَانِ (عج)',
    category: 'showcase12',
    cityKeywords: ['تهران', 'کرج', 'البرز'],
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Azadi_Tower_at_night.jpg/1024px-Azadi_Tower_at_night.jpg',
    fallbackGradient: 'linear-gradient(180deg, #273459 0%, #7C5869 52%, #071A16 100%)',
    accentColor: '#FBBF24',
  },
  {
    id: 'custom_minimal_hills',
    titleFa: '۱۲. طرح دلخواه (تپه‌های آرام مهتابی)',
    crownTextFa: 'طرح دلخواه · اللَّهُمَّ بَارِكْ لِمَوْلَانَا صَاحِبِ الزَّمَانِ (عج)',
    category: 'showcase12',
    imageUrl: 'https://images.unsplash.com/photo-1532767153582-b1a0e5145009?auto=format&fit=crop&w=1000&q=85',
    fallbackGradient: 'linear-gradient(180deg, #041B29 0%, #0B3C49 52%, #071A16 100%)',
    accentColor: '#34D399',
  },

  // === ۱۸ طرح تکمیلی (شهرهای ایران، اماکن مقدس و طبیعت) ===
  {
    id: 'isfahan_naqsh',
    titleFa: '۱۳. میدان نقش جهان و مسجد شیخ لطف‌الله — اصفهان',
    crownTextFa: 'نصف جهان اصفهان · اللَّهُمَّ بَارِكْ لِمَوْلَانَا صَاحِبِ الزَّمَانِ (عج)',
    category: 'cities',
    cityKeywords: ['اصفهان'],
    imageUrl: 'https://images.unsplash.com/photo-1565008576549-57569a49371d?auto=format&fit=crop&w=1000&q=85',
    fallbackGradient: 'linear-gradient(180deg, #082947 0%, #145B82 52%, #071A16 100%)',
    accentColor: '#38BDF8',
  },
  {
    id: 'qom_haram',
    titleFa: '۱۴. حرم حضرت معصومه (س) — قم المقدسه',
    crownTextFa: 'قم المقدسه · يَا فَاطِمَةُ اشْفَعِي لِي فِي الْجَنَّةِ',
    category: 'cities',
    cityKeywords: ['قم'],
    imageUrl: 'https://images.unsplash.com/photo-1590076215667-875d4ef2d7de?auto=format&fit=crop&w=1000&q=85',
    fallbackGradient: 'linear-gradient(180deg, #0A2239 0%, #17496E 52%, #071A16 100%)',
    accentColor: '#FBBF24',
  },
  {
    id: 'shiraz_nasir',
    titleFa: '۱۵. مسجد نصیرالملک و شیشه‌های رنگی — شیراز',
    crownTextFa: 'شیراز جنت‌طراز · اللَّهُمَّ بَارِكْ لِمَوْلَانَا صَاحِبِ الزَّمَانِ (عج)',
    category: 'cities',
    cityKeywords: ['شیراز'],
    imageUrl: 'https://images.unsplash.com/photo-1578895101408-1a36b834405b?auto=format&fit=crop&w=1000&q=85',
    fallbackGradient: 'linear-gradient(180deg, #123547 0%, #266478 52%, #071A16 100%)',
    accentColor: '#34D399',
  },
  {
    id: 'yazd_dolatabad',
    titleFa: '۱۶. باغ دولت‌آباد و بادگیر تاریخی در شب — یزد',
    crownTextFa: 'دارالعباده یزد · اللَّهُمَّ بَارِكْ لِمَوْلَانَا صَاحِبِ الزَّمَانِ (عج)',
    category: 'cities',
    cityKeywords: ['یزد'],
    imageUrl: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1000&q=85',
    fallbackGradient: 'linear-gradient(180deg, #0A192F 0%, #1E3A5F 52%, #071A16 100%)',
    accentColor: '#FBBF24',
  },
  {
    id: 'ahvaz_karun',
    titleFa: '۱۷. غروب نخلستان و ساحل کارون — اهواز و خوزستان',
    crownTextFa: 'خوزستان سرافراز · اللَّهُمَّ بَارِكْ لِمَوْلَانَا صَاحِبِ الزَّمَانِ (عج)',
    category: 'cities',
    cityKeywords: ['اهواز', 'آبادان', 'دزفول', 'خوزستان', 'بوشهر', 'بندرعباس'],
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=85',
    fallbackGradient: 'linear-gradient(180deg, #381811 0%, #7C3618 52%, #071A16 100%)',
    accentColor: '#F59E0B',
  },
  {
    id: 'makkah_kaaba_night',
    titleFa: '۱۸. کعبه معظمه و مسجدالحرام — مکه مکرمه',
    crownTextFa: 'مکه مکرمه · لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ',
    category: 'sacred',
    cityKeywords: ['مکه'],
    imageUrl: 'https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?auto=format&fit=crop&w=1000&q=85',
    fallbackGradient: 'linear-gradient(180deg, #070E1A 0%, #142847 52%, #071A16 100%)',
    accentColor: '#FBBF24',
  },
  {
    id: 'madinah_nabawi',
    titleFa: '۱۹. مسجدالنبی (ص) و گنبد خضراء — مدینه منوره',
    crownTextFa: 'مدینه منوره · السَّلَامُ عَلَيْكَ يَا رَسُولَ اللَّهِ (ص)',
    category: 'sacred',
    cityKeywords: ['مدینه'],
    imageUrl: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=1000&q=85',
    fallbackGradient: 'linear-gradient(180deg, #06261B 0%, #0E543C 52%, #071A16 100%)',
    accentColor: '#34D399',
  },
  {
    id: 'karbala_imam_hussain',
    titleFa: '۲۰. بین‌الحرمین شریفین — کربلای معلی',
    crownTextFa: 'کربلای معلی · صَلَّى اللَّهُ عَلَيْكَ يَا أَبَا عَبْدِ اللَّهِ',
    category: 'sacred',
    cityKeywords: ['کربلا'],
    imageUrl: 'https://images.unsplash.com/photo-1548625361-165fe576b420?auto=format&fit=crop&w=1000&q=85',
    fallbackGradient: 'linear-gradient(180deg, #1E070B 0%, #4A1219 52%, #071A16 100%)',
    accentColor: '#FBBF24',
  },
  {
    id: 'najaf_imam_ali',
    titleFa: '۲۱. ایوان طلای امیرالمؤمنین (ع) — نجف اشرف',
    crownTextFa: 'نجف اشرف · السَّلَامُ عَلَيْكَ يَا أَمِيرَ الْمُؤْمِنِينَ (ع)',
    category: 'sacred',
    cityKeywords: ['نجف'],
    imageUrl: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=1000&q=85',
    fallbackGradient: 'linear-gradient(180deg, #211507 0%, #573B12 52%, #071A16 100%)',
    accentColor: '#FDE047',
  },
  {
    id: 'jamkaran_mahdi',
    titleFa: '۲۲. مسجد مقدس جمکران — میعادگاه منتظران',
    crownTextFa: 'اللَّهُمَّ عَجِّلْ لِوَلِيِّكَ الْفَرَجَ',
    category: 'sacred',
    imageUrl: 'https://images.unsplash.com/photo-1512632578888-169bbbc64f33?auto=format&fit=crop&w=1000&q=85',
    fallbackGradient: 'linear-gradient(180deg, #072138 0%, #0E4D6E 52%, #071A16 100%)',
    accentColor: '#38BDF8',
  },
  {
    id: 'persian_miniature_gold',
    titleFa: '۲۳. نگارگری و مینیاتور زرین ایرانی (باغ بهشت)',
    crownTextFa: 'هنر اصیل ایرانی · اللَّهُمَّ بَارِكْ لِمَوْلَانَا صَاحِبِ الزَّمَانِ (عج)',
    category: 'showcase12',
    imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1000&q=85',
    fallbackGradient: 'linear-gradient(180deg, #1E3A8A 0%, #92400E 52%, #071A16 100%)',
    accentColor: '#FDE047',
  },
  {
    id: 'fatimiyya_candle',
    titleFa: '۲۴. ایام فاطمیه (شمع و شبستان نورانی)',
    crownTextFa: 'ایام فاطمیه · السَّلَامُ عَلَيْكِ يَا فَاطِمَةَ الزَّهْرَاءِ (س)',
    category: 'sacred',
    imageUrl: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1000&q=85',
    fallbackGradient: 'linear-gradient(180deg, #0D1322 0%, #1E2942 52%, #071A16 100%)',
    accentColor: '#93C5FD',
  },
  {
    id: 'ghadir_eid',
    titleFa: '۲۵. عید سعید غدیر خم (جشن ولایت)',
    crownTextFa: 'عیدالله الاکبر غدیر · الْحَمْدُ لِلَّهِ الَّذِي جَعَلَنَا مِنَ الْمُتَمَسِّكِينَ بِوِلَايَةِ عَلِيٍّ',
    category: 'sacred',
    imageUrl: 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&w=1000&q=85',
    fallbackGradient: 'linear-gradient(180deg, #06291E 0%, #106346 52%, #071A16 100%)',
    accentColor: '#FDE047',
  },
  {
    id: 'shaban_mahdi_birth',
    titleFa: '۲۶. نیمه شعبان (چراغانی میلاد حضرت ولی‌عصر عج)',
    crownTextFa: 'نیمه شعبان مبارک · اللَّهُمَّ بَارِكْ لِمَوْلَانَا صَاحِبِ الزَّمَانِ (عج)',
    category: 'sacred',
    imageUrl: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=1000&q=85',
    fallbackGradient: 'linear-gradient(180deg, #0B2545 0%, #19535F 52%, #071A16 100%)',
    accentColor: '#FBBF24',
  },
  {
    id: 'damavand_alborz',
    titleFa: '۲۷. قله دماوند و البرز سرافراز — شمال ایران',
    crownTextFa: 'طبیعت ایران · اللَّهُمَّ بَارِكْ لِمَوْلَانَا صَاحِبِ الزَّمَانِ (عج)',
    category: 'nature',
    cityKeywords: ['ساری', 'رشت', 'گرگان', 'مازندران', 'گیلان'],
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=85',
    fallbackGradient: 'linear-gradient(180deg, #133B5C 0%, #1E5F74 52%, #071A16 100%)',
    accentColor: '#34D399',
  },
  {
    id: 'caspian_forest',
    titleFa: '۲۸. جنگل‌های هیرکانی و مه صبحگاهی — گیلان و مازندران',
    crownTextFa: 'سبحان الله · اللَّهُمَّ بَارِكْ لِمَوْلَانَا صَاحِبِ الزَّمَانِ (عج)',
    category: 'nature',
    imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1000&q=85',
    fallbackGradient: 'linear-gradient(180deg, #062B22 0%, #0F5241 52%, #071A16 100%)',
    accentColor: '#34D399',
  },
  {
    id: 'tabriz_kabud',
    titleFa: '۲۹. مسجد کبود و ایل‌گلی — تبریز',
    crownTextFa: 'تبریز باصلابت · اللَّهُمَّ بَارِكْ لِمَوْلَانَا صَاحِبِ الزَّمَانِ (عج)',
    category: 'cities',
    cityKeywords: ['تبریز'],
    imageUrl: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=1000&q=85',
    fallbackGradient: 'linear-gradient(180deg, #0F2547 0%, #1E497A 52%, #071A16 100%)',
    accentColor: '#38BDF8',
  },
  {
    id: 'persian_gulf_sunset',
    titleFa: '۳۰. غروب طلایی خلیج فارس — جنوب ایران',
    crownTextFa: 'خلیج همیشگی فارس · اللَّهُمَّ بَارِكْ لِمَوْلَانَا صَاحِبِ الزَّمَانِ (عج)',
    category: 'nature',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=85',
    fallbackGradient: 'linear-gradient(180deg, #2D142C 0%, #801336 48%, #071A16 100%)',
    accentColor: '#FB923C',
  },
];

const HERO_MODE_KEY = 'noor_hero_selection_mode_v1';
const HERO_DESIGN_ID_KEY = 'noor_hero_selected_design_id_v1';

export function getHeroSelectionMode(): HeroSelectionMode {
  try {
    const m = localStorage.getItem(HERO_MODE_KEY) as HeroSelectionMode;
    if (m === 'manual' || m === 'smart_occasion' || m === 'city_match') return m;
  } catch {}
  return 'manual';
}

export function setHeroSelectionMode(mode: HeroSelectionMode): void {
  try {
    localStorage.setItem(HERO_MODE_KEY, mode);
    window.dispatchEvent(new Event('noor-hero-changed'));
  } catch {}
}

export function getSelectedHeroDesignId(): string {
  try {
    return localStorage.getItem(HERO_DESIGN_ID_KEY) || 'mashhad_shrine';
  } catch {
    return 'mashhad_shrine';
  }
}

export function setSelectedHeroDesignId(id: string): void {
  try {
    localStorage.setItem(HERO_DESIGN_ID_KEY, id);
    window.dispatchEvent(new Event('noor-hero-changed'));
  } catch {}
}

export function resolveActiveHeroDesign(cityName: string, themeId: string): HeroArtDesign {
  const mode = getHeroSelectionMode();

  if (mode === 'city_match') {
    const byCity = HERO_30_DESIGNS.find(
      (d) => d.cityKeywords && d.cityKeywords.some((kw) => cityName.includes(kw))
    );
    if (byCity) return byCity;
  }

  if (mode === 'smart_occasion') {
    if (themeId === 'ramadan_night') return HERO_30_DESIGNS[1];
    if (themeId === 'yalda_fest') return HERO_30_DESIGNS[2];
    if (themeId === 'muharram_ashura') return HERO_30_DESIGNS[3];
    if (themeId === 'nowruz_spring' || themeId === 'blossom_serenity') return HERO_30_DESIGNS[4];
    if (themeId === 'fatimiyya_grief') return HERO_30_DESIGNS[9];
  }

  const manualId = getSelectedHeroDesignId();
  return HERO_30_DESIGNS.find((d) => d.id === manualId) || HERO_30_DESIGNS[6];
}

// نمایش عکس واقعی سینمایی در بالای صفحه با محو شدن نرم لبه پایینی در پس‌زمینه برنامه
export function RenderHeroArtworkScene({ design }: { design: HeroArtDesign }) {
  const { theme } = useTheme();
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: design.fallbackGradient }}>
      <img
        src={design.imageUrl}
        alt={design.titleFa}
        loading="eager"
        className="w-full h-full object-cover object-center transition-transform duration-700"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = 'none';
        }}
      />
      {/* لایه سایه ملایم بالا و پایین برای خوانایی ۱۰۰٪ دکمه‌های روی عکس */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(180deg, rgba(4, 15, 12, 0.55) 0%, rgba(4, 15, 12, 0.12) 45%, ${theme.bg} 100%)`,
        }}
      />
    </div>
  );
}

export function Hero30SelectorModal({
  cityName,
  onClose,
}: {
  cityName: string;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const [mode, setModeState] = useState<HeroSelectionMode>(() => getHeroSelectionMode());
  const [selectedId, setSelectedIdState] = useState<string>(() => getSelectedHeroDesignId());
  const [filterCat, setFilterCat] = useState<'all' | 'showcase12' | 'cities' | 'sacred' | 'nature'>('all');

  const handleModeChange = (m: HeroSelectionMode) => {
    setModeState(m);
    setHeroSelectionMode(m);
  };

  const handleSelectDesign = (id: string) => {
    setSelectedIdState(id);
    setSelectedHeroDesignId(id);
    setModeState('manual');
    setHeroSelectionMode('manual');
  };

  const filtered = HERO_30_DESIGNS.filter((d) => filterCat === 'all' || d.category === filterCat);

  const modal = (
    <div
      className="fixed inset-0 z-[999] flex items-stretch sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(3, 10, 8, 0.94)', backdropFilter: 'blur(12px)' }}
      dir="rtl"
    >
      <div
        className="w-full sm:max-w-xl h-[100dvh] sm:h-[90vh] sm:rounded-3xl p-4 sm:p-5 border-0 sm:border flex flex-col"
        style={{ background: theme.surface, borderColor: theme.border }}
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b shrink-0" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-2">
            <Palette size={20} color="#FBBF24" />
            <div>
              <h2 className="text-sm sm:text-base font-black text-white">آلبوم ۳۰ تصویر واقعی بالای صفحه (Hero)</h2>
              <p className="text-[11px] text-emerald-200/80">هر تصویر را لمس کنید تا در بالای صفحه خانه قرار گیرد</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl bg-white/10 text-white">
            <X size={18} />
          </button>
        </div>

        {/* ۳ حالت تغییر تصویر */}
        <div className="grid grid-cols-3 gap-2 mb-3 shrink-0">
          <button
            type="button"
            onClick={() => handleModeChange('manual')}
            className="p-2.5 rounded-2xl border text-right transition-all"
            style={{
              background: mode === 'manual' ? 'rgba(251, 191, 36, 0.18)' : 'rgba(255,255,255,0.04)',
              borderColor: mode === 'manual' ? '#FBBF24' : theme.border,
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-black text-white">انتخاب دستی</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-400/25 text-amber-200 font-black">پیشنهادی</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-snug">انتخاب مستقیم عکس دلخواه شما</p>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('smart_occasion')}
            className="p-2.5 rounded-2xl border text-right transition-all"
            style={{
              background: mode === 'smart_occasion' ? 'rgba(52, 211, 153, 0.18)' : 'rgba(255,255,255,0.04)',
              borderColor: mode === 'smart_occasion' ? '#34D399' : theme.border,
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-black text-white">خودکار مناسبتی</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-400/25 text-emerald-200 font-black">هوشمند</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-snug">تغییر خودکار در رمضان، محرم، یلدا و نوروز</p>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('city_match')}
            className="p-2.5 rounded-2xl border text-right transition-all"
            style={{
              background: mode === 'city_match' ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255,255,255,0.04)',
              borderColor: mode === 'city_match' ? '#38BDF8' : theme.border,
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-black text-white">متناسب با شهر</span>
              <MapPin size={12} color="#38BDF8" />
            </div>
            <p className="text-[10px] text-slate-300 leading-snug">نمایش معماری شاخص {cityName}</p>
          </button>
        </div>

        {/* تب‌های دسته‌بندی */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 shrink-0">
          {[
            { id: 'all', label: 'همه ۳۰ عکس' },
            { id: 'showcase12', label: '🌟 ۱۲ طرح اصلی آلبوم' },
            { id: 'cities', label: '🏛️ شهرهای ایران' },
            { id: 'sacred', label: '🕌 حرم‌ها و مناسبت‌ها' },
            { id: 'nature', label: '🏔️ طبیعت ایران' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFilterCat(cat.id as any)}
              className="px-3 py-1.5 rounded-full text-[11px] font-black shrink-0 border"
              style={{
                background: filterCat === cat.id ? '#FBBF24' : 'rgba(255,255,255,0.05)',
                color: filterCat === cat.id ? '#071A16' : '#E2E8F0',
                borderColor: filterCat === cat.id ? '#FBBF24' : 'rgba(255,255,255,0.12)',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* لیست کارت‌های عکس‌دار با ارتفاع ثابت min-h-[148px] تا عکس‌ها بزرگ و واضح دیده شوند */}
        <div className="grid grid-cols-2 gap-3 overflow-y-auto pr-1 flex-1 pb-4">
          {filtered.map((item) => {
            const isSelected = selectedId === item.id && mode === 'manual';
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectDesign(item.id)}
                className="min-h-[152px] rounded-2xl overflow-hidden border-2 text-right transition-transform active:scale-95 flex flex-col justify-between relative shrink-0"
                style={{
                  borderColor: isSelected ? '#FBBF24' : 'rgba(255,255,255,0.15)',
                  background: '#061A14',
                  boxShadow: isSelected ? '0 0 20px rgba(251, 191, 36, 0.45)' : '0 4px 12px rgba(0,0,0,0.35)',
                }}
              >
                <div className="w-full h-24 relative overflow-hidden shrink-0" style={{ background: item.fallbackGradient }}>
                  <img
                    src={item.imageUrl}
                    alt={item.titleFa}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  {isSelected && (
                    <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg">
                      <Check size={14} strokeWidth={3} />
                    </span>
                  )}
                </div>
                <div className="p-2.5 bg-black/50 w-full">
                  <p className="text-[11px] font-black text-white leading-snug line-clamp-1">{item.titleFa}</p>
                  <p className="text-[9px] text-amber-300/90 truncate mt-0.5">{item.crownTextFa}</p>
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-2 py-3.5 rounded-2xl text-xs font-black shrink-0 shadow-lg"
          style={{ background: 'linear-gradient(135deg, #FBBF24, #D97706)', color: '#071A16' }}
        >
          تأیید و نمایش در بالای صفحه خانه ✓
        </button>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : modal;
}
