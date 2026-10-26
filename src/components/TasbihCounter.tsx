import { useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw, Check, Sparkles, Heart, ListRestart, Award } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useTasbih } from '@/hooks/useTasbih';
import { getAllDhikr, addCustomDhikr } from '@/lib/dhikrLibrary';
import { toFaDigits } from '@/lib/jalali';

export function TasbihCounter() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { session, start, increment, reset } = useTasbih(user?.id ?? null);
  const dhikrItems = useMemo(() => getAllDhikr(), []);
  const initialDhikr = dhikrItems.find((d) => d.id === session.dhikrId) ?? dhikrItems[0];
  const [showPicker, setShowPicker] = useState(!session.dhikrId);
  const [selectedDhikr, setSelectedDhikr] = useState(initialDhikr);
  const [tapPulse, setTapPulse] = useState(false);
  const [celebrateModal, setCelebrateModal] = useState(false);
  const [showAddDhikr, setShowAddDhikr] = useState(false);
  const [customArabic, setCustomArabic] = useState('');
  const [customTranslation, setCustomTranslation] = useState('');
  const [customCount, setCustomCount] = useState('33');
  const [customError, setCustomError] = useState<string | null>(null);
  const lastPointerTapRef = useRef<number>(0);

  useEffect(() => {
    const current = dhikrItems.find((d) => d.id === session.dhikrId);
    if (current) setSelectedDhikr(current);
  }, [session.dhikrId, dhikrItems]);

  const executeTap = () => {
    if (!session.dhikrId) {
      start(selectedDhikr.id, selectedDhikr.count);
      setShowPicker(false);
    }
    const willCompleteRound = session.count + 1 >= session.target;
    increment();
    setTapPulse(true);
    window.setTimeout(() => setTapPulse(false), 90);

    if ('vibrate' in navigator) {
      navigator.vibrate?.(willCompleteRound ? [40, 60, 90] : 10);
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
    // جلوگیری از دوبار شمردن اگر رویداد PointerDown قبلا اجرا شده باشد (و حفظ سازگاری با تست‌ها و کیبورد)
    if (Date.now() - lastPointerTapRef.current < 350) return;
    executeTap();
  };

  const handleSelectDhikr = (dhikrId: string) => {
    const d = dhikrItems.find((item) => item.id === dhikrId);
    if (!d) return;
    setSelectedDhikr(d);
    start(d.id, d.count);
    setShowPicker(false);
  };

  const progress = session.target > 0 ? Math.min(100, (session.count / session.target) * 100) : 0;
  const circumference = 2 * Math.PI * 118;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="px-5 pt-5 pb-32 animate-fade-in min-h-screen" dir="rtl">
      {celebrateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-5 animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
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
              دور {toFaDigits(session.completed)} از ذکر «{selectedDhikr.arabic}» کامل شد!
            </p>
            <p className="text-muted text-xs leading-relaxed mb-5">
              خداوند این ذکر و یاد نورانی را ذخیرهٔ آرامش دل و عاقبت‌به‌خیری شما و عزیزانتان قرار دهد.
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
      )}

      <div className="max-w-md mx-auto">
        <header className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs font-medium mb-1" style={{ color: theme.accent }}>بدون تاخیر و با آرامش قلب</p>
            <h1 className="text-2xl font-black text-app">ذکرشمار <span aria-hidden="true">♡</span></h1>
          </div>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `color-mix(in srgb, ${theme.primary} 14%, transparent)`, border: `1px solid ${theme.border}` }}>
            <Sparkles size={23} color={theme.primary} />
          </div>
        </header>

        {showPicker ? (
          <section className="card p-4">
            <div className="text-center py-3 mb-3">
              <div className="text-4xl mb-3" aria-hidden="true">🌷</div>
              <h2 className="text-lg font-bold text-app">ذکر دلت رو انتخاب کن</h2>
              <p className="text-muted text-sm mt-1">هر بار لمس، یک قدم به آرامش نزدیک‌تر</p>
            </div>
            <div className="space-y-2">
              {dhikrItems.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => handleSelectDhikr(d.id)}
                  className="w-full card-flat p-4 text-right active:scale-[0.99] transition-transform"
                  style={{ borderColor: selectedDhikr.id === d.id ? theme.primary : theme.border }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-app font-bold text-lg leading-relaxed">{d.arabic}</p>
                      <p className="text-muted text-xs mt-1">{d.translation}</p>
                    </div>
                    <div className="shrink-0 rounded-2xl px-3 py-2 text-xs font-bold" style={{ background: `color-mix(in srgb, ${theme.primary} 12%, transparent)`, color: theme.primary }}>
                      {toFaDigits(d.count)} بار
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => { setShowAddDhikr((v) => !v); setCustomError(null); }}
              className="w-full mt-3 py-3 rounded-2xl text-sm font-bold"
              style={{ background: `color-mix(in srgb, ${theme.primary} 12%, transparent)`, color: theme.primary }}
            >
              {showAddDhikr ? 'بستن فرم ذکر جدید' : '+ افزودن ذکر دلخواه'}
            </button>
            {showAddDhikr && (
              <div className="card-flat p-4 mt-3 space-y-3">
                <label className="block text-xs text-muted">متن ذکر</label>
                <textarea value={customArabic} onChange={(e) => setCustomArabic(e.target.value)} placeholder="متن ذکر را بنویس..." className="w-full px-3 py-3 rounded-xl text-app text-base border outline-none" style={{ borderColor: theme.border, background: theme.bg }} rows={2} />
                <label className="block text-xs text-muted">ترجمه یا توضیح (اختیاری)</label>
                <input value={customTranslation} onChange={(e) => setCustomTranslation(e.target.value)} placeholder="معنی ذکر" className="w-full px-3 py-3 rounded-xl text-app text-sm border outline-none" style={{ borderColor: theme.border, background: theme.bg }} />
                <label className="block text-xs text-muted">تعداد هدف</label>
                <input type="number" min="1" max="100000" value={customCount} onChange={(e) => setCustomCount(e.target.value)} className="w-full px-3 py-3 rounded-xl text-app text-sm border outline-none" style={{ borderColor: theme.border, background: theme.bg }} dir="ltr" />
                {customError && <p className="text-xs" style={{ color: '#fca5a5' }}>{customError}</p>}
                <button
                  type="button"
                  onClick={() => {
                    const count = Number(customCount);
                    if (!customArabic.trim()) { setCustomError('متن ذکر را وارد کن.'); return; }
                    if (!Number.isInteger(count) || count < 1 || count > 100000) { setCustomError('تعداد باید عددی بین ۱ تا ۱۰۰۰۰۰ باشد.'); return; }
                    try {
                      const item = addCustomDhikr({ arabic: customArabic, translation: customTranslation, count });
                      setSelectedDhikr(item);
                      start(item.id, item.count);
                      setShowPicker(false);
                      setShowAddDhikr(false);
                      setCustomArabic('');
                      setCustomTranslation('');
                      setCustomCount('33');
                      setCustomError(null);
                    } catch (e) { setCustomError(e instanceof Error ? e.message : 'ذکر ذخیره نشد.'); }
                  }}
                  className="w-full py-3 rounded-xl text-sm font-bold"
                  style={{ background: theme.primary, color: theme.bg }}
                >
                  ذخیره و شروع ذکر
                </button>
              </div>
            )}
          </section>
        ) : (
          <>
            <section className="card p-5 text-center overflow-hidden relative" style={{ boxShadow: `0 10px 34px color-mix(in srgb, ${theme.primary} 12%, transparent)` }}>
              <div className="absolute top-3 left-4 opacity-40" aria-hidden="true"><Heart size={17} color={theme.primary} /></div>
              <p className="text-app text-xl font-bold leading-relaxed mt-2">{selectedDhikr.arabic}</p>
              <p className="text-muted text-xs mt-1.5">{selectedDhikr.translation}</p>

              <div className="flex justify-center my-6">
                <div className="relative flex items-center justify-center" style={{ width: 'min(76vw, 292px)', height: 'min(76vw, 292px)' }}>
                  <svg className="absolute inset-0 -rotate-90" width="100%" height="100%" viewBox="0 0 280 280" aria-hidden="true">
                    <circle cx="140" cy="140" r="118" fill="none" stroke={theme.border} strokeWidth="9" />
                    <circle cx="140" cy="140" r="118" fill="none" stroke={theme.primary} strokeWidth="9" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset} style={{ transition: 'stroke-dashoffset 80ms linear' }} />
                  </svg>
                  <button
                    type="button"
                    onPointerDown={handlePointerDown}
                    onClick={handleFallbackClick}
                    aria-label="افزودن یک شمارش ذکر"
                    className={`relative rounded-full flex flex-col items-center justify-center select-none transition-transform duration-75 ${tapPulse ? 'scale-[0.95]' : ''}`}
                    style={{
                      width: 'min(63vw, 238px)', height: 'min(63vw, 238px)',
                      background: `radial-gradient(circle at 30% 20%, color-mix(in srgb, ${theme.primary} 22%, ${theme.surface}), ${theme.surface})`,
                      border: `2px solid color-mix(in srgb, ${theme.primary} 55%, transparent)`,
                      boxShadow: `inset 0 2px 18px color-mix(in srgb, ${theme.primary} 9%, transparent), 0 8px 24px color-mix(in srgb, ${theme.primary} 12%, transparent)`,
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <span className="text-6xl font-black tracking-tight text-primary tabular-nums">{toFaDigits(session.count)}</span>
                    <span className="text-muted text-sm mt-2">از {toFaDigits(session.target)}</span>
                    <span className="text-xs font-bold mt-3" style={{ color: theme.primary }}>لمس فوری ♡</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-muted">
                <Sparkles size={14} color={theme.accent} />
                <span>{toFaDigits(Math.round(progress))}٪ از این دور انجام شد</span>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3 mt-4">
              <div className="card-flat p-4 text-center">
                <p className="text-2xl font-black text-primary tabular-nums">{toFaDigits(session.completed)}</p>
                <p className="text-muted text-xs mt-1">دور کامل 🌸</p>
              </div>
              <div className="card-flat p-4 text-center">
                <p className="text-2xl font-black text-accent tabular-nums">{toFaDigits(session.count)}</p>
                <p className="text-muted text-xs mt-1">ذکرهای این دور</p>
              </div>
            </section>

            {session.completed > 0 && (
              <div className="mt-4 p-3 rounded-2xl flex items-center justify-center gap-2 animate-slide-up" style={{ background: `color-mix(in srgb, ${theme.primary} 12%, transparent)` }}>
                <Check size={17} color={theme.primary} />
                <p className="text-sm font-bold text-primary">آفرین، {toFaDigits(session.completed)} دور کامل شد!</p>
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <button type="button" onClick={reset} className="flex-1 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2" style={{ background: `color-mix(in srgb, ${theme.primary} 10%, transparent)`, color: theme.primary }}>
                <RotateCcw size={17} /> شروع دور از صفر
              </button>
              <button type="button" onClick={() => setShowPicker(true)} className="flex-1 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2" style={{ background: `color-mix(in srgb, ${theme.accent} 10%, transparent)`, color: theme.accent }}>
                <ListRestart size={17} /> انتخاب ذکر
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
