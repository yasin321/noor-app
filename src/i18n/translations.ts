export type AppLang = 'fa' | 'en' | 'es';

export const LANGUAGE_OPTIONS: {
  id: AppLang;
  nativeName: string;
  englishName: string;
  dir: 'rtl' | 'ltr';
  regionNote: string;
}[] = [
  {
    id: 'fa',
    nativeName: 'فارسی',
    englishName: 'Persian (Iran)',
    dir: 'rtl',
    regionNote: 'تقویم شمسی و قمری · چیدمان راست‌به‌چپ',
  },
  {
    id: 'en',
    nativeName: 'English',
    englishName: 'English (Global)',
    dir: 'ltr',
    regionNote: 'Gregorian & Hijri calendar · Left-to-Right',
  },
  {
    id: 'es',
    nativeName: 'Español',
    englishName: 'Spanish (España y Latinoamérica)',
    dir: 'ltr',
    regionNote: 'Calendario gregoriano e islámico · Izquierda a derecha',
  },
];

const fa = {
  // Navigation
  'nav.tasbih': 'ذکرشمار',
  'nav.library': 'ذکرها',
  'nav.home': 'خانه',
  'nav.reminders': 'یادآوری',
  'nav.settings': 'تنظیمات',
  'nav.ariaMain': 'منوی اصلی پایین صفحه',

  // Prayers
  'prayer.fajr': 'صبح',
  'prayer.sunrise': 'طلوع',
  'prayer.dhuhr': 'ظهر',
  'prayer.asr': 'عصر',
  'prayer.maghrib': 'مغرب',
  'prayer.isha': 'عشاء',
  'prayer.midnight': 'نیمه‌شب',

  // Common actions
  'common.back': 'بازگشت',
  'common.close': 'بستن',
  'common.save': 'ذخیره',
  'common.active': 'فعال',
  'common.recommended': 'پیشنهادی',
  'common.guest': 'کاربر مهمان',
  'common.noorUser': 'کاربر نور',
  'common.minutes': 'دقیقه',

  // Settings main
  'settings.title': 'تنظیمات',
  'settings.guide': 'راهنمای برنامه',
  'settings.period7': '۷ روز',
  'settings.period30': '۱ ماه',
  'settings.period90': 'فصلی',
  'settings.statTotalDhikr': 'کل اذکار',
  'settings.statRounds': 'دور تسبیح',
  'settings.statStreak': 'زنجیره تداوم 🔥',
  'settings.daysSuffix': 'روز',
  'settings.favoriteDhikr': 'محبوب‌ترین ذکر شما:',
  'settings.birthdayLabel': '🎂 تاریخ تولد من:',
  'settings.birthdaySet': 'ثبت تاریخ تولد ←',
  'settings.birthdayEdit': 'ویرایش',
  'settings.birthdaySave': 'ذخیره تاریخ تولد 🎂',
  'settings.birthdayYearPlaceholder': 'سال (اختیاری)',

  'settings.catAppearance': 'زبان، ظاهر و شخصی‌سازی',
  'settings.rowLanguage': 'زبان برنامه (Language / Idioma)',
  'settings.rowTypography': 'فونت، اندازه متن و نمایش قرآن',
  'settings.rowTheme': 'پوسته و رنگ‌بندی',
  'settings.rowCustomize': 'شخصی‌سازی بخش‌های صفحه اول',
  'settings.rowCustomizeVal': 'کم یا زیاد کردن کارت‌ها',

  'settings.catPrayer': 'اذان، اوقات شرعی و مکان‌یابی',
  'settings.rowAdhan': 'صدای مؤذن و مدت پخش اذان',
  'settings.rowCity': 'شهر و موقعیت اوقات شرعی',
  'settings.rowMethod': 'روش محاسبه اوقات شرعی',

  'settings.catCloud': 'همگام‌سازی ابری، گزارش معنوی و اعلان‌ها',
  'settings.rowGlobalSync': 'سینک گلوبال و نواهای جدید',
  'settings.rowGlobalSyncUpdate': 'نسخه جدید آماده است',
  'settings.rowGlobalSyncCount': 'نوای آنلاین',
  'settings.rowAnalytics': 'گزارش معنوی، آمار و دفترچه قضا',
  'settings.rowAnalyticsVal': 'مشاهده کامل',
  'settings.rowBackup': 'پشتیبان‌گیری و بازیابی اطلاعات',
  'settings.rowBackupVal': 'ذخیره در گوشی / ابر',
  'settings.rowNotifications': 'اعلان‌ها و یادآوری‌های هوشمند',
  'settings.notifAndroidOnly': 'آلارم قفل صفحه در نسخه اندروید فعال است.',

  'settings.catSupport': 'ارتباط با سازنده و پشتیبانی',
  'settings.supportTitle': 'ارتباط مستقیم با سازنده برنامه',
  'settings.supportSubtitle': 'ارسال نظر، پیشنهاد، انتقاد یا گزارش مشکل فنی',
  'settings.supportBtn': 'ارسال پیام',
  'settings.signOut': 'خروج از حساب کاربری',
  'settings.signInCta': 'ورود یا ساخت حساب پشتیبان ابری',

  // Language subpage
  'lang.title': 'انتخاب زبان برنامه',
  'lang.intro': 'زبان رابط کاربری، جهت چیدمان صفحه (راست‌به‌چپ / چپ‌به‌راست)، تقویم و ارقام برنامه بلافاصله تغییر می‌کند و روی حساب ابری شما ذخیره می‌شود.',
  'lang.currentBadge': 'زبان فعال',

  // City & GPS subpage
  'city.title': 'انتخاب شهر و مکان‌یابی جهانی',
  'city.gpsTitle': '📍 یافتن خودکار مکان دقیق من (GPS)',
  'city.gpsActivePrefix': 'فعال روی:',
  'city.gpsDesc': 'محاسبه اوقات شرعی دقیقاً روی مختصات فعلی شما در هر نقطه از جهان',
  'city.gpsClear': 'حذف GPS',
  'city.gpsBtn': 'پیدا کردن سریع مکان من با GPS',
  'city.gpsDetecting': 'در حال دریافت مکان از GPS...',
  'city.searchPlaceholder': '🔍 جستجوی شهر یا کشور (تهران، مشهد، Madrid، London، New York...)',
  'city.empty': 'شهری با این نام پیدا نشد؛ از دکمه GPS بالا برای ثبت مستقیم مختصات خود استفاده کنید.',
  'city.regionAll': 'همه جهان',
  'city.regionIran': 'ایران',
  'city.regionMiddleEast': 'خاورمیانه',
  'city.regionEurope': 'اروپا و اسپانیا',
  'city.regionNorthAmerica': 'آمریکا و کانادا',
  'city.regionLatinAmerica': 'آمریکای لاتین',
  'city.regionAsiaOceania': 'آسیا و اقیانوسیه',
  'city.regionAfrica': 'آفریقا',

  // Calculation method subpage
  'method.title': 'روش محاسبه اوقات شرعی',
  'method.intro': 'محاسبه اوقات شرعی در نور کاملاً آفلاین و نجومی است و هر روز بدون نیاز به اینترنت برای تمام نقاط جهان دقیق به‌روزرسانی می‌شود.',
  'method.asrTitle': 'فقه محاسبه وقت عصر',
  'method.asrDesc': 'برای ایران و اکثریت جهان روی «استاندارد» بماند؛ برای پیروان مذهب حنفی گزینه «حنفی» را انتخاب کنید.',
  'method.asrStandard': 'استاندارد (جعفری / شافعی)',
  'method.asrHanafi': 'حنفی (سایه دو برابر)',
  'method.manualTitle': 'تنظیم دستی احتیاط شرعی (اختیاری)',
  'method.manualActive': 'تغییر دستی روی برخی نمازها فعال است',
  'method.manualDefault': 'پیش‌فرض: ۰ دقیقه (توصیه‌شده برای محاسبه استاندارد)',
  'method.manualOpen': 'تنظیم ▼',
  'method.manualClose': 'بستن ▲',
  'method.manualHint': 'در حالت عادی نیازی به تغییر این بخش نیست؛ این گزینه فقط در صورت تمایل به اعمال ۱ تا ۵ دقیقه احتیاط یا هماهنگی با مسجد محله است.',
  'method.manualReset': 'بازگردانی همه به صفر (حالت استاندارد)',
} as const;

