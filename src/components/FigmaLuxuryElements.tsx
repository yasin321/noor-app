import { toFaDigits } from '@/lib/jalali';

// ۱. وکتورهای مناسبتی برای کارت‌های پوسته در تنظیمات
export function ThemePatternWatermark({ themeId, className = '' }: { themeId: string; className?: string }) {
  if (themeId === 'ramadan_night') {
    return (
      <svg className={`pointer-events-none absolute inset-0 w-full h-full ${className}`} viewBox="0 0 320 140" fill="none">
        <path d="M275 22C261 22 250 33 250 47C250 61 261 72 275 72C267 66 262 57 262 47C262 37 267 28 275 22Z" fill="#FBBF24" fillOpacity="0.45" />
        <line x1="45" y1="0" x2="45" y2="28" stroke="#FBBF24" strokeWidth="1.5" />
        <polygon points="45,28 56,44 45,62 34,44" fill="#F59E0B" fillOpacity="0.42" stroke="#FDE68A" strokeWidth="1" />
      </svg>
    );
  }
  if (themeId === 'yalda_fest') {
    return (
      <svg className={`pointer-events-none absolute inset-0 w-full h-full ${className}`} viewBox="0 0 320 140" fill="none">
        <circle cx="55" cy="68" r="26" fill="#E11D48" fillOpacity="0.42" stroke="#FDA4AF" strokeWidth="1.2" />
        <path d="M225 96 A34 34 0 0 0 293 96 Z" fill="#10B981" fillOpacity="0.4" />
        <path d="M231 96 A28 28 0 0 0 287 96 Z" fill="#F43F5E" fillOpacity="0.45" />
      </svg>
    );
  }
  if (themeId === 'nowruz_spring' || themeId === 'blossom_serenity') {
    return (
      <svg className={`pointer-events-none absolute inset-0 w-full h-full ${className}`} viewBox="0 0 320 140" fill="none">
        <circle cx="48" cy="42" r="12" fill="#F472B6" fillOpacity="0.38" />
        <circle cx="48" cy="42" r="4" fill="#FEF08A" />
        <circle cx="265" cy="74" r="22" fill="#38BDF8" fillOpacity="0.22" stroke="#A7F3D0" strokeWidth="1.2" />
      </svg>
    );
  }
  if (themeId === 'muharram_ashura') {
    return (
      <svg className={`pointer-events-none absolute inset-0 w-full h-full ${className}`} viewBox="0 0 320 140" fill="none">
        <line x1="52" y1="14" x2="52" y2="125" stroke="#F59E0B" strokeWidth="2.2" />
        <path d="M52 20 C88 14 112 34 142 24 L142 58 C112 68 88 48 52 54 Z" fill="#EF4444" fillOpacity="0.42" />
      </svg>
    );
  }
  if (themeId === 'fatimiyya_grief') {
    return (
      <svg className={`pointer-events-none absolute inset-0 w-full h-full ${className}`} viewBox="0 0 320 140" fill="none">
        <rect x="48" y="58" width="16" height="56" rx="4" fill="#E2E8F0" fillOpacity="0.38" />
        <path d="M56 32 C49 43 49 52 56 56 C63 52 63 43 56 32 Z" fill="#FDE047" fillOpacity="0.8" />
      </svg>
    );
  }
  return null;
}

