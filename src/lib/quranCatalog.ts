export type QuranDisplayMode = 'page' | 'chunk5' | 'single';
export type PrayerAnchorKey = 'after_maghrib_30' | 'after_fajr_20' | 'after_dhuhr_20' | 'night_2130';

export interface SurahMeta {
  number: number;
  nameAr: string;
  nameFa: string;
  ayahCount: number;
  revelationType: 'مکی' | 'مدنی';
  virtueShort?: string;
}

export const ALL_114_SURAHS: SurahMeta[] = [
  { number: 1, nameAr: 'الفاتحة', nameFa: 'سوره مبارکه حمد (فاتحه)', ayahCount: 7, revelationType: 'مکی', virtueShort: 'ام‌الکتاب و شفای هر درد' },
  { number: 2, nameAr: 'البقرة', nameFa: 'سوره مبارکه بقره', ayahCount: 286, revelationType: 'مدنی', virtueShort: 'برکت خانه و دفع شیاطین (شامل آیت‌الکرسی)' },
  { number: 3, nameAr: 'آل عمران', nameFa: 'سوره مبارکه آل‌عمران', ayahCount: 200, revelationType: 'مدنی' },
  { number: 4, nameAr: 'النساء', nameFa: 'سوره مبارکه نساء', ayahCount: 176, revelationType: 'مدنی' },
  { number: 5, nameAr: 'المائدة', nameFa: 'سوره مبارکه مائده', ayahCount: 120, revelationType: 'مدنی' },
  { number: 6, nameAr: 'الأنعام', nameFa: 'سوره مبارکه انعام', ayahCount: 165, revelationType: 'مکی' },
  { number: 7, nameAr: 'الأعراف', nameFa: 'سوره مبارکه اعراف', ayahCount: 206, revelationType: 'مکی' },
  { number: 8, nameAr: 'الأنفال', nameFa: 'سوره مبارکه انفال', ayahCount: 75, revelationType: 'مدنی' },
  { number: 9, nameAr: 'التوبة', nameFa: 'سوره مبارکه توبه', ayahCount: 129, revelationType: 'مدنی' },
  { number: 10, nameAr: 'يونس', nameFa: 'سوره مبارکه یونس', ayahCount: 109, revelationType: 'مکی' },
  { number: 11, nameAr: 'هود', nameFa: 'سوره مبارکه هود', ayahCount: 123, revelationType: 'مکی' },
  { number: 12, nameAr: 'يوسف', nameFa: 'سوره مبارکه یوسف', ayahCount: 111, revelationType: 'مکی', virtueShort: 'نورانیت چهره و گشایش دل' },
  { number: 13, nameAr: 'الرعد', nameFa: 'سوره مبارکه رعد', ayahCount: 43, revelationType: 'مدنی' },
  { number: 14, nameAr: 'إبراهيم', nameFa: 'سوره مبارکه ابراهیم', ayahCount: 52, revelationType: 'مکی' },
  { number: 15, nameAr: 'الحجر', nameFa: 'سوره مبارکه حجر', ayahCount: 99, revelationType: 'مکی' },
  { number: 16, nameAr: 'النحل', nameFa: 'سوره مبارکه نحل', ayahCount: 128, revelationType: 'مکی' },
  { number: 17, nameAr: 'الإسراء', nameFa: 'سوره مبارکه اسراء', ayahCount: 111, revelationType: 'مکی', virtueShort: 'سوره بنی‌اسرائیل — فضیلت ویژه شب جمعه' },
  { number: 18, nameAr: 'الكهف', nameFa: 'سوره مبارکه کهف', ayahCount: 110, revelationType: 'مکی', virtueShort: 'نور بین دو جمعه و آرامش ایمان' },
  { number: 19, nameAr: 'مريم', nameFa: 'سوره مبارکه مریم', ayahCount: 98, revelationType: 'مکی', virtueShort: 'برکت و بی‌نیازی در خانه' },
  { number: 20, nameAr: 'طه', nameFa: 'سوره مبارکه طه', ayahCount: 135, revelationType: 'مکی', virtueShort: 'محبوبیت در دل‌ها و گشایش امر ازدواج و روزی' },
  { number: 21, nameAr: 'الأنبياء', nameFa: 'سوره مبارکه انبیاء', ayahCount: 112, revelationType: 'مکی' },
  { number: 22, nameAr: 'الحج', nameFa: 'سوره مبارکه حج', ayahCount: 78, revelationType: 'مدنی' },
  { number: 23, nameAr: 'المؤمنون', nameFa: 'سوره مبارکه مؤمنون', ayahCount: 118, revelationType: 'مکی' },
  { number: 24, nameAr: 'النور', nameFa: 'سوره مبارکه نور', ayahCount: 64, revelationType: 'مدنی', virtueShort: 'پاکدامنی و نورانیت خانواده' },
  { number: 25, nameAr: 'الفرقان', nameFa: 'سوره مبارکه فرقان', ayahCount: 77, revelationType: 'مکی' },
  { number: 26, nameAr: 'الشعراء', nameFa: 'سوره مبارکه شعراء', ayahCount: 227, revelationType: 'مکی' },
  { number: 27, nameAr: 'النمل', nameFa: 'سوره مبارکه نمل', ayahCount: 93, revelationType: 'مکی' },
  { number: 28, nameAr: 'القصص', nameFa: 'سوره مبارکه قصص', ayahCount: 88, revelationType: 'مکی' },
  { number: 29, nameAr: 'العنكبوت', nameFa: 'سوره مبارکه عنکبوت', ayahCount: 69, revelationType: 'مکی' },
  { number: 30, nameAr: 'الروم', nameFa: 'سوره مبارکه روم', ayahCount: 60, revelationType: 'مکی' },
  { number: 31, nameAr: 'لقمان', nameFa: 'سوره مبارکه لقمان', ayahCount: 34, revelationType: 'مکی' },
  { number: 32, nameAr: 'السجدة', nameFa: 'سوره مبارکه سجده', ayahCount: 30, revelationType: 'مکی' },
  { number: 33, nameAr: 'الأحزاب', nameFa: 'سوره مبارکه احزاب', ayahCount: 73, revelationType: 'مدنی' },
  { number: 34, nameAr: 'سبأ', nameFa: 'سوره مبارکه سبا', ayahCount: 54, revelationType: 'مکی' },
  { number: 35, nameAr: 'فاطر', nameFa: 'سوره مبارکه فاطر', ayahCount: 45, revelationType: 'مکی' },
  { number: 36, nameAr: 'يس', nameFa: 'سوره مبارکه یس (قلب قرآن)', ayahCount: 83, revelationType: 'مکی', virtueShort: 'قلب قرآن؛ برکت روز و آمرزش شب' },
  { number: 37, nameAr: 'الصافات', nameFa: 'سوره مبارکه صافات', ayahCount: 182, revelationType: 'مکی', virtueShort: 'وسعت روزی در روز جمعه' },
  { number: 38, nameAr: 'ص', nameFa: 'سوره مبارکه ص', ayahCount: 88, revelationType: 'مکی' },
  { number: 39, nameAr: 'الزمر', nameFa: 'سوره مبارکه زمر', ayahCount: 75, revelationType: 'مکی' },
  { number: 40, nameAr: 'غافر', nameFa: 'سوره مبارکه غافر (مؤمن)', ayahCount: 85, revelationType: 'مکی' },
  { number: 41, nameAr: 'فصلت', nameFa: 'سوره مبارکه فصلت', ayahCount: 54, revelationType: 'مکی' },
  { number: 42, nameAr: 'الشورى', nameFa: 'سوره مبارکه شوری', ayahCount: 53, revelationType: 'مکی' },
  { number: 43, nameAr: 'الزخرف', nameFa: 'سوره مبارکه زخرف', ayahCount: 89, revelationType: 'مکی' },
  { number: 44, nameAr: 'الدخان', nameFa: 'سوره مبارکه دخان', ayahCount: 59, revelationType: 'مکی' },
  { number: 45, nameAr: 'الجاثية', nameFa: 'سوره مبارکه جاثیه', ayahCount: 37, revelationType: 'مکی' },
  { number: 46, nameAr: 'الأحقاف', nameFa: 'سوره مبارکه احقاف', ayahCount: 35, revelationType: 'مکی' },
  { number: 47, nameAr: 'محمد', nameFa: 'سوره مبارکه محمد (ص)', ayahCount: 38, revelationType: 'مدنی' },
  { number: 48, nameAr: 'الفتح', nameFa: 'سوره مبارکه فتح', ayahCount: 29, revelationType: 'مدنی', virtueShort: 'گشایش کارها و نصرت الهی' },
  { number: 49, nameAr: 'الحجرات', nameFa: 'سوره مبارکه حجرات', ayahCount: 18, revelationType: 'مدنی' },
  { number: 50, nameAr: 'ق', nameFa: 'سوره مبارکه ق', ayahCount: 45, revelationType: 'مکی' },
  { number: 51, nameAr: 'الذاريات', nameFa: 'سوره مبارکه ذاریات', ayahCount: 60, revelationType: 'مکی', virtueShort: 'اصلاح معاش و فراوانی روزی روزانه' },
  { number: 52, nameAr: 'الطور', nameFa: 'سوره مبارکه طور', ayahCount: 49, revelationType: 'مکی' },
  { number: 53, nameAr: 'النجم', nameFa: 'سوره مبارکه نجم', ayahCount: 62, revelationType: 'مکی' },
  { number: 54, nameAr: 'القمر', nameFa: 'سوره مبارکه قمر', ayahCount: 55, revelationType: 'مکی' },
  { number: 55, nameAr: 'الرحمن', nameFa: 'سوره مبارکه الرحمن (عروس قرآن)', ayahCount: 78, revelationType: 'مدنی', virtueShort: 'عروس قرآن و شکر نعمت‌های الهی' },
  { number: 56, nameAr: 'الواقعة', nameFa: 'سوره مبارکه واقعه', ayahCount: 96, revelationType: 'مکی', virtueShort: 'هر شب پس از مغرب و عشاء برای بی‌نیازی و وسعت رزق' },
  { number: 57, nameAr: 'الحديد', nameFa: 'سوره مبارکه حدید', ayahCount: 29, revelationType: 'مدنی' },
  { number: 58, nameAr: 'المجادلة', nameFa: 'سوره مبارکه مجادله', ayahCount: 22, revelationType: 'مدنی' },
  { number: 59, nameAr: 'الحشر', nameFa: 'سوره مبارکه حشر', ayahCount: 24, revelationType: 'مدنی', virtueShort: '۴۰ روز تلاوت برای برآورده شدن حاجات بزرگ' },
  { number: 60, nameAr: 'الممتحنة', nameFa: 'سوره مبارکه ممتحنه', ayahCount: 13, revelationType: 'مدنی' },
  { number: 61, nameAr: 'الصف', nameFa: 'سوره مبارکه صف', ayahCount: 14, revelationType: 'مدنی' },
  { number: 62, nameAr: 'الجمعة', nameFa: 'سوره مبارکه جمعه', ayahCount: 11, revelationType: 'مدنی' },
  { number: 63, nameAr: 'المنافقون', nameFa: 'سوره مبارکه منافقون', ayahCount: 11, revelationType: 'مدنی' },
  { number: 64, nameAr: 'التغابن', nameFa: 'سوره مبارکه تغابن', ayahCount: 18, revelationType: 'مدنی' },
  { number: 65, nameAr: 'الطلاق', nameFa: 'سوره مبارکه طلاق', ayahCount: 12, revelationType: 'مدنی', virtueShort: 'آیه و من یتق الله یجعل له مخرجا (رزق از جای ناگمان)' },
  { number: 66, nameAr: 'التحريم', nameFa: 'سوره مبارکه تحریم', ayahCount: 12, revelationType: 'مدنی' },
  { number: 67, nameAr: 'الملك', nameFa: 'سوره مبارکه ملک (تبارک)', ayahCount: 30, revelationType: 'مکی', virtueShort: 'نجات‌دهنده از عذاب قبر و هدیه به والدین پیش از خواب' },
  { number: 68, nameAr: 'القلم', nameFa: 'سوره مبارکه قلم (ن)', ayahCount: 52, revelationType: 'مکی', virtueShort: 'شامل آیه و ان یکاد برای حفظ از چشم‌زخم' },
  { number: 69, nameAr: 'الحاقة', nameFa: 'سوره مبارکه حاقه', ayahCount: 52, revelationType: 'مکی' },
  { number: 70, nameAr: 'المعارج', nameFa: 'سوره مبارکه معارج', ayahCount: 44, revelationType: 'مکی' },
  { number: 71, nameAr: 'نوح', nameFa: 'سوره مبارکه نوح', ayahCount: 28, revelationType: 'مکی' },
  { number: 72, nameAr: 'الجن', nameFa: 'سوره مبارکه جن', ayahCount: 28, revelationType: 'مکی' },
  { number: 73, nameAr: 'المزمل', nameFa: 'سوره مبارکه مزمل', ayahCount: 20, revelationType: 'مکی', virtueShort: 'صفای زندگی مشترک و گشایش روزی' },
  { number: 74, nameAr: 'المدثر', nameFa: 'سوره مبارکه مدثر', ayahCount: 56, revelationType: 'مکی' },
  { number: 75, nameAr: 'القيامة', nameFa: 'سوره مبارکه قیامت', ayahCount: 40, revelationType: 'مکی' },
  { number: 76, nameAr: 'الإنسان', nameFa: 'سوره مبارکه انسان (هل اتی)', ayahCount: 31, revelationType: 'مدنی', virtueShort: 'شأن نزول اهل‌بیت (ع) — مستحب در صبح پنجشنبه' },
  { number: 77, nameAr: 'المرسلات', nameFa: 'سوره مبارکه مرسلات', ayahCount: 50, revelationType: 'مکی' },
  { number: 78, nameAr: 'النبأ', nameFa: 'سوره مبارکه نبا (عم یتساءلون)', ayahCount: 40, revelationType: 'مکی', virtueShort: 'توفیق زیارت خانه خدا با مداومت روزانه' },
  { number: 79, nameAr: 'النازعات', nameFa: 'سوره مبارکه نازعات', ayahCount: 46, revelationType: 'مکی' },
  { number: 80, nameAr: 'عبس', nameFa: 'سوره مبارکه عبس', ayahCount: 42, revelationType: 'مکی' },
  { number: 81, nameAr: 'التكوير', nameFa: 'سوره مبارکه تکویر', ayahCount: 29, revelationType: 'مکی' },
  { number: 82, nameAr: 'الانفطار', nameFa: 'سوره مبارکه انفطار', ayahCount: 19, revelationType: 'مکی' },
  { number: 83, nameAr: 'المطففين', nameFa: 'سوره مبارکه مطففین', ayahCount: 36, revelationType: 'مکی' },
  { number: 84, nameAr: 'الانشقاق', nameFa: 'سوره مبارکه انشقاق', ayahCount: 25, revelationType: 'مکی' },
  { number: 85, nameAr: 'البروج', nameFa: 'سوره مبارکه بروج', ayahCount: 22, revelationType: 'مکی' },
  { number: 86, nameAr: 'الطارق', nameFa: 'سوره مبارکه طارق', ayahCount: 17, revelationType: 'مکی' },
  { number: 87, nameAr: 'الأعلى', nameFa: 'سوره مبارکه اعلی', ayahCount: 19, revelationType: 'مکی' },
  { number: 88, nameAr: 'الغاشية', nameFa: 'سوره مبارکه غاشیه', ayahCount: 26, revelationType: 'مکی' },
  { number: 89, nameAr: 'الفجر', nameFa: 'سوره مبارکه فجر (سوره امام حسین ع)', ayahCount: 30, revelationType: 'مکی', virtueShort: 'سوره سیدالشهدا (ع) در نمازهای واجب و مستحب' },
  { number: 90, nameAr: 'البلد', nameFa: 'سوره مبارکه بلد', ayahCount: 20, revelationType: 'مکی' },
  { number: 91, nameAr: 'الشمس', nameFa: 'سوره مبارکه شمس', ayahCount: 15, revelationType: 'مکی' },
  { number: 92, nameAr: 'الليل', nameFa: 'سوره مبارکه لیل', ayahCount: 21, revelationType: 'مکی' },
  { number: 93, nameAr: 'الضحى', nameFa: 'سوره مبارکه ضحی', ayahCount: 11, revelationType: 'مکی', virtueShort: 'آرامش قلب و رفع اندوه' },
  { number: 94, nameAr: 'الشرح', nameFa: 'سوره مبارکه انشراح', ayahCount: 8, revelationType: 'مکی', virtueShort: 'شرح صدر، آرامش تپش قلب و آسانی کارها' },
  { number: 95, nameAr: 'التين', nameFa: 'سوره مبارکه تین', ayahCount: 8, revelationType: 'مکی' },
  { number: 96, nameAr: 'العلق', nameFa: 'سوره مبارکه علق', ayahCount: 19, revelationType: 'مکی' },
  { number: 97, nameAr: 'القدر', nameFa: 'سوره مبارکه قدر', ayahCount: 5, revelationType: 'مکی', virtueShort: 'نورانیت دل و برکت مال و مزار مؤمنین' },
  { number: 98, nameAr: 'البينة', nameFa: 'سوره مبارکه بینه', ayahCount: 8, revelationType: 'مدنی' },
  { number: 99, nameAr: 'الزلزلة', nameFa: 'سوره مبارکه زلزله', ayahCount: 8, revelationType: 'مدنی' },
  { number: 100, nameAr: 'العاديات', nameFa: 'سوره مبارکه عادیات', ayahCount: 11, revelationType: 'مکی' },
  { number: 101, nameAr: 'القارعة', nameFa: 'سوره مبارکه قارعه', ayahCount: 11, revelationType: 'مکی' },
  { number: 102, nameAr: 'التكاثر', nameFa: 'سوره مبارکه تکاثر', ayahCount: 8, revelationType: 'مکی' },
  { number: 103, nameAr: 'العصر', nameFa: 'سوره مبارکه عصر', ayahCount: 3, revelationType: 'مکی' },
  { number: 104, nameAr: 'الهمزة', nameFa: 'سوره مبارکه همزه', ayahCount: 9, revelationType: 'مکی' },
  { number: 105, nameAr: 'الفيل', nameFa: 'سوره مبارکه فیل', ayahCount: 5, revelationType: 'مکی' },
  { number: 106, nameAr: 'قريش', nameFa: 'سوره مبارکه قریش', ayahCount: 4, revelationType: 'مکی' },
  { number: 107, nameAr: 'الماعون', nameFa: 'سوره مبارکه ماعون', ayahCount: 7, revelationType: 'مکی' },
  { number: 108, nameAr: 'الكوثر', nameFa: 'سوره مبارکه کوثر', ayahCount: 3, revelationType: 'مکی', virtueShort: 'خیر کثیر و شفاعت حضرت زهرا (س)' },
  { number: 109, nameAr: 'الكافرون', nameFa: 'سوره مبارکه کافرون', ayahCount: 6, revelationType: 'مکی' },
  { number: 110, nameAr: 'النصر', nameFa: 'سوره مبارکه نصر', ayahCount: 3, revelationType: 'مدنی' },
  { number: 111, nameAr: 'المسد', nameFa: 'سوره مبارکه مسد', ayahCount: 5, revelationType: 'مکی' },
  { number: 112, nameAr: 'الإخلاص', nameFa: 'سوره مبارکه توحید (اخلاص)', ayahCount: 4, revelationType: 'مکی', virtueShort: 'ثواب ثلث قرآن کریم' },
  { number: 113, nameAr: 'الفلق', nameFa: 'سوره مبارکه فلق', ayahCount: 5, revelationType: 'مکی' },
  { number: 114, nameAr: 'الناس', nameFa: 'سوره مبارکه ناس', ayahCount: 6, revelationType: 'مکی' },
];