export type TranslationKey = keyof typeof fa;

const en: Record<TranslationKey, string> = {
  // Navigation
  'nav.tasbih': 'Tasbih',
  'nav.library': 'Adhkar',
  'nav.home': 'Home',
  'nav.reminders': 'Reminders',
  'nav.settings': 'Settings',
  'nav.ariaMain': 'Main bottom navigation',

  // Prayers
  'prayer.fajr': 'Fajr',
  'prayer.sunrise': 'Sunrise',
  'prayer.dhuhr': 'Dhuhr',
  'prayer.asr': 'Asr',
  'prayer.maghrib': 'Maghrib',
  'prayer.isha': 'Isha',
  'prayer.midnight': 'Midnight',

  // Common actions
  'common.back': 'Back',
  'common.close': 'Close',
  'common.save': 'Save',
  'common.active': 'Active',
  'common.recommended': 'Recommended',
  'common.guest': 'Guest User',
  'common.noorUser': 'Noor Member',
  'common.minutes': 'min',

  // Settings main
  'settings.title': 'Settings',
  'settings.guide': 'App Guide',
  'settings.period7': '7 Days',
  'settings.period30': '1 Month',
  'settings.period90': '90 Days',
  'settings.statTotalDhikr': 'Total Dhikr',
  'settings.statRounds': 'Tasbih Rounds',
  'settings.statStreak': 'Streak 🔥',
  'settings.daysSuffix': 'days',
  'settings.favoriteDhikr': 'Most recited dhikr:',
  'settings.birthdayLabel': '🎂 My Birthday:',
  'settings.birthdaySet': 'Add Birthday',
  'settings.birthdayEdit': 'Edit',
  'settings.birthdaySave': 'Save Birthday 🎂',
  'settings.birthdayYearPlaceholder': 'Year (optional)',

  'settings.catAppearance': 'Language, Appearance & Layout',
  'settings.rowLanguage': 'App Language',
  'settings.rowTypography': 'Font, Text Size & Quran View',
  'settings.rowTheme': 'Theme & Colors',
  'settings.rowCustomize': 'Customize Home Screen',
  'settings.rowCustomizeVal': 'Show or hide cards',

  'settings.catPrayer': 'Adhan, Prayer Times & Location',
  'settings.rowAdhan': 'Muezzin Voice & Adhan Duration',
  'settings.rowCity': 'City & Global GPS Location',
  'settings.rowMethod': 'Prayer Calculation Method',

  'settings.catCloud': 'Cloud Sync, Insights & Alerts',
  'settings.rowGlobalSync': 'Global Sync & Live Media',
  'settings.rowGlobalSyncUpdate': 'Update available',
  'settings.rowGlobalSyncCount': 'online tracks',
  'settings.rowAnalytics': 'Spiritual Insights & Qaza Tracker',
  'settings.rowAnalyticsVal': 'View all',
  'settings.rowBackup': 'Backup & Restore Data',
  'settings.rowBackupVal': 'Device / Cloud',
  'settings.rowNotifications': 'Smart Prayer & Dhikr Alerts',
  'settings.notifAndroidOnly': 'Full-screen lockscreen Adhan alarms run on Android.',

  'settings.catSupport': 'Contact & Support',
  'settings.supportTitle': 'Contact the Developer',
  'settings.supportSubtitle': 'Send feedback, feature ideas, or bug reports',
  'settings.supportBtn': 'Message',
  'settings.signOut': 'Sign Out',
  'settings.signInCta': 'Sign In or Create Cloud Backup Account',

  // Language subpage
  'lang.title': 'Choose App Language',
  'lang.intro': 'Interface language, layout direction (RTL / LTR), calendar format, and numerals update immediately and sync across your devices.',
  'lang.currentBadge': 'Active',

  // City & GPS subpage
  'city.title': 'City & Global Location',
  'city.gpsTitle': '📍 Auto-Detect My Exact Location (GPS)',
  'city.gpsActivePrefix': 'Active at:',
  'city.gpsDesc': 'Calculates accurate offline prayer times for your exact GPS coordinates anywhere on Earth',
  'city.gpsClear': 'Clear GPS',
  'city.gpsBtn': 'Detect My Location via GPS',
  'city.gpsDetecting': 'Acquiring GPS coordinates...',
  'city.searchPlaceholder': '🔍 Search city or country (London, New York, Madrid, Tehran...)',
  'city.empty': 'No matching city found. Tap GPS above to calculate times directly for your coordinates.',
  'city.regionAll': 'All World',
  'city.regionIran': 'Iran',
  'city.regionMiddleEast': 'Middle East',
  'city.regionEurope': 'Europe & Spain',
  'city.regionNorthAmerica': 'North America',
  'city.regionLatinAmerica': 'Latin America',
  'city.regionAsiaOceania': 'Asia & Oceania',
  'city.regionAfrica': 'Africa',

  // Calculation method subpage
  'method.title': 'Prayer Calculation Method',
  'method.intro': 'Prayer times are calculated 100% offline using high-precision astronomical formulas with automatic high-latitude support worldwide.',
  'method.asrTitle': 'Asr Juristic Method (Madhab)',
  'method.asrDesc': 'Keep Standard (Shafi/Jafari/Maliki/Hanbali) for most regions, or select Hanafi for the later Asr shadow ratio.',
  'method.asrStandard': 'Standard (Shafi / Jafari)',
  'method.asrHanafi': 'Hanafi (2x shadow)',
  'method.manualTitle': 'Manual Time Adjustments (Optional)',
  'method.manualActive': 'Custom minute adjustments are active',
  'method.manualDefault': 'Default: 0 min (recommended astronomical time)',
  'method.manualOpen': 'Adjust ▼',
  'method.manualClose': 'Close ▲',
  'method.manualHint': 'Not needed for daily use; only adjust ±1 to 5 minutes to match your local mosque timetable.',
  'method.manualReset': 'Reset All Adjustments to Zero',
};

