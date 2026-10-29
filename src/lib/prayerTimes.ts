export type PrayerTime = {
  name: string;
  nameFa: string;
  time: string;
  key: string;
};

export type PrayerTimes = {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  midnight: string;
  date: string;
  hijri: string;
  hijriDate: string;
  location: string;
};

const prayerNames: PrayerTime[] = [
  { name: 'Fajr', nameFa: 'صبح', time: '', key: 'fajr' },
  { name: 'Sunrise', nameFa: 'طلوع', time: '', key: 'sunrise' },
  { name: 'Dhuhr', nameFa: 'ظهر', time: '', key: 'dhuhr' },
  { name: 'Asr', nameFa: 'عصر', time: '', key: 'asr' },
  { name: 'Maghrib', nameFa: 'مغرب', time: '', key: 'maghrib' },
  { name: 'Isha', nameFa: 'عشاء', time: '', key: 'isha' },
  { name: 'Midnight', nameFa: 'نیمه‌شب', time: '', key: 'midnight' },
];

export function getPrayerNames(): PrayerTime[] {
  return prayerNames;
}

function julianDate(year: number, month: number, day: number): number {
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

function gregorianToHijri(year: number, month: number, day: number): { year: number; month: number; day: number } {
  const jd = julianDate(year, month, day);
  const l1 = jd - 1948440 + 10632;
  const n = Math.floor((l1 - 1) / 10631);
  const l2 = l1 - 10631 * n + 354;
  const j =
    Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
    Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const m = Math.floor((24 * l3) / 709);
  const d = l3 - Math.floor(709 * m / 24);
  const y = 30 * n + j - 30;
  return { year: y, month: m, day: d };
}

const hijriMonthsFa = [
  'محرم', 'صفر', 'ربیع‌الاول', 'ربیع‌الثانی', 'جمادی‌الاول', 'جمادی‌الثانی',
  'رجب', 'شعبان', 'رمضان', 'شوال', 'ذی‌القعده', 'ذی‌الحجه',
];

function deg2rad(d: number): number { return (d * Math.PI) / 180; }
function rad2deg(r: number): number { return (r * 180) / Math.PI; }

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return NaN;
  return h * 60 + m;
}

export function minutesToTime(min: number): string {
  if (min < 0) min += 24 * 60;
  if (min >= 24 * 60) min -= 24 * 60;
  const h = Math.floor(min / 60);
  const m = Math.floor(min % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function getTimezoneOffsetHours(timezone: string, date: Date = new Date()): number {
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    const parts = dtf.formatToParts(date);
    const map: Record<string, number> = {};
    for (const p of parts) {
      if (p.type !== 'literal') map[p.type] = parseInt(p.value, 10);
    }
    const asUTC = Date.UTC(map.year, map.month - 1, map.day, map.hour % 24, map.minute, map.second);
    return (asUTC - date.getTime()) / (1000 * 60 * 60);
  } catch {
    return -date.getTimezoneOffset() / 60;
  }
}

export function getLocalDateString(date: Date = new Date(), timezone?: string): string {
  if (timezone) {
    try {
      const dtf = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric', month: '2-digit', day: '2-digit',
      });
      return dtf.format(date);
    } catch {
      // fall through
    }
  }
  const d = date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type MethodParams = { fajrAngle: number; ishaAngle: number; maghribAngle?: number; ishaMinutesAfterMaghrib?: number };

const METHODS: Record<string, MethodParams> = {
  jafari: { fajrAngle: 16, ishaAngle: 14, maghribAngle: 4 },
  tehran: { fajrAngle: 17.7, ishaAngle: 14, maghribAngle: 4.5 },
  mwl: { fajrAngle: 18, ishaAngle: 17 },
  egyptian: { fajrAngle: 19.5, ishaAngle: 17.5 },
  karachi: { fajrAngle: 18, ishaAngle: 18 },
  umm_al_qura: { fajrAngle: 18.5, ishaAngle: 0, ishaMinutesAfterMaghrib: 90 },
};

export function getAvailableMethods(): { id: string; name: string }[] {
  return [
    { id: 'jafari', name: 'جعفری (شیعه)' },
    { id: 'tehran', name: 'تهران (ژئوفیزیک)' },
    { id: 'mwl', name: 'اتحادیه اسلامی جهانی' },
    { id: 'egyptian', name: 'مصری' },
    { id: 'karachi', name: 'کراچی' },
    { id: 'umm_al_qura', name: 'ام‌القری' },
  ];
}

