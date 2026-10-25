import { useState, useEffect, useMemo } from 'react';
import { MapPin, Clock, Sunrise, Sunset, Moon, Sun, CloudSun, ArrowLeft, Hand, Bell, BellOff, Type, Compass } from 'lucide-react';
import { QiblaCompassModal } from '@/components/QiblaCompassModal';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { calculatePrayerTimes, getNextPrayer, getLocalDateString, timeToMinutes, PrayerTimes } from '@/lib/prayerTimes';
import { getCityById, getGuestCityId } from '@/lib/cities';
import { getTodayTotal, getTodayRounds, getSession, fetchTodayStats } from '@/lib/tasbihStorage';
import { toJalaliShort, getJalaliWeekday } from '@/lib/jalali';
import { dhikrLibrary } from '@/lib/dhikrLibrary';
import { loadReminders, scheduleReminder, cancelReminder, checkPermission, requestPermission } from '@/lib/reminderService';
import { saveReminder, type LocalReminder } from '@/lib/reminderStorage';
import { logEvent } from '@/lib/logger';
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

const LARGE_FONT_KEY = 'noor_large_font_enabled';

function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return 'صبح بخیر';
  if (hour >= 12 && hour < 17) return 'ظهر بخیر';
  if (hour >= 17 && hour < 20) return 'عصر بخیر';
  return 'شب بخیر';
}

