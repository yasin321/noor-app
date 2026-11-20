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

export type PrayerManualOffsets = {
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
};

const MANUAL_OFFSETS_KEY = 'noor_prayer_manual_offsets_v1';

const DEFAULT_OFFSETS: PrayerManualOffsets = {
  fajr: 0,
  dhuhr: 0,
  asr: 0,
  maghrib: 0,
  isha: 0,
};

function clampOffset(val: unknown): number {
  const n = Number(val);
  if (!Number.isFinite(n)) return 0;
  return Math.max(-5, Math.min(5, Math.round(n)));
}

export function getPrayerManualOffsets(): PrayerManualOffsets {
  try {
    const raw = localStorage.getItem(MANUAL_OFFSETS_KEY);
    if (!raw) return { ...DEFAULT_OFFSETS };
    const p = JSON.parse(raw);
    return {
      fajr: clampOffset(p?.fajr),
      dhuhr: clampOffset(p?.dhuhr),
      asr: clampOffset(p?.asr),
      maghrib: clampOffset(p?.maghrib),
      isha: clampOffset(p?.isha),
    };
  } catch {
    return { ...DEFAULT_OFFSETS };
  }
}

export function savePrayerManualOffsets(offsets: PrayerManualOffsets): void {
  const clean: PrayerManualOffsets = {
    fajr: clampOffset(offsets.fajr),
    dhuhr: clampOffset(offsets.dhuhr),
    asr: clampOffset(offsets.asr),
    maghrib: clampOffset(offsets.maghrib),
    isha: clampOffset(offsets.isha),
  };
  try {
    localStorage.setItem(MANUAL_OFFSETS_KEY, JSON.stringify(clean));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('noor-calc-method-changed'));
    }
  } catch {}
}

export function hasNonZeroManualOffsets(offsets: PrayerManualOffsets = getPrayerManualOffsets()): boolean {
  return (
    offsets.fajr !== 0 ||
    offsets.dhuhr !== 0 ||
    offsets.asr !== 0 ||
    offsets.maghrib !== 0 ||
    offsets.isha !== 0
  );
}

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
  const l3 =
    l2 -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;
  const m = Math.floor((24 * l3) / 709);
  const d = l3 - Math.floor((709 * m) / 24);
  const y = 30 * n + j - 30;
  return { year: y, month: m, day: d };
}

const hijriMonthsFa = [
  'محرم', 'صفر', 'ربیع‌الاول', 'ربیع‌الثانی', 'جمادی‌الاول', 'جمادی‌الثانی',
  'رجب', 'شعبان', 'رمضان', 'شوال', 'ذی‌القعده', 'ذی‌الحجه',
];

function deg2rad(d: number): number { return (d * Math.PI) / 180; }
function rad2deg(r: number): number { return (r * 180) / Math.PI; }

function normalizeDeg(deg: number): number {
  const r = deg % 360;
  return r < 0 ? r + 360 : r;
}

function normalizeHour(h: number): number {
  const r = h % 24;
  return r < 0 ? r + 24 : r;
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return NaN;
  return h * 60 + m;
}

