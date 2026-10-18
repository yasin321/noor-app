export type Dhikr = {
  id: string;
  arabic: string;
  translit: string;
  translation: string;
  virtue: string;
  count: number;
  category: 'tasbih' | 'tahlil' | 'takbir' | 'istighfar' | 'salawat' | 'quran';
};

export const dhikrLibrary: Dhikr[] = [
  {
    id: 'subhanallah',
    arabic: 'سُبْحَانَ اللَّهِ',
    translit: 'Subhanallah',
    translation: 'منزه است خداوند',
    virtue: 'ذکری که تمام گناهان را پاک می‌کند',
    count: 33,
    category: 'tasbih',
  },
  {
    id: 'alhamdulillah',
    arabic: 'الْحَمْدُ لِلَّهِ',
    translit: 'Alhamdulillah',
    translation: 'ستایش برای خداوند',
    virtue: 'شکر نعمت‌های الهی',
    count: 33,
    category: 'tasbih',
  },
  {
    id: 'allahu_akbar',
    arabic: 'اللَّهُ أَكْبَرُ',
    translit: 'Allahu Akbar',
    translation: 'خداوند بزرگ‌تر است',
    virtue: 'اکبریت خداوند را اعلام می‌کند',
    count: 34,
    category: 'takbir',
  },
  {
    id: 'la_ilaha_illallah',
    arabic: 'لَا إِلَهَ إِلَّا اللَّهُ',
    translit: 'La ilaha illallah',
    translation: 'خدایی جز خدا نیست',
    virtue: 'بزرگ‌ترین ذکر و کلمه توحید',
    count: 100,
    category: 'tahlil',
  },
  {
    id: 'astaghfirullah',
    arabic: 'أَسْتَغْفِرُ اللَّهَ',
    translit: 'Astaghfirullah',
    translation: 'آمرزش می‌خواهم از خدا',
    virtue: 'استغفار و طلب بخشش',
    count: 100,
    category: 'istighfar',
  },
  {
    id: 'salawat',
    arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَآلِ مُحَمَّدٍ',
    translit: 'Allahumma salli ala Muhammad',
    translation: 'خداوندا بر محمد و آل محمد درود فرست',
    virtue: 'صلوات بر پیامبر و خاندانش',
    count: 100,
    category: 'salawat',
  },
  {
    id: 'bismillah',
    arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    translit: 'Bismillahir Rahmanir Rahim',
    translation: 'به نام خداوند بخشنده مهربان',
    virtue: 'شروع هر کار با نام خدا',
    count: 1,
    category: 'quran',
  },
  {
    id: 'tawakkul',
    arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
    translit: 'Hasbunallahu wa ni\'mal wakeel',
    translation: 'خداوند ما را بس است و چه نیکو وکیلی است',
    virtue: 'توکل بر خداوند',
    count: 100,
    category: 'tahlil',
  },
  {
    id: 'radhitu',
    arabic: 'رَضِيتُ بِاللَّهِ رَبًّا',
    translit: 'Radhitu billahi rabba',
    translation: 'خشنودم از خداوند به پروردگاری',
    virtue: 'رضایت به خداوند',
    count: 3,
    category: 'tahlil',
  },
];

export function getDhikr(id: string | null | undefined): Dhikr | null {
  if (!id) return null;
  return dhikrLibrary.find((d) => d.id === id) ?? null;
}

export const dhikrCategories: Record<string, string> = {
  tasbih: 'تسبیح',
  tahlil: 'تهلیل',
  takbir: 'تکبیر',
  istighfar: 'استغفار',
  salawat: 'صلوات',
  quran: 'قرآنی',
};
