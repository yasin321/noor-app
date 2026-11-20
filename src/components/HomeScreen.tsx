import { TawashihAndAdhanReminderSection, loadTawashihConfig } from '@/components/TawashihAndAdhanReminderSection';
import { rescheduleAll } from '@/lib/reminderService';
import { adhans, playAdhanPreview, stopAdhanPreview, getAdhanDurationMode, getAdhanDurationSeconds } from '@/lib/adhans';
import { QiblaCompass } from '@/components/QiblaCompass';
import { VipAnalyticsModal } from '@/components/VipAnalyticsModal';
import { CompactHeaderWeatherPill } from '@/components/WeatherCuteCard';
import { NastaliqMahdiCrown, CelestialPrayerArcGauge, ThemePatternWatermark, DynamicShrineHorizonArt, VerticalJalaliDayCounterCard } from '@/components/FigmaLuxuryElements';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { MapPin, Clock, Sunrise, Sunset, Moon, Sun, CloudSun, ArrowLeft, Hand, Bell, BellOff, Compass, Sparkles, LocateFixed, Navigation, BookOpen, Sliders, Calendar } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
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
import { VipAndAnalyticsModal } from '@/components/VipAndAnalyticsModal';
import { AdhanStudioAndTravelModal } from '@/components/AdhanStudioAndTravelModal';
import { QuranAndMuhasabaModal } from '@/components/QuranAndMuhasabaModal';
import { MosqueFinderModal } from '@/components/MosqueFinderModal';
import { loadQuranContinuity, loadMosqueAndTravel, addMinutesToTimeStr } from '@/lib/deenIntelligenceStore';
import { logEvent } from '@/lib/logger';
import { QiblaCompassModal } from '@/components/QiblaCompassModal';
import { CalendarModal } from '@/components/CalendarModal';
import { WeatherCuteHeaderWidget } from '@/components/WeatherCuteCard';
import { AppTutorialModal, TUTORIAL_SEEN_KEY } from '@/components/AppTutorialModal';
import { InboxModal } from '@/components/InboxAndBirthdayModal';
import { getUnreadInboxCount, INBOX_UPDATED_EVENT } from '@/lib/inboxService';
import type { Tab } from '@/components/BottomNav';

export interface HomeModulesVisibility {
  showDeenWidgets: boolean;
  showContextualTip: boolean;
  showDailySummary: boolean;
}

const HOME_MODULES_KEY = 'noor_home_modules_visibility_v1';

export function getHomeModulesVisibility(): HomeModulesVisibility {
  try {
    const raw = localStorage.getItem(HOME_MODULES_KEY);
    if (!raw) return { showDeenWidgets: true, showContextualTip: true, showDailySummary: true };
    return { showDeenWidgets: true, showContextualTip: true, showDailySummary: true, ...JSON.parse(raw) };
  } catch {
    return { showDeenWidgets: true, showContextualTip: true, showDailySummary: true };
  }
}