export function minutesToTime(min: number): string {
  if (!Number.isFinite(min)) return '--:--';
  let total = Math.round(min) % 1440;
  if (total < 0) total += 1440;
  const h = Math.floor(total / 60);
  const m = total % 60;
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

type MethodParams = {
  fajrAngle: number;
  ishaAngle: number;
  maghribAngle?: number;
  ishaMinutesAfterMaghrib?: number;
  midnightMode: 'jafari' | 'standard';
};

const METHODS: Record<string, MethodParams> = {
  tehran: { fajrAngle: 17.7, ishaAngle: 14, maghribAngle: 4.5, midnightMode: 'jafari' },
  jafari: { fajrAngle: 16, ishaAngle: 14, maghribAngle: 4, midnightMode: 'jafari' },
  mwl: { fajrAngle: 18, ishaAngle: 17, midnightMode: 'standard' },
  egyptian: { fajrAngle: 19.5, ishaAngle: 17.5, midnightMode: 'standard' },
  karachi: { fajrAngle: 18, ishaAngle: 18, midnightMode: 'standard' },
  umm_al_qura: { fajrAngle: 18.5, ishaAngle: 0, ishaMinutesAfterMaghrib: 90, midnightMode: 'standard' },
};

export function getAvailableMethods(): { id: string; name: string }[] {
  return [
    { id: 'tehran', name: 'تهران — مؤسسه ژئوفیزیک (رسمی ایران)' },
    { id: 'jafari', name: 'جعفری — مؤسسه لواء قم' },
    { id: 'mwl', name: 'اتحادیه اسلامی جهانی' },
    { id: 'egyptian', name: 'مصری' },
    { id: 'karachi', name: 'کراچی' },
    { id: 'umm_al_qura', name: 'ام‌القری' },
  ];
}

// الگوریتم دقیق نجومی USNO / PrayTimes (معادله زمان و میل خورشید بدون تقریب)
function sunPosition(jd: number): { decl: number; eqt: number } {
  const D = jd - 2451545.0;
  const g = normalizeDeg(357.529 + 0.98560028 * D);
  const q = normalizeDeg(280.459 + 0.98564736 * D);
  const L = normalizeDeg(q + 1.915 * Math.sin(deg2rad(g)) + 0.020 * Math.sin(deg2rad(2 * g)));
  const e = 23.439 - 0.00000036 * D;

  const RA =
    rad2deg(Math.atan2(Math.cos(deg2rad(e)) * Math.sin(deg2rad(L)), Math.cos(deg2rad(L)))) / 15;
  let eqt = q / 15 - normalizeHour(RA);
  if (eqt > 12) eqt -= 24;
  if (eqt < -12) eqt += 24;

  const decl = rad2deg(Math.asin(Math.sin(deg2rad(e)) * Math.sin(deg2rad(L))));
  return { decl, eqt };
}

export function calculatePrayerTimes(
  date: Date,
  lat: number,
  lng: number,
  timezone: number | string = 'Asia/Tehran',
  method: string = 'tehran',
): PrayerTimes {
  const tzOffset = typeof timezone === 'string'
    ? getTimezoneOffsetHours(timezone, date)
    : timezone;

  const params = METHODS[method] ?? METHODS.tehran;

  const tzName = typeof timezone === 'string' ? timezone : undefined;
  const localDateStr = getLocalDateString(date, tzName);
  const [calcYear, calcMonth, calcDay] = localDateStr.split('-').map(Number);

  // روز ژولین اصلاح‌شده بر اساس طول جغرافیایی شهر
  const jDate = julianDate(calcYear, calcMonth, calcDay) - lng / (15 * 24);

  function midDay(dayFrac: number): number {
    const { eqt } = sunPosition(jDate + dayFrac);
    return normalizeHour(12 - eqt);
  }

  function sunAngleHours(angleDeg: number, dayFrac: number, isRising: boolean): number {
    const { decl } = sunPosition(jDate + dayFrac);
    const noon = midDay(dayFrac);
    const latRad = deg2rad(lat);
    const decRad = deg2rad(decl);
    const cosH =
      (-Math.sin(deg2rad(angleDeg)) - Math.sin(latRad) * Math.sin(decRad)) /
      (Math.cos(latRad) * Math.cos(decRad));
    if (cosH < -1 || cosH > 1) return NaN;
    const H = rad2deg(Math.acos(cosH)) / 15;
    return noon + (isRising ? -H : H);
  }

  function asrHours(factor: number, dayFrac: number): number {
    const { decl } = sunPosition(jDate + dayFrac);
    const elevationDeg = rad2deg(Math.atan(1 / (factor + Math.tan(Math.abs(deg2rad(lat - decl))))));
    return sunAngleHours(-elevationDeg, dayFrac, false);
  }

  // ۲ مرحله تکرار برای محاسبه دقیق موقعیت خورشید در لحظه واقعی هر نماز
  let tFajr = 5 / 24;
  let tSunrise = 6 / 24;
  let tDhuhr = 12 / 24;
  let tAsr = 13 / 24;
  let tSunset = 18 / 24;
  let tMaghrib = 18 / 24;
  let tIsha = 18 / 24;

  let fajrH = NaN;
  let sunriseH = NaN;
  let dhuhrH = NaN;
  let asrH = NaN;
  let sunsetH = NaN;
  let maghribH = NaN;
  let ishaH = NaN;

  for (let iter = 0; iter < 2; iter++) {
    fajrH = sunAngleHours(params.fajrAngle, tFajr, true);
    sunriseH = sunAngleHours(0.833, tSunrise, true);
    dhuhrH = midDay(tDhuhr);
    asrH = asrHours(1, tAsr);
    sunsetH = sunAngleHours(0.833, tSunset, false);
    maghribH = sunAngleHours(params.maghribAngle ?? 0.833, tMaghrib, false);
    ishaH = params.ishaMinutesAfterMaghrib
      ? maghribH + params.ishaMinutesAfterMaghrib / 60
      : sunAngleHours(params.ishaAngle, tIsha, false);

    if (Number.isFinite(fajrH)) tFajr = fajrH / 24;
    if (Number.isFinite(sunriseH)) tSunrise = sunriseH / 24;
    if (Number.isFinite(dhuhrH)) tDhuhr = dhuhrH / 24;
    if (Number.isFinite(asrH)) tAsr = asrH / 24;
    if (Number.isFinite(sunsetH)) tSunset = sunsetH / 24;
    if (Number.isFinite(maghribH)) tMaghrib = maghribH / 24;
    if (Number.isFinite(ishaH)) tIsha = ishaH / 24;
  }

  const tzAdjustHours = tzOffset - lng / 15;
  const toLocalMin = (h: number) => (Number.isFinite(h) ? (h + tzAdjustHours) * 60 : NaN);

  const manual = getPrayerManualOffsets();

  const fajrMin = toLocalMin(fajrH) + manual.fajr;
  const sunriseMin = toLocalMin(sunriseH);
  const dhuhrMin = toLocalMin(dhuhrH) + manual.dhuhr;
  const asrMin = toLocalMin(asrH) + manual.asr;
  const sunsetMin = toLocalMin(sunsetH);
  const maghribMin = toLocalMin(maghribH) + manual.maghrib;
  const ishaMin = toLocalMin(ishaH) + manual.isha;

  // نیمه‌شب شرعی: برای شیعه (ژئوفیزیک تهران و جعفری) میانه غروب تا اذان صبح؛ برای اهل‌سنت میانه غروب تا طلوع
  const morningRefMin = params.midnightMode === 'jafari' ? fajrMin : sunriseMin;
  let midnightMin = NaN;
  if (Number.isFinite(sunsetMin) && Number.isFinite(morningRefMin)) {
    let nightLen = morningRefMin - sunsetMin;
    if (nightLen < 0) nightLen += 1440;
    midnightMin = sunsetMin + nightLen / 2;
  }

  const hijri = gregorianToHijri(calcYear, calcMonth, calcDay);
  const hijriDate = `${hijri.day} ${hijriMonthsFa[hijri.month - 1]} ${hijri.year}`;

  return {
    fajr: minutesToTime(fajrMin),
    sunrise: minutesToTime(sunriseMin),
    dhuhr: minutesToTime(dhuhrMin),
    asr: minutesToTime(asrMin),
    maghrib: minutesToTime(maghribMin),
    isha: minutesToTime(ishaMin),
    midnight: minutesToTime(midnightMin),
    date: localDateStr,
    hijri: `${hijri.year}/${String(hijri.month).padStart(2, '0')}/${String(hijri.day).padStart(2, '0')}`,
    hijriDate,
    location: '',
  };
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

export interface NightPrayerConfig {
  enabled: boolean;
  alarmEnabled: boolean;
  timingMode: 'last_third_start' | 'before_fajr_45' | 'before_fajr_30' | 'custom';
  customTime: string;
  soundMode: 'adhan' | 'chant' | 'silent';
}

const NIGHT_PRAYER_CONFIG_KEY = 'noor_night_prayer_config_v1';

export function getNightPrayerConfig(): NightPrayerConfig {
  try {
    const raw = localStorage.getItem(NIGHT_PRAYER_CONFIG_KEY);
    if (!raw) {
      return {
        enabled: false,
        alarmEnabled: false,
        timingMode: 'last_third_start',
        customTime: '03:45',
        soundMode: 'chant',
      };
    }
    return {
      enabled: false,
      alarmEnabled: false,
      timingMode: 'last_third_start',
      customTime: '03:45',
      soundMode: 'chant',
      ...JSON.parse(raw),
    };
  } catch {
    return {
      enabled: false,
      alarmEnabled: false,
      timingMode: 'last_third_start',
      customTime: '03:45',
      soundMode: 'chant',
    };
  }
}

export function saveNightPrayerConfig(cfg: NightPrayerConfig): void {
  try {
    localStorage.setItem(NIGHT_PRAYER_CONFIG_KEY, JSON.stringify(cfg));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('noor-night-prayer-changed', { detail: cfg }));
    }
  } catch {}
}

