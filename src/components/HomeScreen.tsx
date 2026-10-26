import { useState, useEffect, useMemo } from 'react';
import { MapPin, Clock, Sunrise, Sunset, Moon, Sun, CloudSun, ArrowLeft, Hand, Bell, BellOff, Compass, HelpCircle, Sparkles, LocateFixed } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { calculatePrayerTimes, getNextPrayer, getLocalDateString, timeToMinutes, PrayerTimes } from '@/lib/prayerTimes';
import { CITIES, getCityById, getGuestCityId, setGuestCityId } from '@/lib/cities';
import { getTodayTotal, getTodayRounds, getSession, fetchTodayStats, startSession } from '@/lib/tasbihStorage';
import { toJalaliShort, getJalaliWeekday } from '@/lib/jalali';
import { dhikrLibrary } from '@/lib/dhikrLibrary';
import { loadReminders, scheduleReminder, cancelReminder, checkPermission, requestPermission, NoorAlarm } from '@/lib/reminderService';
import { Capacitor } from '@capacitor/core';
import { saveReminder, type LocalReminder } from '@/lib/reminderStorage';
import { logEvent } from '@/lib/logger';
import { QiblaCompassModal } from '@/components/QiblaCompassModal';
import { AppTutorialModal } from '@/components/AppTutorialModal';
import type { Tab } from '@/components/BottomNav';

const prayerIcons: Record<string, typeof Sun> = {
  fajr: Sunrise,
  sunrise: Sun,
  dhuhr: Sun,
  asr: CloudSun,
  maghrib: Sunset,
  isha: Moon,
  midnight: Moon,
};

function getContextualSpiritualTip(now: Date, nextKey?: string): {
  badge: string;
  title: string;
  subtitle: string;
  dhikrId: string;
} {
  const day = now.getDay(); // 4 = Thursday, 5 = Friday
  const hour = now.getHours();

  if (day === 4 && hour >= 16) {
    return {
      badge: 'ویژه شب جمعه',
      title: 'سلام به سیدالشهدا (ع) زیر آسمان و سوره واقعه',
      subtitle: 'صَلَّى اللَّهُ عَلَيْكَ يَا أَبَا عَبْدِ اللَّهِ — ۳ مرتبه با توجه قلبی',
      dhikrId: 'friday_night_husayn',
    };
  }
  if (nextKey === 'maghrib' || nextKey === 'isha' || hour >= 19) {
    return {
      badge: 'برنامه شبانه مجرب',
      title: 'تلاوت سوره واقعه و ذکر اللَّهُمَّ عَافِنَا وَاعْفُ عَنَّا',
      subtitle: 'توصیه امام صادق (ع) برای برکت رزق و توصیه آیت‌الله فاطمی‌نیا',
      dhikrId: 'fateminia_afina',
    };
  }
  if (hour >= 4 && hour < 11) {
    return {
      badge: 'برنامه آغاز روز',
      title: 'تلاوت سوره ذاریات و دعای اللَّهُمَّ سَلِّمْ وَ تَمِّمْ',
      subtitle: 'برای اصلاح معاش روزانه، حفظ ایمان و عاقبت‌به‌خیری',
      dhikrId: 'fateminia_sallim',
    };
  }
  return {
    badge: 'ذکر گره‌گشای روز',
    title: 'توسل به امام رئوف (ع) و تسبیحات حضرت زهرا (س)',
    subtitle: 'يَا رَءُوفُ يَا رَحِيمُ — کلید آرامش دل و گشایش کارها',
    dhikrId: 'imam_reza_hajat',
  };
}

