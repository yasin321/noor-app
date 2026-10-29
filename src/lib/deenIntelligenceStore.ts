export type SoundProfileId = 'home' | 'work' | 'travel';
export type PrayerAlarmMode = 'full_adhan' | 'short_10s' | 'short_beep' | 'silent';


export type PreAdhanChantId = 'tawashih_salawat' | 'quran_ayah' | 'dua_faraj' | 'istighfar_tasbih';

export interface PreAdhanChantOption {
  id: PreAdhanChantId;
  titleFa: string;
  categoryFa: string;
  arabicText: string;
  translationFa: string;
  audioAdhanId: string;
  durationSec: number;
}

export const PRE_ADHAN_CHANT_OPTIONS: PreAdhanChantOption[] = [
  {
    id: 'tawashih_salawat',
    titleFa: 'تواشیح کوتاه و صلوات ملکوتی',
    categoryFa: 'تواشیح و هم‌خوانی',
    arabicText: 'إِنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ ۚ اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَآلِ مُحَمَّدٍ',
    translationFa: 'آهنگ روح‌بخش تواشیح و صلوات برای آمادگی قلب و وضو پیش از وقت نماز',
    audioAdhanId: 'abdulbasit',
    durationSec: 12,
  },
  {
    id: 'quran_ayah',
    titleFa: 'آیه قرآنی کوتاه (اقامه نماز و آرامش دل)',
    categoryFa: 'ذکر قرآنی',
    arabicText: 'أَقِمِ الصَّلَاةَ لِدُلُوكِ الشَّمْسِ إِلَىٰ غَسَقِ اللَّيْلِ ۚ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    translationFa: 'نماز را به پا دار؛ آگاه باش که با یاد خدا دل‌ها آرام می‌گیرد',
    audioAdhanId: 'minshawi_egypt',
    durationSec: 10,
  },
  {
    id: 'dua_faraj',
    titleFa: 'دعای کوتاه فرج و عاقبت‌به‌خیری',
    categoryFa: 'دعای پیش از اذان',
    arabicText: 'اللَّهُمَّ كُنْ لِوَلِيِّكَ الْحُجَّةِ بْنِ الْحَسَنِ ❀ اللَّهُمَّ عَافِنَا وَاعْفُ عَنَّا وَتَقَبَّلْ مِنَّا',
    translationFa: 'دعای سلامتی حضرت ولی‌عصر (عج) و طلب عافیت پیش از حلول وقت اذان',
    audioAdhanId: 'aghati_mashhad',
    durationSec: 12,
  },
  {
    id: 'istighfar_tasbih',
    titleFa: 'استغفار و ذکر آماده شدن برای نماز',
    categoryFa: 'ذکر کوتاه',
    arabicText: 'أَسْتَغْفِرُ اللَّهَ رَبِّي وَأَتُوبُ إِلَيْهِ ❀ سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ وَلَا إِلَٰهَ إِلَّا اللَّهُ',
    translationFa: 'پاک شدن دل با استغفار و تسبیح پیش از ایستادن در محضر پروردگار',
    audioAdhanId: 'mahur_saeed',
    durationSec: 10,
  },
];

export interface PrayerStudioConfig {
  preChantId?: PreAdhanChantId;
  mode: PrayerAlarmMode;
  volumePercent: number; // 10 to 100
  preReminderMinutes: number; // 0, 10, 15, 30
  preDuaText: string;
  adhanId: string;
}

export interface AdhanStudioState {
  activeProfile: SoundProfileId;
  profiles: Record<SoundProfileId, {
    nameFa: string;
    badge: string;
    descriptionFa: string;
    prayers: Record<'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha', PrayerStudioConfig>;
  }>;
}

export interface QuranContinuityState {
  surahIndex: number;
  surahNameFa: string;
  ayahNumber: number;
  totalAyahs: number;
  dailyTargetMinutes: 5 | 15 | 30;
  todayReadMinutes: number;
  lastReadIso: string | null;
  bookmarks: Array<{ surahNameFa: string; ayahNumber: number; note: string }>;
}

