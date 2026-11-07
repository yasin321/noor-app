import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Heart, Bookmark, ChevronRight, ChevronLeft, Check, X, Sparkles, Lock, BellRing, Play, Square, Volume2, Gauge } from 'lucide-react';
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

export interface SelectedSurahInfo {
  number: number;
  nameFa: string;
  shortLabel: string;
  revelationPlace: 'مکی' | 'مدنی';
  revelationIcon: string;
  ayahCount: number;
  bestTimeFa: string;
  virtueFa: string;
  hadithSourceFa: string;
  parhizgarSurahUrl: string;
}

export const CURATED_SURAHS: SelectedSurahInfo[] = [
  {
    number: 56,
    nameFa: 'سوره مبارکه واقعه',
    shortLabel: 'واقعه',
    revelationPlace: 'مکی',
    revelationIcon: '🕋',
    ayahCount: 96,
    bestTimeFa: 'هر شب پس از نماز مغرب و عشاء',
    virtueFa: 'امان از تنگدستی، گشایش روزی حلال و بی‌نیازی در دنیا.',
    hadithSourceFa: 'امام صادق (ع): هر کس هر شب پیش از خواب سوره واقعه را بخواند، هرگز محتاج نمی‌شود.',
    parhizgarSurahUrl: 'https://server8.mp3quran.net/afs/056.mp3',
  },
  {
    number: 36,
    nameFa: 'سوره مبارکه یس',
    shortLabel: 'یس (قلب قرآن)',
    revelationPlace: 'مکی',
    revelationIcon: '🕋',
    ayahCount: 83,
    bestTimeFa: 'پس از نماز صبح و شب‌های جمعه',
    virtueFa: 'قلب قرآن؛ خواندن آن در آغاز روز موجب شادی، حفاظت الهی و روا شدن حاجات است.',
    hadithSourceFa: 'پیامبر اکرم (ص): قلب قرآن سوره یس است؛ هر کس در آغاز روز آن را بخواند تا شب در فرح و خیر است.',
    parhizgarSurahUrl: 'https://server8.mp3quran.net/afs/036.mp3',
  },
  {
    number: 67,
    nameFa: 'سوره مبارکه ملک (تبارک)',
    shortLabel: 'ملک (تبارک)',
    revelationPlace: 'مکی',
    revelationIcon: '🕋',
    ayahCount: 30,
    bestTimeFa: 'هر شب پیش از خواب یا بعد از عشاء',
    virtueFa: 'سوره مانعه و منجیه؛ آرامش در خواب، حفظ در پناه الهی و هدیه نورانی برای والدین.',
    hadithSourceFa: 'امام باقر (ع): سوره ملک قاری خود را در دنیا و آخرت در پناه رحمت خدا قرار می‌دهد.',
    parhizgarSurahUrl: 'https://server8.mp3quran.net/afs/067.mp3',
  },
  {
    number: 55,
    nameFa: 'سوره مبارکه الرحمن',
    shortLabel: 'الرحمن (عروس)',
    revelationPlace: 'مدنی',
    revelationIcon: '🕌',
    ayahCount: 78,
    bestTimeFa: 'پس از نماز صبح و روزهای جمعه',
    virtueFa: 'عروس قرآن؛ شکرگزاری بر نعمت‌های الهی، صفای دل و گشایش در برکات مادی و معنوی.',
    hadithSourceFa: 'امام صادق (ع): از خواندن سوره الرحمن و قیام به آن غفلت نکنید.',
    parhizgarSurahUrl: 'https://server8.mp3quran.net/afs/055.mp3',
  },
  {
    number: 51,
    nameFa: 'سوره مبارکه ذاریات',
    shortLabel: 'ذاریات (رزق)',
    revelationPlace: 'مکی',
    revelationIcon: '🕋',
    ayahCount: 60,
    bestTimeFa: 'هر روز پس از نماز صبح یا ظهر',
    virtueFa: 'اصلاح امر معاش، برکت در کسب‌وکار و روزی فراوان از فضل پروردگار.',
    hadithSourceFa: 'امام صادق (ع): هر کس در روز یا شب سوره ذاریات را بخواند، خداوند معیشت او را اصلاح فرماید.',
    parhizgarSurahUrl: 'https://server8.mp3quran.net/afs/051.mp3',
  },
  {
    number: 37,
    nameFa: 'سوره مبارکه صافات',
    shortLabel: 'صافات (جمعه)',
    revelationPlace: 'مکی',
    revelationIcon: '🕋',
    ayahCount: 182,
    bestTimeFa: 'روزهای جمعه (صبح یا ظهر جمعه)',
    virtueFa: 'ایمنی از آفات و بلایا، وسعت روزی در دنیا و حفظ خانواده از هر گزند.',
    hadithSourceFa: 'امام صادق (ع): هر کس در روز جمعه سوره صافات را بخواند، در دنیا به او روزی فراوان عطا می‌شود.',
    parhizgarSurahUrl: 'https://server8.mp3quran.net/afs/037.mp3',
  },
  {
    number: 62,
    nameFa: 'سوره مبارکه جمعه',
    shortLabel: 'جمعه',
    revelationPlace: 'مدنی',
    revelationIcon: '🕌',
    ayahCount: 11,
    bestTimeFa: 'شب و روز جمعه و نماز صبح و عشاء',
    virtueFa: 'کفاره گناهان بین دو جمعه و ثبت پاداش به شمار نمازگزاران جمعه.',
    hadithSourceFa: 'امام باقر (ع): قرائت سوره جمعه در شب و روز جمعه از اعمال مؤکد است.',
    parhizgarSurahUrl: 'https://server8.mp3quran.net/afs/062.mp3',
  },
  {
    number: 97,
    nameFa: 'سوره مبارکه قدر',
    shortLabel: 'قدر (انا انزلناه)',
    revelationPlace: 'مکی',
    revelationIcon: '🕋',
    ayahCount: 5,
    bestTimeFa: 'بعد از نماز صبح و عصر پنجشنبه',
    virtueFa: 'آرامش روح والدین، ایمنی از هراس و برآورده شدن حاجات.',
    hadithSourceFa: 'امام رضا (ع): هر کس بر مزار مؤمنی ۷ بار سوره قدر بخواند، خداوند او و صاحب قبر را می‌آمرزد.',
    parhizgarSurahUrl: 'https://server8.mp3quran.net/afs/097.mp3',
  },
  {
    number: 112,
    nameFa: 'سوره مبارکه توحید',
    shortLabel: 'توحید (اخلاص)',
    revelationPlace: 'مکی',
    revelationIcon: '🕋',
    ayahCount: 4,
    bestTimeFa: 'بعد از هر نماز و هنگام خروج از منزل (۶ بار)',
    virtueFa: 'معادل ثلث قرآن کریم و حصار امن الهی از صبح تا شب.',
    hadithSourceFa: 'پیامبر اکرم (ص): قرائت سوره توحید معادل یک‌سوم قرآن است.',
    parhizgarSurahUrl: 'https://server8.mp3quran.net/afs/112.mp3',
  },
];