export function HomeScreen({ onNavigate }: { onNavigate?: (t: Tab) => void }) {
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
  const [showTutorial, setShowTutorial] = useState(false);
  const [guestCityId, setGuestCityIdState] = useState(getGuestCityId());

  const cityId = profile?.city_id ?? guestCityId;
  const city = useMemo(() => getCityById(cityId), [cityId]);
  const method = profile?.calculation_method ?? 'jafari';
  const todayDate = getLocalDateString(now, city.timezone);

  useEffect(() => {
    const refreshNow = () => setNow(new Date());
    const interval = setInterval(refreshNow, 1000);
    document.addEventListener('visibilitychange', refreshNow);
    window.addEventListener('focus', refreshNow);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshNow);
      window.removeEventListener('focus', refreshNow);
    };
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchTodayStats(user.id).then(setStats);
    } else {
      setStats({ total: getTodayTotal(), rounds: getTodayRounds() });
    }
    const session = getSession();
    setHasActiveSession(session.count > 0 || session.completed > 0);
  }, [todayDate, user?.id]);

  useEffect(() => {
    const t = calculatePrayerTimes(now, city.lat, city.lng, city.timezone, method);
    t.location = city.nameFa;
    setTimes(t);

    const all = loadReminders();
    const map: Record<string, boolean> = {};
    const prayerMap: Record<string, { title: string; time: string }> = {
      fajr: { title: `اذان صبح (${city.nameFa})`, time: t.fajr },
      dhuhr: { title: `اذان ظهر (${city.nameFa})`, time: t.dhuhr },
      asr: { title: `وقت عصر (${city.nameFa})`, time: t.asr },
      maghrib: { title: `اذان مغرب (${city.nameFa})`, time: t.maghrib },
      isha: { title: `وقت عشاء (${city.nameFa})`, time: t.isha },
    };

    for (const [key, info] of Object.entries(prayerMap)) {
      const remId = `prayer_auto_${key}`;
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
          timeZone: city.timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
        }).formatToParts(now);
        const hour = Number(clockParts.find((p) => p.type === 'hour')?.value ?? 0);
        const minute = Number(clockParts.find((p) => p.type === 'minute')?.value ?? 0);
        const nowMinute = hour * 60 + minute;
        let remaining = nextMinute - nowMinute;
        if (remaining < 0) remaining += 1440;
        let interval = nextMinute - previousMinute;
        if (interval <= 0) interval += 1440;
        const progress = Number.isFinite(interval) && interval > 0
          ? Math.max(0, Math.min(100, ((interval - remaining) / interval) * 100))
          : 0;
        setNext({ key: n.key, nameFa: n.nameFa, time: n.time, remaining: n.remaining, progress });
      }
    }
  }, [times, now, city.timezone]);

  const showToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 3200);
  };

  const detectNearestCity = async () => {
    const applyCoords = (latitude: number, longitude: number) => {
      let nearest = CITIES[0];
      let minDist = Infinity;
      for (const c of CITIES) {
        const d = Math.hypot(c.lat - latitude, c.lng - longitude);
        if (d < minDist) {
          minDist = d;
          nearest = c;
        }
      }
      if (profile) {
        void updateProfile({ city_id: nearest.id });
      } else {
        setGuestCityId(nearest.id);
        setGuestCityIdState(nearest.id);
      }
      showToast(`📍 موقعیت شما تشخیص داده شد: «${nearest.nameFa}»`);
    };

    showToast("در حال درخواست مجوز و تشخیص موقعیت مکانی...");
    if (Capacitor.getPlatform() === "android" && typeof NoorAlarm.requestAndGetLocation === "function") {
      try {
        const res = await NoorAlarm.requestAndGetLocation();
        if (res.hasCoords && typeof res.lat === "number" && typeof res.lng === "number") {
          applyCoords(res.lat, res.lng);
          return;
        }
      } catch {
        // در صورت نیاز ادامه به geolocation استاندارد پس از اخذ مجوز
      }
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => applyCoords(pos.coords.latitude, pos.coords.longitude),
        () => showToast("لطفاً GPS گوشی را روشن کنید یا از تنظیمات شهر را انتخاب نمایید."),
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
      );
    } else {
      showToast("از بخش تنظیمات، شهر خود را از بین ۴۰ شهر انتخاب کنید.");
    }
  };

  const togglePrayerAdhanAlarm = async (key: string, nameFa: string, timeStrVal: string) => {
    if (key === 'sunrise') return;
    const remId = `prayer_auto_${key}`;
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
      title: `اذان ${nameFa} به افق ${city.nameFa}`,
      body: `حَیَّ عَلَی الصَّلَاة — وقت فضیلت نماز ${nameFa} فرا رسیده است`,
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
      logEvent(res.success ? 'info' : 'warn', 'HomeScreen', `تغییر وضعیت آلارم اذان ${nameFa}`, {
        enabled: true,
        time: timeStrVal,
        success: res.success,
        error: res.error,
      });
      if (res.success) {
        setEnabledAlarms((prev) => ({ ...prev, [key]: true }));
        showToast(`🔔 آلارم اذان ${nameFa} (${timeStrVal}) فعال شد`);
      } else {
        reminder.enabled = false;
        saveReminder(reminder);
        showToast(res.error ?? 'خطا در فعال‌سازی آلارم اذان');
      }
    } else {
      await cancelReminder(remId);
      logEvent('info', 'HomeScreen', `آلارم اذان ${nameFa} غیرفعال شد`);
      setEnabledAlarms((prev) => ({ ...prev, [key]: false }));
      showToast(`آلارم اذان ${nameFa} خاموش شد`);
    }
  };

  if (!times) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse-ring w-14 h-14 rounded-full" style={{ background: theme.primary, opacity: 0.3 }} />
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
  const spiritualTip = getContextualSpiritualTip(now, next?.key);

  return (
    <div className="px-5 pt-6 pb-28 animate-fade-in">
      {showQibla && (
        <QiblaCompassModal
          cityName={city.nameFa}
          lat={city.lat}
          lng={city.lng}
          onClose={() => setShowQibla(false)}
        />
      )}

      {showTutorial && (
        <AppTutorialModal onClose={() => setShowTutorial(false)} />
      )}

      {statusToast && (
        <div
          className="fixed top-4 inset-x-5 z-50 rounded-2xl px-4 py-3 text-xs font-bold text-center shadow-xl animate-fade-in"
          style={{ background: theme.primary, color: theme.bg }}
        >
          {statusToast}
        </div>
      )}

      {/* هدر استاندارد، خلوت و متمرکز */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black text-app">
            {profile?.display_name ? profile.display_name : 'نور'}
          </h1>
          <p className="text-muted text-xs mt-0.5">{getJalaliWeekday(now)}، {toJalaliShort(now)}</p>
        </div>
        <div className="flex items-center gap-1.5">
          
          <button
            type="button"
            onClick={() => setShowQibla(true)}
            aria-label="قبله‌نما"
            className="px-2.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 border"
            style={{ borderColor: theme.border, color: theme.primary, background: `color-mix(in srgb, ${theme.primary} 12%, transparent)` }}
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

      {/* کارت آسمان پویا بر اساس هر نماز (خورشید در روز، طلوع در فجر، غروب در مغرب و ماه در شب) */}
      <section
        className="relative overflow-hidden rounded-[1.7rem] p-5 mb-4 animate-slide-up"
        aria-label="نماز بعدی"
        style={{
          background: `radial-gradient(circle at 90% 8%, color-mix(in srgb, ${theme.accent} 22%, transparent), transparent 42%), linear-gradient(145deg, ${theme.surfaceAlt ?? theme.surface}, ${theme.surface} 68%, ${theme.bg})`,
          border: `1px solid color-mix(in srgb, ${theme.primary} 28%, ${theme.border})`,
          boxShadow: `0 14px 34px color-mix(in srgb, ${theme.primary} 10%, transparent)`,
        }}
      >
        <div className="relative flex items-center justify-between gap-3 mb-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: theme.accent }} />
              <p className="text-muted text-xs font-medium">{times.hijriDate} · ساعت {timeStr}</p>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-primary">{next?.nameFa ?? '—'}</h2>
            <p className="text-muted text-xs mt-1">وقت شرعی بعدی به افق {times.location}</p>
          </div>
          <div
            className="w-[74px] h-[74px] rounded-[1.5rem] flex items-center justify-center flex-shrink-0"
            style={{
              background: `color-mix(in srgb, ${theme.primary} 14%, transparent)`,
              border: `1px solid color-mix(in srgb, ${theme.primary} 24%, transparent)`,
            }}
          >
            <HeroIcon size={36} strokeWidth={1.6} color={theme.accent} />
          </div>
        </div>
        <div className="relative flex items-center justify-between gap-3 rounded-2xl px-4 py-3" style={{ background: 'color-mix(in srgb, black 12%, transparent)', border: `1px solid color-mix(in srgb, ${theme.border} 75%, transparent)` }}>
          <div className="flex items-center gap-2 min-w-0">
            <Clock size={16} color={theme.accent} />
            <p className="text-accent text-sm font-semibold truncate">{next?.remaining ? `تا اذان ${next.nameFa}: ${next.remaining}` : 'در حال محاسبه…'}</p>
          </div>
          <div className="text-left flex-shrink-0">
            <p className="text-muted text-[10px] mb-0.5">وقت اذان</p>
            <p className="text-lg font-bold text-app tabular-nums" dir="ltr">{next?.time ?? '--:--'}</p>
          </div>
        </div>
        <div className="relative mt-3" aria-label="میزان نزدیک شدن به نماز بعدی">
          <div className="h-2 rounded-full overflow-hidden" style={{ background: `color-mix(in srgb, ${theme.primary} 12%, transparent)` }}>
            <div
              className="h-full rounded-full transition-[width] duration-1000 ease-linear"
              style={{ width: `${next?.progress ?? 0}%`, background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent})` }}
            />
          </div>
        </div>
      </section>

      {/* میان‌بر هوشمند پیشنهاد معنوی روز و ایام خاص */}
      <div
        className="card-flat p-4 mb-4 flex items-center justify-between gap-3 cursor-pointer"
        style={{ borderColor: `color-mix(in srgb, ${theme.primary} 30%, ${theme.border})` }}
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
            <span className="text-[11px] font-bold" style={{ color: theme.accent }}>{spiritualTip.badge}</span>
          </div>
          <p className="text-app font-bold text-xs truncate">{spiritualTip.title}</p>
          <p className="text-muted text-[11px] mt-0.5 truncate">{spiritualTip.subtitle}</p>
        </div>
        <ArrowLeft size={18} color={theme.primary} className="shrink-0" />
      </div>

      {hasActiveSession && onNavigate && activeDhikr && (
        <button
          onClick={() => onNavigate('tasbih')}
          className="w-full card-flat p-4 mb-4 flex items-center justify-between animate-slide-up"
          aria-label="ادامه شمارش"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: `color-mix(in srgb, ${theme.primary} 15%, transparent)` }}
            >
              <Hand size={20} color={theme.primary} />
            </div>
            <div className="text-right">
              <p className="text-app font-bold text-sm">ادامه شمارش تسبیح</p>
              <p className="text-muted text-xs mt-0.5">
                {activeDhikr.arabic} — {session.count}/{session.target}
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
                  style={{ background: isNext ? theme.primary : `color-mix(in srgb, ${theme.primary} 10%, transparent)` }}
                >
                  <Icon size={16} color={isNext ? theme.bg : theme.primary} />
                </div>
                <span className="text-app font-medium text-xs whitespace-nowrap">{p.nameFa}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-app font-bold text-xs tabular-nums" dir="ltr">{p.time}</span>
                {canAlarm && (
                  <button
                    type="button"
                    aria-label={isAlarmOn ? `خاموش کردن آلارم اذان ${p.nameFa}` : `فعال کردن آلارم اذان ${p.nameFa}`}
                    onClick={() => void togglePrayerAdhanAlarm(p.key, p.nameFa, p.time)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                    style={{
                      background: isAlarmOn
                        ? theme.primary
                        : `color-mix(in srgb, ${theme.textMuted} 15%, transparent)`,
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
    </div>
  );
}
