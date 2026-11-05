import { toFaDigits } from '@/lib/jalali';

// ۱. وکتورهای گرافیکی اختصاصی برای هر پوسته (هم در صفحه انتخاب پوسته و هم در پس‌زمینه کارت اصلی صفحه اول)
export function ThemePatternWatermark({ themeId, className = '' }: { themeId: string; className?: string }) {
  if (themeId === 'ramadan_night') {
    return (
      <svg className={`pointer-events-none absolute inset-0 w-full h-full ${className}`} viewBox="0 0 320 140" fill="none">
        {/* هلال ماه و فانوس‌های آویزان رمضان */}
        <path d="M275 22C261 22 250 33 250 47C250 61 261 72 275 72C267 66 262 57 262 47C262 37 267 28 275 22Z" fill="#FBBF24" fillOpacity="0.42" />
        <line x1="45" y1="0" x2="45" y2="28" stroke="#FBBF24" strokeWidth="1.5" strokeOpacity="0.6" />
        <polygon points="45,28 56,44 45,62 34,44" fill="#F59E0B" fillOpacity="0.38" stroke="#FDE68A" strokeWidth="1" />
        <line x1="90" y1="0" x2="90" y2="16" stroke="#38BDF8" strokeWidth="1.5" strokeOpacity="0.6" />
        <polygon points="90,16 98,28 90,42 82,28" fill="#38BDF8" fillOpacity="0.32" stroke="#BAE6FD" strokeWidth="1" />
        <circle cx="160" cy="28" r="2" fill="#FEF08A" fillOpacity="0.7" />
        <circle cx="210" cy="18" r="1.5" fill="#FEF08A" fillOpacity="0.5" />
        <path d="M120 140 C140 108 180 108 200 140 Z" fill="#FBBF24" fillOpacity="0.12" />
      </svg>
    );
  }
  if (themeId === 'yalda_fest') {
    return (
      <svg className={`pointer-events-none absolute inset-0 w-full h-full ${className}`} viewBox="0 0 320 140" fill="none">
        {/* انار سرخ و هندوانه شب یلدا */}
        <circle cx="55" cy="68" r="28" fill="#E11D48" fillOpacity="0.38" stroke="#FDA4AF" strokeWidth="1.2" />
        <polygon points="49,40 55,30 61,40" fill="#FB7185" fillOpacity="0.6" />
        <circle cx="48" cy="64" r="3" fill="#FFF1F2" fillOpacity="0.65" />
        <circle cx="60" cy="72" r="3" fill="#FFF1F2" fillOpacity="0.65" />
        <circle cx="56" cy="58" r="2.5" fill="#FFF1F2" fillOpacity="0.65" />
        <path d="M225 96 A36 36 0 0 0 297 96 Z" fill="#10B981" fillOpacity="0.38" />
        <path d="M231 96 A30 30 0 0 0 291 96 Z" fill="#F43F5E" fillOpacity="0.42" />
      </svg>
    );
  }
  if (themeId === 'nowruz_spring' || themeId === 'blossom_serenity') {
    return (
      <svg className={`pointer-events-none absolute inset-0 w-full h-full ${className}`} viewBox="0 0 320 140" fill="none">
        {/* شکوفه‌های بهاری و تنگ ماهی نوروز */}
        <circle cx="48" cy="42" r="12" fill="#F472B6" fillOpacity="0.35" />
        <circle cx="48" cy="42" r="4" fill="#FEF08A" fillOpacity="0.8" />
        <circle cx="88" cy="26" r="8" fill="#34D399" fillOpacity="0.35" />
        <circle cx="88" cy="26" r="3" fill="#FEF08A" fillOpacity="0.8" />
        <circle cx="265" cy="74" r="24" fill="#38BDF8" fillOpacity="0.20" stroke="#A7F3D0" strokeWidth="1.2" />
        <ellipse cx="265" cy="74" rx="9" ry="4.5" fill="#FB923C" fillOpacity="0.65" />
      </svg>
    );
  }
  if (themeId === 'muharram_ashura') {
    return (
      <svg className={`pointer-events-none absolute inset-0 w-full h-full ${className}`} viewBox="0 0 320 140" fill="none">
        {/* بیرق سرخ حسینی و گنبد */}
        <line x1="52" y1="14" x2="52" y2="125" stroke="#F59E0B" strokeWidth="2.2" strokeOpacity="0.6" />
        <path d="M52 20 C88 14 112 34 142 24 L142 58 C112 68 88 48 52 54 Z" fill="#EF4444" fillOpacity="0.38" />
        <path d="M230 140 C245 98 285 98 300 140 Z" fill="#F59E0B" fillOpacity="0.18" />
      </svg>
    );
  }
  if (themeId === 'fatimiyya_grief') {
    return (
      <svg className={`pointer-events-none absolute inset-0 w-full h-full ${className}`} viewBox="0 0 320 140" fill="none">
        {/* شمع فروزان و یاس سپید فاطمیه */}
        <rect x="48" y="58" width="16" height="56" rx="4" fill="#E2E8F0" fillOpacity="0.35" />
        <path d="M56 32 C49 43 49 52 56 56 C63 52 63 43 56 32 Z" fill="#FDE047" fillOpacity="0.75" />
        <circle cx="56" cy="45" r="18" fill="#FDE047" fillOpacity="0.18" />
      </svg>
    );
  }
  // پیش‌فرض: شمسه و اسلیمی ظریف
  return (
    <svg className={`pointer-events-none absolute inset-0 w-full h-full ${className}`} viewBox="0 0 320 140" fill="none">
      <circle cx="50" cy="70" r="42" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1.2" strokeDasharray="4 4" />
      <circle cx="50" cy="70" r="28" stroke="currentColor" strokeOpacity="0.16" strokeWidth="1" />
    </svg>
  );
}