export interface MosqueAndTravelState {
  travelModeEnabled: boolean;
  originCityId: string;
  destinationCityId: string;
  isQasrPrayer: boolean;
  selectedMosqueName: string;
  jamaatOffsetsMinutes: {
    fajr: number;
    dhuhr: number;
    maghrib: number;
  };
  mosqueAnnouncement: string;
}

export interface MuhasabaEntry {
  id: string;
  date: string;
  mood: 'peaceful' | 'grateful' | 'hopeful' | 'repentant';
  gratitudeNote: string;
  selfReflection: string;
  tomorrowIntention: string;
  createdAt: string;
}

export type RoutineBudgetMinutes = 2 | 5 | 15;

const STUDIO_KEY = 'noor_adhan_studio_v2';
const QURAN_KEY = 'noor_quran_continuity_v1';
const MOSQUE_TRAVEL_KEY = 'noor_mosque_travel_v1';
const MUHASABA_KEY = 'noor_muhasaba_journal_v1';
const ROUTINE_BUDGET_KEY = 'noor_routine_budget_min_v1';

export const PRE_ADHAN_DUAS: Record<'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha', string> = {
  fajr: 'اللَّهُمَّ لَا تُؤْمِنِّي مَكْرَكَ وَلَا تُنْسِنِي ذِكْرَكَ — آماده شدن برای نماز صبح',
  dhuhr: 'اللَّهُمَّ اجْعَلْ قَلْبِي بَارًّا وَعَيْشِي قَارًّا — دعای پیش از اذان ظهر و استجابت دعا',
  asr: 'أَسْتَغْفِرُ اللَّهَ الَّذِي لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ — استغفار پیش از وقت عصر',
  maghrib: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ بِإِقْبَالِ لَيْلِكَ وَإِدْبَارِ نَهَارِكَ — دعای غروب و پیش از اذان مغرب',
  isha: 'اللَّهُمَّ عَافِنَا وَاعْفُ عَنَّا وَتَقَبَّلْ مِنَّا — آمادگی برای نماز عشاء و آرامش شب',
};

