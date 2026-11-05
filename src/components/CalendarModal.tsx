import { useState, useEffect } from 'react';
import { fetchLiveWeather, getTemperatureUnit, formatTempValue, type LiveWeatherData } from '@/lib/weatherService';
import { WeatherCuteArtwork } from '@/components/WeatherCuteCard';
import { createPortal } from 'react-dom';
import { Calendar, X, ChevronRight, ChevronLeft, Sparkles, ArrowLeftRight, AlertTriangle } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { toJalaliShort, getJalaliWeekday, toFaDigits, jalaliMonths, jalaliToGregorian, getJalaliParts } from '@/lib/jalali';
import { calculatePrayerTimes } from '@/lib/prayerTimes';

interface Props {
  cityLat: number;
  cityLng: number;
  cityTimezone: string;
  cityName: string;
  onClose: () => void;
}

const DAILY_WIRD: Record<number, { dayFa: string; imam: string; dhikr: string; count: number; deed: string }> = {
  6: { dayFa: 'شنبه', imam: 'متعلق به پیامبر اکرم (ص)', dhikr: 'يَا رَبَّ الْعَالَمِينَ', count: 100, deed: 'قرائت زیارت پیامبر (ص) و آغاز برنامه‌های هفتگی با صلوات' },
  0: { dayFa: 'یکشنبه', imam: 'متعلق به امیرالمؤمنین (ع) و حضرت زهرا (س)', dhikr: 'يَا ذَا الْجَلَالِ وَالْإِكْرَامِ', count: 100, deed: 'زیارت امیرالمؤمنین (ع) و حضرت زهرا (س) و صدقه برای سلامتی خانواده' },
  1: { dayFa: 'دوشنبه', imam: 'متعلق به امام حسن و امام حسین (ع)', dhikr: 'يَا قَاضِيَ الْحَاجَاتِ', count: 100, deed: 'تلاوت سوره واقعه و سلام به سیدالشهدا (ع)' },
  2: { dayFa: 'سه‌شنبه', imam: 'متعلق به امام سجاد، امام باقر و امام صادق (ع)', dhikr: 'يَا أَرْحَمَ الرَّاحِمِينَ', count: 100, deed: 'قرائت دعای توبه و استغفار در صحیفه سجادیه' },
  3: { dayFa: 'چهارشنبه', imam: 'متعلق به امام کاظم، امام رضا، امام جواد و امام هادی (ع)', dhikr: 'يَا حَيُّ يَا قَيُّومُ', count: 100, deed: 'زیارت مخصوص امام رضا (ع) و صلوات خاصه آن حضرت' },
  4: { dayFa: 'پنجشنبه', imam: 'متعلق به امام حسن عسکری (ع)', dhikr: 'لَا إِلَهَ إِلَّا اللَّهُ الْمَلِكُ الْحَقُّ الْمُبِينُ', count: 100, deed: 'فاتحه و خیرات برای والدین و اهل قبور و سلام شب جمعه در غروب' },
  5: { dayFa: 'جمعه', imam: 'متعلق به حضرت ولی‌عصر امام زمان (عج)', dhikr: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَآلِ مُحَمَّدٍ وَعَجِّلْ فَرَجَهُمْ', count: 100, deed: 'تلاوت سوره صافات، دعای ندبه و صلوات ضراب اصفهانی در عصر جمعه' },
};

const JALALI_OCCASIONS: Record<string, Array<{ title: string; badge: string }>> = {
  '1-1': [{ title: 'آغاز سال نو خورشیدی و عید باستانی نوروز (قرائت دعای تحویل سال)', badge: '🎉 عید ملی و باستانی' }],
  '1-2': [{ title: 'عید نوروز — صله رحم و دید و بازدید خانواده', badge: '🌿 جشن نوروز' }],
  '1-6': [{ title: 'روز امید و روز شادباش‌نویسی', badge: '✨ جشن ایرانی' }],
  '1-12': [{ title: 'روز جمهوری اسلامی ایران', badge: '🇮🇷 مناسبت ملی' }],
  '1-13': [{ title: 'جشن سیزده‌به‌در و روز طبیعت', badge: '🌱 جشن طبیعت' }],
  '1-19': [{ title: 'جشن فروردینگان', badge: '✨ جشن ایرانی' }],
  '1-25': [{ title: 'روز بزرگداشت عطار نیشابوری', badge: '📚 فرهنگ و ادب' }],
  '2-1': [{ title: 'روز بزرگداشت سعدی شیرازی', badge: '📜 فرهنگ و ادب' }],
  '2-2': [{ title: 'جشن اردیبهشتگان و روز زمین پاک', badge: '🌸 جشن ایرانی' }],
  '2-3': [{ title: 'روز بزرگداشت شیخ بهایی', badge: '🕌 علم و عرفان' }],
  '2-10': [{ title: 'روز ملی خلیج فارس', badge: '🌊 مناسبت ملی' }],
  '2-12': [{ title: 'روز معلم و بزرگداشت استاد شهید مطهری', badge: '🎓 فرهنگ و دانش' }],
  '2-25': [{ title: 'روز پاسداشت زبان فارسی و بزرگداشت حکیم ابوالقاسم فردوسی', badge: '📜 فرهنگ و ادب' }],
  '2-28': [{ title: 'روز بزرگداشت حکیم عمر خیام', badge: '🌟 علم و ادب' }],
  '3-3': [{ title: 'سالروز آزادسازی خرمشهر', badge: '🇮🇷 مناسبت ملی' }],
  '3-4': [{ title: 'جشن خردادگان', badge: '💧 جشن ایرانی' }],
  '3-14': [{ title: 'رحلت امام خمینی (ره)', badge: '🕯️ مناسبت رسمی' }],
  '4-1': [{ title: 'جشن آب‌پاشونک و آغاز تابستان', badge: '☀️ جشن ایرانی' }],
  '4-13': [{ title: 'جشن تیرگان و روز کمانگیر آرش', badge: '🏹 جشن باستانی' }],
  '4-14': [{ title: 'روز قلم و اهل ادب', badge: '✒️ فرهنگ و ادب' }],
  '5-7': [{ title: 'جشن امردادگان', badge: '🌿 جشن ایرانی' }],
  '5-14': [{ title: 'سالروز صدور فرمان مشروطیت', badge: '📜 تاریخ ایران' }],
  '6-1': [{ title: 'روز پزشک و بزرگداشت حکیم ابوعلی سینا', badge: '🩺 علم و دانش' }],
  '6-4': [{ title: 'جشن شهریورگان', badge: '✨ جشن ایرانی' }],
  '6-13': [{ title: 'روز بزرگداشت ابوریحان بیرونی', badge: '🔭 علم و نجوم' }],
  '6-27': [{ title: 'روز شعر و ادب پارسی و بزرگداشت استاد شهریار', badge: '📖 فرهنگ و ادب' }],
  '7-1': [{ title: 'آغاز پاییز و بازگشایی مدارس', badge: '🍁 آغاز مهر' }],
  '7-8': [{ title: 'روز بزرگداشت مولوی', badge: '🕯️ عرفان و ادب' }],
  '7-16': [{ title: 'جشن باستانی مهرگان', badge: '🌾 جشن باستانی' }],
  '7-20': [{ title: 'روز بزرگداشت حافظ شیرازی (لسان‌الغیب)', badge: '📖 فرهنگ و ادب' }],
  '8-1': [{ title: 'روز آمار و برنامه‌ریزی', badge: '📊 مناسبت روز' }],
  '8-7': [{ title: 'پاسداشت میراث باستانی ایران', badge: '🏛️ تاریخ و فرهنگ' }],
  '8-10': [{ title: 'جشن آبانگان (پاسداشت آب‌های پاک)', badge: '💧 جشن باستانی' }],
  '8-13': [{ title: 'روز دانش‌آموز', badge: '🎓 مناسبت ملی' }],
  '8-24': [{ title: 'روز کتاب و کتاب‌خوانی و بزرگداشت علامه طباطبایی (ره)', badge: '📚 علم و معرفت' }],
  '9-9': [{ title: 'جشن آذرگان', badge: '🔥 جشن باستانی' }],
  '9-16': [{ title: 'روز دانشجو', badge: '🎓 مناسبت ملی' }],
  '9-25': [{ title: 'روز پژوهش و فناوری', badge: '🔬 علم و دانش' }],
  '9-30': [{ title: 'شب یلدا (شب چله — بلندترین شب سال و صله رحم با خانواده)', badge: '🍉 جشن باستانی یلدا' }],
  '10-1': [{ title: 'روز میلاد خورشید (خورروز) و آغاز زمستان', badge: '☀️ جشن دیگان' }],
  '10-5': [{ title: 'روز ایمنی در برابر زلزله', badge: '🛡️ مناسبت ملی' }],
  '11-2': [{ title: 'جشن بهمنگان', badge: '❄️ جشن ایرانی' }],
  '11-10': [{ title: 'جشن باستانی سده', badge: '🔥 جشن باستانی' }],
  '11-22': [{ title: 'سالروز پیروزی انقلاب اسلامی ایران', badge: '🇮🇷 مناسبت ملی' }],
  '12-5': [{ title: 'جشن اسفندگان و روز بزرگداشت مهندس (خواجه نصیرالدین طوسی)', badge: '🌿 جشن ایرانی و علمی' }],
  '12-15': [{ title: 'روز درختکاری و سرسبزی زمین', badge: '🌳 مناسبت ملی' }],
  '12-29': [{ title: 'روز ملی شدن صنعت نفت ایران و پایان سال خورشیدی', badge: '🇮🇷 مناسبت ملی' }],
};

function getHijriOccasions(hijriDateStr: string): Array<{ title: string; badge: string }> {
  const list: Array<{ title: string; badge: string }> = [];
  const norm = hijriDateStr.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
  const dayMatch = norm.match(/(\d+)/);
  const hDay = dayMatch ? Number(dayMatch[1]) : 0;

  if (hDay === 1) list.push({ title: 'آغاز ماه قمری — استحباب قرائت دعای رؤیت هلال و صدقه اول ماه', badge: '🌙 اول ماه قمری' });
  if (hDay === 13 || hDay === 14 || hDay === 15) list.push({ title: 'ایام البیض (روزهای ۱۳، ۱۴ و ۱۵ ماه قمری — فضیلت روزه، اعتکاف و دعای مجیر)', badge: '🌕 ایام البیض' });

  if (hijriDateStr.includes('محرم')) {
    if (hDay === 9) list.push({ title: 'تاسوعای حسینی و بزرگداشت حضرت ابوالفضل العباس (ع)', badge: '🏴 تاسوعای حسینی' });
    if (hDay === 10) list.push({ title: 'عاشورای حسینی — شهادت سیدالشهدا امام حسین (ع)', badge: '🏴 عاشورای حسینی' });
  }
  if (hijriDateStr.includes('صفر')) {
    if (hDay === 20) list.push({ title: 'اربعین حسینی — قرائت زیارت اربعین', badge: '🏴 اربعین حسینی' });
    if (hDay === 28) list.push({ title: 'رحلت پیامبر اکرم (ص) و شهادت امام حسن مجتبی (ع)', badge: '🕯️ مناسبت مذهبی' });
    if (hDay === 30 || hDay === 29) list.push({ title: 'شهادت حضرت علی بن موسی الرضا (ع)', badge: '🕯️ شهادت امام رضا (ع)' });
  }
  if (hijriDateStr.includes('ربیع‌الاول') || hijriDateStr.includes('ربیع الاول')) {
    if (hDay === 9) list.push({ title: 'آغاز امامت و ولایت حضرت ولی‌عصر امام زمان (عج)', badge: '🌸 عید ولایت امام عصر (عج)' });
    if (hDay === 17) list.push({ title: 'میلاد مسعود پیامبر اکرم حضرت محمد مصطفی (ص) و امام جعفر صادق (ع)', badge: '🌺 عید میلاد پیامبر (ص)' });
  }
  if (hijriDateStr.includes('جمادی‌الاول') || hijriDateStr.includes('جمادی الاول')) {
    if (hDay === 5) list.push({ title: 'ولادت باسعادت حضرت زینب کبری (س) و روز پرستار', badge: '🌸 ولادت حضرت زینب (س)' });
    if (hDay === 13) list.push({ title: 'ایام فاطمیه — شهادت حضرت فاطمه زهرا (س)', badge: '🏴 ایام فاطمیه' });
  }
  if (hijriDateStr.includes('جمادی‌الثانی') || hijriDateStr.includes('جمادی الثانی')) {
    if (hDay === 3) list.push({ title: 'شهادت حضرت فاطمه زهرا (س) (فاطمیه دوم)', badge: '🏴 شهادت حضرت زهرا (س)' });
    if (hDay === 20) list.push({ title: 'ولادت باسعادت حضرت فاطمه زهرا (س) و روز مادر', badge: '🌺 ولادت حضرت زهرا (س)' });
  }
  if (hijriDateStr.includes('رجب')) {
    if (hDay === 13) list.push({ title: 'ولادت امیرالمؤمنین حضرت علی (ع) در کعبه و روز پدر', badge: '👑 ولادت امیرالمؤمنین (ع)' });
    if (hDay === 27) list.push({ title: 'عید بزرگ مبعث پیامبر اکرم (ص)', badge: '✨ عید سعید مبعث' });
  }
  if (hijriDateStr.includes('شعبان')) {
    if (hDay === 3) list.push({ title: 'ولادت باسعادت سیدالشهدا امام حسین (ع)', badge: '🌺 اعیاد شعبانیه' });
    if (hDay === 4) list.push({ title: 'ولادت حضرت ابوالفضل العباس (ع)', badge: '🌺 اعیاد شعبانیه' });
    if (hDay === 15) list.push({ title: 'عید بزرگ نیمه شعبان — ولادت باسعادت حضرت مهدی موعود (عج)', badge: '👑 عید نیمه شعبان' });
  }
  if (hijriDateStr.includes('رمضان')) {
    if (hDay === 15) list.push({ title: 'ولادت باسعادت امام حسن مجتبی (ع)', badge: '🌺 میلاد امام حسن (ع)' });
    if (hDay === 19 || hDay === 21 || hDay === 23) list.push({ title: 'شب‌های پرفضیلت قدر و ایام شهادت امیرالمؤمنین علی (ع)', badge: '🌌 لیالی قدر' });
  }
  if (hijriDateStr.includes('شوال') && hDay === 1) list.push({ title: 'عید سعید فطر', badge: '🎉 عید سعید فطر' });
  if ((hijriDateStr.includes('ذی‌القعده') || hijriDateStr.includes('ذی القعده')) && hDay === 11) list.push({ title: 'ولادت حضرت علی بن موسی الرضا (ع)', badge: '👑 میلاد امام رضا (ع)' });
  if (hijriDateStr.includes('ذی‌الحجه') || hijriDateStr.includes('ذی الحجه')) {
    if (hDay === 9) list.push({ title: 'روز عرفه — قرائت دعای امام حسین (ع)', badge: '🤲 روز عرفه' });
    if (hDay === 10) list.push({ title: 'عید سعید قربان', badge: '🎉 عید سعید قربان' });
    if (hDay === 18) list.push({ title: 'عیدالله الاکبر؛ عید سعید غدیر خم', badge: '👑 عید سعید غدیر خم' });
  }
  return list;
}

function isQamarDarAghrab(date: Date): { inScorpio: boolean; noteFa: string } {
  const refMs = Date.UTC(2026, 10, 9, 18, 0, 0);
  const siderealPeriodMs = 27.321661 * 86400 * 1000;
  const scorpioDurationMs = 2.45 * 86400 * 1000;
  const diff = ((date.getTime() - refMs) % siderealPeriodMs + siderealPeriodMs) % siderealPeriodMs;
  if (diff <= scorpioDurationMs) {
    return {
      inScorpio: true,
      noteFa: '🦂 قمر در عقرب است — طبق توصیه روایات، برای امور مهم صدقه بدهید و آیت‌الکرسی بخوانید.',
    };
  }
  return { inScorpio: false, noteFa: '' };
}

function getJalaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  const [gy1, gm1, gd1] = jalaliToGregorian(jy, 12, 30);
  const back = getJalaliParts(new Date(gy1, gm1 - 1, gd1));
  return back.jm === 12 && back.jd === 30 ? 30 : 29;
}

