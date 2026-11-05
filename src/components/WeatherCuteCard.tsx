import { useState, useEffect } from 'react';
import { MapPin, CalendarDays } from 'lucide-react';
import {
  fetchLiveWeather,
  getTemperatureUnit,
  formatTempValue,
  type LiveWeatherData,
  type TempUnit,
  type WeatherConditionType,
} from '@/lib/weatherService';
import { toFaDigits } from '@/lib/jalali';

interface Props {
  cityName: string;
  lat: number;
  lng: number;
  jalaliDateText: string;
  hijriDateText: string;
  gregorianDateText: string;
  onOpenCityPicker: () => void;
  onOpenCalendar: () => void;
}

export function WeatherCuteArtwork({ condition, size = 56 }: { condition: WeatherConditionType; size?: number }) {
  if (condition === 'rainy' || condition === 'stormy') {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className="drop-shadow-md shrink-0">
        <circle cx="24" cy="22" r="10" fill="#FBBF24" />
        <path d="M20 42H48C53.5 42 58 37.5 58 32C58 26.8 54 22.5 48.9 22C47.4 15.2 41.3 10 34 10C25.7 10 19 16.7 19 25C13.5 25.5 9 30.2 9 36C9 39.3 11.7 42 15 42H20Z" fill="url(#rainCloud)" />
        <line x1="24" y1="47" x2="21" y2="56" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
        <line x1="34" y1="47" x2="31" y2="56" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
        <line x1="44" y1="47" x2="41" y2="56" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
        <defs>
          <linearGradient id="rainCloud" x1="9" y1="10" x2="58" y2="42" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E0F2FE" />
            <stop offset="1" stopColor="#93C5FD" />
          </linearGradient>
        </defs>
      </svg>
    );
  }
  if (condition === 'snowy') {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className="drop-shadow-md shrink-0">
        <path d="M18 42H48C53.5 42 58 37.5 58 32C58 26.8 54 22.5 48.9 22C47.4 15.2 41.3 10 34 10C25.7 10 19 16.7 19 25C13.5 25.5 9 30.2 9 36C9 39.3 11.7 42 15 42H18Z" fill="#F1F5F9" />
        <circle cx="24" cy="50" r="3" fill="#E0F2FE" />
        <circle cx="34" cy="54" r="3" fill="#BAE6FD" />
        <circle cx="44" cy="50" r="3" fill="#E0F2FE" />
      </svg>
    );
  }
  if (condition === 'windy' || condition === 'cloudy') {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className="drop-shadow-md shrink-0">
        <path d="M18 38H48C53 38 57 34 57 29C57 24.2 53.2 20.3 48.5 20C47 13.7 41.3 9 34.5 9C26.5 9 20 15.5 20 23.5C15 24 11 28.2 11 33.5C11 36 13 38 15.5 38H18Z" fill="#E2E8F0" />
        <path d="M12 46H44C47 46 49 44 49 41.5C49 39 47 37 44.5 37" stroke="#7DD3FC" strokeWidth="3" strokeLinecap="round" />
        <path d="M18 53H38C40.5 53 42.5 51 42.5 48.5" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }
  if (condition === 'clear_night') {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className="drop-shadow-md shrink-0">
        <path d="M41 14C31.6 14 24 21.6 24 31C24 40.4 31.6 48 41 48C44.8 48 48.3 46.7 51.1 44.6C43.8 43.9 38 37.7 38 30.2C38 22.2 44.1 15.7 52 15.1C48.7 14.4 44.9 14 41 14Z" fill="#FDE047" />
        <circle cx="19" cy="20" r="2" fill="#FEF08A" />
        <circle cx="26" cy="12" r="1.5" fill="#FEF08A" />
        <path d="M16 48H42C46.4 48 50 44.4 50 40C50 35.8 46.7 32.4 42.6 32C41.3 26.8 36.6 23 31 23C24.4 23 19 28.4 19 35C14.6 35.4 11 39.1 11 43.5C11 46 13 48 15.5 48H16Z" fill="rgba(255,255,255,0.85)" />
      </svg>
    );
  }
  // حالت پیش‌فرض: آفتابی یا نیمه‌ابری کیوت (مشابه تصویر مرجع با خورشید طلایی و ابر پنبه‌ای)
  return (
    <svg width={size} height={size} viewBox="0 0 68 68" fill="none" className="drop-shadow-md shrink-0">
      <circle cx="26" cy="26" r="14" fill="url(#cuteSunGrad)" />
      <circle cx="22" cy="24" r="1.4" fill="#78350F" />
      <circle cx="30" cy="24" r="1.4" fill="#78350F" />
      <path d="M24 28Q26 30 28 28" stroke="#78350F" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="19.5" cy="26.5" r="2" fill="#FB7185" fillOpacity="0.55" />
      <circle cx="32.5" cy="26.5" r="2" fill="#FB7185" fillOpacity="0.55" />
      <path d="M22 49H50C55.5 49 60 44.5 60 39C60 33.8 56 29.5 50.9 29C49.4 22.8 43.8 18 37 18C29.3 18 23 24.3 23 32C17.5 32.5 13 37.2 13 43C13 46.3 15.7 49 19 49H22Z" fill="url(#cuteCloudGrad)" />
      <defs>
        <radialGradient id="cuteSunGrad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </radialGradient>
        <linearGradient id="cuteCloudGrad" x1="13" y1="18" x2="60" y2="49" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E0F2FE" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function getConditionBackdropStyle(condition: WeatherConditionType): { background: string; borderColor: string; badgeColor: string } {
  switch (condition) {
    case 'rainy':
    case 'stormy':
      return {
        background: 'linear-gradient(135deg, rgba(14, 116, 144, 0.36) 0%, rgba(15, 23, 42, 0.78) 100%)',
        borderColor: 'rgba(56, 189, 248, 0.45)',
        badgeColor: '#7DD3FC',
      };
    case 'snowy':
      return {
        background: 'linear-gradient(135deg, rgba(148, 163, 184, 0.35) 0%, rgba(30, 41, 59, 0.80) 100%)',
        borderColor: 'rgba(226, 232, 240, 0.5)',
        badgeColor: '#F1F5F9',
      };
    case 'windy':
    case 'cloudy':
      return {
        background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.28) 0%, rgba(15, 41, 34, 0.82) 100%)',
        borderColor: 'rgba(45, 212, 191, 0.42)',
        badgeColor: '#5EEAD4',
      };
    case 'clear_night':
      return {
        background: 'linear-gradient(135deg, rgba(49, 46, 129, 0.42) 0%, rgba(9, 24, 28, 0.88) 100%)',
        borderColor: 'rgba(250, 204, 21, 0.38)',
        badgeColor: '#FDE047',
      };
    case 'sunny':
    case 'partly_cloudy':
    default:
      return {
        background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, rgba(245, 158, 11, 0.18) 52%, rgba(13, 46, 38, 0.85) 100%)',
        borderColor: 'rgba(251, 191, 36, 0.48)',
        badgeColor: '#FDE68A',
      };
  }
}

