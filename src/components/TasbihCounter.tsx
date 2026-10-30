import { useEffect, useMemo, useState } from 'react';
import { RotateCcw, Check, Sparkles, BookOpen, Award } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useTasbih } from '@/hooks/useTasbih';
import { getAllDhikr } from '@/lib/dhikrLibrary';
import { toFaDigits } from '@/lib/jalali';
import type { Tab } from '@/components/BottomNav';

const TARGET_PRESETS = [14, 33, 34, 40, 70, 100];

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
  const [celebrateBanner, setCelebrateBanner] = useState(false);

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
    const nextCount = session.count + 1;
    const willCompleteRound = nextCount >= target;
    increment();
    setTapPulse(true);
    window.setTimeout(() => setTapPulse(false), 75);

    if ('vibrate' in navigator) {
      if (willCompleteRound) {
        navigator.vibrate?.([45, 60, 110]);
      } else if (nextCount === 33 || nextCount === 34 || nextCount === 66 || nextCount === 67) {
        navigator.vibrate?.([35, 50, 80]);
      } else {
        navigator.vibrate?.(10);
      }
    }

    if (willCompleteRound) {
      setCelebrateBanner(true);
      window.setTimeout(() => setCelebrateBanner(false), 3500);
    }
  };

  const handlePresetTarget = (newTarget: number) => {
    start(activeDhikr.id, newTarget);
  };

  const targetVal = session.target > 0 ? session.target : activeDhikr.count;
  const progress = targetVal > 0 ? Math.min(100, (session.count / targetVal) * 100) : 0;
  const circumference = 2 * Math.PI * 116;
  const dashOffset = circumference - (progress / 100) * circumference;

  const getStepHint = () => {
    if (activeDhikr.id === 'farahzad_work_tasbih') {
      if (session.count < 33) return 'مرحله ۱: سُبْحَانَ اللَّهِ (' + toFaDigits(session.count + 1) + ' از ۳۳)';
      if (session.count < 66) return 'مرحله ۲: الْحَمْدُ لِلَّهِ (' + toFaDigits(session.count - 33 + 1) + ' از ۳۳)';
      return 'مرحله ۳: اللَّهُ أَكْبَرُ (' + toFaDigits(session.count - 66 + 1) + ' از ۳۴)';
    }
    return null;
  };
  const stepHint = getStepHint();

  return (
    <div className="w-full max-w-xl mx-auto px-3.5 pt-4 pb-32 animate-fade-in min-h-screen" dir="rtl">
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
                background: 'color-mix(in srgb, ' + theme.primary + ' 14%, transparent)',
                borderColor: 'color-mix(in srgb, ' + theme.primary + ' 35%, ' + theme.border + ')',
                color: theme.primary,
              }}
            >
              <BookOpen size={15} />
              <span>تغییر ذکر از کتابخانه</span>
            </button>
          )}
        </header>

        {celebrateBanner && (
          <div
            className="mb-3 p-3.5 rounded-2xl border flex items-center justify-between gap-2 animate-fade-in shadow-lg"
            style={{
              background: 'color-mix(in srgb, ' + theme.primary + ' 20%, ' + theme.surface + ')',
              borderColor: theme.primary,
            }}
          >
            <div className="flex items-center gap-2">
              <Award size={20} color={theme.primary} />
              <span className="text-xs font-black text-app">
                تَقَبَّلَ اللَّهُ ✨ دور {toFaDigits(session.completed)} کامل شد!
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCelebrateBanner(false)}
              className="text-[11px] font-bold text-primary"
            >
              الهی آمین
            </button>
          </div>
        )}

        <section
          className="rounded-3xl p-5 text-center overflow-hidden relative border"
          style={{
            background: 'radial-gradient(circle at 50% 0%, color-mix(in srgb, ' + theme.primary + ' 16%, transparent), ' + theme.surface + ')',
            borderColor: 'color-mix(in srgb, ' + theme.primary + ' 28%, ' + theme.border + ')',
            boxShadow: '0 14px 36px color-mix(in srgb, ' + theme.primary + ' 12%, transparent)',
          }}
        >
          <p className="text-app text-xl font-bold leading-relaxed mt-1">{activeDhikr.arabic}</p>
          <p className="text-muted text-xs mt-1.5 leading-relaxed">{activeDhikr.translation}</p>

          {stepHint && (
            <div
              className="mt-2.5 inline-block px-3.5 py-1 rounded-xl text-xs font-black"
              style={{ background: 'color-mix(in srgb, ' + theme.accent + ' 20%, transparent)', color: theme.accent }}
            >
              {stepHint}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3">
            {TARGET_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handlePresetTarget(preset)}
                className="px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all"
                style={{
                  background: targetVal === preset ? theme.primary : 'color-mix(in srgb, ' + theme.primary + ' 10%, transparent)',
                  color: targetVal === preset ? theme.bg : theme.textMuted,
                }}
              >
                هدف {toFaDigits(preset)}
              </button>
            ))}
          </div>

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
                onClick={executeTap}
                aria-label="افزودن یک شمارش ذکر"
                className={'relative rounded-full flex flex-col items-center justify-center select-none transition-transform duration-75 ' + (tapPulse ? 'scale-[0.94]' : '')}
                style={{
                  width: 'min(61vw, 232px)',
                  height: 'min(61vw, 232px)',
                  background: 'radial-gradient(circle at 35% 25%, color-mix(in srgb, ' + theme.primary + ' 28%, ' + theme.surface + '), ' + theme.bg + ')',
                  border: '2px solid color-mix(in srgb, ' + theme.primary + ' 60%, transparent)',
                  boxShadow: 'inset 0 4px 24px color-mix(in srgb, ' + theme.primary + ' 18%, transparent), 0 10px 30px color-mix(in srgb, ' + theme.primary + ' 16%, transparent)',
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
                  style={{ background: 'color-mix(in srgb, ' + theme.primary + ' 16%, transparent)', color: theme.primary }}
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
            style={{ background: 'color-mix(in srgb, ' + theme.primary + ' 12%, transparent)' }}
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
            style={{ background: 'color-mix(in srgb, ' + theme.primary + ' 12%, transparent)', color: theme.primary }}
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