export function CalendarModal({ cityLat, cityLng, cityTimezone, cityName, onClose }: Props) {
  const { theme } = useTheme();
  const [mode, setMode] = useState<'calendar' | 'converter'>('calendar');
  const [weatherData, setWeatherData] = useState<LiveWeatherData | null>(null);
  const tempUnit = getTemperatureUnit();

  useEffect(() => {
    fetchLiveWeather(cityLat, cityLng).then(setWeatherData);
  }, [cityLat, cityLng]);
  const todayParts = getJalaliParts(new Date());

  const [viewJy, setViewJy] = useState<number>(todayParts.jy);
  const [viewJm, setViewJm] = useState<number>(todayParts.jm);
  const [selectedJd, setSelectedJd] = useState<number>(todayParts.jd);

  const [convType, setConvType] = useState<'jalali_to_greg' | 'greg_to_jalali'>('jalali_to_greg');
  const [jYear, setJYear] = useState(todayParts.jy);
  const [jMonth, setJMonth] = useState(todayParts.jm);
  const [jDay, setJDay] = useState(todayParts.jd);
  const [gDateStr, setGDateStr] = useState(() => new Date().toISOString().slice(0, 10));

  const [selGy, selGm, selGd] = jalaliToGregorian(viewJy, viewJm, selectedJd);
  const selectedDate = new Date(selGy, selGm - 1, selGd, 12, 0, 0);

  const pTimes = calculatePrayerTimes(selectedDate, cityLat, cityLng, cityTimezone, 'tehran');
  const gregorianStr = selectedDate.toLocaleDateString('en-CA');
  const weekdayIndex = selectedDate.getDay();
  const wird = DAILY_WIRD[weekdayIndex] ?? DAILY_WIRD[5];
  const qamarStatus = isQamarDarAghrab(selectedDate);
  const jalaliOccList = JALALI_OCCASIONS[viewJm + '-' + selectedJd] ?? [];
  const hijriOccList = getHijriOccasions(pTimes.hijriDate);
  const allDayOccasions = [...jalaliOccList, ...hijriOccList];

  const stepDay = (delta: number) => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + delta);
    const p = getJalaliParts(nextDate);
    setViewJy(p.jy);
    setViewJm(p.jm);
    setSelectedJd(p.jd);
  };

  const stepMonth = (delta: number) => {
    let nextJm = viewJm + delta;
    let nextJy = viewJy;
    if (nextJm > 12) {
      nextJm = 1;
      nextJy++;
    } else if (nextJm < 1) {
      nextJm = 12;
      nextJy--;
    }
    const maxD = getJalaliMonthLength(nextJy, nextJm);
    setViewJy(nextJy);
    setViewJm(nextJm);
    setSelectedJd((d) => Math.min(d, maxD));
  };

  const goToday = () => {
    const p = getJalaliParts(new Date());
    setViewJy(p.jy);
    setViewJm(p.jm);
    setSelectedJd(p.jd);
  };

  const daysInMonth = getJalaliMonthLength(viewJy, viewJm);
  const [firstGy, firstGm, firstGd] = jalaliToGregorian(viewJy, viewJm, 1);
  const firstDateObj = new Date(firstGy, firstGm - 1, firstGd, 12, 0, 0);
  const firstColOffset = (firstDateObj.getDay() + 1) % 7;

  let convertedDate = new Date();
  if (convType === 'jalali_to_greg') {
    const [gy, gm, gd] = jalaliToGregorian(jYear, jMonth, jDay);
    convertedDate = new Date(gy, gm - 1, gd);
  } else {
    const [gy, gm, gd] = gDateStr.split('-').map(Number);
    if (!isNaN(gy) && !isNaN(gm) && !isNaN(gd)) {
      convertedDate = new Date(gy, gm - 1, gd);
    }
  }
  const convPrayer = calculatePrayerTimes(convertedDate, cityLat, cityLng, cityTimezone, 'tehran');
  const convGregStr = convertedDate.getFullYear() + '/' + String(convertedDate.getMonth() + 1).padStart(2, '0') + '/' + String(convertedDate.getDate()).padStart(2, '0');

  const modalContent = (
    <div
      className="fixed inset-0 z-[999] overflow-y-auto flex items-stretch sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.84)', backdropFilter: 'blur(7px)' }}
      dir="rtl"
    >
      <div
        className="w-full sm:max-w-lg min-h-[100dvh] sm:min-h-0 sm:rounded-3xl p-4 sm:p-5 border-0 sm:border shadow-2xl overflow-y-auto"
        style={{ background: theme.surface, borderColor: theme.border }}
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-2">
            <Calendar size={20} color={theme.primary} />
            <h2 className="text-base font-black text-app">تقویم سه‌گانه، مناسبت‌ها و قمر در عقرب</h2>
          </div>
          <button type="button" onClick={onClose} className="text-muted p-1">
            <X size={20} />
          </button>
        </div>

        <div
          className="flex gap-2 p-1 rounded-2xl mb-4"
          style={{ background: 'color-mix(in srgb, ' + theme.primary + ' 10%, transparent)' }}
        >
          <button
            type="button"
            onClick={() => setMode('calendar')}
            className="flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
            style={{
              background: mode === 'calendar' ? theme.primary : 'transparent',
              color: mode === 'calendar' ? theme.bg : theme.textMuted,
            }}
          >
            <Calendar size={14} /> تقویم روزانه و ماهانه
          </button>
          <button
            type="button"
            onClick={() => setMode('converter')}
            className="flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
            style={{
              background: mode === 'converter' ? theme.primary : 'transparent',
              color: mode === 'converter' ? theme.bg : theme.textMuted,
            }}
          >
            <ArrowLeftRight size={14} /> تبدیل تاریخ
          </button>
        </div>

        {mode === 'calendar' ? (
          <>
            <div className="flex items-center justify-between gap-2 mb-3">
              <button
                type="button"
                onClick={() => stepDay(-1)}
                className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 border"
                style={{ borderColor: theme.border, color: theme.text }}
              >
                <ChevronRight size={15} />
                <span>روز قبل</span>
              </button>
              <button
                type="button"
                onClick={goToday}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold"
                style={{
                  background: viewJy === todayParts.jy && viewJm === todayParts.jm && selectedJd === todayParts.jd ? theme.primary : 'color-mix(in srgb, ' + theme.primary + ' 14%, transparent)',
                  color: viewJy === todayParts.jy && viewJm === todayParts.jm && selectedJd === todayParts.jd ? theme.bg : theme.primary,
                }}
              >
                امروز
              </button>
              <button
                type="button"
                onClick={() => stepDay(1)}
                className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 border"
                style={{ borderColor: theme.border, color: theme.text }}
              >
                <span>روز بعد</span>
                <ChevronLeft size={15} />
              </button>
            </div>

            <div
              className="rounded-2xl p-4 mb-3 text-center border"
              style={{
                background: 'radial-gradient(circle at top, color-mix(in srgb, ' + theme.primary + ' 18%, transparent), ' + theme.bg + ')',
                borderColor: 'color-mix(in srgb, ' + theme.primary + ' 35%, ' + theme.border + ')',
              }}
            >
              <p className="text-xs font-bold text-primary mb-1">{getJalaliWeekday(selectedDate)}</p>
              <p className="text-2xl font-black text-app mb-2">{toJalaliShort(selectedDate)} خورشیدی</p>
              <div className="flex items-center justify-center gap-3 text-xs text-muted pt-2 border-t" style={{ borderColor: theme.border }}>
                <span>🌙 {toFaDigits(pTimes.hijriDate)} قمری</span>
                <span>·</span>
                <span dir="ltr">🌍 {gregorianStr}</span>
              </div>
              {(() => {
                const matchedForecast = weatherData?.daily.find((d) => d.dateIso === gregorianStr);
                if (!matchedForecast) return null;
                return (
                  <div
                    className="mt-2.5 pt-2 border-t flex items-center justify-between px-2 text-xs"
                    style={{ borderColor: theme.border }}
                  >
                    <div className="flex items-center gap-2">
                      <WeatherCuteArtwork condition={matchedForecast.condition} size={30} />
                      <span className="font-bold text-app">هوای این روز ({cityName}): {matchedForecast.labelFa}</span>
                    </div>
                    <span className="font-black text-primary">
                      کمینه {toFaDigits(formatTempValue(matchedForecast.tempMinC, tempUnit))}° | بیشینه {toFaDigits(formatTempValue(matchedForecast.tempMaxC, tempUnit))}°
                    </span>
                  </div>
                );
              })()}
            </div>

            {allDayOccasions.length > 0 && (
              <div className="space-y-2 mb-3">
                {allDayOccasions.map((occ, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl border text-xs space-y-1"
                    style={{
                      borderColor: theme.primary,
                      background: 'color-mix(in srgb, ' + theme.primary + ' 14%, transparent)',
                    }}
                  >
                    <span className="text-[10px] font-black text-primary block">{occ.badge}</span>
                    <p className="text-xs font-bold text-app leading-relaxed">{occ.title}</p>
                  </div>
                ))}
              </div>
            )}

            {qamarStatus.inScorpio && (
              <div
                className="p-3 rounded-2xl mb-3 border text-xs font-bold flex items-start gap-2"
                style={{
                  borderColor: '#f59e0b',
                  background: 'rgba(245, 158, 11, 0.14)',
                  color: '#fde68a',
                }}
              >
                <AlertTriangle size={16} color="#f59e0b" className="shrink-0 mt-0.5" />
                <span>{qamarStatus.noteFa}</span>
              </div>
            )}

            {/* نوار پیش‌بینی آب‌وهوای ۷ روز آینده در تقویم */}
            {weatherData && weatherData.daily.length > 0 && (
              <div className="card-flat p-3.5 mb-3.5 border" style={{ borderColor: theme.border }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-primary">🌤️ پیش‌بینی آب‌وهوای ۷ روز آینده ({cityName})</span>
                  <span className="text-[10px] font-bold text-muted">واحد: {tempUnit === "F" ? "فارنهایت °F" : "سلسیوس °C"}</span>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {weatherData.daily.slice(0, 7).map((df, idx) => {
                    const dObj = new Date(df.dateIso + "T12:00:00");
                    const jParts = getJalaliParts(dObj);
                    const isSelectedDay = df.dateIso === gregorianStr;
                    return (
                      <button
                        key={df.dateIso}
                        type="button"
                        onClick={() => {
                          setViewJy(jParts.jy);
                          setViewJm(jParts.jm);
                          setSelectedJd(jParts.jd);
                        }}
                        className="p-1.5 rounded-2xl border flex flex-col items-center justify-between transition-all"
                        style={{
                          borderColor: isSelectedDay ? theme.primary : 'transparent',
                          background: isSelectedDay ? 'color-mix(in srgb, ' + theme.primary + ' 18%, transparent)' : theme.bg,
                        }}
                      >
                        <span className="text-[10px] font-bold text-muted">{idx === 0 ? "امروز" : getJalaliWeekday(dObj).slice(0, 3)}</span>
                        <span className="text-[10px] font-black text-app">{toFaDigits(jParts.jd)}</span>
                        <div className="my-0.5">
                          <WeatherCuteArtwork condition={df.condition} size={26} />
                        </div>
                        <span className="text-[10px] font-black text-primary">{toFaDigits(formatTempValue(df.tempMaxC, tempUnit))}°</span>
                        <span className="text-[9px] text-muted">{toFaDigits(formatTempValue(df.tempMinC, tempUnit))}°</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="card-flat p-4 mb-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary flex items-center gap-1">
                  <Sparkles size={13} /> ذکر و نسبت روز {wird.dayFa}
                </span>
                <span className="text-[11px] font-bold text-accent">{toFaDigits(wird.count)} مرتبه</span>
              </div>
              <p className="text-xs text-muted">{wird.imam}</p>
              <p className="text-lg font-bold text-app text-center py-1.5">{wird.dhikr}</p>
              <p className="text-xs text-muted leading-relaxed">✨ عمل توصیه‌شده: {wird.deed}</p>
            </div>

            <div className="mb-4">
              <p className="text-xs font-bold text-muted mb-2">اوقات شرعی این روز به افق {cityName}:</p>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="card-flat p-2">
                  <span className="text-muted block text-[10px]">اذان صبح</span>
                  <strong className="text-app" dir="ltr">{pTimes.fajr}</strong>
                </div>
                <div className="card-flat p-2">
                  <span className="text-muted block text-[10px]">اذان ظهر</span>
                  <strong className="text-app" dir="ltr">{pTimes.dhuhr}</strong>
                </div>
                <div className="card-flat p-2">
                  <span className="text-muted block text-[10px]">اذان مغرب</span>
                  <strong className="text-app" dir="ltr">{pTimes.maghrib}</strong>
                </div>
              </div>
            </div>

            {/* تقویم ماهانه کامل با پیمایش ماه به ماه، مناسبت‌ها و روزهای قمر در عقرب */}
            <div className="card-flat p-3.5 mb-4 border" style={{ borderColor: theme.border }}>
              <div className="flex items-center justify-between mb-3 pb-2 border-b" style={{ borderColor: theme.border }}>
                <button
                  type="button"
                  onClick={() => stepMonth(-1)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1"
                  style={{ borderColor: theme.border, color: theme.text }}
                >
                  <ChevronRight size={14} /> ماه قبل
                </button>
                <div className="text-center">
                  <p className="text-sm font-black text-primary">{jalaliMonths[viewJm - 1]} {toFaDigits(viewJy)}</p>
                  <p className="text-[10px] text-muted">برای دیدن مناسبت و قمر در عقرب، روی روزها بزنید</p>
                </div>
                <button
                  type="button"
                  onClick={() => stepMonth(1)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1"
                  style={{ borderColor: theme.border, color: theme.text }}
                >
                  ماه بعد <ChevronLeft size={14} />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted mb-1.5">
                <span>ش</span>
                <span>ی</span>
                <span>د</span>
                <span>س</span>
                <span>چ</span>
                <span>پ</span>
                <span className="text-red-400">ج</span>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstColOffset }).map((_, emptyIdx) => (
                  <div key={'empty_' + emptyIdx} className="h-10" />
                ))}
                {Array.from({ length: daysInMonth }, (_, idx) => idx + 1).map((dNum) => {
                  const [dGy, dGm, dGd] = jalaliToGregorian(viewJy, viewJm, dNum);
                  const cellDate = new Date(dGy, dGm - 1, dGd, 12, 0, 0);
                  const isSel = dNum === selectedJd;
                  const isTodayCell = viewJy === todayParts.jy && viewJm === todayParts.jm && dNum === todayParts.jd;
                  const isFriday = cellDate.getDay() === 5;
                  const cellOccasion = JALALI_OCCASIONS[viewJm + '-' + dNum];
                  const cellScorpio = isQamarDarAghrab(cellDate).inScorpio;

                  return (
                    <button
                      key={dNum}
                      type="button"
                      onClick={() => setSelectedJd(dNum)}
                      className="h-10 rounded-xl flex flex-col items-center justify-center relative border transition-all"
                      style={{
                        borderColor: isSel ? theme.primary : isTodayCell ? theme.accent : 'transparent',
                        background: isSel
                          ? theme.primary
                          : cellScorpio
                          ? 'rgba(245, 158, 11, 0.12)'
                          : 'color-mix(in srgb, ' + theme.bg + ' 65%, transparent)',
                        color: isSel ? theme.bg : isFriday ? '#f87171' : theme.text,
                      }}
                    >
                      <span className="text-xs font-black leading-none">{toFaDigits(dNum)}</span>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {cellOccasion && (
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: isSel ? theme.bg : theme.primary }}
                          />
                        )}
                        {cellScorpio && (
                          <span className="text-[8px] leading-none" title="قمر در عقرب">🦂</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* باکس زنده نمایش مناسبت و وضعیت روز انتخاب‌شده درست در زیر جدول تقویم ماهانه */}
              <div
                className="mt-3 p-3 rounded-2xl border space-y-1.5"
                style={{ borderColor: theme.primary, background: 'color-mix(in srgb, ' + theme.primary + ' 10%, ' + theme.bg + ')' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-primary">
                    📌 {getJalaliWeekday(selectedDate)} {toFaDigits(selectedJd)} {jalaliMonths[viewJm - 1]} ({toFaDigits(pTimes.hijriDate)})
                  </span>
                  {qamarStatus.inScorpio && <span className="text-[10px] font-bold text-amber-400">🦂 قمر در عقرب</span>}
                </div>
                {allDayOccasions.length > 0 ? (
                  allDayOccasions.map((occ, i) => (
                    <p key={i} className="text-xs font-bold text-app leading-relaxed">
                      • <span className="text-accent">{occ.badge}:</span> {occ.title}
                    </p>
                  ))
                ) : (
                  <p className="text-[11px] text-muted leading-relaxed">
                    ✨ ذکر روز {wird.dayFa}: <strong className="text-app">{wird.dhikr}</strong> — {wird.deed}
                  </p>
                )}
                {qamarStatus.inScorpio && (
                  <p className="text-[11px] text-amber-300 font-bold leading-relaxed">{qamarStatus.noteFa}</p>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] text-muted mt-3 pt-2 border-t" style={{ borderColor: theme.border }}>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: theme.primary }} /> مناسبت ملی / مذهبی
                </span>
                <span>🦂 روزهای قمر در عقرب</span>
                <span className="text-red-400 font-bold">ج = جمعه</span>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-4 mb-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConvType('jalali_to_greg')}
                className="flex-1 py-2 rounded-xl text-xs font-bold border"
                style={{
                  borderColor: convType === 'jalali_to_greg' ? theme.primary : theme.border,
                  color: convType === 'jalali_to_greg' ? theme.primary : theme.textMuted,
                }}
              >
                شمسی به قمری و میلادی
              </button>
              <button
                type="button"
                onClick={() => setConvType('greg_to_jalali')}
                className="flex-1 py-2 rounded-xl text-xs font-bold border"
                style={{
                  borderColor: convType === 'greg_to_jalali' ? theme.primary : theme.border,
                  color: convType === 'greg_to_jalali' ? theme.primary : theme.textMuted,
                }}
              >
                میلادی به شمسی و قمری
              </button>
            </div>

            {convType === 'jalali_to_greg' ? (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] text-muted block mb-1">روز</label>
                  <select
                    value={jDay}
                    onChange={(e) => setJDay(Number(e.target.value))}
                    className="w-full px-2 py-2.5 rounded-xl text-xs text-app border outline-none"
                    style={{ borderColor: theme.border, background: theme.bg }}
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>{toFaDigits(d)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-muted block mb-1">ماه شمسی</label>
                  <select
                    value={jMonth}
                    onChange={(e) => setJMonth(Number(e.target.value))}
                    className="w-full px-2 py-2.5 rounded-xl text-xs text-app border outline-none"
                    style={{ borderColor: theme.border, background: theme.bg }}
                  >
                    {jalaliMonths.map((m, idx) => (
                      <option key={m} value={idx + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-muted block mb-1">سال شمسی</label>
                  <input
                    type="number"
                    min="1300"
                    max="1500"
                    value={jYear}
                    onChange={(e) => setJYear(Number(e.target.value) || 1405)}
                    className="w-full px-2 py-2.5 rounded-xl text-xs text-app border outline-none text-center"
                    style={{ borderColor: theme.border, background: theme.bg }}
                    dir="ltr"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="text-xs text-muted block mb-1">انتخاب تاریخ میلادی</label>
                <input
                  type="date"
                  value={gDateStr}
                  onChange={(e) => setGDateStr(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-xs text-app border outline-none"
                  style={{ borderColor: theme.border, background: theme.bg }}
                  dir="ltr"
                />
              </div>
            )}

            <div
              className="rounded-2xl p-4 space-y-2 border text-center"
              style={{
                background: 'color-mix(in srgb, ' + theme.primary + ' 10%, transparent)',
                borderColor: theme.primary,
              }}
            >
              <p className="text-xs text-muted">نتیجهٔ تبدیل تاریخ ({getJalaliWeekday(convertedDate)}):</p>
              <p className="text-lg font-black text-primary">☀️ {toJalaliShort(convertedDate)} شمسی</p>
              <p className="text-sm font-bold text-app">🌙 {toFaDigits(convPrayer.hijriDate)} قمری</p>
              <p className="text-xs font-mono text-muted" dir="ltr">🌍 {convGregStr} (Gregorian)</p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-2xl text-xs font-bold"
          style={{ background: theme.primary, color: theme.bg }}
        >
          بستن
        </button>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
