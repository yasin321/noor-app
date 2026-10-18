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
  // Iran
  { id: 'tehran', name: 'Tehran', nameFa: 'تهران', country: 'iran', countryFa: 'ایران', lat: 35.6892, lng: 51.3890, timezone: 'Asia/Tehran' },
  { id: 'mashhad', name: 'Mashhad', nameFa: 'مشهد', country: 'iran', countryFa: 'ایران', lat: 36.2972, lng: 59.6062, timezone: 'Asia/Tehran' },
  { id: 'isfahan', name: 'Isfahan', nameFa: 'اصفهان', country: 'iran', countryFa: 'ایران', lat: 32.6539, lng: 51.6660, timezone: 'Asia/Tehran' },
  { id: 'shiraz', name: 'Shiraz', nameFa: 'شیراز', country: 'iran', countryFa: 'ایران', lat: 29.5916, lng: 52.5837, timezone: 'Asia/Tehran' },
  { id: 'tabriz', name: 'Tabriz', nameFa: 'تبریز', country: 'iran', countryFa: 'ایران', lat: 38.0800, lng: 46.2919, timezone: 'Asia/Tehran' },
  { id: 'qom', name: 'Qom', nameFa: 'قم', country: 'iran', countryFa: 'ایران', lat: 34.6399, lng: 50.8759, timezone: 'Asia/Tehran' },
  { id: 'ahvaz', name: 'Ahvaz', nameFa: 'اهواز', country: 'iran', countryFa: 'ایران', lat: 31.3183, lng: 48.6706, timezone: 'Asia/Tehran' },
  { id: 'kermanshah', name: 'Kermanshah', nameFa: 'کرمانشاه', country: 'iran', countryFa: 'ایران', lat: 34.3142, lng: 47.3317, timezone: 'Asia/Tehran' },
  { id: 'rasht', name: 'Rasht', nameFa: 'رشت', country: 'iran', countryFa: 'ایران', lat: 37.2808, lng: 49.5832, timezone: 'Asia/Tehran' },
  { id: 'karaj', name: 'Karaj', nameFa: 'کرج', country: 'iran', countryFa: 'ایران', lat: 35.8400, lng: 50.9391, timezone: 'Asia/Tehran' },
  { id: 'yazd', name: 'Yazd', nameFa: 'یزد', country: 'iran', countryFa: 'ایران', lat: 31.8974, lng: 54.3569, timezone: 'Asia/Tehran' },
  { id: 'bandar_abbas', name: 'Bandar Abbas', nameFa: 'بندرعباس', country: 'iran', countryFa: 'ایران', lat: 27.1832, lng: 56.2666, timezone: 'Asia/Tehran' },
  { id: 'kerman', name: 'Kerman', nameFa: 'کرمان', country: 'iran', countryFa: 'ایران', lat: 30.2839, lng: 57.0834, timezone: 'Asia/Tehran' },
  { id: 'urmia', name: 'Urmia', nameFa: 'ارومیه', country: 'iran', countryFa: 'ایران', lat: 37.5478, lng: 45.0486, timezone: 'Asia/Tehran' },
  { id: 'zahedan', name: 'Zahedan', nameFa: 'زاهدان', country: 'iran', countryFa: 'ایران', lat: 29.5011, lng: 60.1978, timezone: 'Asia/Tehran' },

  // Iraq
  { id: 'najaf', name: 'Najaf', nameFa: 'نجف', country: 'iraq', countryFa: 'عراق', lat: 32.0000, lng: 44.3333, timezone: 'Asia/Baghdad' },
  { id: 'karbala', name: 'Karbala', nameFa: 'کربلا', country: 'iraq', countryFa: 'عراق', lat: 32.6167, lng: 44.0833, timezone: 'Asia/Baghdad' },
  { id: 'baghdad', name: 'Baghdad', nameFa: 'بغداد', country: 'iraq', countryFa: 'عراق', lat: 33.3152, lng: 44.3661, timezone: 'Asia/Baghdad' },

  // Saudi Arabia
  { id: 'mecca', name: 'Mecca', nameFa: 'مکه', country: 'saudi', countryFa: 'عربستان', lat: 21.3891, lng: 39.8579, timezone: 'Asia/Riyadh' },
  { id: 'medina', name: 'Medina', nameFa: 'مدینه', country: 'saudi', countryFa: 'عربستان', lat: 24.4686, lng: 39.6142, timezone: 'Asia/Riyadh' },

  // Other
  { id: 'dubai', name: 'Dubai', nameFa: 'دبی', country: 'uae', countryFa: 'امارات', lat: 25.2048, lng: 55.2708, timezone: 'Asia/Dubai' },
  { id: 'london', name: 'London', nameFa: 'لندن', country: 'uk', countryFa: 'انگلستان', lat: 51.5074, lng: -0.1278, timezone: 'Europe/London' },
  { id: 'newyork', name: 'New York', nameFa: 'نیویورک', country: 'usa', countryFa: 'آمریکا', lat: 40.7128, lng: -74.0060, timezone: 'America/New_York' },
  { id: 'toronto', name: 'Toronto', nameFa: 'تورنتو', country: 'canada', countryFa: 'کانادا', lat: 43.6532, lng: -79.3832, timezone: 'America/Toronto' },
  { id: 'sydney', name: 'Sydney', nameFa: 'سیدنی', country: 'australia', countryFa: 'استرالیا', lat: -33.8688, lng: 151.2093, timezone: 'Australia/Sydney' },
];

const CITY_MAP: Record<string, City> = Object.fromEntries(CITIES.map((c) => [c.id, c]));

export function getCityById(id: string | null | undefined): City {
  if (id && CITY_MAP[id]) return CITY_MAP[id];
  return CITIES[0];
}

const GUEST_CITY_KEY = 'noor_guest_city';

export function getGuestCityId(): string {
  try {
    const id = localStorage.getItem(GUEST_CITY_KEY);
    if (id && CITY_MAP[id]) return id;
  } catch {
    // localStorage unavailable
  }
  return 'tehran';
}

export function setGuestCityId(id: string): void {
  try {
    localStorage.setItem(GUEST_CITY_KEY, id);
  } catch {
    // localStorage unavailable
  }
}