export function HomeScreen({ onNavigate }: { onNavigate?: (t: Tab) => void }) {
  const { theme } = useTheme();
  const { profile, user } = useAuth();
  const [times, setTimes] = useState<PrayerTimes | null>(null);
  const [next, setNext] = useState<{ nameFa: string; time: string; remaining: string; progress: number } | null>(null);
  const [now, setNow] = useState(new Date());
  const [stats, setStats] = useState({ total: 0, rounds: 0 });
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [enabledAlarms, setEnabledAlarms] = useState<Record<string, boolean>>({});
  const [statusToast, setStatusToast] = useState<string | null>(null);
  const [showQibla, setShowQibla] = useState(false);
  const [largeFont, setLargeFont] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LARGE_FONT_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const cityId = profile?.city_id ?? getGuestCityId();
  const city = useMemo(() => getCityById(cityId), [cityId]);
  const method = profile?.calculation_method ?? 'jafari';
  const todayDate = getLocalDateString(now, city.timezone);

  useEffect(() => {
    document.documentElement.style.fontSize = largeFont ? '18.5px' : '16px';
    try {
      localStorage.setItem(LARGE_FONT_KEY, largeFont ? 'true' : 'false');
    } catch {
      // ignore
    }
  }, [largeFont]);

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
        setNext({ nameFa: n.nameFa, time: n.time, remaining: n.remaining, progress });
      }
    }
  }, [times, now, city.timezone]);

  const showToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 3200);
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
  const greeting = getGreeting(now.getHours());
  const session = getSession();
  const activeDhikr = dhikrLibrary.find((d) => d.id === session.dhikrId);

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
      {statusToast && (
        <div
          className="fixed top-4 inset-x-5 z-50 rounded-2xl px-4 py-3 text-xs font-bold text-center shadow-xl animate-fade-in"
          style={{ background: theme.primary, color: theme.bg }}
        >
          {statusToast}
        </div>
      )}

      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-muted text-sm">{greeting}</p>
          <h1 className="text-2xl font-bold text-app mt-0.5">
            {profile?.display_name ? profile.display_name : 'نور'}
          </h1>
          <p className="text-muted text-xs mt-1">{getJalaliWeekday(now)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowQibla(true)}
            aria-label="قبله‌نما"
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 border"
            style={{ borderColor: theme.border, color: theme.primary, background: `color-mix(in srgb, ${theme.primary} 12%, transparent)` }}
          >
            <Compass size={14} />
            <span>قبله‌نما</span>
          </button>
          <button
            type="button"
            onClick={() => setLargeFont((v) => !v)}
            aria-label="درشت‌نمایی متن"
            title="تغییر اندازه نوشته برای مطالعه راحت‌تر"
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 border"
            style={{
              borderColor: largeFont ? theme.primary : theme.border,
              background: largeFont ? `color-mix(in srgb, ${theme.primary} 18%, transparent)` : 'transparent',
              color: largeFont ? theme.primary : theme.textMuted,
            }}
          >
            <Type size={14} />
            <span>{largeFont ? 'متن درشت' : 'A+'}</span>
          </button>
          <div className="flex items-center gap-1.5 text-muted text-sm" aria-label="موقعیت">
            <MapPin size={15} />
            <span>{times.location}</span>
          </div>
        </div>
      </div>

      {hasActiveSession && onNavigate && activeDhikr && (
        <button
          onClick={() => onNavigate('tasbih')}
          className="w-full card-flat p-4 mb-4 flex items-center justify-between animate-slide-up"
          aria-label="ادامه شمارش"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: `color-mix(in srgb, ${theme.primary} 15%, transparent)` }}
            >
              <Hand size={22} color={theme.primary} />
            </div>
            <div className="text-right">
              <p className="text-app font-bold text-sm">ادامه شمارش</p>
              <p className="text-muted text-xs mt-0.5">
                {activeDhikr.translit} — {session.count}/{session.target}
              </p>
            </div>
          </div>
          <ArrowLeft size={20} color={theme.primary} />
        </button>
      )}

      <section
        className="relative overflow-hidden rounded-[1.7rem] p-5 mb-4 animate-slide-up"
        aria-label="نماز بعدی"
        style={{
          background: `radial-gradient(circle at 90% 8%, color-mix(in srgb, ${theme.accent} 20%, transparent), transparent 38%), linear-gradient(145deg, ${theme.surfaceAlt ?? theme.surface}, ${theme.surface} 68%, ${theme.bg})`,
          border: `1px solid color-mix(in srgb, ${theme.primary} 28%, ${theme.border})`,
          boxShadow: `0 14px 34px color-mix(in srgb, ${theme.primary} 10%, transparent)`,
        }}
      >
        <div className="absolute -left-5 -top-7 w-28 h-28 rounded-full pointer-events-none" style={{ border: `1px solid color-mix(in srgb, ${theme.accent} 14%, transparent)` }} />
        <div className="absolute -left-1 top-2 w-20 h-20 rounded-full pointer-events-none" style={{ border: `1px solid color-mix(in srgb, ${theme.accent} 10%, transparent)` }} />
        <div className="relative flex items-center justify-between gap-3 mb-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: theme.accent }} />
              <p className="text-muted text-xs font-medium">قرار بعدی با آرامش</p>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-primary">{next?.nameFa ?? '—'}</h2>
            <p className="text-muted text-xs mt-1">تا وقت نماز بعدی</p>
          </div>
          <div className="w-[76px] h-[76px] rounded-[1.5rem] flex items-center justify-center flex-shrink-0" style={{ background: `color-mix(in srgb, ${theme.primary} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${theme.primary} 20%, transparent)` }}>
            <Moon size={34} strokeWidth={1.4} color={theme.accent} />
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
          <div className="flex justify-between mt-1.5 text-[10px] text-muted">
            <span>آرام‌آرام نزدیک می‌شیم ✨</span>
            <span>{Math.round(next?.progress ?? 0).toLocaleString('fa-IR')}٪</span>
          </div>
        </div>
      </section>

      <div className="card-flat p-4 mb-4 flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-app font-semibold text-sm truncate">{getJalaliWeekday(now)}، {toJalaliShort(now)}</p>
          <p className="text-muted text-xs mt-0.5 truncate">{times.hijriDate}</p>
        </div>
        <p className="text-xl font-bold text-primary flex-shrink-0" dir="ltr">{timeStr}</p>
      </div>

      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-muted text-[11px]">اوقات شرعی به افق {times.location}</span>
        <span className="text-muted text-[11px]">با لمس 🔔 آلارم اذان فعال می‌شود</span>
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
              style={{
                borderColor: isAlarmOn ? theme.primary : undefined,
              }}
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

      <div className="card p-5">
        <h3 className="text-app font-bold text-sm mb-3">امروز</h3>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <p className="text-2xl font-bold text-primary">{stats.total.toLocaleString('fa-IR')}</p>
            <p className="text-muted text-xs mt-1">ذکر امروز</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-accent">{stats.rounds.toLocaleString('fa-IR')}</p>
            <p className="text-muted text-xs mt-1">دور کامل</p>
          </div>
        </div>
        {stats.total === 0 && (
          <p className="text-muted text-xs text-center mt-3 opacity-60">
            هنوز ذکری ثبت نشده — شروع کن
          </p>
        )}
      </div>
    </div>
  );
}
