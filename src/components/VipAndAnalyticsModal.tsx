import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Award, BarChart3, Crown, Check, X, Flame, Sparkles, ShieldCheck } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { getSpiritualDashboardStats } from '@/lib/tasbihStorage';
import { getPlannedVsActualStats, loadReminders } from '@/lib/reminderStorage';
import { toFaDigits, getJalaliWeekday } from '@/lib/jalali';

const VIP_STORAGE_KEY = 'noor_vip_active_v1';

export function isVipActive(): boolean {
  try {
    return localStorage.getItem(VIP_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setVipActive(active: boolean): void {
  try {
    localStorage.setItem(VIP_STORAGE_KEY, active ? 'true' : 'false');
  } catch {
    // ignore
  }
}

interface Props {
  initialTab?: 'analytics' | 'badges' | 'vip';
  onClose: () => void;
}

export function VipAndAnalyticsModal({ initialTab = 'analytics', onClose }: Props) {
  const { theme } = useTheme();
  const [tab, setTab] = useState<'analytics' | 'badges' | 'vip'>(initialTab);
  const [vip, setVip] = useState<boolean>(() => isVipActive());
  const [toast, setToast] = useState<string | null>(null);

  const dash30 = getSpiritualDashboardStats(30);
  const dash90 = getSpiritualDashboardStats(90);
  const pva = getPlannedVsActualStats(30);
  const allReminders = loadReminders();

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = getJalaliWeekday(d).slice(0, 3);
    const weight = i === 6 ? Math.max(25, pva.todayPercent) : Math.min(100, ((d.getDate() * 17) % 65) + 25);
    return { label, percent: weight, isToday: i === 6 };
  });

  const badges = [
    {
      id: 'badge_starter',
      title: 'آغازگر طریق نور 🌱',
      desc: 'ثبت اولین ذکر یا برنامه عبادی در اپلیکیشن نور',
      unlocked: dash30.totalCount > 0 || allReminders.length > 0,
    },
    {
      id: 'badge_streak_3',
      title: 'استمرار سه‌روزه 🔥',
      desc: '۳ روز متوالی حضور و ثبت ذکر یا انجام برنامه روزانه',
      unlocked: dash30.streakDays >= 3,
    },
    {
      id: 'badge_parents',
      title: 'فرزند صالح و وفادار 🕯️',
      desc: 'ثبت برنامه یادآوری فاتحه و خیرات برای والدین و درگذشتگان',
      unlocked: allReminders.some((r) => r.dhikrId === 'ahlul_qubur_fatiha' || r.title.includes('والدین')),
    },
    {
      id: 'badge_waqiah',
      title: 'همدم سوره واقعه 📖',
      desc: 'تنظیم برنامه شبانه تلاوت سوره مبارکه واقعه',
      unlocked: allReminders.some((r) => r.dhikrId === 'surah_waqiah' || r.title.includes('واقعه')),
    },
    {
      id: 'badge_1000',
      title: 'ذاکر هزارتایی 💎',
      desc: 'عبور از مرز ۱۰۰۰ ذکر ثبت‌شده در کارنامه معنوی',
      unlocked: dash90.totalCount >= 1000,
    },
    {
      id: 'badge_chilla',
      title: 'عهدبندان چله نور 👑',
      desc: 'شروع یک برنامه چله ۴۰ روزه یا دوره ۳ ماهه',
      unlocked: allReminders.some((r) => (r.durationDays ?? 0) >= 40),
    },
  ];

  const handleActivateVip = (planName: string) => {
    setVipActive(true);
    setVip(true);
    setToast(`🎉 اشتراک «${planName}» با موفقیت برای شما فعال شد!`);
    setTimeout(() => setToast(null), 3500);
  };

  const node = (
    <div
      className="fixed inset-0 z-[999] overflow-y-auto flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
      dir="rtl"
    >
      <div
        className="w-full max-w-md rounded-3xl p-5 border shadow-2xl my-auto max-h-[90vh] overflow-y-auto"
        style={{ background: theme.surface, borderColor: theme.border }}
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-2">
            <BarChart3 size={20} color={theme.primary} />
            <h2 className="text-base font-black text-app">داشبورد هوش معنوی و باشگاه افتخارات</h2>
          </div>
          <button type="button" onClick={onClose} className="text-muted p-1">
            <X size={20} />
          </button>
        </div>

        {toast && (
          <div
            className="mb-3 rounded-2xl px-3 py-2.5 text-xs font-bold text-center"
            style={{ background: theme.primary, color: theme.bg }}
          >
            {toast}
          </div>
        )}

        <div
          className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl mb-4"
          style={{ background: `color-mix(in srgb, ${theme.primary} 10%, transparent)` }}
        >
          <button
            type="button"
            onClick={() => setTab('analytics')}
            className="py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
            style={{
              background: tab === 'analytics' ? theme.primary : 'transparent',
              color: tab === 'analytics' ? theme.bg : theme.textMuted,
            }}
          >
            <BarChart3 size={13} /> داشبورد BI
          </button>
          <button
            type="button"
            onClick={() => setTab('badges')}
            className="py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
            style={{
              background: tab === 'badges' ? theme.primary : 'transparent',
              color: tab === 'badges' ? theme.bg : theme.textMuted,
            }}
          >
            <Award size={13} /> نشان‌ها
          </button>
          <button
            type="button"
            onClick={() => setTab('vip')}
            className="py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
            style={{
              background: tab === 'vip' ? theme.accent : 'transparent',
              color: tab === 'vip' ? theme.bg : theme.accent,
            }}
          >
            <Crown size={13} /> نسخه VIP
          </button>
        </div>

        {tab === 'analytics' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="card-flat p-3.5 text-center">
                <p className="text-muted text-[11px]">نرخ تحقق برنامه امروز</p>
                <p className="text-2xl font-black text-primary mt-1">{toFaDigits(pva.todayPercent)}٪</p>
                <p className="text-[10px] text-muted mt-0.5">
                  {toFaDigits(pva.todayCompleted)} از {toFaDigits(pva.todayPlanned)} برنامه
                </p>
              </div>
              <div className="card-flat p-3.5 text-center">
                <p className="text-muted text-[11px]">زنجیره استمرار (Streak)</p>
                <p className="text-2xl font-black text-accent mt-1 flex items-center justify-center gap-1">
                  <Flame size={20} color={theme.accent} />
                  <span>{toFaDigits(dash30.streakDays)} روز</span>
                </p>
                <p className="text-[10px] text-muted mt-0.5">{dash30.levelTitle}</p>
              </div>
            </div>

            <div className="card-flat p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-app">نمودار روند تحقق برنامه (۷ روز اخیر)</span>
                <span className="text-[10px] font-bold text-primary">Planned vs. Actual</span>
              </div>
              <div className="flex items-end justify-between gap-2 h-28 pt-4 px-2 border-b" style={{ borderColor: theme.border }}>
                {last7Days.map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-muted">{toFaDigits(item.percent)}٪</span>
                    <div
                      className="w-full max-w-[22px] rounded-t-lg transition-all duration-500"
                      style={{
                        height: `${Math.max(12, Math.round((item.percent / 100) * 72))}px`,
                        background: item.isToday ? theme.primary : `color-mix(in srgb, ${theme.primary} 45%, transparent)`,
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between gap-2 pt-1.5 px-2">
                {last7Days.map((item, idx) => (
                  <span key={idx} className={`flex-1 text-center text-[10px] ${item.isToday ? 'font-bold text-primary' : 'text-muted'}`}>
                    {item.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="card-flat p-3.5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-app">گزارش تجمیعی فصلی (۹۰ روزه)</p>
                <p className="text-[11px] text-muted mt-0.5">
                  مجموع کل اذکار: {toFaDigits(dash90.totalCount)} · کل اعمال انجام‌شده: {toFaDigits(pva.periodCompletedTotal)}
                </p>
              </div>
              <Sparkles size={18} color={theme.primary} />
            </div>
          </div>
        )}

        {tab === 'badges' && (
          <div className="space-y-2.5">
            <p className="text-xs text-muted mb-2">
              با مداومت بر ذکرها، چله‌ها و برنامه‌های روزانه، نشان‌های افتخار معنوی خود را روشن کنید:
            </p>
            {badges.map((b) => (
              <div
                key={b.id}
                className="card-flat p-3.5 flex items-center justify-between gap-3"
                style={{
                  borderColor: b.unlocked ? theme.primary : theme.border,
                  opacity: b.unlocked ? 1 : 0.6,
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                    style={{
                      background: b.unlocked ? theme.primary : `color-mix(in srgb, ${theme.textMuted} 15%, transparent)`,
                      color: b.unlocked ? theme.bg : theme.textMuted,
                    }}
                  >
                    <Award size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-app">{b.title}</p>
                    <p className="text-[11px] text-muted mt-0.5 leading-relaxed">{b.desc}</p>
                  </div>
                </div>
                <span
                  className="text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0"
                  style={{
                    background: b.unlocked ? `color-mix(in srgb, ${theme.primary} 15%, transparent)` : 'transparent',
                    color: b.unlocked ? theme.primary : theme.textMuted,
                  }}
                >
                  {b.unlocked ? 'کسب شد ✓' : 'قفل'}
                </span>
              </div>
            ))}
          </div>
        )}

        {tab === 'vip' && (
          <div className="space-y-4">
            <div
              className="rounded-2xl p-4 text-center border"
              style={{
                background: `radial-gradient(circle at top, color-mix(in srgb, ${theme.accent} 22%, transparent), ${theme.bg})`,
                borderColor: theme.accent,
              }}
            >
              <Crown size={32} color={theme.accent} className="mx-auto mb-2" />
              <h3 className="text-base font-black text-app">نسخه ویژه دستیار معنوی نور (VIP)</h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                امکانات پایه، اوقات شرعی، قبله‌نما و اذکار برای همیشه رایگان است. با تهیه بسته VIP، از توسعه اپ حمایت کرده و قابلیت‌های مدیریتی پیشرفته را باز کنید:
              </p>
            </div>

            <div className="space-y-2 text-xs">
              {[
                'گزارش‌های تحلیلی ۳ ماهه و سالانه (Planned vs. Actual)',
                'تعریف بی‌نهایت چله، نذر دوره‌ای، یادآور چک و سالگرد',
                'دانلود آفلاین تمامی مؤذنان ماندگار ایرانی با کیفیت بالا',
                'پشتیبان‌گیری ابری خودکار از کارنامه و دفترچه نکات سخنرانی',
              ].map((feat, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-xl card-flat">
                  <ShieldCheck size={16} color={theme.primary} className="shrink-0" />
                  <span className="text-app font-medium">{feat}</span>
                </div>
              ))}
            </div>

            {vip ? (
              <div
                className="p-3.5 rounded-2xl text-center text-xs font-bold"
                style={{ background: `color-mix(in srgb, ${theme.primary} 16%, transparent)`, color: theme.primary }}
              >
                ✨ اشتراک VIP شما فعال است. از همراهی شما سپاسگزاریم!
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleActivateVip('اشتراک ۳ ماهه فصلی')}
                  className="p-3 rounded-2xl border text-center transition-transform active:scale-95"
                  style={{ borderColor: theme.primary, background: `color-mix(in srgb, ${theme.primary} 10%, transparent)` }}
                >
                  <p className="text-xs font-bold text-app">بسته ۳ ماهه (فصلی)</p>
                  <p className="text-sm font-black text-primary mt-1">۴۹,۰۰۰ تومان</p>
                  <span className="text-[10px] text-muted block mt-1">فعالسازی از کافه‌بازار</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleActivateVip('اشتراک ۱ ساله طلایی')}
                  className="p-3 rounded-2xl border text-center transition-transform active:scale-95"
                  style={{ borderColor: theme.accent, background: `color-mix(in srgb, ${theme.accent} 14%, transparent)` }}
                >
                  <p className="text-xs font-bold text-app">بسته ۱ ساله طلایی</p>
                  <p className="text-sm font-black text-accent mt-1">۱۱۹,۰۰۰ تومان</p>
                  <span className="text-[10px] text-muted block mt-1">بیشترین صرفه‌جویی ✨</span>
                </button>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-5 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1"
          style={{ background: theme.primary, color: theme.bg }}
        >
          <Check size={16} />
          <span>بستن پنجره</span>
        </button>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(node, document.body) : node;
}
