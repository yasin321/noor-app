import { createPortal } from 'react-dom';
import { useState, useMemo } from 'react';
import { BookOpen, Clock, Sparkles, BellPlus, Check, ArrowRight, Quote, Plus, Search, X, ScrollText, Star, Compass, HeartHandshake, Heart, Bookmark, Trash2 } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import {
  getAllDhikr,
  addCustomDhikr,
  dhikrCategories,
  getFavoriteDhikrIds,
  toggleFavoriteDhikr,
  getCustomDhikrCount,
  setCustomDhikrCount,
  type Dhikr,
} from '@/lib/dhikrLibrary';
import { loadQuranContinuity, saveQuranContinuity } from '@/lib/deenIntelligenceStore';
import { createReminder } from '@/lib/reminderService';
import { startSession } from '@/lib/tasbihStorage';
import { toFaDigits } from '@/lib/jalali';
import type { Tab } from '@/components/BottomNav';

type MacroGroupKey = 'all' | 'favorites' | 'bookmarks' | 'scholars' | 'quran' | 'mafatih' | 'daily';

const MACRO_GROUPS: Array<{
  key: MacroGroupKey;
  title: string;
  subtitle: string;
  icon: typeof Sparkles;
  match: (cat: string) => boolean;
}> = [
  {
    key: 'scholars',
    title: 'توصیه علما و بزرگان',
    subtitle: 'آیت‌الله فاطمی‌نیا، بهجت و بزرگان',
    icon: Star,
    match: (c) => c === 'scholars',
  },
  {
    key: 'quran',
    title: 'سوره‌ها و آیات مجرب',
    subtitle: 'واقعه، ذاریات و آیات گره‌گشا',
    icon: BookOpen,
    match: (c) => c === 'quran',
  },
  {
    key: 'mafatih',
    title: 'مفاتیح و زیارات',
    subtitle: 'امام زمان (عج)، امام رضا (ع) و والدین',
    icon: Compass,
    match: (c) => c === 'mafatih' || c === 'salawat',
  },
  {
    key: 'daily',
    title: 'تعقیبات و اذکار روزانه',
    subtitle: 'تسبیحات، استغفار و توکل',
    icon: HeartHandshake,
    match: (c) => c === 'tasbih' || c === 'tahlil' || c === 'takbir' || c === 'istighfar',
  },
];

