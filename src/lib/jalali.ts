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
  let days = (365 * gy) + (div(gy2, 4)) - (div(gy2, 100)) + (div(gy2, 400)) + gd + g_d_m[gm - 1];
  jy += 33 * div(days, 12053);
  days = mod(days, 12053);
  jy += 4 * div(days, 1461);
  days = mod(days, 1461);
  if (days > 365) {
    jy += div((days - 1), 365);
    days = mod((days - 1), 365);
  }
  let jm;
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
