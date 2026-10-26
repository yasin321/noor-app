export type DhikrCategory =
  | 'tasbih'
  | 'tahlil'
  | 'takbir'
  | 'istighfar'
  | 'salawat'
  | 'quran'
  | 'scholars'
  | 'mafatih';

export type Dhikr = {
  id: string;
  arabic: string;
  translit: string;
  translation: string;
  virtue: string;
  count: number;
  category: DhikrCategory;
  source?: string;
  recommendedTime?: string;
  defaultReminderTime?: string;
  hadith?: string;
  scholarNote?: string;
};

export const dhikrLibrary: Dhikr[] = [
  {
    id: 'subhanallah',
    arabic: 'سُبْحَانَ اللَّهِ',
    translit: 'Subhanallah',
    translation: 'منزه است خداوند از هر عیب و نقصی',
    virtue: 'ذکری که تمام گناهان را پاک می‌کند و درختی در بهشت می‌کارد',
    count: 33,
    category: 'tasbih',
    source: 'تسبیحات حضرت زهرا (س) — مفاتیح‌الجنان',
    recommendedTime: 'تعقیبات بعد از هر نماز واجب و پیش از خواب',
    defaultReminderTime: '06:00',
    hadith: 'امام صادق (ع): هر کس پس از نماز واجب تسبیحات حضرت زهرا (س) را بگوید، پیش از آنکه پایش را جابه‌جا کند آمرزیده می‌شود.',
  },
  {
    id: 'alhamdulillah',
    arabic: 'الْحَمْدُ لِلَّهِ',
    translit: 'Alhamdulillah',
    translation: 'همه ستایش‌ها مخصوص خداوند است',
    virtue: 'شکر نعمت‌های الهی و افزون‌کننده روزی و برکت',
    count: 33,
    category: 'tasbih',
    source: 'قرآن کریم و تسبیحات حضرت زهرا (س)',
    recommendedTime: 'بعد از هر نماز و هنگام دیدن هر نعمت',
    defaultReminderTime: '12:30',
    hadith: 'امام رضا (ع): هر کس خدا را بر نعمتی حمد گوید، شکر آن را ادا کرده و نعمتش فزونی می‌یابد.',
  },
  {
    id: 'allahu_akbar',
    arabic: 'اللَّهُ أَكْبَرُ',
    translit: 'Allahu Akbar',
    translation: 'خداوند بزرگ‌تر از آن است که به وصف آید',
    virtue: 'اکبریت خداوند را اعلام می‌کند و تسبیحات را کامل می‌سازد',
    count: 34,
    category: 'takbir',
    source: 'تسبیحات حضرت زهرا (س) — اصول کافی',
    recommendedTime: 'آغاز تسبیحات بعد از هر نماز واجب',
    defaultReminderTime: '12:15',
    hadith: 'پیامبر اکرم (ص) به حضرت فاطمه (س): سی و چهار مرتبه اللَّهُ أَكْبَرُ بگو که از هر خادم و متاع دنیا برای تو بهتر است.',
  },
  {
    id: 'la_ilaha_illallah',
    arabic: 'لَا إِلَهَ إِلَّا اللَّهُ',
    translit: 'La ilaha illallah',
    translation: 'معبودی به حق جز خدای یکتا نیست',
    virtue: 'بزرگ‌ترین ذکر، کلمه توحید و حصن امن الهی',
    count: 100,
    category: 'tahlil',
    source: 'حدیث سلسله‌الذهب امام رضا (ع) — عیون اخبار الرضا',
    recommendedTime: 'بین الطلوعین و بعد از نماز صبح',
    defaultReminderTime: '05:45',
    hadith: 'حدیث قدسی از زبان امام رضا (ع): کَلِمَةُ لَا إِلَهَ إِلَّا اللَّهُ حِصْنِي فَمَنْ دَخَلَ حِصْنِي أَمِنَ مِنْ عَذَابِي.',
  },
  {
    id: 'astaghfirullah',
    arabic: 'أَسْتَغْفِرُ اللَّهَ رَبِّي وَأَتُوبُ إِلَيْهِ',
    translit: 'Astaghfirullah',
    translation: 'آمرزش می‌خواهم از خدایم و به سوی او بازمی‌گردم',
    virtue: 'استغفار، گشایش درهای روزی و رفع اندوه دل',
    count: 100,
    category: 'istighfar',
    source: 'نهج‌البلاغه و صحیفه سجادیه',
    recommendedTime: 'بعد از نماز عصر و سحرگاهان',
    defaultReminderTime: '16:30',
    scholarNote: 'آیت‌الله بهجت (ره): برای باز شدن گره‌های زندگی و نورانیت دل، بر استغفار با توجه قلبی مداومت کنید.',
  },
  {
    id: 'salawat',
    arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَآلِ مُحَمَّدٍ وَعَجِّلْ فَرَجَهُمْ',
    translit: 'Allahumma salli ala Muhammad',
    translation: 'خداوندا بر محمد و خاندان پاکش درود فرست و فرجشان را نزدیک گردان',
    virtue: 'کلید اجابت دعا و نورانیت نامه اعمال',
    count: 100,
    category: 'salawat',
    source: 'مفاتیح‌الجنان — اعمال روز و شب جمعه',
    recommendedTime: 'در تمام اوقات، به‌ویژه عصر پنجشنبه و روز جمعه',
    defaultReminderTime: '17:00',
    hadith: 'امام صادق (ع): هر دعایی تا زمانی که بر محمد و آل محمد صلوات فرستاده نشود در حجاب است.',
  },
  {
    id: 'bismillah',
    arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    translit: 'Bismillahir Rahmanir Rahim',
    translation: 'به نام خداوند بخشنده مهربان',
    virtue: 'بیمه شدن کارها و نزول برکت در آغاز هر عمل',
    count: 19,
    category: 'quran',
    source: 'قرآن کریم — آغاز سوره‌ها',
    recommendedTime: 'آغاز روز، شروع کار و پیش از خواب',
    defaultReminderTime: '07:30',
  },
  {
    id: 'tawakkul',
    arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
    translit: "Hasbunallahu wa ni'mal wakeel",
    translation: 'خداوند ما را بس است و چه نیکو کارسازی است',
    virtue: 'آرامش در برابر اضطراب‌ها و کفایت امور توسط پروردگار',
    count: 100,
    category: 'tahlil',
    source: 'قرآن کریم — سوره آل عمران، آیه ۱۷۳',
    recommendedTime: 'هنگام مواجهه با سختی‌ها و بعد از نماز صبح',
    defaultReminderTime: '08:00',
  },
  {
    id: 'radhitu',
    arabic: 'رَضِيتُ بِاللَّهِ رَبًّا وَبِالْإِسْلَامِ دِينًا وَبِمُحَمَّدٍ نَبِيًّا وَبِعَلِيٍّ إِمَامًا',
    translit: 'Radhitu billahi rabba',
    translation: 'خرسندم که خدا پروردگار من، اسلام دین من، محمد پیامبر من و علی و فرزندانش امامان من هستند',
    virtue: 'تثبیت ایمان و خشنودی پروردگار در روز قیامت',
    count: 3,
    category: 'tahlil',
    source: 'تعقیبات نماز — مفاتیح‌الجنان',
    recommendedTime: 'هر صبح و شام (۳ مرتبه)',
    defaultReminderTime: '07:00',
  },
  {
    id: 'fateminia_afina',
    arabic: 'اللَّهُمَّ عَافِنَا وَاعْفُ عَنَّا',
    translit: 'Allahumma afina wa-fu anna',
    translation: 'خدایا به ما عافیت عطا فرما و از سر تقصیرات ما درگذر',
    virtue: 'جلب عافیت دنیا و آخرت و دفع بلاها و گرفتاری‌های ناگهانی',
    count: 14,
    category: 'scholars',
    source: 'توصیه مجرب مرحوم آیت‌الله فاطمی‌نیا (ره)',
    recommendedTime: 'در قنوت نمازها، سجده آخر و بعد از نمازهای روزانه',
    defaultReminderTime: '13:00',
    scholarNote: 'استاد فاطمی‌نیا (ره): این ذکر کوتاه اما بسیار عظیم را زیاد بگویید؛ انسان همیشه باید از خدا «عافیت» و «گذشت» بخواهد.',
  },
  {
    id: 'fateminia_sallim',
    arabic: 'اللَّهُمَّ سَلِّمْ وَ تَمِّمْ',
    translit: 'Allahumma sallim wa tammim',
    translation: 'خدایا کار و ایمان ما را به سلامت بدار و به کمال و عاقبت‌به‌خیری برسان',
    virtue: 'حفظ ایمان، سلامت نفس در امتحانات الهی و عاقبت‌به‌خیری',
    count: 14,
    category: 'scholars',
    source: 'یادگار معنوی مرحوم آیت‌الله فاطمی‌نیا (ره)',
    recommendedTime: 'هر روز پس از نماز صبح و هنگام آغاز کارهای مهم',
    defaultReminderTime: '06:30',
    scholarNote: 'مرحوم آیت‌الله فاطمی‌نیا (ره) همواره برای عاقبت‌به‌خیری و تمام شدن نعمت‌های معنوی این دعا را سفارش می‌کردند.',
  },
  {
    id: 'bahjat_yunusiyyah',
    arabic: 'لَا إِلَٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ',
    translit: 'La ilaha illa Anta Subhanaka',
    translation: 'معبودی جز تو نیست، منزهی تو، راستی که من از ستمکاران بر خویش بودم',
    virtue: 'ذکر یونسیه؛ نجات از غم و اندوه و گشایش بن‌بست‌های معنوی و مادی',
    count: 40,
    category: 'scholars',
    source: 'سوره انبیاء آیه ۸۷ — توصیه آیت‌الله بهجت (ره)',
    recommendedTime: 'در سجده پس از نماز عشاء یا در خلوت شب',
    defaultReminderTime: '21:30',
    scholarNote: 'پیامبر اکرم (ص): هیچ مسلمان غمدیده‌ای این دعا را نمی‌خواند مگر آنکه خداوند اندوهش را برطرف سازد.',
  },
  {
    id: 'surah_waqiah',
    arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ إِذَا وَقَعَتِ الْوَاقِعَةُ (تلاوت سوره واقعه)',
    translit: 'Surah Al-Waqiah',
    translation: 'تلاوت سوره مبارکه واقعه در هر شب برای بی‌نیازی و برکت روزی',
    virtue: 'امان از تنگدستی، گشایش رزق حلال و آرامش معیشت خانواده',
    count: 1,
    category: 'quran',
    source: 'قرآن کریم (سوره ۵۶) — ثواب‌الاعمال و مفاتیح‌الجنان',
    recommendedTime: 'هر شب پس از نماز مغرب و عشاء پیش از خواب',
    defaultReminderTime: '20:30',
    hadith: 'امام صادق (ع): هر کس هر شب پیش از خواب سوره واقعه را بخواند، در حالی خدا را ملاقات کند که چهره‌اش چون ماه شب چهارده می‌درخشد و هرگز محتاج نمی‌شود.',
  },
  {
    id: 'surah_dhariyat',
    arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ وَالذَّارِيَاتِ ذَرْوًا (تلاوت سوره ذاریات)',
    translit: 'Surah Adh-Dhariyat',
    translation: 'تلاوت روزانه سوره مبارکه ذاریات برای اصلاح معاش و روزی فراوان',
    virtue: 'اصلاح امر معاش و روزی به فضل الهی',
    count: 1,
    category: 'quran',
    source: 'قرآن کریم (سوره ۵۱) — مفاتیح‌الجنان',
    recommendedTime: 'هر روز (پس از نماز صبح یا ظهر)',
    defaultReminderTime: '08:30',
    hadith: 'امام صادق (ع): هر کس در روز یا شب سوره ذاریات را بخواند، خداوند معیشت او را اصلاح فرموده و روزی فراوان به او عطا کند.',
  },
  {
    id: 'friday_night_husayn',
    arabic: 'صَلَّى اللَّهُ عَلَيْكَ يَا أَبَا عَبْدِ اللَّهِ الْحُسَيْنِ (ع)',
    translit: 'Sallallahu alayka ya Aba Abdillah',
    translation: 'درود و رحمت خدا بر تو ای اباعبدالله الحسین (ع)',
    virtue: 'بهره‌مندی از ثواب زیارت سیدالشهدا (ع) و ثبت نام در زائران شب جمعه',
    count: 3,
    category: 'mafatih',
    source: 'مفاتیح‌الجنان — اعمال شب جمعه و کامل‌الزیارات',
    recommendedTime: 'شب‌های جمعه و بعد از هر نماز (زیر آسمان یا رو به قبله)',
    defaultReminderTime: '19:30',
    hadith: 'امام صادق (ع): هر کس از دور یا نزدیک سه بار بگوید صَلَّى اللَّهُ عَلَيْكَ يَا أَبَا عَبْدِ اللَّهِ، سلام او به آن حضرت می‌رسد.',
  },
  {
    id: 'imam_reza_hajat',
    arabic: 'يَا رَءُوفُ يَا رَحِيمُ ❀ اللَّهُمَّ صَلِّ عَلَى عَلِيِّ بْنِ مُوسَى الرِّضَا الْمُرْتَضَى',
    translit: 'Ya Rauf Ya Rahim — Salawat Imam Reza',
    translation: 'ای مهربان‌ترین و بخشنده‌ترین؛ خدایا بر علی بن موسی الرضا (ع) درود فرست',
    virtue: 'توسل مجرب برای حاجت‌روایی، آرامش قلب و شفاعت امام رئوف (ع)',
    count: 8,
    category: 'mafatih',
    source: 'عیون اخبار الرضا (ع) و مفاتیح‌الجنان',
    recommendedTime: 'روزهای چهارشنبه و یکشنبه، و هنگام حاجت‌های مهم',
    defaultReminderTime: '10:00',
    hadith: 'امام رضا (ع): به راستی در هر حاجتی که به ما متوسل شوید و خدا را به حق ما بخوانید، خداوند گره از کارتان می‌گشاید.',
  },
  {
    id: 'ahlul_qubur_fatiha',
    arabic: 'اللَّهُمَّ اغْفِرْ لِلْمُؤْمِنِينَ وَالْمُؤْمِنَاتِ (فاتحه و اخلاص برای والدین و اموات)',
    translit: 'Fatiha & Ikhlas for Parents',
    translation: 'خواندن سوره حمد و ۳ توحید و هدیه به روح پدر، مادر و درگذشتگان',
    virtue: 'شادی روح والدین، نورانیت قبور و بازگشت ده برابر ثواب به خود انسان',
    count: 3,
    category: 'mafatih',
    source: 'مفاتیح‌الجنان — آداب زیارت اهل قبور و عصر پنجشنبه',
    recommendedTime: 'عصر پنجشنبه، هنگام حضور بر مزار والدین و بعد از نماز',
    defaultReminderTime: '16:00',
    hadith: 'امام رضا (ع): هر کس به زیارت قبر مؤمنی برود و دست بر قبر نهد و ۷ بار سوره قدر بخواند، از هراس بزرگ ایمن گردد.',
  },
];

