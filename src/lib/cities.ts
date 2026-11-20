export type CityRegion =
  | 'iran'
  | 'middle_east'
  | 'europe'
  | 'north_america'
  | 'latin_america'
  | 'asia_oceania'
  | 'africa';

export type City = {
  id: string;
  name: string;
  nameFa: string;
  nameEs?: string;
  country: string;
  countryFa: string;
  countryEs?: string;
  countryCode?: string;
  region?: CityRegion;
  lat: number;
  lng: number;
  timezone: string;
};

export const CITIES: City[] = [
  // === ایران (۳۶ شهر اصلی و مراکز استان) ===
  { id: 'tehran', name: 'Tehran', nameFa: 'تهران', nameEs: 'Teherán', country: 'Iran', countryFa: 'ایران', countryEs: 'Irán', countryCode: 'IR', region: 'iran', lat: 35.6892, lng: 51.3890, timezone: 'Asia/Tehran' },
  { id: 'mashhad', name: 'Mashhad', nameFa: 'مشهد', nameEs: 'Mashhad', country: 'Iran', countryFa: 'ایران', countryEs: 'Irán', countryCode: 'IR', region: 'iran', lat: 36.2605, lng: 59.6168, timezone: 'Asia/Tehran' },
  { id: 'qom', name: 'Qom', nameFa: 'قم', nameEs: 'Qom', country: 'Iran', countryFa: 'ایران', countryEs: 'Irán', countryCode: 'IR', region: 'iran', lat: 34.6416, lng: 50.8746, timezone: 'Asia/Tehran' },
  { id: 'isfahan', name: 'Isfahan', nameFa: 'اصفهان', nameEs: 'Isfahán', country: 'Iran', countryFa: 'ایران', countryEs: 'Irán', countryCode: 'IR', region: 'iran', lat: 32.6546, lng: 51.6680, timezone: 'Asia/Tehran' },
  { id: 'shiraz', name: 'Shiraz', nameFa: 'شیراز', nameEs: 'Shiraz', country: 'Iran', countryFa: 'ایران', countryEs: 'Irán', countryCode: 'IR', region: 'iran', lat: 29.5918, lng: 52.5837, timezone: 'Asia/Tehran' },
  { id: 'tabriz', name: 'Tabriz', nameFa: 'تبریز', nameEs: 'Tabriz', country: 'Iran', countryFa: 'ایران', countryEs: 'Irán', countryCode: 'IR', region: 'iran', lat: 38.0962, lng: 46.2738, timezone: 'Asia/Tehran' },
  { id: 'karaj', name: 'Karaj', nameFa: 'کرج', nameEs: 'Karaj', country: 'Iran', countryFa: 'ایران', countryEs: 'Irán', countryCode: 'IR', region: 'iran', lat: 35.8400, lng: 50.9391, timezone: 'Asia/Tehran' },
  { id: 'ahvaz', name: 'Ahvaz', nameFa: 'اهواز', nameEs: 'Ahvaz', country: 'Iran', countryFa: 'ایران', countryEs: 'Irán', countryCode: 'IR', region: 'iran', lat: 31.3183, lng: 48.6706, timezone: 'Asia/Tehran' },
  { id: 'kermanshah', name: 'Kermanshah', nameFa: 'کرمانشاه', nameEs: 'Kermanshah', country: 'Iran', countryFa: 'ایران', countryEs: 'Irán', countryCode: 'IR', region: 'iran', lat: 34.3142, lng: 47.0650, timezone: 'Asia/Tehran' },
  { id: 'rasht', name: 'Rasht', nameFa: 'رشت', nameEs: 'Rasht', country: 'Iran', countryFa: 'ایران', countryEs: 'Irán', countryCode: 'IR', region: 'iran', lat: 37.2808, lng: 49.5832, timezone: 'Asia/Tehran' },
  { id: 'yazd', name: 'Yazd', nameFa: 'یزد', nameEs: 'Yazd', country: 'Iran', countryFa: 'ایران', countryEs: 'Irán', countryCode: 'IR', region: 'iran', lat: 31.8974, lng: 54.3569, timezone: 'Asia/Tehran' },
  { id: 'kerman', name: 'Kerman', nameFa: 'کرمان', nameEs: 'Kermán', country: 'Iran', countryFa: 'ایران', countryEs: 'Irán', countryCode: 'IR', region: 'iran', lat: 30.2839, lng: 57.0834, timezone: 'Asia/Tehran' },
  { id: 'sari', name: 'Sari', nameFa: 'ساری', nameEs: 'Sari', country: 'Iran', countryFa: 'ایران', countryEs: 'Irán', countryCode: 'IR', region: 'iran', lat: 36.5633, lng: 53.0601, timezone: 'Asia/Tehran' },
  { id: 'gorgan', name: 'Gorgan', nameFa: 'گرگان', nameEs: 'Gorgán', country: 'Iran', countryFa: 'ایران', countryEs: 'Irán', countryCode: 'IR', region: 'iran', lat: 36.8427, lng: 54.4326, timezone: 'Asia/Tehran' },
  { id: 'bandar_abbas', name: 'Bandar Abbas', nameFa: 'بندرعباس', nameEs: 'Bandar Abás', country: 'Iran', countryFa: 'ایران', countryEs: 'Irán', countryCode: 'IR', region: 'iran', lat: 27.1832, lng: 56.2666, timezone: 'Asia/Tehran' },
  { id: 'urmia', name: 'Urmia', nameFa: 'ارومیه', nameEs: 'Urmía', country: 'Iran', countryFa: 'ایران', countryEs: 'Irán', countryCode: 'IR', region: 'iran', lat: 37.5527, lng: 45.0761, timezone: 'Asia/Tehran' },
  { id: 'ardabil', name: 'Ardabil', nameFa: 'اردبیل', nameEs: 'Ardabil', country: 'Iran', countryFa: 'ایران', countryEs: 'Irán', countryCode: 'IR', region: 'iran', lat: 38.2498, lng: 48.2933, timezone: 'Asia/Tehran' },
  { id: 'hamedan', name: 'Hamedan', nameFa: 'همدان', nameEs: 'Hamadán', country: 'Iran', countryFa: 'ایران', countryEs: 'Irán', countryCode: 'IR', region: 'iran', lat: 34.7989, lng: 48.5150, timezone: 'Asia/Tehran' },
  { id: 'arak', name: 'Arak', nameFa: 'اراک', nameEs: 'Arak', country: 'Iran', countryFa: 'ایران', countryEs: 'Irán', countryCode: 'IR', region: 'iran', lat: 34.0954, lng: 49.7013, timezone: 'Asia/Tehran' },
  { id: 'qazvin', name: 'Qazvin', nameFa: 'قزوین', nameEs: 'Qazvín', country: 'Iran', countryFa: 'ایران', countryEs: 'Irán', countryCode: 'IR', region: 'iran', lat: 36.2688, lng: 50.0041, timezone: 'Asia/Tehran' },
  { id: 'zanjan', name: 'Zanjan', nameFa: 'زنجان', nameEs: 'Zanyán', country: 'Iran', countryFa: 'ایران', countryEs: 'Irán', countryCode: 'IR', region: 'iran', lat: 36.6764, lng: 48.4963, timezone: 'Asia/Tehran' },
  { id: 'sanandaj', name: 'Sanandaj', nameFa: 'سنندج', nameEs: 'Sanandaj', country: 'Iran', countryFa: 'ایران', countryEs: 'Irán', countryCode: 'IR', region: 'iran', lat: 35.3219, lng: 46.9862, timezone: 'Asia/Tehran' },
  { id: 'khorramabad', name: 'Khorramabad', nameFa: 'خرم‌آباد', nameEs: 'Jorramabad', country: 'Iran', countryFa: 'ایران', countryEs: 'Irán', countryCode: 'IR', region: 'iran', lat: 33.4878, lng: 48.3558, timezone: 'Asia/Tehran' },
  { id: 'bushehr', name: 'Bushehr', nameFa: 'بوشهر', nameEs: 'Bushehr', country: 'Iran', countryFa: 'ایران', countryEs: 'Irán', countryCode: 'IR', region: 'iran', lat: 28.9234, lng: 50.8203, timezone: 'Asia/Tehran' },
  { id: 'zahedan', name: 'Zahedan', nameFa: 'زاهدان', nameEs: 'Zahedán', country: 'Iran', countryFa: 'ایران', countryEs: 'Irán', countryCode: 'IR', region: 'iran', lat: 29.4963, lng: 60.8629, timezone: 'Asia/Tehran' },
  { id: 'birjand', name: 'Birjand', nameFa: 'بیرجند', nameEs: 'Biryand', country: 'Iran', countryFa: 'ایران', countryEs: 'Irán', countryCode: 'IR', region: 'iran', lat: 32.8649, lng: 59.2211, timezone: 'Asia/Tehran' },
  { id: 'bojnurd', name: 'Bojnurd', nameFa: 'بجنورد', nameEs: 'Bojnurd', country: 'Iran', countryFa: 'ایران', countryEs: 'Irán', countryCode: 'IR', region: 'iran', lat: 37.4747, lng: 57.3290, timezone: 'Asia/Tehran' },
  { id: 'semnan', name: 'Semnan', nameFa: 'سمنان', nameEs: 'Semnán', country: 'Iran', countryFa: 'ایران', countryEs: 'Irán', countryCode: 'IR', region: 'iran', lat: 35.5769, lng: 53.3970, timezone: 'Asia/Tehran' },
  { id: 'shahr_e_kord', name: 'Shahr-e Kord', nameFa: 'شهرکرد', nameEs: 'Shahr-e Kord', country: 'Iran', countryFa: 'ایران', countryEs: 'Irán', countryCode: 'IR', region: 'iran', lat: 32.3256, lng: 50.8644, timezone: 'Asia/Tehran' },
  { id: 'yasuj', name: 'Yasuj', nameFa: 'یاسوج', nameEs: 'Yasuj', country: 'Iran', countryFa: 'ایران', countryEs: 'Irán', countryCode: 'IR', region: 'iran', lat: 30.6682, lng: 51.5880, timezone: 'Asia/Tehran' },
  { id: 'ilam', name: 'Ilam', nameFa: 'ایلام', nameEs: 'Ilam', country: 'Iran', countryFa: 'ایران', countryEs: 'Irán', countryCode: 'IR', region: 'iran', lat: 33.6374, lng: 46.4227, timezone: 'Asia/Tehran' },
  { id: 'neyshabur', name: 'Neyshabur', nameFa: 'نیشابور', nameEs: 'Nishapur', country: 'Iran', countryFa: 'ایران', countryEs: 'Irán', countryCode: 'IR', region: 'iran', lat: 36.2133, lng: 58.7958, timezone: 'Asia/Tehran' },
  { id: 'sabzevar', name: 'Sabzevar', nameFa: 'سبزوار', nameEs: 'Sabzevar', country: 'Iran', countryFa: 'ایران', countryEs: 'Irán', countryCode: 'IR', region: 'iran', lat: 36.2126, lng: 57.6819, timezone: 'Asia/Tehran' },
  { id: 'kashan', name: 'Kashan', nameFa: 'کاشان', nameEs: 'Kashán', country: 'Iran', countryFa: 'ایران', countryEs: 'Irán', countryCode: 'IR', region: 'iran', lat: 33.9850, lng: 51.4100, timezone: 'Asia/Tehran' },
  { id: 'dezful', name: 'Dezful', nameFa: 'دزفول', nameEs: 'Dezful', country: 'Iran', countryFa: 'ایران', countryEs: 'Irán', countryCode: 'IR', region: 'iran', lat: 32.3811, lng: 48.4058, timezone: 'Asia/Tehran' },
  { id: 'abadan', name: 'Abadan', nameFa: 'آبادان', nameEs: 'Abadán', country: 'Iran', countryFa: 'ایران', countryEs: 'Irán', countryCode: 'IR', region: 'iran', lat: 30.3392, lng: 48.3043, timezone: 'Asia/Tehran' },

  // === عتبات مقدسه، حرمین و خاورمیانه ===
  { id: 'karbala', name: 'Karbala', nameFa: 'کربلا', nameEs: 'Kerbala', country: 'Iraq', countryFa: 'عراق (عتبات)', countryEs: 'Irak', countryCode: 'IQ', region: 'middle_east', lat: 32.6160, lng: 44.0249, timezone: 'Asia/Baghdad' },
  { id: 'najaf', name: 'Najaf', nameFa: 'نجف اشرف', nameEs: 'Náyaf', country: 'Iraq', countryFa: 'عراق (عتبات)', countryEs: 'Irak', countryCode: 'IQ', region: 'middle_east', lat: 31.9959, lng: 44.3146, timezone: 'Asia/Baghdad' },
  { id: 'baghdad', name: 'Baghdad', nameFa: 'بغداد (کاظمین)', nameEs: 'Bagdad', country: 'Iraq', countryFa: 'عراق (عتبات)', countryEs: 'Irak', countryCode: 'IQ', region: 'middle_east', lat: 33.3152, lng: 44.3661, timezone: 'Asia/Baghdad' },
  { id: 'samarra', name: 'Samarra', nameFa: 'سامرا', nameEs: 'Samarra', country: 'Iraq', countryFa: 'عراق (عتبات)', countryEs: 'Irak', countryCode: 'IQ', region: 'middle_east', lat: 34.1959, lng: 43.8857, timezone: 'Asia/Baghdad' },
  { id: 'makkah', name: 'Makkah', nameFa: 'مکه مکرمه', nameEs: 'La Meca', country: 'Saudi Arabia', countryFa: 'عربستان', countryEs: 'Arabia Saudita', countryCode: 'SA', region: 'middle_east', lat: 21.4225, lng: 39.8262, timezone: 'Asia/Riyadh' },
  { id: 'madinah', name: 'Madinah', nameFa: 'مدینه منوره', nameEs: 'Medina', country: 'Saudi Arabia', countryFa: 'عربستان', countryEs: 'Arabia Saudita', countryCode: 'SA', region: 'middle_east', lat: 24.4672, lng: 39.6112, timezone: 'Asia/Riyadh' },
  { id: 'riyadh', name: 'Riyadh', nameFa: 'ریاض', nameEs: 'Riad', country: 'Saudi Arabia', countryFa: 'عربستان', countryEs: 'Arabia Saudita', countryCode: 'SA', region: 'middle_east', lat: 24.7136, lng: 46.6753, timezone: 'Asia/Riyadh' },
  { id: 'dubai', name: 'Dubai', nameFa: 'دبی', nameEs: 'Dubái', country: 'United Arab Emirates', countryFa: 'امارات', countryEs: 'Emiratos Árabes Unidos', countryCode: 'AE', region: 'middle_east', lat: 25.2048, lng: 55.2708, timezone: 'Asia/Dubai' },
  { id: 'abu_dhabi', name: 'Abu Dhabi', nameFa: 'ابوظبی', nameEs: 'Abu Dabi', country: 'United Arab Emirates', countryFa: 'امارات', countryEs: 'Emiratos Árabes Unidos', countryCode: 'AE', region: 'middle_east', lat: 24.4539, lng: 54.3773, timezone: 'Asia/Dubai' },
  { id: 'doha', name: 'Doha', nameFa: 'دوحه', nameEs: 'Doha', country: 'Qatar', countryFa: 'قطر', countryEs: 'Catar', countryCode: 'QA', region: 'middle_east', lat: 25.2854, lng: 51.5310, timezone: 'Asia/Qatar' },
  { id: 'kuwait_city', name: 'Kuwait City', nameFa: 'کویت', nameEs: 'Ciudad de Kuwait', country: 'Kuwait', countryFa: 'کویت', countryEs: 'Kuwait', countryCode: 'KW', region: 'middle_east', lat: 29.3759, lng: 47.9774, timezone: 'Asia/Kuwait' },
  { id: 'muscat', name: 'Muscat', nameFa: 'مسقط', nameEs: 'Mascate', country: 'Oman', countryFa: 'عمان', countryEs: 'Omán', countryCode: 'OM', region: 'middle_east', lat: 23.5880, lng: 58.3829, timezone: 'Asia/Muscat' },
  { id: 'manama', name: 'Manama', nameFa: 'منامه', nameEs: 'Manama', country: 'Bahrain', countryFa: 'بحرین', countryEs: 'Baréin', countryCode: 'BH', region: 'middle_east', lat: 26.2285, lng: 50.5860, timezone: 'Asia/Bahrain' },
  { id: 'beirut', name: 'Beirut', nameFa: 'بیروت', nameEs: 'Beirut', country: 'Lebanon', countryFa: 'لبنان', countryEs: 'Líbano', countryCode: 'LB', region: 'middle_east', lat: 33.8938, lng: 35.5018, timezone: 'Asia/Beirut' },
  { id: 'damascus', name: 'Damascus', nameFa: 'دمشق', nameEs: 'Damasco', country: 'Syria', countryFa: 'سوریه', countryEs: 'Siria', countryCode: 'SY', region: 'middle_east', lat: 33.5138, lng: 36.2765, timezone: 'Asia/Damascus' },
  { id: 'jerusalem', name: 'Jerusalem (Al-Quds)', nameFa: 'قدس شریف', nameEs: 'Jerusalén', country: 'Palestine', countryFa: 'فلسطین', countryEs: 'Palestina', countryCode: 'PS', region: 'middle_east', lat: 31.7683, lng: 35.2137, timezone: 'Asia/Jerusalem' },
  { id: 'amman', name: 'Amman', nameFa: 'امان', nameEs: 'Amán', country: 'Jordan', countryFa: 'اردن', countryEs: 'Jordania', countryCode: 'JO', region: 'middle_east', lat: 31.9454, lng: 35.9284, timezone: 'Asia/Amman' },
  { id: 'istanbul', name: 'Istanbul', nameFa: 'استانبول', nameEs: 'Estambul', country: 'Turkey', countryFa: 'ترکیه', countryEs: 'Turquía', countryCode: 'TR', region: 'middle_east', lat: 41.0082, lng: 28.9784, timezone: 'Europe/Istanbul' },
  { id: 'ankara', name: 'Ankara', nameFa: 'آنکارا', nameEs: 'Ankara', country: 'Turkey', countryFa: 'ترکیه', countryEs: 'Turquía', countryCode: 'TR', region: 'middle_east', lat: 39.9334, lng: 32.8597, timezone: 'Europe/Istanbul' },
  { id: 'izmir', name: 'Izmir', nameFa: 'ازمیر', nameEs: 'Esmirna', country: 'Turkey', countryFa: 'ترکیه', countryEs: 'Turquía', countryCode: 'TR', region: 'middle_east', lat: 38.4237, lng: 27.1428, timezone: 'Europe/Istanbul' },
  { id: 'baku', name: 'Baku', nameFa: 'باکو', nameEs: 'Bakú', country: 'Azerbaijan', countryFa: 'آذربایجان', countryEs: 'Azerbaiyán', countryCode: 'AZ', region: 'middle_east', lat: 40.4093, lng: 49.8671, timezone: 'Asia/Baku' },
  { id: 'yerevan', name: 'Yerevan', nameFa: 'ایروان', nameEs: 'Ereván', country: 'Armenia', countryFa: 'ارمنستان', countryEs: 'Armenia', countryCode: 'AM', region: 'middle_east', lat: 40.1872, lng: 44.5152, timezone: 'Asia/Yerevan' },
  { id: 'tbilisi', name: 'Tbilisi', nameFa: 'تفلیس', nameEs: 'Tiflis', country: 'Georgia', countryFa: 'گرجستان', countryEs: 'Georgia', countryCode: 'GE', region: 'middle_east', lat: 41.7151, lng: 44.8271, timezone: 'Asia/Tbilisi' },

  // === اروپا (اسپانیا، بریتانیا، آلمان، فرانسه، اسکاندیناوی، ایتالیا و...) ===
  { id: 'madrid', name: 'Madrid', nameFa: 'مادرید', nameEs: 'Madrid', country: 'Spain', countryFa: 'اسپانیا', countryEs: 'España', countryCode: 'ES', region: 'europe', lat: 40.4168, lng: -3.7038, timezone: 'Europe/Madrid' },
  { id: 'barcelona', name: 'Barcelona', nameFa: 'بارسلونا', nameEs: 'Barcelona', country: 'Spain', countryFa: 'اسپانیا', countryEs: 'España', countryCode: 'ES', region: 'europe', lat: 41.3874, lng: 2.1686, timezone: 'Europe/Madrid' },
  { id: 'valencia', name: 'Valencia', nameFa: 'والنسیا', nameEs: 'Valencia', country: 'Spain', countryFa: 'اسپانیا', countryEs: 'España', countryCode: 'ES', region: 'europe', lat: 39.4699, lng: -0.3763, timezone: 'Europe/Madrid' },
  { id: 'seville', name: 'Seville', nameFa: 'سویا', nameEs: 'Sevilla', country: 'Spain', countryFa: 'اسپانیا', countryEs: 'España', countryCode: 'ES', region: 'europe', lat: 37.3891, lng: -5.9845, timezone: 'Europe/Madrid' },
  { id: 'granada', name: 'Granada', nameFa: 'گرانادا (غرناطه)', nameEs: 'Granada', country: 'Spain', countryFa: 'اسپانیا', countryEs: 'España', countryCode: 'ES', region: 'europe', lat: 37.1773, lng: -3.5986, timezone: 'Europe/Madrid' },
  { id: 'cordoba', name: 'Cordoba', nameFa: 'کوردوبا (قرطبه)', nameEs: 'Córdoba', country: 'Spain', countryFa: 'اسپانیا', countryEs: 'España', countryCode: 'ES', region: 'europe', lat: 37.8882, lng: -4.7794, timezone: 'Europe/Madrid' },
  { id: 'malaga', name: 'Malaga', nameFa: 'مالاگا', nameEs: 'Málaga', country: 'Spain', countryFa: 'اسپانیا', countryEs: 'España', countryCode: 'ES', region: 'europe', lat: 36.7213, lng: -4.4214, timezone: 'Europe/Madrid' },
  { id: 'london', name: 'London', nameFa: 'لندن', nameEs: 'Londres', country: 'United Kingdom', countryFa: 'بریتانیا', countryEs: 'Reino Unido', countryCode: 'GB', region: 'europe', lat: 51.5074, lng: -0.1278, timezone: 'Europe/London' },
  { id: 'manchester', name: 'Manchester', nameFa: 'منچستر', nameEs: 'Mánchester', country: 'United Kingdom', countryFa: 'بریتانیا', countryEs: 'Reino Unido', countryCode: 'GB', region: 'europe', lat: 53.4808, lng: -2.2426, timezone: 'Europe/London' },
  { id: 'birmingham', name: 'Birmingham', nameFa: 'بیرمنگام', nameEs: 'Birmingham', country: 'United Kingdom', countryFa: 'بریتانیا', countryEs: 'Reino Unido', countryCode: 'GB', region: 'europe', lat: 52.4862, lng: -1.8904, timezone: 'Europe/London' },
  { id: 'berlin', name: 'Berlin', nameFa: 'برلین', nameEs: 'Berlín', country: 'Germany', countryFa: 'آلمان', countryEs: 'Alemania', countryCode: 'DE', region: 'europe', lat: 52.5200, lng: 13.4050, timezone: 'Europe/Berlin' },
  { id: 'munich', name: 'Munich', nameFa: 'مونیخ', nameEs: 'Múnich', country: 'Germany', countryFa: 'آلمان', countryEs: 'Alemania', countryCode: 'DE', region: 'europe', lat: 48.1351, lng: 11.5820, timezone: 'Europe/Berlin' },
  { id: 'frankfurt', name: 'Frankfurt', nameFa: 'فرانکفورت', nameEs: 'Fráncfort', country: 'Germany', countryFa: 'آلمان', countryEs: 'Alemania', countryCode: 'DE', region: 'europe', lat: 50.1109, lng: 8.6821, timezone: 'Europe/Berlin' },
  { id: 'hamburg', name: 'Hamburg', nameFa: 'هامبورگ', nameEs: 'Hamburgo', country: 'Germany', countryFa: 'آلمان', countryEs: 'Alemania', countryCode: 'DE', region: 'europe', lat: 53.5511, lng: 9.9937, timezone: 'Europe/Berlin' },
  { id: 'cologne', name: 'Cologne', nameFa: 'کلن', nameEs: 'Colonia', country: 'Germany', countryFa: 'آلمان', countryEs: 'Alemania', countryCode: 'DE', region: 'europe', lat: 50.9375, lng: 6.9603, timezone: 'Europe/Berlin' },
  { id: 'paris', name: 'Paris', nameFa: 'پاریس', nameEs: 'París', country: 'France', countryFa: 'فرانسه', countryEs: 'Francia', countryCode: 'FR', region: 'europe', lat: 48.8566, lng: 2.3522, timezone: 'Europe/Paris' },
  { id: 'marseille', name: 'Marseille', nameFa: 'مارسی', nameEs: 'Marsella', country: 'France', countryFa: 'فرانسه', countryEs: 'Francia', countryCode: 'FR', region: 'europe', lat: 43.2965, lng: 5.3698, timezone: 'Europe/Paris' },
  { id: 'lyon', name: 'Lyon', nameFa: 'لیون', nameEs: 'Lyon', country: 'France', countryFa: 'فرانسه', countryEs: 'Francia', countryCode: 'FR', region: 'europe', lat: 45.7640, lng: 4.8357, timezone: 'Europe/Paris' },
  { id: 'amsterdam', name: 'Amsterdam', nameFa: 'آمستردام', nameEs: 'Ámsterdam', country: 'Netherlands', countryFa: 'هلند', countryEs: 'Países Bajos', countryCode: 'NL', region: 'europe', lat: 52.3676, lng: 4.9041, timezone: 'Europe/Amsterdam' },
  { id: 'brussels', name: 'Brussels', nameFa: 'بروکسل', nameEs: 'Bruselas', country: 'Belgium', countryFa: 'بلژیک', countryEs: 'Bélgica', countryCode: 'BE', region: 'europe', lat: 50.8503, lng: 4.3517, timezone: 'Europe/Brussels' },
  { id: 'vienna', name: 'Vienna', nameFa: 'وین', nameEs: 'Viena', country: 'Austria', countryFa: 'اتریش', countryEs: 'Austria', countryCode: 'AT', region: 'europe', lat: 48.2082, lng: 16.3738, timezone: 'Europe/Vienna' },
  { id: 'zurich', name: 'Zurich', nameFa: 'زوریخ', nameEs: 'Zúrich', country: 'Switzerland', countryFa: 'سوئیس', countryEs: 'Suiza', countryCode: 'CH', region: 'europe', lat: 47.3769, lng: 8.5417, timezone: 'Europe/Zurich' },
  { id: 'rome', name: 'Rome', nameFa: 'رم', nameEs: 'Roma', country: 'Italy', countryFa: 'ایتالیا', countryEs: 'Italia', countryCode: 'IT', region: 'europe', lat: 41.9028, lng: 12.4964, timezone: 'Europe/Rome' },
  { id: 'milan', name: 'Milan', nameFa: 'میلان', nameEs: 'Milán', country: 'Italy', countryFa: 'ایتالیا', countryEs: 'Italia', countryCode: 'IT', region: 'europe', lat: 45.4642, lng: 9.1900, timezone: 'Europe/Rome' },
  { id: 'lisbon', name: 'Lisbon', nameFa: 'لیسبون', nameEs: 'Lisboa', country: 'Portugal', countryFa: 'پرتغال', countryEs: 'Portugal', countryCode: 'PT', region: 'europe', lat: 38.7223, lng: -9.1393, timezone: 'Europe/Lisbon' },
  { id: 'stockholm', name: 'Stockholm', nameFa: 'استکهلم', nameEs: 'Estocolmo', country: 'Sweden', countryFa: 'سوئد', countryEs: 'Suecia', countryCode: 'SE', region: 'europe', lat: 59.3293, lng: 18.0686, timezone: 'Europe/Stockholm' },
  { id: 'oslo', name: 'Oslo', nameFa: 'اسلو', nameEs: 'Oslo', country: 'Norway', countryFa: 'نروژ', countryEs: 'Noruega', countryCode: 'NO', region: 'europe', lat: 59.9139, lng: 10.7522, timezone: 'Europe/Oslo' },
  { id: 'copenhagen', name: 'Copenhagen', nameFa: 'کپنهاگ', nameEs: 'Copenhague', country: 'Denmark', countryFa: 'دانمارک', countryEs: 'Dinamarca', countryCode: 'DK', region: 'europe', lat: 55.6761, lng: 12.5683, timezone: 'Europe/Copenhagen' },
  { id: 'moscow', name: 'Moscow', nameFa: 'مسکو', nameEs: 'Moscú', country: 'Russia', countryFa: 'روسیه', countryEs: 'Rusia', countryCode: 'RU', region: 'europe', lat: 55.7558, lng: 37.6173, timezone: 'Europe/Moscow' },

  // === آمریکای شمالی (آمریکا و کانادا) ===
  { id: 'new_york', name: 'New York', nameFa: 'نیویورک', nameEs: 'Nueva York', country: 'United States', countryFa: 'آمریکا', countryEs: 'Estados Unidos', countryCode: 'US', region: 'north_america', lat: 40.7128, lng: -74.0060, timezone: 'America/New_York' },
  { id: 'los_angeles', name: 'Los Angeles', nameFa: 'لس‌آنجلس', nameEs: 'Los Ángeles', country: 'United States', countryFa: 'آمریکا', countryEs: 'Estados Unidos', countryCode: 'US', region: 'north_america', lat: 34.0522, lng: -118.2437, timezone: 'America/Los_Angeles' },
  { id: 'dearborn', name: 'Dearborn (Detroit)', nameFa: 'دیربورن (دیترویت)', nameEs: 'Dearborn (Detroit)', country: 'United States', countryFa: 'آمریکا', countryEs: 'Estados Unidos', countryCode: 'US', region: 'north_america', lat: 42.3223, lng: -83.1763, timezone: 'America/Detroit' },
  { id: 'chicago', name: 'Chicago', nameFa: 'شیکاگو', nameEs: 'Chicago', country: 'United States', countryFa: 'آمریکا', countryEs: 'Estados Unidos', countryCode: 'US', region: 'north_america', lat: 41.8781, lng: -87.6298, timezone: 'America/Chicago' },
  { id: 'houston', name: 'Houston', nameFa: 'هیوستون', nameEs: 'Houston', country: 'United States', countryFa: 'آمریکا', countryEs: 'Estados Unidos', countryCode: 'US', region: 'north_america', lat: 29.7604, lng: -95.3698, timezone: 'America/Chicago' },
  { id: 'washington_dc', name: 'Washington, D.C.', nameFa: 'واشنگتن دی‌سی', nameEs: 'Washington D. C.', country: 'United States', countryFa: 'آمریکا', countryEs: 'Estados Unidos', countryCode: 'US', region: 'north_america', lat: 38.9072, lng: -77.0369, timezone: 'America/New_York' },
  { id: 'san_francisco', name: 'San Francisco', nameFa: 'سانفرانسیسکو', nameEs: 'San Francisco', country: 'United States', countryFa: 'آمریکا', countryEs: 'Estados Unidos', countryCode: 'US', region: 'north_america', lat: 37.7749, lng: -122.4194, timezone: 'America/Los_Angeles' },
  { id: 'miami', name: 'Miami', nameFa: 'میامی', nameEs: 'Miami', country: 'United States', countryFa: 'آمریکا', countryEs: 'Estados Unidos', countryCode: 'US', region: 'north_america', lat: 25.7617, lng: -80.1918, timezone: 'America/New_York' },
  { id: 'toronto', name: 'Toronto', nameFa: 'تورنتو', nameEs: 'Toronto', country: 'Canada', countryFa: 'کانادا', countryEs: 'Canadá', countryCode: 'CA', region: 'north_america', lat: 43.6532, lng: -79.3832, timezone: 'America/Toronto' },
  { id: 'montreal', name: 'Montreal', nameFa: 'مونترال', nameEs: 'Montreal', country: 'Canada', countryFa: 'کانادا', countryEs: 'Canadá', countryCode: 'CA', region: 'north_america', lat: 45.5017, lng: -73.5673, timezone: 'America/Toronto' },
  { id: 'vancouver', name: 'Vancouver', nameFa: 'ونکوور', nameEs: 'Vancouver', country: 'Canada', countryFa: 'کانادا', countryEs: 'Canadá', countryCode: 'CA', region: 'north_america', lat: 49.2827, lng: -123.1207, timezone: 'America/Vancouver' },
  { id: 'ottawa', name: 'Ottawa', nameFa: 'اتاوا', nameEs: 'Ottawa', country: 'Canada', countryFa: 'کانادا', countryEs: 'Canadá', countryCode: 'CA', region: 'north_america', lat: 45.4215, lng: -75.6972, timezone: 'America/Toronto' },

  // === آمریکای لاتین (اسپانیایی‌زبان و برزیل) ===
  { id: 'mexico_city', name: 'Mexico City', nameFa: 'مکزیکوسیتی', nameEs: 'Ciudad de México', country: 'Mexico', countryFa: 'مکزیک', countryEs: 'México', countryCode: 'MX', region: 'latin_america', lat: 19.4326, lng: -99.1332, timezone: 'America/Mexico_City' },
  { id: 'guadalajara', name: 'Guadalajara', nameFa: 'گوادالاخارا', nameEs: 'Guadalajara', country: 'Mexico', countryFa: 'مکزیک', countryEs: 'México', countryCode: 'MX', region: 'latin_america', lat: 20.6597, lng: -103.3496, timezone: 'America/Mexico_City' },
  { id: 'buenos_aires', name: 'Buenos Aires', nameFa: 'بوئنوس‌آیرس', nameEs: 'Buenos Aires', country: 'Argentina', countryFa: 'آرژانتین', countryEs: 'Argentina', countryCode: 'AR', region: 'latin_america', lat: -34.6037, lng: -58.3816, timezone: 'America/Argentina/Buenos_Aires' },
  { id: 'bogota', name: 'Bogota', nameFa: 'بوگوتا', nameEs: 'Bogotá', country: 'Colombia', countryFa: 'کلمبیا', countryEs: 'Colombia', countryCode: 'CO', region: 'latin_america', lat: 4.7110, lng: -74.0721, timezone: 'America/Bogota' },
  { id: 'lima', name: 'Lima', nameFa: 'لیما', nameEs: 'Lima', country: 'Peru', countryFa: 'پرو', countryEs: 'Perú', countryCode: 'PE', region: 'latin_america', lat: -12.0464, lng: -77.0428, timezone: 'America/Lima' },
  { id: 'santiago', name: 'Santiago', nameFa: 'سانتیاگو', nameEs: 'Santiago', country: 'Chile', countryFa: 'شیلی', countryEs: 'Chile', countryCode: 'CL', region: 'latin_america', lat: -33.4489, lng: -70.6693, timezone: 'America/Santiago' },
  { id: 'caracas', name: 'Caracas', nameFa: 'کاراکاس', nameEs: 'Caracas', country: 'Venezuela', countryFa: 'ونزوئلا', countryEs: 'Venezuela', countryCode: 'VE', region: 'latin_america', lat: 10.4806, lng: -66.9036, timezone: 'America/Caracas' },
  { id: 'quito', name: 'Quito', nameFa: 'کیتو', nameEs: 'Quito', country: 'Ecuador', countryFa: 'اکوادور', countryEs: 'Ecuador', countryCode: 'EC', region: 'latin_america', lat: -0.1807, lng: -78.4678, timezone: 'America/Guayaquil' },
  { id: 'sao_paulo', name: 'Sao Paulo', nameFa: 'سائوپائولو', nameEs: 'São Paulo', country: 'Brazil', countryFa: 'برزیل', countryEs: 'Brasil', countryCode: 'BR', region: 'latin_america', lat: -23.5505, lng: -46.6333, timezone: 'America/Sao_Paulo' },

  // === آسیا و اقیانوسیه ===
  { id: 'kabul', name: 'Kabul', nameFa: 'کابل', nameEs: 'Kabul', country: 'Afghanistan', countryFa: 'افغانستان', countryEs: 'Afganistán', countryCode: 'AF', region: 'asia_oceania', lat: 34.5553, lng: 69.2075, timezone: 'Asia/Kabul' },
  { id: 'dushanbe', name: 'Dushanbe', nameFa: 'دوشنبه', nameEs: 'Dusambé', country: 'Tajikistan', countryFa: 'تاجیکستان', countryEs: 'Tayikistán', countryCode: 'TJ', region: 'asia_oceania', lat: 38.5598, lng: 68.7870, timezone: 'Asia/Dushanbe' },
  { id: 'karachi', name: 'Karachi', nameFa: 'کراچی', nameEs: 'Karachi', country: 'Pakistan', countryFa: 'پاکستان', countryEs: 'Pakistán', countryCode: 'PK', region: 'asia_oceania', lat: 24.8607, lng: 67.0011, timezone: 'Asia/Karachi' },
  { id: 'lahore', name: 'Lahore', nameFa: 'لاهور', nameEs: 'Lahore', country: 'Pakistan', countryFa: 'پاکستان', countryEs: 'Pakistán', countryCode: 'PK', region: 'asia_oceania', lat: 31.5204, lng: 74.3587, timezone: 'Asia/Karachi' },
  { id: 'islamabad', name: 'Islamabad', nameFa: 'اسلام‌آباد', nameEs: 'Islamabad', country: 'Pakistan', countryFa: 'پاکستان', countryEs: 'Pakistán', countryCode: 'PK', region: 'asia_oceania', lat: 33.6844, lng: 73.0479, timezone: 'Asia/Karachi' },
  { id: 'new_delhi', name: 'New Delhi', nameFa: 'دهلی نو', nameEs: 'Nueva Delhi', country: 'India', countryFa: 'هند', countryEs: 'India', countryCode: 'IN', region: 'asia_oceania', lat: 28.6139, lng: 77.2090, timezone: 'Asia/Kolkata' },
  { id: 'mumbai', name: 'Mumbai', nameFa: 'بمبئی', nameEs: 'Bombay', country: 'India', countryFa: 'هند', countryEs: 'India', countryCode: 'IN', region: 'asia_oceania', lat: 19.0760, lng: 72.8777, timezone: 'Asia/Kolkata' },
  { id: 'kuala_lumpur', name: 'Kuala Lumpur', nameFa: 'کوالالامپور', nameEs: 'Kuala Lumpur', country: 'Malaysia', countryFa: 'مالزی', countryEs: 'Malasia', countryCode: 'MY', region: 'asia_oceania', lat: 3.1390, lng: 101.6869, timezone: 'Asia/Kuala_Lumpur' },
  { id: 'jakarta', name: 'Jakarta', nameFa: 'جاکارتا', nameEs: 'Yakarta', country: 'Indonesia', countryFa: 'اندونزی', countryEs: 'Indonesia', countryCode: 'ID', region: 'asia_oceania', lat: -6.2088, lng: 106.8456, timezone: 'Asia/Jakarta' },
  { id: 'singapore', name: 'Singapore', nameFa: 'سنگاپور', nameEs: 'Singapur', country: 'Singapore', countryFa: 'سنگاپور', countryEs: 'Singapur', countryCode: 'SG', region: 'asia_oceania', lat: 1.3521, lng: 103.8198, timezone: 'Asia/Singapore' },
  { id: 'tokyo', name: 'Tokyo', nameFa: 'توکیو', nameEs: 'Tokio', country: 'Japan', countryFa: 'ژاپن', countryEs: 'Japón', countryCode: 'JP', region: 'asia_oceania', lat: 35.6762, lng: 139.6503, timezone: 'Asia/Tokyo' },
  { id: 'seoul', name: 'Seoul', nameFa: 'سئول', nameEs: 'Seúl', country: 'South Korea', countryFa: 'کره جنوبی', countryEs: 'Corea del Sur', countryCode: 'KR', region: 'asia_oceania', lat: 37.5665, lng: 126.9780, timezone: 'Asia/Seoul' },
  { id: 'sydney', name: 'Sydney', nameFa: 'سیدنی', nameEs: 'Sídney', country: 'Australia', countryFa: 'استرالیا', countryEs: 'Australia', countryCode: 'AU', region: 'asia_oceania', lat: -33.8688, lng: 151.2093, timezone: 'Australia/Sydney' },
  { id: 'melbourne', name: 'Melbourne', nameFa: 'ملبورن', nameEs: 'Melbourne', country: 'Australia', countryFa: 'استرالیا', countryEs: 'Australia', countryCode: 'AU', region: 'asia_oceania', lat: -37.8136, lng: 144.9631, timezone: 'Australia/Melbourne' },

  // === آفریقا ===
  { id: 'cairo', name: 'Cairo', nameFa: 'قاهره', nameEs: 'El Cairo', country: 'Egypt', countryFa: 'مصر', countryEs: 'Egipto', countryCode: 'EG', region: 'africa', lat: 30.0444, lng: 31.2357, timezone: 'Africa/Cairo' },
  { id: 'casablanca', name: 'Casablanca', nameFa: 'کازابلانکا', nameEs: 'Casablanca', country: 'Morocco', countryFa: 'مراکش', countryEs: 'Marruecos', countryCode: 'MA', region: 'africa', lat: 33.5731, lng: -7.5898, timezone: 'Africa/Casablanca' },
  { id: 'algiers', name: 'Algiers', nameFa: 'الجزیره', nameEs: 'Argel', country: 'Algeria', countryFa: 'الجزایر', countryEs: 'Argelia', countryCode: 'DZ', region: 'africa', lat: 36.7538, lng: 3.0588, timezone: 'Africa/Algiers' },
  { id: 'tunis', name: 'Tunis', nameFa: 'تونس', nameEs: 'Túnez', country: 'Tunisia', countryFa: 'تونس', countryEs: 'Túnez', countryCode: 'TN', region: 'africa', lat: 36.8065, lng: 10.1815, timezone: 'Africa/Tunis' },
  { id: 'lagos', name: 'Lagos', nameFa: 'لاگوس', nameEs: 'Lagos', country: 'Nigeria', countryFa: 'نیجریه', countryEs: 'Nigeria', countryCode: 'NG', region: 'africa', lat: 6.5244, lng: 3.3792, timezone: 'Africa/Lagos' },
  { id: 'johannesburg', name: 'Johannesburg', nameFa: 'ژوهانسبورگ', nameEs: 'Johannesburgo', country: 'South Africa', countryFa: 'آفریقای جنوبی', countryEs: 'Sudáfrica', countryCode: 'ZA', region: 'africa', lat: -26.2041, lng: 28.0473, timezone: 'Africa/Johannesburg' },
];