export function calculatePrayerTimes(
  date: Date,
  lat: number,
  lng: number,
  timezone: number | string = 'Asia/Tehran',
  method: string = 'jafari',
): PrayerTimes {
  const tzOffset = typeof timezone === 'string'
    ? getTimezoneOffsetHours(timezone, date)
    : timezone;

  const params = METHODS[method] ?? METHODS.jafari;

  const tzName = typeof timezone === 'string' ? timezone : undefined;
  const localDateStr = getLocalDateString(date, tzName);
  const [calcYear, calcMonth, calcDay] = localDateStr.split('-').map(Number);
  const calcDate = new Date(calcYear, calcMonth - 1, calcDay);

  const j = julianDate(calcDate.getFullYear(), calcDate.getMonth() + 1, calcDate.getDate()) - 2451545;

  const sunLng = normalizeDeg(280.46 + 0.9856474 * j);
  const M = normalizeDeg(357.528 + 0.9856003 * j);
  const ec = 1.915 * Math.sin(deg2rad(M)) + 0.02 * Math.sin(deg2rad(2 * M));
  const trueLng = sunLng + ec;
  const omega = normalizeDeg(125.04 - 0.052954 * j);
  const lambda = trueLng - 0.00569 - 0.00478 * Math.sin(deg2rad(omega));

  const declination = rad2deg(Math.asin(
    Math.sin(deg2rad(23.44)) * Math.sin(deg2rad(lambda))
  ));

  const dayOfYear = Math.floor(
    (Date.UTC(calcDate.getFullYear(), calcDate.getMonth(), calcDate.getDate()) -
      Date.UTC(calcDate.getFullYear(), 0, 0)) / 86400000
  );
  const B = deg2rad(360 * (dayOfYear - 81) / 364);
  const eotMin = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);

  const tzMeridian = tzOffset * 15;
  const solarNoonMin = 720 + 4 * (tzMeridian - lng) - eotMin;
  const noonMinutes = solarNoonMin;

  function sunAngleTime(angle: number, isRising: boolean, baseMin: number): string {
    const latRad = deg2rad(lat);
    const decRad = deg2rad(declination);
    const cosH = (-Math.sin(deg2rad(angle)) - Math.sin(latRad) * Math.sin(decRad)) /
      (Math.cos(latRad) * Math.cos(decRad));
    if (cosH < -1 || cosH > 1) return '--:--';
    const H = rad2deg(Math.acos(cosH));
    const hourAngleMin = (isRising ? -H : H) / 15 * 60;
    return minutesToTime(baseMin + hourAngleMin);
  }

  function asrTime(factor: number, baseMin: number): string {
    const latRad = deg2rad(lat);
    const decRad = deg2rad(declination);
    const tanAlpha = 1 / (factor + Math.tan(Math.abs(latRad - decRad)));
    const alphaRad = Math.atan(tanAlpha);
    const sinAlpha = Math.sin(alphaRad);
    const cosH = (sinAlpha - Math.sin(latRad) * Math.sin(decRad)) /
      (Math.cos(latRad) * Math.cos(decRad));
    if (cosH < -1 || cosH > 1) return '--:--';
    const H = rad2deg(Math.acos(cosH));
    return minutesToTime(baseMin + H / 15 * 60);
  }

  const fajr = sunAngleTime(params.fajrAngle, true, noonMinutes);
  const sunrise = sunAngleTime(0.833, true, noonMinutes);
  const sunset = sunAngleTime(0.833, false, noonMinutes);
  const dhuhr = minutesToTime(noonMinutes + 2);
  const asr = asrTime(1, noonMinutes);
  const maghribAngle = params.maghribAngle ?? 0.833;
  const maghrib = sunAngleTime(maghribAngle, false, noonMinutes);

  let isha: string;
  if (params.ishaMinutesAfterMaghrib) {
    isha = minutesToTime(timeToMinutes(maghrib) + params.ishaMinutesAfterMaghrib);
  } else {
    isha = sunAngleTime(params.ishaAngle, false, noonMinutes);
  }

  const sunsetMin = timeToMinutes(sunset);
  const sunriseMin = timeToMinutes(sunrise);
  let midnightMin: number;
  if (!isNaN(sunsetMin) && !isNaN(sunriseMin)) {
    const nextSunriseMin = sunriseMin + 24 * 60;
    midnightMin = (sunsetMin + nextSunriseMin) / 2;
    if (midnightMin >= 24 * 60) midnightMin -= 24 * 60;
  } else {
    midnightMin = 0;
  }
  const midnight = minutesToTime(midnightMin);

  const hijri = gregorianToHijri(calcDate.getFullYear(), calcDate.getMonth() + 1, calcDate.getDate());
  const hijriDate = `${hijri.day} ${hijriMonthsFa[hijri.month - 1]} ${hijri.year}`;

  const dateStr = localDateStr;

  return {
    fajr,
    sunrise,
    dhuhr,
    asr,
    maghrib,
    isha,
    midnight,
    date: dateStr,
    hijri: `${hijri.year}/${String(hijri.month).padStart(2, '0')}/${String(hijri.day).padStart(2, '0')}`,
    hijriDate,
    location: '',
  };
}

function normalizeDeg(deg: number): number {
  deg = deg % 360;
  if (deg < 0) deg += 360;
  return deg;
}

export function getNextPrayer(
  times: PrayerTimes,
  timezone?: string,
): { name: string; nameFa: string; time: string; key: string; remaining: string } | null {
  const now = new Date();
  let nowMin: number;
  if (timezone) {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
    const parts = dtf.formatToParts(now);
    const h = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
    const m = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
    nowMin = (h % 24) * 60 + m;
  } else {
    nowMin = now.getHours() * 60 + now.getMinutes();
  }
  const prayers = [
    { name: 'Fajr', nameFa: 'صبح', time: times.fajr, key: 'fajr' },
    { name: 'Dhuhr', nameFa: 'ظهر', time: times.dhuhr, key: 'dhuhr' },
    { name: 'Asr', nameFa: 'عصر', time: times.asr, key: 'asr' },
    { name: 'Maghrib', nameFa: 'مغرب', time: times.maghrib, key: 'maghrib' },
    { name: 'Isha', nameFa: 'عشاء', time: times.isha, key: 'isha' },
  ];
  for (const p of prayers) {
    const pMin = timeToMinutes(p.time);
    if (isNaN(pMin)) continue;
    if (pMin > nowMin) {
      const diff = pMin - nowMin;
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      return { ...p, remaining: `${hours.toLocaleString('fa-IR')}س ${mins.toLocaleString('fa-IR')}د` };
    }
  }
  const fMin = timeToMinutes(times.fajr);
  if (isNaN(fMin)) return null;
  const nextFajrMin = fMin + 24 * 60;
  const diff = nextFajrMin - nowMin;
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  return { name: 'Fajr', nameFa: 'صبح', time: times.fajr, key: 'fajr', remaining: `${hours.toLocaleString('fa-IR')}س ${mins.toLocaleString('fa-IR')}د` };
}