const AYAHS_PER_MUSHAF_PAGE = 10;
// تعداد آیات ۱۱۴ سوره برای محاسبه شماره آیه کل قرآن در CDN جهانی
const SURAH_AYAH_COUNTS = [
  7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,
  112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,
  54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,
  14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,
  29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,
  11,8,3,9,5,4,7,3,6,3,5,4,5,6
];

function getGlobalAyahNumber(surahNumber: number, ayahInSurah: number): number {
  let offset = 0;
  for (let i = 0; i < surahNumber - 1; i++) {
    offset += SURAH_AYAH_COUNTS[i] || 0;
  }
  return offset + ayahInSurah;
}
const PLAYBACK_SPEEDS = [1, 1.25, 1.5, 2, 3];

// حذف ۱۰۰٪ بسم‌الله تکراری از ابتدای آیه ۱ در تمام رسم‌الخط‌ها (عثمان طه و استاندارد)
function stripLeadingBasmala(arabicText: string, surahNum: number, ayahNum: number): string {
  if (surahNum === 1 || surahNum === 9 || ayahNum !== 1) return arabicText;
  let cleaned = arabicText.trim();
  const words = cleaned.split(/\s+/);
  if (words.length > 4 && (words[0].includes('بِسْمِ') || words[0].includes('بسم')) && (words[3].includes('الرَّحِيمِ') || words[3].includes('ٱلرَّحِيمِ'))) {
    cleaned = words.slice(4).join(' ').trim();
  }
  return cleaned;
}

