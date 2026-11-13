import { useState, useEffect } from 'react';
import { resolveActiveHeroDesign, RenderHeroArtworkScene, Hero30SelectorModal } from '@/components/HeroHorizon30Gallery';
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
  const [design, setDesign] = useState(() => resolveActiveHeroDesign(cityName, themeId));
  const [showGalleryModal, setShowGalleryModal] = useState(false);

  useEffect(() => {
    const updateHero = () => setDesign(resolveActiveHeroDesign(cityName, themeId));
    updateHero();
    window.addEventListener('noor-hero-changed', updateHero);
    return () => window.removeEventListener('noor-hero-changed', updateHero);
  }, [cityName, themeId]);

  return (
    <div
      className="relative w-full h-[222px] overflow-hidden select-none transition-all duration-500"
      style={{ background: design.fallbackGradient }}
    >
      <RenderHeroArtworkScene design={design} />

      {/* دکمه ظریف انتخاب دستی/خودکار از بین ۳۰ طرح افق روی گوشه پایین چپ تصویر */}
      <button
        type="button"
        onClick={() => setShowGalleryModal(true)}
        className="absolute bottom-5 left-4 z-30 px-2.5 py-1 rounded-full border text-[10px] font-black flex items-center gap-1 backdrop-blur-md transition-transform active:scale-95 shadow-lg"
        style={{
          background: 'rgba(7, 26, 22, 0.78)',
          borderColor: 'rgba(251, 191, 36, 0.5)',
          color: '#FEF08A',
        }}
        title="تغییر طرح معماری بالای صفحه (۳۰ طرح مناسبتی و شهرهای ایران)"
      >
        <span>🎨 طرح افق (۳۰)</span>
      </button>

      {showGalleryModal && (
        <Hero30SelectorModal
          cityName={cityName}
          onClose={() => setShowGalleryModal(false)}
        />
      )}
    </div>
  );
}

export function NastaliqMahdiCrown({ onOpenGuide }: { onOpenGuide?: () => void }) {
  const { theme } = useTheme();
  const [design, setDesign] = useState(() => resolveActiveHeroDesign('مشهد', theme.id));

  useEffect(() => {
    const updateHero = () => setDesign(resolveActiveHeroDesign('مشهد', theme.id));
    updateHero();
    window.addEventListener('noor-hero-changed', updateHero);
    return () => window.removeEventListener('noor-hero-changed', updateHero);
  }, [theme.id]);

  return (
    <div
      className="px-3 py-1.5 rounded-2xl border flex items-center justify-between gap-2 shadow-md"
      style={{
        background: 'rgba(7, 24, 20, 0.72)',
        borderColor: 'rgba(251, 191, 36, 0.42)',
      }}
    >
      <span className="text-[11px] shrink-0 text-amber-300">✨</span>
      <p
        className="text-center text-xs sm:text-sm font-bold truncate"
        style={{
          fontFamily: "'Noto Nastaliq Urdu', 'Gulzar', 'Amiri Quran', serif",
          color: '#FEF08A',
          lineHeight: '2.0',
        }}
      >
        {design.crownTextFa}
      </p>
      {onOpenGuide ? (
        <button
          type="button"
          onClick={onOpenGuide}
          className="px-2.5 py-0.5 rounded-full text-[10px] font-black shrink-0 border transition-transform active:scale-95"
          style={{
            background: 'rgba(251, 191, 36, 0.2)',
            color: '#FDE68A',
            borderColor: 'rgba(251, 191, 36, 0.45)',
          }}
        >
          راهنما
        </button>
      ) : (
        <span className="text-[11px] shrink-0 text-amber-300">✨</span>
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
