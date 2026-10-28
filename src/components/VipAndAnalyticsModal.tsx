import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Award, BarChart3, Crown, Check, X, Flame, Sparkles, ShieldCheck, Unlock, Volume2, BookOpen, Calendar, Plane } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { getSpiritualDashboardStats } from '@/lib/tasbihStorage';
import { getPlannedVsActualStats, loadReminders, getDayCompletionPercent } from '@/lib/reminderStorage';
import { toFaDigits, getJalaliWeekday } from '@/lib/jalali';

const VIP_STORAGE_KEY = 'noor_vip_active_v1';

// به درخواست شما، وضعیت VIP به صورت پیش‌فرض باز (true) است تا همه امکانات قابل بررسی باشد
export function isVipActive(): boolean {
  try {
    const val = localStorage.getItem(VIP_STORAGE_KEY);
    if (val === 'false') return false;
    return true;
  } catch {
    return true;
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

const VIP_FEATURES_LIST = [
  {
    icon: Volume2,
    title: '۱. استودیوی چندپروفایله اذان (خانه، محل کار، سفر)',
    desc: 'تنظیم مؤذن مجزا برای هر یک از ۵ نماز، انتخاب حالت پخش ۱۰ ثانیه‌ای یا کامل، و دعای آمادگی ۱۰ دقیقه قبل از اذان.',
    status: 'باز و فعال برای بررسی شما ✓',
  },
  {
    icon: BarChart3,
    title: '۲. داشبورد تحلیلی استمرار (Power BI & Planned vs. Actual)',
    desc: 'نمودار ۷ روزه و کارنامه فصلی ۹۰ روزه برای مقایسه برنامه‌های ثبت‌شده (Planned) با اعمال انجام‌شده (Actual).',
    status: 'باز و فعال برای بررسی شما ✓',
  },
  {
    icon: BookOpen,
    title: '۳. انس مستمر با قرآن و دفترچه خلوت محاسبه نفس شبانه',
    desc: 'ذخیره خودکار آخرین آیه خوانده‌شده، هدف‌گذاری ۵ تا ۳۰ دقیقه‌ای و ثبت خصوصی شکرگزاری و نیت فردا.',
    status: 'باز و فعال برای بررسی شما ✓',
  },
  {
    icon: Calendar,
    title: '۴. مدیریت چله‌های ۴۰ روزه، نذرها و یادآورهای زندگی',
    desc: 'پیگیری پیشرفت چله دعای فرج، سوره واقعه، خیرات پنجشنبه والدین، سررسید چک صیادی و تولد عزیزان.',
    status: 'باز و فعال برای بررسی شما ✓',
  },
  {
    icon: Plane,
    title: '۵. دستیار هوشمند سفر (نماز شکسته) و ساعت جماعت مسجد',
    desc: 'محاسبه خودکار افق مقصد، یادآوری احکام قصر/تمام و نمایش زمان اقامه نماز جماعت مسجد محله.',
    status: 'باز و فعال برای بررسی شما ✓',
  },
];

export function VipAndAnalyticsModal({ initialTab = 'vip', onClose }: Props) {
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
    const weight = getDayCompletionPercent(d);
    return { label, percent: weight, isToday: i === 6 };
  });

  const badges = [
    {
      id: 'badge_starter',
      title: 'آغازگر طریق نور 🌱',
      desc: 'ثبت اولین ذکر یا برنامه عبادی در اپلیکیشن نور',
      unlocked: true,
    },
    {
      id: 'badge_streak_3',
      title: 'استمرار سه‌روزه 🔥',
      desc: '۳ روز متوالی حضور و ثبت ذکر یا انجام برنامه روزانه',
      unlocked: true,
    },
    {
      id: 'badge_parents',
      title: 'فرزند صالح و وفادار 🕯️',
      desc: 'ثبت برنامه یادآوری فاتحه و خیرات برای والدین و درگذشتگان',
      unlocked: true,
    },
    {
      id: 'badge_waqiah',
      title: 'همدم سوره واقعه 📖',
      desc: 'تنظیم برنامه شبانه تلاوت سوره مبارکه واقعه برای برکت رزق',
      unlocked: true,
    },
    {
      id: 'badge_1000',
      title: 'ذاکر هزارتایی 💎',
      desc: 'عبور از مرز ۱۰۰۰ ذکر ثبت‌شده در کارنامه معنوی',
      unlocked: true,
    },
    {
      id: 'badge_chilla',
      title: 'عهدبندان چله نور 👑',
      desc: 'شروع یک برنامه چله ۴۰ روزه یا دوره ۳ ماهه',
      unlocked: true,
    },
  ];

  const handleToggleVipPreview = () => {
    const next = !vip;
    setVipActive(next);
    setVip(next);
    setToast(next ? '🔓 حالت تست مدیریت: تمام امکانات VIP باز شد!' : '🔒 حالت کاربر عادی فعال شد.');
    setTimeout(() => setToast(null), 3000);
  };

  const node = (
    <div
      className="fixed inset-0 z-[999] overflow-y-auto flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)' }}
      dir="rtl"
    >
      <div
        className="w-full max-w-md rounded-3xl p-5 border shadow-2xl my-auto max-h-[90vh] overflow-y-auto"
        style={{ background: theme.surface, borderColor: theme.border }}
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-2">
            <Crown size={20} color={theme.accent} />
            <h2 className="text-base font-black text-app">بررسی امکانات VIP، داشبورد BI و نشان‌ها</h2>
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
            onClick={() => setTab('vip')}
            className="py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
            style={{
              background: tab === 'vip' ? theme.accent : 'transparent',
              color: tab === 'vip' ? theme.bg : theme.accent,
            }}
          >
            <Crown size={13} /> امکانات VIP
          </button>
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
            <Award size={13} /> نشان‌ها ({toFaDigits(badges.length)})
          </button>
        </div>

        {tab === 'vip' && (
          <div className="space-y-3.5">
            <div
              className="rounded-2xl p-4 border flex items-center justify-between gap-3"
              style={{
                background: `radial-gradient(circle at top right, color-mix(in srgb, ${theme.accent} 22%, transparent), ${theme.bg})`,
                borderColor: theme.accent,
              }}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <Unlock size={16} color={theme.accent} />
                  <h3 className="text-sm font-black text-app">حالت بررسی مدیر پروژه: تمام امکانات باز است</h3>
                </div>
                <p className="text-[11px] text-muted mt-1 leading-relaxed">
                  همهٔ قابلیت‌های زیر الان بدون محدودیت برای شما باز هستند تا بررسی‌شان کنید. هر زمان بخواهید می‌توانید آن‌ها را روی حالت اشتراکی بگذارید.
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleVipPreview}
                className="px-3 py-2 rounded-xl text-[11px] font-bold shrink-0"
                style={{ background: theme.accent, color: theme.bg }}
              >
                {vip ? 'فعال ✓' : 'قفل'}
              </button>
            </div>

            <div className="space-y-2.5">
              {VIP_FEATURES_LIST.map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <div key={idx} className="card-flat p-3.5 space-y-1.5" style={{ borderColor: theme.primary }}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Icon size={16} color={theme.primary} />
                        <p className="text-xs font-black text-app">{feat.title}</p>
                      </div>
                      <span className="text-[10px] font-bold text-primary shrink-0">{feat.status}</span>
                    </div>
                    <p className="text-[11px] text-muted leading-relaxed">{feat.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
                <span className="text-xs font-bold text-app">نمودار واقعی تحقق برنامه (۷ روز اخیر)</span>
                <span className="text-[10px] font-bold text-primary">Planned vs. Actual</span>
              </div>
              <div className="flex items-end justify-between gap-2 h-28 pt-4 px-2 border-b" style={{ borderColor: theme.border }}>
                {last7Days.map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-muted">{toFaDigits(item.percent)}٪</span>
                    <div
                      className="w-full max-w-[22px] rounded-t-lg transition-all duration-500"
                      style={{
                        height: `${Math.max(10, Math.round((item.percent / 100) * 72))}px`,
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
                  مجموع کل اذکار: {toFaDigits(dash90.totalCount)} · کل برنامه‌های فعال: {toFaDigits(allReminders.length)}
                </p>
              </div>
              <Sparkles size={18} color={theme.primary} />
            </div>
          </div>
        )}

        {tab === 'badges' && (
          <div className="space-y-2.5">
            <p className="text-xs text-primary font-bold mb-2">
              ✨ تمام ۶ نشان افتخار معنوی برای بررسی شما در حالت «کسب‌شده (باز)» قرار گرفته‌اند:
            </p>
            {badges.map((b) => (
              <div
                key={b.id}
                className="card-flat p-3.5 flex items-center justify-between gap-3"
                style={{ borderColor: theme.primary }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: theme.primary, color: theme.bg }}
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
                    background: `color-mix(in srgb, ${theme.primary} 15%, transparent)`,
                    color: theme.primary,
                  }}
                >
                  باز ✓
                </span>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5"
          style={{ background: theme.primary, color: theme.bg }}
        >
          <ShieldCheck size={16} />
          <span>بستن</span>
        </button>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(node, document.body) : node;
}
