import { useState, useEffect, useMemo } from 'react';
import { MapPin, Clock, Sunrise, Sunset, Moon, Sun, CloudSun, ArrowLeft, Hand, Sparkles, Star } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { calculatePrayerTimes, getNextPrayer, getLocalDateString, timeToMinutes, PrayerTimes } from '@/lib/prayerTimes';
import { getCityById, getGuestCityId } from '@/lib/cities';
import { getTodayTotal, getTodayRounds, getSession, fetchTodayStats } from '@/lib/tasbihStorage';
import { toJalaliShort, getJalaliWeekday } from '@/lib/jalali';
import { dhikrLibrary } from '@/lib/dhikrLibrary';
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
  const [next, setNext] = useState<{ key: string; nameFa: string; time: string; remaining: string; progress: number } | null>(null);
  const [now, setNow] = useState(new Date());
  const [stats, setStats] = useState({ total: 0, rounds: 0 });
  const [hasActiveSession, setHasActiveSession] = useState(false);

  const cityId = profile?.city_id ?? getGuestCityId();
  const city = useMemo(() => getCityById(cityId), [cityId]);
  const method = profile?.calculation_method ?? 'jafari';
  // Use the selected city's calendar date, not the device's date. This matters
  // when the user is travelling or the device timezone differs from the city.
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
  const ActivePrayerIcon = prayerIcons[next?.key ?? 'fajr'] ?? Sun;
  const cityClock = new Intl.DateTimeFormat('en-GB', { timeZone: city.timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  const cityNowMinute = Number(cityClock.find((part) => part.type === 'hour')?.value ?? 0) * 60 + Number(cityClock.find((part) => part.type === 'minute')?.value ?? 0);
  const justReached = [{ nameFa: 'نماز صبح', time: times.fajr }, { nameFa: 'نماز ظهر', time: times.dhuhr }, { nameFa: 'نماز عصر', time: times.asr }, { nameFa: 'نماز مغرب', time: times.maghrib }, { nameFa: 'نماز عشاء', time: times.isha }].find((prayer) => { const minute = timeToMinutes(prayer.time); const elapsed = cityNowMinute - minute; return Number.isFinite(minute) && elapsed >= 0 && elapsed < 8; });

  return (
    <div className="relative px-4 pt-5 pb-28 animate-fade-in sm:px-5">
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-muted text-xs">{greeting}، به لحظه‌ای برای آرامش خوش اومدی</p>
          <h1 className="text-2xl font-black tracking-tight text-app mt-0.5">
            {profile?.display_name ? profile.display_name : 'نور'}
          </h1>
          <p className="text-muted text-xs mt-1">{getJalaliWeekday(now)} <span style={{ color: theme.accent }}>✦</span> پناهِ دل، یاد خداست</p>
        </div>
        <div className="flex items-center gap-1.5 text-muted text-sm" aria-label="موقعیت">
          <MapPin size={15} />
          <span>{times.location}</span>
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
              <p className="text-muted text-xs font-medium">لحظه‌های نورانی امروز</p>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-primary">{next?.nameFa ?? '—'}</h2>
            <p className="text-muted text-xs mt-1">قدم‌به‌قدم نزدیکِ آرامش</p>
          </div>
          <div className="relative flex h-36 w-[7.1rem] shrink-0 items-end justify-center overflow-hidden rounded-t-[4rem] rounded-b-2xl pb-4 pt-5" style={{ background: `linear-gradient(180deg, color-mix(in srgb, ${theme.accent} 14%, transparent), color-mix(in srgb, ${theme.primary} 8%, transparent))`, border: `1px solid color-mix(in srgb, ${theme.accent} 34%, ${theme.border})` }}><div className="absolute inset-x-2 top-2 bottom-2 rounded-t-[3.5rem] rounded-b-xl" style={{ border: `1px solid color-mix(in srgb, ${theme.accent} 25%, transparent)` }} /><div className="absolute top-4 h-2 w-2 rotate-45" style={{ background: theme.accent }} /><div className="relative z-10 flex h-[5.1rem] w-[5.1rem] items-center justify-center rounded-[1.8rem]" style={{ color: theme.accent, background: `radial-gradient(circle, color-mix(in srgb, ${theme.accent} 18%, transparent), color-mix(in srgb, ${theme.primary} 8%, transparent))` }}><ActivePrayerIcon key={next?.key} size={60} strokeWidth={1.25} /></div><span className="relative z-10 mt-1 text-[9px] font-semibold" style={{ color: theme.accent }}>وقتِ بندگی</span></div>
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

      {justReached && <section className="relative mb-4 flex items-center gap-3 overflow-hidden rounded-2xl p-4 animate-slide-up" role="status" style={{ background: `linear-gradient(120deg, color-mix(in srgb, ${theme.accent} 16%, ${theme.surface}), ${theme.surface})`, border: `1px solid color-mix(in srgb, ${theme.accent} 48%, ${theme.border})` }}><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl" style={{ background: `color-mix(in srgb, ${theme.accent} 17%, transparent)`, color: theme.accent }}><Sparkles size={30} strokeWidth={1.6} /></div><div className="min-w-0"><p className="font-black text-app">{justReached.nameFa} فرا رسیده 🌙</p><p className="mt-1 text-xs leading-5 text-muted">لحظه‌ای مکث کن؛ وقتِ گفت‌وگو با خداست.</p></div><Star className="ml-auto shrink-0" size={18} color={theme.accent} /></section>}

      <div className="card-flat p-4 mb-4 flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-app font-semibold text-sm truncate">{getJalaliWeekday(now)}، {toJalaliShort(now)}</p>
          <p className="text-muted text-xs mt-0.5 truncate">{times.hijriDate}</p>
        </div>
        <p className="text-xl font-bold text-primary flex-shrink-0" dir="ltr">{timeStr}</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-4">
        {prayers.map((p) => {
          const Icon = prayerIcons[p.key] ?? Sun;
          const isNext = next?.nameFa === p.nameFa && p.key !== 'sunrise';
          return (
            <div key={p.key} className="card-flat min-w-0 p-2.5 flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <div
                  className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center"
                  style={{ background: isNext ? theme.primary : `color-mix(in srgb, ${theme.primary} 10%, transparent)` }}
                >
                  <Icon size={16} color={isNext ? theme.bg : theme.primary} />
                </div>
                <span className="text-app font-medium text-xs whitespace-nowrap">{p.nameFa}</span>
              </div>
              <span className="text-app font-bold text-xs flex-shrink-0" dir="ltr">{p.time}</span>
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
