export type TempUnit = 'C' | 'F';
export type WeatherConditionType = 'sunny' | 'partly_cloudy' | 'cloudy' | 'rainy' | 'snowy' | 'windy' | 'stormy' | 'clear_night';

export interface DailyWeatherForecast {
  dateIso: string; // YYYY-MM-DD
  weatherCode: number;
  condition: WeatherConditionType;
  labelFa: string;
  tempMaxC: number;
  tempMinC: number;
}

export interface LiveWeatherData {
  tempC: number;
  tempMinC: number;
  tempMaxC: number;
  windSpeedKmh: number;
  weatherCode: number;
  isDay: boolean;
  condition: WeatherConditionType;
  labelFa: string;
  daily: DailyWeatherForecast[];
  updatedAt: number;
}

const UNIT_STORAGE_KEY = 'noor_weather_temp_unit_v1';
const WEATHER_CACHE_KEY = 'noor_live_weather_cache_v1';

export function getTemperatureUnit(): TempUnit {
  try {
    const val = localStorage.getItem(UNIT_STORAGE_KEY);
    return val === 'F' ? 'F' : 'C';
  } catch {
    return 'C';
  }
}

export function setTemperatureUnit(unit: TempUnit): void {
  try {
    localStorage.setItem(UNIT_STORAGE_KEY, unit);
    window.dispatchEvent(new CustomEvent('noor-weather-unit-changed'));
  } catch {}
}

export function formatTempValue(tempC: number, unit: TempUnit = getTemperatureUnit()): number {
  if (unit === 'F') {
    return Math.round((tempC * 9) / 5 + 32);
  }
  return Math.round(tempC);
}

export function mapWmoCodeToCondition(code: number, isDay = true, windKmh = 0): { condition: WeatherConditionType; labelFa: string } {
  if (windKmh >= 32 && code <= 3) {
    return { condition: 'windy', labelFa: 'بادی و خنک' };
  }
  if (code === 0) {
    return isDay
      ? { condition: 'sunny', labelFa: 'آفتابی و دلپذیر' }
      : { condition: 'clear_night', labelFa: 'آسمان صاف و آرام' };
  }
  if (code === 1 || code === 2) {
    return isDay
      ? { condition: 'partly_cloudy', labelFa: 'کمی ابری و لطیف' }
      : { condition: 'clear_night', labelFa: 'مهتابی و نیمه‌ابری' };
  }
  if (code === 3 || code === 45 || code === 48) {
    return { condition: 'cloudy', labelFa: 'ابری و سایه‌دار' };
  }
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return { condition: 'rainy', labelFa: 'بارانی و باطراوت' };
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return { condition: 'snowy', labelFa: 'برفی و سپیدپوش' };
  }
  if (code >= 95) {
    return { condition: 'stormy', labelFa: 'رعدوبرق و بارش' };
  }
  return { condition: 'sunny', labelFa: 'آفتابی و دلپذیر' };
}

function buildFallbackWeather(lat: number): LiveWeatherData {
  const hour = new Date().getHours();
  const isDay = hour >= 6 && hour < 18;
  const baseTemp = lat > 34 ? 21 : 26;
  const today = new Date();
  const daily: DailyWeatherForecast[] = Array.from({ length: 7 }, (_, idx) => {
    const d = new Date(today);
    d.setDate(d.getDate() + idx);
    const iso = d.toLocaleDateString('en-CA');
    const codes = [0, 1, 0, 2, 61, 0, 1];
    const c = codes[idx % codes.length];
    const mapped = mapWmoCodeToCondition(c, true, 10);
    return {
      dateIso: iso,
      weatherCode: c,
      condition: mapped.condition,
      labelFa: mapped.labelFa,
      tempMaxC: baseTemp + 4 - (idx % 3),
      tempMinC: baseTemp - 6 + (idx % 2),
    };
  });
  const currentMapped = mapWmoCodeToCondition(0, isDay, 8);
  return {
    tempC: baseTemp,
    tempMinC: baseTemp - 6,
    tempMaxC: baseTemp + 4,
    windSpeedKmh: 9,
    weatherCode: 0,
    isDay,
    condition: currentMapped.condition,
    labelFa: currentMapped.labelFa,
    daily,
    updatedAt: Date.now(),
  };
}

export async function fetchLiveWeather(lat: number, lng: number): Promise<LiveWeatherData> {
  const cacheKey = `${WEATHER_CACHE_KEY}_${lat.toFixed(2)}_${lng.toFixed(2)}`;
  try {
    const raw = localStorage.getItem(cacheKey);
    if (raw) {
      const parsed: LiveWeatherData = JSON.parse(raw);
      if (Date.now() - parsed.updatedAt < 20 * 60 * 1000 && Array.isArray(parsed.daily) && parsed.daily.length > 0) {
        return parsed;
      }
    }
  } catch {}

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4200);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error('Weather HTTP ' + res.status);
    const data = await res.json();

    const cur = data?.current || {};
    const dBlock = data?.daily || {};
    const times: string[] = Array.isArray(dBlock.time) ? dBlock.time : [];
    const maxArr: number[] = Array.isArray(dBlock.temperature_2m_max) ? dBlock.temperature_2m_max : [];
    const minArr: number[] = Array.isArray(dBlock.temperature_2m_min) ? dBlock.temperature_2m_min : [];
    const codeArr: number[] = Array.isArray(dBlock.weather_code) ? dBlock.weather_code : [];

    const daily: DailyWeatherForecast[] = times.map((t, i) => {
      const wCode = Number(codeArr[i] ?? 0);
      const mapped = mapWmoCodeToCondition(wCode, true, 10);
      return {
        dateIso: String(t),
        weatherCode: wCode,
        condition: mapped.condition,
        labelFa: mapped.labelFa,
        tempMaxC: Math.round(Number(maxArr[i] ?? 24)),
        tempMinC: Math.round(Number(minArr[i] ?? 14)),
      };
    });

    const isDay = Number(cur.is_day ?? 1) === 1;
    const windKmh = Math.round(Number(cur.wind_speed_10m ?? 8));
    const curCode = Number(cur.weather_code ?? 0);
    const curMapped = mapWmoCodeToCondition(curCode, isDay, windKmh);
    const tempC = Math.round(Number(cur.temperature_2m ?? daily[0]?.tempMaxC ?? 22));

    const result: LiveWeatherData = {
      tempC,
      tempMinC: daily[0]?.tempMinC ?? tempC - 5,
      tempMaxC: daily[0]?.tempMaxC ?? tempC + 3,
      windSpeedKmh: windKmh,
      weatherCode: curCode,
      isDay,
      condition: curMapped.condition,
      labelFa: curMapped.labelFa,
      daily,
      updatedAt: Date.now(),
    };

    try {
      localStorage.setItem(cacheKey, JSON.stringify(result));
    } catch {}
    return result;
  } catch {
    return buildFallbackWeather(lat);
  }
}