const DEFAULT_STUDIO: AdhanStudioState = {
  activeProfile: 'home',
  profiles: {
    home: {
      nameFa: 'پروفایل خانه',
      badge: '🏠 خانه',
      descriptionFa: 'پخش کامل اذان برای نماز صبح، ظهر و مغرب + یادآوری دعای کوتاه ۱۰ دقیقه قبل',
      prayers: {
        fajr: { mode: 'full_adhan', volumePercent: 85, preReminderMinutes: 10, preDuaText: PRE_ADHAN_DUAS.fajr, adhanId: 'moazenzadeh_ardabili' },
        dhuhr: { mode: 'full_adhan', volumePercent: 90, preReminderMinutes: 10, preDuaText: PRE_ADHAN_DUAS.dhuhr, adhanId: 'mahur_saeed' },
        asr: { mode: 'short_10s', volumePercent: 65, preReminderMinutes: 0, preDuaText: PRE_ADHAN_DUAS.asr, adhanId: 'mahur_saeed' },
        maghrib: { mode: 'full_adhan', volumePercent: 95, preReminderMinutes: 15, preDuaText: PRE_ADHAN_DUAS.maghrib, adhanId: 'aghati_mashhad' },
        isha: { mode: 'short_10s', volumePercent: 60, preReminderMinutes: 0, preDuaText: PRE_ADHAN_DUAS.isha, adhanId: 'mahur_saeed' },
      },
    },
    work: {
      nameFa: 'پروفایل محل کار / جلسه',
      badge: '💼 محل کار',
      descriptionFa: 'پخش ۱۰ ثانیه اول اذان یا اعلان کوتاه با دعای آمادگی ۱۰ یا ۳۰ دقیقه قبل از اذان',
      prayers: {
        fajr: { mode: 'full_adhan', volumePercent: 80, preReminderMinutes: 10, preDuaText: PRE_ADHAN_DUAS.fajr, adhanId: 'mahur_saeed' },
        dhuhr: { mode: 'short_10s', volumePercent: 40, preReminderMinutes: 10, preDuaText: PRE_ADHAN_DUAS.dhuhr, adhanId: 'mahur_saeed' },
        asr: { mode: 'silent', volumePercent: 20, preReminderMinutes: 10, preDuaText: PRE_ADHAN_DUAS.asr, adhanId: 'mahur_saeed' },
        maghrib: { mode: 'short_10s', volumePercent: 50, preReminderMinutes: 15, preDuaText: PRE_ADHAN_DUAS.maghrib, adhanId: 'mahur_saeed' },
        isha: { mode: 'silent', volumePercent: 0, preReminderMinutes: 0, preDuaText: PRE_ADHAN_DUAS.isha, adhanId: 'mahur_saeed' },
      },
    },
    travel: {
      nameFa: 'پروفایل مسافرت',
      badge: '✈️ مسافرت',
      descriptionFa: 'هماهنگ با افق شهر مقصد، یادآوری نماز شکسته (قصر) و هشدار ۳۰ دقیقه قبل از وقت',
      prayers: {
        fajr: { mode: 'full_adhan', volumePercent: 90, preReminderMinutes: 30, preDuaText: PRE_ADHAN_DUAS.fajr, adhanId: 'mahur_saeed' },
        dhuhr: { mode: 'short_10s', volumePercent: 75, preReminderMinutes: 15, preDuaText: PRE_ADHAN_DUAS.dhuhr, adhanId: 'mahur_saeed' },
        asr: { mode: 'silent', volumePercent: 0, preReminderMinutes: 0, preDuaText: PRE_ADHAN_DUAS.asr, adhanId: 'mahur_saeed' },
        maghrib: { mode: 'full_adhan', volumePercent: 85, preReminderMinutes: 15, preDuaText: PRE_ADHAN_DUAS.maghrib, adhanId: 'mahur_saeed' },
        isha: { mode: 'silent', volumePercent: 0, preReminderMinutes: 0, preDuaText: PRE_ADHAN_DUAS.isha, adhanId: 'mahur_saeed' },
      },
    },
  },
};

export function loadAdhanStudio(): AdhanStudioState {
  try {
    const raw = localStorage.getItem(STUDIO_KEY);
    if (!raw) return DEFAULT_STUDIO;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STUDIO, ...parsed };
  } catch {
    return DEFAULT_STUDIO;
  }
}