export function calculateNightPrayerWindow(times: PrayerTimes, cfg: NightPrayerConfig = getNightPrayerConfig()): {
  startTime: string;
  endTime: string;
  recommendedAlarmTime: string;
  descriptionFa: string;
} {
  const maghribMin = timeToMinutes(times.maghrib);
  let fajrMin = timeToMinutes(times.fajr);
  if (fajrMin <= maghribMin) fajrMin += 1440;

  const nightDuration = fajrMin - maghribMin;
  const lastThirdStartMin = (maghribMin + Math.round((nightDuration * 2) / 3)) % 1440;
  const fmt = (totalM: number) => {
    const m = ((totalM % 1440) + 1440) % 1440;
    const hh = Math.floor(m / 60);
    const mm = m % 60;
    return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
  };

  const startTime = fmt(lastThirdStartMin);
  const endTime = times.fajr;

  let recommendedAlarmTime = startTime;
  if (cfg.timingMode === 'before_fajr_45') {
    recommendedAlarmTime = fmt(fajrMin - 45);
  } else if (cfg.timingMode === 'before_fajr_30') {
    recommendedAlarmTime = fmt(fajrMin - 30);
  } else if (cfg.timingMode === 'custom' && cfg.customTime) {
    recommendedAlarmTime = cfg.customTime;
  }

  return {
    startTime,
    endTime,
    recommendedAlarmTime,
    descriptionFa: 'ثلث آخر شب (' + startTime + ' تا اذان صبح ' + endTime + ')',
  };
}
