import { toFaDigits } from '@/lib/jalali';
import { Calendar } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export function expandRemainingTimeFa(raw: string): string {
  if (!raw) return '';
  const s = raw.trim();
  const hmMatch = s.match(/([0-9۰-۹]+)\s*س\s*و?\s*([0-9۰-۹]+)\s*د/);
  if (hmMatch) {
    return `${toFaDigits(hmMatch[1])} ساعت و ${toFaDigits(hmMatch[2])} دقیقه`;
  }
  const hOnly = s.match(/([0-9۰-۹]+)\s*س(?![ا])/);
  if (hOnly) {
    return s.replace(/([0-9۰-۹]+)\s*س/, '$1 ساعت').replace(/([0-9۰-۹]+)\s*د/, ' و $1 دقیقه');
  }
  const mOnly = s.match(/^([0-9۰-۹]+)\s*د$/);
  if (mOnly) {
    return `${toFaDigits(mOnly[1])} دقیقه`;
  }
  return toFaDigits(s);
}

// محاسبه شماره روز از ابتدای سال شمسی (از ۱ تا ۳۶۵ — مثلاً روز ۲۴۵ سال ۱۴۰۵ مطابق عکس نمونه شما)
export function getDayOfJalaliYear(date: Date): {
  dayNum: number;
  monthName: string;
  yearNum: number;
  dayOfYear: number;
} {
  let jy = 1405;
  let jm = 8;
  let jd = 17;
  try {
    const parts = new Intl.DateTimeFormat('en-US-u-ca-persian', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).formatToParts(date);
    jy = parseInt(parts.find((p) => p.type === 'year')?.value || '1405', 10);
    jm = parseInt(parts.find((p) => p.type === 'month')?.value || '8', 10);
    jd = parseInt(parts.find((p) => p.type === 'day')?.value || '17', 10);
  } catch {}
  const monthNames = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];
  let daysBefore = 0;
  for (let m = 1; m < jm; m++) {
    daysBefore += m <= 6 ? 31 : 30;
  }
  return {
    dayNum: jd,
    monthName: monthNames[jm - 1] || 'آبان',
    yearNum: jy,
    dayOfYear: daysBefore + jd,
  };
}

// کارت عمودی تاریخ و روزشمار سال (دقیقاً مطابق عکس نمونه image_421791.png شما)
export function VerticalJalaliDayCounterCard({
  now,
  weekdayFa,
  onClick,
}: {
  now: Date;
  weekdayFa: string;
  onClick: () => void;
}) {
  const { theme } = useTheme();
  const info = getDayOfJalaliYear(now);

  return (
    <button
      type="button"
      onClick={onClick}
      title="مشاهده تقویم کامل، مناسبت‌ها و پیش‌بینی ۷ روزه آب‌وهوا"
      className="w-[104px] sm:w-[114px] shrink-0 rounded-[28px] p-3 border flex flex-col items-center justify-between text-center transition-transform active:scale-95 shadow-xl relative overflow-hidden"
      style={{
        background: `linear-gradient(180deg, color-mix(in srgb, ${theme.surfaceAlt} 94%, #000000) 0%, ${theme.surface} 100%)`,
        borderColor: 'rgba(251, 191, 36, 0.5)',
        boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.16), 0 10px 25px rgba(0, 0, 0, 0.35)',
      }}
    >
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center mb-1"
        style={{ background: 'rgba(251, 191, 36, 0.14)', border: '1px solid rgba(251, 191, 36, 0.38)' }}
      >
        <Calendar size={17} color="#FBBF24" />
      </div>

      <span className="text-xs font-black text-white leading-tight">{weekdayFa}</span>
      <strong
        className="text-3xl font-black leading-none my-1"
        style={{ color: '#FBBF24', textShadow: '0 2px 12px rgba(251, 191, 36, 0.35)' }}
      >
        {toFaDigits(info.dayNum)}
      </strong>
      <span className="text-[11px] font-bold text-emerald-100/90">
        {info.monthName} {toFaDigits(info.yearNum)}
      </span>

      {/* خط جداکننده طلایی ظریف وسط کارت مطابق عکس نمونه */}
      <div
        className="w-4/5 h-[1px] my-2"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(251, 191, 36, 0.65), transparent)' }}
      />

      <div className="leading-tight">
        <span className="text-[10px] font-bold text-emerald-200/80 block">روز</span>
        <strong className="text-lg font-black text-white block my-0.5">
          {toFaDigits(info.dayOfYear)}
        </strong>
        <span className="text-[10px] font-bold text-emerald-200/80 block">
          سال {toFaDigits(info.yearNum)}
        </span>
      </div>
    </button>
  );
}