export function saveAdhanStudio(state: AdhanStudioState): void {
  try {
    localStorage.setItem(STUDIO_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export const SELECTED_QURAN_PASSAGES = [
  {
    surahIndex: 56,
    surahNameFa: 'سوره مبارکه واقعه',
    totalAyahs: 96,
    ayahs: [
      { number: 1, arabic: 'إِذَا وَقَعَتِ الْوَاقِعَةُ', translationFa: 'هنگامی که آن واقعهٔ بزرگ (قیامت) رخ دهد،' },
      { number: 2, arabic: 'لَيْسَ لِوَقْعَتِهَا كَاذِبَةٌ', translationFa: 'هیچ انکاری در وقوع آن نیست.' },
      { number: 3, arabic: 'خَافِضَةٌ رَافِعَةٌ', translationFa: 'گروهی را فرود می‌آورد و گروهی را سرفراز می‌دارد؛' },
      { number: 4, arabic: 'إِذَا رُجَّتِ الْأَرْضُ رَجًّا', translationFa: 'آنگاه که زمین به شدت بلرزد،' },
      { number: 5, arabic: 'وَبُسَّتِ الْجِبَالُ بَسًّا', translationFa: 'و کوه‌ها متلاشی و ریزریز شوند،' },
      { number: 6, arabic: 'فَكَانَتْ هَبَاءً مُنْبَثًّا', translationFa: 'و همچون غباری پراکنده در هوا گردند،' },
      { number: 7, arabic: 'وَكُنْتُمْ أَزْوَاجًا ثَلَاثَةً', translationFa: 'و شما مردم سه گروه خواهید شد:' },
      { number: 8, arabic: 'فَأَصْحَابُ الْمَيْمَنَةِ مَا أَصْحَابُ الْمَيْمَنَةِ', translationFa: 'اصحاب یمین (سعادتمندان)، و چه والامقامند اصحاب یمین!' },
      { number: 9, arabic: 'وَأَصْحَابُ الْمَشْأَمَةِ مَا أَصْحَابُ الْمَشْأَمَةِ', translationFa: 'و اصحاب شمال (تیره‌بختان)، و چه بدروزگارند اصحاب شمال!' },
      { number: 10, arabic: 'وَالسَّابِقُونَ السَّابِقُونَ', translationFa: 'و پیشگامانِ در ایمان و نیکی که بر همه سبقت گرفتند،' },
      { number: 11, arabic: 'أُولَٰئِكَ الْمُقَرَّبُونَ', translationFa: 'آنان همان مقربان درگاه الهی‌اند،' },
      { number: 12, arabic: 'فِي جَنَّاتِ النَّعِيمِ', translationFa: 'در باغ‌های پرنعمت بهشت جای دارند.' },
    ],
  },
  {
    surahIndex: 51,
    surahNameFa: 'سوره مبارکه ذاریات',
    totalAyahs: 60,
    ayahs: [
      { number: 1, arabic: 'وَالذَّارِيَاتِ ذَرْوًا ۝ فَالْحَامِلَاتِ وِقْرًا', translationFa: 'سوگند به بادهایی که ابرها را به حرکت درمی‌آورند و ابرهایی که بار سنگین باران را حمل می‌کنند.' },
      { number: 2, arabic: 'إِنَّمَا تُوعَدُونَ لَصَادِقٌ ۝ وَإِنَّ الدِّينَ لَوَاقِعٌ', translationFa: 'به راستی آنچه به شما وعده داده می‌شود راست است و روز جزا بی‌تردید واقع شدنی است.' },
      { number: 3, arabic: 'وَمَا خَلَقْتُ الْجِنَّ وَالْإِنْسَ إِلَّا لِيَعْبُدُونِ', translationFa: 'و جن و انس را نیافریدم جز برای آنکه مرا بندگی کنند و به معرفت من رسند.' },
      { number: 4, arabic: 'إِنَّ اللَّهَ هُوَ الرَّزَّاقُ ذُو الْقُوَّةِ الْمَتِينُ', translationFa: 'همانا خداوند خود روزی‌دهنده و صاحب قدرت و استوار است.' },
    ],
  },
  {
    surahIndex: 36,
    surahNameFa: 'سوره مبارکه یس (قلب قرآن)',
    totalAyahs: 83,
    ayahs: [
      { number: 1, arabic: 'يس ۝ وَالْقُرْآنِ الْحَكِيمِ ۝ إِنَّكَ لَمِنَ الْمُرْسَلِينَ', translationFa: 'یاسین؛ سوگند به قرآن حکمت‌آموز که تو بی‌گمان از پیامبران الهی هستی.' },
      { number: 2, arabic: 'عَلَىٰ صِرَاطٍ مُسْتَقِيمٍ ۝ تَنْزِيلَ الْعَزِيزِ الرَّحِيمِ', translationFa: 'بر راهی راست و استوار؛ نازل شده از سوی خداوند عزیز و مهربان.' },
      { number: 3, arabic: 'سَلَامٌ قَوْلًا مِنْ رَبٍّ رَحِيمٍ', translationFa: 'سلام و درود؛ سخنی از جانب پروردگاری مهربان بر بهشتیان.' },
      { number: 4, arabic: 'فَسُبْحَانَ الَّذِي بِيَدِهِ مَلَكُوتُ كُلِّ شَيْءٍ وَإِلَيْهِ تُرْجَعُونَ', translationFa: 'پس منزه است خدایی که ملکوت هر چیزی در دست اوست و به سوی او بازگردانده می‌شوید.' },
    ],
  },
  {
    surahIndex: 67,
    surahNameFa: 'سوره مبارکه ملک',
    totalAyahs: 30,
    ayahs: [
      { number: 1, arabic: 'تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ', translationFa: 'پربرکت و زوال‌ناپذیر است خدایی که فرمانروایی هستی به دست اوست و بر هر کاری تواناست.' },
      { number: 2, arabic: 'الَّذِي خَلَقَ الْمَوْتَ وَالْحَيَاةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا', translationFa: 'همو که مرگ و زندگی را آفرید تا شما را بیازماید که کدام‌یک نیکوکارترید.' },
    ],
  },
];

const DEFAULT_QURAN: QuranContinuityState = {
  surahIndex: 56,
  surahNameFa: 'سوره مبارکه واقعه',
  ayahNumber: 1,
  totalAyahs: 4,
  dailyTargetMinutes: 5,
  todayReadMinutes: 0,
  lastReadIso: null,
  bookmarks: [],
};

export function loadQuranContinuity(): QuranContinuityState {
  try {
    const raw = localStorage.getItem(QURAN_KEY);
    if (!raw) return DEFAULT_QURAN;
    return { ...DEFAULT_QURAN, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_QURAN;
  }
}

export function saveQuranContinuity(state: QuranContinuityState): void {
  try {
    localStorage.setItem(QURAN_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

const DEFAULT_MOSQUE_TRAVEL: MosqueAndTravelState = {
  travelModeEnabled: false,
  originCityId: 'mashhad',
  destinationCityId: 'tehran',
  isQasrPrayer: true,
  selectedMosqueName: 'مسجد جامع / حرم مطهر',
  jamaatOffsetsMinutes: {
    fajr: 15,
    dhuhr: 15,
    maghrib: 10,
  },
  mosqueAnnouncement: 'اقامه نماز جماعت اول وقت به همراه قرائت زیارت عاشورا',
};

export function loadMosqueAndTravel(): MosqueAndTravelState {
  try {
    const raw = localStorage.getItem(MOSQUE_TRAVEL_KEY);
    if (!raw) return DEFAULT_MOSQUE_TRAVEL;
    return { ...DEFAULT_MOSQUE_TRAVEL, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_MOSQUE_TRAVEL;
  }
}

export function saveMosqueAndTravel(state: MosqueAndTravelState): void {
  try {
    localStorage.setItem(MOSQUE_TRAVEL_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function addMinutesToTimeStr(timeHHMM: string, addMin: number): string {
  const [h, m] = timeHHMM.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return timeHHMM;
  const total = (h * 60 + m + addMin + 1440) % 1440;
  const nh = Math.floor(total / 60);
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

export function loadMuhasabaEntries(): MuhasabaEntry[] {
  try {
    const raw = localStorage.getItem(MUHASABA_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addMuhasabaEntry(entry: Omit<MuhasabaEntry, 'id' | 'createdAt'>): MuhasabaEntry {
  const existing = loadMuhasabaEntries();
  const item: MuhasabaEntry = {
    ...entry,
    id: `m_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const updated = [item, ...existing].slice(0, 90);
  try {
    localStorage.setItem(MUHASABA_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
  return item;
}

export function getRoutineBudgetMinutes(): RoutineBudgetMinutes {
  try {
    const v = Number(localStorage.getItem(ROUTINE_BUDGET_KEY));
    if (v === 2 || v === 5 || v === 15) return v;
    return 5;
  } catch {
    return 5;
  }
}

export function setRoutineBudgetMinutes(min: RoutineBudgetMinutes): void {
  try {
    localStorage.setItem(ROUTINE_BUDGET_KEY, String(min));
  } catch {
    // ignore
  }
}
