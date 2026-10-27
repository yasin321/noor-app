import { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  BookOpen,
  Share2,
  Flame,
  Smartphone,
  ShieldCheck,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Volume2,
  ListChecks,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { toFaDigits } from '@/lib/jalali';

interface Props {
  onClose: () => void;
}

interface GuideSection {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  icon: typeof Sparkles;
  whereToFind: string;
  bullets: string[];
  proTip: string;
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'streak',
    badge: '۱ از ۸ • انگیزه و پیوستگی',
    title: '🔥 زنجیره نور (Streak) و نشان‌های افتخار',
    subtitle: 'هر روز با یک عمل معنوی کوتاه، چراغ پیوستگی خودت را روشن نگه دار.',
    icon: Flame,
    whereToFind: 'محل دسترسی: بالاترین کارت در صفحه اصلی (خانه) + دکمه «کارنامه من»',
    bullets: [
      'با انجام حداقل یکی از کارهای معنوی در روز (ذکر در تسبیح، خواندن ۱ آیه قرآن، ثبت محاسبه نفس یا تیک زدن یادآور)، زنجیره روزانه شما افزایش می‌یابد.',
      'نشان‌های افتخار: ✨ رهجوی آغازین، 🌱 همراه بااراده (۳ روز)، 🔥 ذاکر باوفا (۷ روز)، 🌟 یار دیرین سحر (۱۴ روز) و 👑 چله‌نشین نورانی (۴۰ روز).',
      'با دکمه «کارنامه من» روی کارت زنجیره، نمودار ۳۰ روزه و آمار دقیق پیشرفت را مشاهده کنید.',
    ],
    proTip: 'حتی در روزهای شلوغ با یک ذکر کوتاه می‌توانید زنجیره معنوی‌تان را روشن نگه دارید.',
  },
  {
    id: 'adhan-studio',
    badge: '۲ از ۸ • اذان‌گوی حرفه‌ای',
    title: '🎙️ استودیو هوشمند اذان، دانلود مؤذن و حالت سفر',
    subtitle: 'تنظیم اختصاصی برای هر نماز، پروفایل‌های محیطی و مدیریت خودکار نماز مسافر.',
    icon: Volume2,
    whereToFind: 'محل دسترسی: صفحه اصلی (کارت استودیو اذان / حالت سفر) و تب تنظیمات',
    bullets: [
      'پروفایل‌های صوتی هوشمند: جابه‌جایی سریع بین سه حالت «🏠 خانه»، «💼 محل کار» و «✈️ در سفر».',
      '۴ حالت پخش برای ۵ نوبت نماز: اذان کامل، پیش‌نمایش ۱۰ ثانیه‌ای، تک‌بوق ملایم یا حالت بی‌صدا.',
      'دانلود آفلاین مؤذنان: صدای مؤذنان برجسته ایرانی و اسلامی را یک‌بار دانلود و بدون اینترنت استفاده کنید.',
      'حالت سفر و مسجد: یادآوری نمازهای شکسته (قصر) و مدیریت تقریب ظهر/عصر و مغرب/عشا در سفر.',
    ],
    proTip: 'پخش اذان حتی در حالت قفل صفحه با نمایش اختصاصی تمام‌صفحه و دکمه توقف کار می‌کند.',
  },
  {
    id: 'quran-muhasaba',
    badge: '۳ از ۸ • انس با قرآن و خودسازی',
    title: '📖 ادامه هوشمند قرآن و دفترچه محاسبه نفس شبانه',
    subtitle: 'ختم تدریجی قرآن از همان آیه‌ای که مانده‌اید + خلوت شبانه کاملاً خصوصی.',
    icon: BookOpen,
    whereToFind: 'محل دسترسی: صفحه اصلی -> کارت «انس با قرآن و محاسبه نفس»',
    bullets: [
      'ادامه مطالعه از آخرین آیه: برنامه آخرین آیه و سوره خوانده‌شده را حفظ کرده و با یک لمس نمایش می‌دهد.',
      'هدف‌گذاری روزانه: تعیین زمان مطالعه (۵، ۱۵ یا ۳۰ دقیقه) و امکان نشانک‌گذاری (Bookmark) آیات.',
      'محاسبه نفس شبانه: ثبت شکرگزاری، نکته اخلاقی و نیت فردا در ۴ حالت روحی (آرام، شاکر، امیدوار، توبه‌کار).',
    ],
    proTip: 'یادداشت‌های محاسبه نفس ۱۰۰٪ خصوصی بوده و تنها روی حافظه داخلی گوشی شما نگهداری می‌شوند.',
  },
  {
    id: 'viral-story',
    badge: '۴ از ۸ • نشر نور و استوری‌ساز',
    title: '🎨 ساخت پوستر و استوری نورانی (با کیفیت 1080p)',
    subtitle: 'تبدیل آیات قرآن به کارت گرافیکی چشم‌نواز جهت اشتراک‌گذاری در شبکه‌های اجتماعی.',
    icon: Share2,
    whereToFind: 'محل دسترسی: داخل پنجره «انس با قرآن» -> دکمه «استوری» کنار هر آیه',
    bullets: [
      'موتور گرافیکی داخلی، متن عربی، ترجمه، نام سوره و تاریخ روز را در یک پوستر 1080x1920 ترکیب می‌کند.',
      'در موبایل پنجره اشتراک مستقیم (اینستاگرام، ایتا، بله، تلگرام و...) باز می‌شود.',
      'در مرورگر فایل تصویری PNG با بالاترین وضوح مستقیماً دانلود می‌گردد.',
    ],
    proTip: 'رنگ‌بندی پوستر استوری به صورت پویا با رنگ تم فعلی برنامه ست می‌شود.',
  },
  {
    id: 'smart-tasbih',
    badge: '۵ از ۸ • ذکرشمار و کتابخانه ادعیه',
    title: '📿 تسبیح‌شمار لمسی با ویبره هوشمند (استفاده با چشم بسته)',
    subtitle: 'طراحی‌شده برای تسبیحات حضرت زهرا (س) بدون نیاز به نگاه کردن به صفحه.',
    icon: Sparkles,
    whereToFind: 'محل دسترسی: تب «تسبیح» و تب «کتابخانه» در نوار پایین برنامه',
    bullets: [
      'الگوی ویبره ۳ مرحله‌ای: لرزش ملایم در هر ذکر، لرزش دوگانه در شماره ۳۴ و ۶۷، و لرزش کامل در عدد ۱۰۰.',
      'کتابخانه جامع اذکار: شامل اذکار ایام هفته، تسبیحات اربعه، تعقیبات نماز و امکان ساخت ذکر دلخواه.',
      'امکان جابه‌جایی سریع بین صفحات با سوایپ (کشیدن انگشت به چپ و راست).',
    ],
    proTip: 'آمار تسبیحات روزانه شما مستقیماً در کارنامه معنوی و زنجیره نور محاسبه می‌شود.',
  },
  {
    id: 'reminders-40day',
    badge: '۶ از ۸ • برنامه‌ریزی و چله‌نشینی',
    title: '🔔 یادآورهای هوشمند، چله‌نشینی ۴۰ روزه و تطبیق برنامه با عمل',
    subtitle: 'مدیریت عادت‌های معنوی، تیک زدن روزانه و پیگیری پیشرفت چله.',
    icon: ListChecks,
    whereToFind: 'محل دسترسی: تب «یادآورها» در نوار پایین برنامه',
    bullets: [
      'ایجاد یادآورهای تکرارشونده هفتگی یا یک‌باره با انتخاب نوع هشدار.',
      'ثبت روزانه برنامه در برابر عمل (Planned vs Actual) برای بررسی درصد وفاداری به روتین‌های معنوی.',
      'شمارنده چله‌نشینی ۴۰ روزه برای تثبیت عادت‌های مثبت عبادی و اخلاقی.',
    ],
    proTip: 'انتخاب‌گر ساعت و تقویم کاملاً بر اساس ارقام و ماه‌های شمسی طراحی شده است.',
  },
  {
    id: 'calendar-qibla-widget',
    badge: '۷ از ۸ • ابزارهای کاربردی و ویجت',
    title: '🧭 قبله‌نما، تقویم و مبدل تاریخ + ویجت زنده اندروید',
    subtitle: 'دسترسی سریع به اوقات شرعی و جهت قبله حتی بدون باز کردن برنامه.',
    icon: Smartphone,
    whereToFind: 'محل دسترسی: دکمه‌های صفحه اصلی + صفحه هوم اندروید (Widgets)',
    bullets: [
      'ویجت زنده صفحه اصلی اندروید: نمایش پیوسته نام شهر، تاریخ شمسی، وقت نماز بعدی و روزهای زنجیره.',
      'تقویم جلالی و مبدل تاریخ: بررسی مناسبت‌ها و تبدیل دقیق تاریخ شمسی به میلادی و برعکس.',
      'قبله‌نمای دقیق: محاسبه زاویه نسبت به شهر انتخابی همراه با نشانگر سنسور.',
    ],
    proTip: 'اطلاعات ویجت با هر بار باز شدن برنامه، به طور خودکار با موقعیت و اوقات شرعی جدید همگام می‌شود.',
  },
  {
    id: 'backup-themes',
    badge: '۸ از ۸ • امنیت اطلاعات و شخصی‌سازی',
    title: '📦 پشتیبان‌گیری آفلاین (Backup/Restore)، فونت و تم‌ها',
    subtitle: 'محافظت از اطلاعات در زمان تعویض گوشی همراه با شخصی‌سازی ظاهر برنامه.',
    icon: ShieldCheck,
    whereToFind: 'محل دسترسی: تب «تنظیمات» در نوار پایین برنامه',
    bullets: [
      'خروجی فایل پشتیبان (JSON): دانلود یکجای تمام یادآورها، چله‌ها، تسبیحات و یادداشت‌های محاسبه نفس.',
      'بازیابی سریع: بارگذاری فایل پشتیبان و بازگردانی فوری اطلاعات بدون نیاز به اینترنت.',
      'شخصی‌سازی: تغییر تم‌های رنگی، اندازه فونت‌ها و مدیریت مجوزهای اعلان.',
    ],
    proTip: 'این راهنما همواره از تب تنظیمات در دسترس است تا امکانات برنامه فراموش نشوند.',
  },
];

