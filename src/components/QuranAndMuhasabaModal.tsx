import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Heart, Bookmark, ChevronRight, ChevronLeft, Check, X, Sparkles, Lock, BellRing, Play, Square, Volume2 } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import {
  loadQuranContinuity,
  saveQuranContinuity,
  loadMuhasabaEntries,
  addMuhasabaEntry,
  addMinutesToTimeStr,
  type MuhasabaEntry,
} from '@/lib/deenIntelligenceStore';
import {
  fetchSurahAyahs,
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

interface SelectedSurahInfo {
  number: number;
  nameFa: string;
  shortLabel: string;
  ayahCount: number;
  bestTimeFa: string;
  virtueFa: string;
  hadithSourceFa: string;
  parhizgarSurahUrl: string;
}

// مجموعه سوره‌های منتخب و مجرب روزانه و شبانه (به جای ۱۱۴ سوره)
const CURATED_SURAHS: SelectedSurahInfo[] = [
  {
    number: 56,
    nameFa: 'سوره مبارکه واقعه',
    shortLabel: 'واقعه (رزق شبانه)',
    ayahCount: 96,
    bestTimeFa: 'هر شب پس از نماز مغرب و عشاء پیش از خواب',
    virtueFa: 'امان از تنگدستی، گشایش روزی حلال و بی‌نیازی در دنیا و نورانیت چهره در قیامت.',
    hadithSourceFa: 'امام صادق (ع): هر کس هر شب پیش از خواب سوره واقعه را بخواند، هرگز در دنیا تنگدست و محتاج نمی‌شود.',
    parhizgarSurahUrl: 'https://server8.mp3quran.net/afs/056.mp3',
  },
  {
    number: 36,
    nameFa: 'سوره مبارکه یس',
    shortLabel: 'یس (قلب قرآن)',
    ayahCount: 83,
    bestTimeFa: 'پس از نماز صبح و شب‌های جمعه',
    virtueFa: 'قلب قرآن کریم؛ خواندن آن در آغاز روز موجب شادی، حفاظت الهی و برآورده شدن حاجات تا شب است.',
    hadithSourceFa: 'پیامبر اکرم (ص): هر چیزی قلبی دارد و قلب قرآن سوره یس است؛ هر کس در آغاز روز آن را بخواند در آن روز از فرح و خیر بهره‌مند گردد.',
    parhizgarSurahUrl: 'https://server8.mp3quran.net/afs/036.mp3',
  },
  {
    number: 67,
    nameFa: 'سوره مبارکه ملک (تبارک)',
    shortLabel: 'ملک (تبارک)',
    ayahCount: 30,
    bestTimeFa: 'هر شب پیش از خواب یا بعد از نماز عشاء',
    virtueFa: 'سوره مانعه و منجیه؛ آرامش در خواب، حفظ در پناه الهی و هدیه نورانی برای اموات و والدین.',
    hadithSourceFa: 'امام باقر (ع): سوره ملک سوره مانعه است و قاری خود را در دنیا و آخرت در پناه رحمت خدا قرار می‌دهد.',
    parhizgarSurahUrl: 'https://server8.mp3quran.net/afs/067.mp3',
  },
  {
    number: 55,
    nameFa: 'سوره مبارکه الرحمن',
    shortLabel: 'الرحمن (عروس قرآن)',
    ayahCount: 78,
    bestTimeFa: 'پس از نماز صبح و روزهای جمعه',
    virtueFa: 'عروس قرآن؛ شکرگزاری بر نعمت‌های الهی، صفای دل و گشایش در برکات مادی و معنوی.',
    hadithSourceFa: 'امام صادق (ع): از خواندن سوره الرحمن و قیام به آن غفلت نکنید که در دل‌های مؤمنان جایگاه ویژه‌ای دارد.',
    parhizgarSurahUrl: 'https://server8.mp3quran.net/afs/055.mp3',
  },
  {
    number: 51,
    nameFa: 'سوره مبارکه ذاریات',
    shortLabel: 'ذاریات (اصلاح معاش)',
    ayahCount: 60,
    bestTimeFa: 'هر روز پس از نماز صبح یا ظهر',
    virtueFa: 'اصلاح امر معاش، برکت در کسب‌وکار و روزی فراوان از فضل پروردگار.',
    hadithSourceFa: 'امام صادق (ع): هر کس در روز یا شب سوره ذاریات را بخواند، خداوند معیشت او را اصلاح فرموده و روزی فراوان عطا کند.',
    parhizgarSurahUrl: 'https://server8.mp3quran.net/afs/051.mp3',
  },
  {
    number: 37,
    nameFa: 'سوره مبارکه صافات',
    shortLabel: 'صافات (روز جمعه)',
    ayahCount: 182,
    bestTimeFa: 'روزهای جمعه (صبح یا ظهر جمعه)',
    virtueFa: 'ایمنی از آفات و بلایا، وسعت روزی در دنیا و حفظ خانواده از هر گزند.',
    hadithSourceFa: 'امام صادق (ع): هر کس در هر روز جمعه سوره صافات را بخواند، همواره در عافیت بوده و در دنیا به او روزی فراوان داده می‌شود.',
    parhizgarSurahUrl: 'https://server8.mp3quran.net/afs/037.mp3',
  },
  {
    number: 62,
    nameFa: 'سوره مبارکه جمعه',
    shortLabel: 'جمعه (شب و روز جمعه)',
    ayahCount: 11,
    bestTimeFa: 'شب و روز جمعه و نماز صبح و عشای جمعه',
    virtueFa: 'کفاره گناهان بین دو جمعه و ثبت پاداش به شمار نمازگزاران جمعه.',
    hadithSourceFa: 'امام باقر (ع): قرائت سوره جمعه در شب و روز جمعه از اعمال مؤکد شیعیان است.',
    parhizgarSurahUrl: 'https://server8.mp3quran.net/afs/062.mp3',
  },
  {
    number: 97,
    nameFa: 'سوره مبارکه قدر',
    shortLabel: 'قدر (عصر پنجشنبه و صبح)',
    ayahCount: 5,
    bestTimeFa: 'بعد از نماز صبح (۱۰ مرتبه)، عصر پنجشنبه و بر مزار والدین (۷ مرتبه)',
    virtueFa: 'آرامش روح والدین، ایمنی از هراس و برآورده شدن حاجات.',
    hadithSourceFa: 'امام رضا (ع): هر کس بر مزار مؤمنی ۷ بار سوره قدر بخواند، خداوند او و صاحب قبر را می‌آمرزد.',
    parhizgarSurahUrl: 'https://server8.mp3quran.net/afs/097.mp3',
  },
  {
    number: 112,
    nameFa: 'سوره مبارکه توحید (اخلاص)',
    shortLabel: 'توحید (نسبت پروردگار)',
    ayahCount: 4,
    bestTimeFa: 'بعد از هر نماز، هنگام خروج از منزل (۶ مرتبه) و پیش از خواب (۳ مرتبه)',
    virtueFa: 'معادل ثلث قرآن کریم و حصار امن الهی از صبح تا شب.',
    hadithSourceFa: 'پیامبر اکرم (ص): قرائت سوره توحید معادل یک‌سوم قرآن است.',
    parhizgarSurahUrl: 'https://server8.mp3quran.net/afs/112.mp3',
  },
];

const AYAHS_PER_MUSHAF_PAGE = 10;

export function QuranAndMuhasabaModal({ initialMode = 'quran', onClose, onUpdated }: Props) {
  const { theme } = useTheme();
  const [mode, setMode] = useState<'quran' | 'muhasaba'>(initialMode);
  const [qState, setQState] = useState(() => loadQuranContinuity());
  const [ayahs, setAyahs] = useState<QuranAyahItem[]>([]);
  const [loadingSurah, setLoadingSurah] = useState(false);
  const [isPlayingParhizgar, setIsPlayingParhizgar] = useState(false);
  const [playingAyahNumber, setPlayingAyahNumber] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef<boolean>(false);

  const [selectedAnchor, setSelectedAnchor] = useState<'maghrib' | 'fajr' | 'dhuhr' | 'custom'>('maghrib');
  const [offsetMinutes, setOffsetMinutes] = useState<number>(30);
  const [customTime, setCustomTime] = useState<string>('21:00');

  const [entries, setEntries] = useState(() => loadMuhasabaEntries());
  const [mood, setMood] = useState<MuhasabaEntry['mood']>('peaceful');
  const [gratitude, setGratitude] = useState('');
  const [reflection, setReflection] = useState('');
  const [tomorrow, setTomorrow] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const currentSurah = CURATED_SURAHS.find((s) => s.number === qState.surahIndex) ?? CURATED_SURAHS[0];

  const stopSurahAudio = () => {
    isPlayingRef.current = false;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlayingParhizgar(false);
    setPlayingAyahNumber(null);
  };

  useEffect(() => {
    return () => {
      stopSurahAudio();
    };
  }, []);

  // بارگذاری متن ۱۰۰٪ کامل تمام آیات سوره (بدون پاس دادن آرایه کوتاه ۴ آیه‌ای)
  useEffect(() => {
    let active = true;
    stopSurahAudio();
    setLoadingSurah(true);
    fetchSurahAyahs(currentSurah.number).then((list) => {
      if (!active) return;
      setAyahs(list);
      setLoadingSurah(false);
    });
    return () => {
      active = false;
    };
  }, [currentSurah.number]);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3200);
  };

  const updateQuranPosition = (surahNumber: number, ayahNumber: number) => {
    const meta = CURATED_SURAHS.find((s) => s.number === surahNumber) ?? CURATED_SURAHS[0];
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

  // پخش ترتیل آیه‌به‌آیه و پیوسته با صدای استاد شهریار پرهیزگار (EveryAyah Parhizgar_48kbps)
  const playParhizgarFromAyah = (startAyah: number) => {
    if (isPlayingParhizgar) {
      stopSurahAudio();
      return;
    }
    stopSurahAudio();
    isPlayingRef.current = true;
    setIsPlayingParhizgar(true);

    const sPad = String(currentSurah.number).padStart(3, '0');
    const playNextAyah = (ayahNum: number) => {
      if (!isPlayingRef.current || ayahNum > currentSurah.ayahCount) {
        stopSurahAudio();
        return;
      }
      setPlayingAyahNumber(ayahNum);
      updateQuranPosition(currentSurah.number, ayahNum);
      const aPad = String(ayahNum).padStart(3, '0');
      const parhizgarUrl = 'https://everyayah.com/data/Parhizgar_48kbps/' + sPad + aPad + '.mp3';
      const player = new Audio(parhizgarUrl);
      audioRef.current = player;
      player.onended = () => {
        playNextAyah(ayahNum + 1);
      };
      player.onerror = () => {
        // Fallback to full surah stream if single verse fails
        const fb = new Audio(currentSurah.parhizgarSurahUrl);
        audioRef.current = fb;
        fb.onended = () => stopSurahAudio();
        fb.onerror = () => {
          stopSurahAudio();
          showToast('برای پخش صوت ترتیل استاد پرهیزگار، اتصال اینترنت را بررسی کنید.');
        };
        void fb.play();
      };
      void player.play().catch(() => {
        stopSurahAudio();
      });
    };

    playNextAyah(startAyah);
  };

  const handleScheduleSurahReminder = async () => {
    const city = getCityById(getGuestCityId());
    const pTimes = calculatePrayerTimes(new Date(), city.lat, city.lng, city.timezone, 'tehran');

    let targetTime = customTime;
    let timeDesc = 'ساعت ' + toFaDigits(customTime);

    if (selectedAnchor === 'maghrib') {
      targetTime = addMinutesToTimeStr(pTimes.maghrib, offsetMinutes);
      timeDesc = toFaDigits(offsetMinutes) + ' دقیقه بعد از اذان مغرب (' + toFaDigits(targetTime) + ')';
    } else if (selectedAnchor === 'fajr') {
      targetTime = addMinutesToTimeStr(pTimes.fajr, offsetMinutes);
      timeDesc = toFaDigits(offsetMinutes) + ' دقیقه بعد از اذان صبح (' + toFaDigits(targetTime) + ')';
    } else if (selectedAnchor === 'dhuhr') {
      targetTime = addMinutesToTimeStr(pTimes.dhuhr, offsetMinutes);
      timeDesc = toFaDigits(offsetMinutes) + ' دقیقه بعد از اذان ظهر (' + toFaDigits(targetTime) + ')';
    }

    const title = '📖 تلاوت ' + currentSurah.nameFa;
    const body = 'وقت انس روزانه با قرآن (' + timeDesc + ') — ' + currentSurah.virtueFa;

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

    showToast('🔔 یادآور «' + currentSurah.nameFa + '» برای ' + timeDesc + ' کوک شد!');
    onUpdated?.();
  };

  const handleBookmark = (ayah: QuranAyahItem) => {
    const next = {
      ...qState,
      bookmarks: [
        { surahNameFa: currentSurah.nameFa, ayahNumber: ayah.number, note: ayah.translationFa.slice(0, 50) },
        ...qState.bookmarks,
      ].slice(0, 30),
    };
    setQState(next);
    saveQuranContinuity(next);
    showToast('🔖 آیه ' + toFaDigits(ayah.number) + ' ' + currentSurah.nameFa + ' نشانک‌گذاری شد.');
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

  const safeAyahIdx = Math.max(0, Math.min(ayahs.length - 1, qState.ayahNumber - 1));
  const currentPageIndex = Math.floor(safeAyahIdx / AYAHS_PER_MUSHAF_PAGE);
  const totalPages = Math.max(1, Math.ceil(ayahs.length / AYAHS_PER_MUSHAF_PAGE));
  const visibleAyahs = ayahs.slice(currentPageIndex * AYAHS_PER_MUSHAF_PAGE, (currentPageIndex + 1) * AYAHS_PER_MUSHAF_PAGE);

  const node = (
    <div
      className="fixed inset-0 z-[999] overflow-y-auto flex items-stretch sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.86)', backdropFilter: 'blur(7px)' }}
      dir="rtl"
    >
      <div
        className="w-full sm:max-w-lg min-h-[100dvh] sm:min-h-0 sm:rounded-3xl p-4 sm:p-5 border-0 sm:border shadow-2xl overflow-y-auto"
        style={{ background: theme.surface, borderColor: theme.border }}
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-2">
            <BookOpen size={19} color={theme.primary} />
            <h2 className="text-base font-black text-app">سوره‌های مجرب قرآن (با صوت استاد پرهیزگار)</h2>
          </div>
          <button
            type="button"
            onClick={() => {
              stopSurahAudio();
              onClose();
            }}
            className="text-muted p-1"
          >
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
          style={{ background: 'color-mix(in srgb, ' + theme.primary + ' 10%, transparent)' }}
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
            <BookOpen size={14} /> سوره‌های منتخب و مصحف
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
            {/* ۱. انتخاب سریع از بین ۹ سوره مجرب روزانه و شبانه */}
            <div className="card-flat p-3 space-y-2">
              <span className="text-[11px] font-bold text-muted block">انتخاب سوره مجرب (پس از نماز، روزانه یا شب جمعه):</span>
              <div className="flex flex-wrap gap-1.5">
                {CURATED_SURAHS.map((s) => {
                  const active = currentSurah.number === s.number;
                  return (
                    <button
                      key={s.number}
                      type="button"
                      onClick={() => updateQuranPosition(s.number, 1)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all"
                      style={{
                        borderColor: active ? theme.primary : theme.border,
                        background: active ? theme.primary : 'transparent',
                        color: active ? theme.bg : theme.textMuted,
                      }}
                    >
                      {s.shortLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ۲. کارت فضیلت، ثمره و بهترین زمان قرائت سوره انتخاب‌شده */}
            <div
              className="rounded-2xl p-3.5 border space-y-1.5"
              style={{
                background: 'radial-gradient(circle at top right, color-mix(in srgb, ' + theme.accent + ' 16%, transparent), ' + theme.surface + ')',
                borderColor: 'color-mix(in srgb, ' + theme.accent + ' 45%, ' + theme.border + ')',
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-primary">✨ فضیلت و اثر {currentSurah.nameFa}:</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg" style={{ background: 'color-mix(in srgb, ' + theme.primary + ' 16%, transparent)', color: theme.primary }}>
                  {toFaDigits(currentSurah.ayahCount)} آیه کامل
                </span>
              </div>
              <p className="text-xs font-bold text-app leading-relaxed">{currentSurah.virtueFa}</p>
              <p className="text-[11px] text-accent font-bold">⏰ بهترین زمان تلاوت: {currentSurah.bestTimeFa}</p>
              <p className="text-[11px] text-muted leading-relaxed">📚 {currentSurah.hadithSourceFa}</p>
            </div>

            {/* ۳. پلیر ترتیل کامل با صدای استاد شهریار پرهیزگار */}
            <div
              className="p-3 rounded-2xl border flex items-center justify-between gap-2"
              style={{
                borderColor: isPlayingParhizgar ? theme.accent : theme.primary,
                background: 'color-mix(in srgb, ' + theme.primary + ' 12%, transparent)',
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Volume2 className="shrink-0" color={theme.primary} size={18} />
                <div className="min-w-0">
                  <p className="text-xs font-black text-app truncate">
                    🎙️ ترتیل استاد شهریار پرهیزگار — {currentSurah.nameFa}
                  </p>
                  <p className="text-[10px] text-muted truncate">
                    {isPlayingParhizgar
                      ? 'ılılı در حال تلاوت آیه ' + toFaDigits(playingAyahNumber ?? qState.ayahNumber) + ' از ' + toFaDigits(currentSurah.ayahCount)
                      : 'پخش صوتی کامل و آیه‌به‌آیه همراه با متن مصحف'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => playParhizgarFromAyah(visibleAyahs[0]?.number ?? 1)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-md"
                style={{
                  background: isPlayingParhizgar ? '#ef4444' : theme.primary,
                  color: isPlayingParhizgar ? '#ffffff' : theme.bg,
                }}
              >
                {isPlayingParhizgar ? <Square size={12} /> : <Play size={12} />}
                <span>{isPlayingParhizgar ? 'توقف ترتیل' : 'پخش صوت پرهیزگار'}</span>
              </button>
            </div>

            {/* ۴. قاب مصحف شریف با رسم‌الخط عثمان طه در نیمه پایین صفحه (min-h-[50vh]) */}
            <div
              className="rounded-3xl p-4 border-2 flex flex-col justify-between min-h-[50vh]"
              style={{
                background: 'radial-gradient(circle at top, color-mix(in srgb, ' + theme.primary + ' 14%, transparent), ' + theme.bg + ')',
                borderColor: theme.primary,
                boxShadow: 'inset 0 0 28px rgba(16, 185, 129, 0.08)',
              }}
            >
              <div className="flex items-center justify-between text-xs pb-2.5 mb-2 border-b" style={{ borderColor: theme.border }}>
                <span className="font-black text-primary">{currentSurah.nameFa}</span>
                <span className="text-muted font-bold">
                  صفحه {toFaDigits(currentPageIndex + 1)} از {toFaDigits(totalPages)} (کل: {toFaDigits(ayahs.length)} آیه)
                </span>
              </div>

              {loadingSurah ? (
                <div className="py-16 text-center text-xs text-muted">در حال بارگذاری متن کامل سوره با خط عثمان طه...</div>
              ) : (
                <div className="space-y-4 my-auto">
                  {currentPageIndex === 0 && currentSurah.number !== 1 && currentSurah.number !== 9 && (
                    <p className="quran-mushaf-text text-center text-2xl font-bold text-primary py-1">
                      بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                    </p>
                  )}
                  <div
                    className="p-4 rounded-2xl border text-justify dir-rtl"
                    style={{
                      background: 'color-mix(in srgb, ' + theme.surface + ' 92%, transparent)',
                      borderColor: theme.border,
                    }}
                  >
                    <p className="quran-mushaf-text text-[22px] font-bold text-app">
                      {visibleAyahs.map((a) => {
                        const isAyahPlaying = playingAyahNumber === a.number;
                        return (
                          <span
                            key={a.number}
                            onClick={() => updateQuranPosition(currentSurah.number, a.number)}
                            className="inline cursor-pointer rounded px-0.5 transition-colors"
                            style={{
                              background: isAyahPlaying ? 'color-mix(in srgb, ' + theme.accent + ' 25%, transparent)' : 'transparent',
                            }}
                          >
                            {a.arabic}{' '}
                            <span
                              className="inline-flex items-center justify-center px-1.5 py-0.5 mx-1 rounded-full text-xs font-bold"
                              style={{
                                background: 'color-mix(in srgb, ' + theme.primary + ' 22%, transparent)',
                                color: theme.primary,
                              }}
                            >
                              ﴿{toFaDigits(a.number)}﴾
                            </span>{' '}
                          </span>
                        );
                      })}
                    </p>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1 pt-1">
                    <p className="text-[11px] font-bold text-primary">ترجمه روان فارسی آیات این صفحه:</p>
                    {visibleAyahs.map((a) => (
                      <div
                        key={a.number}
                        className="text-xs text-muted leading-relaxed border-b pb-1.5"
                        style={{ borderColor: theme.border }}
                      >
                        <strong className="text-accent ml-1">({toFaDigits(a.number)})</strong>
                        <span>{a.translationFa}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t" style={{ borderColor: theme.border }}>
                <button
                  type="button"
                  disabled={currentPageIndex === 0}
                  onClick={() => {
                    const prevStart = Math.max(1, (currentPageIndex - 1) * AYAHS_PER_MUSHAF_PAGE + 1);
                    updateQuranPosition(currentSurah.number, prevStart);
                  }}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1 border disabled:opacity-40"
                  style={{ borderColor: theme.border, color: theme.text }}
                >
                  <ChevronRight size={15} />
                  <span>صفحه قبل</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (visibleAyahs[0]) handleBookmark(visibleAyahs[0]);
                  }}
                  className="px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1"
                  style={{ background: 'color-mix(in srgb, ' + theme.accent + ' 16%, transparent)', color: theme.accent }}
                >
                  <Bookmark size={14} /> نشانک صفحه
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const nextStart =
                      (currentPageIndex + 1) * AYAHS_PER_MUSHAF_PAGE < ayahs.length
                        ? (currentPageIndex + 1) * AYAHS_PER_MUSHAF_PAGE + 1
                        : 1;
                    updateQuranPosition(currentSurah.number, nextStart);
                  }}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1"
                  style={{ background: theme.primary, color: theme.bg }}
                >
                  <span>صفحه بعد</span>
                  <ChevronLeft size={15} />
                </button>
              </div>
            </div>

            <div
              className="card-flat p-3.5 space-y-2.5 border"
              style={{ borderColor: 'color-mix(in srgb, ' + theme.accent + ' 40%, ' + theme.border + ')' }}
            >
              <div className="flex items-center gap-1.5">
                <BellRing size={15} color={theme.accent} />
                <span className="text-xs font-black text-app">
                  کوک یادآور روزانه «{currentSurah.nameFa}» پس از اذان:
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
                      background: selectedAnchor === anc.id ? 'color-mix(in srgb, ' + theme.accent + ' 18%, transparent)' : 'transparent',
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
                          background: offsetMinutes === min ? theme.primary : 'color-mix(in srgb, ' + theme.primary + ' 12%, transparent)',
                          color: offsetMinutes === min ? theme.bg : theme.textMuted,
                        }}
                      >
                        {min === 30 ? 'نیم ساعت بعد' : toFaDigits(min) + ' دقیقه بعد'}
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
                <span>کوک یادآور {currentSurah.nameFa}</span>
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
          onClick={() => {
            stopSurahAudio();
            onClose();
          }}
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