// ۲. کتیبه نستعلیق طلایی «اللَّهُمَّ بَارِكْ لِمَوْلَانَا صَاحِبِ الزَّمَانِ (عج)» در بالای صفحه اول
export function NastaliqMahdiCrown({ onOpenGuide }: { onOpenGuide?: () => void }) {
  return (
    <div
      className="mb-2.5 px-3.5 py-2 rounded-2xl border flex items-center justify-between gap-2 relative overflow-hidden"
      style={{
        background: 'linear-gradient(90deg, rgba(251, 191, 36, 0.14) 0%, rgba(16, 185, 129, 0.12) 50%, rgba(251, 191, 36, 0.14) 100%)',
        borderColor: 'rgba(251, 191, 36, 0.36)',
      }}
    >
      <span className="text-xs text-amber-300/90 shrink-0">✨</span>
      <p
        className="text-center text-sm sm:text-base font-bold truncate"
        style={{
          fontFamily: "'Noto Nastaliq Urdu', 'Gulzar', 'Amiri Quran', serif",
          color: '#FEF08A',
          lineHeight: '2.1',
          textShadow: '0 2px 10px rgba(245, 158, 11, 0.35)',
        }}
      >
        اللَّهُمَّ بَارِكْ لِمَوْلَانَا صَاحِبِ الزَّمَانِ (عج)
      </p>
      {onOpenGuide ? (
        <button
          type="button"
          onClick={onOpenGuide}
          className="px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 border transition-transform active:scale-95"
          style={{ background: 'rgba(0,0,0,0.32)', color: '#FDE68A', borderColor: 'rgba(251,191,36,0.4)' }}
          title="مشاهده راهنمای امکانات صفحه اول"
        >
          راهنما ؟
        </button>
      ) : (
        <span className="text-xs text-amber-300/90 shrink-0">✨</span>
      )}
    </div>
  );
}

// ۳. قوس هلالی هوشمند رسیدن به اذان (Celestial Horizon Arc Gauge) به جای خط صاف
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
  const clamped = Math.max(4, Math.min(100, progressPercent || 15));
  // شعاع و محیط نیم‌دایره
  const r = 68;
  const arcLen = Math.PI * r; // ~213.6
  const dashOffset = arcLen - (arcLen * clamped) / 100;

  // مختصات گوی نورانی (خورشید/ماه) روی قوس از راست به چپ (زاویه 0 تا PI)
  const angleRad = Math.PI * (1 - clamped / 100);
  const cx = 90 - r * Math.cos(angleRad);
  const cy = 78 - r * Math.sin(angleRad);

  return (
    <div className="mt-3 pt-3 pb-2 px-3.5 rounded-2xl border relative overflow-hidden" style={{ background: 'rgba(0, 0, 0, 0.24)', borderColor: 'rgba(255, 255, 255, 0.08)' }}>
      <div className="flex items-center justify-between gap-3">
        {/* سمت راست: شمارش معکوس و درصد */}
        <div className="text-right min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: primaryColor }}>
            <span>🌙 مسیر هلالی تا اذان {nextPrayerName}:</span>
          </div>
          <p className="text-sm font-black text-white mt-1">
            ⏳ {toFaDigits(remainingText)} مانده
          </p>
          <span className="text-[10px] text-white/65 block mt-0.5">
            وقتی هلال کامل شود ({toFaDigits(Math.round(clamped))}%) وقت اذان فرا می‌رسد
          </span>
        </div>

        {/* مرکز/چپ: گرافیک قوس هلالی (Celestial Arc) + وقت دقیق اذان در دل هلال */}
        <div className="relative w-[156px] h-[78px] shrink-0 flex flex-col items-center justify-end">
          <svg viewBox="0 0 180 86" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="celestialArcGrad" x1="100%" y1="0%" x2="0%" y2="0%">
                <stop offset="0%" stopColor={primaryColor} />
                <stop offset="100%" stopColor={accentColor} />
              </linearGradient>
            </defs>
            {/* قوس پس‌زمینه کم‌رنگ */}
            <path
              d="M 22 78 A 68 68 0 0 1 158 78"
              fill="none"
              stroke="rgba(255,255,255,0.13)"
              strokeWidth="7"
              strokeLinecap="round"
            />
            {/* قوس پرشونده طلایی-زمردی */}
            <path
              d="M 22 78 A 68 68 0 0 1 158 78"
              fill="none"
              stroke="url(#celestialArcGrad)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={arcLen}
              strokeDashoffset={dashOffset}
            />
            {/* گوی درخشان متحرک روی مدار هلال */}
            <circle cx={cx} cy={cy} r="8" fill={accentColor} fillOpacity="0.32" />
            <circle cx={cx} cy={cy} r="4.5" fill="#FEF08A" stroke="#FFFFFF" strokeWidth="1.4" />
          </svg>
          <div className="absolute bottom-0.5 inset-x-0 text-center">
            <span className="text-[9px] font-bold text-white/60 block leading-none">وقت اذان</span>
            <strong className="text-base font-black text-white tracking-tight font-mono" dir="ltr">
              {nextPrayerTime}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