export function AppTutorialModal({ onClose }: Props) {
  const { theme } = useTheme();
  const [step, setStep] = useState(0);
  const [viewAll, setViewAll] = useState(false);

  const current = GUIDE_SECTIONS[step];
  const IconComp = current.icon;

  const modalNode = (
    <div
      className="fixed inset-0 z-[999] overflow-y-auto flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.84)', backdropFilter: 'blur(7px)' }}
      dir="rtl"
    >
      <div
        className="w-full max-w-md rounded-3xl p-5 border shadow-2xl my-auto max-h-[92vh] overflow-y-auto flex flex-col"
        style={{ background: theme.surface, borderColor: theme.border }}
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-2">
            <Sparkles size={20} color={theme.primary} />
            <div>
              <h2 className="text-sm font-black text-app">راهنمای جامع امکانات «نور»</h2>
              <p className="text-[10px] text-muted">مرجع کامل تمام قابلیت‌های نسخه جدید</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setViewAll((v) => !v)}
              className="px-2.5 py-1 rounded-xl text-[11px] font-bold border"
              style={{
                borderColor: theme.primary,
                color: viewAll ? theme.bg : theme.primary,
                background: viewAll ? theme.primary : 'transparent',
              }}
            >
              {viewAll ? 'نمای مرحله‌ای' : 'فهرست یکجا'}
            </button>
            <button type="button" onClick={onClose} className="text-muted p-1" aria-label="بستن">
              <X size={20} />
            </button>
          </div>
        </div>

        {viewAll ? (
          <div className="space-y-3 overflow-y-auto pr-1">
            {GUIDE_SECTIONS.map((sec, idx) => {
              const SecIcon = sec.icon;
              return (
                <div
                  key={sec.id}
                  onClick={() => {
                    setStep(idx);
                    setViewAll(false);
                  }}
                  className="card-flat p-3.5 rounded-2xl border cursor-pointer"
                  style={{ borderColor: theme.border }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <SecIcon size={16} color={theme.primary} />
                      <h3 className="text-xs font-black text-app">{sec.title}</h3>
                    </div>
                    <span className="text-[10px] font-bold text-primary">مشاهده جزئیات ←</span>
                  </div>
                  <p className="text-[11px] text-muted leading-relaxed">{sec.subtitle}</p>
                  <p
                    className="text-[10px] font-bold mt-2 px-2 py-1 rounded-lg inline-block"
                    style={{ background: `color-mix(in srgb, ${theme.primary} 12%, transparent)`, color: theme.primary }}
                  >
                    📍 {sec.whereToFind}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3.5">
            <div className="flex gap-1 overflow-x-auto pb-1">
              {GUIDE_SECTIONS.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStep(idx)}
                  className="px-2.5 py-1 rounded-xl text-[10px] font-bold shrink-0 border"
                  style={{
                    borderColor: step === idx ? theme.primary : theme.border,
                    background: step === idx ? theme.primary : 'transparent',
                    color: step === idx ? theme.bg : theme.textMuted,
                  }}
                >
                  {toFaDigits(idx + 1)}
                </button>
              ))}
            </div>

            <div
              className="rounded-2xl p-4 border space-y-2"
              style={{
                background: `radial-gradient(circle at top right, color-mix(in srgb, ${theme.primary} 18%, transparent), ${theme.bg})`,
                borderColor: `color-mix(in srgb, ${theme.primary} 45%, ${theme.border})`,
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                  style={{ background: `color-mix(in srgb, ${theme.accent} 20%, transparent)`, color: theme.accent }}
                >
                  {current.badge}
                </span>
                <IconComp size={20} color={theme.primary} />
              </div>
              <h3 className="text-sm font-black text-app pt-0.5">{current.title}</h3>
              <p className="text-xs text-muted leading-relaxed">{current.subtitle}</p>
              <div
                className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl mt-1"
                style={{ background: `color-mix(in srgb, ${theme.primary} 14%, transparent)`, color: theme.primary }}
              >
                📍 {current.whereToFind}
              </div>
            </div>

            <div className="space-y-2">
              {current.bullets.map((b, i) => (
                <div key={i} className="card-flat p-3 rounded-2xl flex items-start gap-2.5">
                  <CheckCircle2 size={16} color={theme.primary} className="shrink-0 mt-0.5" />
                  <p className="text-xs text-app leading-relaxed">{b}</p>
                </div>
              ))}
            </div>

            <div
              className="rounded-2xl p-3 border text-xs leading-relaxed"
              style={{
                borderColor: `color-mix(in srgb, ${theme.accent} 45%, ${theme.border})`,
                background: `color-mix(in srgb, ${theme.accent} 10%, transparent)`,
                color: theme.text,
              }}
            >
              <span className="font-black" style={{ color: theme.accent }}>💡 نکته طلایی: </span>
              {current.proTip}
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t" style={{ borderColor: theme.border }}>
              <button
                type="button"
                disabled={step === 0}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className="px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1 border disabled:opacity-40"
                style={{ borderColor: theme.border, color: theme.text }}
              >
                <ChevronRight size={15} /> بخش قبلی
              </button>

              {step < GUIDE_SECTIONS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.min(GUIDE_SECTIONS.length - 1, s + 1))}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1"
                  style={{ background: theme.primary, color: theme.bg }}
                >
                  <span>بخش بعدی ({toFaDigits(step + 2)} از {toFaDigits(GUIDE_SECTIONS.length)})</span>
                  <ChevronLeft size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1"
                  style={{ background: theme.primary, color: theme.bg }}
                >
                  <CheckCircle2 size={15} /> متوجه شدم، شروع کنیم!
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode;
}
