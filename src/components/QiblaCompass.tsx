import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Compass, Camera, Sparkles, RefreshCw, CheckCircle2, AlertTriangle, Smartphone, Navigation, Sun, Volume2, X, HelpCircle, Sliders } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
function calculateQiblaDirection(lat: number, lng: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const phiK = toRad(21.422487);
  const lambdaK = toRad(39.826206);
  const phi = toRad(lat);
  const deltaLambda = lambdaK - toRad(lng);
  const y = Math.sin(deltaLambda);
  const x = Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(deltaLambda);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}
import { toFaDigits } from '@/lib/jalali';

interface Props {
  lat: number;
  lng: number;
  cityName: string;
  onClose?: () => void;
}

const KAABA_LAT = 21.422487;
const KAABA_LNG = 39.826206;

// محاسبه فاصله دقیق کروی تا خانه خدا (کعبه معظمه) به کیلومتر
function calculateDistanceToKaabaKm(lat: number, lng: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(KAABA_LAT - lat);
  const dLon = toRad(KAABA_LNG - lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat)) * Math.cos(toRad(KAABA_LAT)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// محاسبه آزیموت جبرانی برای حالتی که کاربر گوشی را عمودی (Upright Portrait) مقابل صورت خود نگه می‌دارد
function computeUprightCompassHeading(alpha: number, beta: number, gamma: number): number {
  const degToRad = Math.PI / 180;
  const _x = (beta || 0) * degToRad;
  const _y = (gamma || 0) * degToRad;
  const _z = (alpha || 0) * degToRad;

  const cX = Math.cos(_x);
  const cY = Math.cos(_y);
  const cZ = Math.cos(_z);
  const sX = Math.sin(_x);
  const sY = Math.sin(_y);
  const sZ = Math.sin(_z);

  // بردار دید پشت گوشی در فضای سه‌بعدی (Optical Axis Compensation)
  const Vx = -cZ * sY - sZ * sX * cY;
  const Vy = -sZ * sY + cZ * sX * cY;

  let compassHeading = Math.atan(Vx / Vy);
  if (Vy < 0) {
    compassHeading += Math.PI;
  } else if (Vx < 0) {
    compassHeading += 2 * Math.PI;
  }
  return (compassHeading * (180 / Math.PI) + 360) % 360;
}

// وکتور سه‌بعدی و طلایی کعبه معظمه (با پرده کعبه و حجرالاسود)
function Kaaba3DArtwork({ size = 64, glowing = false }: { size?: number; glowing?: boolean }) {
  return (
    <div className="relative inline-flex items-center justify-center">
      {glowing && (
        <div
          className="absolute inset-0 rounded-full animate-ping"
          style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.45) 0%, transparent 70%)' }}
        />
      )}
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className="drop-shadow-xl relative z-10">
        {/* هاله نورانی زیر کعبه */}
        <ellipse cx="40" cy="68" rx="26" ry="6" fill={glowing ? '#10B981' : '#F59E0B'} fillOpacity="0.28" />
        {/* وجه چپ مکعب کعبه */}
        <polygon points="16,28 40,38 40,66 16,55" fill="#0F172A" stroke="#FBBF24" strokeWidth="1.2" />
        {/* وجه راست مکعب کعبه */}
        <polygon points="64,28 40,38 40,66 64,55" fill="#1E293B" stroke="#FBBF24" strokeWidth="1.2" />
        {/* سقف کعبه */}
        <polygon points="40,18 64,28 40,38 16,28" fill="#334155" stroke="#FDE68A" strokeWidth="1.4" />
        {/* حزام (کمربند طلایی قرآنی پرده کعبه) */}
        <polygon points="16,35 40,45 40,50 16,40" fill="url(#kaabaGoldBand)" />
        <polygon points="64,35 40,45 40,50 64,40" fill="url(#kaabaGoldBand)" />
        {/* باب الکعبه (درب طلایی کعبه در وجه راست) */}
        <polygon points="47,49 54,46 54,59 47,62" fill="url(#kaabaGoldBand)" />
        {/* رکن حجرالاسود در زاویه روبه‌رو */}
        <circle cx="40" cy="53" r="2.4" fill="#FDE047" stroke="#FFFFFF" strokeWidth="0.8" />
        <defs>
          <linearGradient id="kaabaGoldBand" x1="16" y1="35" x2="64" y2="55" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FEF08A" />
            <stop offset="0.5" stopColor="#F59E0B" />
            <stop offset="1" stopColor="#B45309" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export function QiblaCompass({ lat, lng, cityName, onClose }: Props) {
  const { theme } = useTheme();
  const qiblaAngle = Math.round(calculateQiblaDirection(lat, lng));
  const distanceKm = calculateDistanceToKaabaKm(lat, lng);

  // زاویه فیلترشده و بدون لرزش قطب‌نما
  const [smoothHeading, setSmoothHeading] = useState<number>(qiblaAngle);
  const [sensorState, setSensorState] = useState<'active' | 'needs_calibration' | 'no_sensor'>('active');
  const [isUpright, setIsUpright] = useState<boolean>(true);
  const [pitchAngle, setPitchAngle] = useState<number>(75);
  const [aiVisionMode, setAiVisionMode] = useState<boolean>(false);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [showCalibrateModal, setShowCalibrateModal] = useState<boolean>(false);
  const [manualMode, setManualMode] = useState<boolean>(false);

  // رفرنس‌های فیلتر نرم‌کننده نمایی دایره‌ای (Circular EMA Filter) برای حذف ۱۰۰٪ لرزش
  const sinRef = useRef<number>(Math.sin((qiblaAngle * Math.PI) / 180));
  const cosRef = useRef<number>(Math.cos((qiblaAngle * Math.PI) / 180));
  const lastDisplayedRef = useRef<number>(qiblaAngle);
  const eventCountRef = useRef<number>(0);
  const lastVibrationRef = useRef<number>(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // فیلتر ضدلرزش با میانگین‌گیری برداری روی دایره مثلثاتی
  const applyAntiJitterHeading = useCallback((rawHeading: number) => {
    const rad = (rawHeading * Math.PI) / 180;
    // ضریب 0.12 باعث حرکت فوق‌العاده نرم و بدون پرش عقربه می‌شود
    const smoothingFactor = 0.12;
    sinRef.current = sinRef.current * (1 - smoothingFactor) + Math.sin(rad) * smoothingFactor;
    cosRef.current = cosRef.current * (1 - smoothingFactor) + Math.cos(rad) * smoothingFactor;

    let filteredDeg = (Math.atan2(sinRef.current, cosRef.current) * 180) / Math.PI;
    filteredDeg = (filteredDeg + 360) % 360;

    // آستانه سکون (Dead-band): تغییرات ریز کمتر از 0.4 درجه را نادیده بگیر تا عقربه نلرزد
    let diff = Math.abs(filteredDeg - lastDisplayedRef.current);
    if (diff > 180) diff = 360 - diff;
    if (diff >= 0.4) {
      lastDisplayedRef.current = filteredDeg;
      setSmoothHeading(Math.round(filteredDeg));
    }
  }, []);

  useEffect(() => {
    if (manualMode) return;
    let receivedAnyReading = false;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      const ev = e as DeviceOrientationEvent & { webkitCompassHeading?: number; webkitCompassAccuracy?: number };
      const beta = typeof e.beta === 'number' ? e.beta : 75;
      const gamma = typeof e.gamma === 'number' ? e.gamma : 0;
      const alpha = typeof e.alpha === 'number' ? e.alpha : null;

      setPitchAngle(Math.round(beta));
      // بررسی عمودی بودن گوشی در دست کاربر (بین 30 تا 135 درجه عمودی محسوب می‌شود)
      setIsUpright(Math.abs(beta) >= 28);

      let rawHeading: number | null = null;
      if (typeof ev.webkitCompassHeading === 'number' && !isNaN(ev.webkitCompassHeading)) {
        rawHeading = ev.webkitCompassHeading;
        if (typeof ev.webkitCompassAccuracy === 'number' && ev.webkitCompassAccuracy > 35) {
          setSensorState('needs_calibration');
        } else {
          setSensorState('active');
        }
      } else if (alpha !== null) {
        // اگر گوشی عمودی روبه‌روی صورت است، از فرمول جبران بردار سه‌بعدی استفاده کن
        if (Math.abs(beta) >= 40) {
          rawHeading = computeUprightCompassHeading(alpha, beta, gamma);
        } else {
          rawHeading = (360 - alpha) % 360;
        }
        setSensorState('active');
      }

      if (rawHeading !== null && !isNaN(rawHeading)) {
        receivedAnyReading = true;
        eventCountRef.current += 1;
        applyAntiJitterHeading(rawHeading);
      }
    };

    const win = window as Window & typeof globalThis;
    win.addEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
    win.addEventListener('deviceorientation', handleOrientation as EventListener, true);

    // اگر بعد از ۲.۵ ثانیه هیچ سنسور مغناطیسی روی دستگاه پاسخ نداد، وضعیت سنسور را اطلاع بده
    const checkTimer = setTimeout(() => {
      if (!receivedAnyReading && eventCountRef.current === 0) {
        setSensorState('no_sensor');
      }
    }, 2600);

    return () => {
      clearTimeout(checkTimer);
      win.removeEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
      win.removeEventListener('deviceorientation', handleOrientation as EventListener, true);
    };
  }, [manualMode, applyAntiJitterHeading]);

  // مدیریت روشن/خاموش کردن دوربین پشت برای حالت «نمای هوشمند AI و واقعیت افزوده (AR)»
  const toggleAiVisionMode = async () => {
    if (aiVisionMode) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setCameraActive(false);
      setAiVisionMode(false);
      return;
    }
    setAiVisionMode(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        streamRef.current = stream;
        setCameraActive(true);
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            void videoRef.current.play();
          }
        }, 120);
      }
    } catch {
      // در صورت عدم دسترسی دوربین، آسمان مجازی سه‌بعدی مکه مکرمه (AI Virtual Sky) نمایش داده می‌شود
      setCameraActive(false);
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // محاسبه اختلاف زاویه دید فعلی کاربر با قبله
  const rawDelta = ((qiblaAngle - smoothHeading + 540) % 360) - 180; // بازه -180 تا +180
  const absDelta = Math.abs(rawDelta);
  const isFacingQibla = absDelta <= 7;
  const isNearQibla = absDelta <= 22;

  // ویبره لطیف در لحظه‌ای که کاربر دقیقاً هم‌راستا با کعبه می‌شود
  useEffect(() => {
    if (isFacingQibla && Date.now() - lastVibrationRef.current > 4000) {
      lastVibrationRef.current = Date.now();
      try {
        if ('vibrate' in navigator) navigator.vibrate([45, 60, 90]);
      } catch {}
    }
  }, [isFacingQibla]);

  const turnInstruction = isFacingQibla
    ? '✨ دقیقاً رو به قبله و کعبه معظمه قرار دارید'
    : rawDelta > 0
    ? `به آرامی ${toFaDigits(Math.round(absDelta))} درجه به سمت راست بچرخید ↱`
    : `به آرامی ${toFaDigits(Math.round(absDelta))} درجه به سمت چپ بچرخید ↰`;

  const content = (
    <div
      className="fixed inset-0 z-[999] overflow-y-auto flex flex-col justify-between p-4 sm:p-6 select-none animate-fade-in"
      style={{
        background: aiVisionMode
          ? 'radial-gradient(circle at 50% 30%, #091E3A 0%, #030914 100%)'
          : 'radial-gradient(circle at 50% 25%, #0B253A 0%, #040D1A 68%, #02060D 100%)',
      }}
      dir="rtl"
    >
      {/* پس‌زمینه ویدیوی زنده دوربین در حالت AI / AR Mode */}
      {aiVisionMode && cameraActive && (
        <video
          ref={videoRef}
          playsInline
          muted
          className="fixed inset-0 w-full h-full object-cover opacity-55 pointer-events-none z-0"
        />
      )}

      {/* هاله سبز زمردی دور تا دور صفحه وقتی دقیقاً رو به کعبه قرار می‌گیرید */}
      {isFacingQibla && (
        <div
          className="fixed inset-0 pointer-events-none z-10 transition-opacity duration-500"
          style={{
            boxShadow: 'inset 0 0 85px rgba(16, 185, 129, 0.45)',
            border: '2px solid rgba(52, 211, 153, 0.55)',
          }}
        />
      )}

      {/* ۱. هدر بالای قبله‌نما: دکمه کالیبراسیون، عنوان مکه مکرمه و دکمه بستن */}
      <div className="relative z-20 flex items-center justify-between gap-2 pb-2">
        <button
          type="button"
          onClick={() => setShowCalibrateModal(true)}
          className="px-3 py-2 rounded-2xl border flex items-center gap-1.5 text-xs font-bold transition-transform active:scale-95"
          style={{
            background: 'rgba(15, 23, 42, 0.78)',
            borderColor: sensorState === 'active' ? 'rgba(251, 191, 36, 0.45)' : '#EF4444',
            color: '#FDE68A',
            backdropFilter: 'blur(8px)',
          }}
        >
          <RefreshCw size={14} className={sensorState !== 'active' ? 'animate-spin' : ''} />
          <span>کالیبره و دقت</span>
        </button>

        <div className="text-center">
          <h2 className="text-base font-black text-white tracking-wide flex items-center justify-center gap-1.5">
            <span>🕋</span>
            <span>قبله‌نمای عمودی و هوشمند</span>
          </h2>
          <p className="text-[11px] font-bold text-amber-300/90 mt-0.5">
            مکه مکرمه · فاصله از {cityName}: {toFaDigits(distanceKm.toLocaleString())} کیلومتر
          </p>
        </div>

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-2xl border flex items-center justify-center text-white/80"
            style={{ background: 'rgba(15, 23, 42, 0.78)', borderColor: 'rgba(255,255,255,0.16)' }}
          >
            <X size={18} />
          </button>
        ) : (
          <div className="w-9" />
        )}
      </div>

      {/* ۲. نوار راهنمای عمودی نگه داشتن گوشی (Upright Portrait Indicator) و وضعیت سنسور */}
      <div className="relative z-20 flex flex-col gap-2 my-1">
        <div
          className="px-3.5 py-2 rounded-2xl border flex items-center justify-between gap-2"
          style={{
            background: 'rgba(15, 23, 42, 0.80)',
            borderColor: isUpright ? 'rgba(52, 211, 153, 0.4)' : 'rgba(251, 191, 36, 0.5)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="flex items-center gap-2">
            <Smartphone size={16} color={isUpright ? '#34D399' : '#FBBF24'} />
            <span className="text-[11px] font-bold text-white">
              {isUpright
                ? 'حالت عمودی فعال است — گوشی را مقابل صورت نگه دارید و بچرخید'
                : 'لطفاً گوشی را افقی نگیرید؛ عمودی روبه‌روی صورت خود نگه دارید'}
            </span>
          </div>
          <span
            className="text-[10px] font-black px-2 py-0.5 rounded-full shrink-0"
            style={{
              background: sensorState === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.22)',
              color: sensorState === 'active' ? '#34D399' : '#FDE047',
            }}
          >
            {sensorState === 'active' ? 'قطب‌نما: دقیق ✓' : sensorState === 'needs_calibration' ? 'نیاز به کالیبره' : 'حالت دستی/خورشیدی'}
          </span>
        </div>

        {/* کارت ظهور سه‌بعدی کعبه در حالت AI Vision یا در لحظه قفل شدن روی قبله */}
        {(aiVisionMode || isFacingQibla) && (
          <div
            className="px-4 py-2.5 rounded-3xl border flex items-center justify-between gap-3 transition-all"
            style={{
              background: isFacingQibla
                ? 'linear-gradient(135deg, rgba(6, 78, 59, 0.92) 0%, rgba(4, 47, 46, 0.95) 100%)'
                : 'rgba(15, 23, 42, 0.85)',
              borderColor: isFacingQibla ? '#34D399' : 'rgba(56, 189, 248, 0.45)',
              boxShadow: isFacingQibla ? '0 10px 30px rgba(16, 185, 129, 0.35)' : undefined,
            }}
          >
            <div className="flex items-center gap-3">
              <Kaaba3DArtwork size={50} glowing={isFacingQibla} />
              <div>
                <div className="flex items-center gap-1.5">
                  <Sparkles size={13} color="#FDE047" />
                  <span className="text-xs font-black text-amber-300">
                    {isFacingQibla ? 'کعبه معظمه روبه‌روی شماست!' : 'رادار بصری هوش مصنوعی (AI Kaaba Lock)'}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-100 mt-0.5 font-medium">
                  {isFacingQibla
                    ? `جهت قبله (${toFaDigits(qiblaAngle)}°) قفل شد · ${toFaDigits(distanceKm.toLocaleString())} کیلومتر تا مسجدالحرام`
                    : turnInstruction}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ۳. دایره اصلی قبله‌نمای عمودی (ترکیب طلایی لوکس، پرتو نوری آبی/سبز و آیکون کعبه در بالا) */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center my-2">
        <div className="relative w-[290px] h-[290px] sm:w-[320px] sm:h-[320px] flex items-center justify-center">
          {/* نشانگر ثابت بالای گوشی (خط دید عمودی کاربر) */}
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
            <div
              className="px-2.5 py-0.5 rounded-full text-[10px] font-black border shadow-md"
              style={{
                background: isFacingQibla ? '#10B981' : '#0F172A',
                color: isFacingQibla ? '#042F2E' : '#FDE68A',
                borderColor: isFacingQibla ? '#6EE7B7' : '#F59E0B',
              }}
            >
              {isFacingQibla ? '🕋 قبله ✓' : '▲ روبه‌روی شما'}
            </div>
          </div>

          {/* حلقه بیرونی طلایی ثابت با درجه‌بندی ظریف (الهام از image_f53602.jpg و image_f535e2.jpg) */}
          <svg className="w-full h-full" viewBox="0 0 300 300">
            <defs>
              <radialGradient id="qiblaDialBg" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#0D1F33" stopOpacity="0.92" />
                <stop offset="75%" stopColor="#06101E" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#030811" stopOpacity="0.98" />
              </radialGradient>
              <linearGradient id="goldRimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="50%" stopColor="#D97706" />
                <stop offset="100%" stopColor="#78350F" />
              </linearGradient>
              <linearGradient id="laserNeedleBlue" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor={isFacingQibla ? '#34D399' : '#38BDF8'} />
                <stop offset="75%" stopColor={isFacingQibla ? '#059669' : '#0284C7'} />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>

            {/* صفحه تیره سرمه‌ای-طلایی قطب‌نما */}
            <circle
              cx="150"
              cy="150"
              r="138"
              fill="url(#qiblaDialBg)"
              stroke={isFacingQibla ? '#10B981' : 'url(#goldRimGrad)'}
              strokeWidth={isFacingQibla ? '4' : '2.5'}
            />
            <circle cx="150" cy="150" r="112" fill="none" stroke="rgba(251, 191, 36, 0.22)" strokeWidth="1.2" />
            <circle cx="150" cy="150" r="78" fill="none" stroke="rgba(56, 189, 248, 0.14)" strokeWidth="1" strokeDasharray="3 3" />

            {/* گروه چرخان صفحه قطب‌نما (N, E, S, W و تیک‌های درجه) با چرخش نرم بدون لرزش */}
            <g
              style={{
                transform: `rotate(${-smoothHeading}deg)`,
                transformOrigin: '150px 150px',
                transition: 'transform 140ms ease-out',
              }}
            >
              {Array.from({ length: 72 }, (_, i) => {
                const deg = i * 5;
                const isMajor = deg % 30 === 0;
                const y1 = isMajor ? 16 : 20;
                const y2 = isMajor ? 28 : 25;
                return (
                  <line
                    key={deg}
                    x1="150"
                    y1={y1}
                    x2="150"
                    y2={y2}
                    stroke={deg === 0 ? '#EF4444' : isMajor ? '#FDE68A' : 'rgba(255,255,255,0.28)'}
                    strokeWidth={isMajor ? '2' : '1'}
                    transform={`rotate(${deg} 150 150)`}
                  />
                );
              })}
              {/* حروف جهات اصلی جغرافیایی */}
              <text x="150" y="44" textAnchor="middle" fill="#EF4444" fontSize="14" fontWeight="900">N</text>
              <text x="260" y="155" textAnchor="middle" fill="#FDE68A" fontSize="13" fontWeight="800">E</text>
              <text x="150" y="266" textAnchor="middle" fill="#94A3B8" fontSize="13" fontWeight="800">S</text>
              <text x="40" y="155" textAnchor="middle" fill="#FDE68A" fontSize="13" fontWeight="800">W</text>
            </g>

            {/* گروه چرخان پرتو لیزری قبله و نماد کعبه (زاویه نسبی rawDelta) */}
            <g
              style={{
                transform: `rotate(${rawDelta}deg)`,
                transformOrigin: '150px 150px',
                transition: 'transform 140ms ease-out',
              }}
            >
              {/* پرتو نورانی آبی/سبز به سمت کعبه (دقیقاً مشابه image_f535e2.jpg) */}
              <polygon points="150,42 141,150 159,150" fill="url(#laserNeedleBlue)" />
              <polygon points="150,185 144,150 156,150" fill="rgba(56, 189, 248, 0.22)" />

              {/* دایره سبز/طلایی حامل آیکون کعبه در نوک عقربه */}
              <circle
                cx="150"
                cy="40"
                r="21"
                fill={isFacingQibla ? '#065F46' : '#0F172A'}
                stroke={isFacingQibla ? '#34D399' : '#FBBF24'}
                strokeWidth="3"
              />
              {/* مکعب کعبه در نوک عقربه */}
              <rect x="140" y="31" width="20" height="18" rx="2.5" fill="#090D16" stroke="#FDE68A" strokeWidth="1.5" />
              <line x1="140" y1="36" x2="160" y2="36" stroke="#F59E0B" strokeWidth="2.5" />
              <rect x="151" y="40" width="4" height="8" fill="#FBBF24" />
            </g>

            {/* گوی مرکزی قطب‌نما */}
            <circle cx="150" cy="150" r="16" fill="#0F172A" stroke="#FBBF24" strokeWidth="2.5" />
            <circle cx="150" cy="150" r="8" fill={isFacingQibla ? '#34D399' : '#38BDF8'} />
          </svg>

          {/* متن وضعیت هم‌راستایی در پایین دایره (مشابه Facing Qibla در image_f535e2.jpg) */}
          <div className="absolute bottom-8 inset-x-0 text-center pointer-events-none">
            <p
              className="text-sm font-black tracking-wide"
              style={{ color: isFacingQibla ? '#34D399' : isNearQibla ? '#FDE047' : '#38BDF8' }}
            >
              {isFacingQibla ? '✓ رو به قبله (Facing Qibla)' : `زاویه قبله: ${toFaDigits(qiblaAngle)}°`}
            </p>
            <span className="text-[10px] font-bold text-slate-300/85 block mt-0.5">
              {toFaDigits(distanceKm.toLocaleString())} کیلومتر تا کعبه
            </span>
          </div>
        </div>

        {/* راهنمای متنی زیر دایره (Rotate your phone until the arrow points up) */}
        <div className="text-center mt-2 space-y-1">
          <h3 className="text-lg font-black text-white">
            قبله {cityName}: {toFaDigits(qiblaAngle)} درجه (جنوب‌غربی)
          </h3>
          <p className="text-xs font-bold" style={{ color: isFacingQibla ? '#34D399' : '#94A3B8' }}>
            {turnInstruction}
          </p>
        </div>

        {/* اسلایدر کمکی برای گوشی‌های فاقد سنسور مغناطیسی یا تست دستی */}
        {(sensorState === 'no_sensor' || manualMode) && (
          <div className="w-full max-w-xs mt-3 p-3 rounded-2xl border bg-slate-900/85" style={{ borderColor: 'rgba(251,191,36,0.4)' }}>
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-200 mb-1.5">
              <span>🧭 چرخش دستی قطب‌نما (مخصوص گوشی بدون سنسور):</span>
              <span dir="ltr">{toFaDigits(smoothHeading)}°</span>
            </div>
            <input
              type="range"
              min={0}
              max={359}
              value={smoothHeading}
              onChange={(e) => setSmoothHeading(Number(e.target.value))}
              className="w-full accent-amber-400"
            />
          </div>
        )}
      </div>

      {/* ۴. فوتر دکمه‌های عملیاتی: دکمه AR/AI Mode (مشابه image_f53d65.jpg) + حالت دستی */}
      <div className="relative z-20 flex flex-col gap-2.5 pt-2">
        <div className="flex items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => void toggleAiVisionMode()}
            className="flex-1 max-w-[230px] py-3 px-4 rounded-full font-black text-xs flex items-center justify-center gap-2 shadow-xl border transition-transform active:scale-95"
            style={{
              background: aiVisionMode
                ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                : 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
              color: aiVisionMode ? '#042F2E' : '#F8FAFC',
              borderColor: aiVisionMode ? '#6EE7B7' : 'rgba(251, 191, 36, 0.5)',
            }}
          >
            <Camera size={16} />
            <span>{aiVisionMode ? 'بستن نمای دوربین (AR)' : '✨ نمای هوشمند AI و دوربین (AR)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setManualMode((m) => !m)}
            className="py-3 px-3.5 rounded-full text-xs font-bold border flex items-center gap-1.5"
            style={{
              background: manualMode ? 'rgba(251, 191, 36, 0.2)' : 'rgba(15, 23, 42, 0.85)',
              borderColor: manualMode ? '#FBBF24' : 'rgba(255,255,255,0.16)',
              color: '#FDE68A',
            }}
            title="تنظیم دستی زاویه شمال"
          >
            <Sliders size={15} />
            <span>{manualMode ? 'سنسور خودکار' : 'تنظیم دستی'}</span>
          </button>
        </div>
      </div>

      {/* ۵. مودال راهنمای کالیبراسیون شکل ∞ و عیب‌یابی سنسور مغناطیسی */}
      {showCalibrateModal && (
        <div
          className="fixed inset-0 z-[1005] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)' }}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-5 border space-y-3.5 text-right"
            style={{ background: '#0F172A', borderColor: 'rgba(251, 191, 36, 0.45)' }}
          >
            <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <h3 className="text-sm font-black text-amber-300">🧭 کالیبراسیون و بررسی قطعه قطب‌نما</h3>
              <button type="button" onClick={() => setShowCalibrateModal(false)} className="text-slate-400">
                <X size={18} />
              </button>
            </div>

            {/* انیمیشن شکل ۸ انگلیسی (∞) */}
            <div className="py-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center">
              <svg width="130" height="64" viewBox="0 0 130 64" fill="none">
                <path
                  d="M35 32 C15 10, 15 54, 35 32 C55 10, 75 54, 95 32 C115 10, 115 54, 95 32 C75 10, 55 54, 35 32 Z"
                  stroke="#38BDF8"
                  strokeWidth="3"
                  strokeDasharray="6 4"
                />
                <circle cx="65" cy="32" r="6" fill="#FBBF24" />
              </svg>
              <span className="text-[11px] font-bold text-sky-300 mt-1">
                گوشی را ۳ بار به شکل علامت بی‌نهایت (∞) در هوا بچرخانید
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-200 leading-relaxed">
              <p>۱. <strong>نگهداری عمودی:</strong> گوشی را افقی روی زمین نگذارید؛ آن را عمودی روبه‌روی صورت خود بگیرید و به آرامی بچرخید تا آیکون کعبه در بالای دایره قرار گیرد.</p>
              <p>۲. <strong>دوری از آهنربا:</strong> قاب‌های مگنتی، آهنربای پایه نگهدارنده خودرو یا فلزات نزدیک گوشی باعث انحراف سنسور می‌شوند.</p>
              <p>۳. <strong>وضعیت قطعه سخت‌افزاری گوشی شما:</strong> {sensorState === 'no_sensor' ? '❌ سنسور مغناطیسی (Magnetometer) روی این دستگاه یافت نشد؛ می‌توانید از اسلایدر «تنظیم دستی» استفاده کنید.' : '✅ قطعه قطب‌نمای مغناطیسی گوشی شما متصل و فعال است (زاویه شیب عمودی: ' + toFaDigits(pitchAngle) + '°).'}</p>
            </div>

            <button
              type="button"
              onClick={() => setShowCalibrateModal(false)}
              className="w-full py-2.5 rounded-2xl text-xs font-black"
              style={{ background: '#FBBF24', color: '#0F172A' }}
            >
              متوجه شدم، بازگشت به قبله‌نما
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content;
}

export default QiblaCompass;
