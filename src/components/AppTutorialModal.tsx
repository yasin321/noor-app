import { createPortal } from 'react-dom';
import {
  Check,
  Sparkles,
  BellRing,
  Hand,
  BookOpen,
  Compass,
  Navigation,
  Palette,
  X,
  Volume2,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export const TUTORIAL_SEEN_KEY = 'noor_tutorial_seen_v1';

interface Props {
  onClose: () => void;
}

export function AppTutorialModal({ onClose }: Props) {
  const handleClose = () => {
    try {
      localStorage.setItem(TUTORIAL_SEEN_KEY, '1');
    } catch {}
    onClose();
  };
  const { theme } = useTheme();

  const steps = [
    {
      step: '۱',
      icon: BellRing,
      title: 'اذان خودکار روی صفحه قفل',
      where: 'صفحه خانه ← جدول اوقات شرعی ← آیکون زنگوله هر نماز',
      result: 'سر وقت اذان، صفحه گوشی خودکار روشن می‌شود و صدای مؤذن انتخابی شما پخش می‌گردد.',
    },
    {
      step: '۲',
      icon: Volume2,
      title: 'تعقیبات و نوای قبل و بعد اذان',
      where: 'صفحه خانه ← کشوی سبز «تعقیبات»',
      result: 'ربنا، نادعلی یا سوره‌ها را برای چند دقیقه قبل و بعد اذان انتخاب کنید؛ بدون نیاز به دکمه ذخیره همان لحظه کوک می‌شود.',
    },
    {
      step: '۳',
      icon: Hand,
      title: 'ذکرشمار چندانگشتی (سریع و بی‌دردسر)',
      where: 'نوار پایین ← «ذکرشمار»',
      result: 'با ۱، ۲ یا ۳ انگشت هم‌زمان روی دایره بزنید تا سریع بشمارد. با دکمه «خلوت» کل صفحه تاریک می‌شود تا بدون نگاه کردن ذکر بگویید.',
    },
    {
      step: '۴',
      icon: BookOpen,
      title: 'قرآن با صوت آیه‌به‌آیه و یادآور تلاوت',
      where: 'صفحه خانه ← دکمه «قرآن»',
      result: 'سوره را انتخاب کنید و «پخش ترتیل» را بزنید تا آیه‌ها یکی‌یکی خوانده شوند و صفحه خودکار ورق بخورد. پایین صفحه هم می‌توانید یادآور روزانه کوک کنید.',
    },
    {
      step: '۵',
      icon: Compass,
      title: 'قبله‌نمای دقیق و مسجدیاب زنده',
      where: 'صفحه خانه ← «قبله‌نما» یا «مسجدیاب»',
      result: 'در قبله‌نما گوشی را یک‌بار مثل عدد ۸ انگلیسی بچرخانید تا جهت کعبه قفل شود. در مسجدیاب هم نزدیک‌ترین مساجد محله را روی نقشه می‌بینید.',
    },
    {
      step: '۶',
      icon: Palette,
      title: 'پوسته‌های حرم، تقویم و گزارش معنوی',
      where: 'صفحه خانه ← «تقویم و هوا» یا نوار پایین ← «تنظیمات»',
      result: 'پوسته و تصویر حرم دلخواهتان را عوض کنید، تقویم و آب‌وهوا را ببینید و نمازهای روزانه و قضا را در گزارش معنوی ثبت کنید.',
    },
  ];

  const node = (
    <div
      className="fixed inset-0 z-[999] overflow-y-auto flex items-stretch sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)' }}
      dir="rtl"
    >
      <div
        className="w-full sm:max-w-lg min-h-[100dvh] sm:min-h-0 sm:rounded-3xl p-5 border-0 sm:border shadow-2xl overflow-y-auto"
        style={{ background: theme.surface, borderColor: theme.border }}
      >
        <div
          className="flex items-start justify-between gap-3 pb-3.5 mb-3.5 border-b"
          style={{ borderColor: theme.border }}
        >
          <div className="flex items-start gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-md"
              style={{
                background: 'linear-gradient(135deg, ' + theme.primary + ', ' + theme.accent + ')',
                color: theme.bg,
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-app">راهنمای اپلیکیشن نور</h2>
              <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                همه امکانات نور در ۶ قدم ساده؛ دقیقاً بدانید کجا بزنید و چه می‌شود.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="بستن راهنما"
            className="w-8 h-8 rounded-xl border flex items-center justify-center text-muted shrink-0"
            style={{ borderColor: theme.border }}
          >
            <X size={17} />
          </button>
        </div>

        <div
          className="mb-3.5 p-3 rounded-2xl border flex items-center gap-2.5"
          style={{
            background: 'color-mix(in srgb, ' + theme.accent + ' 12%, ' + theme.bg + ')',
            borderColor: 'color-mix(in srgb, ' + theme.accent + ' 38%, ' + theme.border + ')',
          }}
        >
          <Navigation size={16} color={theme.accent} className="shrink-0" />
          <p className="text-[11px] font-bold text-app leading-relaxed">
            پیشنهاد شروع سریع: اول بالای صفحه خانه اسم شهرتان را چک کنید، بعد زنگوله اذان‌های دلخواه را روشن کنید.
          </p>
        </div>

        <div className="space-y-2.5 mb-4">
          {steps.map((st) => {
            const IconComp = st.icon;
            return (
              <div
                key={st.step}
                className="rounded-2xl p-3.5 border space-y-1.5"
                style={{ background: theme.bg, borderColor: theme.border }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: 'color-mix(in srgb, ' + theme.primary + ' 18%, transparent)',
                      color: theme.primary,
                    }}
                  >
                    <IconComp size={16} />
                  </div>
                  <h3 className="text-xs font-black text-app flex-1">
                    {st.step}. {st.title}
                  </h3>
                </div>

                <div
                  className="text-[10.5px] font-bold px-2.5 py-1 rounded-xl inline-block"
                  style={{
                    background: 'color-mix(in srgb, ' + theme.primary + ' 12%, transparent)',
                    color: theme.primary,
                  }}
                >
                  کجا بزنم؟ {st.where}
                </div>

                <p className="text-[11.5px] text-muted leading-relaxed">{st.result}</p>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-center text-muted mb-3">
          طراحی، معماری و توسعه توسط <strong className="text-primary font-black">یاسین</strong>
        </p>

        <button
          type="button"
          onClick={handleClose}
          className="w-full py-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 shadow-lg transition-transform active:scale-[0.99]"
          style={{ background: theme.primary, color: theme.bg }}
        >
          <Check size={16} /> متوجه شدم، بزن بریم
        </button>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(node, document.body) : node;
}