const es: Record<TranslationKey, string> = {
  // Navigation
  'nav.tasbih': 'Tasbih',
  'nav.library': 'Adhkar',
  'nav.home': 'Inicio',
  'nav.reminders': 'Alertas',
  'nav.settings': 'Ajustes',
  'nav.ariaMain': 'Navegación principal inferior',

  // Prayers
  'prayer.fajr': 'Fajr',
  'prayer.sunrise': 'Salida del sol',
  'prayer.dhuhr': 'Dhuhr',
  'prayer.asr': 'Asr',
  'prayer.maghrib': 'Magrib',
  'prayer.isha': 'Isha',
  'prayer.midnight': 'Medianoche',

  // Common actions
  'common.back': 'Volver',
  'common.close': 'Cerrar',
  'common.save': 'Guardar',
  'common.active': 'Activo',
  'common.recommended': 'Recomendado',
  'common.guest': 'Invitado',
  'common.noorUser': 'Usuario de Noor',
  'common.minutes': 'min',

  // Settings main
  'settings.title': 'Ajustes',
  'settings.guide': 'Guía',
  'settings.period7': '7 días',
  'settings.period30': '1 mes',
  'settings.period90': '90 días',
  'settings.statTotalDhikr': 'Dhikr total',
  'settings.statRounds': 'Rondas',
  'settings.statStreak': 'Racha 🔥',
  'settings.daysSuffix': 'días',
  'settings.favoriteDhikr': 'Dhikr más recitado:',
  'settings.birthdayLabel': '🎂 Mi cumpleaños:',
  'settings.birthdaySet': 'Añadir fecha',
  'settings.birthdayEdit': 'Editar',
  'settings.birthdaySave': 'Guardar cumpleaños 🎂',
  'settings.birthdayYearPlaceholder': 'Año (opcional)',

  'settings.catAppearance': 'Idioma, Apariencia y Diseño',
  'settings.rowLanguage': 'Idioma de la aplicación',
  'settings.rowTypography': 'Fuente, Tamaño y Vista del Corán',
  'settings.rowTheme': 'Tema y Colores',
  'settings.rowCustomize': 'Personalizar Pantalla de Inicio',
  'settings.rowCustomizeVal': 'Mostrar u ocultar tarjetas',

  'settings.catPrayer': 'Adhan, Horarios y Ubicación',
  'settings.rowAdhan': 'Voz del Almuédano y Duración',
  'settings.rowCity': 'Ciudad y Ubicación GPS Global',
  'settings.rowMethod': 'Método de Cálculo de Oración',

  'settings.catCloud': 'Sincronización, Progreso y Alertas',
  'settings.rowGlobalSync': 'Sincronización Global y Audios',
  'settings.rowGlobalSyncUpdate': 'Nueva versión disponible',
  'settings.rowGlobalSyncCount': 'audios en línea',
  'settings.rowAnalytics': 'Estadísticas y Registro Qaza',
  'settings.rowAnalyticsVal': 'Ver todo',
  'settings.rowBackup': 'Copia de Seguridad y Restauración',
  'settings.rowBackupVal': 'Dispositivo / Nube',
  'settings.rowNotifications': 'Alertas Inteligentes de Oración',
  'settings.notifAndroidOnly': 'Las alarmas de Adhan en pantalla bloqueada funcionan en Android.',

  'settings.catSupport': 'Contacto y Soporte',
  'settings.supportTitle': 'Contactar con el Desarrollador',
  'settings.supportSubtitle': 'Envía sugerencias, comentarios o reportes técnicos',
  'settings.supportBtn': 'Enviar',
  'settings.signOut': 'Cerrar sesión',
  'settings.signInCta': 'Iniciar sesión o crear cuenta en la nube',

  // Language subpage
  'lang.title': 'Seleccionar Idioma',
  'lang.intro': 'El idioma, la dirección del diseño (RTL / LTR), el calendario y los números cambian al instante y se sincronizan en la nube.',
  'lang.currentBadge': 'Activo',

  // City & GPS subpage
  'city.title': 'Ciudad y Ubicación Global',
  'city.gpsTitle': '📍 Detectar mi ubicación exacta (GPS)',
  'city.gpsActivePrefix': 'Activo en:',
  'city.gpsDesc': 'Calcula horarios exactos sin conexión según tus coordenadas GPS en cualquier parte del mundo',
  'city.gpsClear': 'Quitar GPS',
  'city.gpsBtn': 'Detectar ubicación con GPS',
  'city.gpsDetecting': 'Obteniendo coordenadas GPS...',
  'city.searchPlaceholder': '🔍 Buscar ciudad o país (Madrid, México, Buenos Aires, Londres...)',
  'city.empty': 'No se encontró la ciudad. Usa el botón GPS arriba para calcular con tus coordenadas exactas.',
  'city.regionAll': 'Todo el mundo',
  'city.regionIran': 'Irán',
  'city.regionMiddleEast': 'Oriente Medio',
  'city.regionEurope': 'Europa y España',
  'city.regionNorthAmerica': 'Norteamérica',
  'city.regionLatinAmerica': 'Latinoamérica',
  'city.regionAsiaOceania': 'Asia y Oceanía',
  'city.regionAfrica': 'África',

  // Calculation method subpage
  'method.title': 'Método de Cálculo de Oración',
  'method.intro': 'Los horarios se calculan 100% sin conexión con fórmulas astronómicas precisas y soporte automático para latitudes altas.',
  'method.asrTitle': 'Escuela Jurídica para Asr (Madhab)',
  'method.asrDesc': 'Mantén Estándar para la mayoría de regiones o elige Hanafí para el cálculo de sombra doble.',
  'method.asrStandard': 'Estándar (Shafi / Yafarí)',
  'method.asrHanafi': 'Hanafí (sombra doble)',
  'method.manualTitle': 'Ajuste Manual de Minutos (Opcional)',
  'method.manualActive': 'Hay ajustes manuales activos',
  'method.manualDefault': 'Predeterminado: 0 min (cálculo astronómico estándar)',
  'method.manualOpen': 'Ajustar ▼',
  'method.manualClose': 'Cerrar ▲',
  'method.manualHint': 'Normalmente no es necesario; úsalo solo para ajustar ±1 a 5 min con tu mezquita local.',
  'method.manualReset': 'Restablecer todos a cero',
};

export const translations: Record<AppLang, Record<TranslationKey, string>> = {
  fa,
  en,
  es,
};
