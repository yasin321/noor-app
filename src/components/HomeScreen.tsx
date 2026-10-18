import { useState, useEffect, useMemo } from 'react';
import { MapPin, Clock, Sunrise, Sunset, Moon, Sun, CloudSun, ArrowLeft, Hand } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { calculatePrayerTimes, getNextPrayer, getLocalDateString, PrayerTimes } from '@/lib/prayerTimes';
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
  const [next, setNext] = useState<{ nameFa: string; time: string; remaining: string } | null>(null);
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
      if (n) setNext({ nameFa: n.nameFa, time: n.time, remaining: n.remaining });
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

  return (
    <div className="px-5 pt-6 pb-28 animate-fade-in">
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-muted text-sm">{greeting}</p>
          <h1 className="text-2xl font-bold text-app mt-0.5">
            {profile?.display_name ? profile.display_name : 'نور'}
          </h1>
          <p className="text-muted text-xs mt-1">{getJalaliWeekday(now)}</p>
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

      <div className="card p-5 mb-4 animate-slide-up" style={{ boxShadow: `0 0 16px ${theme.primaryGlow}` }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-muted text-xs mb-1">نماز بعدی</p>
            <h2 className="text-2xl font-bold text-primary">{next?.nameFa ?? '—'}</h2>
          </div>
          <div className="text-left">
            <p className="text-muted text-xs mb-1">زمان</p>
            <p className="text-lg font-bold text-app" dir="ltr">{next?.time ?? '--:--'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-3" style={{ borderTop: `1px solid ${theme.border}` }}>
          <Clock size={15} color={theme.accent} />
          <p className="text-accent text-sm font-medium">
            {next?.remaining ? `مانده: ${next.remaining}` : ''}
          </p>
        </div>
      </div>

      <div className="card-flat p-4 mb-4 flex items-center justify-between">
        <div>
          <p className="text-app font-semibold text-sm">{getJalaliWeekday(now)}، {toJalaliShort(now)}</p>
          <p className="text-muted text-xs mt-0.5">{times.hijriDate}</p>
        </div>
        <p className="text-xl font-bold text-primary" dir="ltr">{timeStr}</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-4">
        {prayers.map((p) => {
          const Icon = prayerIcons[p.key] ?? Sun;
          const isNext = next?.nameFa === p.nameFa && p.key !== 'sunrise';
          return (
            <div key={p.key} className="card-flat p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: isNext ? theme.primary : `color-mix(in srgb, ${theme.primary} 10%, transparent)` }}
                >
                  <Icon size={16} color={isNext ? theme.bg : theme.primary} />
                </div>
                <span className="text-app font-medium text-sm">{p.nameFa}</span>
              </div>
              <span className="text-app font-bold text-sm" dir="ltr">{p.time}</span>
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
