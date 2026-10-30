import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Heart, Bookmark, ChevronRight, ChevronLeft, Check, X, Sparkles, Lock, BellRing, Search, FileText, List, Eye, Play, Square, Volume2 } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import {
  SELECTED_QURAN_PASSAGES,
  loadQuranContinuity,
  saveQuranContinuity,
  loadMuhasabaEntries,
  addMuhasabaEntry,
  addMinutesToTimeStr,
  type MuhasabaEntry,
} from '@/lib/deenIntelligenceStore';
import {
  ALL_114_SURAHS,
  fetchSurahAyahs,
  getQuranDisplayMode,
  setQuranDisplayMode,
  type QuranDisplayMode,
  type QuranAyahItem,
} from '@/lib/quranCatalog';
import { calculatePrayerTimes } from '@/lib/prayerTimes';
import { getCityById, getGuestCityId } from '@/lib/cities';
import { createReminder, updateReminder, loadReminders } from '@/lib/reminderService';
import { toFaDigits, toJalaliShort } from '@/lib/jalali';

interface Props {
  initialMode?: 'quran' | 'muhasaba';
  onClose: () => void;
  onUpdated?: () => void;
}

const AYAHS_PER_PAGE = 12;

export function QuranAndMuhasabaModal({ initialMode = 'quran', onClose, onUpdated }: Props) {
  const { theme } = useTheme();
  const [mode, setMode] = useState<'quran' | 'muhasaba'>(initialMode);
  const [qState, setQState] = useState(() => loadQuranContinuity());
  const [displayMode, setDisplayModeState] = useState<QuranDisplayMode>(() => getQuranDisplayMode());
  const [surahSearch, setSurahSearch] = useState('');
  const [showSurahPicker, setShowSurahPicker] = useState(false);
  const [ayahs, setAyahs] = useState<QuranAyahItem[]>([]);
  const [loadingSurah, setLoadingSurah] = useState(false);
  const [surahAudioPlaying, setSurahAudioPlaying] = useState(false);
  const [surahAudioEl, setSurahAudioEl] = useState<HTMLAudioElement null |>(null);

  // تنظیم یادآور هوشمند سوره بر اساس فاصله از اذان (مثلاً ۳۰ دقیقه بعد از اذان مغرب)
  const [selectedAnchor, setSelectedAnchor] = useState<'maghrib' | 'fajr' | 'dhuhr' | 'custom'>('maghrib');
  const [offsetMinutes, setOffsetMinutes] = useState<number>(30);
  const [customTime, setCustomTime] = useState<string>('21:00');

  const [entries, setEntries] = useState(() => loadMuhasabaEntries());
  const [mood, setMood] = useState<MuhasabaEntry['mood']>('peaceful');
  const [gratitude, setGratitude] = useState('');
  const [reflection, setReflection] = useState('');
  const [tomorrow, setTomorrow] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const currentSurahMeta = useMemo(
    () => ALL_114_SURAHS.find((s) => s.number === qState.surahIndex) ?? ALL_114_SURAHS[55], // پیش‌فرض واقعه (۵۶)
    [qState.surahIndex]
  );

  useEffect(() => {
    let active = true;
    setLoadingSurah(true);
    const offlineFallback = SELECTED_QURAN_PASSAGES.find((s) => s.surahIndex === currentSurahMeta.number)?.ayahs;
    fetchSurahAyahs(currentSurahMeta.number, offlineFallback).then((list) => {
      if (!active) return;
      setAyahs(list);
      setLoadingSurah(false);
    });
    return () => {
      active = false;
    };
  }, [currentSurahMeta.number]);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3200);
  };

  const handleChangeDisplayMode = (m: QuranDisplayMode) => {
    setDisplayModeState(m);
    setQuranDisplayMode(m);
  };

  const updateQuranPosition = (surahNumber: number, ayahNumber: number) => {
    const meta = ALL_114_SURAHS.find((s) => s.number === surahNumber) ?? ALL_114_SURAHS[55];
    const next = {
      ...qState,
      surahIndex: meta.number,
      surahNameFa: meta.nameFa,
      ayahNumber: Math.max(1, ayahNumber),
      totalAyahs: meta.ayahCount,
      lastReadIso: new Date().toISOString(),
    };
    setQState(next);
    saveQuranContinuity(next);
    onUpdated?.();
  };

  // کوک کردن یادآور سوره بر اساس زمان اذان (مثلاً ۳۰ دقیقه بعد از اذان مغرب)
  const handleScheduleSurahReminder = async () => {
    const city = getCityById(getGuestCityId());
    const pTimes = calculatePrayerTimes(new Date(), city.lat, city.lng, city.timezone, 'jafari');

    let targetTime = customTime;
    let timeDesc = `ساعت ${toFaDigits(customTime)}`;

    if (selectedAnchor === 'maghrib') {
      targetTime = addMinutesToTimeStr(pTimes.maghrib, offsetMinutes);
      timeDesc = `${toFaDigits(offsetMinutes)} دقیقه بعد از اذان مغرب (${toFaDigits(targetTime)})`;
    } else if (selectedAnchor === 'fajr') {
      targetTime = addMinutesToTimeStr(pTimes.fajr, offsetMinutes);
      timeDesc = `${toFaDigits(offsetMinutes)} دقیقه بعد از اذان صبح (${toFaDigits(targetTime)})`;
    } else if (selectedAnchor === 'dhuhr') {
      targetTime = addMinutesToTimeStr(pTimes.dhuhr, offsetMinutes);
      timeDesc = `${toFaDigits(offsetMinutes)} دقیقه بعد از اذان ظهر (${toFaDigits(targetTime)})`;
    }

    const title = `📖 تلاوت ${currentSurahMeta.nameFa}`;
    const body = `وقت انس روزانه با قرآن (${timeDesc}) — ${currentSurahMeta.virtueShort ?? 'نور و برکت زندگی'}`;

    const existing = loadReminders().find((r) => r.title === title);
    if (existing) {
      await updateReminder(existing.id, { time: targetTime, body, enabled: true }, true);
    } else {
      await createReminder({
        title,
        body,
        time: targetTime,
        days: [0, 1, 2, 3, 4, 5, 6],
        dhikrId: null,
        type: 'recurring',
        notifEnabled: true,
      });
    }

    showToast(`🔔 یادآور «${currentSurahMeta.nameFa}» برای ${timeDesc} کوک شد!`);
    onUpdated?.();
  };

  const handleBookmark = (ayah: QuranAyahItem) => {
    const exists = qState.bookmarks.some(
      (b) => b.surahNameFa === currentSurahMeta.nameFa && b.ayahNumber === ayah.number
    );
    if (exists) {
      showToast('این آیه قبلاً در نشانک‌های شما ذخیره شده است.');
      return;
    }
    const next = {
      ...qState,
      bookmarks: [
        { surahNameFa: currentSurahMeta.nameFa, ayahNumber: ayah.number, note: ayah.translationFa.slice(0, 50) },
        ...qState.bookmarks,
      ].slice(0, 30),
    };
    setQState(next);
    saveQuranContinuity(next);
    showToast(`🔖 آیه ${toFaDigits(ayah.number)} ${currentSurahMeta.nameFa} نشانک‌گذاری شد.`);
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

  const filteredSurahs = useMemo(() => {
    const q = surahSearch.trim();
    if (!q) return ALL_114_SURAHS;
    return ALL_114_SURAHS.filter(
      (s) => s.nameFa.includes(q) || s.nameAr.includes(q) || String(s.number) === q
    );
  }, [surahSearch]);

  const safeAyahIdx = Math.max(0, Math.min(ayahs.length - 1, qState.ayahNumber - 1));
  const chunkSize = displayMode === 'page' ? AYAHS_PER_PAGE : displayMode === 'chunk5' ? 5 : 1;
  const currentPageIndex = Math.floor(safeAyahIdx / chunkSize);
  const totalPages = Math.max(1, Math.ceil(ayahs.length / chunkSize));
  const visibleAyahs = ayahs.slice(currentPageIndex * chunkSize, (currentPageIndex + 1) * chunkSize);

  const node = (
    <div
      className="fixed inset-0 z-[999] overflow-y-auto flex items-center justify-center p-3.5 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.84)', backdropFilter: 'blur(7px)' }}
      dir="rtl"
    >
      <div
        className="w-full max-w-md rounded-3xl p-4 border shadow-2xl my-auto max-h-[92vh] overflow-y-auto"
        style={{ background: theme.surface, borderColor: theme.border }}
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-2">
            <BookOpen size={19} color={theme.primary} />
            <h2 className="text-base font-black text-app">قرآن کریم (۱۱۴ سوره) و محاسبه نفس</h2>
          </div>
          <button type="button" onClick={onClose} className="text-muted p-1">
            <X size={20} />
          </button>
        </div>

        {toast && (
          <div
            className="mb-3 rounded-2xl px-3 py-2.5 text-xs font-bold text-center shadow-lg"
            style={{ background: theme.primary, color: theme.bg }}
          >
            {toast}
          </div>
        )}

        <div
          className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl mb-3.5"
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
            <BookOpen size={14} /> مصحف قرآن و یادآور سوره
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
          <div className="space-y-3.5">
            {/* انتخابگر سریع سوره از بین کل ۱۱۴ سوره قرآن */}
            <div className="card-flat p-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] text-muted block">سوره انتخابی فعلی:</span>
                  <strong className="text-sm font-black text-primary">
                    {toFaDigits(currentSurahMeta.number)}. {currentSurahMeta.nameFa} ({toFaDigits(currentSurahMeta.ayahCount)} آیه)
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSurahPicker((v) => !v)}
                  className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1"
                  style={{ background: theme.primary, color: theme.bg }}
                >
                  <Search size={13} />
                  <span>{showSurahPicker ? 'بستن فهرست' : 'فهرست ۱۱۴ سوره'}</span>
                </button>
              </div>

              {/* میان‌بر سوره‌های پرکاربرد روزانه و شبانه */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { num: 56, label: 'واقعه (رزق شبانه)' },
                  { num: 37, label: 'صافات (روز جمعه)' },
                  { num: 36, label: 'یس (قلب قرآن)' },
                  { num: 67, label: 'ملک (تبارک)' },
                  { num: 55, label: 'الرحمن' },
                  { num: 51, label: 'ذاریات' },
                  { num: 18, label: 'کهف' },
                  { num: 78, label: 'نبا' },
                ].map((s) => {
                  const active = currentSurahMeta.number === s.num;
                  return (
                    <button
                      key={s.num}
                      type="button"
                      onClick={() => {
                        updateQuranPosition(s.num, 1);
                        setShowSurahPicker(false);
                      }}
                      className="px-2.5 py-1 rounded-xl text-[11px] font-bold border"
                      style={{
                        borderColor: active ? theme.primary : theme.border,
                        background: active ? theme.primary : 'transparent',
                        color: active ? theme.bg : theme.textMuted,
                      }}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>

              {showSurahPicker && (
                <div className="pt-2 border-t space-y-2" style={{ borderColor: theme.border }}>
                  <input
                    type="text"
                    value={surahSearch}
                    onChange={(e) => setSurahSearch(e.target.value)}
                    placeholder="🔍 جستجو در ۱۱۴ سوره (مثلاً: واقعه، یس، بقره، الرحمن، 56...)"
                    className="w-full px-3 py-2 rounded-xl text-xs text-app border outline-none"
                    style={{ borderColor: theme.border, background: theme.bg }}
                  />
                  <div className="max-h-48 overflow-y-auto grid grid-cols-2 gap-1.5 pr-0.5">
                    {filteredSurahs.map((s) => (
                      <button
                        key={s.number}
                        type="button"
                        onClick={() => {
                          updateQuranPosition(s.number, 1);
                          setShowSurahPicker(false);
                        }}
                        className="p-2 rounded-xl text-right border text-xs flex items-center justify-between"
                        style={{
                          borderColor: currentSurahMeta.number === s.number ? theme.primary : theme.border,
                          background:
                            currentSurahMeta.number === s.number
                              ? `color-mix(in srgb, ${theme.primary} 15%, transparent)`
                              : theme.bg,
                        }}
                      >
                        <span className="font-bold text-app truncate">
                          {toFaDigits(s.number)}. {s.nameFa.replace('سوره مبارکه ', '')}
                        </span>
                        <span className="text-[10px] text-muted shrink-0">{toFaDigits(s.ayahCount)} آیه</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* انتخاب حالت نمایش قرآن: صفحه‌ای (مصحف) | دسته‌ای (۵ آیه با هم) | تک‌آیه */}
            <div className="flex items-center justify-between gap-2 card-flat p-2.5">
              <span className="text-[11px] font-bold text-muted pr-1">حالت نمایش قرآن:</span>
              <div className="flex gap-1">
                {[
                  { id: 'page' as QuranDisplayMode, label: '📄 صفحه‌ای (مصحف)', icon: FileText },
                  { id: 'chunk5' as QuranDisplayMode, label: '📑 ۵ آیه با هم', icon: List },
                  { id: 'single' as QuranDisplayMode, label: '🔍 تک‌آیه', icon: Eye },
                ].map((m) => {
                  const active = displayMode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleChangeDisplayMode(m.id)}
                      className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all"
                      style={{
                        background: active ? theme.primary : 'transparent',
                        color: active ? theme.bg : theme.textMuted,
                        border: `1px solid ${active ? theme.primary : theme.border}`,
                      }}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* پلیر صوتی ترتیل کامل سوره (سوره واقعه، صافات، یس و کل ۱۱۴ سوره) */}
            <div
              className="p-3 rounded-2xl border flex items-center justify-between gap-2"
              style={{
                borderColor: surahAudioPlaying ? theme.accent : theme.primary,
                background: `color-mix(in srgb, ${theme.primary} 12%, transparent)`,
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Volume2 className="shrink-0" color="{theme.primary}" size="{17}"/>
                <div className="min-w-0">
                  <p className="text-xs font-black text-app truncate">
                    🎧 ترتیل صوتی {currentSurahMeta.nameFa}
                  </p>
                  <p className="text-[10px] text-muted truncate">
                    {surahAudioPlaying ? 'ılılı در حال پخش صوت نورانی سوره...' : 'پخش صوتی همزمان با مشاهده متن آیات'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (surahAudioPlaying && surahAudioEl) {
                    surahAudioEl.pause();
                    setSurahAudioPlaying(false);
                    return;
                  }
                  if (surahAudioEl) surahAudioEl.pause();
                  const padNum = String(currentSurahMeta.number).padStart(3, '0');
                  const audio = new Audio(`https://server8.mp3quran.net/afs/${padNum}.mp3`);
                  audio.onended = () => setSurahAudioPlaying(false);
                  audio.onerror = () => {
                    setSurahAudioPlaying(false);
                    showToast('برای پخش صوت کامل سوره، اتصال اینترنت را بررسی کنید.');
                  };
                  setSurahAudioEl(audio);
                  setSurahAudioPlaying(true);
                  void audio.play();
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-md"
                style={{
                  background: surahAudioPlaying ? '#ef4444' : theme.primary,
                  color: surahAudioPlaying ? '#ffffff' : theme.bg,
                }}
              >
                {surahAudioPlaying ? <Square size="{12}"/> : <Play size="{12}"/>}
                <span>{surahAudioPlaying ? 'توقف صوت' : 'پخش صوت سوره'}</span>
              </button>
            </div>

            {/* صفحه مصحف نورانی قرآن */}
            <div
              className="rounded-3xl p-4 border space-y-3"
              style={{
                background: `radial-gradient(circle at top, color-mix(in srgb, ${theme.primary} 15%, transparent), ${theme.bg})`,
                borderColor: theme.primary,
              }}
            >
              <div className="flex items-center justify-between text-xs text-muted pb-2 border-b" style={{ borderColor: theme.border }}>
                <span className="font-black text-primary">{currentSurahMeta.nameFa}</span>
                <span>
                  صفحه {toFaDigits(currentPageIndex + 1)} از {toFaDigits(totalPages)} (کل: {toFaDigits(ayahs.length)} آیه)
                </span>
              </div>

              {loadingSurah ? (
                <p className="text-center text-xs text-muted py-8">در حال باز کردن آیات سوره...</p>
              ) : displayMode === 'page' ? (
                /* حالت صفحه‌ای پیوسته (مصحف کامل به همراه ترجمه روان) */
                <div className="space-y-3 text-right">
                  <div
                    className="p-3.5 rounded-2xl border text-justify dir-rtl"
                    style={{ background: `color-mix(in srgb, ${theme.surface} 85%, transparent)`, borderColor: theme.border }}
                  >
                    <p className="quran-ayah-text text-xl font-bold text-app leading-loose">
                      {visibleAyahs.map((a) => (
                        <span key={a.number} className="inline">
                          {a.arabic}{' '}
                          <span
                            className="inline-flex items-center justify-center px-1.5 py-0.5 mx-1 rounded-full text-xs font-bold"
                            style={{ background: `color-mix(in srgb, ${theme.primary} 22%, transparent)`, color: theme.primary }}
                          >
                            ﴿{toFaDigits(a.number)}﴾
                          </span>{' '}
                        </span>
                      ))}
                    </p>
                  </div>

                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    <p className="text-[11px] font-bold text-primary">ترجمه فارسی آیات این صفحه:</p>
                    {visibleAyahs.map((a) => (
                      <div key={a.number} className="text-xs text-muted leading-relaxed border-b pb-1.5" style={{ borderColor: theme.border }}>
                        <strong className="text-accent ml-1">({toFaDigits(a.number)})</strong>
                        <span>{a.translationFa}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* حالت ۵ آیه با هم یا تک‌آیه */
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {visibleAyahs.map((a) => (
                    <div
                      key={a.number}
                      className="p-3.5 rounded-2xl border text-right space-y-2"
                      style={{ background: `color-mix(in srgb, ${theme.surface} 80%, transparent)`, borderColor: theme.border }}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="text-[11px] font-bold px-2 py-0.5 rounded-lg"
                          style={{ background: `color-mix(in srgb, ${theme.primary} 15%, transparent)`, color: theme.primary }}
                        >
                          آیه {toFaDigits(a.number)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleBookmark(a)}
                          className="text-[11px] font-bold flex items-center gap-1"
                          style={{ color: theme.accent }}
                        >
                          <Bookmark size={12} /> نشانک
                        </button>
                      </div>
                      <p className="quran-ayah-text text-xl font-bold text-app leading-loose">{a.arabic}</p>
                      <p className="text-xs text-muted leading-relaxed">{a.translationFa}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* دکمه‌های ورق زدن صفحه بعد / صفحه قبل */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t" style={{ borderColor: theme.border }}>
                <button
                  type="button"
                  disabled={currentPageIndex === 0}
                  onClick={() => {
                    const prevStart = Math.max(1, (currentPageIndex - 1) * chunkSize + 1);
                    updateQuranPosition(currentSurahMeta.number, prevStart);
                  }}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1 border disabled:opacity-40"
                  style={{ borderColor: theme.border, color: theme.text }}
                >
                  <ChevronRight size={15} />
                  <span>{displayMode === 'single' ? 'آیه قبل' : 'صفحه قبل'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (visibleAyahs[0]) handleBookmark(visibleAyahs[0]);
                  }}
                  className="px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1"
                  style={{ background: `color-mix(in srgb, ${theme.accent} 16%, transparent)`, color: theme.accent }}
                >
                  <Bookmark size={14} /> ذخیره موضع
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const nextStart =
                      (currentPageIndex + 1) * chunkSize < ayahs.length
                        ? (currentPageIndex + 1) * chunkSize + 1
                        : 1;
                    updateQuranPosition(currentSurahMeta.number, nextStart);
                    showToast('✓ صفحه جدید باز و موضع مطالعه ذخیره شد.');
                  }}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1"
                  style={{ background: theme.primary, color: theme.bg }}
                >
                  <span>{displayMode === 'single' ? 'آیه بعد' : 'صفحه بعد'}</span>
                  <ChevronLeft size={15} />
                </button>
              </div>
            </div>

            {/* باکس کوک کردن هوشمند یادآور این سوره بعد از اذان (مثلاً ۳۰ دقیقه بعد از اذان مغرب) */}
            <div
              className="card-flat p-3.5 space-y-2.5 border"
              style={{ borderColor: `color-mix(in srgb, ${theme.accent} 40%, ${theme.border})` }}
            >
              <div className="flex items-center gap-1.5">
                <BellRing size={15} color={theme.accent} />
                <span className="text-xs font-black text-app">
                  کوک یادآور روزانه «{currentSurahMeta.nameFa}» بر اساس وقت اذان:
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'maghrib' as const, label: '🌙 بعد از اذان مغرب' },
                  { id: 'fajr' as const, label: '🌅 بعد از اذان صبح' },
                  { id: 'dhuhr' as const, label: '☀️ بعد از اذان ظهر' },
                  { id: 'custom' as const, label: '⏰ ساعت دلخواه من' },
                ].map((anc) => (
                  <button
                    key={anc.id}
                    type="button"
                    onClick={() => setSelectedAnchor(anc.id)}
                    className="py-2 px-2 rounded-xl text-[11px] font-bold border"
                    style={{
                      borderColor: selectedAnchor === anc.id ? theme.accent : theme.border,
                      background: selectedAnchor === anc.id ? `color-mix(in srgb, ${theme.accent} 18%, transparent)` : 'transparent',
                      color: selectedAnchor === anc.id ? theme.accent : theme.textMuted,
                    }}
                  >
                    {anc.label}
                  </button>
                ))}
              </div>

              {selectedAnchor !== 'custom' ? (
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] text-muted">فاصله بعد از اذان:</span>
                  <div className="flex gap-1">
                    {[15, 30, 45, 60].map((min) => (
                      <button
                        key={min}
                        type="button"
                        onClick={() => setOffsetMinutes(min)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold"
                        style={{
                          background: offsetMinutes === min ? theme.primary : `color-mix(in srgb, ${theme.primary} 12%, transparent)`,
                          color: offsetMinutes === min ? theme.bg : theme.textMuted,
                        }}
                      >
                        {min === 30 ? 'نیم ساعت بعد' : `${toFaDigits(min)} دقیقه بعد`}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] text-muted">انتخاب ساعت دقیق:</span>
                  <input
                    type="time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    dir="ltr"
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-app border outline-none"
                    style={{ borderColor: theme.border, background: theme.bg }}
                  />
                </div>
              )}

              <button
                type="button"
                onClick={() => void handleScheduleSurahReminder()}
                className="w-full py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
                style={{ background: theme.primary, color: theme.bg }}
              >
                <BellRing size={14} />
                <span>
                  کوک یادآور {currentSurahMeta.nameFa.replace('سوره مبارکه ', 'سوره ')}{' '}
                  {selectedAnchor === 'custom'
                    ? `(ساعت ${toFaDigits(customTime)})`
                    : `(${offsetMinutes === 30 ? 'نیم ساعت' : toFaDigits(offsetMinutes) + ' دقیقه'} بعد از اذان)`}
                </span>
              </button>
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
