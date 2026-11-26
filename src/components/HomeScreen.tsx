import { TawashihAndAdhanReminderSection, loadTawashihConfig } from '@/components/TawashihAndAdhanReminderSection';
import { rescheduleAll } from '@/lib/reminderService';
import { adhans, playAdhanPreview, stopAdhanPreview, getAdhanDurationMode, getAdhanDurationSeconds } from '@/lib/adhans';
const QiblaCompass = lazy(() => import('@/components/QiblaCompass').then((m) => ({ default: m.QiblaCompass })));
const VipAnalyticsModal = lazy(() => import('@/components/VipAnalyticsModal').then((m) => ({ default: m.VipAnalyticsModal })));
import { CompactHeaderWeatherPill } from '@/components/WeatherCuteCard';
import { NastaliqMahdiCrown, CelestialPrayerArcGauge, ThemePatternWatermark, DynamicShrineHorizonArt, VerticalJalaliDayCounterCard } from '@/components/FigmaLuxuryElements';
import { useState, useEffect, useMemo, useRef, useCallback, lazy, Suspense } from 'react';
import { MapPin, Clock, Sunrise, Sunset, Moon, Sun, CloudSun, ArrowLeft, Hand, Bell, BellOff, Compass, Sparkles, LocateFixed, Navigation, BookOpen, Sliders, Calendar } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useBackHandler } from '@/lib/backNavigation';
import { useI18n } from '@/i18n';
import { getCityDisplayName, getCountryDisplayName, findNearestCity } from '@/lib/cities';
import { useAuth } from '@/hooks/useAuth';
import { calculatePrayerTimes, getNextPrayer, getLocalDateString, timeToMinutes, getNightPrayerConfig, saveNightPrayerConfig, calculateNightPrayerWindow, type NightPrayerConfig, type PrayerTimes } from '@/lib/prayerTimes';
import { CITIES, getCityById, getGuestCityId, setGuestCityId, getCustomGpsCoords, saveCustomGpsCoords, clearCustomGpsCoords } from '@/lib/cities';
import { reverseGeocodeFast, clearReverseGeocodeCache } from '@/lib/neshanMosqueService';
import { getTodayTotal, getTodayRounds, getSession, fetchTodayStats, startSession } from '@/lib/tasbihStorage';
import { toJalaliShort, getJalaliWeekday, toFaDigits } from '@/lib/jalali';
import { dhikrLibrary } from '@/lib/dhikrLibrary';
import { loadReminders, scheduleReminder, cancelReminder, checkPermission, requestPermission, snoozeReminderByMinutes, NoorAlarm } from '@/lib/reminderService';
import { Capacitor } from '@capacitor/core';
import { saveReminder, type LocalReminder } from '@/lib/reminderStorage';
const VipAndAnalyticsModal = lazy(() => import('@/components/VipAndAnalyticsModal').then((m) => ({ default: m.VipAndAnalyticsModal })));
const AdhanStudioAndTravelModal = lazy(() => import('@/components/AdhanStudioAndTravelModal').then((m) => ({ default: m.AdhanStudioAndTravelModal })));
const QuranAndMuhasabaModal = lazy(() => import('@/components/QuranAndMuhasabaModal').then((m) => ({ default: m.QuranAndMuhasabaModal })));
const MosqueFinderModal = lazy(() => import('@/components/MosqueFinderModal').then((m) => ({ default: m.MosqueFinderModal })));
import { loadQuranContinuity, loadMosqueAndTravel, addMinutesToTimeStr } from '@/lib/deenIntelligenceStore';
import { logEvent } from '@/lib/logger';
import { QiblaCompassModal } from '@/components/QiblaCompassModal';
const CalendarModal = lazy(() => import('@/components/CalendarModal').then((m) => ({ default: m.CalendarModal })));
import { WeatherCuteHeaderWidget } from '@/components/WeatherCuteCard';
import { InboxModal } from '@/components/InboxAndBirthdayModal';
import { getUnreadInboxCount, INBOX_UPDATED_EVENT } from '@/lib/inboxService';
import type { Tab } from '@/components/BottomNav';

export interface HomeModulesVisibility {
  showDeenWidgets: boolean;
  showContextualTip: boolean;
  showDailySummary: boolean;
  showAsrPrayer: boolean;
  showIshaPrayer: boolean;
  showMidnightTime: boolean;
}

const HOME_MODULES_KEY = 'noor_home_modules_visibility_v1';
const DEFAULT_HOME_MODULES: HomeModulesVisibility = {
  showDeenWidgets: false,
  showContextualTip: false,
  showDailySummary: false,
  showAsrPrayer: true,
  showIshaPrayer: true,
  showMidnightTime: true,
};

export function getHomeModulesVisibility(): HomeModulesVisibility {
  try {
    const raw = localStorage.getItem(HOME_MODULES_KEY);
    if (!raw) return { ...DEFAULT_HOME_MODULES };
    return { ...DEFAULT_HOME_MODULES, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_HOME_MODULES };
  }
}

export function setHomeModulesVisibility(v: HomeModulesVisibility): void {
  try {
    localStorage.setItem(HOME_MODULES_KEY, JSON.stringify(v));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('noor-home-modules-changed'));
    }
  } catch {}
}

const prayerIcons: Record<string, typeof Sun> = {
  fajr: Sunrise,
  sunrise: Sun,
  dhuhr: Sun,
  asr: CloudSun,
  maghrib: Sunset,
  isha: Moon,
  midnight: Moon,
};