const CUSTOM_DHIKR_KEY = 'noor_custom_dhikr_v1';

export function getCustomDhikr(): Dhikr[] {
  try {
    const raw = localStorage.getItem(CUSTOM_DHIKR_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is Dhikr =>
      !!item && typeof item.id === 'string' &&
      typeof item.arabic === 'string' && typeof item.translation === 'string' &&
      typeof item.translit === 'string' && typeof item.virtue === 'string' &&
      typeof item.count === 'number' && item.count > 0
    );
  } catch {
    return [];
  }
}

export function getAllDhikr(): Dhikr[] {
  return [...dhikrLibrary, ...getCustomDhikr()];
}

export function addCustomDhikr(input: {
  arabic: string;
  translation: string;
  count: number;
  recommendedTime?: string;
  source?: string;
}): Dhikr {
  const item: Dhikr = {
    id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    arabic: input.arabic.trim(),
    translit: 'یادداشت / ذکر شخصی',
    translation: input.translation.trim() || 'ذکر شخصی ثبت‌شده از سخنرانی یا برنامه فردی',
    virtue: 'ثبت‌شده در دفترچه معنوی شما برای مداومت و عمل',
    count: Math.max(1, Math.floor(input.count)),
    category: 'tasbih',
    source: input.source?.trim() || 'دفترچه یادداشت معنوی من',
    recommendedTime: input.recommendedTime?.trim() || 'طبق برنامه روزانه شما',
  };
  const next = [...getCustomDhikr(), item];
  try {
    localStorage.setItem(CUSTOM_DHIKR_KEY, JSON.stringify(next));
  } catch {
    throw new Error('ذکر ذخیره نشد؛ فضای ذخیره‌سازی گوشی را بررسی کنید.');
  }
  return item;
}

export function getDhikr(id: string | null | undefined): Dhikr | null {
  if (!id) return null;
  return getAllDhikr().find((d) => d.id === id) ?? null;
}

export const dhikrCategories: Record<string, string> = {
  scholars: 'توصیه علما',
  mafatih: 'مفاتیح و زیارات',
  quran: 'قرآن و سوره‌ها',
  tasbih: 'تسبیح',
  salawat: 'صلوات',
  istighfar: 'استغفار',
  tahlil: 'تهلیل و توکل',
  takbir: 'تکبیر',
};
