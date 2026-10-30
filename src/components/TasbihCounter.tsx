import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { RotateCcw, Check, Sparkles, BookOpen, Award } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useTasbih } from '@/hooks/useTasbih';
import { getAllDhikr } from '@/lib/dhikrLibrary';
import { toFaDigits } from '@/lib/jalali';
import type { Tab } from '@/components/BottomNav';

const TARGET_PRESETS = [14, 33, 34, 100];


function triggerSmartTasbihHaptic(nextCount: number, reachedTarget: boolean) {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  try {
    if (reachedTarget || nextCount === 100) {
      // پایان دور کامل: سه پالس نورانی
      navigator.vibrate([55, 65, 55, 65, 130]);
    } else if (nextCount === 34 || nextCount === 67) {
      // مرز ۳۴ (الله اکبر) و ۶۷ (الحمدلله) در تسبیحات حضرت زهرا (س): دو پالس مشخص برای استفاده با چشم بسته
      navigator.vibrate([45, 55, 95]);
    } else {
      // تک‌ضربه نرم برای هر دانه تسبیح
      navigator.vibrate(14);
    }
  } catch {
    // ignore on unsupported browsers
  }
}

export function TasbihCounter({ onNavigate }: { onNavigate?: (t: Tab) => void }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { session, start, increment, reset } = useTasbih(user?.id ?? null);
  const dhikrItems = useMemo(() => getAllDhikr(), []);
  const activeDhikr = useMemo(
    () => dhikrItems.find((d) => d.id === session.dhikrId) ?? dhikrItems[0],
    [session.dhikrId, dhikrItems]
  );

  const [tapPulse, setTapPulse] = useState(false);
  const [celebrateModal, setCelebrateModal] = useState(false);
  const lastPointerTapRef = useRef<number>(0);

  // اطمینان از اینکه همیشه یک ذکر فعال روی حلقه وجود دارد (بدون نمایش صفحه انتخابگر)
  useEffect(() => {
    if (!session.dhikrId && activeDhikr) {
      start(activeDhikr.id, activeDhikr.count);
    }
  }, [session.dhikrId, activeDhikr, start]);

  const executeTap = () => {
    if (!session.dhikrId && activeDhikr) {
      start(activeDhikr.id, activeDhikr.count);
    }
    const target = session.target > 0 ? session.target : activeDhikr.count;
    const willCompleteRound = session.count + 1 >= target;
    increment();
    setTapPulse(true);
    window.setTimeout(() => setTapPulse(false), 75);

    if ('vibrate' in navigator) {
      navigator.vibrate?.(willCompleteRound ? [40, 60, 90] : 8);
    }

    if (willCompleteRound) {
      setCelebrateModal(true);
    }
  };

  const handlePointerDown = () => {
    lastPointerTapRef.current = Date.now();
    executeTap();
  };

  const handleFallbackClick = () => {
    if (Date.now() - lastPointerTapRef.current < 350) return;
    executeTap();
  };

  const handlePresetTarget = (newTarget: number) => {
    start(activeDhikr.id, newTarget);
  };

  const targetVal = session.target > 0 ? session.target : activeDhikr.count;
  const progress = targetVal > 0 ? Math.min(100, (session.count / targetVal) * 100) : 0;
  const circumference = 2 * Math.PI * 116;
  const dashOffset = circumference - (progress / 100) * circumference;

  const celebrationOverlay = celebrateModal ? (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-5 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(5px)' }}
      dir="rtl"
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6 text-center border shadow-2xl"
        style={{ background: theme.surface, borderColor: theme.primary }}
      >
        <div
          className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center"
          style={{ background: `color-mix(in srgb, ${theme.primary} 18%, transparent)` }}
        >
          <Award size={34} color={theme.primary} />
        </div>
        <h3 className="text-xl font-black text-primary mb-1">تَقَبَّلَ اللَّهُ ✨</h3>
        <p className="text-app font-bold text-sm mb-2">
          دور {toFaDigits(session.completed)} از ذکر «{activeDhikr.arabic}» کامل شد!
        </p>
        <p className="text-muted text-xs leading-relaxed mb-5">
          خداوند این ذکر نورانی را ذخیرهٔ آرامش دل، برکت زندگی و عاقبت‌به‌خیری شما و عزیزانتان قرار دهد.
        </p>
        <button
          type="button"
          onClick={() => setCelebrateModal(false)}
          className="w-full py-3.5 rounded-2xl text-sm font-bold"
          style={{ background: theme.primary, color: theme.bg }}
        >
          الهی آمین — ادامه ذکر
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div className="w-full max-w-xl mx-auto px-3.5 pt-4 pb-32 animate-fade-in min-h-screen" dir="rtl">
      {celebrationOverlay && typeof document !== 'undefined'
        ? createPortal(celebrationOverlay, document.body)
        : celebrationOverlay}

      <div className="max-w-md mx-auto">
        <header className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-medium mb-0.5" style={{ color: theme.accent }}>تسبیح و ذکرشمار نورانی</p>
            <h1 className="text-2xl font-black text-app">ذکرشمار</h1>
          </div>
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('library')}
              className="px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 border shadow-sm"
              style={{
                background: `color-mix(in srgb, ${theme.primary} 14%, transparent)`,
                borderColor: `color-mix(in srgb, ${theme.primary} 35%, ${theme.border})`,
                color: theme.primary,
              }}
            >
              <BookOpen size={15} />
              <span>تغییر ذکر از کتابخانه</span>
            </button>
          )}
        </header>

        {/* کارت ذکر فعال بالای حلقه */}
        <section
          className="rounded-3xl p-5 text-center overflow-hidden relative border"
          style={{
            background: `radial-gradient(circle at 50% 0%, color-mix(in srgb, ${theme.primary} 16%, transparent), ${theme.surface})`,
            borderColor: `color-mix(in srgb, ${theme.primary} 28%, ${theme.border})`,
            boxShadow: `0 14px 36px color-mix(in srgb, ${theme.primary} 12%, transparent)`,
          }}
        >
          <p className="text-app text-2xl font-bold leading-relaxed mt-1">{activeDhikr.arabic}</p>
          <p className="text-muted text-xs mt-1.5 leading-relaxed">{activeDhikr.translation}</p>

          {/* انتخاب سریع تعداد هدف دور */}
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {TARGET_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handlePresetTarget(preset)}
                className="px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all"
                style={{
                  background: targetVal === preset ? theme.primary : `color-mix(in srgb, ${theme.primary} 10%, transparent)`,
                  color: targetVal === preset ? theme.bg : theme.textMuted,
                }}
              >
                هدف {toFaDigits(preset)}
              </button>
            ))}
          </div>

          {/* حلقه Figma-Grade تسبیح با افکت نوری و لمس آنی */}
          <div className="flex justify-center my-5">
            <div className="relative flex items-center justify-center" style={{ width: 'min(74vw, 284px)', height: 'min(74vw, 284px)' }}>
              <svg className="absolute inset-0 -rotate-90" width="100%" height="100%" viewBox="0 0 272 272" aria-hidden="true">
                <circle cx="136" cy="136" r="116" fill="none" stroke={theme.border} strokeWidth="10" opacity="0.45" />
                <circle
                  cx="136"
                  cy="136"
                  r="116"
                  fill="none"
                  stroke={theme.primary}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  style={{ transition: 'stroke-dashoffset 60ms linear' }}
                />
              </svg>
              <button
                type="button"
                onPointerDown={handlePointerDown}
                onClick={handleFallbackClick}
                aria-label="افزودن یک شمارش ذکر"
                className={`relative rounded-full flex flex-col items-center justify-center select-none transition-transform duration-75 ${tapPulse ? 'scale-[0.94]' : ''}`}
                style={{
                  width: 'min(61vw, 232px)',
                  height: 'min(61vw, 232px)',
                  background: `radial-gradient(circle at 35% 25%, color-mix(in srgb, ${theme.primary} 28%, ${theme.surface}), ${theme.bg})`,
                  border: `2px solid color-mix(in srgb, ${theme.primary} 60%, transparent)`,
                  boxShadow: `inset 0 4px 24px color-mix(in srgb, ${theme.primary} 18%, transparent), 0 10px 30px color-mix(in srgb, ${theme.primary} 16%, transparent)`,
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span
                  className="text-5xl font-black tracking-tight text-primary tabular-nums"
                  style={{ fontFamily: 'system-ui, sans-serif' }}
                >
                  {session.count === 0 ? '۰ (شروع)' : toFaDigits(session.count)}
                </span>
                <span className="text-muted text-xs mt-2">
                  از {toFaDigits(targetVal)} مرتبه
                </span>
                <span
                  className="mt-3 px-3 py-1 rounded-full text-[11px] font-bold"
                  style={{ background: `color-mix(in srgb, ${theme.primary} 16%, transparent)`, color: theme.primary }}
                >
                  برای شمارش لمس کن ✨
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-muted">
            <Sparkles size={14} color={theme.accent} />
            <span>{toFaDigits(Math.round(progress))}٪ از این دور انجام شده است</span>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 mt-4">
          <div className="card-flat p-4 text-center">
            <p className="text-2xl font-black text-primary tabular-nums">{toFaDigits(session.completed)}</p>
            <p className="text-muted text-xs mt-1">دور کامل‌شده 🌸</p>
          </div>
          <div className="card-flat p-4 text-center">
            <p className="text-2xl font-black text-accent tabular-nums">{toFaDigits(session.count)}</p>
            <p className="text-muted text-xs mt-1">شمارش فعلی</p>
          </div>
        </section>

        {session.completed > 0 && (
          <div
            className="mt-3 p-3 rounded-2xl flex items-center justify-center gap-2 animate-slide-up"
            style={{ background: `color-mix(in srgb, ${theme.primary} 12%, transparent)` }}
          >
            <Check size={17} color={theme.primary} />
            <p className="text-xs font-bold text-primary">
              تَقَبَّلَ اللَّهُ — {toFaDigits(session.completed)} دور کامل ثبت شد!
            </p>
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={reset}
            className="flex-1 py-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2"
            style={{ background: `color-mix(in srgb, ${theme.primary} 12%, transparent)`, color: theme.primary }}
          >
            <RotateCcw size={16} /> صفر کردن این دور
          </button>
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('library')}
              className="flex-1 py-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2"
              style={{ background: theme.primary, color: theme.bg }}
            >
              <BookOpen size={16} /> گنجینه ذکرها
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