export type QuranAyahItem = { number: number; arabic: string; translationFa: string };

const QURAN_DISPLAY_MODE_KEY = 'noor_quran_display_mode_v1';
const QURAN_SURAH_CACHE_PREFIX = 'noor_surah_cache_v1_';

export function getQuranDisplayMode(): QuranDisplayMode {
  try {
    const v = localStorage.getItem(QURAN_DISPLAY_MODE_KEY);
    if (v === 'page' || v === 'chunk5' || v === 'single') return v;
    return 'page'; // پیش‌فرض روی حالت صفحه‌ای (مصحف) تا کاربر راحت بخواند
  } catch {
    return 'page';
  }
}

export function setQuranDisplayMode(mode: QuranDisplayMode): void {
  try {
    localStorage.setItem(QURAN_DISPLAY_MODE_KEY, mode);
  } catch {
    // ignore
  }
}

// کش آفلاین سوره‌های منتخب + واکشی زنده تمام ۱۱۴ سوره از سرور قرآنی با ترجمه فارسی الهی قمشه‌ای/فولادوند
export async function fetchSurahAyahs(surahNumber: number, fallbackAyahs?: QuranAyahItem[]): Promise<QuranAyahItem[]> {
  try {
    const cached = localStorage.getItem(QURAN_SURAH_CACHE_PREFIX + surahNumber);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  try {
    const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-simple,fa.fooladvand`);
    if (res.ok) {
      const json = await res.json();
      if (json?.data && Array.isArray(json.data) && json.data.length >= 2) {
        const arAyahs = json.data[0].ayahs || [];
        const faAyahs = json.data[1].ayahs || [];
        const combined: QuranAyahItem[] = arAyahs.map((a: { numberInSurah: number; text: string }, idx: number) => ({
          number: a.numberInSurah || idx + 1,
          arabic: a.text,
          translationFa: faAyahs[idx]?.text || '',
        }));
        if (combined.length > 0) {
          try {
            localStorage.setItem(QURAN_SURAH_CACHE_PREFIX + surahNumber, JSON.stringify(combined));
          } catch {}
          return combined;
        }
      }
    }
  } catch {}

  return fallbackAyahs && fallbackAyahs.length > 0
    ? fallbackAyahs
    : [
        {
          number: 1,
          arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
          translationFa: 'به نام خداوند بخشنده مهربان (برای دریافت کامل تمام آیات این سوره یک‌بار به اینترنت متصل شوید تا برای همیشه در گوشی ذخیره شود).',
        },
      ];
}
