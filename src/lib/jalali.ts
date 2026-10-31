const jalaliMonths = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

const jalaliWeekdays = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];

function div(a: number, b: number): number { return Math.floor(a / b); }
function mod(a: number, b: number): number { return a - Math.floor(a / b) * b; }

function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = (gy <= 1600) ? 0 : 979;
  gy -= (gy <= 1600) ? 621 : 1600;
  const gy2 = (gm > 2) ? (gy + 1) : gy;

  // Correct Gregorian-to-Jalali epoch offset and leap-year accounting.
  let days = (365 * gy)
    + div(gy2 + 3, 4)
    - div(gy2 + 99, 100)
    + div(gy2 + 399, 400)
    - 80
    + gd
    + g_d_m[gm - 1];

  jy += 33 * div(days, 12053);
  days = mod(days, 12053);
  jy += 4 * div(days, 1461);
  days = mod(days, 1461);
  if (days > 365) {
    jy += div((days - 1), 365);
    days = mod((days - 1), 365);
  }

  let jm: number;
  if (days < 186) {
    jm = 1 + div(days, 31);
    days = 1 + mod(days, 31);
  } else {
    days -= 186;
    jm = 7 + div(days, 30);
    days = 1 + mod(days, 30);
  }
  return [jy, jm, days];
}

const faDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

function toFaDigits(s: string | number): string {
  return String(s).replace(/[0-9]/g, (d) => faDigits[parseInt(d, 10)]);
}

export function toJalaliShort(date: Date): string {
  const [jy, jm, jd] = gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return `${toFaDigits(jd)} ${jalaliMonths[jm - 1]} ${toFaDigits(jy)}`;
}

export function toJalaliFull(date: Date): string {
  const [jy, jm, jd] = gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return `${toFaDigits(jy)}/${toFaDigits(String(jm).padStart(2, '0'))}/${toFaDigits(String(jd).padStart(2, '0'))}`;
}

export function getJalaliWeekday(date: Date): string {
  return jalaliWeekdays[date.getDay()];
}

export function getJalaliMonthDay(date: Date): string {
  const [, jm, jd] = gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return `${toFaDigits(jd)} ${jalaliMonths[jm - 1]}`;
}

export { jalaliMonths, jalaliWeekdays, toFaDigits };


export function jalaliToGregorian(jy: number, jm: number, jd: number): [number, number, number] {
  jy += 1595;
  let days = -355668 + (365 * jy) + (Math.floor(jy / 33) * 8) + Math.floor(((jy % 33) + 3) / 4) + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
  let gy = 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let gd = days + 1;
  const sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  for (gm = 0; gm < 13 && gd > sal_a[gm]; gm++) gd -= sal_a[gm];
  return [gy, gm, gd];
}

export function getJalaliParts(date: Date): { jy: number; jm: number; jd: number } {
  const [jy, jm, jd] = gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return { jy, jm, jd };
}