// وکتورهای مناسبتی داخل کارت‌ها (سبک و سریع بدون هیچ افت فریمی)
export function ThemePatternWatermark({ themeId, className = '' }: { themeId: string; className?: string }) {
  if (themeId === 'ramadan_night') {
    return (
      <svg className={`pointer-events-none absolute inset-0 w-full h-full ${className}`} viewBox="0 0 320 140" fill="none">
        <path d="M275 22C261 22 250 33 250 47C250 61 261 72 275 72C267 66 262 57 262 47C262 37 267 28 275 22Z" fill="#FBBF24" fillOpacity="0.45" />
        <line x1="45" y1="0" x2="45" y2="28" stroke="#FBBF24" strokeWidth="1.5" />
        <polygon points="45,28 56,44 45,62 34,44" fill="#F59E0B" fillOpacity="0.45" stroke="#FDE68A" strokeWidth="1" />
      </svg>
    );
  }
  if (themeId === 'yalda_fest') {
    return (
      <svg className={`pointer-events-none absolute inset-0 w-full h-full ${className}`} viewBox="0 0 320 140" fill="none">
        <circle cx="55" cy="68" r="24" fill="#E11D48" fillOpacity="0.45" stroke="#FDA4AF" strokeWidth="1.4" />
        <polygon points="50,44 55,34 60,44" fill="#FB7185" />
        <path d="M225 96 A34 34 0 0 0 293 96 Z" fill="#10B981" fillOpacity="0.45" />
        <path d="M231 96 A28 28 0 0 0 287 96 Z" fill="#F43F5E" fillOpacity="0.52" />
      </svg>
    );
  }
  if (themeId === 'nowruz_spring' || themeId === 'blossom_serenity') {
    return (
      <svg className={`pointer-events-none absolute inset-0 w-full h-full ${className}`} viewBox="0 0 320 140" fill="none">
        <circle cx="48" cy="42" r="13" fill="#F472B6" fillOpacity="0.42" />
        <circle cx="48" cy="42" r="4.5" fill="#FEF08A" />
        <circle cx="88" cy="28" r="9" fill="#34D399" fillOpacity="0.4" />
        <circle cx="265" cy="74" r="22" fill="#38BDF8" fillOpacity="0.25" stroke="#A7F3D0" strokeWidth="1.2" />
      </svg>
    );
  }
  if (themeId === 'muharram_ashura') {
    return (
      <svg className={`pointer-events-none absolute inset-0 w-full h-full ${className}`} viewBox="0 0 320 140" fill="none">
        <line x1="52" y1="14" x2="52" y2="125" stroke="#F59E0B" strokeWidth="2.2" />
        <path d="M52 20 C88 14 112 34 142 24 L142 58 C112 68 88 48 52 54 Z" fill="#EF4444" fillOpacity="0.48" />
      </svg>
    );
  }
  if (themeId === 'fatimiyya_grief') {
    return (
      <svg className={`pointer-events-none absolute inset-0 w-full h-full ${className}`} viewBox="0 0 320 140" fill="none">
        <rect x="48" y="58" width="16" height="56" rx="4" fill="#E2E8F0" fillOpacity="0.4" />
        <path d="M56 32 C49 43 49 52 56 56 C63 52 63 43 56 32 Z" fill="#FDE047" fillOpacity="0.85" />
      </svg>
    );
  }
  return null;
}

