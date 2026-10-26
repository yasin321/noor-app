import { useState } from 'react';
import { Bell, Sparkles, Compass, BookOpen, Check, ArrowLeft, X } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export const TUTORIAL_SEEN_KEY = 'noor_tutorial_seen_v1';

interface Props {
  onClose: () => void;
}

const SLIDES = [
  {
    icon: Bell,
    title: '۱. فعال‌سازی خودکار اذان با یک لمس',
    desc: 'در صفحهٔ اول، کنار ساعت هر نماز یک آیکون زنگوله (🔔) قرار دارد. با لمس آن، حتی وقتی صفحهٔ گوشی قفل است، سر وقت اذان صفحه روشن شده و اذان پخش می‌شود.',
  },
  {
    icon: Sparkles,
    title: '۲. ذکرشمار فوری و بدون تاخیر',
    desc: 'در بخش تسبیح، به محض لمس دایرهٔ وسط، شمارش انجام می‌شود و پس از پایان هر دور، پیام تبریک و دعای خیر نمایش داده می‌شود.',
  },
  {
    icon: BookOpen,
    title: '۳. گنجینهٔ علما و برنامهٔ شخصی',
    desc: 'در کتابخانهٔ اذکار، توصیه‌های آیت‌الله فاطمی‌نیا، آیت‌الله بهجت، سورهٔ واقعه و زیارات را همراه با سند ببینید و با یک دکمه به برنامهٔ یادآوری خود اضافه کنید.',
  },
  {
    icon: Compass,
    title: '۴. درشت‌نمایی نوشته و قبله‌نما',
    desc: 'در بخش تنظیمات می‌توانید اندازهٔ نوشته‌های برنامه را برای مطالعهٔ راحت‌تر درشت کنید و کارنامهٔ ذکرهای خود را ببینید.',
  },
];

export function AppTutorialModal({ onClose }: Props) {
  const { theme } = useTheme();
  const [step, setStep] = useState(0);
  const current = SLIDES[step];
  const Icon = current.icon;

  const handleFinish = () => {
    try {
      localStorage.setItem(TUTORIAL_SEEN_KEY, 'true');
    } catch {
      // ignore
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(5px)' }}
      dir="rtl"
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6 text-center relative border shadow-2xl"
        style={{ background: theme.surface, borderColor: theme.border }}
      >
        <button
          type="button"
          onClick={handleFinish}
          aria-label="بستن راهنما"
          className="absolute top-4 left-4 text-muted"
        >
          <X size={20} />
        </button>

        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: `color-mix(in srgb, ${theme.primary} 16%, transparent)` }}
        >
          <Icon size={32} color={theme.primary} />
        </div>

        <h2 className="text-lg font-bold text-app mb-2">{current.title}</h2>
        <p className="text-muted text-sm leading-relaxed mb-6">{current.desc}</p>

        <div className="flex justify-center gap-1.5 mb-5">
          {SLIDES.map((_, idx) => (
            <span
              key={idx}
              className="h-2 rounded-full transition-all"
              style={{
                width: idx === step ? '24px' : '8px',
                background: idx === step ? theme.primary : theme.border,
              }}
            />
          ))}
        </div>

        <div className="flex gap-2">
          {step < SLIDES.length - 1 ? (
            <>
              <button
                type="button"
                onClick={handleFinish}
                className="px-4 py-3 rounded-2xl text-xs font-medium text-muted"
              >
                رد کردن
              </button>
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="flex-1 py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
                style={{ background: theme.primary, color: theme.bg }}
              >
                <span>بعدی</span>
                <ArrowLeft size={16} />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
              style={{ background: theme.primary, color: theme.bg }}
            >
              <Check size={18} />
              <span>شروع استفاده از نور</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
