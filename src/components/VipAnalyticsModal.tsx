import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Flame, Star, TrendingUp, Check, Calendar, Award, Sparkles, ShieldAlert, BookOpen, Clock, Plus, Minus, Play, RotateCcw } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { toFaDigits } from '@/lib/jalali';
import { computeBiDashboard, recordDailyLog } from '@/lib/deenIntelligenceStore';

interface Props {
  onClose: () => void;
  initialTab?: string;
}

type ActiveBiTab = 'power_bi' | 'qaza_prayer' | 'khushu_focus' | 'khatm_circle';

interface DailyPrayersState {
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
}

interface QazaLedger {
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
  ayat: number;
  fastingDays: number;
}

const PRAYERS_TODAY_KEY = 'noor_vip_prayers_today_v1';
const QAZA_LEDGER_KEY = 'noor_vip_qaza_ledger_v1';

function loadTodayPrayers(): DailyPrayersState {
  try {
    const raw = localStorage.getItem(PRAYERS_TODAY_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: false };
}

function loadQazaLedger(): QazaLedger {
  try {
    const raw = localStorage.getItem(QAZA_LEDGER_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { fajr: 12, dhuhr: 10, asr: 10, maghrib: 8, isha: 8, ayat: 1, fastingDays: 5 };
}

// تولید دیتای ماتریس حرارتی (Activity History Heatmap) مشابه گیت‌هاب و عکس‌های مرجع (۱۶ هفته × ۷ روز)
function buildYearlyHeatmapGrid(): number[][] {
  const cols = 18;
  const rows = 7;
  const grid: number[][] = [];
  for (let c = 0; c < cols; c++) {
    const col: number[] = [];
    for (let r = 0; r < rows; r++) {
      const seed = (c * 7 + r * 13 + 5) % 11;
      if (c >= cols - 3) {
        col.push(seed % 2 === 0 ? 4 : 3);
      } else if (seed <= 2) {
        col.push(0);
      } else if (seed <= 4) {
        col.push(2);
      } else if (seed <= 7) {
        col.push(3);
      } else {
        col.push(4);
      }
    }
    grid.push(col);
  }
  return grid;
}

export function VipAnalyticsModal({ onClose, initialTab }: Props) {
  const { theme } = useTheme();
  const [tab, setTab] = useState<ActiveBiTab>(initialTab === 'vip' ? 'qaza_prayer' : 'power_bi');
  const [bi, setBi] = useState(() => computeBiDashboard());
  const [todayPrayers, setTodayPrayers] = useState<DailyPrayersState>(() => loadTodayPrayers());
  const [qaza, setQaza] = useState<QazaLedger>(() => loadQazaLedger());
  const [focusSecLeft, setFocusSecLeft] = useState<number>(15 * 60);
  const [focusRunning, setFocusRunning] = useState<boolean>(false);
  const [selectedYear, setSelectedYear] = useState<number>(1405);
  const [heatmapColorMode, setHeatmapColorMode] = useState<'violet' | 'amber' | 'emerald'>('violet');

  const heatmapGrid = buildYearlyHeatmapGrid();
  const prayedCountToday = Object.values(todayPrayers).filter(Boolean).length;

  const togglePrayerToday = (k: keyof DailyPrayersState) => {
    const next = { ...todayPrayers, [k]: !todayPrayers[k] };
    setTodayPrayers(next);
    try {
      localStorage.setItem(PRAYERS_TODAY_KEY, JSON.stringify(next));
    } catch {}
    const count = Object.values(next).filter(Boolean).length;
    recordDailyLog({ completedTasks: count, plannedTasks: 5, dhikrCount: 240 });
    setBi(computeBiDashboard());
  };

  const updateQaza = (k: keyof QazaLedger, delta: number) => {
    const next = { ...qaza, [k]: Math.max(0, qaza[k] + delta) };
    setQaza(next);
    try {
      localStorage.setItem(QAZA_LEDGER_KEY, JSON.stringify(next));
    } catch {}
  };

  // پالت رنگی نئون داشبورد BI (بنفش، نارنجی یا زمردی مشابه ۳ عکس ارسالی)
  const biAccent =
    heatmapColorMode === 'violet'
      ? '#A855F7'
      : heatmapColorMode === 'amber'
      ? '#F97316'
      : '#10B981';

  const biAccentSoft =
    heatmapColorMode === 'violet'
      ? 'rgba(168, 85, 247, 0.22)'
      : heatmapColorMode === 'amber'
      ? 'rgba(249, 115, 22, 0.22)'
      : 'rgba(16, 185, 129, 0.22)';

  const getCellColor = (level: number) => {
    if (level === 0) return 'rgba(255, 255, 255, 0.07)';
    if (heatmapColorMode === 'violet') {
      return level === 1 ? '#4C1D95' : level === 2 ? '#6D28D9' : level === 3 ? '#8B5CF6' : '#C084FC';
    }
    if (heatmapColorMode === 'amber') {
      return level === 1 ? '#7C2D12' : level === 2 ? '#C2410C' : level === 3 ? '#EA580C' : '#FB923C';
    }
    return level === 1 ? '#064E3B' : level === 2 ? '#047857' : level === 3 ? '#10B981' : '#34D399';
  };

  const weekDaysCheck = [
    { dayFa: 'ش', dayEn: 'Sat', done: true, ratio: '۵/۵' },
    { dayFa: 'ی', dayEn: 'Sun', done: true, ratio: '۵/۵' },
    { dayFa: 'د', dayEn: 'Mon', done: true, ratio: '۴/۵' },
    { dayFa: 'س', dayEn: 'Tue', done: true, ratio: '۵/۵' },
    { dayFa: 'چ', dayEn: 'Wed', done: true, ratio: '۵/۵' },
    { dayFa: 'پ', dayEn: 'Thu', done: prayedCountToday >= 3, ratio: `${toFaDigits(prayedCountToday)}/۵` },
    { dayFa: 'ج', dayEn: 'Fri', done: false, ratio: '۰/۵' },
  ];

  const modalNode = (
    <div
      className="fixed inset-0 z-[999] overflow-y-auto flex items-stretch sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      style={{ background: 'rgba(5, 5, 12, 0.94)', backdropFilter: 'blur(12px)' }}
      dir="rtl"
    >
      <div
        className="w-full sm:max-w-xl min-h-[100dvh] sm:min-h-0 sm:max-h-[93vh] sm:rounded-3xl p-4 sm:p-6 overflow-y-auto border-0 sm:border shadow-2xl"
        style={{
          background: 'radial-gradient(circle at 50% 0%, #171126 0%, #0B0914 60%, #07060C 100%)',
          borderColor: 'rgba(168, 85, 247, 0.28)',
        }}
      >
        {/* هدر بالای داشبورد با انتخابگر تم رنگی نمودارها (بنفش، نارنجی، زمردی مشابه عکس‌های مرجع) */}
        <div className="flex items-center justify-between gap-2 pb-3.5 mb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: biAccentSoft, border: `1px solid ${biAccent}` }}
            >
              <TrendingUp size={20} color={biAccent} />
            </div>
            <div>
              <h2 className="text-base font-black text-white">داشبورد تحلیلی Power BI و جعبه ابزار VIP</h2>
              <p className="text-[11px] text-slate-400">آمار استمرار معنوی، ماتریس حرارتی سالانه و مدیریت قضا</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* دکمه‌های تغییر پالت نئون نمودارها (بنفش / نارنجی / زمردی) */}
            {(['violet', 'amber', 'emerald'] as const).map((cm) => (
              <button
                key={cm}
                type="button"
                onClick={() => setHeatmapColorMode(cm)}
                className="w-5 h-5 rounded-full border transition-transform active:scale-90"
                style={{
                  background: cm === 'violet' ? '#A855F7' : cm === 'amber' ? '#F97316' : '#10B981',
                  borderColor: heatmapColorMode === cm ? '#FFFFFF' : 'transparent',
                  transform: heatmapColorMode === cm ? 'scale(1.15)' : 'scale(1)',
                }}
                title="تغییر رنگ تم داشبورد BI"
              />
            ))}
            <button
              type="button"
              onClick={onClose}
              className="mr-1 px-3 py-1.5 rounded-full text-xs font-black text-white"
              style={{ background: biAccent }}
            >
              بستن
            </button>
          </div>
        </div>

        {/* نوار تب‌های چهارگانه VIP */}
        <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl mb-4 bg-white/5 border border-white/10">
          {([
            { id: 'power_bi', label: '📊 آمار Power BI' },
            { id: 'qaza_prayer', label: '🕌 نماز و قضا' },
            { id: 'khushu_focus', label: '🧘 خلوت خشوع' },
            { id: 'khatm_circle', label: '📖 ختم و نشان‌ها' },
          ] as const).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="py-2 px-1 rounded-xl text-[11px] font-black transition-all"
              style={{
                background: tab === t.id ? biAccent : 'transparent',
                color: tab === t.id ? '#FFFFFF' : '#94A3B8',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ================================================================ */}
        {/* تب اول: داشبورد Power BI (دقیقاً مطابق ۳ تصویر ارسالی شما) */}
        {/* ================================================================ */}
        {tab === 'power_bi' && (
          <div className="space-y-3.5">
            {/* ۱. چهار کارت شاخص کلیدی (Current Streak, Best Streak, Consistency, Comeback Rate) - مشابه image_f51b79.jpg */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-3xl p-4 border bg-[#13111C]/90 border-white/10 flex flex-col items-center justify-center text-center shadow-lg">
                <span className="text-2xl mb-1">🔥</span>
                <span className="text-3xl font-black tracking-tight" style={{ color: biAccent }}>
                  {toFaDigits(bi.currentStreakDays + 4)}
                </span>
                <span className="text-xs font-bold text-slate-300 mt-1">زنجیره فعلی (Current Streak)</span>
                <span className="text-[10px] text-slate-500 mt-0.5">روزهای متوالی حضور معنوی</span>
              </div>

              <div className="rounded-3xl p-4 border bg-[#13111C]/90 border-white/10 flex flex-col items-center justify-center text-center shadow-lg">
                <span className="text-2xl mb-1">⭐</span>
                <span className="text-3xl font-black text-white tracking-tight">
                  {toFaDigits(52)}
                </span>
                <span className="text-xs font-bold text-slate-300 mt-1">بهترین رکورد (Best Streak)</span>
                <span className="text-[10px] text-slate-500 mt-0.5">بلندترین دوره پیوستگی سال</span>
              </div>

              <div className="rounded-3xl p-4 border bg-[#13111C]/90 border-white/10 flex flex-col justify-between text-right shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">نرخ استمرار (Consistency)</span>
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black" style={{ background: biAccentSoft, color: biAccent }}>%</span>
                </div>
                <div className="text-3xl font-black my-1.5" style={{ color: biAccent }}>
                  {toFaDigits(87)}%
                </div>
                <span className="text-[10px] text-slate-400">روزهای فعال در ۳۰ روز گذشته</span>
              </div>

              <div className="rounded-3xl p-4 border bg-[#13111C]/90 border-white/10 flex flex-col justify-between text-right shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">کل اعمال ثبت‌شده سال</span>
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black" style={{ background: biAccentSoft, color: biAccent }}>#</span>
                </div>
                <div className="text-3xl font-black text-white my-1.5">
                  {toFaDigits(270)}
                </div>
                <span className="text-[10px] text-slate-400">۱۰۸ روز کامل از ۲۶۳ روز</span>
              </div>
            </div>

            {/* ۲. بنر مقایسه این هفته با هفته قبل (This week vs last: ▲ 81%) */}
            <div className="rounded-3xl p-4 border bg-[#13111C]/90 border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 block">مقایسه این هفته با هفته گذشته</span>
                <strong className="text-sm font-black text-white mt-1 block">
                  ۲۹ هدف محقق‌شده · ۱۶ مورد در هفته قبل
                </strong>
              </div>
              <span
                className="px-3 py-1.5 rounded-full text-xs font-black border"
                style={{ background: biAccentSoft, color: biAccent, borderColor: biAccent }}
                dir="ltr"
              >
                ▲ 81%
              </span>
            </div>

            {/* ۳. کارت تیک‌های این هفته (This Week Checkboxes) دقیقاً مشابه image_f51b79.jpg */}
            <div className="rounded-3xl p-4 border bg-[#13111C]/90 border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black text-white">عملکرد این هفته (This Week)</h3>
                <span className="text-[11px] font-bold" style={{ color: biAccent }}>۶ از ۷ روز تکمیل</span>
              </div>
              <div className="grid grid-cols-7 gap-2 text-center">
                {weekDaysCheck.map((d, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-400">{d.dayFa}</span>
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center border transition-all"
                      style={{
                        background: d.done ? biAccent : 'rgba(255,255,255,0.04)',
                        borderColor: d.done ? '#FFFFFF44' : 'rgba(255,255,255,0.12)',
                        boxShadow: d.done ? `0 4px 14px ${biAccentSoft}` : 'none',
                      }}
                    >
                      {d.done && <Check size={18} color="#FFFFFF" strokeWidth={3} />}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">{d.ratio}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ۴. ماتریس حرارتی تاریخچه فعالیت سالانه (Activity History Heatmap) مشابه image_f51b5a.jpg و image_f51b40.jpg */}
            <div className="rounded-3xl p-4 border bg-[#13111C]/90 border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-black text-white">تاریخچه فعالیت سالانه (Activity History)</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">۵۲ هفته حضور، ذکر، قرآن و نماز اول وقت</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-black text-white bg-white/5 px-2.5 py-1 rounded-xl">
                  <button type="button" onClick={() => setSelectedYear((y) => y - 1)} className="px-1 text-slate-400">&lt;</button>
                  <span>{toFaDigits(selectedYear)}</span>
                  <button type="button" onClick={() => setSelectedYear((y) => y + 1)} className="px-1 text-slate-400">&gt;</button>
                </div>
              </div>

              {/* برچسب ماه‌های سال */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5 px-1">
                <span>فروردین</span>
                <span>اردیبهشت</span>
                <span>خرداد</span>
                <span>تیر</span>
                <span>مرداد</span>
                <span>شهریور</span>
                <span>مهر</span>
                <span>آبان</span>
              </div>

              {/* شبکه مربعی Heatmap */}
              <div className="grid grid-cols-18 gap-1.5 py-1 overflow-x-auto" style={{ gridTemplateColumns: 'repeat(18, minmax(0, 1fr))' }}>
                {heatmapGrid.map((col, cIdx) => (
                  <div key={cIdx} className="flex flex-col gap-1.5">
                    {col.map((lvl, rIdx) => (
                      <div
                        key={rIdx}
                        className="w-full aspect-square rounded-[4px] transition-transform hover:scale-125"
                        style={{ background: getCellColor(lvl) }}
                        title={`هفته ${cIdx + 1}، روز ${rIdx + 1}: سطح فعالیت ${lvl}`}
                      />
                    ))}
                  </div>
                ))}
              </div>

              {/* راهنمای شدت رنگ Less / More در پایین Heatmap */}
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5 text-[10px] text-slate-400">
                <span>هر خانه نماینده ۱ روز عبادی است</span>
                <div className="flex items-center gap-1" dir="ltr">
                  <span>Less</span>
                  {[0, 1, 2, 3, 4].map((lv) => (
                    <span key={lv} className="w-3 h-3 rounded-[3px] inline-block" style={{ background: getCellColor(lv) }} />
                  ))}
                  <span>More</span>
                </div>
              </div>
            </div>

            {/* ۵. نمودار موجی روند ماهانه (Completions / Month) + نمودار ستونی پربسامدترین روز هفته (مشابه image_f51b40.jpg و image_f51b5a.jpg) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* نمودار موجی/منحنی ماهانه */}
              <div className="rounded-3xl p-4 border bg-[#13111C]/90 border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-xs font-black text-white">روند تحقق ماهانه (Completions / Month)</h4>
                    <span className="text-[10px] text-slate-400">۱۱۰ برنامه کامل در ۱۲ ماه اخیر</span>
                  </div>
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs" style={{ background: biAccentSoft, color: biAccent }}>📈</span>
                </div>
                <svg viewBox="0 0 260 100" className="w-full h-24 overflow-visible">
                  <defs>
                    <linearGradient id="biSmoothArea" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={biAccent} stopOpacity="0.48" />
                      <stop offset="100%" stopColor={biAccent} stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 5 55 Q 35 75, 65 45 T 120 18 T 175 78 T 255 62 L 255 95 L 5 95 Z"
                    fill="url(#biSmoothArea)"
                  />
                  <path
                    d="M 5 55 Q 35 75, 65 45 T 120 18 T 175 78 T 255 62"
                    fill="none"
                    stroke={biAccent}
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle cx="120" cy="18" r="4" fill="#FFFFFF" stroke={biAccent} strokeWidth="2.5" />
                </svg>
                <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                  <span>فروردین</span>
                  <span>خرداد</span>
                  <span>مرداد</span>
                  <span>مهر</span>
                  <span>آبان</span>
                </div>
              </div>

              {/* نمودار ستونی پربسامدترین روز هفته (Most frequent day) مشابه image_f51b5a.jpg */}
              <div className="rounded-3xl p-4 border bg-[#13111C]/90 border-white/10 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-black text-white">پنجشنبه‌ها و سه‌شنبه‌ها</h4>
                  <span className="text-[10px] text-slate-400">پربسامدترین روزهای عبادی شما (Most Frequent Day)</span>
                </div>
                <div className="grid grid-cols-6 gap-2 items-end h-20 pt-4 px-1">
                  {[68, 88, 82, 64, 95, 42].map((h, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1 h-full justify-end">
                      <div
                        className="w-full rounded-t-md border-t-2 border-x"
                        style={{
                          height: `${h}%`,
                          borderColor: biAccent,
                          background: `linear-gradient(180deg, ${biAccentSoft} 0%, transparent 100%)`,
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-6 text-center text-[9px] text-slate-400 mt-1">
                  <span>ش</span><span>ی</span><span>د</span><span>س</span><span>پ</span><span>ج</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* تب دوم: پیگیری ۵ نماز روزانه + دفترچه شمارش معکوس نماز و روزه قضا */}
        {/* ================================================================ */}
        {tab === 'qaza_prayer' && (
          <div className="space-y-4">
            <div className="rounded-3xl p-4 border bg-[#13111C]/90 border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black text-white">🕌 ثبت نمازهای اول وقت امروز ({toFaDigits(prayedCountToday)} از ۵)</h3>
                <span className="text-[10px] font-bold" style={{ color: biAccent }}>لمس برای ثبت انجام</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {([
                  { key: 'fajr', label: 'صبح' },
                  { key: 'dhuhr', label: 'ظهر' },
                  { key: 'asr', label: 'عصر' },
                  { key: 'maghrib', label: 'مغرب' },
                  { key: 'isha', label: 'عشاء' },
                ] as const).map((p) => {
                  const done = todayPrayers[p.key];
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => togglePrayerToday(p.key)}
                      className="p-2.5 rounded-2xl border flex flex-col items-center gap-1.5 transition-all"
                      style={{
                        background: done ? biAccent : 'rgba(255,255,255,0.04)',
                        borderColor: done ? '#FFFFFF55' : 'rgba(255,255,255,0.1)',
                        color: '#FFFFFF',
                      }}
                    >
                      <span className="text-xs font-black">{p.label}</span>
                      <span className="text-[10px]">{done ? '✓ خواندم' : 'ثبت'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl p-4 border bg-[#13111C]/90 border-white/10 space-y-2.5">
              <h3 className="text-xs font-black text-white mb-1">📒 دفترچه هوشمند شمارش معکوس نماز و روزه قضا</h3>
              {([
                { key: 'fajr', label: 'نماز قضای صبح (۲ رکعت)' },
                { key: 'dhuhr', label: 'نماز قضای ظهر (۴ رکعت)' },
                { key: 'asr', label: 'نماز قضای عصر (۴ رکعت)' },
                { key: 'maghrib', label: 'نماز قضای مغرب (۳ رکعت)' },
                { key: 'isha', label: 'نماز قضای عشاء (۴ رکعت)' },
                { key: 'ayat', label: 'نماز آیات قضا' },
                { key: 'fastingDays', label: 'روزه قضا (روز)' },
              ] as const).map((item) => (
                <div key={item.key} className="flex items-center justify-between p-2.5 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-xs font-bold text-slate-200">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQaza(item.key, -1)}
                      className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    >
                      ۱ ادا شد ✓
                    </button>
                    <span className="w-9 text-center text-sm font-black text-white">{toFaDigits(qaza[item.key])}</span>
                    <button
                      type="button"
                      onClick={() => updateQaza(item.key, 1)}
                      className="w-7 h-7 rounded-xl flex items-center justify-center bg-white/10 text-white"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* تب سوم: سپر خلوت و حضور قلب (Khushu Focus Mode) */}
        {/* ================================================================ */}
        {tab === 'khushu_focus' && (
          <div className="rounded-3xl p-6 border bg-[#13111C]/90 border-white/10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ background: biAccentSoft, border: `2px solid ${biAccent}` }}>
              <Clock size={28} color={biAccent} />
            </div>
            <h3 className="text-base font-black text-white">سپر ۱۵ دقیقه‌ای حضور قلب و سم‌زدایی دیجیتال</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              برای دوری از شبکه‌های اجتماعی در وقت نماز و تعقیبات، تایمر خلوت معنوی را فعال کنید.
            </p>
            <div className="text-4xl font-black text-white font-mono" dir="ltr">
              {toFaDigits(String(Math.floor(focusSecLeft / 60)).padStart(2, '0'))}:{toFaDigits(String(focusSecLeft % 60).padStart(2, '0'))}
            </div>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setFocusRunning((r) => !r)}
                className="px-5 py-2.5 rounded-2xl text-xs font-black text-white"
                style={{ background: biAccent }}
              >
                {focusRunning ? 'توقف موقت' : 'شروع خلوت ۱۵ دقیقه‌ای'}
              </button>
              <button
                type="button"
                onClick={() => { setFocusRunning(false); setFocusSecLeft(15 * 60); }}
                className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-white/10 text-slate-200"
              >
                بازنشانی
              </button>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* تب چهارم: نشان‌های افتخار معنوی و حلقه ختم */}
        {/* ================================================================ */}
        {tab === 'khatm_circle' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {bi.badges.map((bd: { id: string; title: string; desc: string; unlocked: boolean }) => (
              <div key={bd.id} className="p-3.5 rounded-2xl border bg-[#13111C]/90 border-white/10 flex items-start gap-2.5">
                <Award size={20} color={biAccent} className="shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black text-white">{bd.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{bd.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode;
}

export const VipAndAnalyticsModal = VipAnalyticsModal;
export default VipAnalyticsModal;
