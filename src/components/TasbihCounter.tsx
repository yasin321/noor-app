import { useState } from 'react';
import { RotateCcw, Check, X } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useTasbih } from '@/hooks/useTasbih';
import { dhikrLibrary } from '@/lib/dhikrLibrary';
import { toFaDigits } from '@/lib/jalali';

export function TasbihCounter() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { session, start, increment, reset, clear } = useTasbih(user?.id ?? null);
  const [showPicker, setShowPicker] = useState(!session.dhikrId);
  const [selectedDhikr, setSelectedDhikr] = useState(
    dhikrLibrary.find((d) => d.id === session.dhikrId) ?? dhikrLibrary[0]
  );

  const handleTap = () => {
    if (!session.dhikrId) {
      start(selectedDhikr.id, selectedDhikr.count);
      setShowPicker(false);
      return;
    }
    increment();
  };

  const handleSelectDhikr = (dhikrId: string) => {
    const d = dhikrLibrary.find((d) => d.id === dhikrId);
    if (!d) return;
    setSelectedDhikr(d);
    start(d.id, d.count);
    setShowPicker(false);
  };

  const progress = session.target > 0 ? (session.count / session.target) * 100 : 0;
  const circumference = 2 * Math.PI * 130;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="px-5 pt-6 pb-28 animate-fade-in flex flex-col items-center min-h-screen">
      {showPicker ? (
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-app mb-2">انتخاب ذکر</h1>
          <p className="text-muted text-xs mb-4">یک ذکر برای شمارش انتخاب کنید</p>
          <div className="space-y-2">
            {dhikrLibrary.map((d) => (
              <button
                key={d.id}
                onClick={() => handleSelectDhikr(d.id)}
                className="w-full card-flat p-4 text-right"
              >
                <p className="text-app font-bold text-base mb-1" dir="rtl">{d.arabic}</p>
                <p className="text-muted text-xs">{d.translit} — {d.translation}</p>
                <p className="text-primary text-xs mt-1">هدف: {toFaDigits(d.count)}</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="text-center mb-4">
            <p className="text-app font-bold text-lg" dir="rtl">{selectedDhikr.arabic}</p>
            <p className="text-muted text-sm mt-1">{selectedDhikr.translit}</p>
            <p className="text-muted text-xs mt-0.5">{selectedDhikr.translation}</p>
          </div>

          <div className="relative flex items-center justify-center my-8" style={{ width: 300, height: 300 }}>
            <svg className="absolute inset-0 -rotate-90" width={300} height={300}>
              <circle
                cx={150} cy={150} r={130}
                fill="none"
                stroke={theme.border}
                strokeWidth={6}
              />
              <circle
                cx={150} cy={150} r={130}
                fill="none"
                stroke={theme.primary}
                strokeWidth={6}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 0.3s ease' }}
              />
            </svg>
            <button
              onClick={handleTap}
              className="rounded-full flex flex-col items-center justify-center active:scale-95 transition-transform"
              style={{
                width: 240, height: 240,
                background: `color-mix(in srgb, ${theme.primary} 12%, transparent)`,
                border: `2px solid ${theme.primary}`,
              }}
            >
              <p className="text-6xl font-bold text-primary">{toFaDigits(session.count)}</p>
              <p className="text-muted text-xs mt-2">از {toFaDigits(session.target)}</p>
            </button>
          </div>

          <div className="flex items-center gap-8 mb-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-accent">{toFaDigits(session.completed)}</p>
              <p className="text-muted text-xs mt-1">دور کامل</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={reset}
              className="px-5 py-2.5 rounded-2xl text-sm font-medium flex items-center gap-2"
              style={{ background: `color-mix(in srgb, ${theme.primary} 10%, transparent)`, color: theme.primary }}
            >
              <RotateCcw size={16} /> صفر
            </button>
            <button
              onClick={() => { clear(); setShowPicker(true); }}
              className="px-5 py-2.5 rounded-2xl text-sm font-medium flex items-center gap-2"
              style={{ background: `color-mix(in srgb, ${theme.primary} 10%, transparent)`, color: theme.primary }}
            >
              <X size={16} /> تغییر ذکر
            </button>
          </div>

          {session.completed > 0 && (
            <div
              className="mt-6 px-5 py-3 rounded-2xl flex items-center gap-2 animate-slide-up"
              style={{ background: `color-mix(in srgb, ${theme.primary} 10%, transparent)` }}
            >
              <Check size={18} color={theme.primary} />
              <p className="text-sm text-primary font-medium">
                {toFaDigits(session.completed)} دور کامل شد!
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
