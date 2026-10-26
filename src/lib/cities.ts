export type City = {
  id: string;
  name: string;
  nameFa: string;
  country: string;
  countryFa: string;
  lat: number;
  lng: number;
  timezone: string;
};

export const CITIES: City[] = [
  { id: 'tehran', name: 'Tehran', nameFa: 'تهران', country: 'Iran', countryFa: 'ایران', lat: 35.6892, lng: 51.3890, timezone: 'Asia/Tehran' },
  { id: 'mashhad', name: 'Mashhad', nameFa: 'مشهد', country: 'Iran', countryFa: 'ایران', lat: 36.2605, lng: 59.6168, timezone: 'Asia/Tehran' },
  { id: 'qom', name: 'Qom', nameFa: 'قم', country: 'Iran', countryFa: 'ایران', lat: 34.6416, lng: 50.8746, timezone: 'Asia/Tehran' },
  { id: 'isfahan', name: 'Isfahan', nameFa: 'اصفهان', country: 'Iran', countryFa: 'ایران', lat: 32.6546, lng: 51.6680, timezone: 'Asia/Tehran' },
  { id: 'shiraz', name: 'Shiraz', nameFa: 'شیراز', country: 'Iran', countryFa: 'ایران', lat: 29.5918, lng: 52.5837, timezone: 'Asia/Tehran' },
  { id: 'tabriz', name: 'Tabriz', nameFa: 'تبریز', country: 'Iran', countryFa: 'ایران', lat: 38.0962, lng: 46.2738, timezone: 'Asia/Tehran' },
  { id: 'karaj', name: 'Karaj', nameFa: 'کرج', country: 'Iran', countryFa: 'ایران', lat: 35.8400, lng: 50.9391, timezone: 'Asia/Tehran' },
  { id: 'ahvaz', name: 'Ahvaz', nameFa: 'اهواز', country: 'Iran', countryFa: 'ایران', lat: 31.3183, lng: 48.6706, timezone: 'Asia/Tehran' },
  { id: 'kermanshah', name: 'Kermanshah', nameFa: 'کرمانشاه', country: 'Iran', countryFa: 'ایران', lat: 34.3142, lng: 47.0650, timezone: 'Asia/Tehran' },
  { id: 'rasht', name: 'Rasht', nameFa: 'رشت', country: 'Iran', countryFa: 'ایران', lat: 37.2808, lng: 49.5832, timezone: 'Asia/Tehran' },
  { id: 'yazd', name: 'Yazd', nameFa: 'یزد', country: 'Iran', countryFa: 'ایران', lat: 31.8974, lng: 54.3569, timezone: 'Asia/Tehran' },
  { id: 'kerman', name: 'Kerman', nameFa: 'کرمان', country: 'Iran', countryFa: 'ایران', lat: 30.2839, lng: 57.0834, timezone: 'Asia/Tehran' },
  { id: 'sari', name: 'Sari', nameFa: 'ساری', country: 'Iran', countryFa: 'ایران', lat: 36.5633, lng: 53.0601, timezone: 'Asia/Tehran' },
  { id: 'gorgan', name: 'Gorgan', nameFa: 'گرگان', country: 'Iran', countryFa: 'ایران', lat: 36.8427, lng: 54.4326, timezone: 'Asia/Tehran' },
  { id: 'bandar_abbas', name: 'Bandar Abbas', nameFa: 'بندرعباس', country: 'Iran', countryFa: 'ایران', lat: 27.1832, lng: 56.2666, timezone: 'Asia/Tehran' },
  { id: 'urmia', name: 'Urmia', nameFa: 'ارومیه', country: 'Iran', countryFa: 'ایران', lat: 37.5527, lng: 45.0761, timezone: 'Asia/Tehran' },
  { id: 'ardabil', name: 'Ardabil', nameFa: 'اردبیل', country: 'Iran', countryFa: 'ایران', lat: 38.2498, lng: 48.2933, timezone: 'Asia/Tehran' },
  { id: 'hamedan', name: 'Hamedan', nameFa: 'همدان', country: 'Iran', countryFa: 'ایران', lat: 34.7989, lng: 48.5150, timezone: 'Asia/Tehran' },
  { id: 'arak', name: 'Arak', nameFa: 'اراک', country: 'Iran', countryFa: 'ایران', lat: 34.0954, lng: 49.7013, timezone: 'Asia/Tehran' },
  { id: 'qazvin', name: 'Qazvin', nameFa: 'قزوین', country: 'Iran', countryFa: 'ایران', lat: 36.2688, lng: 50.0041, timezone: 'Asia/Tehran' },
  { id: 'zanjan', name: 'Zanjan', nameFa: 'زنجان', country: 'Iran', countryFa: 'ایران', lat: 36.6764, lng: 48.4963, timezone: 'Asia/Tehran' },
  { id: 'sanandaj', name: 'Sanandaj', nameFa: 'سنندج', country: 'Iran', countryFa: 'ایران', lat: 35.3219, lng: 46.9862, timezone: 'Asia/Tehran' },
  { id: 'khorramabad', name: 'Khorramabad', nameFa: 'خرم‌آباد', country: 'Iran', countryFa: 'ایران', lat: 33.4878, lng: 48.3558, timezone: 'Asia/Tehran' },
  { id: 'bushehr', name: 'Bushehr', nameFa: 'بوشهر', country: 'Iran', countryFa: 'ایران', lat: 28.9234, lng: 50.8203, timezone: 'Asia/Tehran' },
  { id: 'zahedan', name: 'Zahedan', nameFa: 'زاهدان', country: 'Iran', countryFa: 'ایران', lat: 29.4963, lng: 60.8629, timezone: 'Asia/Tehran' },
  { id: 'birjand', name: 'Birjand', nameFa: 'بیرجند', country: 'Iran', countryFa: 'ایران', lat: 32.8649, lng: 59.2211, timezone: 'Asia/Tehran' },
  { id: 'bojnurd', name: 'Bojnurd', nameFa: 'بجنورد', country: 'Iran', countryFa: 'ایران', lat: 37.4747, lng: 57.3290, timezone: 'Asia/Tehran' },
  { id: 'semnan', name: 'Semnan', nameFa: 'سمنان', country: 'Iran', countryFa: 'ایران', lat: 35.5769, lng: 53.3970, timezone: 'Asia/Tehran' },
  { id: 'shahr_e_kord', name: 'Shahr-e Kord', nameFa: 'شهرکرد', country: 'Iran', countryFa: 'ایران', lat: 32.3256, lng: 50.8644, timezone: 'Asia/Tehran' },
  { id: 'yasuj', name: 'Yasuj', nameFa: 'یاسوج', country: 'Iran', countryFa: 'ایران', lat: 30.6682, lng: 51.5880, timezone: 'Asia/Tehran' },
  { id: 'ilam', name: 'Ilam', nameFa: 'ایلام', country: 'Iran', countryFa: 'ایران', lat: 33.6374, lng: 46.4227, timezone: 'Asia/Tehran' },
  { id: 'neyshabur', name: 'Neyshabur', nameFa: 'نیشابور', country: 'Iran', countryFa: 'ایران', lat: 36.2133, lng: 58.7958, timezone: 'Asia/Tehran' },
  { id: 'sabzevar', name: 'Sabzevar', nameFa: 'سبزوار', country: 'Iran', countryFa: 'ایران', lat: 36.2126, lng: 57.6819, timezone: 'Asia/Tehran' },
  { id: 'kashan', name: 'Kashan', nameFa: 'کاشان', country: 'Iran', countryFa: 'ایران', lat: 33.9850, lng: 51.4100, timezone: 'Asia/Tehran' },
  { id: 'dezful', name: 'Dezful', nameFa: 'دزفول', country: 'Iran', countryFa: 'ایران', lat: 32.3811, lng: 48.4058, timezone: 'Asia/Tehran' },
  { id: 'abadan', name: 'Abadan', nameFa: 'آبادان', country: 'Iran', countryFa: 'ایران', lat: 30.3392, lng: 48.3043, timezone: 'Asia/Tehran' },
  { id: 'karbala', name: 'Karbala', nameFa: 'کربلا', country: 'Iraq', countryFa: 'عراق (عتبات)', lat: 32.6160, lng: 44.0249, timezone: 'Asia/Baghdad' },
  { id: 'najaf', name: 'Najaf', nameFa: 'نجف اشرف', country: 'Iraq', countryFa: 'عراق (عتبات)', lat: 31.9959, lng: 44.3146, timezone: 'Asia/Baghdad' },
  { id: 'makkah', name: 'Makkah', nameFa: 'مکه مکرمه', country: 'Saudi Arabia', countryFa: 'عربستان', lat: 21.4225, lng: 39.8262, timezone: 'Asia/Riyadh' },
  { id: 'madinah', name: 'Madinah', nameFa: 'مدینه منوره', country: 'Saudi Arabia', countryFa: 'عربستان', lat: 24.4672, lng: 39.6112, timezone: 'Asia/Riyadh' },
];

const GUEST_CITY_KEY = 'noor_guest_city_id';

export function getCityById(id: string | null | undefined): City {
  if (!id) return CITIES[0];
  return CITIES.find((c) => c.id === id) ?? CITIES[0];
}

export function getGuestCityId(): string {
  try {
    return localStorage.getItem(GUEST_CITY_KEY) || 'tehran';
  } catch {
    return 'tehran';
  }
}

export function setGuestCityId(id: string): void {
  try {
    localStorage.setItem(GUEST_CITY_KEY, id);
  } catch {
    // ignore
  }
}
