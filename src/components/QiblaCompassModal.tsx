import { useState, useEffect } from 'react';
import { Compass, X, Navigation, CheckCircle2 } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

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
  let qibla = toDeg(Math.atan2(y, x));
  return (qibla + 360) % 360;
}

export function QiblaCompassModal({ cityName, lat, lng, onClose }: Props) {
  const { theme } = useTheme();
  const [heading, setHeading] = useState<number | null>(null);
  const qiblaAngle = Math.round(calculateQiblaAngle(lat, lng));

  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      const webkitHeading = (e as unknown as { webkitCompassHeading?: number }).webkitCompassHeading;
      if (typeof webkitHeading === 'number') {
        setHeading(Math.round(webkitHeading));
      } else if (typeof e.alpha === 'number') {
        setHeading(Math.round((360 - e.alpha) % 360));
      }
    };

    window.addEventListener('deviceorientationabsolute' as keyof WindowEventMap, handleOrientation as EventListener, true);
    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => {
      window.removeEventListener('deviceorientationabsolute' as keyof WindowEventMap, handleOrientation as EventListener, true);
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, []);

  const relativeRotation = heading !== null ? (qiblaAngle - heading + 360) % 360 : qiblaAngle;
  const isAligned = heading !== null && (relativeRotation <= 8 || relativeRotation >= 352);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)' }}
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
          <h2 className="text-lg font-bold text-app">قبله‌نمای هوشمند</h2>
        </div>
        <p className="text-muted text-xs mb-5">
          به افق {cityName} — زاویه قبله از شمال: <strong dir="ltr">{qiblaAngle}°</strong>
        </p>

        {/* صفحه دایره‌ای قطب‌نما */}
        <div
          className="w-56 h-56 rounded-full mx-auto mb-5 relative flex items-center justify-center border-2 transition-colors"
          style={{
            borderColor: isAligned ? theme.primary : theme.border,
            background: `radial-gradient(circle, color-mix(in srgb, ${theme.primary} 14%, transparent), transparent 70%)`,
          }}
        >
          <span className="absolute top-2 text-[11px] font-bold text-primary">شمال (N)</span>
          <span className="absolute bottom-2 text-[10px] text-muted">جنوب (S)</span>
          <span className="absolute right-3 text-[10px] text-muted">شرق</span>
          <span className="absolute left-3 text-[10px] text-muted">غرب</span>

          {/* عقربه چرخان به سمت کعبه */}
          <div
            className="w-full h-full flex items-center justify-center transition-transform duration-200 ease-out"
            style={{ transform: `rotate(${relativeRotation}deg)` }}
          >
            <div className="flex flex-col items-center -mt-16">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg mb-1"
                style={{ background: theme.primary, color: theme.bg }}
              >
                🕋
              </div>
              <Navigation size={28} color={theme.accent} style={{ transform: 'rotate(0deg)' }} />
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
            {heading !== null
              ? `گوشی را به صورت افقی نگه دارید و بچرخید تا نماد 🕋 در بالا قرار گیرد. (جهت فعلی گوشی: ${heading}°)`
              : 'اگر سنسور مغناطیسی گوشی غیرفعال است، زاویهٔ نشان‌داده‌شده نسبت به شمال جغرافیایی جهت دقیق قبله است.'}
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-2xl text-xs font-bold"
          style={{ background: theme.primary, color: theme.bg }}
        >
          بستن
        </button>
      </div>
    </div>
  );
}
