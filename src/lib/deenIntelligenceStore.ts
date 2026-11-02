export type SoundProfileId = 'home' | 'work' | 'travel';
export type PrayerAlarmMode = 'full_adhan' | 'short_10s' | 'short_beep' | 'silent';


export type PreAdhanChantId = 'chant_salawat' | 'chant_aqim' | 'chant_rabbanaghfir' | 'chant_istighfar' | 'chant_tasbihat' | 'chant_fatiha';

export interface PreAdhanChantOption {
  id: PreAdhanChantId;
  titleFa: string;
  categoryFa: string;
  arabicText: string;
  translationFa: string;
  audioUrl: string;
  fallbackAudioUrl: string;
  audioAdhanId: string;
  durationSec: number;
}

export const PRE_ADHAN_CHANT_OPTIONS: PreAdhanChantOption[] = [
  {
    id: 'chant_salawat',
    titleFa: 'تواشیح و آیه صلوات بر پیامبر رحمت (ص)',
    categoryFa: 'صلوات و تواشیح قرآنی',
    arabicText: 'إِنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ ۚ يَا أَيُّهَا الَّذِينَ آمَنُوا صَلُّوا عَلَيْهِ وَسَلِّمُوا تَسْلِيمًا',
    translationFa: 'خدا و فرشتگانش بر پیامبر درود می‌فرستند؛ ای مؤمنان بر او درود فرستید و سلام گویید',
    audioUrl: '/adhans/chant_salawat.mp3',
    fallbackAudioUrl: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/3589.mp3',
    audioAdhanId: 'chant_salawat',
    durationSec: 16,
  },
  {
    id: 'chant_aqim',
    titleFa: 'آیه اقامه نماز به افق خورشید (سوره اسراء)',
    categoryFa: 'آیه اقامه نماز',
    arabicText: 'أَقِمِ الصَّلَاةَ لِدُلُوكِ الشَّمْسِ إِلَىٰ غَسَقِ اللَّيْلِ وَقُرْآنَ الْفَجْرِ ۖ إِنَّ قُرْآنَ الْفَجْرِ كَانَ مَشْهُودًا',
    translationFa: 'نماز را از زوال خورشید تا تاریکی شب و نماز صبح را به پا دار که مشهود فرشتگان است',
    audioUrl: '/adhans/chant_aqim.mp3',
    fallbackAudioUrl: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/2107.mp3',
    audioAdhanId: 'chant_aqim',
    durationSec: 15,
  },
  {
    id: 'chant_tasbihat',
    titleFa: 'ذکر آرامش دل‌ها به یاد خدا (أَلَا بِذِكْرِ اللَّهِ)',
    categoryFa: 'ذکر آرامش قلب',
    arabicText: 'الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُمْ بِذِكْرِ اللَّهِ ۗ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    translationFa: 'آنان که ایمان آورده‌اند و دل‌هایشان به یاد خدا آرام می‌گیرد؛ آگاه باش که با یاد خدا دل‌ها آرام می‌گیرد',
    audioUrl: '/adhans/chant_tasbihat.mp3',
    fallbackAudioUrl: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/1735.mp3',
    audioAdhanId: 'chant_tasbihat',
    durationSec: 14,
  },
  {
    id: 'chant_rabbanaghfir',
    titleFa: 'دعای قرآنی برپادارنده نماز و عاقبت‌به‌خیری',
    categoryFa: 'دعای پیش از اذان',
    arabicText: 'رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِنْ ذُرِّيَّتِي ۚ رَبَّنَا وَتَقَبَّلْ دُعَاءِ',
    translationFa: 'پروردگارا مرا و فرزندانم را برپادارندهٔ نماز قرار ده؛ پروردگارا دعایم را بپذیر',
    audioUrl: '/adhans/chant_rabbanaghfir.mp3',
    fallbackAudioUrl: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/1790.mp3',
    audioAdhanId: 'chant_rabbanaghfir',
    durationSec: 12,
  },
  {
    id: 'chant_istighfar',
    titleFa: 'ذکر استغفار و توبه پیش از نماز (سوره هود)',
    categoryFa: 'استغفار پیش از نماز',
    arabicText: 'وَاسْتَغْفِرُوا رَبَّكُمْ ثُمَّ تُوبُوا إِلَيْهِ ۚ إِنَّ رَبِّي رَحِيمٌ وَدُودٌ',
    translationFa: 'از پروردگار خویش آمرزش بخواهید و به سوی او بازگردید؛ که پروردگار من مهربان و ودود است',
    audioUrl: '/adhans/chant_istighfar.mp3',
    fallbackAudioUrl: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/1563.mp3',
    audioAdhanId: 'chant_istighfar',
    durationSec: 12,
  },
  {
    id: 'chant_fatiha',
    titleFa: 'تلاوت ملکوتی حمد و ستایش الهی (استاد عبدالباسط)',
    categoryFa: 'تلاوت استاد عبدالباسط',
    arabicText: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ❀ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
    translationFa: 'به نام خداوند بخشنده مهربان؛ ستایش مخصوص خدایی است که پروردگار جهانیان است',
    audioUrl: '/adhans/chant_fatiha.mp3',
    fallbackAudioUrl: 'https://cdn.islamic.network/quran/audio/128/ar.abdulbasitmurattal/2.mp3',
    audioAdhanId: 'chant_fatiha',
    durationSec: 14,
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
  bookmarks: Array<{ surahNumber?: number; surahNameFa: string; ayahNumber: number; arabic?: string; note: string }>;
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

export type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface PostAdhanItemOption {
  id: string;
  prayers: PrayerKey[];
  badgeFa: string;
  titleFa: string;
  arabicText: string;
  translationFa: string;
  audioUrl: string;
  fallbackAudioUrl: string;
  audioAdhanId: string;
  durationSec: number;
  defaultOffsetMin: number;
  dhikrLibraryId: string | null;
}

export const POST_ADHAN_OPTIONS: PostAdhanItemOption[] = [
  {
    id: 'post_surah_waqiah',
    prayers: ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'],
    badgeFa: '📖 سوره مجرب وسعت رزق و بی‌نیازی (پیشنهاد ویژه)',
    titleFa: 'تلاوت سوره مبارکه واقعه (با صوت استاد پرهیزگار)',
    arabicText: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ إِذَا وَقَعَتِ الْوَاقِعَةُ ۝ لَيْسَ لِوَقْعَتِهَا كَاذِبَةٌ',
    translationFa: 'امام صادق (ع): هر کس سوره واقعه را بخواند، هرگز در دنیا تنگدست و محتاج نمی‌شود',
    audioUrl: '/adhans/post_waqiah.mp3',
    fallbackAudioUrl: 'https://everyayah.com/data/Parhizgar_48kbps/056001.mp3',
    audioAdhanId: 'post_waqiah',
    durationSec: 18,
    defaultOffsetMin: 20,
    dhikrLibraryId: 'surah_waqiah',
  },
  {
    id: 'post_surah_yasin',
    prayers: ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'],
    badgeFa: '📖 قلب قرآن کریم (برکت و حفظ روزانه)',
    titleFa: 'تلاوت سوره مبارکه یس (با صوت استاد پرهیزگار)',
    arabicText: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ يس ۝ وَالْقُرْآنِ الْحَكِيمِ ۝ إِنَّكَ لَمِنَ الْمُرْسَلِينَ',
    translationFa: 'پیامبر اکرم (ص): هر کس سوره یس را بخواند، خیر دنیا و آخرت به او عطا می‌گردد',
    audioUrl: '/adhans/post_yasin.mp3',
    fallbackAudioUrl: 'https://everyayah.com/data/Parhizgar_48kbps/036001.mp3',
    audioAdhanId: 'post_yasin',
    durationSec: 18,
    defaultOffsetMin: 15,
    dhikrLibraryId: null,
  },
  {
    id: 'post_surah_mulk',
    prayers: ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'],
    badgeFa: '📖 سوره تبارک (پناه الهی و هدیه به والدین)',
    titleFa: 'تلاوت سوره مبارکه ملک / تبارک (با صوت استاد پرهیزگار)',
    arabicText: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    translationFa: 'پربرکت است خدایی که فرمانروایی هستی به دست اوست و بر هر کاری تواناست',
    audioUrl: '/adhans/post_mulk.mp3',
    fallbackAudioUrl: 'https://everyayah.com/data/Parhizgar_48kbps/067001.mp3',
    audioAdhanId: 'post_mulk',
    durationSec: 18,
    defaultOffsetMin: 20,
    dhikrLibraryId: null,
  },
  {
    id: 'post_surah_dhariyat',
    prayers: ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'],
    badgeFa: '📖 سوره مجرب اصلاح معاش و برکت کار',
    titleFa: 'تلاوت سوره مبارکه ذاریات (با صوت استاد پرهیزگار)',
    arabicText: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ وَالذَّارِيَاتِ ذَرْوًا ۝ فَالْحَامِلَاتِ وِقْرًا',
    translationFa: 'امام صادق (ع): خواندن سوره ذاریات در روز یا شب، معیشت را اصلاح و روزی را فراوان می‌کند',
    audioUrl: '/adhans/post_dhariyat.mp3',
    fallbackAudioUrl: 'https://everyayah.com/data/Parhizgar_48kbps/051001.mp3',
    audioAdhanId: 'post_dhariyat',
    durationSec: 18,
    defaultOffsetMin: 15,
    dhikrLibraryId: 'surah_dhariyat',
  },
  {
    id: 'post_surah_rahman',
    prayers: ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'],
    badgeFa: '📖 عروس قرآن (شکر نعمت و صفای دل)',
    titleFa: 'تلاوت سوره مبارکه الرحمن (با صوت استاد پرهیزگار)',
    arabicText: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ الرَّحْمَٰنُ ۝ عَلَّمَ الْقُرْآنَ ۝ خَلَقَ الْإِنْسَانَ',
    translationFa: 'خدای رحمان؛ قرآن را تعلیم فرمود و انسان را آفرید',
    audioUrl: '/adhans/post_rahman.mp3',
    fallbackAudioUrl: 'https://everyayah.com/data/Parhizgar_48kbps/055001.mp3',
    audioAdhanId: 'post_rahman',
    durationSec: 18,
    defaultOffsetMin: 15,
    dhikrLibraryId: null,
  },
  {
    id: 'post_surah_saffat',
    prayers: ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'],
    badgeFa: '📖 سوره ویژه روز جمعه و دفع بلا',
    titleFa: 'تلاوت سوره مبارکه صافات (با صوت استاد پرهیزگار)',
    arabicText: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ وَالصَّافَّاتِ صَفًّا ۝ فَالزَّاجِرَاتِ زَجْرًا',
    translationFa: 'امام صادق (ع): قرائت سوره صافات موجب ایمنی از آفات و وسعت روزی در دنیاست',
    audioUrl: '/adhans/post_saffat.mp3',
    fallbackAudioUrl: 'https://everyayah.com/data/Parhizgar_48kbps/037001.mp3',
    audioAdhanId: 'post_saffat',
    durationSec: 18,
    defaultOffsetMin: 20,
    dhikrLibraryId: 'surah_saffat_friday',
  },
  {
    id: 'post_ayat_kursi',
    prayers: ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'],
    badgeFa: '🛡️ حصار امن الهی بعد از هر نماز',
    titleFa: 'تلاوت آیت‌الکرسی شریف (با صوت استاد پرهیزگار)',
    arabicText: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ',
    translationFa: 'پیامبر اکرم (ص): هیچ مانعی بین خواننده آیت‌الکرسی پس از هر نماز و بهشت نیست',
    audioUrl: '/adhans/post_kursi.mp3',
    fallbackAudioUrl: 'https://everyayah.com/data/Parhizgar_48kbps/002255.mp3',
    audioAdhanId: 'post_kursi',
    durationSec: 20,
    defaultOffsetMin: 10,
    dhikrLibraryId: 'ayat_al_kursi',
  },
  {
    id: 'post_all_tasbihat_zahra',
    prayers: ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'],
    badgeFa: '📿 تعقیب مشترک تمام نمازهای یومیه',
    titleFa: 'تسبیحات حضرت زهرا (س) + آیه آرامش دل‌ها',
    arabicText: 'اللَّهُ أَكْبَرُ (۳۴) ❀ الْحَمْدُ لِلَّهِ (۳۳) ❀ سُبْحَانَ اللَّهِ (۳۳) ❀ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    translationFa: 'برترین تعقیب بعد از هر نماز واجب برای آمرزش گناهان و آرامش قلب',
    audioUrl: '/adhans/chant_tasbihat.mp3',
    fallbackAudioUrl: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/1735.mp3',
    audioAdhanId: 'chant_tasbihat',
    durationSec: 15,
    defaultOffsetMin: 10,
    dhikrLibraryId: 'allahu_akbar',
  },
  {
    id: 'post_fajr_ya_fatima',
    prayers: ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'],
    badgeFa: '🌅 استغاثه به حضرت زهرا (س) در سجده و صلوات',
    titleFa: '۱۰۰ مرتبه «يَا مَوْلَاتِي يَا فَاطِمَةُ أَغِيثِينِي» در سجده',
    arabicText: 'يَا مَوْلَاتِي يَا فَاطِمَةُ أَغِيثِينِي ❀ اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَآلِ مُحَمَّدٍ',
    translationFa: 'توسل مجرب در سجده بعد از نماز برای برآورده شدن حاجات مهم',
    audioUrl: '/adhans/chant_salawat.mp3',
    fallbackAudioUrl: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/3589.mp3',
    audioAdhanId: 'chant_salawat',
    durationSec: 16,
    defaultOffsetMin: 15,
    dhikrLibraryId: 'ya_fatima_100',
  },
  {
    id: 'post_dhuhr_bahjat_rizq',
    prayers: ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'],
    badgeFa: '☀️ تعقیب وسعت رزق و عاقبت‌به‌خیری خانواده',
    titleFa: 'ذکر آیت‌الله بهجت (اللَّهُمَّ أَغْنِنِي بِحَلَالِكَ) و دعای قرآنی خانواده',
    arabicText: 'اللَّهُمَّ أَغْنِنِي بِحَلَالِكَ عَنْ حَرَامِكَ وَبِفَضْلِكَ عَمَّنْ سِوَاكَ ❀ رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ',
    translationFa: 'بی‌نیازی با رزق حلال و عاقبت‌به‌خیری همسر و فرزندان (سوره فرقان آیه ۷۴)',
    audioUrl: '/adhans/post_furqan.mp3',
    fallbackAudioUrl: 'https://everyayah.com/data/Parhizgar_48kbps/025074.mp3',
    audioAdhanId: 'post_furqan',
    durationSec: 16,
    defaultOffsetMin: 15,
    dhikrLibraryId: 'bahjat_aghnini_halalika',
  },
  {
    id: 'post_asr_istighfar_qadi',
    prayers: ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'],
    badgeFa: '🌤️ تعقیب استغفار و گشایش حاجات',
    titleFa: '۷۰ مرتبه استغفار و ۴۰ مرتبه «يَا قَاضِيَ الْحَاجَاتِ»',
    arabicText: 'وَاسْتَغْفِرُوا رَبَّكُمْ ثُمَّ تُوبُوا إِلَيْهِ ❀ يَا قَاضِيَ الْحَاجَاتِ',
    translationFa: 'آمرزش‌خواهی پس از نماز و ذکر مجرب یا قاضی الحاجات برای گشایش امور',
    audioUrl: '/adhans/chant_istighfar.mp3',
    fallbackAudioUrl: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/1563.mp3',
    audioAdhanId: 'chant_istighfar',
    durationSec: 14,
    defaultOffsetMin: 15,
    dhikrLibraryId: 'ya_qadi_al_hajat_40',
  },
];