// صحنه گرافیکی بالای صفحه با وکتورهای اختصاصی هر مناسبت (یلدا، نوروز، محرم، رمضان، فاطمیه و حرم مطهر) — فوق‌سریع و بدون لگ
export function DynamicShrineHorizonArt({
  cityName,
  themeId,
}: {
  cityName: string;
  themeId: string;
  nextPrayerKey?: string;
}) {
  const { theme } = useTheme();
  const domeColor =
    themeId === 'sapphire' || cityName.includes('شیراز') || cityName.includes('اصفهان')
      ? '#38BDF8'
      : themeId === 'rose' || themeId === 'yalda_fest'
      ? '#FB7185'
      : themeId === 'violet' || themeId === 'blossom_serenity'
      ? '#C084FC'
      : themeId === 'muharram_ashura'
      ? '#EF4444'
      : '#FBBF24';

  return (
    <div
      className="relative w-full h-[205px] overflow-hidden select-none"
      style={{
        background: theme.gradient,
        borderBottom: `1px solid ${theme.border}`,
      }}
    >
      <svg viewBox="0 0 420 210" className="w-full h-full object-cover" fill="none" preserveAspectRatio="xMidYBottom slice">
        <defs>
          <linearGradient id="shrineGoldDomeFast" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="50%" stopColor={domeColor} />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>
          <linearGradient id="horizonFadeFast" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor={theme.bg} stopOpacity="0" />
            <stop offset="82%" stopColor={theme.bg} stopOpacity="0.78" />
            <stop offset="100%" stopColor={theme.bg} stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* ستارگان و هلال ماه */}
        <circle cx="55" cy="40" r="1.6" fill="#FEF08A" fillOpacity="0.85" />
        <circle cx="115" cy="28" r="1.4" fill="#FEF08A" fillOpacity="0.7" />
        <circle cx="335" cy="34" r="1.7" fill="#FEF08A" fillOpacity="0.8" />
        <path d="M78 58C68 58 60 66 60 76C60 86 68 94 78 94C72 90 68 83 68 76C68 69 72 62 78 58Z" fill="#FDE047" fillOpacity="0.9" />

        {/* طرح اختصاصی شب یلدا (انار و هندوانه در افق) */}
        {themeId === 'yalda_fest' && (
          <g>
            <circle cx="348" cy="82" r="24" fill="#E11D48" fillOpacity="0.75" stroke="#FDA4AF" strokeWidth="1.5" />
            <polygon points="342,58 348,48 354,58" fill="#FB7185" />
            <path d="M40 135 A32 32 0 0 0 104 135 Z" fill="#10B981" fillOpacity="0.7" />
            <path d="M45 135 A27 27 0 0 0 99 135 Z" fill="#F43F5E" fillOpacity="0.8" />
          </g>
        )}

        {/* طرح اختصاصی عید نوروز و بهار (شکوفه‌های بهاری و سبزه) */}
        {(themeId === 'nowruz_spring' || themeId === 'blossom_serenity') && (
          <g>
            <circle cx="345" cy="70" r="15" fill="#F472B6" fillOpacity="0.7" />
            <circle cx="345" cy="70" r="5" fill="#FEF08A" />
            <circle cx="380" cy="54" r="11" fill="#34D399" fillOpacity="0.7" />
            <circle cx="380" cy="54" r="4" fill="#FEF08A" />
            <circle cx="52" cy="82" r="13" fill="#F472B6" fillOpacity="0.65" />
            <circle cx="52" cy="82" r="4" fill="#FEF08A" />
          </g>
        )}

        {/* طرح اختصاصی ماه محرم و عاشورا (بیرق‌های سرخ و کتیبه) */}
        {themeId === 'muharram_ashura' && (
          <g>
            <line x1="340" y1="26" x2="340" y2="145" stroke="#F59E0B" strokeWidth="2.5" />
            <path d="M340 30 C368 24 388 40 410 32 L410 62 C388 70 368 54 340 60 Z" fill="#EF4444" fillOpacity="0.82" />
            <line x1="65" y1="36" x2="65" y2="145" stroke="#F59E0B" strokeWidth="2.2" />
            <path d="M65 40 C90 34 108 48 128 40 L128 66 C108 74 90 60 65 66 Z" fill="#991B1B" fillOpacity="0.85" />
          </g>
        )}

        {/* طرح اختصاصی ماه رمضان (فانوس‌های طلایی) */}
        {themeId === 'ramadan_night' && (
          <g>
            <line x1="342" y1="0" x2="342" y2="48" stroke="#FBBF24" strokeWidth="1.6" />
            <polygon points="342,48 355,66 342,86 329,66" fill="#F59E0B" fillOpacity="0.8" stroke="#FEF08A" strokeWidth="1.2" />
            <line x1="382" y1="0" x2="382" y2="32" stroke="#38BDF8" strokeWidth="1.5" />
            <polygon points="382,32 392,46 382,62 372,46" fill="#38BDF8" fillOpacity="0.7" stroke="#E0F2FE" strokeWidth="1" />
          </g>
        )}

        {/* گلدسته‌ها و گنبد طلایی حرم در مرکز افق */}
        <path d="M0 172 Q105 138 210 162 T420 152 L420 210 L0 210 Z" fill={theme.surface} fillOpacity="0.78" />
        <rect x="152" y="54" width="11" height="120" fill="url(#shrineGoldDomeFast)" rx="2" />
        <rect x="148" y="74" width="19" height="6" rx="2" fill="#FEF08A" />
        <polygon points="157.5,36 151,54 164,54" fill="#FEF08A" />

        <rect x="258" y="62" width="10" height="112" fill="url(#shrineGoldDomeFast)" rx="2" />
        <rect x="254" y="80" width="18" height="5" rx="2" fill="#FEF08A" />
        <polygon points="263,45 257,62 269,62" fill="#FEF08A" />

        <path d="M174 172 C174 110 246 110 246 172 Z" fill="url(#shrineGoldDomeFast)" stroke="#FEF08A" strokeWidth="1.5" />
        <line x1="210" y1="94" x2="210" y2="120" stroke="#FEF08A" strokeWidth="2.2" />
        <circle cx="210" cy="103" r="3.8" fill="#FEF08A" />

        <rect x="122" y="160" width="176" height="36" rx="4" fill={theme.surfaceAlt} stroke="#FBBF24" strokeWidth="1.1" strokeOpacity="0.65" />
        <rect x="0" y="140" width="420" height="70" fill="url(#horizonFadeFast)" />
      </svg>
    </div>
  );
}