function getContextualSpiritualTip(now: Date): {
  badge: string;
  title: string;
  subtitle: string;
  dhikrId: string;
} {
  const day = now.getDay();
  const hour = now.getHours();
  const dayNameFa = getJalaliWeekday(now);

  if (day === 4 && hour >= 14 && hour < 19) {
    return {
      badge: '✨ پیشنهاد عصر ' + dayNameFa + ' (ویژه والدین)',
      title: 'فاتحه و سوره قدر برای شادی روح پدر، مادر و درگذشتگان',
      subtitle: 'اللَّهُمَّ اغْفِرْ لِلْمُؤْمِنِينَ وَالْمُؤْمِنَاتِ — هدیه عصر پنجشنبه',
      dhikrId: 'ahlul_qubur_fatiha',
    };
  }
  if (day === 4 && hour >= 19) {
    return {
      badge: '🌙 برنامه ویژه شب جمعه',
      title: 'سلام به سیدالشهدا (ع) و تلاوت سوره مبارکه واقعه',
      subtitle: 'صَلَّى اللَّهُ عَلَيْكَ يَا أَبَا عَبْدِ اللَّهِ — ۳ مرتبه با توجه قلبی',
      dhikrId: 'friday_night_husayn',
    };
  }
  if (day === 5 && hour < 13) {
    return {
      badge: '🌿 عمل مجرب صبح ' + dayNameFa,
      title: 'تلاوت سوره مبارکه صافات (وسعت رزق و ایمنی از بلا)',
      subtitle: 'وَالصَّافَّاتِ صَفًّا — همراه با پخش صوتی ترتیل و متن کامل',
      dhikrId: 'surah_saffat_friday',
    };
  }
  if (day === 5 && hour >= 13 && hour < 19) {
    return {
      badge: '✨ عمل مخصوص عصر ' + dayNameFa,
      title: 'صلوات ضراب اصفهانی و دعای سلامتی امام زمان (عج)',
      subtitle: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ سَيِّدِ الْمُرْسَلِينَ — تعلیم حضرت ولی‌عصر (عج)',
      dhikrId: 'salawat_zarrab_isfahani',
    };
  }
  if (day === 3 && hour >= 11 && hour < 19) {
    return {
      badge: '💚 پیشنهاد ویژه ' + dayNameFa + ' (روز امام رضا ع)',
      title: 'توسل به امام رئوف حضرت علی بن موسی الرضا (ع)',
      subtitle: 'يَا رَءُوفُ يَا رَحِيمُ — کلید گشایش حاجات و آرامش دل در روز چهارشنبه',
      dhikrId: 'imam_reza_hajat',
    };
  }
  if (hour >= 4 && hour < 6) {
    return {
      badge: '🌅 ذکر مجرب سجده نماز صبح ' + dayNameFa,
      title: '۱۰۰ مرتبه «يَا مَوْلَاتِي يَا فَاطِمَةُ أَغِيثِينِي» در سجده نماز صبح',
      subtitle: 'توسل مجرب به حضرت زهرا (س) برای روا شدن حاجات مهم — برای شمارش لمس کنید',
      dhikrId: 'ya_fatima_100',
    };
  }
  if (hour >= 6 && hour < 9) {
    return {
      badge: '💼 دعای آغاز کار و خروج از منزل (' + dayNameFa + ')',
      title: 'ذکر توکل آیت‌الله مجتهدی + تسبیحات شروع کار (۳۳ سبحان‌الله، ۳۳ الحمدلله، ۳۴ الله‌اکبر)',
      subtitle: 'بِسْمِ اللَّهِ وَبِاللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ + ۶ سوره توحید برای برکت رزق امروز',
      dhikrId: 'mojtahedi_work_exit_tawhid',
    };
  }
  if (hour >= 9 && hour < 14) {
    return {
      badge: '☀️ پیشنهاد نیمروز ' + dayNameFa,
      title: 'ذکر مجرب آیت‌الله بهجت برای وسعت رزق (اللَّهُمَّ أَغْنِنِي بِحَلَالِكَ)',
      subtitle: 'اللَّهُمَّ أَغْنِنِي بِحَلَالِكَ عَنْ حَرَامِكَ وَبِفَضْلِكَ عَمَّنْ سِوَاكَ — ۷۰ مرتبه',
      dhikrId: 'bahjat_aghnini_halalika',
    };
  }
  if (hour >= 14 && hour < 18) {
    return {
      badge: '🌤️ پیشنهاد وقت عصر ' + dayNameFa,
      title: '۴۰ مرتبه «يَا قَاضِيَ الْحَاجَاتِ» و استغفار عصرگاهی',
      subtitle: 'توصیه علما برای گشایش گره‌های زندگی و برآورده شدن حاجات',
      dhikrId: 'ya_qadi_al_hajat_40',
    };
  }
  if (hour >= 18 && hour < 21) {
    return {
      badge: '🌇 پیشنهاد اول شب ' + dayNameFa,
      title: 'تلاوت سوره مبارکه واقعه و دعای عافیت',
      subtitle: 'توصیه امام صادق (ع) پس از نماز مغرب و عشاء برای بی‌نیازی و برکت رزق',
      dhikrId: 'surah_waqiah',
    };
  }
  return {
    badge: '🌙 پیشنهاد آرامش شبانگاه ' + dayNameFa,
    title: 'ذکر یونسیه و تسبیحات پیش از خواب',
    subtitle: 'لَا إِلَٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ — ۴۰ مرتبه',
    dhikrId: 'bahjat_yunusiyyah',
  };
}

interface DailyHourlySuggestion {
  badgeFa: string;
  titleFa: string;
  arabicFa: string;
  actionType: 'dhikr' | 'surah';
  dhikrId?: string;
  targetCount?: number;
  surahNumber?: number;
  ctaLabel: string;
}

