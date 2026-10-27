import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, X, ChevronRight, ChevronLeft, Sparkles, ArrowLeftRight } from 'lucide-react';
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
  5: { dayFa: 'جمعه', imam: 'متعلق به حضرت ولی‌عصر امام زمان (عج)', dhikr: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَآلِ مُحَمَّدٍ وَعَجِّلْ فَرَجَهُمْ', count: 100, deed: 'دعای ندبه، زیارت آل‌یاسین و دعای سمات در عصر جمعه' },
};

export function CalendarModal({ cityLat, cityLng, cityTimezone, cityName, onClose }: Props) {
  const { theme } = useTheme();
  const [mode, setMode] = useState<'calendar' | 'converter'>('calendar');
  const [dayOffset, setDayOffset] = useState(0);

  const todayParts = getJalaliParts(new Date());
  const [convType, setConvType] = useState<'jalali_to_greg' | 'greg_to_jalali'>('jalali_to_greg');
  const [jYear, setJYear] = useState(todayParts.jy);
  const [jMonth, setJMonth] = useState(todayParts.jm);
  const [jDay, setJDay] = useState(todayParts.jd);
  const [gDateStr, setGDateStr] = useState(() => new Date().toISOString().slice(0, 10));

  const selectedDate = new Date();
  selectedDate.setDate(selectedDate.getDate() + dayOffset);

  const pTimes = calculatePrayerTimes(selectedDate, cityLat, cityLng, cityTimezone, 'jafari');
  const gregorianStr = selectedDate.toLocaleDateString('en-CA');
  const weekdayIndex = selectedDate.getDay();
  const wird = DAILY_WIRD[weekdayIndex] ?? DAILY_WIRD[5];

  // محاسبه نتیجه مبدل تاریخ
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
  const convPrayer = calculatePrayerTimes(convertedDate, cityLat, cityLng, cityTimezone, 'jafari');
  const convGregStr = `${convertedDate.getFullYear()}/${String(convertedDate.getMonth() + 1).padStart(2, '0')}/${String(convertedDate.getDate()).padStart(2, '0')}`;

  const modalContent = (
    <div
      className="fixed inset-0 z-[999] overflow-y-auto flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(6px)' }}
      dir="rtl"
    >
      <div
        className="w-full max-w-md rounded-3xl p-5 border shadow-2xl my-auto max-h-[90vh] overflow-y-auto"
        style={{ background: theme.surface, borderColor: theme.border }}
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-2">
            <Calendar size={20} color={theme.primary} />
            <h2 className="text-base font-black text-app">تقویم سه‌گانه و مبدل تاریخ</h2>
          </div>
          <button type="button" onClick={onClose} className="text-muted p-1">
            <X size={20} />
          </button>
        </div>

        {/* تب‌بندی بین تقویم روزانه و مبدل تاریخ */}
        <div
          className="flex gap-2 p-1 rounded-2xl mb-4"
          style={{ background: `color-mix(in srgb, ${theme.primary} 10%, transparent)` }}
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
            <Calendar size={14} /> تقویم و اعمال روز
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
            <div className="flex items-center justify-between gap-2 mb-4">
              <button
                type="button"
                onClick={() => setDayOffset((d) => d - 1)}
                className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 border"
                style={{ borderColor: theme.border, color: theme.text }}
              >
                <ChevronRight size={15} />
                <span>روز قبل</span>
              </button>
              <button
                type="button"
                onClick={() => setDayOffset(0)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{
                  background: dayOffset === 0 ? theme.primary : `color-mix(in srgb, ${theme.primary} 14%, transparent)`,
                  color: dayOffset === 0 ? theme.bg : theme.primary,
                }}
              >
                امروز
              </button>
              <button
                type="button"
                onClick={() => setDayOffset((d) => d + 1)}
                className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 border"
                style={{ borderColor: theme.border, color: theme.text }}
              >
                <span>روز بعد</span>
                <ChevronLeft size={15} />
              </button>
            </div>

            <div
              className="rounded-2xl p-4 mb-4 text-center border"
              style={{
                background: `radial-gradient(circle at top, color-mix(in srgb, ${theme.primary} 18\%, transparent),${theme.bg})`,
                borderColor: `color-mix(in srgb, ${theme.primary} 35\%,${theme.border})`,
              }}
            >
              <p className="text-xs font-bold text-primary mb-1">{getJalaliWeekday(selectedDate)}</p>
              <p className="text-2xl font-black text-app mb-2">{toJalaliShort(selectedDate)} خورشیدی</p>
              <div className="flex items-center justify-center gap-3 text-xs text-muted pt-2 border-t" style={{ borderColor: theme.border }}>
                <span>🌙 {pTimes.hijriDate} قمری</span>
                <span>·</span>
                <span dir="ltr">🌍 {gregorianStr}</span>
              </div>
            </div>

            <div className="card-flat p-4 mb-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary flex items-center gap-1">
                  <Sparkles size={13} /> ذکر و نسبت روز {wird.dayFa}
                </span>
                <span className="text-[11px] font-bold text-accent">{toFaDigits(wird.count)} مرتبه</span>
              </div>
              <p className="text-xs text-muted">{wird.imam}</p>
              <p className="text-lg font-bold text-app text-center py-2">{wird.dhikr}</p>
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
                background: `color-mix(in srgb, ${theme.primary} 10%, transparent)`,
                borderColor: theme.primary,
              }}
            >
              <p className="text-xs text-muted">نتیجهٔ تبدیل تاریخ ({getJalaliWeekday(convertedDate)}):</p>
              <p className="text-lg font-black text-primary">☀️ {toJalaliShort(convertedDate)} شمسی</p>
              <p className="text-sm font-bold text-app">🌙 {convPrayer.hijriDate} قمری</p>
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