// ۲. پس‌زمینه پانورامای حرم مطهر و افق شهر/فصل (دقیقاً مشابه بالای image_cb497a.jpg و image_caf706.jpg)
// که با تغییر شهر (مشهد، قم، شیراز، تهران...)، ساعت شبانه‌روز و تم مناسبتی تغییر می‌کند
export function DynamicShrineHorizonArt({
  cityName,
  themeId,
  nextPrayerKey,
}: {
  cityName: string;
  themeId: string;
  nextPrayerKey: string;
}) {
  const isDaytime = nextPrayerKey === 'dhuhr' || nextPrayerKey === 'asr';
  const isSunset = nextPrayerKey === 'maghrib';

  // انتخاب پالت آسمان بر اساس زمان روز و شهر
  const skyGrad = isDaytime
    ? 'linear-gradient(180deg, #064E3B 0%, #0D4738 45%, #071A16 100%)'
    : isSunset
    ? 'linear-gradient(180deg, #1E293B 0%, #78350F 48%, #071A16 100%)'
    : themeId === 'ramadan_night'
    ? 'linear-gradient(180deg, #0B132B 0%, #1E3A8A 50%, #081226 100%)'
    : 'linear-gradient(180deg, #041511 0%, #0C382E 52%, #071A16 100%)';

  const domePrimary = cityName.includes('شیراز') || cityName.includes('اصفهان') ? '#38BDF8' : '#FBBF24';

  return (
    <div className="absolute inset-x-0 top-0 h-[270px] overflow-hidden pointer-events-none z-0" style={{ background: skyGrad }}>
      {/* پرتو نورانی طلایی پشت گنبد و گلدسته */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-14 w-72 h-48 rounded-full blur-2xl opacity-55"
        style={{ background: `radial-gradient(circle, ${domePrimary} 0%, transparent 72%)` }}
      />

      {/* تصویرسازی برداری باکیفیت گنبد طلایی، گلدسته‌های نورانی، ماه/خورشید و پرندگان حرم (مشابه عکس مرجع) */}
      <svg viewBox="0 0 420 240" className="w-full h-full object-cover" fill="none" preserveAspectRatio="xMidYBottom slice">
        <defs>
          <linearGradient id="shrineGoldDome" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="45%" stopColor={domePrimary} />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>
          <linearGradient id="minaretGlow" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
          <linearGradient id="fadeBottom" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#071A16" stopOpacity="0" />
            <stop offset="80%" stopColor="#071A16" stopOpacity="0.78" />
            <stop offset="100%" stopColor="#071A16" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* ستاره‌ها و هلال ماه/خورشید در آسمان */}
        <circle cx="65" cy="42" r="1.5" fill="#FEF08A" fillOpacity="0.8" />
        <circle cx="115" cy="28" r="1.2" fill="#FEF08A" fillOpacity="0.6" />
        <circle cx="335" cy="36" r="1.6" fill="#FEF08A" fillOpacity="0.7" />
        <path d="M86 58C76 58 68 66 68 76C68 86 76 94 86 94C80 90 76 83 76 76C76 69 80 62 86 58Z" fill="#FDE047" fillOpacity="0.82" />

        {/* پرندگان در حال پرواز بر فراز گنبد */}
        <path d="M75 110 Q79 105 83 110 Q87 105 91 110" stroke="#FEF08A" strokeWidth="1.3" strokeOpacity="0.65" fill="none" />
        <path d="M98 98 Q101 94 104 98 Q107 94 110 98" stroke="#FEF08A" strokeWidth="1.1" strokeOpacity="0.55" fill="none" />

        {/* کوهستان/افق دور شهر */}
        <path d="M0 195 Q95 160 190 185 T420 175 L420 240 L0 240 Z" fill="#052019" fillOpacity="0.65" />

        {/* گلدسته طلایی بلند سمت چپ گنبد (مشابه عکس حرم امام رضا ع) */}
        <rect x="144" y="62" width="11" height="128" fill="url(#minaretGlow)" rx="2" />
        <rect x="140" y="84" width="19" height="6" rx="2" fill="#FEF08A" />
        <polygon points="149.5,42 143,62 156,62" fill="#FEF08A" />
        <line x1="149.5" y1="28" x2="149.5" y2="42" stroke="#FEF08A" strokeWidth="1.8" />

        {/* گنبد طلایی باشکوه در مرکز/چپ */}
        <path d="M76 190 C76 132 144 132 144 190 Z" fill="url(#shrineGoldDome)" stroke="#FEF08A" strokeWidth="1.2" />
        <line x1="110" y1="118" x2="110" y2="144" stroke="#FEF08A" strokeWidth="2" />
        <circle cx="110" cy="126" r="3.5" fill="#FEF08A" />

        {/* ایوان‌ها و طاق‌های فیروزه‌ای حرم در راست و چپ */}
        <rect x="42" y="172" width="175" height="42" rx="4" fill="#0B3B2E" stroke="#FBBF24" strokeWidth="1" strokeOpacity="0.55" />
        <path d="M172 214 L172 182 C172 172 192 172 192 182 L192 214 Z" fill="#041B15" stroke="#34D399" strokeWidth="1" />
        <path d="M54 214 L54 185 C54 176 70 176 70 185 L70 214 Z" fill="#041B15" stroke="#FBBF24" strokeWidth="0.9" />

        {/* شاخ و برگ درختان سرو در حاشیه راست و چپ (مشابه عکس مرجع) */}
        <circle cx="14" cy="160" r="38" fill="#04261E" fillOpacity="0.85" />
        <circle cx="38" cy="185" r="28" fill="#063429" fillOpacity="0.85" />
        <circle cx="408" cy="165" r="36" fill="#04261E" fillOpacity="0.82" />

        {/* محو شدن نرم پایین تصویر به داخل پس‌زمینه صفحه */}
        <rect x="0" y="150" width="420" height="90" fill="url(#fadeBottom)" />
      </svg>
    </div>
  );
}