function getDynamicDailyHourlySuggestion(now: Date): DailyHourlySuggestion {
  const day = now.getDay();
  const hour = now.getHours();

  const dayNamesFa: Record<
    number,
    {
      dayFa: string;
      masoomFa: string;
      dayDhikrAr: string;
      dayDhikrTitle: string;
      dayDhikrId: string;
      dayTarget: number;
    }
  > = {
    6: {
      dayFa: 'شنبه',
      masoomFa: 'متعلق به پیامبر رحمت حضرت محمد مصطفی (ص)',
      dayDhikrAr: 'يَا رَبَّ الْعَالَمِينَ',
      dayDhikrTitle: 'ذکر روز شنبه (۱۰۰ مرتبه یا رب العالمین)',
      dayDhikrId: 'day_saturday_dhikr',
      dayTarget: 100,
    },
    0: {
      dayFa: 'یکشنبه',
      masoomFa: 'متعلق به امیرالمؤمنین علی (ع) و حضرت زهرا (س)',
      dayDhikrAr: 'يَا ذَا الْجَلَالِ وَ الْإِكْرَامِ',
      dayDhikrTitle: 'ذکر روز یکشنبه (۱۰۰ مرتبه یا ذالجلال و الاکرام)',
      dayDhikrId: 'day_sunday_dhikr',
      dayTarget: 100,
    },
    1: {
      dayFa: 'دوشنبه',
      masoomFa: 'متعلق به امام حسن مجتبی (ع) و امام حسین (ع)',
      dayDhikrAr: 'يَا قَاضِيَ الْحَاجَاتِ',
      dayDhikrTitle: 'ذکر روز دوشنبه (۱۰۰ مرتبه یا قاضی الحاجات)',
      dayDhikrId: 'day_monday_dhikr',
      dayTarget: 100,
    },
    2: {
      dayFa: 'سه‌شنبه',
      masoomFa: 'متعلق به امام سجاد (ع)، امام باقر (ع) و امام صادق (ع)',
      dayDhikrAr: 'يَا أَرْحَمَ الرَّاحِمِينَ',
      dayDhikrTitle: 'ذکر روز سه‌شنبه (۱۰۰ مرتبه یا ارحم الراحمین)',
      dayDhikrId: 'day_tuesday_dhikr',
      dayTarget: 100,
    },
    3: {
      dayFa: 'چهارشنبه',
      masoomFa: 'متعلق به امام موسی کاظم (ع) و امام علی بن موسی الرضا (ع)',
      dayDhikrAr: 'يَا حَيُّ يَا قَيُّومُ',
      dayDhikrTitle: 'ذکر روز چهارشنبه (۱۰۰ مرتبه یا حی یا قیوم)',
      dayDhikrId: 'day_wednesday_dhikr',
      dayTarget: 100,
    },
    4: {
      dayFa: 'پنجشنبه',
      masoomFa: 'متعلق به امام حسن عسکری (ع) و یاد درگذشتگان و شهدا',
      dayDhikrAr: 'لَا إِلَٰهَ إِلَّا اللَّهُ الْمَلِكُ الْحَقُّ الْمُبِينُ',
      dayDhikrTitle: 'ذکر روز پنجشنبه (۱۰۰ مرتبه لا اله الا الله الملک الحق المبین)',
      dayDhikrId: 'day_thursday_dhikr',
      dayTarget: 100,
    },
    5: {
      dayFa: 'جمعه',
      masoomFa: 'متعلق به قطب عالم امکان حضرت بقیةالله الاعظم (عج)',
      dayDhikrAr: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَآلِ مُحَمَّدٍ وَعَجِّلْ فَرَجَهُمْ',
      dayDhikrTitle: 'ذکر روز جمعه (۱۰۰ مرتبه صلوات مهدوی)',
      dayDhikrId: 'salawat',
      dayTarget: 100,
    },
  };

  const dInfo = dayNamesFa[day] || dayNamesFa[0];

  if (hour >= 3 && hour < 6) {
    return {
      badgeFa: `پیشنهاد سحرگاه ${dInfo.dayFa} · ${dInfo.masoomFa}`,
      titleFa: 'استغفار سحرگاهی (۷۰ مرتبه) و مناجات',
      arabicFa: 'أَسْتَغْفِرُ اللَّهَ رَبِّي وَأَتُوبُ إِلَيْهِ',
      actionType: 'dhikr',
      dhikrId: 'asr_istighfar_70',
      targetCount: 70,
      ctaLabel: '▶ شروع ذکر',
    };
  }
  if (day === 5 && hour >= 6 && hour < 11) {
    return {
      badgeFa: `پیشنهاد صبح جمعه · ${dInfo.masoomFa}`,
      titleFa: 'تلاوت سوره مبارکه صافات (وسعت رزق و ایمنی از بلا)',
      arabicFa: 'وَالصَّافَّاتِ صَفًّا ۝ فَالزَّاجِرَاتِ زَجْرًا',
      actionType: 'surah',
      surahNumber: 37,
      ctaLabel: '📖 تلاوت سوره',
    };
  }
  if (hour >= 6 && hour < 11) {
    return {
      badgeFa: `پیشنهاد صبح ${dInfo.dayFa} · ${dInfo.masoomFa}`,
      titleFa: dInfo.dayDhikrTitle,
      arabicFa: dInfo.dayDhikrAr,
      actionType: 'dhikr',
      dhikrId: dInfo.dayDhikrId,
      targetCount: dInfo.dayTarget,
      ctaLabel: '▶ شروع ذکر',
    };
  }
  if (hour >= 11 && hour < 15) {
    return {
      badgeFa: `پیشنهاد ظهر ${dInfo.dayFa} · ${dInfo.masoomFa}`,
      titleFa: `تعقیبات ظهر و ${dInfo.dayDhikrTitle}`,
      arabicFa: dInfo.dayDhikrAr,
      actionType: 'dhikr',
      dhikrId: dInfo.dayDhikrId,
      targetCount: dInfo.dayTarget,
      ctaLabel: '▶ شروع ذکر',
    };
  }
  if (hour >= 15 && hour < 18) {
    return {
      badgeFa: `پیشنهاد عصر ${dInfo.dayFa} · ${dInfo.masoomFa}`,
      titleFa: day === 5
        ? 'استغفار عصرگاهی (۷۰ مرتبه) — ویژه عصر جمعه'
        : `استغفار عصرگاهی (۷۰ مرتبه) · ${dInfo.dayFa}`,
      arabicFa: 'أَسْتَغْفِرُ اللَّهَ رَبِّي وَأَتُوبُ إِلَيْهِ',
      actionType: 'dhikr',
      dhikrId: 'asr_istighfar_70',
      targetCount: 70,
      ctaLabel: '▶ شروع ذکر',
    };
  }
  if (hour >= 18 && hour < 21) {
    return {
      badgeFa: `پیشنهاد شامگاه ${dInfo.dayFa} · برکت و وسعت رزق`,
      titleFa: 'تلاوت سوره مبارکه واقعه (توصیه هر شب امام صادق ع)',
      arabicFa: 'إِذَا وَقَعَتِ الْوَاقِعَةُ ۝ لَيْسَ لِوَقْعَتِهَا كَاذِبَةٌ',
      actionType: 'surah',
      surahNumber: 56,
      ctaLabel: '📖 تلاوت سوره',
    };
  }
  return {
    badgeFa: `پیشنهاد شبانگاه ${dInfo.dayFa} · آرامش پیش از خواب`,
    titleFa: 'تلاوت سوره مبارکه ملک (تبارک) و محاسبه نفس',
    arabicFa: 'تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    actionType: 'surah',
    surahNumber: 67,
    ctaLabel: '📖 تلاوت سوره',
  };
}