export function setHomeModulesVisibility(v: HomeModulesVisibility): void {
  try {
    localStorage.setItem(HOME_MODULES_KEY, JSON.stringify(v));
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

export function LegacyHomeScreenUnused({ onNavigate }: { onNavigate?: (t: Tab) => void }) {
  const { theme } = useTheme();
  const { profile, user, updateProfile } = useAuth();
  const [times, setTimes] = useState<PrayerTimes | null>(null);
  const [next, setNext] = useState<{ key: string; nameFa: string; time: string; remaining: string; progress: number } | null>(null);
  const [now, setNow] = useState(new Date());
  const [stats, setStats] = useState({ total: 0, rounds: 0 });
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [enabledAlarms, setEnabledAlarms] = useState<Record<string, boolean>>({});
  const [statusToast, setStatusToast] = useState<string | null>(null);
  const [showQibla, setShowQibla] = useState(false);
  const [showMosqueFinder, setShowMosqueFinder] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showBiModal, setShowBiModal] = useState(false);
  const [showQuickGuide, setShowQuickGuide] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showStudioModal, setShowStudioModal] = useState(false);
  const [showQuranModal, setShowQuranModal] = useState(false);
  const [intelTick, setIntelTick] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [guestCityId, setGuestCityIdState] = useState(getGuestCityId());
  const [modulesVis] = useState<HomeModulesVisibility>(() => getHomeModulesVisibility());
  const [nightCfg, setNightCfg] = useState<NightPrayerConfig>(() => getNightPrayerConfig());

  useEffect(() => {
    try {
      const seen = localStorage.getItem(TUTORIAL_SEEN_KEY);
      if (!seen) {
        localStorage.setItem(TUTORIAL_SEEN_KEY, 'true');
      }
    } catch {}
  }, []);

  const cityId = profile?.city_id ?? guestCityId;
  const city = useMemo(() => getCityById(cityId), [cityId]);
  const method =
    profile?.calculation_method ??
    (() => {
      try {
        return localStorage.getItem('noor_guest_calc_method') || 'tehran';
      } catch {
        return 'tehran';
      }
    })();
  const todayDate = getLocalDateString(now, city.timezone);

  useEffect(() => {
    const refreshNow = () => {
      setNow(new Date());
      setNightCfg(getNightPrayerConfig());
    };
    const onNightChanged = () => setNightCfg(getNightPrayerConfig());
    window.addEventListener('noor-night-prayer-changed', onNightChanged);
    const onTravelChanged = () => {
      setGuestCityIdState(getGuestCityId());
      setIntelTick((t) => t + 1);
    };
    window.addEventListener('noor-travel-mode-changed', onTravelChanged);
    const interval = setInterval(refreshNow, 15000);
    document.addEventListener('visibilitychange', refreshNow);
    window.addEventListener('focus', refreshNow);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshNow);
      window.removeEventListener('focus', refreshNow);
      window.removeEventListener('noor-night-prayer-changed', onNightChanged);
      window.removeEventListener('noor-travel-mode-changed', onTravelChanged);
    };
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchTodayStats(user.id).then((onlineStats) => {
        const localTotal = getTodayTotal();
        const localRounds = getTodayRounds();
        setStats({
          total: Math.max(onlineStats.total, localTotal),
          rounds: Math.max(onlineStats.rounds, localRounds),
        });
      });
    } else {
      setStats({ total: getTodayTotal(), rounds: getTodayRounds() });
    }
    const session = getSession();
    setHasActiveSession(session.count > 0 || session.completed > 0);
  }, [todayDate, user?.id]);

  useEffect(() => {
    const exactGps = getCustomGpsCoords();
    const calcLat = exactGps ? exactGps.lat : city.lat;
    const calcLng = exactGps ? exactGps.lng : city.lng;
    const t = calculatePrayerTimes(now, calcLat, calcLng, city.timezone, method);
    t.location = city.nameFa;
    setTimes(t);

    const all = loadReminders();
    const map: Record<string, boolean> = {};
    const prayerMap: Record<string, { title: string; time: string }> = {
      fajr: { title: 'اذان صبح (' + city.nameFa + ')', time: t.fajr },
      dhuhr: { title: 'اذان ظهر (' + city.nameFa + ')', time: t.dhuhr },
      asr: { title: 'وقت عصر (' + city.nameFa + ')', time: t.asr },
      maghrib: { title: 'اذان مغرب (' + city.nameFa + ')', time: t.maghrib },
      isha: { title: 'وقت عشاء (' + city.nameFa + ')', time: t.isha },
    };

    for (const [key, info] of Object.entries(prayerMap)) {
      const remId = 'prayer_auto_' + key;
      const existing = all.find((r) => r.id === remId);
      map[key] = Boolean(existing?.enabled);
      if (existing && existing.enabled && existing.time !== info.time) {
        const updated: LocalReminder = {
          ...existing,
          title: info.title,
          time: info.time,
          updatedAt: new Date().toISOString(),
        };
        saveReminder(updated);
        void scheduleReminder(updated, true);
      }
    }

    for (const r of all) {
      if (r.id.startsWith('pre_adhan_') && r.enabled) {
        const m = r.id.match(/^pre_adhan_([a-z]+)_(\d+)/);
        if (m) {
          const pKey = m[1];
          const preMin = Number(m[2]);
          const basePrayer = prayerMap[pKey];
          if (basePrayer) {
            const expectedTime = addMinutesToTimeStr(basePrayer.time, -preMin);
            if (r.time !== expectedTime) {
              const updatedPre = { ...r, time: expectedTime, updatedAt: new Date().toISOString() };
              saveReminder(updatedPre);
              void scheduleReminder(updatedPre, true);
            }
          }
        }
      }
    }
    setEnabledAlarms(map);
  }, [city, method, todayDate]);

  useEffect(() => {
    if (times) {
      const n = getNextPrayer(times, city.timezone);
      if (n) {
        const ordered = [
          { key: 'fajr', time: times.fajr },
          { key: 'dhuhr', time: times.dhuhr },
          { key: 'asr', time: times.asr },
          { key: 'maghrib', time: times.maghrib },
          { key: 'isha', time: times.isha },
        ];
        const index = ordered.findIndex((p) => p.key === n.key);
        const previous = ordered[(index - 1 + ordered.length) % ordered.length];
        const nextMinute = timeToMinutes(n.time);
        const previousMinute = timeToMinutes(previous.time);
        const clockParts = new Intl.DateTimeFormat('en-GB', {
          timeZone: city.timezone,
          hour: '2-digit',
          minute: '2-digit',
          hourCycle: 'h23',
        }).formatToParts(now);
        const hour = Number(clockParts.find((p) => p.type === 'hour')?.value ?? 0);
        const minute = Number(clockParts.find((p) => p.type === 'minute')?.value ?? 0);
        const nowMinute = hour * 60 + minute;
        let remaining = nextMinute - nowMinute;
        if (remaining < 0) remaining += 1440;
        let interval = nextMinute - previousMinute;
        if (interval <= 0) interval += 1440;
        const progress =
          Number.isFinite(interval) && interval > 0
            ? Math.max(0, Math.min(100, ((interval - remaining) / interval) * 100))
            : 0;
        setNext({ key: n.key, nameFa: n.nameFa, time: n.time, remaining: n.remaining, progress });
        if (Capacitor.getPlatform() === 'android' && typeof NoorAlarm.updatePrayerWidget === 'function') {
                const npSafe = getNextPrayer(times);
      const npName = npSafe?.nameFa ?? 'اذان صبح';
      const npTime = npSafe?.time ?? times.fajr;
      const npRem = npSafe?.remaining ?? '--';
      void NoorAlarm.updatePrayerWidget({
        titleText: '📍 افق ' + city.nameFa,
        nextPrayerText: `${npName}: ساعت ${toFaDigits(npTime)}`,
        subtitleText: `به افق ${city.nameFa} (${toFaDigits(npRem)} مانده)`,
        fajr: toFaDigits(times.fajr),
        sunrise: toFaDigits(times.sunrise),
        dhuhr: toFaDigits(times.dhuhr),
        maghrib: toFaDigits(times.maghrib),
        midnight: toFaDigits(times.midnight),
      });
        }
      }
    }
  }, [times, now, city.timezone]);

  const showToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 3200);
  };

  const detectNearestCity = async () => {
    const applyCoords = async (latitude: number, longitude: number) => {
      clearReverseGeocodeCache();
      clearCustomGpsCoords();
      let nearest = CITIES[0];
      let minDist = Infinity;
      for (const c of CITIES) {
        const d = Math.hypot(c.lat - latitude, c.lng - longitude);
        if (d < minDist) {
          minDist = d;
          nearest = c;
        }
      }
      const addrRes = await reverseGeocodeFast(latitude, longitude);
      const exactLabel = addrRes.formattedAddress || nearest.nameFa;
      saveCustomGpsCoords(latitude, longitude, exactLabel);
      if (profile) {
        void updateProfile({ city_id: nearest.id });
      } else {
        setGuestCityId(nearest.id);
        setGuestCityIdState(nearest.id);
      }
      setIntelTick((t) => t + 1);
      showToast('📍 موقعیت دقیق شما: «' + exactLabel + '» (افق ' + nearest.nameFa + ')');
    };

    showToast('🛰️ در حال دریافت موقعیت دقیق شما از GPS و نقشه نشان...');
    if (Capacitor.getPlatform() === 'android' && typeof NoorAlarm.requestAndGetLocation === 'function') {
      try {
        const res = await NoorAlarm.requestAndGetLocation();
        if (res.hasCoords && typeof res.lat === 'number' && typeof res.lng === 'number') {
          await applyCoords(res.lat, res.lng);
          return;
        }
      } catch {}
    }

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { void applyCoords(pos.coords.latitude, pos.coords.longitude); },
        () => {
          navigator.geolocation.getCurrentPosition(
            (pos2) => { void applyCoords(pos2.coords.latitude, pos2.coords.longitude); },
            () => showToast('لطفاً مکان‌یاب (Location) گوشی را روشن کنید.'),
            { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 }
          );
        },
        { enableHighAccuracy: true, timeout: 4500, maximumAge: 30000 }
      );
    } else {
      showToast('از بخش تنظیمات، شهر خود را انتخاب کنید.');
    }
  };

  const togglePrayerAdhanAlarm = async (key: string, nameFa: string, timeStrVal: string) => {
    if (key === 'sunrise') return;
    const remId = 'prayer_auto_' + key;
    const currentlyEnabled = Boolean(enabledAlarms[key]);
    const nextState = !currentlyEnabled;

    if (nextState) {
      let perm = await checkPermission();
      if (perm !== 'granted') {
        perm = await requestPermission();
      }
      if (perm !== 'granted') {
        showToast('لطفاً ابتدا مجوز اعلان را تایید کنید تا آلارم اذان فعال شود.');
        return;
      }
    }

    const nowIso = new Date().toISOString();
    const reminder: LocalReminder = {
      id: remId,
      title: 'اذان ' + nameFa + ' به افق ' + city.nameFa,
      body: 'حَیَّ عَلَی الصَّلَاة — وقت فضیلت نماز ' + nameFa + ' فرا رسیده است',
      time: timeStrVal,
      days: [0, 1, 2, 3, 4, 5, 6],
      enabled: nextState,
      dhikrId: null,
      type: 'recurring',
      date: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    saveReminder(reminder);

    if (nextState) {
      const res = await scheduleReminder(reminder, true);
      logEvent(res.success ? 'info' : 'warn', 'HomeScreen', 'تغییر وضعیت آلارم اذان ' + nameFa, {
        enabled: true,
        time: timeStrVal,
        success: res.success,
        error: res.error,
      });
      if (res.success) {
        setEnabledAlarms((prev) => ({ ...prev, [key]: true }));
        showToast('🔔 آلارم اذان ' + nameFa + ' (' + timeStrVal + ') با صدای مؤذن انتخابی شما فعال شد');
      } else {
        reminder.enabled = false;
        saveReminder(reminder);
        showToast(res.error ?? 'خطا در فعال‌سازی آلارم اذان');
      }
    } else {
      await cancelReminder(remId);
      logEvent('info', 'HomeScreen', 'آلارم اذان ' + nameFa + ' غیرفعال شد');
      setEnabledAlarms((prev) => ({ ...prev, [key]: false }));
      showToast('آلارم اذان ' + nameFa + ' خاموش شد');
    }
  };

  if (!times) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
      {/* پس‌زمینه پانورامای حرم و افق شهر ۲۰۲۶ */}
      <DynamicShrineHorizonArt cityName={city.nameFa} themeId={theme.id} nextPrayerKey={times ? (getNextPrayer(times)?.key ?? 'fajr') : 'fajr'} />
        <div className="animate-pulse-ring w-14 h-14 rounded-full" style={{ background: theme.primary, opacity: 0.3 }} />
        <NastaliqMahdiCrown onOpenGuide={() => setShowQuickGuide(true)} />
        {showQuickGuide && <AppTutorialModal onClose={() => setShowQuickGuide(false)} />}
        {showBiModal && <VipAnalyticsModal onClose={() => setShowBiModal(false)} />}
      </div>
    );
  }

  const prayers = [
    { key: 'fajr', nameFa: 'صبح', time: times.fajr },
    { key: 'sunrise', nameFa: 'طلوع', time: times.sunrise },
    { key: 'dhuhr', nameFa: 'ظهر', time: times.dhuhr },
    { key: 'asr', nameFa: 'عصر', time: times.asr },
    { key: 'maghrib', nameFa: 'مغرب', time: times.maghrib },
    { key: 'isha', nameFa: 'عشاء', time: times.isha },
  ];

  const timeStr = now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  const session = getSession();
  const activeDhikr = dhikrLibrary.find((d) => d.id === session.dhikrId);
  const HeroIcon = prayerIcons[next?.key ?? 'isha'] ?? Moon;
  const spiritualTip = getContextualSpiritualTip(now);

  return (
    <div className="w-full max-w-xl mx-auto px-3.5 pt-4 pb-28 animate-fade-in">
      {showMosqueFinder && (
        <MosqueFinderModal
          cityName={city.nameFa}
          defaultLat={city.lat}
          defaultLng={city.lng}
          onClose={() => setShowMosqueFinder(false)}
          onMosqueSelected={() => setIntelTick((t) => t + 1)}
        />
      )}
      {showStudioModal && (
        <AdhanStudioAndTravelModal
          onClose={() => setShowStudioModal(false)}
          onChanged={() => { setGuestCityIdState(getGuestCityId()); setIntelTick((t) => t + 1); }}
        />
      )}
      {showQuranModal && (
        <QuranAndMuhasabaModal
          initialMode="quran"
          onClose={() => setShowQuranModal(false)}
          onUpdated={() => setIntelTick((t) => t + 1)}
        />
      )}
      {showAnalyticsModal && <VipAndAnalyticsModal onClose={() => setShowAnalyticsModal(false)} />}
      {showCalendar && (
        <CalendarModal
          cityLat={city.lat}
          cityLng={city.lng}
          cityTimezone={city.timezone}
          cityName={city.nameFa}
          onClose={() => setShowCalendar(false)}
        />
      )}
      {showQibla && (
        <QiblaCompassModal
          cityName={city.nameFa}
          lat={city.lat}
          lng={city.lng}
          onClose={() => setShowQibla(false)}
        />
      )}
      {showTutorial && <AppTutorialModal onClose={() => setShowTutorial(false)} />}

      {statusToast && (
        <div
          className="fixed top-4 inset-x-5 z-50 rounded-2xl px-4 py-3 text-xs font-bold text-center shadow-xl animate-fade-in"
          style={{ background: theme.primary, color: theme.bg }}
        >
          {statusToast}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mb-5">
        <div className="min-w-0">
          <h1 className="text-2xl font-black text-app truncate">
            {profile?.display_name ? profile.display_name : 'نور'}
          </h1>
          <button
            type="button"
            onClick={() => setShowCalendar(true)}
            className="mt-1 flex items-center gap-1 text-xs font-bold"
            style={{ color: theme.primary }}
          >
            <Calendar size={13} />
            <span>{getJalaliWeekday(now)}، {toJalaliShort(now)}</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowMosqueFinder(true)}
            aria-label="مسجدیاب نشان"
            className="px-2.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 border shadow-sm"
            style={{
              borderColor: theme.accent,
              color: theme.accent,
              background: 'color-mix(in srgb, ' + theme.accent + ' 14%, transparent)',
            }}
          >
            <Navigation size={13} />
            <span>مسجدیاب</span>
          </button>
            <button
              type="button"
              onClick={() => setShowBiModal(true)}
              className="px-2.5 py-1.5 rounded-2xl border flex items-center gap-1 text-xs font-bold transition-transform active:scale-95"
              style={{ background: "rgba(168, 85, 247, 0.18)", borderColor: "rgba(168, 85, 247, 0.45)", color: "#E9D5FF" }}
              title="داشبورد تحلیلی گزارش معنوی، ماتریس حرارتی سالانه و دفترچه قضا"
            >
              <span>📊 آمار و VIP</span>
            </button>
            <CompactHeaderWeatherPill
              cityName={city.nameFa}
              lat={city.lat}
              lng={city.lng}
              onOpenCalendar={() => setShowCalendar(true)}
            />

          <button
            type="button"
            onClick={() => setShowQibla(true)}
            aria-label="قبله‌نما"
            className="px-2.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 border"
            style={{
              borderColor: theme.border,
              color: theme.primary,
              background: 'color-mix(in srgb, ' + theme.primary + ' 12%, transparent)',
            }}
          >
            <Compass size={14} />
            <span>قبله‌نما</span>
          </button>

          <button
            type="button"
            onClick={detectNearestCity}
            aria-label="موقعیت"
            title="تشخیص خودکار شهر"
            className="px-2.5 py-2 rounded-xl flex items-center gap-1 text-xs font-medium border"
            style={{ borderColor: theme.border, color: theme.text }}
          >
            <MapPin size={14} color={theme.primary} />
            <span>{times.location}</span>
            <LocateFixed size={11} className="opacity-60" />
          </button>
        </div>
      </div>

      <section
        className="relative overflow-hidden rounded-[1.7rem] p-5 mb-4 animate-slide-up"
        aria-label="نماز بعدی"
        style={{
          background: 'radial-gradient(circle at 90% 8%, color-mix(in srgb, ' + theme.accent + ' 22%, transparent), transparent 42%), linear-gradient(145deg, ' + (theme.surfaceAlt ?? theme.surface) + ', ' + theme.surface + ' 68%, ' + theme.bg + ')',
          border: '1px solid color-mix(in srgb, ' + theme.primary + ' 28%, ' + theme.border + ')',
          boxShadow: '0 14px 34px color-mix(in srgb, ' + theme.primary + ' 10%, transparent)',
        }}
      >
        <div className="relative flex items-center justify-between gap-3 mb-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: theme.accent }} />
              <p className="text-muted text-xs font-medium">{toFaDigits(times.hijriDate)} · ساعت {timeStr}</p>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-primary">{next?.nameFa ?? '—'}</h2>
            <p className="text-muted text-xs mt-1">وقت شرعی بعدی به افق {times.location}</p>
          </div>
          <div
            className="w-[74px] h-[74px] rounded-[1.5rem] flex items-center justify-center flex-shrink-0"
            style={{
              background: 'color-mix(in srgb, ' + theme.primary + ' 14%, transparent)',
              border: '1px solid color-mix(in srgb, ' + theme.primary + ' 24%, transparent)',
            }}
          >
            <HeroIcon size={36} strokeWidth={1.6} color={theme.accent} />
          </div>
        </div>
        <div
          className="relative flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
          style={{
            background: 'color-mix(in srgb, black 12%, transparent)',
            border: '1px solid color-mix(in srgb, ' + theme.border + ' 75%, transparent)',
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Clock size={16} color={theme.accent} />
            <p className="text-accent text-sm font-semibold truncate">
              {next?.remaining ? 'تا اذان ' + next.nameFa + ': ' + next.remaining : 'در حال محاسبه…'}
            </p>
          </div>
          <div className="text-left flex-shrink-0">
            <p className="text-muted text-[10px] mb-0.5">وقت اذان</p>
            <p className="text-lg font-bold text-app tabular-nums" dir="ltr">
              {next?.time ?? '--:--'}
            </p>
          </div>
        </div>
        <div className="relative mt-3" aria-label="میزان نزدیک شدن به نماز بعدی">
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: 'color-mix(in srgb, ' + theme.primary + ' 12%, transparent)' }}
          >
            <div
              className="h-full rounded-full transition-[width] duration-1000 ease-linear"
              style={{
                width: (next?.progress ?? 0) + '%',
                background: 'linear-gradient(90deg, ' + theme.primary + ', ' + theme.accent + ')',
              }}
            />
          </div>
        </div>
      </section>

      {modulesVis.showDeenWidgets &&
        (() => {
          void intelTick;
          const quran = loadQuranContinuity();
          const mt = loadMosqueAndTravel();
          const nextJamaat =
            next?.key === 'fajr' || next?.key === 'dhuhr' || next?.key === 'maghrib'
              ? addMinutesToTimeStr(next.time, mt.jamaatOffsetsMinutes[next.key])
              : null;

          return (
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <button
                type="button"
                onClick={() => setShowStudioModal(true)}
                className="card-flat p-3 text-right flex flex-col justify-between"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-[11px] font-bold text-primary">🔔 تواشیح قبل اذان و مسجد</span>
                  <Sliders size={13} color={theme.primary} />
                </div>
                <p className="text-xs font-bold text-app truncate">
                  {mt.travelModeEnabled ? '✈️ حالت سفر (نماز شکسته)' : mt.selectedMosqueName}
                </p>
                <p className="text-[10px] text-muted mt-0.5 truncate">
                  {nextJamaat ? 'جماعت ' + (next?.nameFa ?? '') + ': ' + nextJamaat : 'تواشیح قبل اذان، مسجد و سفر'}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setShowQuranModal(true)}
                className="card-flat p-3 text-right flex flex-col justify-between"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-[11px] font-bold text-accent">📖 مصحف و صوت قرآن</span>
                  <BookOpen size={13} color={theme.accent} />
                </div>
                <p className="text-xs font-bold text-app truncate">{quran.surahNameFa}</p>
                <p className="text-[10px] text-muted mt-0.5 truncate">
                  آیه {toFaDigits(quran.ayahNumber)} · ۱۱۴ سوره + ترتیل صوتی
                </p>
              </button>
            </div>
          );
        })()}

      {modulesVis.showContextualTip && (
        <div
          className="card-flat p-4 mb-4 flex items-center justify-between gap-3 cursor-pointer"
          style={{ borderColor: 'color-mix(in srgb, ' + theme.primary + ' 30%, ' + theme.border + ')' }}
          onClick={() => {
            const targetDhikr = dhikrLibrary.find((d) => d.id === spiritualTip.dhikrId);
            if (targetDhikr && onNavigate) {
              startSession(targetDhikr.id, targetDhikr.count);
              onNavigate('tasbih');
            }
          }}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles size={13} color={theme.accent} />
              <span className="text-[11px] font-bold" style={{ color: theme.accent }}>
                {spiritualTip.badge}
              </span>
            </div>
            <p className="text-app font-bold text-xs truncate">{spiritualTip.title}</p>
            <p className="text-muted text-[11px] mt-0.5 truncate">{spiritualTip.subtitle}</p>
          </div>
          <ArrowLeft size={18} color={theme.primary} className="shrink-0" />
        </div>
      )}

      {hasActiveSession && onNavigate && activeDhikr && (
        <button
          onClick={() => onNavigate('tasbih')}
          className="w-full card-flat p-4 mb-4 flex items-center justify-between animate-slide-up"
          aria-label="ادامه شمارش"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'color-mix(in srgb, ' + theme.primary + ' 15%, transparent)' }}
            >
              <Hand size={20} color={theme.primary} />
            </div>
            <div className="text-right">
              <p className="text-app font-bold text-sm">ادامه شمارش تسبیح</p>
              <p className="text-muted text-xs mt-0.5">
                {activeDhikr.arabic} — {toFaDigits(session.count)}/{toFaDigits(session.target)}
              </p>
            </div>
          </div>
          <ArrowLeft size={18} color={theme.primary} />
        </button>
      )}

      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-muted text-[11px]">اوقات شرعی امروز</span>
        <span className="text-muted text-[11px]">لمس 🔔 = پخش خودکار اذان</span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-4">
        {prayers.map((p) => {
          const Icon = prayerIcons[p.key] ?? Sun;
          const isNext = next?.nameFa === p.nameFa && p.key !== 'sunrise';
          const isAlarmOn = Boolean(enabledAlarms[p.key]);
          const canAlarm = p.key !== 'sunrise';

          return (
            <div
              key={p.key}
              className="card-flat min-w-0 p-2.5 flex items-center justify-between gap-1.5"
              style={{ borderColor: isAlarmOn ? theme.primary : undefined }}
            >
              <div className="flex min-w-0 items-center gap-2">
                <div
                  className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center"
                  style={{
                    background: isNext ? theme.primary : 'color-mix(in srgb, ' + theme.primary + ' 10%, transparent)',
                  }}
                >
                  <Icon size={16} color={isNext ? theme.bg : theme.primary} />
                </div>
                <div className="min-w-0">
                  <span className="text-app font-medium text-xs whitespace-nowrap block">{p.nameFa}</span>
                  {(() => {
                    const mtState = loadMosqueAndTravel();
                    if (mtState.travelModeEnabled && mtState.isQasrPrayer && (p.key === 'dhuhr' || p.key === 'asr' || p.key === 'isha')) {
                      return <span className="text-[9px] font-bold text-accent block">۲ رکعت (شکسته)</span>;
                    }
                    return null;
                  })()}
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-app font-bold text-xs tabular-nums" dir="ltr">
                  {p.time}
                </span>
                {canAlarm && (
                  <button
                    type="button"
                    aria-label={isAlarmOn ? 'خاموش کردن آلارم اذان ' + p.nameFa : 'فعال کردن آلارم اذان ' + p.nameFa}
                    onClick={() => void togglePrayerAdhanAlarm(p.key, p.nameFa, p.time)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                    style={{
                      background: isAlarmOn
                        ? theme.primary
                        : 'color-mix(in srgb, ' + theme.textMuted + ' 15%, transparent)',
                      color: isAlarmOn ? theme.bg : theme.textMuted,
                    }}
                  >
                    {isAlarmOn ? <Bell size={13} /> : <BellOff size={13} />}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

            {nightCfg.enabled && times && (() => {
        const npWin = calculateNightPrayerWindow(times, nightCfg);
        const isNightAlarmOn = Boolean(enabledAlarms['tahajjud']) || nightCfg.alarmEnabled;
        return (
          <div
            className="card-flat p-4 mb-4 border transition-all animate-fade-in"
            style={{
              borderColor: isNightAlarmOn ? theme.accent : theme.primary,
              background: 'radial-gradient(circle at top left, color-mix(in srgb, ' + theme.accent + ' 16%, transparent), ' + theme.surface + ')',
            }}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Moon size={18} color={theme.accent} />
                <div>
                  <h3 className="text-xs font-black text-app">🌙 نماز شب</h3>
                  <p className="text-[11px] text-muted mt-0.5">بهترین زمان (ثلث آخر شب به افق {times.location}): {toFaDigits(npWin.descriptionFa)}</p>
                </div>
              </div>
              <button
                type="button"
                aria-label={isNightAlarmOn ? 'خاموش کردن یادآور نماز شب' : 'فعال کردن یادآور نماز شب'}
                onClick={async () => {
                  const nextAlarmState = !isNightAlarmOn;
                  const nextCfg = { ...nightCfg, alarmEnabled: nextAlarmState };
                  setNightCfg(nextCfg);
                  saveNightPrayerConfig(nextCfg);
                  await togglePrayerAdhanAlarm('tahajjud', 'نماز شب', npWin.recommendedAlarmTime);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1"
                style={{
                  background: isNightAlarmOn ? theme.accent : 'color-mix(in srgb, ' + theme.textMuted + ' 18%, transparent)',
                  color: isNightAlarmOn ? theme.bg : theme.textMuted,
                }}
              >
                {isNightAlarmOn ? <Bell size={13} /> : <BellOff size={13} />}
                <span>{isNightAlarmOn ? 'یادآور فعال (' + toFaDigits(npWin.recommendedAlarmTime) + ')' : 'کوک یادآور'}</span>
              </button>
            </div>
            <div className="flex items-center justify-between gap-2 pt-2 border-t" style={{ borderColor: theme.border }}>
              <div className="flex gap-1">
                {([
                  { mode: 'last_third_start' as const, label: 'آغاز ثلث آخر' },
                  { mode: 'before_fajr_45' as const, label: '۴۵د قبل صبح' },
                  { mode: 'before_fajr_30' as const, label: '۳۰د قبل صبح' },
                ]).map((opt) => (
                  <button
                    key={opt.mode}
                    type="button"
                    onClick={async () => {
                      const nextCfg = { ...nightCfg, timingMode: opt.mode };
                      setNightCfg(nextCfg);
                      saveNightPrayerConfig(nextCfg);
                      const newWin = calculateNightPrayerWindow(times, nextCfg);
                      if (isNightAlarmOn) {
                        const nowIso = new Date().toISOString();
                        const rem: LocalReminder = {
                          id: 'prayer_auto_tahajjud',
                          title: '🌙 وقت فضیلت نماز شب به افق ' + city.nameFa,
                          body: 'وَمِنَ اللَّيْلِ فَتَهَجَّدْ بِهِ نَافِلَةً لَكَ — وقت خلوت سحرگاهی و نماز شب',
                          time: newWin.recommendedAlarmTime,
                          days: [0, 1, 2, 3, 4, 5, 6],
                          enabled: true,
                          dhikrId: null,
                          type: 'recurring',
                          date: null,
                          createdAt: nowIso,
                          updatedAt: nowIso,
                        };
                        saveReminder(rem);
                        await scheduleReminder(rem, true);
                        showToast('🌙 ساعت یادآور نماز شب روی ' + toFaDigits(newWin.recommendedAlarmTime) + ' تنظیم شد.');
                      }
                    }}
                    className="px-2 py-1 rounded-lg text-[10px] font-bold"
                    style={{
                      background: nightCfg.timingMode === opt.mode ? theme.primary : 'transparent',
                      color: nightCfg.timingMode === opt.mode ? theme.bg : theme.textMuted,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  void snoozeReminderByMinutes('نماز شب', 'یادآور مجدد وقت فضیلت نماز شب', 10);
                  showToast('💤 یادآور نماز شب برای ۱۰ دقیقه دیگر (Snooze) تنظیم شد.');
                }}
                className="text-[10px] font-bold text-accent underline"
              >
                💤 تعویق ۱۰ دقیقه‌ای
              </button>
            </div>
          </div>
        );
      })()}

      {modulesVis.showDailySummary && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-app font-bold text-xs">خلاصه فعالیت امروز</h3>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('settings')}
                className="text-[11px] font-bold text-primary"
              >
                مشاهده کارنامه کامل ←
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{stats.total.toLocaleString('fa-IR')}</p>
              <p className="text-muted text-xs mt-0.5">ذکر امروز</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-accent">{stats.rounds.toLocaleString('fa-IR')}</p>
              <p className="text-muted text-xs mt-0.5">دور کامل</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const NOOR_UI_BUILD_STAMP = '2026-v3-1794029488910';





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
    window.addEventListener('noor-calc-method-changed', syncMethod);
    window.addEventListener('noor-adhan-config-changed', syncAdhanCfg);
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
  const [showQuickGuide, setShowQuickGuide] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [unreadInboxCount, setUnreadInboxCount] = useState(() => getUnreadInboxCount());
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [modulesVis] = useState(() => getHomeModulesVisibility());

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

      const selectedAdhanId = localStorage.getItem('noor_guest_adhan_id') || 'moazenzadeh_ardabili';
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
      const selectedAdhanId = localStorage.getItem('noor_guest_adhan_id') || 'moazenzadeh_ardabili';
      void playAdhanPreview(adhans.find((a) => a.id === selectedAdhanId) || adhans[0]);
      setTimeout(() => stopAdhanPreview(), 7000);
      showQuickToast(t('home.toastBellOn') + ' ' + labelStr + ' (' + formatDigits(timeStr) + ')');
    } else {
      stopAdhanPreview();
      showQuickToast(t('home.toastBellOff') + ' ' + labelStr);
    }
  };

  const prayerColumns = [
    { key: 'fajr', nameLabel: prayerName('fajr'), time: times?.fajr ?? '04:45', icon: Sunrise, hasAdhan: true },
    { key: 'sunrise', nameLabel: prayerName('sunrise'), time: times?.sunrise ?? '06:03', icon: Sun, hasAdhan: false },
    { key: 'dhuhr', nameLabel: prayerName('dhuhr'), time: times?.dhuhr ?? '11:17', icon: Sun, hasAdhan: true },
    ...((modulesVis as any).showAsrPrayer !== false
      ? [{ key: 'asr', nameLabel: prayerName('asr'), time: times?.asr ?? '14:06', icon: Sunset, hasAdhan: true }]
      : []),
    { key: 'maghrib', nameLabel: prayerName('maghrib'), time: times?.maghrib ?? '16:44', icon: Sunset, hasAdhan: true },
    ...((modulesVis as any).showIshaPrayer !== false
      ? [{ key: 'isha', nameLabel: prayerName('isha'), time: times?.isha ?? '17:36', icon: Moon, hasAdhan: true }]
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
          <NastaliqMahdiCrown onOpenGuide={() => setShowQuickGuide(true)} />

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

      {showQuickGuide && <AppTutorialModal onClose={() => setShowQuickGuide(false)} />}
      {showInbox && <InboxModal onClose={() => setShowInbox(false)} onNavigate={onNavigate} />}
      {showBiModal && <VipAnalyticsModal onClose={() => setShowBiModal(false)} />}

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
            className="grid gap-1.5 text-center"
            style={{ gridTemplateColumns: 'repeat(' + prayerColumns.length + ', minmax(0, 1fr))' }}
          >
            {prayerColumns.map((p) => {
              const isNext = nextPrayer.key === p.key;
              const isBellOn = Boolean(adhanBells[p.key]);
              const Icon = p.icon;
              return (
                <div
                  key={p.key}
                  className="py-2.5 px-1 rounded-2xl border flex flex-col items-center justify-between gap-1.5"
                  style={{
                    background: isNext ? theme.primaryGlow : 'rgba(255, 255, 255, 0.03)',
                    borderColor: isNext ? theme.primary : theme.border,
                  }}
                >
                  <span className="text-[11px] font-black" style={{ color: theme.text }}>{p.nameLabel}</span>
                  <strong
                    className="text-xs font-black tracking-tight"
                    style={{ color: isNext ? theme.accent : theme.text }}
                  >
                    {formatDigits(p.time)}
                  </strong>
                  <Icon size={14} color={isNext ? theme.accent : theme.primary} />

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
                  ) : (
                    <span className="h-7 flex items-center justify-center text-[9px] text-muted">—</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ۵. تعقیبات و پیشنهاد هوشمند روزانه */}
        <TawashihAndAdhanReminderSection
          times={times}
          cityNameFa={cityDisplayLabel}
          onToast={showQuickToast}
        />

        {(() => {
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
        <QiblaCompass
          lat={effectiveLat}
          lng={effectiveLng}
          cityName={cityDisplayLabel}
          onClose={() => setShowQibla(false)}
        />
      )}

      {showCalendar && (
        <CalendarModal
          cityName={cityDisplayLabel}
          cityLat={effectiveLat}
          cityLng={effectiveLng}
          cityTimezone={activeTimezone}
          onClose={() => setShowCalendar(false)}
        />
      )}

      {showMosqueFinder && (
        <MosqueFinderModal
          cityName={cityDisplayLabel}
          defaultLat={effectiveLat}
          defaultLng={effectiveLng}
          onClose={() => setShowMosqueFinder(false)}
        />
      )}

      {showQuranAndMuhasaba && (
        <QuranAndMuhasabaModal
          initialSurahNumber={initialQuranSurah}
          onClose={() => {
            setShowQuranAndMuhasaba(false);
            setInitialQuranSurah(undefined);
          }}
        />
      )}

      {showStudioAndTravel && (
        <AdhanStudioAndTravelModal
          onClose={() => setShowStudioAndTravel(false)}
        />
      )}
    </div>
  );
}

export default HomeScreen;