export function WeatherCuteHeaderWidget({
  cityName,
  lat,
  lng,
  jalaliDateText,
  hijriDateText,
  gregorianDateText,
  onOpenCityPicker,
  onOpenCalendar,
}: Props) {
  const [weather, setWeather] = useState<LiveWeatherData | null>(null);
  const [unit, setUnit] = useState<TempUnit>(() => getTemperatureUnit());

  useEffect(() => {
    let mounted = true;
    fetchLiveWeather(lat, lng).then((w) => {
      if (mounted) setWeather(w);
    });
    const onUnitChange = () => setUnit(getTemperatureUnit());
    window.addEventListener('noor-weather-unit-changed', onUnitChange);
    return () => {
      mounted = false;
      window.removeEventListener('noor-weather-unit-changed', onUnitChange);
    };
  }, [lat, lng]);

  const cond = weather?.condition ?? 'sunny';
  const styleMeta = getConditionBackdropStyle(cond);
  const curTemp = weather ? formatTempValue(weather.tempC, unit) : 22;
  const minTemp = weather ? formatTempValue(weather.tempMinC, unit) : 16;
  const maxTemp = weather ? formatTempValue(weather.tempMaxC, unit) : 26;
  const unitSymbol = unit === 'F' ? '°F' : '°';

  return (
    <div className="grid grid-cols-12 gap-2.5 mb-3.5 items-stretch" dir="rtl">
      {/* سمت راست (۷ ستون): کارت تقویم سه‌گانه و خوش‌آمدگویی معنوی */}
      <button
        type="button"
        onClick={onOpenCalendar}
        className="col-span-7 rounded-3xl p-3.5 border text-right flex flex-col justify-between transition-transform active:scale-[0.99] relative overflow-hidden"
        style={{
          background: 'radial-gradient(circle at top right, rgba(16, 185, 129, 0.18), rgba(11, 34, 28, 0.88))',
          borderColor: 'rgba(52, 211, 153, 0.32)',
        }}
      >
        <div className="flex items-center justify-between gap-1.5">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300">
            <CalendarDays size={13} /> تقویم و مناسبت‌ها
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-200">
            پیش‌بینی هوا ←
          </span>
        </div>
        <div className="my-1.5">
          <p className="text-base font-black text-white leading-snug">{jalaliDateText}</p>
          <p className="text-[11px] font-bold text-amber-200/90 mt-0.5">🌙 {toFaDigits(hijriDateText)} قمری</p>
        </div>
        <div className="flex items-center justify-between text-[10px] text-emerald-100/75 pt-1.5 border-t border-white/10">
          <span>✨ روز پر از خیر و برکت</span>
          <span dir="ltr" className="font-mono">{gregorianDateText}</span>
        </div>
      </button>

      {/* سمت چپ (۵ ستون): ویجت کیوت و شیشه‌ای آب‌وهوای زنده شهر (الهام‌گرفته از عکس مرجع) */}
      <div
        onClick={onOpenCalendar}
        role="button"
        tabIndex={0}
        className="col-span-5 rounded-3xl p-3 border relative overflow-hidden flex flex-col justify-between cursor-pointer transition-transform active:scale-[0.98]"
        style={{
          background: styleMeta.background,
          borderColor: styleMeta.borderColor,
          boxShadow: '0 10px 26px rgba(0, 0, 0, 0.28), inset 0 1px 1px rgba(255, 255, 255, 0.22)',
        }}
      >
        {/* ردیف بالا: دکمه تغییر شهر و موقعیت در گوشه بالا */}
        <div className="flex items-center justify-between gap-1 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenCityPicker();
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black transition-all"
            style={{ background: 'rgba(0,0,0,0.32)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.18)' }}
            title="تغییر شهر یا مکان‌یابی دقیق"
          >
            <MapPin size={11} color="#34D399" />
            <span className="truncate max-w-[72px]">{cityName}</span>
          </button>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-black/25 text-white/85">
            {unit === 'F' ? '°F' : '°C'}
          </span>
        </div>

        {/* بخش میانی: تصویر گرافیکی خورشید/ابر در چپ و عدد بزرگ دما در راست */}
        <div className="flex items-center justify-between my-1 z-10">
          <div className="text-right">
            <div className="text-2xl font-black text-white leading-none tracking-tight" dir="ltr">
              {toFaDigits(curTemp)}{unitSymbol}
            </div>
            <p className="text-[10px] font-extrabold mt-1 truncate" style={{ color: styleMeta.badgeColor }}>
              {weather?.labelFa ?? 'آفتابی و دلپذیر'}
            </p>
          </div>
          <div className="-ml-1">
            <WeatherCuteArtwork condition={cond} size={48} />
          </div>
        </div>

        {/* ردیف پایین: کمینه و بیشینه دما دقیقاً مثل تصویر ارسالی */}
        <div
          className="text-[10px] font-bold text-center py-1 px-1.5 rounded-xl z-10"
          style={{ background: 'rgba(0, 0, 0, 0.28)', color: '#F8FAFC' }}
        >
          کمینه {toFaDigits(minTemp)}° <span className="opacity-50 mx-0.5">|</span> بیشینه {toFaDigits(maxTemp)}°
        </div>
      </div>
    </div>
  );
}