const GUEST_CITY_KEY = 'noor_guest_city_id';

export function getCityDisplayName(city: City, lang: 'fa' | 'en' | 'es' = 'fa'): string {
  if (lang === 'en') return city.name;
  if (lang === 'es') return city.nameEs || city.name;
  return city.nameFa;
}

export function getCountryDisplayName(city: City, lang: 'fa' | 'en' | 'es' = 'fa'): string {
  if (lang === 'en') return city.country;
  if (lang === 'es') return city.countryEs || city.country;
  return city.countryFa;
}

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

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findNearestCity(lat: number, lng: number): { city: City; distanceKm: number } {
  let best = CITIES[0];
  let bestDist = Infinity;
  for (const c of CITIES) {
    const d = haversineKm(lat, lng, c.lat, c.lng);
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return { city: best, distanceKm: Math.round(bestDist) };
}

const CUSTOM_GPS_KEY = 'noor_exact_gps_coords_v1';

export function saveCustomGpsCoords(lat: number, lng: number, labelFa?: string): void {
  try {
    localStorage.setItem(CUSTOM_GPS_KEY, JSON.stringify({ lat, lng, labelFa: labelFa || '' }));
  } catch {}
}

export function getCustomGpsCoords(): { lat: number; lng: number; labelFa: string } | null {
  try {
    const raw = localStorage.getItem(CUSTOM_GPS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.lat === 'number' && typeof parsed?.lng === 'number') return parsed;
    return null;
  } catch {
    return null;
  }
}

export function clearCustomGpsCoords(): void {
  try { localStorage.removeItem(CUSTOM_GPS_KEY); } catch {}
}