// ۳. کتیبه نستعلیق طلایی «اللَّهُمَّ بَارِكْ لِمَوْلَانَا صَاحِبِ الزَّمَانِ (عج)»
export function NastaliqMahdiCrown({ onOpenGuide }: { onOpenGuide?: () => void }) {
  return (
    <div
      className="mb-2 px-3 py-1.5 rounded-2xl border flex items-center justify-between gap-2 relative z-10 backdrop-blur-md"
      style={{
        background: 'rgba(7, 26, 22, 0.62)',
        borderColor: 'rgba(251, 191, 36, 0.35)',
      }}
    >
      <span className="text-[11px] text-amber-300 shrink-0">✨</span>
      <p
        className="text-center text-xs sm:text-sm font-bold truncate"
        style={{
          fontFamily: "'Noto Nastaliq Urdu', 'Gulzar', 'Amiri Quran', serif",
          color: '#FEF08A',
          lineHeight: '2.0',
        }}
      >
        اللَّهُمَّ بَارِكْ لِمَوْلَانَا صَاحِبِ الزَّمَانِ (عج)
      </p>
      {onOpenGuide ? (
        <button
          type="button"
          onClick={onOpenGuide}
          className="px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 border"
          style={{ background: 'rgba(251,191,36,0.18)', color: '#FDE68A', borderColor: 'rgba(251,191,36,0.4)' }}
        >
          راهنما
        </button>
      ) : (
        <span className="text-[11px] text-amber-300 shrink-0">✨</span>
      )}
    </div>
  );
}

// ۴. قوس هلالی بزرگ ۲۰۲۶ در مرکز کارت اذان بعدی (Large Celestial Arc + Golden Time 18:26)
export function CelestialPrayerArcGauge({
  progressPercent,
  remainingText,
  nextPrayerName,
  nextPrayerTime,
  accentColor,
  primaryColor,
}: {
  progressPercent: number;
  remainingText: string;
  nextPrayerName: string;
  nextPrayerTime: string;
  accentColor: string;
  primaryColor: string;
}) {
  const clamped = Math.max(8, Math.min(100, progressPercent || 25));
  const r = 104;
  const arcLen = Math.PI * r;
  const dashOffset = arcLen - (arcLen * clamped) / 100;
  const angleRad = Math.PI * (1 - clamped / 100);
  const cx = 130 - r * Math.cos(angleRad);
  const cy = 114 - r * Math.sin(angleRad);

  return (
    <div className="relative flex flex-col items-center justify-center pt-1 pb-1">
      {/* قوس هلالی بزرگ بالای نام و ساعت اذان */}
      <div className="relative w-[250px] h-[122px] flex flex-col items-center justify-end">
        <svg viewBox="0 0 260 126" className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
          <defs>
            <linearGradient id="heroArcGrad2026" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor={primaryColor} />
              <stop offset="55%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#FEF08A" />
            </linearGradient>
          </defs>
          {/* مسیر پس‌زمینه هلال */}
          <path
            d="M 26 114 A 104 104 0 0 1 234 114"
            fill="none"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* مسیر طلایی-زمردی پرشونده هلال */}
          <path
            d="M 26 114 A 104 104 0 0 1 234 114"
            fill="none"
            stroke="url(#heroArcGrad2026)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={arcLen}
            strokeDashoffset={dashOffset}
          />
          {/* گوی نورانی ماه/خورشید روی مدار هلال */}
          <circle cx={cx} cy={cy} r="11" fill={accentColor} fillOpacity="0.32" />
          <circle cx={cx} cy={cy} r="5.5" fill="#FEF08A" stroke="#FFFFFF" strokeWidth="1.8" />
        </svg>

        {/* محتوای وسط هلال: برچسب نماز بعدی + نام نماز + ساعت طلایی درشت (مشابه ۱۸:۲۶ در عکس شما) */}
        <div className="relative z-10 text-center pb-0.5">
          <span
            className="inline-block px-3 py-0.5 rounded-full text-[11px] font-black mb-1"
            style={{ background: 'rgba(16, 185, 129, 0.25)', color: '#6EE7B7', border: '1px solid rgba(52, 211, 153, 0.4)' }}
          >
            نماز بعدی
          </span>
          <h2 className="text-2xl font-black text-white leading-tight">
            نماز {nextPrayerName}
          </h2>
          <div
            className="text-4xl font-black tracking-tight mt-0.5"
            style={{ color: '#FBBF24', textShadow: '0 4px 18px rgba(245, 158, 11, 0.38)' }}
          >
            {toFaDigits(nextPrayerTime)}
          </div>
        </div>
      </div>

      {/* خط شمارش معکوس و نوار طلایی-سبز ظریف پایین کارت (مشابه عکس مرجع) */}
      <div className="w-full mt-2 pt-2 border-t border-white/10 flex flex-col items-center">
        <p className="text-xs font-bold text-emerald-100/95 flex items-center gap-1.5 mb-2">
          <span>🕒</span>
          <span>{toFaDigits(remainingText)} تا اذان {nextPrayerName}</span>
        </p>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${clamped}%`,
              background: 'linear-gradient(90deg, #10B981 0%, #FBBF24 100%)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
