import { createPortal } from 'react-dom';
import { Check, Sparkles, CalendarDays, Navigation, Volume2, Palette, Crown, X } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export const TUTORIAL_SEEN_KEY = 'noor_tutorial_seen_v1';

interface Props {
  onClose: () => void;
}

export function AppTutorialModal({ onClose }: Props) {
  const handleClose = () => {
    try { localStorage.setItem(TUTORIAL_SEEN_KEY, '1'); } catch {}
    onClose();
  };
  const { theme } = useTheme();

  const steps = [
    {
      icon: CalendarDays,
      title: '۱. تقویم سه‌گانه و پیش‌بینی ۷ روزه آب‌وهوا',
      desc: 'در بالای صفحه اول، با لمس «تاریخ روز» یا «کپسول دمای هوا»، تقویم کامل شمسی/قمری/میلادی، وضعیت قمر در عقرب و پیش‌بینی هوای ۷ روز آینده باز می‌شود.',
    },
    {
      icon: Navigation,
      title: '۲. رادار مسجدیاب ۵ موتوره و نقشه زنده',
      desc: 'با لمس دکمه «مسجدیاب»، موقعیت دقیق کوچه شما با Fused GPS قفل شده و تمام مساجد اطراف روی نقشه زنده خیابان‌ها به همراه زمان پیاده‌روی و خودرو نمایش داده می‌شوند.',
    },
    {
      icon: Volume2,
      title: '۳. استودیو اذان، تواشیح و تلاوت کامل سوره با تنظیم سرعت',
      desc: 'برای قبل از اذان (ناد علی، اسماء الحسنی، عبدالباسط و منشاوی)، خود اذان (مؤذن‌زاده، آقاتی و...) و پس از اذان (تلاوت کامل سوره با سرعت ۰.۸۵x تا ۲.۰x) حتی در حالت بسته بودن اپ و ریستارت گوشی!',
    },
    {
      icon: Palette,
      title: '۴. پوسته‌های تصویری مناسبتی و شخصی‌سازی اوقات',
      desc: 'در تنظیمات می‌توانید پوسته‌های طرح‌دار (رمضان، یلدا، نوروز، محرم، فاطمیه) را فعال کنید، واحد دما (°C/°F) را تغییر دهید یا اذان عصر و عشاء را در صفحه اول مخفی/ظاهر نمایید.',
    },
    {
      icon: Crown,
      title: '۵. جعبه ابزار VIP، دفترچه قضا و داشبورد تحلیلی BI',
      desc: 'شامل پیگیری ۵ نماز روزانه، شمارنده نماز و روزه قضا، تایمر ۱۵ دقیقه‌ای خلوت معنوی (Khushu Focus) و نقشه حرارتی استمرار ۳۵ روزه.',
    },
  ];

  const node = (
    <div
      className="fixed inset-0 z-[999] overflow-y-auto flex items-stretch sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.86)', backdropFilter: 'blur(8px)' }}
      dir="rtl"
    >
      <div
        className="w-full sm:max-w-lg min-h-[100dvh] sm:min-h-0 sm:rounded-3xl p-5 border-0 sm:border shadow-2xl overflow-y-auto"
        style={{ background: theme.surface, borderColor: theme.border }}
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-2">
            <Sparkles size={20} color={theme.accent} />
            <h2 className="text-base font-black text-app">راهنمای جامع امکانات «همراه معنوی نور»</h2>
          </div>
          <button type="button" onClick={handleClose} className="text-muted p-1">
            <X size={19} />
          </button>
        </div>

        <div className="space-y-2.5 mb-4">
          {steps.map((st, idx) => {
            const IconComp = st.icon;
            return (
              <div key={idx} className="card-flat p-3.5 flex items-start gap-3 border" style={{ borderColor: theme.border }}>
                <div
                  className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: 'color-mix(in srgb, ' + theme.primary + ' 18%, transparent)' }}
                >
                  <IconComp size={18} color={theme.primary} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-app">{st.title}</h3>
                  <p className="text-[11px] text-muted leading-relaxed mt-1">{st.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-center text-muted mb-3">
          طراحی، معماری و توسعه توسط <strong className="text-primary font-black">یاسین (Yasin)</strong>
        </p>

        <button
          type="button"
          onClick={handleClose}
          className="w-full py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5"
          style={{ background: theme.primary, color: theme.bg }}
        >
          <Check size={16} /> متوجه شدم، ورود به برنامه
        </button>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(node, document.body) : node;
}
