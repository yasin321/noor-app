import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Sparkles, Calendar, BookOpen, Check, ArrowLeft, X, Volume2 } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export const TUTORIAL_SEEN_KEY = 'noor_tutorial_seen_v1';

interface Props {
  onClose: () => void;
}

const SLIDES = [
  {
    icon: Bell,
    title: '۱. اذان خودکار و روشن شدن صفحه قفل',
    desc: 'در صفحهٔ اول، کنار ساعت هر نماز روی آیکون زنگوله (🔔) بزنید تا حتی وقتی گوشی قفل است، صفحه روشن شده و اذان پخش شود.',
  },
  {
    icon: Calendar,
    title: '۲. تقویم سه‌گانه و تبدیل تاریخ',
    desc: 'در بالای صفحهٔ اول روی تاریخ امروز بزنید تا تقویم شمسی، قمری و میلادی، اعمال مخصوص هر روز هفته و «مبدل تاریخ» برایتان باز شود.',
  },
  {
    icon: Sparkles,
    title: '۳. مدیریت برنامه امروز، چله، چک و تولد',
    desc: 'در بخش یادآوری‌ها می‌توانید چلهٔ ۴۰ روزه، فاتحهٔ والدین، سررسید چک/قسط و تولد عزیزان را ثبت کنید و هر روز با زدن تیک (✓) کارنامهٔ خود را کامل کنید.',
  },
  {
    icon: Volume2,
    title: '۴. دانلود اذان‌های ایرانی و انتخاب فونت',
    desc: 'در بخش تنظیمات می‌توانید اذان مؤذن‌زاده اردبیلی، آقاتی، صبحدل و ماهور را دانلود و انتخاب کنید و فونت دلخواه خود را تنظیم نمایید.',
  },
  {
    icon: BookOpen,
    title: '۵. ذکرشمار فوری متصل به گنجینه اذکار',
    desc: 'در بخش ذکرها، توصیهٔ علما و سوره‌ها را همراه با سند ببینید و مستقیم وارد حلقهٔ ذکرشمار بدون تاخیر شوید.',
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

  const node = (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-5 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.76)', backdropFilter: 'blur(5px)' }}
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

  return typeof document !== 'undefined' ? createPortal(node, document.body) : node;
}