// === START_2026_MASTER_HOMESCREEN ===
export function HomeScreen({ onNavigate }: { onNavigate: (tab: any) => void }) {
  const { theme } = useTheme();
  const { profile } = useAuth();
  const { lang, dir, isRtl, t, formatDigits, prayerName } = useI18n();
  const [guestCalcMethod, setGuestCalcMethod] = useState<string>(() => {
    try { return localStorage.getItem('noor_guest_calc_method') || 'tehran'; } catch { return 'tehran'; }
  });
  const [adhanConfigTick, setAdhanConfigTick] = useState(0);
  const calcMethod = profile?.calculation_method || guestCalcMethod;
  const [now, setNow] = useState(() => new Date());
  const [locatingGps, setLocatingGps] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [citySearchQuery, setCitySearchQuery] = useState('');

  // خواندن دقیق شهر و منطقه زمانی واقعی آن از CITIES (همگام کامل با تنظیمات)
  const resolveCurrentCity = () => {
    try {
      const guestId = getGuestCityId();
      const found = getCityById(guestId);
      if (found) {
        return {
          id: found.id,
          name: found.name,
          nameFa: found.nameFa,
          nameEs: found.nameEs,
          country: found.country,
          countryFa: found.countryFa,
          countryEs: found.countryEs,
          lat: found.lat,
          lng: found.lng,
          timezone: found.timezone || 'Asia/Tehran',
        };
      }
    } catch {}
    const fallback = CITIES[0];
    return {
      id: fallback.id,
      name: fallback.name,
      nameFa: fallback.nameFa,
      nameEs: fallback.nameEs,
      country: fallback.country,
      countryFa: fallback.countryFa,
      countryEs: fallback.countryEs,
      lat: fallback.lat,
      lng: fallback.lng,
      timezone: fallback.timezone || 'Asia/Tehran',
    };
  };

  const [city, setCity] = useState(() => resolveCurrentCity());

  useEffect(() => {
    const syncCity = () => setCity(resolveCurrentCity());
    const syncTasbih = () => setLiveTasbihSession(getSession());
    window.addEventListener('noor-tasbih-session-changed', syncTasbih);
    const syncInbox = () => setUnreadInboxCount(getUnreadInboxCount());
    window.addEventListener(INBOX_UPDATED_EVENT, syncInbox);
    const syncMethod = () => {
      try { setGuestCalcMethod(localStorage.getItem('noor_guest_calc_method') || 'tehran'); } catch {}
      setAdhanConfigTick((v) => v + 1);
    };
    const syncAdhanCfg = () => setAdhanConfigTick((v) => v + 1);
    const syncModules = () => setModulesVis(getHomeModulesVisibility());
    window.addEventListener('noor-calc-method-changed', syncMethod);
    window.addEventListener('noor-adhan-config-changed', syncAdhanCfg);
    window.addEventListener('noor-home-modules-changed', syncModules);
    const timer = setInterval(() => setNow(new Date()), 30000);
    window.addEventListener('storage', syncCity);
    window.addEventListener('noor-city-changed', syncCity);
    window.addEventListener('noor-hero-config-changed', syncCity);
    return () => {
      clearInterval(timer);
      window.removeEventListener('storage', syncCity);
      window.removeEventListener('noor-city-changed', syncCity);
      window.removeEventListener('noor-hero-config-changed', syncCity);
      window.removeEventListener('noor-tasbih-session-changed', syncTasbih);
      window.removeEventListener(INBOX_UPDATED_EVENT, syncInbox);
      window.removeEventListener('noor-calc-method-changed', syncMethod);
      window.removeEventListener('noor-adhan-config-changed', syncAdhanCfg);
      window.removeEventListener('noor-home-modules-changed', syncModules);
    };
  }, []);

  const applyCitySelection = (
    c: {
      id: string;
      name: string;
      nameFa: string;
      nameEs?: string;
      country?: string;
      countryFa?: string;
      countryEs?: string;
      lat: number;
      lng: number;
      timezone?: string;
    },
    isGps = false
  ) => {
    try {
      if (!isGps) clearCustomGpsCoords();
      setGuestCityId(c.id);
      localStorage.setItem('noor_selected_city', JSON.stringify(c));
    } catch {}
    const fullCity = getCityById(c.id);
    setCity({
      id: fullCity.id,
      name: fullCity.name,
      nameFa: fullCity.nameFa,
      nameEs: fullCity.nameEs,
      country: fullCity.country,
      countryFa: fullCity.countryFa,
      countryEs: fullCity.countryEs,
      lat: c.lat,
      lng: c.lng,
      timezone: c.timezone || fullCity.timezone || 'Asia/Tehran',
    });
    window.dispatchEvent(new Event('noor-city-changed'));
    void rescheduleAll();
  };

  const [adhanBells, setAdhanBells] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem('noor_adhan_bells_v1');
      if (raw) return JSON.parse(raw);
    } catch {}
    return { fajr: true, dhuhr: true, asr: false, maghrib: true, isha: false };
  });

  const [showCalendar, setShowCalendar] = useState(false);
  const [showMosqueFinder, setShowMosqueFinder] = useState(false);
  const [showQuranAndMuhasaba, setShowQuranAndMuhasaba] = useState(false);
  const [initialQuranSurah, setInitialQuranSurah] = useState<number | undefined>(undefined);
  const [liveTasbihSession, setLiveTasbihSession] = useState(() => getSession());
  const [showStudioAndTravel, setShowStudioAndTravel] = useState(false);
  const [showQibla, setShowQibla] = useState(false);
  const [showBiModal, setShowBiModal] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [unreadInboxCount, setUnreadInboxCount] = useState(() => getUnreadInboxCount());
  const [showCityPicker, setShowCityPicker] = useState(false);

  useBackHandler(showCityPicker, () => setShowCityPicker(false));
  useBackHandler(showQibla, () => setShowQibla(false));
  useBackHandler(showCalendar, () => setShowCalendar(false));
  useBackHandler(showMosqueFinder, () => setShowMosqueFinder(false));
  useBackHandler(showQuranAndMuhasaba, () => {
    setShowQuranAndMuhasaba(false);
    setInitialQuranSurah(undefined);
  });
  useBackHandler(showStudioAndTravel, () => setShowStudioAndTravel(false));
  useBackHandler(showBiModal, () => setShowBiModal(false));
  useBackHandler(showInbox, () => setShowInbox(false));
  const [modulesVis, setModulesVis] = useState(() => getHomeModulesVisibility());

  const showQuickToast = (msg: string) => {
    setStatusBanner(msg);
    setTimeout(() => setStatusBanner(null), 4000);
  };

  const cityDisplayLabel = getCityDisplayName(city, lang);

  // مکان‌یابی دقیق جهانی GPS با الگوریتم Haversine و حفظ منطقه زمانی واقعی شهر
  const autoDetectLocationNow = async () => {
    setLocatingGps(true);
    showQuickToast(t('home.toastGpsStart'));
    try {
      let lat: number | null = null;
      let lng: number | null = null;

      if (Capacitor.isNativePlatform()) {
        try {
          const res = await NoorAlarm.requestAndGetLocation();
          if (res && res.hasCoords && typeof res.lat === 'number' && typeof res.lng === 'number') {
            lat = res.lat;
            lng = res.lng;
          }
        } catch {}
      }

      if (lat === null || lng === null) {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      }

      if (lat !== null && lng !== null) {
        const { city: nearest } = findNearestCity(lat, lng);
        saveCustomGpsCoords(lat, lng, getCityDisplayName(nearest, lang));
        applyCitySelection(
          {
            id: nearest.id,
            name: nearest.name,
            nameFa: nearest.nameFa,
            nameEs: nearest.nameEs,
            lat,
            lng,
            timezone: nearest.timezone,
          },
          true
        );
        showQuickToast(t('home.toastGpsDone') + ' ' + getCityDisplayName(nearest, lang));
        setShowCityPicker(false);
      }
    } catch {
      showQuickToast(t('home.toastGpsErr'));
    } finally {
      setLocatingGps(false);
    }
  };

  const exactGps = getCustomGpsCoords();
  const effectiveLat = exactGps ? exactGps.lat : city.lat;
  const effectiveLng = exactGps ? exactGps.lng : city.lng;
  const activeTimezone = city.timezone || 'Asia/Tehran';
  const times = calculatePrayerTimes(now, effectiveLat, effectiveLng, activeTimezone, calcMethod);
  const nextPrayerInfo = times ? getNextPrayer(times, activeTimezone, lang) : null;
  const nextPrayerKey = (nextPrayerInfo?.key ?? 'fajr') as
    | 'fajr'
    | 'sunrise'
    | 'dhuhr'
    | 'asr'
    | 'maghrib'
    | 'isha'
    | 'midnight';
  const nextPrayer = {
    key: nextPrayerKey,
    nameLabel: prayerName(nextPrayerKey),
    time: nextPrayerInfo?.time ?? (times?.fajr || '04:45'),
    remaining: nextPrayerInfo?.remaining ?? (lang === 'fa' ? '۱س ۳۰د' : '1h 30m'),
    progress: (nextPrayerInfo as { progress?: number } | null)?.progress ?? 55,
  };

  const scheduleNativeLockscreenAdhanForPrayer = async (
    prayerKey: string,
    labelStr: string,
    timeStr: string,
    enable: boolean
  ) => {
    const alarmIds: Record<string, number> = {
      fajr: 70101,
      dhuhr: 70102,
      asr: 70103,
      maghrib: 70104,
      isha: 70105,
    };
    const alarmId = alarmIds[prayerKey] || 70199;

    if (!Capacitor.isNativePlatform()) return;

    try {
      if (!enable) {
        await NoorAlarm.cancelNativeAlarm({ id: alarmId });
        return;
      }

      const [hh, mm] = timeStr.split(':').map((n) => parseInt(n, 10));
      if (isNaN(hh) || isNaN(mm)) return;

      const target = new Date();
      target.setHours(hh, mm, 0, 0);
      if (target.getTime() <= Date.now()) {
        target.setDate(target.getDate() + 1);
      }

      const selectedAdhanId = localStorage.getItem('noor_guest_adhan_id') || 'ahlolbait_30';
      const durSec = getAdhanDurationSeconds(getAdhanDurationMode());

      await NoorAlarm.scheduleNativeAlarm({
        id: alarmId,
        triggerAtMillis: target.getTime(),
        title: lang === 'fa' ? '🕌 اذان ' + labelStr + ' به افق ' + city.nameFa : '🕌 ' + labelStr + ' Adhan · ' + cityDisplayLabel,
        body: lang === 'fa' ? 'حي على الصلاة — وقت نماز ' + labelStr + ' فرا رسیده است' : 'Hayya ala as-Salah — Time for ' + labelStr + ' prayer',
        soundType: 'adhan',
        adhanId: selectedAdhanId,
        durationSeconds: durSec,
        volumePercent: 100,
      });
    } catch {}
  };

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !times) return;
    const syncAllActivePrayerAlarms = async () => {
      const prayerMap: { key: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'; timeStr: string }[] = [
        { key: 'fajr', timeStr: times.fajr },
        { key: 'dhuhr', timeStr: times.dhuhr },
        { key: 'asr', timeStr: times.asr },
        { key: 'maghrib', timeStr: times.maghrib },
        { key: 'isha', timeStr: times.isha },
      ];
      for (const item of prayerMap) {
        if (item.timeStr) {
          await scheduleNativeLockscreenAdhanForPrayer(
            item.key,
            prayerName(item.key),
            item.timeStr,
            Boolean(adhanBells[item.key])
          );
        }
      }
    };
    const timer = setTimeout(() => {
      void syncAllActivePrayerAlarms();
    }, 600);
    return () => clearTimeout(timer);
  }, [effectiveLat, effectiveLng, activeTimezone, adhanBells, calcMethod, adhanConfigTick, lang]);

  const togglePrayerBell = async (key: string, labelStr: string, timeStr: string) => {
    const currentVal = Boolean(adhanBells[key]);
    const nextVal = !currentVal;
    const nextState = { ...adhanBells, [key]: nextVal };
    setAdhanBells(nextState);
    try {
      localStorage.setItem('noor_adhan_bells_v1', JSON.stringify(nextState));
    } catch {}

    await scheduleNativeLockscreenAdhanForPrayer(key, labelStr, timeStr, nextVal);
    void rescheduleAll();

    if (nextVal) {
      const selectedAdhanId = localStorage.getItem('noor_guest_adhan_id') || 'ahlolbait_30';
      void playAdhanPreview(adhans.find((a) => a.id === selectedAdhanId) || adhans[0]);
      setTimeout(() => stopAdhanPreview(), 7000);
      showQuickToast(t('home.toastBellOn') + ' ' + labelStr + ' (' + formatDigits(timeStr) + ')');
    } else {
      stopAdhanPreview();
      showQuickToast(t('home.toastBellOff') + ' ' + labelStr);
    }
  };

  const prayerColumns = [
    { key: 'fajr', nameLabel: prayerName('fajr'), time: times?.fajr ?? '04:45', icon: Sunrise, hasAdhan: true, isMidnight: false },
    { key: 'sunrise', nameLabel: prayerName('sunrise'), time: times?.sunrise ?? '06:03', icon: Sun, hasAdhan: false, isMidnight: false },
    { key: 'dhuhr', nameLabel: prayerName('dhuhr'), time: times?.dhuhr ?? '11:17', icon: Sun, hasAdhan: true, isMidnight: false },
    ...(modulesVis.showAsrPrayer !== false
      ? [{ key: 'asr', nameLabel: prayerName('asr'), time: times?.asr ?? '14:06', icon: Sunset, hasAdhan: true, isMidnight: false }]
      : []),
    { key: 'maghrib', nameLabel: prayerName('maghrib'), time: times?.maghrib ?? '16:44', icon: Sunset, hasAdhan: true, isMidnight: false },
    ...(modulesVis.showIshaPrayer !== false
      ? [{ key: 'isha', nameLabel: prayerName('isha'), time: times?.isha ?? '17:36', icon: Moon, hasAdhan: true, isMidnight: false }]
      : []),
    ...(modulesVis.showMidnightTime !== false
      ? [{ key: 'midnight', nameLabel: prayerName('midnight'), time: times?.midnight ?? '23:06', icon: Moon, hasAdhan: false, isMidnight: true }]
      : []),
  ];

  const qSearch = citySearchQuery.trim().toLowerCase();
  const filteredCities = CITIES.filter(
    (c) =>
      !qSearch ||
      c.nameFa.includes(qSearch) ||
      c.countryFa.includes(qSearch) ||
      c.name.toLowerCase().includes(qSearch) ||
      c.country.toLowerCase().includes(qSearch) ||
      (c.nameEs || '').toLowerCase().includes(qSearch) ||
      (c.countryEs || '').toLowerCase().includes(qSearch)
  );

  return (
    <div
      className="min-h-screen pb-32 relative select-none"
      style={{ background: theme.bg, color: theme.text }}
      dir={dir}
    >
      {/* ۱. هدر بالای صفحه با تصویر افق ۳۰تایی کاملاً آفلاین */}
      <div className="relative">
        <DynamicShrineHorizonArt cityName={city.nameFa} themeId={theme.id} nextPrayerKey={nextPrayer.key} />

        <div className="absolute top-2.5 inset-x-0 z-20 max-w-lg mx-auto px-4 space-y-2.5">
          <NastaliqMahdiCrown />

          <div className="flex items-center justify-between gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => {
                setShowCityPicker(true);
              }}
              className="px-4 py-2 rounded-full border flex items-center gap-2 text-sm font-black transition-transform active:scale-95 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, rgba(14, 58, 47, 0.92) 0%, rgba(7, 32, 26, 0.96) 100%)',
                borderColor: 'rgba(52, 211, 153, 0.55)',
                color: '#ECFDF5',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
              }}
            >
              <MapPin size={16} color="#34D399" className={locatingGps ? 'animate-bounce' : ''} />
              <span>{locatingGps ? t('home.locating') : cityDisplayLabel}</span>
              <span className="text-xs opacity-80">⌄</span>
            </button>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowInbox(true)}
                aria-label={t('home.inboxAria')}
                title={t('home.inboxAria')}
                className="relative w-9 h-9 rounded-full border flex items-center justify-center transition-transform active:scale-95 shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, rgba(14, 58, 47, 0.92) 0%, rgba(7, 32, 26, 0.96) 100%)',
                  borderColor: unreadInboxCount > 0 ? '#FBBF24' : 'rgba(52, 211, 153, 0.45)',
                  color: unreadInboxCount > 0 ? '#FDE047' : '#ECFDF5',
                }}
              >
                <Bell size={16} />
                {unreadInboxCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center shadow-md animate-pulse"
                    style={{ background: '#EF4444', color: '#FFFFFF' }}
                  >
                    {formatDigits(unreadInboxCount > 9 ? '9+' : unreadInboxCount)}
                  </span>
                )}
              </button>
              <CompactHeaderWeatherPill
                cityName={cityDisplayLabel}
                lat={effectiveLat}
                lng={effectiveLng}
                onOpenCalendar={() => setShowCalendar(true)}
              />
            </div>
          </div>
        </div>
      </div>

      {statusBanner && (
        <div className="max-w-lg mx-auto px-4 mt-2 relative z-30">
          <div
            className="px-3.5 py-2.5 rounded-2xl border text-xs font-black text-center shadow-lg"
            style={{ background: theme.surfaceAlt, borderColor: theme.primary, color: theme.text }}
          >
            {statusBanner}
          </div>
        </div>
      )}

      {showInbox && <InboxModal onClose={() => setShowInbox(false)} onNavigate={onNavigate} />}
      {showBiModal && <Suspense fallback={null}><VipAnalyticsModal onClose={() => setShowBiModal(false)} /></Suspense>}

      {/* ۲. بدنه اصلی صفحه خانه */}
      <div className="max-w-lg mx-auto px-4 -mt-4 relative z-10 space-y-3.5">
        <div className="flex items-stretch gap-2.5">
          <div
            className="flex-1 rounded-[28px] p-3.5 relative overflow-hidden border shadow-2xl flex flex-col justify-center"
            style={{
              background: theme.card,
              borderColor: theme.border,
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.38), 0 0 20px ' + theme.primaryGlow,
            }}
          >
            <ThemePatternWatermark themeId={theme.id} className="opacity-70" />
            <CelestialPrayerArcGauge
              progressPercent={nextPrayer.progress}
              remainingText={nextPrayer.remaining}
              nextPrayerName={nextPrayer.nameLabel}
              nextPrayerTime={nextPrayer.time}
              accentColor={theme.accent}
              primaryColor={theme.primary}
            />
          </div>

          <VerticalJalaliDayCounterCard
            now={now}
            weekdayFa={getJalaliWeekday(now)}
            onClick={() => setShowCalendar(true)}
          />
        </div>

        {/* ۳. داک ۴ آیکونی شیشه‌ای ۲۰۲۶ */}
        <div className="grid grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => {
              setInitialQuranSurah(undefined);
              setShowQuranAndMuhasaba(true);
            }}
            className="rounded-3xl p-3 border flex flex-col items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-md"
            style={{ background: theme.card, borderColor: theme.border }}
          >
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: theme.primaryGlow, border: '1px solid ' + theme.border }}
            >
              <BookOpen size={21} color={theme.primary} />
            </div>
            <span className="text-[11px] font-black" style={{ color: theme.text }}>{t('home.dockQuran')}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCalendar(true)}
            className="rounded-3xl p-3 border flex flex-col items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-md"
            style={{ background: theme.card, borderColor: theme.border }}
          >
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: theme.primaryGlow, border: '1px solid ' + theme.border }}
            >
              <Calendar size={21} color={theme.primary} />
            </div>
            <span className="text-[11px] font-black whitespace-nowrap" style={{ color: theme.text }}>{t('home.dockCalendar')}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowMosqueFinder(true)}
            className="rounded-3xl p-3 border flex flex-col items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-md"
            style={{ background: theme.card, borderColor: theme.border }}
          >
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: theme.primaryGlow, border: '1px solid ' + theme.border }}
            >
              <Navigation size={21} color={theme.primary} />
            </div>
            <span className="text-[11px] font-black" style={{ color: theme.text }}>{t('home.dockMosque')}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowQibla(true)}
            className="rounded-3xl p-3 border flex flex-col items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-md"
            style={{ background: theme.card, borderColor: theme.border }}
          >
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: 'color-mix(in srgb, ' + theme.accent + ' 20%, transparent)', border: '1px solid ' + theme.accent }}
            >
              <Compass size={21} color={theme.accent} />
            </div>
            <span className="text-[11px] font-black" style={{ color: theme.accent }}>{t('home.dockQibla')}</span>
          </button>
        </div>

        {/* ۴. جدول ستونی اوقات شرعی امروز */}
        <div
          className="rounded-3xl p-4 border shadow-lg"
          style={{ background: theme.card, borderColor: theme.border }}
        >
          <div className="flex items-center justify-between gap-1 mb-3 flex-wrap">
            <span className="text-xs font-black flex items-center gap-1.5" style={{ color: theme.text }}>
              <span>{t('home.prayerTimesTitle')} · {cityDisplayLabel}</span>
            </span>
            <div className="flex items-center gap-2 text-[10px] font-bold">
              <span className="flex items-center gap-1" style={{ color: '#FBBF24' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                <span>{t('home.beforeLabel')}</span>
              </span>
              <span className="flex items-center gap-1" style={{ color: '#34D399' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                <span>{t('home.afterLabel')}</span>
              </span>
            </div>
          </div>

          <div
            className="grid gap-1 text-center"
            style={{ gridTemplateColumns: 'repeat(' + prayerColumns.length + ', minmax(0, 1fr))' }}
          >
            {prayerColumns.map((p) => {
              const isNext = nextPrayer.key === p.key;
              const isBellOn = Boolean(adhanBells[p.key]);
              const Icon = p.icon;
              const compactCols = prayerColumns.length >= 7;
              return (
                <div
                  key={p.key}
                  className={(compactCols ? 'py-2 px-0.5' : 'py-2.5 px-1') + ' rounded-2xl border flex flex-col items-center justify-between gap-1.5'}
                  style={{
                    background: p.isMidnight
                      ? 'rgba(139, 92, 246, 0.10)'
                      : isNext
                      ? theme.primaryGlow
                      : 'rgba(255, 255, 255, 0.03)',
                    borderColor: p.isMidnight
                      ? 'rgba(167, 139, 250, 0.35)'
                      : isNext
                      ? theme.primary
                      : theme.border,
                  }}
                >
                  <span
                    className={(compactCols ? 'text-[9.5px]' : 'text-[11px]') + ' font-black truncate max-w-full'}
                    style={{ color: p.isMidnight ? '#C4B5FD' : theme.text }}
                  >
                    {p.nameLabel}
                  </span>
                  <strong
                    className={(compactCols ? 'text-[10.5px]' : 'text-xs') + ' font-black tracking-tight tabular-nums'}
                    style={{ color: p.isMidnight ? '#DDD6FE' : isNext ? theme.accent : theme.text }}
                  >
                    {formatDigits(p.time)}
                  </strong>
                  <Icon size={13} color={p.isMidnight ? '#A78BFA' : isNext ? theme.accent : theme.primary} />

                  {p.hasAdhan ? (
                    <button
                      type="button"
                      onClick={() => void togglePrayerBell(p.key, p.nameLabel, p.time)}
                      title={p.nameLabel}
                      className="mt-0.5 w-7 h-7 rounded-xl border flex items-center justify-center transition-transform active:scale-90"
                      style={{
                        background: isBellOn
                          ? 'color-mix(in srgb, ' + theme.accent + ' 24%, transparent)'
                          : 'rgba(255,255,255,0.04)',
                        borderColor: isBellOn ? theme.accent : 'rgba(255,255,255,0.1)',
                        color: isBellOn ? theme.accent : theme.textMuted,
                      }}
                    >
                      {isBellOn ? <Bell size={13} /> : <BellOff size={13} />}
                    </button>
                  ) : p.isMidnight ? (
                    <span
                      className="h-7 flex items-center justify-center text-[8.5px] font-bold"
                      style={{ color: '#A78BFA' }}
                      title={t('home.midnightEndNote')}
                    >
                      {t('home.noAdhanTag')}
                    </span>
                  ) : (
                    <span className="h-7 flex items-center justify-center text-[9px] text-muted">—</span>
                  )}
                </div>
              );
            })}
          </div>

          {modulesVis.showMidnightTime !== false && times?.midnight && (
            <div
              className="mt-2.5 pt-2 border-t flex items-center justify-between gap-2 text-[10.5px]"
              style={{ borderColor: theme.border }}
            >
              <span className="flex items-center gap-1.5 font-bold" style={{ color: '#C4B5FD' }}>
                <Moon size={12} color="#A78BFA" />
                <span>{prayerName('midnight')}: {t('home.midnightEndNote')}</span>
              </span>
              <strong className="font-black tabular-nums" style={{ color: '#DDD6FE' }}>
                {formatDigits(times.midnight)}
              </strong>
            </div>
          )}
        </div>

        {/* ۵. تعقیبات و پیشنهاد هوشمند روزانه */}
        {modulesVis.showDeenWidgets !== false && (
          <TawashihAndAdhanReminderSection
            times={times}
            cityNameFa={cityDisplayLabel}
            onToast={showQuickToast}
          />
        )}

        {modulesVis.showContextualTip !== false && (() => {
          const suggestion = getDynamicDailyHourlySuggestion(now);
          const handleOpenSuggestion = () => {
            if (suggestion.actionType === 'surah' && typeof suggestion.surahNumber === 'number') {
              setInitialQuranSurah(suggestion.surahNumber);
              setShowQuranAndMuhasaba(true);
              return;
            }
            if (suggestion.dhikrId) {
              const found = dhikrLibrary.find((d) => d.id === suggestion.dhikrId);
              const target = suggestion.targetCount || found?.count || 100;
              startSession(suggestion.dhikrId, target);
              window.dispatchEvent(new Event('noor-tasbih-session-changed'));
            }
            onNavigate('tasbih');
          };
          return (
            <div
              onClick={handleOpenSuggestion}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleOpenSuggestion();
                }
              }}
              role="button"
              tabIndex={0}
              className="rounded-3xl p-4 border cursor-pointer transition-transform active:scale-[0.99] relative overflow-hidden shadow-lg"
              style={{ background: theme.card, borderColor: theme.border }}
            >
              <ThemePatternWatermark themeId={theme.id} className="opacity-55" />
              <svg className="pointer-events-none absolute left-2 bottom-0 w-28 h-24 opacity-85" viewBox="0 0 120 100" fill="none">
                <circle cx="48" cy="52" r="26" stroke={theme.accent} strokeWidth="5" strokeDasharray="4 7" strokeLinecap="round" />
                <path d="M22 52 L8 68" stroke={theme.primary} strokeWidth="3.5" strokeLinecap="round" />
                <circle cx="22" cy="52" r="4.5" fill={theme.primary} />
              </svg>
              <div className="relative z-10 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles size={14} color={theme.accent} />
                    <span className="text-[11px] font-black" style={{ color: theme.accent }}>{suggestion.badgeFa}</span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-black leading-snug" style={{ color: theme.text }}>
                    {suggestion.titleFa}
                  </h3>
                  <p className="text-[11px] truncate mt-1 font-bold" style={{ color: theme.textMuted }}>
                    {suggestion.arabicFa}
                  </p>
                </div>
                <span
                  className="px-3.5 py-2 rounded-2xl text-xs font-black shrink-0 shadow-md"
                  style={{ background: theme.accent, color: theme.bg }}
                >
                  {suggestion.ctaLabel}
                </span>
              </div>
            </div>
          );
        })()}

        {/* ۶. ردیف دوتایی پایین */}
        {modulesVis.showDailySummary !== false && (
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setShowBiModal(true)}
            className={'rounded-3xl p-3.5 border flex items-center justify-between gap-2 transition-transform active:scale-95 shadow-md ' + (isRtl ? 'text-right' : 'text-left')}
            style={{ background: theme.card, borderColor: theme.border }}
          >
            <div>
              <span className="text-[11px] font-black block" style={{ color: theme.primary }}>{t('home.activityTitle')}</span>
              <strong className="text-lg font-black block mt-0.5" style={{ color: theme.text }}>{formatDigits('4/5')}</strong>
              <span className="text-[10px] block" style={{ color: theme.textMuted }}>{t('home.activitySub')}</span>
            </div>
            <svg width="44" height="44" viewBox="0 0 44 44" className="shrink-0">
              <circle cx="22" cy="22" r="17" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4.5" />
              <circle cx="22" cy="22" r="17" fill="none" stroke={theme.primary} strokeWidth="4.5" strokeLinecap="round" strokeDasharray="106.8" strokeDashoffset="22" transform="rotate(-90 22 22)" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('tasbih')}
            className={'rounded-3xl p-3.5 border flex items-center justify-between gap-2 transition-transform active:scale-95 shadow-md ' + (isRtl ? 'text-right' : 'text-left')}
            style={{ background: theme.card, borderColor: theme.border }}
          >
            <div className="min-w-0">
              <span className="text-[11px] font-black block" style={{ color: theme.accent }}>{t('home.tasbihCardTitle')}</span>
              <strong className="text-base font-black block mt-0.5 truncate" style={{ color: theme.text }}>
                {formatDigits(liveTasbihSession.count)} {t('home.tasbihOf')} {formatDigits(liveTasbihSession.target || 100)}
              </strong>
              <span className="text-[10px] font-bold block" style={{ color: theme.primary }}>{t('home.tasbihContinue')}</span>
            </div>
            <div
              className="w-11 h-11 rounded-full border-2 flex items-center justify-center shrink-0 text-sm"
              style={{ borderColor: theme.primary, background: theme.primaryGlow }}
            >
              📿
            </div>
          </button>
        </div>
        )}
      </div>

      {/* مودال انتخاب شهر جهانی + GPS */}
      {showCityPicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)' }}
          dir={dir}
          onClick={() => setShowCityPicker(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl p-5 border max-h-[82vh] flex flex-col space-y-3"
            style={{ background: theme.surface, borderColor: theme.border }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-app">{t('home.cityPickerTitle')}</h3>
              <button type="button" onClick={() => setShowCityPicker(false)} className="text-xs text-muted">
                {t('common.close')} ✕
              </button>
            </div>

            <button
              type="button"
              onClick={() => void autoDetectLocationNow()}
              className="w-full py-3 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95"
              style={{ background: theme.primary, color: theme.bg }}
            >
              <Navigation size={15} />
              <span>{locatingGps ? t('home.gpsBtnBusy') : t('home.gpsBtnIdle')}</span>
            </button>

            <input
              type="text"
              value={citySearchQuery}
              onChange={(e) => setCitySearchQuery(e.target.value)}
              placeholder={t('home.citySearchPh')}
              className="w-full px-3.5 py-2.5 rounded-2xl border text-xs bg-black/20 text-white outline-none"
              style={{ borderColor: theme.border }}
            />

            <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1" style={{ maxHeight: '46vh' }}>
              {filteredCities.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    applyCitySelection(
                      {
                        id: c.id,
                        name: c.name,
                        nameFa: c.nameFa,
                        nameEs: c.nameEs,
                        lat: c.lat,
                        lng: c.lng,
                        timezone: c.timezone,
                      },
                      false
                    );
                    setShowCityPicker(false);
                    showQuickToast(t('home.toastCitySet') + ' ' + getCityDisplayName(c, lang));
                  }}
                  className={'p-2.5 rounded-2xl border text-xs font-bold transition-all ' + (isRtl ? 'text-right' : 'text-left')}
                  style={{
                    borderColor: c.id === city.id ? theme.primary : theme.border,
                    background: c.id === city.id ? theme.primaryGlow : theme.bg,
                    color: theme.text,
                  }}
                >
                  <span className="block truncate">{getCityDisplayName(c, lang)}</span>
                  <span className="text-[9.5px] text-muted block truncate">{getCountryDisplayName(c, lang)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showQibla && (
        <Suspense fallback={null}><QiblaCompass
          lat={effectiveLat}
          lng={effectiveLng}
          cityName={cityDisplayLabel}
          onClose={() => setShowQibla(false)}
        /></Suspense>
      )}

      {showCalendar && (
        <Suspense fallback={null}><CalendarModal
          cityName={cityDisplayLabel}
          cityLat={effectiveLat}
          cityLng={effectiveLng}
          cityTimezone={activeTimezone}
          onClose={() => setShowCalendar(false)}
        /></Suspense>
      )}

      {showMosqueFinder && (
        <Suspense fallback={null}><MosqueFinderModal
          cityName={cityDisplayLabel}
          defaultLat={effectiveLat}
          defaultLng={effectiveLng}
          onClose={() => setShowMosqueFinder(false)}
        /></Suspense>
      )}

      {showQuranAndMuhasaba && (
        <Suspense fallback={null}><QuranAndMuhasabaModal
          initialSurahNumber={initialQuranSurah}
          onClose={() => {
            setShowQuranAndMuhasaba(false);
            setInitialQuranSurah(undefined);
          }}
        /></Suspense>
      )}

      {showStudioAndTravel && (
        <Suspense fallback={null}><AdhanStudioAndTravelModal
          onClose={() => setShowStudioAndTravel(false)}
        /></Suspense>
      )}
    </div>
  );
}

export default HomeScreen;
