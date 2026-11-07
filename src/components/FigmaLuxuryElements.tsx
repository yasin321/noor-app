import { toFaDigits } from '@/lib/jalali';
import { useTheme } from '@/hooks/useTheme';

// تبدیل «۱س ۴۹د» یا «۵ س ۱ د» به «۱ ساعت و ۴۹ دقیقه» کامل و روان
export function expandRemainingTimeFa(raw: string): string {
  if (!raw) return '';
  let s = raw.trim();
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

// ۱. وکتورهای مناسبتی برای کارت‌های پوسته در تنظیمات و پس‌زمینه کارت‌ها
export function ThemePatternWatermark({ themeId, className = '' }: { themeId: string; className?: string }) {
  if (themeId === 'ramadan_night') {
    return (
      <svg className={`pointer-events-none absolute inset-0 w-full h-full ${className}`} viewBox="0 0 320 140" fill="none">
        <path d="M275 22C261 22 250 33 250 47C250 61 261 72 275 72C267 66 262 57 262 47C262 37 267 28 275 22Z" fill="#FBBF24" fillOpacity="0.48" />
        <line x1="45" y1="0" x2="45" y2="28" stroke="#FBBF24" strokeWidth="1.5" />
        <polygon points="45,28 56,44 45,62 34,44" fill="#F59E0B" fillOpacity="0.45" stroke="#FDE68A" strokeWidth="1" />
        <line x1="88" y1="0" x2="88" y2="18" stroke="#38BDF8" strokeWidth="1.3" />
        <polygon points="88,18 96,30 88,44 80,30" fill="#38BDF8" fillOpacity="0.38" stroke="#BAE6FD" strokeWidth="1" />
      </svg>
    );
  }
  if (themeId === 'yalda_fest') {
    return (
      <svg className={`pointer-events-none absolute inset-0 w-full h-full ${className}`} viewBox="0 0 320 140" fill="none">
        <circle cx="55" cy="68" r="26" fill="#E11D48" fillOpacity="0.45" stroke="#FDA4AF" strokeWidth="1.2" />
        <path d="M225 96 A34 34 0 0 0 293 96 Z" fill="#10B981" fillOpacity="0.45" />
        <path d="M231 96 A28 28 0 0 0 287 96 Z" fill="#F43F5E" fillOpacity="0.5" />
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
        <path d="M52 20 C88 14 112 34 142 24 L142 58 C112 68 88 48 52 54 Z" fill="#EF4444" fillOpacity="0.45" />
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

// ۲. صحنه گرافیکی بزرگ و باشکوه بالای صفحه خانه که با انتخاب هر پوسته و هر شهر تغییر رنگ و طرح می‌دهد
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
      className="relative w-full h-[215px] overflow-hidden select-none"
      style={{
        background: theme.gradient,
        borderBottom: `1px solid ${theme.border}`,
      }}
    >
      {/* هاله نورانی مرکزی */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-8 w-80 h-44 rounded-full blur-2xl opacity-60 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${domeColor} 0%, transparent 72%)` }}
      />

      {/* تصویرسازی کامل گنبد، گلدسته‌ها، فانوس‌های مناسبتی، سروها و افق شهر */}
      <svg viewBox="0 0 420 220" className="w-full h-full object-cover" fill="none" preserveAspectRatio="xMidYBottom slice">
        <defs>
          <linearGradient id="shrineGoldDomeDyn" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="50%" stopColor={domeColor} />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>
          <linearGradient id="minaretGlowDyn" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>
          <linearGradient id="horizonFadeBottom" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor={theme.bg} stopOpacity="0" />
            <stop offset="82%" stopColor={theme.bg} stopOpacity="0.75" />
            <stop offset="100%" stopColor={theme.bg} stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* ستارگان و هلال ماه طلایی */}
        <circle cx="55" cy="36" r="1.6" fill="#FEF08A" fillOpacity="0.85" />
        <circle cx="105" cy="24" r="1.3" fill="#FEF08A" fillOpacity="0.7" />
        <circle cx="325" cy="30" r="1.8" fill="#FEF08A" fillOpacity="0.8" />
        <circle cx="370" cy="52" r="1.4" fill="#FEF08A" fillOpacity="0.65" />
        <path d="M84 52C73 52 64 61 64 72C64 83 73 92 84 92C77 87 73 80 73 72C73 64 77 57 84 52Z" fill="#FDE047" fillOpacity="0.9" />

        {/* المان‌های اختصاصی هر تم مناسبتی در آسمان افق */}
        {themeId === 'ramadan_night' && (
          <g>
            <line x1="340" y1="0" x2="340" y2="38" stroke="#FBBF24" strokeWidth="1.5" />
            <polygon points="340,38 352,55 340,74 328,55" fill="#F59E0B" fillOpacity="0.75" stroke="#FEF08A" strokeWidth="1.2" />
            <line x1="380" y1="0" x2="380" y2="24" stroke="#38BDF8" strokeWidth="1.5" />
            <polygon points="380,24 389,37 380,52 371,37" fill="#38BDF8" fillOpacity="0.65" stroke="#E0F2FE" strokeWidth="1" />
          </g>
        )}

        {themeId === 'yalda_fest' && (
          <g>
            <circle cx="355" cy="66" r="22" fill="#E11D48" fillOpacity="0.65" stroke="#FDA4AF" strokeWidth="1.5" />
            <polygon points="350,44 355,35 360,44" fill="#FB7185" />
          </g>
        )}

        {(themeId === 'nowruz_spring' || themeId === 'blossom_serenity') && (
          <g>
            <circle cx="348" cy="54" r="12" fill="#F472B6" fillOpacity="0.65" />
            <circle cx="348" cy="54" r="4" fill="#FEF08A" />
            <circle cx="382" cy="40" r="9" fill="#34D399" fillOpacity="0.65" />
            <circle cx="382" cy="40" r="3" fill="#FEF08A" />
          </g>
        )}

        {themeId === 'muharram_ashura' && (
          <g>
            <line x1="345" y1="18" x2="345" y2="120" stroke="#F59E0B" strokeWidth="2.5" />
            <path d="M345 22 C372 16 392 32 412 24 L412 52 C392 60 372 44 345 50 Z" fill="#EF4444" fillOpacity="0.75" />
          </g>
        )}

        {/* پرندگان حرم */}
        <path d="M105 96 Q109 91 113 96 Q117 91 121 96" stroke="#FEF08A" strokeWidth="1.4" strokeOpacity="0.75" fill="none" />
        <path d="M128 84 Q131 80 134 84 Q137 80 140 84" stroke="#FEF08A" strokeWidth="1.2" strokeOpacity="0.65" fill="none" />

        {/* کوهستان و افق دوردست */}
        <path d="M0 178 Q105 142 210 168 T420 158 L420 220 L0 220 Z" fill={theme.surface} fillOpacity="0.75" />

        {/* گلدسته‌های طلایی حرم (راست و چپ گنبد) */}
        <rect x="152" y="54" width="11" height="126" fill="url(#minaretGlowDyn)" rx="2" />
        <rect x="148" y="76" width="19" height="6" rx="2" fill="#FEF08A" />
        <polygon points="157.5,35 151,54 164,54" fill="#FEF08A" />
        <line x1="157.5" y1="22" x2="157.5" y2="35" stroke="#FEF08A" strokeWidth="1.8" />

        <rect x="258" y="64" width="10" height="116" fill="url(#minaretGlowDyn)" rx="2" />
        <rect x="254" y="84" width="18" height="5" rx="2" fill="#FEF08A" />
        <polygon points="263,46 257,64 269,64" fill="#FEF08A" />

        {/* گنبد طلایی باشکوه در مرکز */}
        <path d="M174 178 C174 114 246 114 246 178 Z" fill="url(#shrineGoldDomeDyn)" stroke="#FEF08A" strokeWidth="1.5" />
        <line x1="210" y1="98" x2="210" y2="126" stroke="#FEF08A" strokeWidth="2.2" />
        <circle cx="210" cy="108" r="3.8" fill="#FEF08A" />

        {/* ایوان و رواق‌های حرم */}
        <rect x="122" y="164" width="176" height="38" rx="4" fill={theme.surfaceAlt} stroke="#FBBF24" strokeWidth="1.1" strokeOpacity="0.65" />
        <path d="M198 202 L198 172 C198 162 222 162 222 172 L222 202 Z" fill={theme.bg} stroke={theme.primary} strokeWidth="1.2" />

        {/* درختان سرو حاشیه */}
        <circle cx="22" cy="158" r="36" fill={theme.surface} fillOpacity="0.88" />
        <circle cx="48" cy="178" r="26" fill={theme.surfaceAlt} fillOpacity="0.88" />
        <circle cx="398" cy="162" r="34" fill={theme.surface} fillOpacity="0.85" />

        {/* محو شدن نرم پایین تصویر به داخل رنگ پس‌زمینه پوسته انتخابی */}
        <rect x="0" y="145" width="420" height="75" fill="url(#horizonFadeBottom)" />
      </svg>
    </div>
  );
}

// ۳. کتیبه نستعلیق طلایی «اللَّهُمَّ بَارِكْ لِمَوْلَانَا صَاحِبِ الزَّمَانِ (عج)»
export function NastaliqMahdiCrown({ onOpenGuide }: { onOpenGuide?: () => void }) {
  const { theme } = useTheme();
  return (
    <div
      className="px-3 py-1.5 rounded-2xl border flex items-center justify-between gap-2 backdrop-blur-md shadow-md"
      style={{
        background: `color-mix(in srgb, ${theme.surface} 82%, transparent)`,
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

// ۴. قوس هلالی بزرگ ۲۰۲۶ (بدون نوار خطی اضافه در پایین + نوشتن کامل «۱ ساعت و ۴۹ دقیقه تا اذان مغرب»)
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
  const clamped = Math.max(8, Math.min(100, progressPercent || 35));
  const r = 106;
  const arcLen = Math.PI * r;
  const dashOffset = arcLen - (arcLen * clamped) / 100;
  const angleRad = Math.PI * (1 - clamped / 100);
  const cx = 130 - r * Math.cos(angleRad);
  const cy = 116 - r * Math.sin(angleRad);

  const fullRemainingFa = expandRemainingTimeFa(remainingText);

  return (
    <div className="relative flex flex-col items-center justify-center pt-1 pb-1">
      <div className="relative w-[256px] h-[126px] flex flex-col items-center justify-end">
        <svg viewBox="0 0 260 128" className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
          <defs>
            <linearGradient id="heroArcGrad2026Clean" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor={primaryColor} />
              <stop offset="55%" stopColor={accentColor} />
              <stop offset="100%" stopColor="#FEF08A" />
            </linearGradient>
          </defs>
          {/* مسیر پس‌زمینه هلال */}
          <path
            d="M 24 116 A 106 106 0 0 1 236 116"
            fill="none"
            stroke="rgba(255, 255, 255, 0.13)"
            strokeWidth="8.5"
            strokeLinecap="round"
          />
          {/* مسیر پرشونده هلال */}
          <path
            d="M 24 116 A 106 106 0 0 1 236 116"
            fill="none"
            stroke="url(#heroArcGrad2026Clean)"
            strokeWidth="8.5"
            strokeLinecap="round"
            strokeDasharray={arcLen}
            strokeDashoffset={dashOffset}
          />
          {/* گوی نورانی روی مدار هلال */}
          <circle cx={cx} cy={cy} r="11" fill={accentColor} fillOpacity="0.34" />
          <circle cx={cx} cy={cy} r="5.5" fill="#FEF08A" stroke="#FFFFFF" strokeWidth="1.8" />
        </svg>

        {/* محتوای داخل هلال */}
        <div className="relative z-10 text-center pb-0.5">
          <span
            className="inline-block px-3 py-0.5 rounded-full text-[11px] font-black mb-1"
            style={{
              background: `color-mix(in srgb, ${primaryColor} 24%, transparent)`,
              color: primaryColor,
              border: `1px solid ${primaryColor}`,
            }}
          >
            نماز بعدی
          </span>
          <h2 className="text-2xl font-black text-white leading-tight">
            نماز {nextPrayerName}
          </h2>
          <div
            className="text-4xl font-black tracking-tight mt-0.5"
            style={{ color: accentColor, textShadow: '0 4px 18px rgba(245, 158, 11, 0.35)' }}
          >
            {toFaDigits(nextPrayerTime)}
          </div>
        </div>
      </div>

      {/* متن کامل و شیوای زمان باقی‌مانده (بدون نوار خطی اضافه!) */}
      <div className="mt-2.5 px-4 py-1.5 rounded-full border bg-black/20 border-white/10 flex items-center justify-center gap-1.5">
        <span className="text-xs">🕒</span>
        <span className="text-xs font-black text-white">
          {fullRemainingFa} تا اذان {nextPrayerName}
        </span>
      </div>
    </div>
  );
}
