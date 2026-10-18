import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { dhikrLibrary, dhikrCategories, type Dhikr } from '@/lib/dhikrLibrary';
import { toFaDigits } from '@/lib/jalali';
import type { Tab } from '@/components/BottomNav';

export function LibraryScreen({ onNavigate }: { onNavigate?: (t: Tab) => void }) {
  const { theme } = useTheme();
  const [selected, setSelected] = useState<Dhikr | null>(null);
  const [filter, setFilter] = useState<string | null>(null);

  const filtered = filter
    ? dhikrLibrary.filter((d) => d.category === filter)
    : dhikrLibrary;

  const categories = Object.keys(dhikrCategories);

  if (selected) {
    return (
      <div className="px-5 pt-6 pb-28 animate-fade-in">
        <button onClick={() => setSelected(null)} className="text-muted text-sm mb-5">بازگشت</button>
        <div className="card p-6 mb-4 text-center">
          <p className="text-app text-3xl font-bold mb-3" dir="rtl">{selected.arabic}</p>
          <p className="text-muted text-sm mb-1">{selected.translit}</p>
          <p className="text-app text-sm mb-4">{selected.translation}</p>
          <div className="pt-4" style={{ borderTop: `1px solid ${theme.border}` }}>
            <p className="text-muted text-xs mb-2">فضیلت</p>
            <p className="text-app text-sm leading-relaxed">{selected.virtue}</p>
          </div>
        </div>
        <div className="card-flat p-4 flex items-center justify-between mb-4">
          <span className="text-muted text-sm">تعداد توصیه‌شده</span>
          <span className="text-primary font-bold text-lg">{toFaDigits(selected.count)}</span>
        </div>
        {onNavigate && (
          <button
            onClick={() => onNavigate('tasbih')}
            className="w-full py-3.5 rounded-2xl text-sm font-bold"
            style={{ background: theme.primary, color: theme.bg }}
          >
            شروع شمارش این ذکر
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="px-5 pt-6 pb-28 animate-fade-in">
      <h1 className="text-2xl font-bold text-app mb-2">کتابخانه ذکر</h1>
      <p className="text-muted text-xs mb-4">اذکار و دعاهای روزانه</p>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <button
          onClick={() => setFilter(null)}
          className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap"
          style={{
            background: !filter ? theme.primary : `color-mix(in srgb, ${theme.primary} 8%, transparent)`,
            color: !filter ? theme.bg : theme.textMuted,
          }}
        >
          همه
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap"
            style={{
              background: filter === c ? theme.primary : `color-mix(in srgb, ${theme.primary} 8%, transparent)`,
              color: filter === c ? theme.bg : theme.textMuted,
            }}
          >
            {dhikrCategories[c]}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((d) => (
          <button
            key={d.id}
            onClick={() => setSelected(d)}
            className="w-full card-flat p-4 text-right"
          >
            <div className="flex items-start justify-between mb-2">
              <p className="text-app font-bold text-base" dir="rtl">{d.arabic}</p>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: `color-mix(in srgb, ${theme.primary} 10%, transparent)`, color: theme.primary }}
              >
                {dhikrCategories[d.category]}
              </span>
            </div>
            <p className="text-muted text-xs">{d.translit}</p>
            <p className="text-app text-xs mt-1">{d.translation}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <BookOpen size={12} color={theme.textMuted} />
              <span className="text-muted text-xs">{toFaDigits(d.count)} بار</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