export function NastaliqMahdiCrown({ onOpenGuide }: { onOpenGuide?: () => void }) {
  const { theme } = useTheme();
  return (
    <div
      className="px-3 py-1.5 rounded-2xl border flex items-center justify-between gap-2 shadow-md"
      style={{
        background: `color-mix(in srgb, ${theme.surface} 90%, #000000)`,
        borderColor: theme.border,
      }}
    >
      <span className="text-[11px] shrink-0" style={{ color: theme.accent }}>✨</span>
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
          className="px-2.5 py-0.5 rounded-full text-[10px] font-black shrink-0 border transition-transform active:scale-95"
          style={{
            background: `color-mix(in srgb, ${theme.accent} 22%, transparent)`,
            color: '#FDE68A',
            borderColor: theme.border,
          }}
        >
          راهنما
        </button>
      ) : (
        <span className="text-[11px] shrink-0" style={{ color: theme.accent }}>✨</span>
      )}
    </div>
  );
}

// قوس هلالی بزرگ با نشانگر خورشید/ماه طلایی روی سرِ قوس (به جای دایره سفید گنگ!)
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
  const clamped = Math.max(10, Math.min(100, progressPercent || 42));
  const r = 92;
  const arcLen = Math.PI * r;
  const dashOffset = arcLen - (arcLen * clamped) / 100;
  const angleRad = Math.PI * (1 - clamped / 100);
  const cx = 115 - r * Math.cos(angleRad);
  const cy = 104 - r * Math.sin(angleRad);

  const fullRemainingFa = expandRemainingTimeFa(remainingText);

  return (
    <div className="relative flex flex-col items-center justify-center">
      <div className="relative w-[224px] h-[112px] flex flex-col items-center justify-end">
        <svg viewBox="0 0 230 116" className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
          <defs>
            <linearGradient id="heroArcGradGolden" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor={primaryColor} />
              <stop offset="55%" stopColor={accentColor} />
              <stop offset="100%" stopColor="#FEF08A" />
            </linearGradient>
          </defs>
          {/* مسیر پس‌زمینه هلال */}
          <path
            d="M 23 104 A 92 92 0 0 1 207 104"
            fill="none"
            stroke="rgba(255, 255, 255, 0.13)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* مسیر پرشونده طلایی هلال */}
          <path
            d="M 23 104 A 92 92 0 0 1 207 104"
            fill="none"
            stroke="url(#heroArcGradGolden)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={arcLen}
            strokeDashoffset={dashOffset}
          />
          {/* نشانگر خورشید/ستاره طلایی روی سرِ هلال (نشان‌دهنده میزان زمان سپری‌شده تا اذان) */}
          <circle cx={cx} cy={cy} r="10" fill="#F59E0B" fillOpacity="0.32" />
          <circle cx={cx} cy={cy} r="5.5" fill="#FBBF24" stroke="#FEF08A" strokeWidth="2" />
        </svg>

        <div className="relative z-10 text-center pb-0.5">
          <span
            className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black mb-0.5"
            style={{
              background: `color-mix(in srgb, ${primaryColor} 22%, transparent)`,
              color: primaryColor,
              border: `1px solid ${primaryColor}`,
            }}
          >
            نماز بعدی
          </span>
          <h2 className="text-xl font-black text-white leading-tight">
            نماز {nextPrayerName}
          </h2>
          <div
            className="text-3xl sm:text-4xl font-black tracking-tight mt-0.5"
            style={{ color: accentColor, textShadow: '0 4px 16px rgba(245, 158, 11, 0.35)' }}
          >
            {toFaDigits(nextPrayerTime)}
          </div>
        </div>
      </div>

      <div className="mt-2 px-3 py-1 rounded-full border bg-black/25 border-white/10 flex items-center justify-center gap-1.5">
        <span className="text-[11px]">⏳</span>
        <span className="text-[11px] font-black text-white">
          {fullRemainingFa} تا اذان {nextPrayerName}
        </span>
      </div>
    </div>
  );
}
