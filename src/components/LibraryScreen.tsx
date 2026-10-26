import { useState } from 'react';
import { BookOpen, Clock, Sparkles, BellPlus, Check, ArrowRight, Quote, Plus } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { getAllDhikr, addCustomDhikr, dhikrCategories, type Dhikr } from '@/lib/dhikrLibrary';
import { createReminder } from '@/lib/reminderService';
import { startSession } from '@/lib/tasbihStorage';
import { toFaDigits } from '@/lib/jalali';
import type { Tab } from '@/components/BottomNav';

export function LibraryScreen({ onNavigate }: { onNavigate?: (t: Tab) => void }) {
  const { theme } = useTheme();
  const [items, setItems] = useState<Dhikr[]>(() => getAllDhikr());
  const [selected, setSelected] = useState<Dhikr | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [scheduleStatus, setScheduleStatus] = useState<string | null>(null);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customArabic, setCustomArabic] = useState('');
  const [customTranslation, setCustomTranslation] = useState('');
  const [customSource, setCustomSource] = useState('');
  const [customTimeNote, setCustomTimeNote] = useState('');
  const [customCount, setCustomCount] = useState('14');

  const filtered = filter ? items.filter((d) => d.category === filter) : items;
  const categories = Object.keys(dhikrCategories);

  const handleOpenDhikr = (d: Dhikr) => {
    setSelected(d);
    setReminderTime(d.defaultReminderTime ?? '08:00');
    setScheduleStatus(null);
  };

  const handleStartTasbih = (d: Dhikr) => {
    startSession(d.id, d.count);
    onNavigate?.('tasbih');
  };

  const handleAddToMyPlan = async (d: Dhikr) => {
    setScheduleStatus('در حال ثبت در برنامه روزانه شما...');
    const res = await createReminder({
      title: `برنامه معنوی: ${d.arabic.slice(0, 38)}`,
      body: `${d.translation} (${toFaDigits(d.count)} مرتبه)`,
      time: reminderTime,
      days: [0, 1, 2, 3, 4, 5, 6],
      dhikrId: d.id,
      type: 'recurring',
      notifEnabled: true,
    });
    if (res.schedule.success) {
      setScheduleStatus(`✅ در برنامه روزانه شما برای ساعت ${toFaDigits(reminderTime)} ثبت شد.`);
    } else {
      setScheduleStatus(`⚠️ در لیست برنامه ذخیره شد (${res.schedule.error ?? 'مجوز اعلان را در تنظیمات بررسی کنید'}).`);
    }
  };

  const handleCreateCustomNote = () => {
    if (!customArabic.trim()) return;
    const item = addCustomDhikr({
      arabic: customArabic,
      translation: customTranslation,
      count: Number(customCount) || 1,
      source: customSource,
      recommendedTime: customTimeNote,
    });
    setItems(getAllDhikr());
    setShowAddCustom(false);
    setCustomArabic('');
    setCustomTranslation('');
    setCustomSource('');
    setCustomTimeNote('');
    setSelected(item);
  };

  if (selected) {
    return (
      <div className="px-5 pt-6 pb-28 animate-fade-in" dir="rtl">
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="flex items-center gap-1.5 text-muted text-sm font-medium mb-4"
        >
          <ArrowRight size={16} />
          <span>بازگشت به کتابخانه</span>
        </button>

        <div
          className="rounded-3xl p-6 mb-4 relative overflow-hidden border"
          style={{
            background: `radial-gradient(circle at top right, color-mix(in srgb, ${theme.primary} 16%, transparent), ${theme.surface})`,
            borderColor: `color-mix(in srgb, ${theme.primary} 35%, ${theme.border})`,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-[11px] font-bold px-3 py-1 rounded-full"
              style={{ background: `color-mix(in srgb, ${theme.primary} 15%, transparent)`, color: theme.primary }}
            >
              {dhikrCategories[selected.category] ?? 'ذکر'}
            </span>
            <span className="text-xs font-bold text-primary">
              تعداد مجرب: {toFaDigits(selected.count)} مرتبه
            </span>
          </div>

          <p className="text-app text-2xl font-bold leading-loose text-center my-4">
            {selected.arabic}
          </p>
          <p className="text-app text-sm leading-relaxed text-center font-medium mb-4">
            {selected.translation}
          </p>

          {selected.source && (
            <div className="text-center text-xs text-muted mb-3">
              📚 سند و منبع: <strong className="text-app">{selected.source}</strong>
            </div>
          )}

          {selected.recommendedTime && (
            <div
              className="p-3 rounded-2xl mb-3 flex items-start gap-2.5"
              style={{ background: `color-mix(in srgb, ${theme.accent} 10%, transparent)` }}
            >
              <Clock size={16} color={theme.accent} className="shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <span className="font-bold text-app">بهترین زمان مداومت: </span>
                <span className="text-muted">{selected.recommendedTime}</span>
              </div>
            </div>
          )}

          <div
            className="p-3.5 rounded-2xl mb-3"
            style={{ background: `color-mix(in srgb, ${theme.primary} 8%, transparent)` }}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary mb-1">
              <Sparkles size={14} />
              <span>فضیلت و آثار معنوی</span>
            </div>
            <p className="text-app text-xs leading-relaxed">{selected.virtue}</p>
          </div>

          {selected.hadith && (
            <div className="p-3.5 rounded-2xl border mb-3" style={{ borderColor: theme.border }}>
              <div className="flex items-center gap-1.5 text-xs font-bold mb-1" style={{ color: theme.accent }}>
                <Quote size={14} />
                <span>کلام معصوم (ع)</span>
              </div>
              <p className="text-muted text-xs leading-relaxed">{selected.hadith}</p>
            </div>
          )}

          {selected.scholarNote && (
            <div className="p-3.5 rounded-2xl border" style={{ borderColor: theme.border }}>
              <p className="text-xs font-bold text-primary mb-1">🌿 توصیه علما و بزرگان</p>
              <p className="text-muted text-xs leading-relaxed">{selected.scholarNote}</p>
            </div>
          )}
        </div>

        {/* بخش افزودن مستقیم به برنامه روزانه/هفتگی */}
        <div className="card-flat p-4 mb-4 space-y-3">
          <p className="text-app font-bold text-sm">افزودن به برنامه عبادی روزانه من</p>
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              dir="ltr"
              className="px-3 py-2.5 rounded-xl text-sm text-app border outline-none"
              style={{ borderColor: theme.border, background: theme.bg }}
            />
            <button
              type="button"
              onClick={() => void handleAddToMyPlan(selected)}
              className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              style={{ background: `color-mix(in srgb, ${theme.primary} 16%, transparent)`, color: theme.primary }}
            >
              <BellPlus size={15} />
              <span>ثبت در یادآوری روزانه</span>
            </button>
          </div>
          {scheduleStatus && (
            <p className="text-xs leading-relaxed text-primary">{scheduleStatus}</p>
          )}
        </div>

        <button
          type="button"
          onClick={() => handleStartTasbih(selected)}
          className="w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg"
          style={{ background: theme.primary, color: theme.bg }}
        >
          <Check size={18} />
          <span>شروع شمارش این ذکر در تسبیح ({toFaDigits(selected.count)} بار)</span>
        </button>
      </div>
    );
  }

  return (
    <div className="px-5 pt-6 pb-28 animate-fade-in" dir="rtl">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-app">گنجینه اذکار و ادعیه</h1>
          <p className="text-muted text-xs mt-1">قرآن، مفاتیح‌الجنان، صحیفه سجادیه و توصیه علما</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddCustom((v) => !v)}
          className="px-3 py-2 rounded-2xl text-xs font-bold flex items-center gap-1"
          style={{ background: theme.primary, color: theme.bg }}
        >
          <Plus size={15} />
          <span>ثبت نکته سخنرانی</span>
        </button>
      </div>

      {showAddCustom && (
        <div className="card p-4 my-4 space-y-3 animate-slide-up">
          <h3 className="text-sm font-bold text-app">ثبت ذکر، نذر یا نکته شنیده‌شده در سخنرانی</h3>
          <input
            value={customArabic}
            onChange={(e) => setCustomArabic(e.target.value)}
            placeholder="متن ذکر، آیه یا عمل (مثلاً: سوره واقعه یا صدقه ۱۰ روزه)"
            className="w-full px-3 py-2.5 rounded-xl text-sm text-app border outline-none"
            style={{ borderColor: theme.border, background: theme.bg }}
          />
          <input
            value={customTranslation}
            onChange={(e) => setCustomTranslation(e.target.value)}
            placeholder="ترجمه، نیت یا توضیح (مثلاً: برای سلامتی مادر)"
            className="w-full px-3 py-2.5 rounded-xl text-xs text-app border outline-none"
            style={{ borderColor: theme.border, background: theme.bg }}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={customSource}
              onChange={(e) => setCustomSource(e.target.value)}
              placeholder="گوینده / منبع (مثلاً: استاد عالی)"
              className="px-3 py-2 rounded-xl text-xs text-app border outline-none"
              style={{ borderColor: theme.border, background: theme.bg }}
            />
            <input
              value={customTimeNote}
              onChange={(e) => setCustomTimeNote(e.target.value)}
              placeholder="زمان (مثلاً: بعد نماز صبح)"
              className="px-3 py-2 rounded-xl text-xs text-app border outline-none"
              style={{ borderColor: theme.border, background: theme.bg }}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              value={customCount}
              onChange={(e) => setCustomCount(e.target.value)}
              className="w-24 px-3 py-2 rounded-xl text-xs text-app border outline-none"
              style={{ borderColor: theme.border, background: theme.bg }}
              dir="ltr"
            />
            <button
              type="button"
              onClick={handleCreateCustomNote}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold"
              style={{ background: theme.primary, color: theme.bg }}
            >
              ذخیره در گنجینه من
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2 my-4 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setFilter(null)}
          className="px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap"
          style={{
            background: !filter ? theme.primary : `color-mix(in srgb, ${theme.primary} 10%, transparent)`,
            color: !filter ? theme.bg : theme.textMuted,
          }}
        >
          همه ({toFaDigits(items.length)})
        </button>
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setFilter(c)}
            className="px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap"
            style={{
              background: filter === c ? theme.primary : `color-mix(in srgb, ${theme.primary} 10%, transparent)`,
              color: filter === c ? theme.bg : theme.textMuted,
            }}
          >
            {dhikrCategories[c]}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        {filtered.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => handleOpenDhikr(d)}
            className="w-full card-flat p-4 text-right transition-transform active:scale-[0.99]"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-app font-bold text-base leading-relaxed">{d.arabic}</p>
              <span
                className="text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0"
                style={{ background: `color-mix(in srgb, ${theme.primary} 12%, transparent)`, color: theme.primary }}
              >
                {dhikrCategories[d.category]}
              </span>
            </div>
            <p className="text-muted text-xs leading-relaxed">{d.translation}</p>
            <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5" style={{ borderTop: `1px solid ${theme.border}` }}>
              <div className="flex items-center gap-1.5 text-muted text-[11px]">
                <BookOpen size={12} color={theme.primary} />
                <span>{d.source ?? 'مفاتیح‌الجنان'}</span>
              </div>
              <span className="text-xs font-bold text-primary">
                {toFaDigits(d.count)} مرتبه
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
