import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  BellRing,
  Check,
  ChevronLeft,
  ChevronRight,
  Compass,
  MapPin,
  MessageSquare,
  Sliders,
  Sparkles,
  Volume2,
  Wifi,
  X,
  AlertTriangle,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { requestPermission, rescheduleAll } from '@/lib/reminderService';
import { findNearestCity, saveCustomGpsCoords, setGuestCityId } from '@/lib/cities';

export const TUTORIAL_SEEN_KEY = 'noor_tutorial_seen_v1';

interface Props {
  onClose: () => void;
}

const TOTAL_SLIDES = 6;

function markTutorialSeen(): void {
  try {
    localStorage.setItem(TUTORIAL_SEEN_KEY, '1');
  } catch {}
}

function SlideArtwork({ index }: { index: number }) {
  if (index === 0) {
    return (
      <svg viewBox="0 0 260 148" className="w-full h-36 max-w-[260px] mx-auto" aria-hidden="true">
        <defs>
          <radialGradient id="noorObGlow1" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="rgba(251, 191, 36, 0.34)" />
            <stop offset="100%" stopColor="rgba(16, 185, 129, 0)" />
          </radialGradient>
        </defs>
        <rect x="8" y="8" width="244" height="132" rx="22" fill="rgba(7, 36, 29, 0.92)" stroke="rgba(251, 191, 36, 0.32)" strokeWidth="1.2" />
        <ellipse cx="130" cy="70" rx="88" ry="52" fill="url(#noorObGlow1)" />
        {/* قوس محراب و زمان نماز */}
        <path d="M 74 96 A 56 56 0 0 1 186 96" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="6" strokeLinecap="round" />
        <path d="M 74 96 A 56 56 0 0 1 158 48" fill="none" stroke="#FBBF24" strokeWidth="6" strokeLinecap="round" />
        <circle cx="158" cy="48" r="5.5" fill="#FEF08A" stroke="#041511" strokeWidth="2" />
        {/* نشان شهر بالا */}
        <rect x="148" y="18" width="84" height="22" rx="11" fill="rgba(16, 185, 129, 0.2)" stroke="rgba(52, 211, 153, 0.55)" />
        <circle cx="218" cy="29" r="3.5" fill="#34D399" />
        <rect x="162" y="26" width="46" height="6" rx="3" fill="#D1FAE5" />
        {/* زنگوله و آب‌وهوا چپ */}
        <rect x="28" y="18" width="52" height="22" rx="11" fill="rgba(251, 191, 36, 0.16)" stroke="rgba(251, 191, 36, 0.45)" />
        <circle cx="42" cy="29" r="5" fill="#FBBF24" />
        <rect x="52" y="26" width="20" height="6" rx="3" fill="#FEF08A" />
        {/* نوار اوقات شرعی */}
        {[30, 74, 118, 162, 206].map((x, idx) => (
          <g key={x}>
            <rect
              x={x}
              y="104"
              width="34"
              height="26"
              rx="8"
              fill={idx === 2 ? 'rgba(16, 185, 129, 0.28)' : 'rgba(255, 255, 255, 0.05)'}
              stroke={idx === 2 ? '#34D399' : 'rgba(255, 255, 255, 0.12)'}
            />
            <circle cx={x + 17} cy="117" r="4" fill={idx === 2 ? '#FBBF24' : 'rgba(167, 243, 208, 0.55)'} />
          </g>
        ))}
      </svg>
    );
  }

  if (index === 1) {
    return (
      <svg viewBox="0 0 260 148" className="w-full h-36 max-w-[260px] mx-auto" aria-hidden="true">
        <rect x="8" y="8" width="244" height="132" rx="22" fill="rgba(7, 36, 29, 0.92)" stroke="rgba(52, 211, 153, 0.35)" strokeWidth="1.2" />
        {/* خط زمان سه‌مرحله‌ای: پیش از اذان -> اذان -> پس از اذان */}
        <line x1="48" y1="54" x2="212" y2="54" stroke="rgba(255,255,255,0.18)" strokeWidth="3" strokeDasharray="4 4" />
        <circle cx="204" cy="54" r="18" fill="rgba(251, 191, 36, 0.18)" stroke="#FBBF24" strokeWidth="1.6" />
        <circle cx="130" cy="54" r="22" fill="rgba(16, 185, 129, 0.24)" stroke="#34D399" strokeWidth="2" />
        <circle cx="56" cy="54" r="18" fill="rgba(56, 189, 248, 0.18)" stroke="#38BDF8" strokeWidth="1.6" />
        {/* موج صوتی وسط */}
        <rect x="119" y="48" width="4" height="12" rx="2" fill="#FEF08A" />
        <rect x="128" y="42" width="4" height="24" rx="2" fill="#FBBF24" />
        <rect x="137" y="47" width="4" height="14" rx="2" fill="#FEF08A" />
        {/* کارت مصحف و پخش سوره پایین */}
        <rect x="28" y="92" width="204" height="36" rx="12" fill="rgba(255,255,255,0.05)" stroke="rgba(251,191,36,0.32)" />
        <rect x="148" y="103" width="68" height="6" rx="3" fill="#FEF08A" />
        <rect x="164" y="114" width="52" height="4" rx="2" fill="rgba(209,250,229,0.65)" />
        <circle cx="52" cy="110" r="11" fill="#34D399" />
        <polygon points="49,105 49,115 58,110" fill="#041511" />
      </svg>
    );
  }

  if (index === 2) {
    return (
      <svg viewBox="0 0 260 148" className="w-full h-36 max-w-[260px] mx-auto" aria-hidden="true">
        <rect x="8" y="8" width="244" height="132" rx="22" fill="rgba(7, 36, 29, 0.92)" stroke="rgba(251, 191, 36, 0.35)" strokeWidth="1.2" />
        {/* قبله‌نما راست */}
        <circle cx="182" cy="74" r="44" fill="rgba(4, 21, 17, 0.92)" stroke="rgba(251, 191, 36, 0.6)" strokeWidth="2" />
        <circle cx="182" cy="74" r="34" fill="none" stroke="rgba(52, 211, 153, 0.25)" strokeDasharray="3 3" />
        <polygon points="182,38 190,74 182,68 174,74" fill="#FBBF24" />
        <polygon points="182,110 190,74 182,80 174,74" fill="rgba(255,255,255,0.22)" />
        <circle cx="182" cy="74" r="4.5" fill="#FEF08A" />
        {/* نقشه مسجدیاب چپ */}
        <rect x="26" y="28" width="94" height="92" rx="16" fill="rgba(16, 185, 129, 0.12)" stroke="rgba(52, 211, 153, 0.4)" />
        <path d="M 36 96 Q 68 78 106 50" fill="none" stroke="#34D399" strokeWidth="2.5" strokeDasharray="4 3" />
        <circle cx="48" cy="88" r="6" fill="#38BDF8" />
        <circle cx="96" cy="54" r="9" fill="rgba(251, 191, 36, 0.25)" stroke="#FBBF24" strokeWidth="1.5" />
        <circle cx="96" cy="54" r="3.5" fill="#FBBF24" />
      </svg>
    );
  }

  if (index === 3) {
    return (
      <svg viewBox="0 0 260 148" className="w-full h-36 max-w-[260px] mx-auto" aria-hidden="true">
        <rect x="8" y="8" width="244" height="132" rx="22" fill="rgba(7, 36, 29, 0.92)" stroke="rgba(52, 211, 153, 0.35)" strokeWidth="1.2" />
        {/* دایره ذکرشمار */}
        <circle cx="180" cy="74" r="42" fill="rgba(16, 185, 129, 0.14)" stroke="#34D399" strokeWidth="3" />
        <circle cx="180" cy="74" r="32" fill="none" stroke="rgba(251, 191, 36, 0.45)" strokeWidth="1.5" strokeDasharray="4 4" />
        <rect x="164" y="68" width="32" height="12" rx="6" fill="#FEF08A" />
        {/* کارت‌های پیشنهاد ساعتی و آپدیت آنلاین */}
        <rect x="24" y="28" width="98" height="38" rx="12" fill="rgba(251, 191, 36, 0.14)" stroke="rgba(251, 191, 36, 0.4)" />
        <rect x="44" y="39" width="66" height="6" rx="3" fill="#FEF08A" />
        <rect x="56" y="51" width="54" height="4" rx="2" fill="rgba(254, 240, 138, 0.65)" />
        <rect x="24" y="78" width="98" height="38" rx="12" fill="rgba(56, 189, 248, 0.14)" stroke="rgba(56, 189, 248, 0.4)" />
        <rect x="44" y="89" width="66" height="6" rx="3" fill="#BAE6FD" />
        <rect x="58" y="101" width="52" height="4" rx="2" fill="rgba(186, 230, 253, 0.65)" />
      </svg>
    );
  }

  if (index === 4) {
    return (
      <svg viewBox="0 0 260 148" className="w-full h-36 max-w-[260px] mx-auto" aria-hidden="true">
        <rect x="8" y="8" width="244" height="132" rx="22" fill="rgba(7, 36, 29, 0.92)" stroke="rgba(251, 191, 36, 0.35)" strokeWidth="1.2" />
        {/* سه ردیف سوییچ شخصی‌سازی */}
        {[30, 62, 94].map((y, idx) => (
          <g key={y}>
            <rect x="28" y={y} width="204" height="24" rx="10" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" />
            <rect x="118" y={y + 9} width="96" height="6" rx="3" fill="rgba(236, 253, 245, 0.8)" />
            <rect
              x="40"
              y={y + 5}
              width="30"
              height="14"
              rx="7"
              fill={idx !== 2 ? '#34D399' : 'rgba(255,255,255,0.18)'}
            />
            <circle cx={idx !== 2 ? 47 : 63} cy={y + 12} r="5" fill="#FFFFFF" />
          </g>
        ))}
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 260 110" className="w-full h-24 max-w-[240px] mx-auto" aria-hidden="true">
      <rect x="10" y="8" width="240" height="94" rx="20" fill="rgba(7, 36, 29, 0.92)" stroke="rgba(251, 191, 36, 0.4)" strokeWidth="1.2" />
      <circle cx="130" cy="55" r="32" fill="rgba(251, 191, 36, 0.16)" stroke="#FBBF24" strokeWidth="1.8" />
      <circle cx="130" cy="55" r="22" fill="rgba(16, 185, 129, 0.25)" stroke="#34D399" strokeWidth="1.5" />
      <path d="M 121 55 L 127 61 L 140 47" fill="none" stroke="#FEF08A" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const INFO_SLIDES = [
  {
    badge: 'قدم اول · خانه و اوقات شرعی',
    title: 'همه‌چیز در یک نگاه شفاف',
    desc: 'با لمس نام شهر در بالای خانه، موقعیت شما خودکار پیدا می‌شود و با لمس زنگوله هر نماز، اذان آن وقت فعال می‌گردد. تقویم کامل، مناسبت‌ها و آب‌وهوای دقیق نیز همیشه در دسترس است.',
    points: [
      'لمس نام شهر بالا = تشخیص خودکار شهر و افق شرعی شما',
      'لمس زنگوله هر نماز = فعال یا خاموش کردن سریع اذان آن وقت',
      'دسترسی یک‌لمسی به تقویم هجری/شمسی و پیش‌بینی آب‌وهوا',
    ],
  },
  {
    badge: 'قدم دوم · اذان، تعقیبات و قرآن',
    title: 'تعقیبات پیش و پس از اذان و تلاوت سوره',
    desc: 'علاوه بر پخش اذان روی صفحه قفل، می‌توانید برای پیش از اذان (مثل ربنا و دعای نادعلی) و پس از اذان (تعقیبات و سوره‌های برگزیده) پخش صوتی خودکار تنظیم کنید.',
    points: [
      'کوک خودکار نوای پیش از اذان و تعقیبات پس از هر نماز',
      'پخش صوتی آیه‌به‌آیه سوره‌های قرآن با کنترل سرعت و نشانک',
      'قطع فوری پخش روی قفل صفحه با دکمه ولوم صدا یا قفل گوشی',
    ],
  },
  {
    badge: 'قدم سوم · قبله‌نما و مسجدیاب',
    title: 'جهت‌یابی دقیق و یافتن مساجد اطراف',
    desc: 'قبله‌نمای نیتیو زاویه دقیق کعبه را متناسب با موقعیت شما نشان می‌دهد و مسجدیاب هوشمند نزدیک‌ترین مساجد اطرافتان را روی نقشه همراه با مسیریابی نمایش می‌دهد.',
    points: [
      'قبله‌نمای دقیق با نمایش فاصله تا کعبه و کالیبراسیون زنده',
      'مسجدیاب هوشمند برای یافتن سریع مساجد اطراف روی نقشه',
      'سازگار با موقعیت دقیق GPS در تمام شهرهای ایران و جهان',
    ],
  },
  {
    badge: 'قدم چهارم · گنجینه اذکار و بروزرسانی',
    title: 'پیشنهادهای ساعتی ذکر و محتوای پویا',
    desc: 'بر اساس روز هفته، ساعات روز و ایام خاص، ذکرها و دعاهای متناسب پیشنهاد می‌شود و با روشن بودن اینترنت، ذکرها، نواها و پوسته‌های جدید سریع و خودکار بروزرسانی می‌شوند.',
    points: [
      'پیشنهاد هوشمند ذکر و دعا متناسب با روز هفته و ساعت روز',
      'ذکرشمار چندانگشتی روان با ثبت آمار روزانه و چله‌نشینی',
      'بروزرسانی سریع‌تر ذکرها و محتوای مناسبتی هنگام اتصال اینترنت',
    ],
  },
  {
    badge: 'قدم پنجم · شخصی‌سازی در تنظیمات',
    title: 'صفحه خانه را دقیقاً به سلیقه خودتان بچینید',
    desc: 'برای شروع، صفحه خانه کاملاً خلوت و سبک تنظیم شده است. هر زمان خواستید از بخش «تنظیمات» می‌توانید تعقیبات، پیشنهاد روزانه، فونت، پوسته، تصویر حرم و مؤذن را کم یا زیاد کنید.',
    points: [
      'کم و زیاد کردن کارت‌های صفحه خانه از تنظیمات ← شخصی‌سازی',
      'انتخاب از ۲۵ منظره مستند آفلاین یا حالت خودکار شهر و مناسبت',
      'بازبینی مجدد این راهنما در هر زمان از بالای صفحه تنظیمات',
    ],
  },
];

export function AppTutorialModal({ onClose }: Props) {
  const [slide, setSlide] = useState(0);
  // هر دو مجوز به‌صورت پیش‌فرض روشن و آمادهٔ فعال‌سازی هستند
  const [enableNotif, setEnableNotif] = useState(true);
  const [enableGps, setEnableGps] = useState(true);
  const [applying, setApplying] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleClose = () => {
    markTutorialSeen();
    onClose();
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const goNext = () => setSlide((s) => Math.min(TOTAL_SLIDES - 1, s + 1));
  const goPrev = () => setSlide((s) => Math.max(0, s - 1));

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (e.touches.length !== 1) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (touchStartX.current === null || touchStartY.current === null || !e.changedTouches.length) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (Math.abs(dx) < 42 || Math.abs(dy) > Math.abs(dx) * 0.85) return;
    // در چیدمان راست‌به‌چپ: کشیدن به راست = اسلاید بعدی، کشیدن به چپ = اسلاید قبلی
    if (dx > 0) goNext();
    else goPrev();
  };

  const handleFinishAndActivate = async () => {
    if (applying) return;
    setApplying(true);
    markTutorialSeen();

    try {
      if (enableNotif) {
        try {
          localStorage.setItem('noor_guest_notif_enabled', 'true');
        } catch {}
        if (Capacitor.isNativePlatform()) {
          try {
            const status = await requestPermission();
            if (status === 'granted') {
              void rescheduleAll(true);
            }
          } catch {}
        }
      }

      if (enableGps && typeof navigator !== 'undefined' && navigator.geolocation) {
        await new Promise<void>((resolve) => {
          let settled = false;
          const finish = () => {
            if (!settled) {
              settled = true;
              resolve();
            }
          };
          const guardTimer = window.setTimeout(finish, 4000);
          try {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                window.clearTimeout(guardTimer);
                try {
                  const lat = Number(pos.coords.latitude.toFixed(5));
                  const lng = Number(pos.coords.longitude.toFixed(5));
                  const { city: nearest, distanceKm } = findNearestCity(lat, lng);
                  const label =
                    distanceKm <= 35 ? nearest.nameFa : 'موقعیت GPS (' + nearest.nameFa + ')';
                  saveCustomGpsCoords(lat, lng, label);
                  setGuestCityId(nearest.id);
                  window.dispatchEvent(new Event('noor-city-changed'));
                } catch {}
                finish();
              },
              () => {
                window.clearTimeout(guardTimer);
                finish();
              },
              { enableHighAccuracy: false, timeout: 3500, maximumAge: 300000 }
            );
          } catch {
            window.clearTimeout(guardTimer);
            finish();
          }
        });
      }
    } finally {
      setApplying(false);
      onClose();
    }
  };

  const isLastSlide = slide === TOTAL_SLIDES - 1;
  const activeInfo = INFO_SLIDES[Math.min(slide, INFO_SLIDES.length - 1)];

  const ctaLabel = applying
    ? 'در حال فعال‌سازی دسترسی‌ها...'
    : enableNotif && enableGps
    ? 'فعال‌سازی هر دو دسترسی و شروع نور'
    : enableNotif
    ? 'فعال‌سازی اعلان اذان و شروع نور'
    : enableGps
    ? 'فعال‌سازی مکان‌یاب و شروع نور'
    : 'ادامه و ورود به نور';

  const modalUi = (
    <div
      data-no-swipe="true"
      onTouchStart={handleTouchStart}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3.5"
      style={{
        background: 'rgba(2, 12, 10, 0.9)',
        backdropFilter: 'blur(10px)',
        paddingTop: 'max(14px, env(safe-area-inset-top))',
        paddingBottom: 'max(14px, env(safe-area-inset-bottom))',
      }}
      dir="rtl"
    >
      <div
        className="w-full max-w-md rounded-[28px] border shadow-2xl flex flex-col overflow-hidden"
        style={{
          maxHeight: '92vh',
          background: 'linear-gradient(175deg, #092820 0%, #041612 65%, #03110E 100%)',
          borderColor: 'rgba(251, 191, 36, 0.34)',
          color: '#ECFDF5',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* نوار بالای آلبوم */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b shrink-0"
          style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-7 h-7 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(251, 191, 36, 0.16)', border: '1px solid rgba(251, 191, 36, 0.4)' }}
            >
              <Sparkles size={14} color="#FBBF24" />
            </span>
            <div>
              <p className="text-xs font-black text-white leading-tight">راهنمای همراه معنوی نور</p>
              <p className="text-[10px]" style={{ color: 'rgba(167, 243, 208, 0.72)' }}>
                اسلاید {slide + 1} از {TOTAL_SLIDES}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="بستن راهنما"
            className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 border"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderColor: 'rgba(255, 255, 255, 0.12)',
              color: 'rgba(236, 253, 245, 0.82)',
            }}
          >
            <span>رد کردن</span>
            <X size={13} />
          </button>
        </div>

        {/* بدنه اسلاید */}
        <div className="flex-1 overflow-y-auto px-4 pt-3.5 pb-3 space-y-3">
          <SlideArtwork index={slide} />

          {!isLastSlide ? (
            <div className="space-y-2.5 text-right">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black"
                style={{
                  background: 'rgba(251, 191, 36, 0.14)',
                  border: '1px solid rgba(251, 191, 36, 0.32)',
                  color: '#FDE68A',
                }}
              >
                {slide === 0 && <BellRing size={11} color="#FBBF24" />}
                {slide === 1 && <Volume2 size={11} color="#FBBF24" />}
                {slide === 2 && <Compass size={11} color="#FBBF24" />}
                {slide === 3 && <Wifi size={11} color="#FBBF24" />}
                {slide === 4 && <Sliders size={11} color="#FBBF24" />}
                <span>{activeInfo.badge}</span>
              </div>

              <h2 className="text-base font-black text-white leading-snug">{activeInfo.title}</h2>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(209, 250, 229, 0.84)' }}>
                {activeInfo.desc}
              </p>

              <div className="space-y-1.5 pt-1">
                {activeInfo.points.map((pt, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 rounded-2xl px-3 py-2 border text-[11px] leading-relaxed"
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      borderColor: 'rgba(255, 255, 255, 0.08)',
                      color: '#ECFDF5',
                    }}
                  >
                    <span
                      className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: 'rgba(16, 185, 129, 0.24)', color: '#34D399' }}
                    >
                      <Check size={10} strokeWidth={3} />
                    </span>
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 text-right">
              <div>
                <h2 className="text-base font-black text-white leading-snug">
                  فعال‌سازی دسترسی‌های ضروری برای بهترین تجربه
                </h2>
                <p className="text-[11px] mt-1 leading-relaxed" style={{ color: 'rgba(209, 250, 229, 0.78)' }}>
                  هر دو گزینه برای پخش دقیق اذان و تشخیص خودکار شهر آماده شده‌اند؛ اگر مایل نبودید می‌توانید تیک هر کدام را بردارید.
                </p>
              </div>

              {/* کارت بزرگ و برجسته ۱: اعلان اذان و سوره (پیش‌فرض روشن) */}
              <button
                type="button"
                role="switch"
                aria-checked={enableNotif}
                onClick={() => setEnableNotif((v) => !v)}
                className="w-full rounded-2xl p-3.5 border text-right transition-all active:scale-[0.99]"
                style={{
                  background: enableNotif
                    ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.18) 0%, rgba(16, 52, 40, 0.85) 100%)'
                    : 'rgba(255, 255, 255, 0.03)',
                  borderColor: enableNotif ? 'rgba(251, 191, 36, 0.72)' : 'rgba(255, 255, 255, 0.12)',
                  boxShadow: enableNotif ? '0 8px 22px rgba(251, 191, 36, 0.16)' : 'none',
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                      style={{
                        background: enableNotif ? 'rgba(251, 191, 36, 0.24)' : 'rgba(255, 255, 255, 0.06)',
                        border: enableNotif
                          ? '1px solid rgba(251, 191, 36, 0.55)'
                          : '1px solid rgba(255, 255, 255, 0.12)',
                      }}
                    >
                      <BellRing size={20} color={enableNotif ? '#FBBF24' : '#94A3B8'} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black text-white">فعال‌سازی اعلان اذان و سوره</span>
                        <span
                          className="px-1.5 py-0.5 rounded-md text-[9px] font-black"
                          style={{
                            background: 'rgba(251, 191, 36, 0.22)',
                            color: '#FDE68A',
                          }}
                        >
                          ضروری
                        </span>
                      </div>
                      <p className="text-[10.5px] mt-0.5 leading-snug" style={{ color: 'rgba(209, 250, 229, 0.78)' }}>
                        برای پخش سر وقت اذان، سوره‌های کوک‌شده و یادآورها
                      </p>
                    </div>
                  </div>

                  {/* سوییچ بزرگ فنری دارای تیک */}
                  <div
                    className="w-12 h-7 rounded-full p-1 flex items-center shrink-0 transition-all"
                    style={{
                      background: enableNotif ? '#FBBF24' : 'rgba(255, 255, 255, 0.16)',
                      justifyContent: enableNotif ? 'flex-start' : 'flex-end',
                    }}
                  >
                    <span className="w-5 h-5 rounded-full bg-white shadow flex items-center justify-center">
                      {enableNotif && <Check size={12} color="#B45309" strokeWidth={3} />}
                    </span>
                  </div>
                </div>

                {!enableNotif && (
                  <div
                    className="mt-2.5 pt-2 border-t flex items-center gap-1.5 text-[10px] font-bold"
                    style={{ borderColor: 'rgba(255,255,255,0.08)', color: '#FCA5A5' }}
                  >
                    <AlertTriangle size={12} />
                    <span>بدون این مجوز، اذان و سوره‌های کوک‌شده پخش نخواهند شد (از تنظیمات قابل فعال‌سازی است).</span>
                  </div>
                )}
              </button>

              {/* کارت بزرگ و برجسته ۲: مکان‌یاب دقیق GPS (پیش‌فرض روشن) */}
              <button
                type="button"
                role="switch"
                aria-checked={enableGps}
                onClick={() => setEnableGps((v) => !v)}
                className="w-full rounded-2xl p-3.5 border text-right transition-all active:scale-[0.99]"
                style={{
                  background: enableGps
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(8, 44, 34, 0.88) 100%)'
                    : 'rgba(255, 255, 255, 0.03)',
                  borderColor: enableGps ? 'rgba(52, 211, 153, 0.72)' : 'rgba(255, 255, 255, 0.12)',
                  boxShadow: enableGps ? '0 8px 22px rgba(16, 185, 129, 0.16)' : 'none',
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                      style={{
                        background: enableGps ? 'rgba(16, 185, 129, 0.24)' : 'rgba(255, 255, 255, 0.06)',
                        border: enableGps
                          ? '1px solid rgba(52, 211, 153, 0.55)'
                          : '1px solid rgba(255, 255, 255, 0.12)',
                      }}
                    >
                      <MapPin size={20} color={enableGps ? '#34D399' : '#94A3B8'} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black text-white">فعال‌سازی مکان‌یاب دقیق (GPS)</span>
                        <span
                          className="px-1.5 py-0.5 rounded-md text-[9px] font-black"
                          style={{
                            background: 'rgba(16, 185, 129, 0.24)',
                            color: '#6EE7B7',
                          }}
                        >
                          ضروری
                        </span>
                      </div>
                      <p className="text-[10.5px] mt-0.5 leading-snug" style={{ color: 'rgba(209, 250, 229, 0.78)' }}>
                        برای محاسبه دقیق اوقات شرعی شهر شما، قبله‌نما و مسجدیاب
                      </p>
                    </div>
                  </div>

                  <div
                    className="w-12 h-7 rounded-full p-1 flex items-center shrink-0 transition-all"
                    style={{
                      background: enableGps ? '#10B981' : 'rgba(255, 255, 255, 0.16)',
                      justifyContent: enableGps ? 'flex-start' : 'flex-end',
                    }}
                  >
                    <span className="w-5 h-5 rounded-full bg-white shadow flex items-center justify-center">
                      {enableGps && <Check size={12} color="#047857" strokeWidth={3} />}
                    </span>
                  </div>
                </div>

                {!enableGps && (
                  <div
                    className="mt-2.5 pt-2 border-t flex items-center gap-1.5 text-[10px] font-bold"
                    style={{ borderColor: 'rgba(255,255,255,0.08)', color: '#FDE68A' }}
                  >
                    <AlertTriangle size={12} />
                    <span>می‌توانید هر زمان از بالای خانه یا تنظیمات شهر را دستی یا خودکار انتخاب کنید.</span>
                  </div>
                )}
              </button>

              {/* کارت ارتباط با یاسین */}
              <div
                className="rounded-2xl p-3 border flex items-start gap-2.5"
                style={{
                  background: 'rgba(251, 191, 36, 0.08)',
                  borderColor: 'rgba(251, 191, 36, 0.28)',
                }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: 'rgba(251, 191, 36, 0.16)' }}
                >
                  <MessageSquare size={15} color="#FBBF24" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black" style={{ color: '#FDE68A' }}>
                    بخش ارتباط با یاسین
                  </p>
                  <p className="text-[10.5px] mt-0.5 leading-relaxed" style={{ color: 'rgba(236, 253, 245, 0.8)' }}>
                    پیشنهاد، ایده یا نقدی دارید؟ در بخش «ارتباط با سازنده» داخل تنظیمات همیشه منتظر نظرات ارزشمند شما هستم.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* فوتر آلبوم: نقطه‌های پیشرفت + دکمه‌های ناوبری */}
        <div
          className="px-4 py-3 border-t space-y-2.5 shrink-0"
          style={{
            borderColor: 'rgba(255, 255, 255, 0.08)',
            background: 'rgba(3, 18, 14, 0.86)',
          }}
        >
          <div className="flex items-center justify-center gap-1.5">
            {Array.from({ length: TOTAL_SLIDES }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSlide(idx)}
                aria-label={'اسلاید ' + (idx + 1)}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: slide === idx ? '22px' : '7px',
                  background: slide === idx ? '#FBBF24' : 'rgba(255, 255, 255, 0.22)',
                }}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {slide > 0 && (
              <button
                type="button"
                onClick={goPrev}
                className="px-3.5 py-2.5 rounded-2xl text-xs font-bold border flex items-center gap-1 shrink-0"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderColor: 'rgba(255, 255, 255, 0.14)',
                  color: '#ECFDF5',
                }}
              >
                <ChevronRight size={15} />
                <span>قبلی</span>
              </button>
            )}

            {!isLastSlide ? (
              <button
                type="button"
                onClick={goNext}
                className="flex-1 py-2.5 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 shadow-lg transition-transform active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #FBBF24 0%, #D97706 100%)',
                  color: '#041511',
                }}
              >
                <span>اسلاید بعدی</span>
                <ChevronLeft size={16} />
              </button>
            ) : (
              <button
                type="button"
                disabled={applying}
                onClick={() => void handleFinishAndActivate()}
                className="flex-1 py-3 rounded-2xl text-xs font-black shadow-xl transition-transform active:scale-[0.98] disabled:opacity-70"
                style={{
                  background:
                    enableNotif || enableGps
                      ? 'linear-gradient(135deg, #FBBF24 0%, #D97706 100%)'
                      : 'rgba(255, 255, 255, 0.12)',
                  color: enableNotif || enableGps ? '#041511' : '#ECFDF5',
                }}
              >
                {ctaLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalUi, document.body) : modalUi;
}
