import { useState, useEffect, useRef } from 'react';
import { Compass, X, Navigation, CheckCircle2 } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { toFaDigits } from '@/lib/jalali';

interface Props {
  cityName: string;
  lat: number;
  lng: number;
  onClose: () => void;
}

const KAABA_LAT = 21.422487;
const KAABA_LNG = 39.826206;

export function calculateQiblaAngle(lat: number, lng: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;

  const phiK = toRad(KAABA_LAT);
  const lambdaK = toRad(KAABA_LNG);
  const phi = toRad(lat);
  const lambda = toRad(lng);

  const y = Math.sin(lambdaK - lambda);
  const x = Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(lambdaK - lambda);
  const qibla = toDeg(Math.atan2(y, x));
  return (qibla + 360) % 360;
}

function shortestAngleDiff(a: number, b: number): number {
  const diff = ((a - b + 540) % 360) - 180;
  return Math.abs(diff);
}

export function QiblaCompassModal({ cityName, lat, lng, onClose }: Props) {
  const { theme } = useTheme();
  const [smoothHeading, setSmoothHeading] = useState<number | null>(null);
  const sinRef = useRef<number>(0);
  const cosRef = useRef<number>(1);
  const initializedRef = useRef<boolean>(false);
  const lastCommittedHeadingRef = useRef<number | null>(null);
  const lastEmitRef = useRef<number>(0);

  const qiblaAngle = Math.round(calculateQiblaAngle(lat, lng));

  useEffect(() => {
    // ضریب نرم‌کنندگی بالا + آستانه سکون ۱.۸ درجه برای حذف ۱۰۰٪ لرزش ریز دست
    const ALPHA = 0.06;
    const DEADBAND_DEG = 1.8;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      const webkitHeading = (e as unknown as { webkitCompassHeading?: number }).webkitCompassHeading;
      let raw: number | null = null;
      if (typeof webkitHeading === 'number' && !isNaN(webkitHeading)) {
        raw = webkitHeading;
      } else if (typeof e.alpha === 'number' && !isNaN(e.alpha)) {
        raw = (360 - e.alpha) % 360;
      }
      if (raw === null) return;

      const rad = (raw * Math.PI) / 180;
      if (!initializedRef.current) {
        sinRef.current = Math.sin(rad);
        cosRef.current = Math.cos(rad);
        initializedRef.current = true;
      } else {
        sinRef.current = sinRef.current * (1 - ALPHA) + Math.sin(rad) * ALPHA;
        cosRef.current = cosRef.current * (1 - ALPHA) + Math.cos(rad) * ALPHA;
      }

      const now = Date.now();
      if (now - lastEmitRef.current > 80) {
        const filteredDeg = ((Math.atan2(sinRef.current, cosRef.current) * 180) / Math.PI + 360) % 360;
        const prev = lastCommittedHeadingRef.current;
        if (prev === null || shortestAngleDiff(filteredDeg, prev) >= DEADBAND_DEG) {
          lastEmitRef.current = now;
          lastCommittedHeadingRef.current = filteredDeg;
          setSmoothHeading(Math.round(filteredDeg));
        }
      }
    };

    window.addEventListener('deviceorientationabsolute' as keyof WindowEventMap, handleOrientation as EventListener, true);
    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => {
      window.removeEventListener('deviceorientationabsolute' as keyof WindowEventMap, handleOrientation as EventListener, true);
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, []);

  const relativeRotation = smoothHeading !== null ? (qiblaAngle - smoothHeading + 360) % 360 : qiblaAngle;
  const isAligned = smoothHeading !== null && (relativeRotation <= 7 || relativeRotation >= 353);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
      dir="rtl"
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6 text-center relative border shadow-2xl"
        style={{
          background: theme.surface,
          borderColor: isAligned ? theme.primary : theme.border,
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="بستن قبله‌نما"
          className="absolute top-4 left-4 text-muted"
        >
          <X size={22} />
        </button>

        <div className="flex items-center justify-center gap-2 mb-1">
          <Compass size={20} color={theme.primary} />
          <h2 className="text-lg font-bold text-app">قبله‌نمای دقیق</h2>
        </div>
        <p className="text-muted text-xs mb-5">
          افق {cityName} — زاویه قبله از شمال: <strong>{toFaDigits(qiblaAngle)}°</strong>
        </p>

        <div
          className="w-60 h-60 rounded-full mx-auto mb-5 relative flex items-center justify-center border-2"
          style={{
            borderColor: isAligned ? theme.primary : theme.border,
            background: `radial-gradient(circle, color-mix(in srgb, ${theme.primary} 15%, transparent), transparent 72%)`,
          }}
        >
          <div
            className="absolute -top-4 px-3 py-1 rounded-full text-xs font-bold shadow-md flex items-center gap-1"
            style={{ background: isAligned ? theme.primary : theme.surface, color: isAligned ? theme.bg : theme.text, border: `1px solid ${theme.border}` }}
          >
            <span>🕋</span>
            <span>کعبه</span>
          </div>

          <span className="absolute bottom-2 text-[10px] text-muted">جنوب</span>
          <span className="absolute right-3 text-[10px] text-muted">شرق</span>
          <span className="absolute left-3 text-[10px] text-muted">غرب</span>

          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              transform: `rotate(${relativeRotation}deg)`,
              transition: 'transform 220ms ease-out',
            }}
          >
            <div className="flex flex-col items-center -mt-14">
              <div
                className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-md mb-1"
                style={{ background: isAligned ? theme.primary : theme.accent, color: theme.bg }}
              >
                🕋
              </div>
              <Navigation size={32} color={isAligned ? theme.primary : theme.accent} />
            </div>
          </div>
        </div>

        {isAligned ? (
          <div
            className="p-3 rounded-2xl mb-4 flex items-center justify-center gap-2 text-xs font-bold"
            style={{ background: `color-mix(in srgb, ${theme.primary} 18%, transparent)`, color: theme.primary }}
          >
            <CheckCircle2 size={16} />
            <span>دقیقاً رو به قبله قرار دارید ✨</span>
          </div>
        ) : (
          <p className="text-muted text-xs leading-relaxed mb-4">
            {smoothHeading !== null
              ? `گوشی را افقی بچرخانید تا نشانگر 🕋 چرخان با کعبه بالای صفحه منطبق شود.`
              : `زاویه قبله در ${cityName} برابر ${toFaDigits(qiblaAngle)} درجه در جهت عقربه‌های ساعت از شمال است.`}
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-2xl text-xs font-bold"
          style={{ background: theme.primary, color: theme.bg }}
        >
          بستن قبله‌نما
        </button>
      </div>
    </div>
  );
}