export function QuranAndMuhasabaModal({ initialMode = 'quran', onClose, onUpdated }: Props) {
  const { theme } = useTheme();
  const [mode, setMode] = useState<'quran' | 'bookmarks' | 'muhasaba'>(initialMode);
  const [qState, setQState] = useState(() => loadQuranContinuity());
  const [ayahs, setAyahs] = useState<QuranAyahItem[]>([]);
  const [loadingSurah, setLoadingSurah] = useState(false);
  const [isPlayingParhizgar, setIsPlayingParhizgar] = useState(false);
  const [playingAyahNumber, setPlayingAyahNumber] = useState<number | null>(null);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadAudioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const playbackRateRef = useRef<number>(1);
  const longPressTimerRef = useRef<number | null>(null);

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
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      try { audioRef.current.pause(); } catch {}
    }
    setIsPlayingParhizgar(false);
    setPlayingAyahNumber(null);
  };

  useEffect(() => {
    return () => {
      stopSurahAudio();
    };
  }, []);

  useEffect(() => {
    let active = true;
    stopSurahAudio();
    setLoadingSurah(true);
    fetchSurahAyahs(currentSurah.number).then((list) => {
      if (!active) return;
      const cleaned = list.map((item) => ({
        ...item,
        arabic: stripLeadingBasmala(item.arabic, currentSurah.number, item.number),
      }));
      setAyahs(cleaned);
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

  const handleChangeSpeed = (nextSpeed: number) => {
    setPlaybackRate(nextSpeed);
    playbackRateRef.current = nextSpeed;
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const updateQuranPosition = (surahNumber: number, ayahNumber: number) => {
    const meta = CURATED_SURAHS.find((s) => s.number === surahNumber) ?? CURATED_SURAHS[0];
    setQState((prev) => {
      const next = {
        ...prev,
        surahIndex: meta.number,
        surahNameFa: meta.nameFa,
        ayahNumber: Math.max(1, ayahNumber),
        totalAyahs: meta.ayahCount,
        lastReadIso: new Date().toISOString(),
      };
      saveQuranContinuity(next);
      return next;
    });
    onUpdated?.();
  };

    const togglePlayParhizgar = (startAyah: number) => {
    if (isPlayingRef.current || isPlayingParhizgar) {
      stopSurahAudio();
      return;
    }
    stopSurahAudio();
    isPlayingRef.current = true;
    setIsPlayingParhizgar(true);

    // استفاده از یک عنصر صوتی واحد که با کلیک کاربر Unlock می‌شود تا اندروید هرگز آیات بعدی را بلاک نکند
    const player = audioRef.current ?? new Audio();
    audioRef.current = player;
    const sPad = String(currentSurah.number).padStart(3, '0');

    const getCandidateUrls = (ayahNum: number): string[] => {
      const aPad = String(ayahNum).padStart(3, '0');
      const globalNum = getGlobalAyahNumber(currentSurah.number, ayahNum);
      const list: string[] = [];
      // ۱. اگر آیه اول سوره‌های باندل‌شده آفلاین است، اول فایل آفلاین داخل گوشی هم امتحان شود
      if (ayahNum === 1) {
        const localMap: Record<number, string> = {
          56: '/adhans/post_waqiah.mp3',
          36: '/adhans/post_yasin.mp3',
          67: '/adhans/post_mulk.mp3',
          51: '/adhans/post_dhariyat.mp3',
          37: '/adhans/post_saffat.mp3',
          55: '/adhans/post_rahman.mp3',
        };
        if (localMap[currentSurah.number]) list.push(localMap[currentSurah.number]);
      }
      // ۲. سرور استاد شهریار پرهیزگار + سرور CDN پرسرعت جهانی (بدون قطعی در ایران)
      list.push('https://everyayah.com/data/Parhizgar_48kbps/' + sPad + aPad + '.mp3');
      list.push('https://cdn.islamic.network/quran/audio/128/ar.alafasy/' + globalNum + '.mp3');
      list.push('https://cdn.islamic.network/quran/audio/64/ar.abdulbasitmurattal/' + globalNum + '.mp3');
      list.push(currentSurah.parhizgarSurahUrl);
      return list;
    };

    const playAyahStep = (ayahNum: number, urlIndex = 0) => {
      if (!isPlayingRef.current || ayahNum > currentSurah.ayahCount) {
        stopSurahAudio();
        return;
      }
      const candidates = getCandidateUrls(ayahNum);
      if (urlIndex >= candidates.length) {
        stopSurahAudio();
        showToast('لطفاً اتصال اینترنت را برای پخش صوت کامل سوره بررسی کنید.');
        return;
      }

      setPlayingAyahNumber(ayahNum);
      updateQuranPosition(currentSurah.number, ayahNum);

      setTimeout(() => {
        const el = document.getElementById('mushaf-ayah-' + ayahNum);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);

      const targetUrl = candidates[urlIndex];
      const isFullSurahStream = targetUrl === currentSurah.parhizgarSurahUrl;

      player.onended = null;
      player.onerror = null;
      player.src = targetUrl;
      player.playbackRate = playbackRateRef.current;

      player.onended = () => {
        if (!isPlayingRef.current) return;
        if (isFullSurahStream) {
          stopSurahAudio();
        } else {
          playAyahStep(ayahNum + 1, 0);
        }
      };

      player.onerror = () => {
        if (!isPlayingRef.current) return;
        playAyahStep(ayahNum, urlIndex + 1);
      };

      player.play().catch(() => {
        if (!isPlayingRef.current) return;
        playAyahStep(ayahNum, urlIndex + 1);
      });
    };

    playAyahStep(startAyah, 0);
  };

  const handleToggleBookmarkAyah = (ayah: QuranAyahItem) => {
    const exists = qState.bookmarks.some(
      (b) => b.surahNameFa === currentSurah.nameFa && b.ayahNumber === ayah.number
    );
    if (exists) {
      const filtered = qState.bookmarks.filter(
        (b) => !(b.surahNameFa === currentSurah.nameFa && b.ayahNumber === ayah.number)
      );
      const next = { ...qState, bookmarks: filtered };
      setQState(next);
      saveQuranContinuity(next);
      showToast('نشانک آیه ' + toFaDigits(ayah.number) + ' برداشته شد.');
      onUpdated?.();
      return;
    }
    if ('vibrate' in navigator) navigator.vibrate?.(25);
    const next = {
      ...qState,
      bookmarks: [
        {
          surahNumber: currentSurah.number,
          surahNameFa: currentSurah.nameFa,
          ayahNumber: ayah.number,
          arabic: ayah.arabic,
          note: ayah.translationFa.slice(0, 80),
        },
        ...qState.bookmarks,
      ].slice(0, 40),
    };
    setQState(next);
    saveQuranContinuity(next);
    showToast('🔖 آیه ' + toFaDigits(ayah.number) + ' «' + currentSurah.nameFa + '» در نشانک‌ها ذخیره شد!');
    onUpdated?.();
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
          className="grid grid-cols-3 gap-1 p-1 rounded-2xl mb-3.5"
          style={{ background: 'color-mix(in srgb, ' + theme.primary + ' 10%, transparent)' }}
        >
          <button
            type="button"
            onClick={() => setMode('quran')}
            className="py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1"
            style={{
              background: mode === 'quran' ? theme.primary : 'transparent',
              color: mode === 'quran' ? theme.bg : theme.textMuted,
            }}
          >
            <BookOpen size={13} /> سوره‌ها و مصحف
          </button>
          <button
            type="button"
            onClick={() => setMode('bookmarks')}
            className="py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1"
            style={{
              background: mode === 'bookmarks' ? theme.accent : 'transparent',
              color: mode === 'bookmarks' ? theme.bg : theme.accent,
            }}
          >
            <Bookmark size={13} /> نشانک‌ها ({toFaDigits(qState.bookmarks.length)})
          </button>
          <button
            type="button"
            onClick={() => setMode('muhasaba')}
            className="py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1"
            style={{
              background: mode === 'muhasaba' ? theme.primary : 'transparent',
              color: mode === 'muhasaba' ? theme.bg : theme.textMuted,
            }}
          >
            <Heart size={13} /> محاسبه نفس
          </button>
        </div>

        {mode === 'quran' ? (
          <div className="space-y-3.5">
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[11px] font-bold text-muted">انتخاب سوره (🕋 = مکی · 🕌 = مدنی):</span>
                <span className="text-[10px] font-bold text-primary">لمس ﴿۱﴾ یا 🔖 = ذخیره در نشانک‌ها</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {CURATED_SURAHS.map((s) => {
                  const active = currentSurah.number === s.number;
                  return (
                    <button
                      key={s.number}
                      type="button"
                      onClick={() => updateQuranPosition(s.number, 1)}
                      className="p-2.5 rounded-2xl border text-right transition-all flex flex-col justify-between relative overflow-hidden"
                      style={{
                        borderColor: active ? theme.primary : theme.border,
                        background: active
                          ? 'radial-gradient(circle at top left, color-mix(in srgb, ' + theme.primary + ' 26%, ' + theme.surface + '), ' + theme.surface + ')'
                          : theme.bg,
                        boxShadow: active ? '0 6px 18px color-mix(in srgb, ' + theme.primary + ' 18%, transparent)' : undefined,
                      }}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-sm" title={s.revelationPlace}>{s.revelationIcon}</span>
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                          style={{
                            background: s.revelationPlace === 'مکی' ? 'rgba(245,158,11,0.16)' : 'rgba(16,185,129,0.16)',
                            color: s.revelationPlace === 'مکی' ? '#fbbf24' : '#34d399',
                          }}
                        >
                          {s.revelationPlace} · {toFaDigits(s.ayahCount)}
                        </span>
                      </div>
                      <p className="text-xs font-black text-app truncate">{s.shortLabel}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              className="rounded-2xl p-3.5 border space-y-1.5"
              style={{
                background: 'radial-gradient(circle at top right, color-mix(in srgb, ' + theme.accent + ' 16%, transparent), ' + theme.surface + ')',
                borderColor: 'color-mix(in srgb, ' + theme.accent + ' 45%, ' + theme.border + ')',
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-primary">
                  {currentSurah.revelationIcon} {currentSurah.nameFa} ({currentSurah.revelationPlace} — {toFaDigits(currentSurah.ayahCount)} آیه)
                </span>
                <span className="text-[10px] font-bold text-accent">⏰ {currentSurah.bestTimeFa}</span>
              </div>
              <p className="text-xs font-bold text-app leading-relaxed">{currentSurah.virtueFa}</p>
              <p className="text-[11px] text-muted leading-relaxed">📚 {currentSurah.hadithSourceFa}</p>
            </div>

            <div
              className="p-3 rounded-2xl border space-y-2.5"
              style={{
                borderColor: isPlayingParhizgar ? theme.accent : theme.primary,
                background: 'color-mix(in srgb, ' + theme.primary + ' 12%, transparent)',
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Volume2 className="shrink-0" color={theme.primary} size={18} />
                  <div className="min-w-0">
                    <p className="text-xs font-black text-app truncate">
                      🎙️ ترتیل استاد شهریار پرهیزگار
                    </p>
                    <p className="text-[10px] text-muted truncate">
                      {isPlayingParhizgar
                        ? 'ılılı در حال تلاوت آیه ' + toFaDigits(playingAyahNumber ?? qState.ayahNumber) + ' (ورق‌زدن خودکار فعال)'
                        : 'پخش فوری همراه با ورق‌زدن خودکار صفحه مصحف'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => togglePlayParhizgar(playingAyahNumber ?? visibleAyahs[0]?.number ?? 1)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-md"
                  style={{
                    background: isPlayingParhizgar ? '#ef4444' : theme.primary,
                    color: isPlayingParhizgar ? '#ffffff' : theme.bg,
                  }}
                >
                  {isPlayingParhizgar ? <Square size={12} /> : <Play size={12} />}
                  <span>{isPlayingParhizgar ? '⏹️ توقف فوری' : '▶️ پخش ترتیل'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t" style={{ borderColor: theme.border }}>
                <span className="text-[10px] font-bold text-muted flex items-center gap-1">
                  <Gauge size={12} color={theme.accent} /> سرعت پخش صوت:
                </span>
                <div className="flex gap-1" dir="ltr">
                  {PLAYBACK_SPEEDS.map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => handleChangeSpeed(spd)}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all"
                      style={{
                        background: playbackRate === spd ? theme.accent : 'color-mix(in srgb, ' + theme.primary + ' 10%, transparent)',
                        color: playbackRate === spd ? theme.bg : theme.textMuted,
                      }}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

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
                        const isBookmarked = qState.bookmarks.some(
                          (b) => b.surahNameFa === currentSurah.nameFa && b.ayahNumber === a.number
                        );
                        return (
                          <span
                            id={'mushaf-ayah-' + a.number}
                            key={a.number}
                            onClick={() => updateQuranPosition(currentSurah.number, a.number)}
                            onTouchStart={() => {
                              longPressTimerRef.current = window.setTimeout(() => {
                                handleToggleBookmarkAyah(a);
                              }, 550);
                            }}
                            onTouchEnd={() => {
                              if (longPressTimerRef.current) {
                                clearTimeout(longPressTimerRef.current);
                                longPressTimerRef.current = null;
                              }
                            }}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              handleToggleBookmarkAyah(a);
                            }}
                            className="inline cursor-pointer rounded-lg px-1 py-0.5 transition-all select-none"
                            style={{
                              background: isAyahPlaying
                                ? 'color-mix(in srgb, ' + theme.accent + ' 30%, transparent)'
                                : isBookmarked
                                ? 'color-mix(in srgb, ' + theme.primary + ' 20%, transparent)'
                                : 'transparent',
                            }}
                          >
                            {a.arabic}{' '}
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleBookmarkAyah(a);
                              }}
                              title="برای نشانک‌گذاری لمس کنید"
                              className="inline-flex items-center justify-center px-1.5 py-0.5 mx-1 rounded-full text-xs font-bold"
                              style={{
                                background: isBookmarked
                                  ? theme.accent
                                  : 'color-mix(in srgb, ' + theme.primary + ' 22%, transparent)',
                                color: isBookmarked ? theme.bg : theme.primary,
                              }}
                            >
                              ﴿{toFaDigits(a.number)}{isBookmarked ? '🔖' : ''}﴾
                            </span>{' '}
                          </span>
                        );
                      })}
                    </p>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1 pt-1">
                    <p className="text-[11px] font-bold text-primary">ترجمه روان فارسی آیات این صفحه (لمس 🔖 = ذخیره در نشانک‌ها):</p>
                    {visibleAyahs.map((a) => {
                      const isBookmarked = qState.bookmarks.some(
                        (b) => b.surahNameFa === currentSurah.nameFa && b.ayahNumber === a.number
                      );
                      return (
                        <div
                          key={a.number}
                          className="text-xs text-muted leading-relaxed border-b pb-1.5 flex items-start justify-between gap-2"
                          style={{ borderColor: theme.border }}
                        >
                          <div>
                            <strong className="text-accent ml-1">({toFaDigits(a.number)})</strong>
                            <span>{a.translationFa}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleBookmarkAyah(a)}
                            className="p-1 rounded-lg shrink-0"
                            style={{ color: isBookmarked ? theme.accent : theme.textMuted }}
                            title="ذخیره در نشانک‌ها"
                          >
                            <Bookmark size={14} fill={isBookmarked ? theme.accent : 'none'} />
                          </button>
                        </div>
                      );
                    })}
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
                    if (visibleAyahs[0]) handleToggleBookmarkAyah(visibleAyahs[0]);
                  }}
                  className="px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1"
                  style={{ background: 'color-mix(in srgb, ' + theme.accent + ' 16%, transparent)', color: theme.accent }}
                >
                  <Bookmark size={14} /> نشانک آیه
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
        ) : mode === 'bookmarks' ? (
          <div className="space-y-3">
            <div className="p-3 rounded-2xl border text-xs leading-relaxed" style={{ borderColor: theme.border, background: theme.bg }}>
              💡 برای ذخیره هر آیه در این بخش، هنگام مطالعه قرآن روی شماره آیه ﴿۱﴾ یا آیکون 🔖 کنار ترجمه بزنید (یا انگشت خود را روی آیه نگه دارید).
            </div>
            {qState.bookmarks.length === 0 ? (
              <div className="card-flat p-8 text-center space-y-2">
                <Bookmark size={32} color={theme.textMuted} className="mx-auto opacity-40" />
                <p className="text-xs font-bold text-app">هنوز آیه‌ای نشانک‌گذاری نکرده‌اید</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-0.5">
                {qState.bookmarks.map((bm, idx) => (
                  <div key={idx} className="card-flat p-4 space-y-2 border" style={{ borderColor: theme.primary }}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-primary">🔖 {bm.surahNameFa} — آیه {toFaDigits(bm.ayahNumber)}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const foundSurah = CURATED_SURAHS.find((s) => s.nameFa === bm.surahNameFa || s.number === bm.surahNumber);
                            if (foundSurah) {
                              updateQuranPosition(foundSurah.number, bm.ayahNumber);
                              setMode('quran');
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold"
                          style={{ background: theme.primary, color: theme.bg }}
                        >
                          رفتن به آیه ←
                        </button>
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
                          className="px-2 py-1 rounded-lg text-[10px] font-bold text-red-400 border"
                          style={{ borderColor: theme.border }}
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                    {bm.arabic && <p className="quran-mushaf-text text-xl font-bold text-app leading-loose">{bm.arabic}</p>}
                    <p className="text-xs text-muted leading-relaxed">{bm.note}</p>
                  </div>
                ))}
              </div>
            )}
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
