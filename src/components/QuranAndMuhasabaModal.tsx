import { useState } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Heart, Bookmark, ChevronRight, ChevronLeft, Check, X, Sparkles, Lock, Share2 } from 'lucide-react';
import { generateAndShareSpiritualCard } from '@/lib/viralCardGenerator';
import { useTheme } from '@/hooks/useTheme';
import {
  SELECTED_QURAN_PASSAGES,
  loadQuranContinuity,
  saveQuranContinuity,
  loadMuhasabaEntries,
  addMuhasabaEntry,
  type MuhasabaEntry,
} from '@/lib/deenIntelligenceStore';
import { toFaDigits, toJalaliShort } from '@/lib/jalali';

interface Props {
  initialMode?: 'quran' | 'muhasaba';
  onClose: () => void;
  onUpdated?: () => void;
}

export function QuranAndMuhasabaModal({ initialMode = 'quran', onClose, onUpdated }: Props) {
  const { theme } = useTheme();
  const [mode, setMode] = useState<'quran' | 'muhasaba'>(initialMode);
  const [qState, setQState] = useState(() => loadQuranContinuity());
  const [entries, setEntries] = useState(() => loadMuhasabaEntries());
  const [mood, setMood] = useState<MuhasabaEntry['mood']>('peaceful');
  const [gratitude, setGratitude] = useState('');
  const [reflection, setReflection] = useState('');
  const [tomorrow, setTomorrow] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const currentSurah =
    SELECTED_QURAN_PASSAGES.find((s) => s.surahIndex === qState.surahIndex) ?? SELECTED_QURAN_PASSAGES[0];
  const currentAyahIndex = Math.max(
    0,
    Math.min(currentSurah.ayahs.length - 1, qState.ayahNumber - 1)
  );
  const currentAyah = currentSurah.ayahs[currentAyahIndex];

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2600);
  };

  const updateQuranPosition = (surahIndex: number, ayahNumber: number, addMinutes: number = 0) => {
    const surah = SELECTED_QURAN_PASSAGES.find((s) => s.surahIndex === surahIndex) ?? SELECTED_QURAN_PASSAGES[0];
    const next = {
      ...qState,
      surahIndex: surah.surahIndex,
      surahNameFa: surah.surahNameFa,
      ayahNumber,
      totalAyahs: surah.ayahs.length,
      todayReadMinutes: qState.todayReadMinutes + addMinutes,
      lastReadIso: new Date().toISOString(),
    };
    setQState(next);
    saveQuranContinuity(next);
    onUpdated?.();
  };


  const handleShareStory = async () => {
    try {
      showToast('🎨 در حال طراحی کارت استوری نورانی...');
      const res = await generateAndShareSpiritualCard({
        badgeText: 'آیه نورانی روز',
        arabicText: currentAyah.arabic,
        translationFa: currentAyah.translationFa,
        referenceText: `${currentSurah.surahNameFa} - آیه ${currentAyah.number}`,
        primaryColor: theme.primary,
        accentColor: theme.accent,
      });
      if (res.method === 'download') {
        showToast('📸 تصویر استوری با کیفیت بالا ذخیره شد!');
      }
    } catch {
      showToast('خطا در ساخت تصویر استوری.');
    }
  };

  const handleBookmark = () => {
    const exists = qState.bookmarks.some(
      (b) => b.surahNameFa === currentSurah.surahNameFa && b.ayahNumber === currentAyah.number
    );
    if (exists) {
      showToast('این آیه قبلاً در نشانک‌های شما ذخیره شده است.');
      return;
    }
    const next = {
      ...qState,
      bookmarks: [
        { surahNameFa: currentSurah.surahNameFa, ayahNumber: currentAyah.number, note: currentAyah.translationFa.slice(0, 45) },
        ...qState.bookmarks,
      ].slice(0, 20),
    };
    setQState(next);
    saveQuranContinuity(next);
    showToast('🔖 آیه در نشانک‌های قرآنی شما ذخیره شد.');
    onUpdated?.();
  };

  const handleSaveMuhasaba = () => {
    if (!gratitude.trim() && !reflection.trim()) {
      showToast('لطفاً حداقل یک جمله شکرگزاری یا یادداشت وارد کنید.');
      return;
    }
    addMuhasabaEntry({
      date: toJalaliShort(new Date()),
      mood,
      gratitudeNote: gratitude.trim() || 'شکر نعمت سلامتی و فرصت بندگی',
      selfReflection: reflection.trim() || 'مراقبه بر آرامش و خوش‌خلقی با خانواده',
      tomorrowIntention: tomorrow.trim() || 'نماز اول وقت و قرائت قرآن',
    });
    setEntries(loadMuhasabaEntries());
    setGratitude('');
    setReflection('');
    setTomorrow('');
    showToast('✨ یادداشت محاسبه نفس به‌صورت کاملاً خصوصی روی گوشی ذخیره شد.');
    onUpdated?.();
  };

  const node = (
    <div
      className="fixed inset-0 z-[999] overflow-y-auto flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)' }}
      dir="rtl"
    >
      <div
        className="w-full max-w-md rounded-3xl p-5 border shadow-2xl my-auto max-h-[90vh] overflow-y-auto"
        style={{ background: theme.surface, borderColor: theme.border }}
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-2">
            <BookOpen size={19} color={theme.primary} />
            <h2 className="text-base font-black text-app">انس مستمر با قرآن و محاسبه نفس</h2>
          </div>
          <button type="button" onClick={onClose} className="text-muted p-1">
            <X size={20} />
          </button>
        </div>

        {toast && (
          <div
            className="mb-3 rounded-2xl px-3 py-2 text-xs font-bold text-center"
            style={{ background: theme.primary, color: theme.bg }}
          >
            {toast}
          </div>
        )}

        <div
          className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl mb-4"
          style={{ background: `color-mix(in srgb, ${theme.primary} 10%, transparent)` }}
        >
          <button
            type="button"
            onClick={() => setMode('quran')}
            className="py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
            style={{
              background: mode === 'quran' ? theme.primary : 'transparent',
              color: mode === 'quran' ? theme.bg : theme.textMuted,
            }}
          >
            <BookOpen size={14} /> ادامه مطالعه قرآن
          </button>
          <button
            type="button"
            onClick={() => setMode('muhasaba')}
            className="py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
            style={{
              background: mode === 'muhasaba' ? theme.primary : 'transparent',
              color: mode === 'muhasaba' ? theme.bg : theme.textMuted,
            }}
          >
            <Heart size={14} /> محاسبه نفس شبانه
          </button>
        </div>

        {mode === 'quran' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 card-flat p-3">
              <span className="text-xs font-bold text-app">برنامه مطالعه روزانه:</span>
              <div className="flex gap-1.5">
                {([5, 15, 30] as const).map((min) => (
                  <button
                    key={min}
                    type="button"
                    onClick={() => {
                      const next = { ...qState, dailyTargetMinutes: min };
                      setQState(next);
                      saveQuranContinuity(next);
                    }}
                    className="px-2.5 py-1 rounded-xl text-[11px] font-bold"
                    style={{
                      background: qState.dailyTargetMinutes === min ? theme.primary : 'transparent',
                      color: qState.dailyTargetMinutes === min ? theme.bg : theme.textMuted,
                      border: `1px solid ${qState.dailyTargetMinutes === min ? theme.primary : theme.border}`,
                    }}
                  >
                    {toFaDigits(min)} دقیقه
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {SELECTED_QURAN_PASSAGES.map((s) => (
                <button
                  key={s.surahIndex}
                  type="button"
                  onClick={() => updateQuranPosition(s.surahIndex, 1, 0)}
                  className="p-2.5 rounded-xl text-right border text-xs font-bold"
                  style={{
                    borderColor: currentSurah.surahIndex === s.surahIndex ? theme.primary : theme.border,
                    background:
                      currentSurah.surahIndex === s.surahIndex
                        ? `color-mix(in srgb, ${theme.primary} 14%, transparent)`
                        : 'transparent',
                    color: currentSurah.surahIndex === s.surahIndex ? theme.primary : theme.text,
                  }}
                >
                  {s.surahNameFa}
                </button>
              ))}
            </div>

            <div
              className="rounded-3xl p-5 border text-center space-y-3"
              style={{
                background: `radial-gradient(circle at top, color-mix(in srgb, ${theme.primary} 18%, transparent), ${theme.bg})`,
                borderColor: theme.primary,
              }}
            >
              <div className="flex items-center justify-between text-xs text-muted">
                <span className="font-bold text-primary">{currentSurah.surahNameFa}</span>
                <span>
                  بخش {toFaDigits(currentAyahIndex + 1)} از {toFaDigits(currentSurah.ayahs.length)}
                </span>
              </div>

              <p className="text-xl font-bold text-app leading-loose py-2">{currentAyah.arabic}</p>
              <p className="text-xs text-muted leading-relaxed">{currentAyah.translationFa}</p>

              <div className="flex items-center justify-between gap-2 pt-3 border-t" style={{ borderColor: theme.border }}>
                <button
                  type="button"
                  disabled={currentAyahIndex === 0}
                  onClick={() => updateQuranPosition(currentSurah.surahIndex, currentAyahIndex)}
                  className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 border disabled:opacity-40"
                  style={{ borderColor: theme.border, color: theme.text }}
                >
                  <ChevronRight size={14} /> آیه قبل
                </button>

                <button
                  type="button"
                  onClick={handleBookmark}
                  className="px-2.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1"
                  style={{ background: `color-mix(in srgb, ${theme.accent} 16%, transparent)`, color: theme.accent }}
                >
                  <Bookmark size={14} /> نشانک
                </button>

                <button
                  type="button"
                  onClick={handleShareStory}
                  className="px-2.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1"
                  style={{ background: `color-mix(in srgb, ${theme.primary} 16%, transparent)`, color: theme.primary }}
                >
                  <Share2 size={14} /> استوری
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const nextNum =
                      currentAyahIndex + 1 < currentSurah.ayahs.length ? currentAyahIndex + 2 : 1;
                    updateQuranPosition(currentSurah.surahIndex, nextNum, 2);
                    showToast('✓ موقعیت مطالعه ذخیره شد (ادامه از همین‌جا)');
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1"
                  style={{ background: theme.primary, color: theme.bg }}
                >
                  <span>آیه بعد (ثبت)</span>
                  <ChevronLeft size={14} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            <div className="flex items-center gap-1.5 text-[11px] text-muted">
              <Lock size={13} color={theme.primary} />
              <span>یادداشت‌های محاسبه نفس ۱۰۰٪ خصوصی و فقط روی حافظهٔ همین گوشی ذخیره می‌شوند.</span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {([
                { id: 'peaceful' as const, label: '🌿 آرام' },
                { id: 'grateful' as const, label: '🤲 شاکر' },
                { id: 'hopeful' as const, label: '✨ امیدوار' },
                { id: 'repentant' as const, label: '💧 توبه‌کار' },
              ]).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMood(m.id)}
                  className="py-2 rounded-xl text-[11px] font-bold border"
                  style={{
                    borderColor: mood === m.id ? theme.primary : theme.border,
                    background: mood === m.id ? theme.primary : 'transparent',
                    color: mood === m.id ? theme.bg : theme.textMuted,
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <input
              value={gratitude}
              onChange={(e) => setGratitude(e.target.value)}
              placeholder="۱. امروز بابت چه نعمتی خدا را شکر می‌کنی؟"
              className="w-full px-3.5 py-2.5 rounded-2xl text-xs text-app border outline-none"
              style={{ borderColor: theme.border, background: theme.bg }}
            />
            <input
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="۲. محاسبه نفس امروز (قدم مثبت یا نکته‌ای که آموختم)"
              className="w-full px-3.5 py-2.5 rounded-2xl text-xs text-app border outline-none"
              style={{ borderColor: theme.border, background: theme.bg }}
            />
            <input
              value={tomorrow}
              onChange={(e) => setTomorrow(e.target.value)}
              placeholder="۳. نیت و تصمیم معنوی من برای فردا"
              className="w-full px-3.5 py-2.5 rounded-2xl text-xs text-app border outline-none"
              style={{ borderColor: theme.border, background: theme.bg }}
            />

            <button
              type="button"
              onClick={handleSaveMuhasaba}
              className="w-full py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5"
              style={{ background: theme.primary, color: theme.bg }}
            >
              <Sparkles size={15} /> ثبت در دفترچه خلوت من
            </button>

            {entries.length > 0 && (
              <div className="space-y-2 pt-2 border-t max-h-40 overflow-y-auto" style={{ borderColor: theme.border }}>
                <p className="text-[11px] font-bold text-muted">مرور یادداشت‌های قبلی من:</p>
                {entries.slice(0, 5).map((ent) => (
                  <div key={ent.id} className="card-flat p-2.5 text-xs space-y-1">
                    <div className="flex justify-between text-[10px] text-primary font-bold">
                      <span>{ent.date}</span>
                      <span>ثبت محلی ✓</span>
                    </div>
                    <p className="text-app font-medium">🤲 {ent.gratitudeNote}</p>
                    <p className="text-muted text-[11px]">🌱 نیت فردا: {ent.tomorrowIntention}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-4 py-2.5 rounded-2xl text-xs font-bold border"
          style={{ borderColor: theme.border, color: theme.text }}
        >
          <Check size={14} className="inline ml-1" /> بستن
        </button>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(node, document.body) : node;
}
