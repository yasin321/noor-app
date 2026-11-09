import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, MapPin, Calendar, Check, X, Palette } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export type HeroSelectionMode = 'manual' | 'smart_occasion' | 'city_match';

export interface HeroArtDesign {
  id: string;
  titleFa: string;
  crownTextFa: string;
  category: 'showcase12' | 'cities' | 'sacred' | 'nature';
  cityKeywords?: string[];
  skyGradient: string;
  accentColor: string;
  sceneType:
    | 'classic_blue_mosque'
    | 'ramadan_lanterns'
    | 'yalda_pomegranate'
    | 'muharram_shrine'
    | 'nowruz_blossoms'
    | 'persepolis_history'
    | 'mashhad_haram'
    | 'yazd_desert'
    | 'winter_snow'
    | 'qadr_crescent'
    | 'modern_azadi'
    | 'custom_minimal_hills'
    | 'isfahan_naqsh'
    | 'shiraz_hafez'
    | 'qom_masoumeh'
    | 'karbala_dome'
    | 'makkah_kaaba'
    | 'damavand_peak';
}

export const HERO_30_DESIGNS: HeroArtDesign[] = [
  // === ۱۲ طرح اصلی تصویر مرجع شما (Islamic Prayer App Theme Showcase.png) ===
  {
    id: 'classic_mosque',
    titleFa: '۱. طرح کلاسیک (مسجد فیروزه‌ای شب)',
    crownTextFa: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَ آلِ مُحَمَّدٍ',
    category: 'showcase12',
    skyGradient: 'linear-gradient(180deg, #061A2E 0%, #0F3456 52%, #071A16 100%)',
    accentColor: '#38BDF8',
    sceneType: 'classic_blue_mosque',
  },
  {
    id: 'ramadan_mubarak',
    titleFa: '۲. طرح ماه رمضان (فانوس و هلال)',
    crownTextFa: 'رمضان مبارک · شَهْرُ رَمَضَانَ الَّذِي أُنزِلَ فِيهِ الْقُرْآنُ',
    category: 'showcase12',
    skyGradient: 'linear-gradient(180deg, #07132B 0%, #173469 52%, #071A16 100%)',
    accentColor: '#FBBF24',
    sceneType: 'ramadan_lanterns',
  },
  {
    id: 'yalda_night',
    titleFa: '۳. طرح شب یلدا (انار و شمع و مناره)',
    crownTextFa: 'شب یلدا مبارک · اللَّهُمَّ بَارِكْ لِمَوْلَانَا صَاحِبِ الزَّمَانِ (عج)',
    category: 'showcase12',
    skyGradient: 'linear-gradient(180deg, #28080D 0%, #5C161E 52%, #071A16 100%)',
    accentColor: '#FB7185',
    sceneType: 'yalda_pomegranate',
  },
  {
    id: 'muharram_haram',
    titleFa: '۴. طرح محرم (گنبد و پرچم سرخ حسینی)',
    crownTextFa: 'محرم الحرام · السَّلَامُ عَلَيْكَ يَا أَبَا عَبْدِ اللَّهِ الْحُسَيْنِ (ع)',
    category: 'showcase12',
    skyGradient: 'linear-gradient(180deg, #140507 0%, #3B0D12 52%, #071A16 100%)',
    accentColor: '#EF4444',
    sceneType: 'muharram_shrine',
  },
  {
    id: 'nowruz_spring',
    titleFa: '۵. طرح نوروز (شکوفه‌های بهاری و گنبد فیروزه‌ای)',
    crownTextFa: 'بهار مبارک · يَا مُقَلِّبَ الْقُلُوبِ وَ الْأَبْصَارِ',
    category: 'showcase12',
    skyGradient: 'linear-gradient(180deg, #163E56 0%, #3E6B89 50%, #071A16 100%)',
    accentColor: '#F472B6',
    sceneType: 'nowruz_blossoms',
  },
  {
    id: 'iran_persepolis',
    titleFa: '۶. طرح بناهای تاریخی (ایران زیبا · تخت جمشید)',
    crownTextFa: 'ایران زیبا · اللَّهُمَّ بَارِكْ لِمَوْلَانَا صَاحِبِ الزَّمَانِ (عج)',
    category: 'showcase12',
    cityKeywords: ['شیراز', 'فارس', 'مرودشت'],
    skyGradient: 'linear-gradient(180deg, #3D2314 0%, #854D27 52%, #071A16 100%)',
    accentColor: '#FBBF24',
    sceneType: 'persepolis_history',
  },
  {
    id: 'mashhad_shrine',
    titleFa: '۷. طرح حرم مطهر (مشهد مقدس · امام رضا ع)',
    crownTextFa: 'مشهد مقدس · اللَّهُمَّ صَلِّ عَلَى عَلِيِّ بْنِ مُوسَى الرِّضَا (ع)',
    category: 'showcase12',
    cityKeywords: ['مشهد', 'خراسان', 'نیشابور', 'سبزوار'],
    skyGradient: 'linear-gradient(180deg, #071E36 0%, #143C5E 52%, #071A16 100%)',
    accentColor: '#FBBF24',
    sceneType: 'mashhad_haram',
  },
  {
    id: 'iran_desert_yazd',
    titleFa: '۸. طرح طبیعت ایران (کویر و بادگیر یزد)',
    crownTextFa: 'کویر ایران · اللَّهُمَّ بَارِكْ لِمَوْلَانَا صَاحِبِ الزَّمَانِ (عج)',
    category: 'showcase12',
    cityKeywords: ['یزد', 'کرمان', 'زاهدان', 'سمنان', 'کاشان', 'طبس'],
    skyGradient: 'linear-gradient(180deg, #1E4273 0%, #7C6A53 55%, #071A16 100%)',
    accentColor: '#FDE047',
    sceneType: 'yazd_desert',
  },
  {
    id: 'winter_snow',
    titleFa: '۹. طرح زمستان (زمستان دلنشین و مسجد برفی)',
    crownTextFa: 'زمستان دلنشین · اللَّهُمَّ بَارِكْ لِمَوْلَانَا صَاحِبِ الزَّمَانِ (عج)',
    category: 'showcase12',
    cityKeywords: ['تبریز', 'اردبیل', 'ارومیه', 'همدان', 'زنجان', 'شهرکرد', 'سنندج'],
    skyGradient: 'linear-gradient(180deg, #172B47 0%, #33557D 52%, #071A16 100%)',
    accentColor: '#7DD3FC',
    sceneType: 'winter_snow',
  },
  {
    id: 'qadr_nights',
    titleFa: '۱۰. طرح شب قدر (هلال نورانی و آسمان پرستاره)',
    crownTextFa: 'شب‌های قدر · سَلَامٌ هِيَ حَتَّىٰ مَطْلَعِ الْفَجْرِ',
    category: 'showcase12',
    skyGradient: 'linear-gradient(180deg, #090D24 0%, #1D2554 52%, #071A16 100%)',
    accentColor: '#FDE047',
    sceneType: 'qadr_crescent',
  },
  {
    id: 'modern_iran_azadi',
    titleFa: '۱۱. طرح مینیمال مدرن (ایران مدرن · برج آزادی تهران)',
    crownTextFa: 'ایران مدرن · اللَّهُمَّ بَارِكْ لِمَوْلَانَا صَاحِبِ الزَّمَانِ (عج)',
    category: 'showcase12',
    cityKeywords: ['تهران', 'کرج', 'البرز', 'ری'],
    skyGradient: 'linear-gradient(180deg, #273459 0%, #7C5869 52%, #071A16 100%)',
    accentColor: '#FBBF24',
    sceneType: 'modern_azadi',
  },
  {
    id: 'custom_minimal_hills',
    titleFa: '۱۲. طرح شخصی‌سازی (تپه‌های آرام مهتابی)',
    crownTextFa: 'طرح دلخواه · اللَّهُمَّ بَارِكْ لِمَوْلَانَا صَاحِبِ الزَّمَانِ (عج)',
    category: 'showcase12',
    skyGradient: 'linear-gradient(180deg, #041B29 0%, #0B3C49 52%, #071A16 100%)',
    accentColor: '#34D399',
    sceneType: 'custom_minimal_hills',
  },

  // === ۱۸ طرح تکمیلی پکیج ۳۰تایی (شهرهای ایران، مشاهد مشرفه و جلوه‌های اسلامی) ===
  {
    id: 'qom_haram',
    titleFa: '۱۳. حرم حضرت معصومه (س) — قم المقدسه',
    crownTextFa: 'قم المقدسه · يَا فَاطِمَةُ اشْفَعِي لِي فِي الْجَنَّةِ',
    category: 'cities',
    cityKeywords: ['قم'],
    skyGradient: 'linear-gradient(180deg, #0A2239 0%, #17496E 52%, #071A16 100%)',
    accentColor: '#FBBF24',
    sceneType: 'qom_masoumeh',
  },
  {
    id: 'isfahan_naqsh',
    titleFa: '۱۴. میدان نقش جهان و مسجد شیخ لطف‌الله — اصفهان',
    crownTextFa: 'نصف جهان اصفهان · اللَّهُمَّ بَارِكْ لِمَوْلَانَا صَاحِبِ الزَّمَانِ (عج)',
    category: 'cities',
    cityKeywords: ['اصفهان'],
    skyGradient: 'linear-gradient(180deg, #082947 0%, #145B82 52%, #071A16 100%)',
    accentColor: '#38BDF8',
    sceneType: 'isfahan_naqsh',
  },
  {
    id: 'shiraz_hafezieh',
    titleFa: '۱۵. شاهچراغ (ع) و باغ‌های بهارنارنج — شیراز',
    crownTextFa: 'شیراز جنت‌طراز · اللَّهُمَّ بَارِكْ لِمَوْلَانَا صَاحِبِ الزَّمَانِ (عج)',
    category: 'cities',
    cityKeywords: ['شیراز'],
    skyGradient: 'linear-gradient(180deg, #123547 0%, #266478 52%, #071A16 100%)',
    accentColor: '#34D399',
    sceneType: 'shiraz_hafez',
  },
  {
    id: 'ahvaz_karun',
    titleFa: '۱۶. نخلستان و غروب کارون — خوزستان و اهواز',
    crownTextFa: 'خوزستان قهرمان · اللَّهُمَّ بَارِكْ لِمَوْلَانَا صَاحِبِ الزَّمَانِ (عج)',
    category: 'cities',
    cityKeywords: ['اهواز', 'آبادان', 'دزفول', 'خرمشهر', 'خوزستان', 'بوشهر', 'بندرعباس'],
    skyGradient: 'linear-gradient(180deg, #381811 0%, #7C3618 52%, #071A16 100%)',
    accentColor: '#F59E0B',
    sceneType: 'muharram_shrine',
  },
  {
    id: 'karbala_imam_hussain',
    titleFa: '۱۷. بین‌الحرمین شریفین — کربلای معلی',
    crownTextFa: 'کربلای معلی · صَلَّى اللَّهُ عَلَيْكَ يَا أَبَا عَبْدِ اللَّهِ',
    category: 'sacred',
    cityKeywords: ['کربلا'],
    skyGradient: 'linear-gradient(180deg, #1E070B 0%, #4A1219 52%, #071A16 100%)',
    accentColor: '#FBBF24',
    sceneType: 'karbala_dome',
  },
  {
    id: 'najaf_imam_ali',
    titleFa: '۱۸. ایوان طلای امیرالمؤمنین (ع) — نجف اشرف',
    crownTextFa: 'نجف اشرف · السَّلَامُ عَلَيْكَ يَا أَمِيرَ الْمُؤْمِنِينَ (ع)',
    category: 'sacred',
    cityKeywords: ['نجف'],
    skyGradient: 'linear-gradient(180deg, #211507 0%, #573B12 52%, #071A16 100%)',
    accentColor: '#FDE047',
    sceneType: 'mashhad_haram',
  },
  {
    id: 'makkah_kaaba_night',
    titleFa: '۱۹. کعبه معظمه و مسجدالحرام — مکه مکرمه',
    crownTextFa: 'مکه مکرمه · لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ',
    category: 'sacred',
    cityKeywords: ['مکه'],
    skyGradient: 'linear-gradient(180deg, #070E1A 0%, #142847 52%, #071A16 100%)',
    accentColor: '#FBBF24',
    sceneType: 'makkah_kaaba',
  },
  {
    id: 'madinah_nabawi',
    titleFa: '۲۰. گنبد خضراء نبوی (ص) — مدینه منوره',
    crownTextFa: 'مدینه منوره · السَّلَامُ عَلَيْكَ يَا رَسُولَ اللَّهِ (ص)',
    category: 'sacred',
    cityKeywords: ['مدینه'],
    skyGradient: 'linear-gradient(180deg, #06261B 0%, #0E543C 52%, #071A16 100%)',
    accentColor: '#34D399',
    sceneType: 'classic_blue_mosque',
  },
  {
    id: 'jamkaran_mahdi',
    titleFa: '۲۱. مسجد مقدس جمکران — میعادگاه منتظران',
    crownTextFa: 'اللَّهُمَّ عَجِّلْ لِوَلِيِّكَ الْفَرَجَ',
    category: 'sacred',
    skyGradient: 'linear-gradient(180deg, #072138 0%, #0E4D6E 52%, #071A16 100%)',
    accentColor: '#38BDF8',
    sceneType: 'classic_blue_mosque',
  },
  {
    id: 'fatimiyya_candle',
    titleFa: '۲۲. ایام فاطمیه (شمع و یاس کبود)',
    crownTextFa: 'ایام فاطمیه · السَّلَامُ عَلَيْكِ يَا فَاطِمَةَ الزَّهْرَاءِ (س)',
    category: 'sacred',
    skyGradient: 'linear-gradient(180deg, #0D1322 0%, #1E2942 52%, #071A16 100%)',
    accentColor: '#93C5FD',
    sceneType: 'qadr_crescent',
  },
  {
    id: 'ghadir_eid',
    titleFa: '۲۳. عید سعید غدیر خم (ولایت امیرالمؤمنین ع)',
    crownTextFa: 'عیدالله الاکبر غدیر · الْحَمْدُ لِلَّهِ الَّذِي جَعَلَنَا مِنَ الْمُتَمَسِّكِينَ بِوِلَايَةِ عَلِيٍّ',
    category: 'sacred',
    skyGradient: 'linear-gradient(180deg, #06291E 0%, #106346 52%, #071A16 100%)',
    accentColor: '#FDE047',
    sceneType: 'mashhad_haram',
  },
  {
    id: 'shaban_mahdi_birth',
    titleFa: '۲۴. نیمه شعبان (جشن میلاد حضرت قائم عج)',
    crownTextFa: 'نیمه شعبان مبارک · اللَّهُمَّ بَارِكْ لِمَوْلَانَا صَاحِبِ الزَّمَانِ (عج)',
    category: 'sacred',
    skyGradient: 'linear-gradient(180deg, #0B2545 0%, #19535F 52%, #071A16 100%)',
    accentColor: '#FBBF24',
    sceneType: 'ramadan_lanterns',
  },
  {
    id: 'damavand_alborz',
    titleFa: '۲۵. قله دماوند و دشت شقایق — البرز',
    crownTextFa: 'طبیعت ایران · اللَّهُمَّ بَارِكْ لِمَوْلَانَا صَاحِبِ الزَّمَانِ (عج)',
    category: 'nature',
    cityKeywords: ['ساری', 'رشت', 'گرگان', 'مازندران', 'گیلان'],
    skyGradient: 'linear-gradient(180deg, #133B5C 0%, #1E5F74 52%, #071A16 100%)',
    accentColor: '#34D399',
    sceneType: 'damavand_peak',
  },
  {
    id: 'caspian_forest',
    titleFa: '۲۶. جنگل‌های هیرکانی و مه صبحگاهی — شمال ایران',
    crownTextFa: 'سبحان الله · اللَّهُمَّ بَارِكْ لِمَوْلَانَا صَاحِبِ الزَّمَانِ (عج)',
    category: 'nature',
    skyGradient: 'linear-gradient(180deg, #062B22 0%, #0F5241 52%, #071A16 100%)',
    accentColor: '#34D399',
    sceneType: 'custom_minimal_hills',
  },
  {
    id: 'tabriz_elgoli',
    titleFa: '۲۷. عمارت ایل‌گلی و مسجد کبود — تبریز',
    crownTextFa: 'تبریز باصلابت · اللَّهُمَّ بَارِكْ لِمَوْلَانَا صَاحِبِ الزَّمَانِ (عج)',
    category: 'cities',
    cityKeywords: ['تبریز'],
    skyGradient: 'linear-gradient(180deg, #0F2547 0%, #1E497A 52%, #071A16 100%)',
    accentColor: '#38BDF8',
    sceneType: 'winter_snow',
  },
  {
    id: 'kermanshah_taqbostan',
    titleFa: '۲۸. طاق‌بستان و کوهستان زاگرس — کرمانشاه و غرب',
    crownTextFa: 'زاگرس سرافراز · اللَّهُمَّ بَارِكْ لِمَوْلَانَا صَاحِبِ الزَّمَانِ (عج)',
    category: 'cities',
    cityKeywords: ['کرمانشاه', 'خرم‌آباد', 'ایلام'],
    skyGradient: 'linear-gradient(180deg, #1F2A44 0%, #3E547A 52%, #071A16 100%)',
    accentColor: '#FBBF24',
    sceneType: 'persepolis_history',
  },
  {
    id: 'persian_gulf_sunset',
    titleFa: '۲۹. غروب طلایی خلیج فارس — جنوب ایران',
    crownTextFa: 'خلیج همیشگی فارس · اللَّهُمَّ بَارِكْ لِمَوْلَانَا صَاحِبِ الزَّمَانِ (عج)',
    category: 'nature',
    skyGradient: 'linear-gradient(180deg, #2D142C 0%, #801336 48%, #071A16 100%)',
    accentColor: '#FB923C',
    sceneType: 'custom_minimal_hills',
  },
  {
    id: 'royal_tazhib_emerald',
    titleFa: '۳۰. تذهیب سلطنتی شمسه و فیروزه',
    crownTextFa: 'اللَّهُمَّ بَارِكْ لِمَوْلَانَا صَاحِبِ الزَّمَانِ (عج)',
    category: 'showcase12',
    skyGradient: 'linear-gradient(180deg, #05261E 0%, #0C4A3B 52%, #071A16 100%)',
    accentColor: '#FBBF24',
    sceneType: 'mashhad_haram',
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

// رندر گرافیکی غنی و پرجزئیات برای هر یک از صحنه‌های ۱۲گانه و ۳۰گانه (سبک، فوری و بدون لگ)
export function RenderHeroArtworkScene({ design }: { design: HeroArtDesign }) {
  const st = design.sceneType;

  return (
    <svg viewBox="0 0 420 225" className="w-full h-full object-cover" fill="none" preserveAspectRatio="xMidYBottom slice">
      <defs>
        <linearGradient id="goldRichGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="45%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
        <linearGradient id="blueTurquoiseDome" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7DD3FC" />
          <stop offset="50%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#0C4A6E" />
        </linearGradient>
        <linearGradient id="heroBottomFade" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#071A16" stopOpacity="0" />
          <stop offset="78%" stopColor="#071A16" stopOpacity="0.72" />
          <stop offset="100%" stopColor="#071A16" stopOpacity="1" />
        </linearGradient>
      </defs>

      {/* ستاره‌های درخشان آسمان */}
      <circle cx="52" cy="42" r="1.5" fill="#FEF08A" opacity="0.85" />
      <circle cx="118" cy="28" r="1.2" fill="#FEF08A" opacity="0.7" />
      <circle cx="310" cy="35" r="1.6" fill="#FEF08A" opacity="0.8" />
      <circle cx="368" cy="48" r="1.3" fill="#FEF08A" opacity="0.7" />

      {/* ۱. طرح شب یلدا: انار یاقوتی، شمع روشن و مناره طلایی (مطابق کارت ۳ ردیف اول عکس شما) */}
      {st === 'yalda_pomegranate' && (
        <g>
          <circle cx="210" cy="115" r="70" fill="#F59E0B" fillOpacity="0.18" />
          {/* گنبد و مناره در پس‌زمینه */}
          <rect x="255" y="58" width="12" height="118" fill="url(#goldRichGrad)" rx="2" />
          <path d="M275 176 C275 128 332 128 332 176 Z" fill="url(#goldRichGrad)" opacity="0.85" />
          {/* شمع روشن سمت راست */}
          <rect x="354" y="116" width="16" height="58" rx="3" fill="#FDE68A" opacity="0.9" />
          <path d="M362 96 C356 106 356 113 362 116 C368 113 368 106 362 96 Z" fill="#FBBF24" />
          <circle cx="362" cy="106" r="14" fill="#FBBF24" fillOpacity="0.3" />
          {/* انار سرخ بازشده با دانه‌های یاقوتی در پیش‌زمینه چپ */}
          <circle cx="132" cy="148" r="36" fill="#991B1B" stroke="#FCA5A5" strokeWidth="2" />
          <circle cx="132" cy="148" r="29" fill="#E11D48" />
          <circle cx="122" cy="140" r="3.5" fill="#FFF1F2" />
          <circle cx="134" cy="136" r="3.5" fill="#FFF1F2" />
          <circle cx="142" cy="146" r="3.5" fill="#FFF1F2" />
          <circle cx="126" cy="154" r="3.5" fill="#FFF1F2" />
          <circle cx="138" cy="158" r="3.5" fill="#FFF1F2" />
        </g>
      )}

      {/* ۲. طرح محرم: گنبد طلایی در مه سرخ و پرچم سرخ یاحسین (مطابق کارت ۴ ردیف اول عکس شما) */}
      {(st === 'muharram_shrine' || st === 'karbala_dome') && (
        <g>
          <circle cx="215" cy="128" r="85" fill="#EF4444" fillOpacity="0.22" />
          <rect x="142" y="55" width="12" height="122" fill="url(#goldRichGrad)" rx="2" />
          <rect x="276" y="55" width="12" height="122" fill="url(#goldRichGrad)" rx="2" />
          <path d="M168 178 C168 110 262 110 262 178 Z" fill="url(#goldRichGrad)" stroke="#FEF08A" strokeWidth="1.5" />
          {/* پرچم سرخ برافراشته بالای گنبد */}
          <line x1="215" y1="54" x2="215" y2="114" stroke="#FEF08A" strokeWidth="2.5" />
          <path d="M215 56 C242 50 258 66 282 58 L282 84 C258 92 242 76 215 82 Z" fill="#DC2626" stroke="#FCA5A5" strokeWidth="1" />
        </g>
      )}

      {/* ۳. طرح نوروز و بهار: گنبد فیروزه‌ای در میان شکوفه‌های صورتی بهاری (مطابق کارت ۱ ردیف دوم عکس شما) */}
      {st === 'nowruz_blossoms' && (
        <g>
          <rect x="148" y="60" width="11" height="116" fill="url(#goldRichGrad)" rx="2" />
          <rect x="262" y="60" width="11" height="116" fill="url(#goldRichGrad)" rx="2" />
          <path d="M170 176 C170 112 250 112 250 176 Z" fill="url(#blueTurquoiseDome)" stroke="#BAE6FD" strokeWidth="1.5" />
          {/* شاخه‌های پر از شکوفه صورتی در چپ و راست */}
          <circle cx="48" cy="115" r="28" fill="#F472B6" fillOpacity="0.75" />
          <circle cx="78" cy="138" r="22" fill="#FB7185" fillOpacity="0.7" />
          <circle cx="32" cy="148" r="24" fill="#F472B6" fillOpacity="0.8" />
          <circle cx="372" cy="118" r="28" fill="#F472B6" fillOpacity="0.75" />
          <circle cx="342" cy="142" r="22" fill="#FB7185" fillOpacity="0.7" />
          <circle cx="388" cy="150" r="24" fill="#F472B6" fillOpacity="0.8" />
        </g>
      )}

      {/* ۴. طرح بناهای تاریخی: ستون‌های باشکوه تخت جمشید در غروب طلایی (مطابق کارت ۲ ردیف دوم عکس شما) */}
      {st === 'persepolis_history' && (
        <g>
          <circle cx="195" cy="125" r="65" fill="#FDE047" fillOpacity="0.28" />
          <path d="M0 178 Q120 148 240 166 T420 155 L420 220 L0 220 Z" fill="#451A03" />
          {[82, 128, 174, 226, 272, 318].map((x, idx) => (
            <g key={x}>
              <rect x={x} y={74 + (idx % 2) * 12} width="12" height={102 - (idx % 2) * 12} fill="url(#goldRichGrad)" rx="2" />
              <rect x={x - 5} y={68 + (idx % 2) * 12} width="22" height="7" fill="#FEF08A" rx="2" />
              <rect x={x - 6} y="172" width="24" height="8" fill="#B45309" rx="2" />
            </g>
          ))}
        </g>
      )}

      {/* ۵. طرح طبیعت و کویر ایران: بادگیرهای سنتی یزد و تپه‌های شنی طلایی (مطابق کارت ۴ ردیف دوم عکس شما) */}
      {st === 'yazd_desert' && (
        <g>
          <path d="M0 176 Q110 135 230 165 T420 148 L420 220 L0 220 Z" fill="#B45309" fillOpacity="0.75" />
          {/* بادگیر و عمارت خشتی سنتی یزد */}
          <rect x="262" y="72" width="38" height="98" fill="#D97706" stroke="#FEF08A" strokeWidth="1.2" />
          <line x1="272" y1="78" x2="272" y2="128" stroke="#451A03" strokeWidth="3" />
          <line x1="281" y1="78" x2="281" y2="128" stroke="#451A03" strokeWidth="3" />
          <line x1="290" y1="78" x2="290" y2="128" stroke="#451A03" strokeWidth="3" />
          <rect x="215" y="118" width="125" height="54" fill="#B45309" stroke="#FDE68A" strokeWidth="1" />
        </g>
      )}

      {/* ۶. طرح ایران مدرن: برج آزادی تهران با آسمان گرگ‌ومیش (مطابق کارت ۳ ردیف سوم عکس شما) */}
      {st === 'modern_azadi' && (
        <g>
          <circle cx="210" cy="135" r="75" fill="#FBBF24" fillOpacity="0.22" />
          {/* برج آزادی تهران */}
          <path
            d="M 156 178 L 182 78 L 238 78 L 264 178 L 238 178 C 234 132, 186 132, 182 178 Z"
            fill="#F8FAFC"
            stroke="#FBBF24"
            strokeWidth="1.8"
          />
          <path d="M 188 106 C 188 90, 232 90, 232 106" stroke="#0284C7" strokeWidth="3" fill="none" />
        </g>
      )}

      {/* ۷. طرح شب‌های قدر و تپه‌های مهتابی (مطابق کارت ۲ و ۴ ردیف سوم عکس شما) */}
      {(st === 'qadr_crescent' || st === 'custom_minimal_hills' || st === 'damavand_peak') && (
        <g>
          <path d="M218 42C196 42 178 60 178 82C178 104 196 122 218 122C204 114 195 99 195 82C195 65 204 50 218 42Z" fill="#FEF08A" />
          <path d="M0 168 Q115 128 225 158 T420 142 L420 220 L0 220 Z" fill="#0B3B2E" fillOpacity="0.85" />
          <path d="M0 184 Q160 152 290 176 T420 165 L420 220 L0 220 Z" fill="#06231B" />
        </g>
      )}

      {/* ۸. طرح حرم مطهر امام رضا (ع)، مسجد کلاسیک، رمضان، زمستان، قم، اصفهان، شیراز و مکه */}
      {(st === 'mashhad_haram' ||
        st === 'classic_blue_mosque' ||
        st === 'ramadan_lanterns' ||
        st === 'winter_snow' ||
        st === 'qom_masoumeh' ||
        st === 'isfahan_naqsh' ||
        st === 'shiraz_hafez' ||
        st === 'makkah_kaaba') && (
        <g>
          <circle cx="210" cy="118" r="78" fill={design.accentColor} fillOpacity="0.22" />
          {/* هلال ماه در آسمان */}
          <path d="M216 46C207 46 200 53 200 62C200 71 207 78 216 78C210 74 207 68 207 62C207 56 210 50 216 46Z" fill="#FEF08A" />

          {/* فانوس‌های رمضان در دو طرف */}
          {st === 'ramadan_lanterns' && (
            <g>
              <line x1="42" y1="0" x2="42" y2="62" stroke="#FBBF24" strokeWidth="1.6" />
              <polygon points="42,62 56,82 42,106 28,82" fill="#F59E0B" stroke="#FEF08A" strokeWidth="1.4" />
              <line x1="378" y1="0" x2="378" y2="54" stroke="#FBBF24" strokeWidth="1.6" />
              <polygon points="378,54 392,74 378,98 364,74" fill="#F59E0B" stroke="#FEF08A" strokeWidth="1.4" />
            </g>
          )}

          {/* گلدسته‌های حرم/مسجد */}
          <rect x="138" y="54" width="11" height="122" fill="url(#goldRichGrad)" rx="2" />
          <rect x="134" y="74" width="19" height="5" rx="2" fill="#FEF08A" />
          <polygon points="143.5,36 137,54 150,54" fill="#FEF08A" />

          <rect x="271" y="54" width="11" height="122" fill="url(#goldRichGrad)" rx="2" />
          <rect x="267" y="74" width="19" height="5" rx="2" fill="#FEF08A" />
          <polygon points="276.5,36 270,54 283,54" fill="#FEF08A" />

          {/* گنبد اصلی (طلایی برای مشهد/قم یا فیروزه‌ای برای کلاسیک/اصفهان/زمستان) */}
          <path
            d="M168 174 C168 106 252 106 252 174 Z"
            fill={
              st === 'classic_blue_mosque' || st === 'isfahan_naqsh' || st === 'winter_snow'
                ? 'url(#blueTurquoiseDome)'
                : 'url(#goldRichGrad)'
            }
            stroke="#FEF08A"
            strokeWidth="1.6"
          />

          {/* ایوان و طاق‌های نورانی */}
          <rect x="116" y="156" width="188" height="36" rx="4" fill="#0D3B2E" stroke="#FBBF24" strokeWidth="1.2" />
          <path d="M196 192 L196 164 C196 154 224 154 224 164 L224 192 Z" fill="#FBBF24" fillOpacity="0.45" />

          {/* دانه‌های برف برای طرح زمستان */}
          {st === 'winter_snow' && (
            <g fill="#FFFFFF" opacity="0.85">
              <circle cx="85" cy="78" r="2.5" />
              <circle cx="165" cy="52" r="2" />
              <circle cx="248" cy="64" r="2.5" />
              <circle cx="332" cy="82" r="2.2" />
              <circle cx="64" cy="128" r="3" />
              <circle cx="358" cy="122" r="3" />
            </g>
          )}
        </g>
      )}

      <rect x="0" y="152" width="420" height="73" fill="url(#heroBottomFade)" />
    </svg>
  );
}

// مودال انتخابگر ۳۰ طرح Hero و تنظیم حالت تغییر تصویر (دستی / خودکار مناسبتی / متناسب با شهر)
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
      className="fixed inset-0 z-[999] overflow-y-auto flex items-stretch sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      style={{ background: 'rgba(3, 10, 8, 0.92)', backdropFilter: 'blur(10px)' }}
      dir="rtl"
    >
      <div
        className="w-full sm:max-w-xl min-h-[100dvh] sm:min-h-0 sm:max-h-[92vh] sm:rounded-3xl p-4 sm:p-6 overflow-y-auto border-0 sm:border flex flex-col"
        style={{ background: theme.surface, borderColor: theme.border }}
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-2">
            <Palette size={20} color="#FBBF24" />
            <div>
              <h2 className="text-sm sm:text-base font-black text-white">پکیج ۳۰ طرح معماری و مناسبتی بالای صفحه (Hero)</h2>
              <p className="text-[11px] text-emerald-200/80">فقط تصویر بالای صفحه تغییر می‌کند و اجزای صفحه سر جای خود می‌مانند</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-xl bg-white/10 text-white">
            <X size={18} />
          </button>
        </div>

        {/* ۳ حالت تغییر تصویر دقیقاً مطابق دستور شما */}
        <div className="grid grid-cols-3 gap-2 mb-3.5">
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
            <p className="text-[10px] text-slate-300 leading-snug">انتخاب مستقیم طرح دلخواه شما از بین ۳۰ طرح</p>
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
            <p className="text-[10px] text-slate-300 leading-snug">تغییر خودکار در رمضان، محرم، یلدا، نوروز و قدر</p>
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
            <p className="text-[10px] text-slate-300 leading-snug">نمایش معماری شاخص {cityName} با انتخاب شهر</p>
          </button>
        </div>

        {/* فیلتر دسته‌بندی ۳۰ طرح */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2.5">
          {[
            { id: 'all', label: 'همه ۳۰ طرح' },
            { id: 'showcase12', label: '🌟 ۱۲ طرح ویژه ویترین' },
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

        {/* گرید پیش‌نمایش زنده ۳۰ طرح */}
        <div className="grid grid-cols-2 gap-2.5 overflow-y-auto pr-1 flex-1" style={{ maxHeight: '52vh' }}>
          {filtered.map((item) => {
            const isSelected = selectedId === item.id && mode === 'manual';
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectDesign(item.id)}
                className="rounded-2xl overflow-hidden border text-right transition-transform active:scale-95 flex flex-col justify-between relative"
                style={{
                  borderColor: isSelected ? '#FBBF24' : 'rgba(255,255,255,0.14)',
                  background: 'rgba(0,0,0,0.35)',
                  boxShadow: isSelected ? '0 0 18px rgba(251, 191, 36, 0.35)' : 'none',
                }}
              >
                <div className="w-full h-24 relative overflow-hidden" style={{ background: item.skyGradient }}>
                  <RenderHeroArtworkScene design={item} />
                  {isSelected && (
                    <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow">
                      <Check size={14} strokeWidth={3} />
                    </span>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-[11px] font-black text-white truncate">{item.titleFa}</p>
                  <p className="text-[9px] text-amber-200/80 truncate mt-0.5">{item.crownTextFa}</p>
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-3 py-3 rounded-2xl text-xs font-black"
          style={{ background: '#FBBF24', color: '#071A16' }}
        >
          تأیید و نمایش در بالای صفحه خانه ✓
        </button>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : modal;
}