export function LibraryScreen({ onNavigate }: { onNavigate?: (t: Tab) => void }) {
  const { theme } = useTheme();
  const [items, setItems] = useState<Dhikr[]>(() => getAllDhikr());
  const [selected, setSelected] = useState<Dhikr | null>(null);
  const [activeGroup, setActiveGroup] = useState<MacroGroupKey>('all');
  const [favIds, setFavIds] = useState<string[]>(() => getFavoriteDhikrIds());
  const [qState, setQState] = useState(() => loadQuranContinuity());
  const [userTargetCount, setUserTargetCount] = useState<number>(33);
  const [searchQuery, setSearchQuery] = useState('');
  const [reminderTime, setReminderTime] = useState('08:00');
  const [scheduleStatus, setScheduleStatus] = useState<string | null>(null);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customArabic, setCustomArabic] = useState('');
  const [customTranslation, setCustomTranslation] = useState('');
  const [customSource, setCustomSource] = useState('');
  const [customTimeNote, setCustomTimeNote] = useState('');
  const [customCount, setCustomCount] = useState('14');

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((d) => {
      if (activeGroup === 'favorites') {
        if (!favIds.includes(d.id)) return false;
      } else if (activeGroup !== 'all' && activeGroup !== 'bookmarks') {
        const grp = MACRO_GROUPS.find((g) => g.key === activeGroup);
        if (grp && !grp.match(d.category)) return false;
      }
      if (!q) return true;
      return (
        d.arabic.toLowerCase().includes(q) ||
        d.translation.toLowerCase().includes(q) ||
        (d.source ?? '').toLowerCase().includes(q) ||
        (d.recommendedTime ?? '').toLowerCase().includes(q) ||
        (d.scholarNote ?? '').toLowerCase().includes(q)
      );
    });
  }, [items, activeGroup, searchQuery, favIds]);

  const handleOpenDhikr = (d: Dhikr) => {
    setSelected(d);
    setUserTargetCount(getCustomDhikrCount(d.id, d.count));
    setReminderTime(d.defaultReminderTime ?? '08:00');
    setScheduleStatus(null);
  };

  const handleStartTasbih = (d: Dhikr) => {
    const finalCount = userTargetCount > 0 ? userTargetCount : d.count;
    setCustomDhikrCount(d.id, finalCount);
    startSession(d.id, finalCount);
    onNavigate?.('tasbih');
  };

  const handleAddToMyPlan = async (d: Dhikr) => {
    setScheduleStatus('در حال ثبت در برنامه روزانه شما...');
    const res = await createReminder({
      title: 'برنامه معنوی: ' + d.arabic.slice(0, 38),
      body: d.translation + ' (' + toFaDigits(userTargetCount || d.count) + ' مرتبه)',
      time: reminderTime,
      days: [0, 1, 2, 3, 4, 5, 6],
      dhikrId: d.id,
      type: 'recurring',
      notifEnabled: true,
    });
    if (res.schedule.success) {
      setScheduleStatus('✅ در برنامه روزانه شما برای ساعت ' + toFaDigits(reminderTime) + ' ثبت شد.');
    } else {
      setScheduleStatus('⚠️ در لیست برنامه ذخیره شد.');
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
    const isFav = favIds.includes(selected.id);
    return (
      <div className="w-full max-w-xl mx-auto px-3.5 pt-4 pb-28 animate-fade-in" dir="rtl">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="flex items-center gap-1.5 text-muted text-sm font-bold"
          >
            <ArrowRight size={17} />
            <span>بازگشت به گنجینه اذکار</span>
          </button>
          <button
            type="button"
            onClick={() => setFavIds(toggleFavoriteDhikr(selected.id))}
            className="px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 border"
            style={{
              borderColor: isFav ? '#f43f5e' : theme.border,
              background: isFav ? 'rgba(244,63,94,0.14)' : theme.surface,
              color: isFav ? '#fb7185' : theme.text,
            }}
          >
            <Heart size={15} fill={isFav ? '#fb7185' : 'none'} color={isFav ? '#fb7185' : theme.textMuted} />
            <span>{isFav ? 'در لیست محبوب‌ها ❤️' : 'افزودن به محبوب‌ها'}</span>
          </button>
        </div>

        <div
          className="rounded-3xl p-6 mb-4 relative overflow-hidden border"
          style={{
            background: 'radial-gradient(circle at top right, color-mix(in srgb, ' + theme.primary + ' 16%, transparent), ' + theme.surface + ')',
            borderColor: 'color-mix(in srgb, ' + theme.primary + ' 35%, ' + theme.border + ')',
          }}
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <span
              className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: 'color-mix(in srgb, ' + theme.primary + ' 15%, transparent)', color: theme.primary }}
            >
              {dhikrCategories[selected.category] ?? 'ذکر'}
            </span>
            <span className="text-xs font-bold text-primary">
              تعداد پیشنهادی منبع: {toFaDigits(selected.count)} مرتبه
            </span>
          </div>

          <p className="quran-mushaf-text text-app text-2xl font-bold leading-loose text-center my-4">
            {selected.arabic}
          </p>
          <p className="text-app text-sm leading-relaxed text-center font-medium mb-4">
            {selected.translation}
          </p>

          {selected.source && (
            <div className="text-center text-xs text-muted mb-4">
              📚 سند و منبع: <strong className="text-app">{selected.source}</strong>
            </div>
          )}

          {selected.recommendedTime && (
            <div
              className="p-3.5 rounded-2xl mb-3 flex items-start gap-2.5"
              style={{ background: 'color-mix(in srgb, ' + theme.accent + ' 12%, transparent)' }}
            >
              <Clock size={16} color={theme.accent} className="shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <span className="font-bold text-app">زمان مجرب خواندن: </span>
                <span className="text-muted">{selected.recommendedTime}</span>
              </div>
            </div>
          )}

          <div
            className="p-3.5 rounded-2xl mb-3"
            style={{ background: 'color-mix(in srgb, ' + theme.primary + ' 10%, transparent)' }}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary mb-1">
              <Sparkles size={14} />
              <span>فضیلت و برکت</span>
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

        <div className="card-flat p-4 mb-3 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-bold text-app">تعداد تکرار دلخواه شما در ذکرشمار:</p>
            <p className="text-[10px] text-muted">تعداد پیشنهادی: {toFaDigits(selected.count)} مرتبه</p>
          </div>
          <input
            type="number"
            min={1}
            max={10000}
            value={userTargetCount}
            onChange={(e) => setUserTargetCount(Math.max(1, Number(e.target.value) || selected.count))}
            className="w-24 px-3 py-2 rounded-xl text-xs font-bold text-center text-app border outline-none"
            style={{ borderColor: theme.border, background: theme.bg }}
            dir="ltr"
          />
        </div>

        <div className="card-flat p-4 mb-4 space-y-3">
          <p className="text-app font-bold text-sm">ثبت مستقیم در برنامه یادآوری روزانه</p>
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
              style={{ background: 'color-mix(in srgb, ' + theme.primary + ' 16%, transparent)', color: theme.primary }}
            >
              <BellPlus size={15} />
              <span>افزودن به برنامه من</span>
            </button>
          </div>
          {scheduleStatus && <p className="text-xs leading-relaxed text-primary">{scheduleStatus}</p>}
        </div>

        <button
          type="button"
          onClick={() => handleStartTasbih(selected)}
          className="w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg"
          style={{ background: theme.primary, color: theme.bg }}
        >
          <Check size={18} />
          <span>شروع شمارش در تسبیح ({toFaDigits(userTargetCount || selected.count)} مرتبه)</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto px-3.5 pt-4 pb-28 animate-fade-in" dir="rtl">
      {showAddCustom && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[999] overflow-y-auto flex items-center justify-center p-4 animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(6px)' }}
          dir="rtl"
        >
          <div
            className="w-full max-w-md rounded-3xl p-5 border shadow-2xl space-y-3"
            style={{ background: theme.surface, borderColor: theme.border }}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-app">ثبت نکته سخنرانی یا ذکر شخصی</h3>
              <button type="button" onClick={() => setShowAddCustom(false)} className="text-muted">
                <X size={20} />
              </button>
            </div>
            <input
              value={customArabic}
              onChange={(e) => setCustomArabic(e.target.value)}
              placeholder="متن ذکر، آیه یا عمل (مثلاً: سوره واقعه یا صدقه)"
              className="w-full px-3.5 py-3 rounded-2xl text-sm text-app border outline-none"
              style={{ borderColor: theme.border, background: theme.bg }}
            />
            <input
              value={customTranslation}
              onChange={(e) => setCustomTranslation(e.target.value)}
              placeholder="ترجمه، نیت یا توضیح (مثلاً: هدیه به والدین)"
              className="w-full px-3.5 py-3 rounded-2xl text-xs text-app border outline-none"
              style={{ borderColor: theme.border, background: theme.bg }}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={customSource}
                onChange={(e) => setCustomSource(e.target.value)}
                placeholder="گوینده / منبع (مثلاً: استاد عالی)"
                className="px-3 py-2.5 rounded-2xl text-xs text-app border outline-none"
                style={{ borderColor: theme.border, background: theme.bg }}
              />
              <input
                value={customTimeNote}
                onChange={(e) => setCustomTimeNote(e.target.value)}
                placeholder="زمان (مثلاً: بعد نماز صبح)"
                className="px-3 py-2.5 rounded-2xl text-xs text-app border outline-none"
                style={{ borderColor: theme.border, background: theme.bg }}
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted">تعداد:</span>
                <input
                  type="number"
                  min="1"
                  value={customCount}
                  onChange={(e) => setCustomCount(e.target.value)}
                  className="w-20 px-3 py-2.5 rounded-2xl text-xs text-app border outline-none text-center"
                  style={{ borderColor: theme.border, background: theme.bg }}
                  dir="ltr"
                />
              </div>
              <button
                type="button"
                onClick={handleCreateCustomNote}
                className="flex-1 py-3 rounded-2xl text-xs font-bold"
                style={{ background: theme.primary, color: theme.bg }}
              >
                ذخیره در گنجینه من
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <h1 className="text-2xl font-black text-app">گنجینه اذکار و نشانک‌ها</h1>
          <p className="text-muted text-xs mt-1">قرآن، مفاتیح، توصیه علما، محبوب‌ها و نشانک‌ها</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddCustom(true)}
          className="px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm"
          style={{ background: theme.primary, color: theme.bg }}
        >
          <Plus size={15} />
          <span>یادداشت سخنرانی</span>
        </button>
      </div>

      <div
        className="flex items-center gap-2.5 px-4 py-3 rounded-2xl border mb-3.5"
        style={{ background: theme.surface, borderColor: theme.border }}
      >
        <Search size={17} color={theme.textMuted} className="shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="جستجو در نام ذکر، صاحب‌الزمان، آیت‌الله بهجت، واقعه..."
          className="w-full bg-transparent text-xs text-app outline-none"
        />
        {searchQuery && (
          <button type="button" onClick={() => setSearchQuery('')} className="text-muted">
            <X size={15} />
          </button>
        )}
      </div>

      {/* دو دسته‌بندی ویژه کاربر: ۱. ❤️ ذکرهای محبوب من | ۲. 🔖 نشانک‌های قرآن من */}
      <div className="grid grid-cols-2 gap-2.5 mb-2.5">
        <button
          type="button"
          onClick={() => setActiveGroup(activeGroup === 'favorites' ? 'all' : 'favorites')}
          className="card-flat p-3.5 text-right transition-all flex flex-col justify-between"
          style={{
            borderColor: activeGroup === 'favorites' ? '#f43f5e' : theme.border,
            background: activeGroup === 'favorites' ? 'rgba(244,63,94,0.15)' : theme.surface,
          }}
        >
          <div className="flex items-center justify-between w-full mb-1.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(244,63,94,0.18)' }}
            >
              <Heart size={16} color="#fb7185" fill={activeGroup === 'favorites' ? '#fb7185' : 'none'} />
            </div>
            <span className="text-[11px] font-bold" style={{ color: '#fb7185' }}>
              {toFaDigits(favIds.length)} ذکر
            </span>
          </div>
          <div>
            <p className="text-app font-bold text-xs">❤️ ذکرهای محبوب من</p>
            <p className="text-muted text-[10px] mt-0.5 truncate">اذکار نشان‌شده با قلب</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setQState(loadQuranContinuity());
            setActiveGroup(activeGroup === 'bookmarks' ? 'all' : 'bookmarks');
          }}
          className="card-flat p-3.5 text-right transition-all flex flex-col justify-between"
          style={{
            borderColor: activeGroup === 'bookmarks' ? theme.accent : theme.border,
            background: activeGroup === 'bookmarks'
              ? 'color-mix(in srgb, ' + theme.accent + ' 16%, ' + theme.surface + ')'
              : theme.surface,
          }}
        >
          <div className="flex items-center justify-between w-full mb-1.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'color-mix(in srgb, ' + theme.accent + ' 18%, transparent)' }}
            >
              <Bookmark size={16} color={theme.accent} />
            </div>
            <span className="text-[11px] font-bold" style={{ color: theme.accent }}>
              {toFaDigits(qState.bookmarks.length)} آیه
            </span>
          </div>
          <div>
            <p className="text-app font-bold text-xs">🔖 نشانک‌های قرآن من</p>
            <p className="text-muted text-[10px] mt-0.5 truncate">آیات ذخیره‌شده در مصحف</p>
          </div>
        </button>
      </div>

      {/* ۴ دسته‌بندی موضوعی اذکار */}
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        {MACRO_GROUPS.map((grp) => {
          const Icon = grp.icon;
          const isSelected = activeGroup === grp.key;
          const count = items.filter((i) => grp.match(i.category)).length;
          return (
            <button
              key={grp.key}
              type="button"
              onClick={() => setActiveGroup(isSelected ? 'all' : grp.key)}
              className="card-flat p-3.5 text-right transition-all flex flex-col justify-between"
              style={{
                borderColor: isSelected ? theme.primary : theme.border,
                background: isSelected
                  ? 'color-mix(in srgb, ' + theme.primary + ' 14%, ' + theme.surface + ')'
                  : theme.surface,
              }}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{
                    background: isSelected ? theme.primary : 'color-mix(in srgb, ' + theme.primary + ' 12%, transparent)',
                  }}
                >
                  <Icon size={16} color={isSelected ? theme.bg : theme.primary} />
                </div>
                <span className="text-[11px] font-bold text-primary">{toFaDigits(count)} مورد</span>
              </div>
              <div>
                <p className="text-app font-bold text-xs">{grp.title}</p>
                <p className="text-muted text-[10px] mt-0.5 truncate">{grp.subtitle}</p>
              </div>
            </button>
          );
        })}
      </div>

      {activeGroup !== 'all' && (
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-bold text-primary">
            {activeGroup === 'favorites'
              ? '❤️ نمایش ذکرهای محبوب شما'
              : activeGroup === 'bookmarks'
              ? '🔖 نمایش آیات نشانک‌شده شما در قرآن'
              : 'فیلتر فعال: ' + (MACRO_GROUPS.find((g) => g.key === activeGroup)?.title ?? '')}
          </span>
          <button type="button" onClick={() => setActiveGroup('all')} className="text-xs text-muted underline">
            نمایش همه اذکار ({toFaDigits(items.length)})
          </button>
        </div>
      )}

      {activeGroup === 'bookmarks' ? (
        qState.bookmarks.length === 0 ? (
          <div className="card-flat p-8 text-center space-y-2">
            <Bookmark size={34} color={theme.textMuted} className="mx-auto opacity-40" />
            <p className="text-xs font-bold text-app">هنوز آیه‌ای در مصحف نشانک نکرده‌اید</p>
            <p className="text-[11px] text-muted leading-relaxed">
              در صفحهٔ اول روی «مصحف و صوت قرآن» بزنید و کنار هر آیه دکمهٔ 🔖 را لمس کنید تا در این دسته‌بندی ذخیره شود.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {qState.bookmarks.map((bm, idx) => (
              <div key={idx} className="card-flat p-4 space-y-2 border" style={{ borderColor: theme.accent }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-accent">
                    🔖 {bm.surahNameFa} — آیه {toFaDigits(bm.ayahNumber)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = {
                        ...qState,
                        bookmarks: qState.bookmarks.filter((_, i) => i !== idx),
                      };
                      setQState(next);
                      saveQuranContinuity(next);
                    }}
                    className="text-red-400 p-1"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                {bm.arabic && <p className="quran-mushaf-text text-xl font-bold text-app leading-loose">{bm.arabic}</p>}
                <p className="text-xs text-muted leading-relaxed">{bm.note}</p>
              </div>
            ))}
          </div>
        )
      ) : filtered.length === 0 ? (
        <div className="card-flat p-8 text-center space-y-2">
          <Heart size={32} color={theme.textMuted} className="mx-auto opacity-40" />
          <p className="text-xs font-bold text-app">
            {activeGroup === 'favorites' ? 'هنوز ذکری را با علامت ❤️ محبوب نکرده‌اید' : 'موردی یافت نشد'}
          </p>
          <p className="text-[11px] text-muted">روی علامت قلب کنار هر ذکر بزنید تا به لیست محبوب‌های شما اضافه شود.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => {
            const isFav = favIds.includes(d.id);
            return (
              <div
                key={d.id}
                onClick={() => handleOpenDhikr(d)}
                className="w-full card-flat p-4 text-right transition-transform active:scale-[0.99] cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="quran-mushaf-text text-app font-bold text-lg leading-relaxed flex-1">{d.arabic}</p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      aria-label="افزودن به محبوب‌ها"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFavIds(toggleFavoriteDhikr(d.id));
                      }}
                      className="p-1.5 rounded-xl border"
                      style={{
                        borderColor: isFav ? '#f43f5e' : theme.border,
                        background: isFav ? 'rgba(244,63,94,0.14)' : 'transparent',
                      }}
                    >
                      <Heart size={14} color={isFav ? '#fb7185' : theme.textMuted} fill={isFav ? '#fb7185' : 'none'} />
                    </button>
                    <span
                      className="text-[10px] font-bold px-2.5 py-1 rounded-xl"
                      style={{ background: 'color-mix(in srgb, ' + theme.primary + ' 12%, transparent)', color: theme.primary }}
                    >
                      {dhikrCategories[d.category]}
                    </span>
                  </div>
                </div>
                <p className="text-muted text-xs leading-relaxed">{d.translation}</p>
                <div
                  className="flex items-center justify-between gap-2 mt-3 pt-2.5"
                  style={{ borderTop: '1px solid ' + theme.border }}
                >
                  <div className="flex items-center gap-1.5 text-muted text-[11px] min-w-0">
                    <ScrollText size={12} color={theme.primary} className="shrink-0" />
                    <span className="truncate">{d.source ?? 'مفاتیح‌الجنان'}</span>
                  </div>
                  <span className="text-xs font-bold text-primary shrink-0">
                    {toFaDigits(d.count)} مرتبه
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
