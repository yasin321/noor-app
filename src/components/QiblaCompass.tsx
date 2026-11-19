import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Compass,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  MapPin,
  AlertTriangle,
  X,
  RotateCw,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { getCityById, getGuestCityId, getCustomGpsCoords } from '@/lib/cities';

const KAABA_LAT = 21.422487;
const KAABA_LNG = 39.826206;
const CALIBRATION_SESSION_KEY = 'noor_qibla_calibrated_session_v1';

export interface QiblaCompassProps {
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  cityLat?: number;
  cityLng?: number;
  cityName?: string;
  cityNameFa?: string;
  city?: { lat?: number; lng?: number; nameFa?: string; name?: string };
  onClose?: () => void;
  onToast?: (msg: string) => void;
  embedded?: boolean;
  compact?: boolean;
}

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

export function calculateQiblaDirection(lat: number, lng: number): number {
  const phi1 = toRad(lat);
  const phi2 = toRad(KAABA_LAT);
  const deltaLambda = toRad(KAABA_LNG - lng);
  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function calculateDistanceToKaabaKm(lat: number, lng: number): number {
  const R = 6371;
  const dLat = toRad(KAABA_LAT - lat);
  const dLng = toRad(KAABA_LNG - lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat)) * Math.cos(toRad(KAABA_LAT)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function toFaDigits(value: number | string): string {
  const map: Record<string, string> = {
    '0': '۰', '1': '۱', '2': '۲', '3': '۳', '4': '۴',
    '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹',
  };
  return String(value).replace(/[0-9]/g, (d) => map[d] || d);
}

function normalize360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

function shortestDelta(fromDeg: number, toDegVal: number): number {
  return ((toDegVal - fromDeg + 540) % 360) - 180;
}

function cardinalLabelFa(deg: number): string {
  const d = normalize360(deg);
  if (d >= 337.5 || d < 22.5) return 'شمال';
  if (d < 67.5) return 'شمال‌شرقی';
  if (d < 112.5) return 'شرق';
  if (d < 157.5) return 'جنوب‌شرقی';
  if (d < 202.5) return 'جنوب';
  if (d < 247.5) return 'جنوب‌غربی';
  if (d < 292.5) return 'غرب';
  return 'شمال‌غربی';
}

/**
 * Gimbal-lock-free heading estimator from W3C DeviceOrientation angles.
 * Smoothly blends flat (+Y) and upright (-Z) projections so holding the phone
 * flat or at a comfortable 35-85 degree viewing angle never flips or jitters.
 */
function computeTiltCompensatedHeading(
  alpha: number,
  beta: number | null,
  gamma: number | null
): number {
  const bVal = typeof beta === 'number' && Number.isFinite(beta) ? Math.max(-85, Math.min(85, beta)) : 0;
  const gVal = typeof gamma === 'number' && Number.isFinite(gamma) ? Math.max(-75, Math.min(75, gamma)) : 0;

  const a = toRad(alpha);
  const b = toRad(bVal);
  const g = toRad(gVal);

  const cA = Math.cos(a), sA = Math.sin(a);
  const cB = Math.cos(b), sB = Math.sin(b);
  const cG = Math.cos(g), sG = Math.sin(g);

  const absSinB = Math.abs(sB);
  const signB = sB >= 0 ? 1 : -1;

  const east = -sA * cB * cB + absSinB * (-cA * sG - sA * signB * absSinB * cG);
  const north = cA * cB * cB + absSinB * (-sA * sG + cA * signB * absSinB * cG);

  let heading = toDeg(Math.atan2(east, north));
  if (typeof window !== 'undefined' && window.screen?.orientation?.angle) {
    heading += window.screen.orientation.angle;
  }
  return normalize360(heading);
}

interface DeviceOrientationWithWebkit extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
  webkitCompassAccuracy?: number;
}

export function QiblaCompass(props: QiblaCompassProps) {
  // موقعیت جغرافیایی مؤثر (اولویت: پراپ ورودی -> GPS دقیق ذخیره‌شده -> شهر انتخابی)
  const locationInfo = useMemo(() => {
    const savedCity = getCityById(getGuestCityId());
    const gps = getCustomGpsCoords();
    const lat =
      props.lat ?? props.latitude ?? props.cityLat ?? props.city?.lat ?? gps?.lat ?? savedCity.lat;
    const lng =
      props.lng ?? props.longitude ?? props.cityLng ?? props.city?.lng ?? gps?.lng ?? savedCity.lng;
    const cityLabel =
      props.cityNameFa ?? props.cityName ?? props.city?.nameFa ?? props.city?.name ?? savedCity.nameFa;
    return { lat, lng, cityLabel };
  }, [
    props.lat,
    props.lng,
    props.latitude,
    props.longitude,
    props.cityLat,
    props.cityLng,
    props.cityName,
    props.cityNameFa,
    props.city?.lat,
    props.city?.lng,
    props.city?.nameFa,
    props.city?.name,
  ]);

  const qiblaAngle = useMemo(
    () => calculateQiblaDirection(locationInfo.lat, locationInfo.lng),
    [locationInfo.lat, locationInfo.lng]
  );

  const distanceKm = useMemo(
    () => calculateDistanceToKaabaKm(locationInfo.lat, locationInfo.lng),
    [locationInfo.lat, locationInfo.lng]
  );

  const [sensorActive, setSensorActive] = useState(false);
  const [needsIosPermission, setNeedsIosPermission] = useState(false);
  const [isAligned, setIsAligned] = useState(false);
  const [stability, setStability] = useState<'high' | 'medium' | 'low'>('high');
  const [displayHeading, setDisplayHeading] = useState(0);
  const [continuousDialDeg, setContinuousDialDeg] = useState(0);
  const [manualPreviewDeg, setManualPreviewDeg] = useState(0);

  // پاپ‌آپ راهنمای کالیبره ∞ (در اولین ورود جلسه یا با لمس دکمه کالیبره باز می‌شود)
  const [showCalibModal, setShowCalibModal] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(CALIBRATION_SESSION_KEY) !== 'done';
    } catch {
      return true;
    }
  });
  const [calibProgress, setCalibProgress] = useState(0);
  const [calibDone, setCalibDone] = useState(false);
  const [localOpen, setLocalOpen] = useState(true);

  const handleCloseQibla = useCallback(() => {
    setLocalOpen(false);
    if (props.onClose) {
      props.onClose();
    }
  }, [props]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCloseQibla();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleCloseQibla]);

  // رف‌های موتور ضدلرزش 60fps بدون Re-render اضافی
  const hasAbsoluteRef = useRef(false);
  const vecXRef = useRef(0);
  const vecYRef = useRef(1);
  const vecInitRef = useRef(false);
  const targetHeadingRef = useRef(0);
  const smoothContinuousRef = useRef(0);
  const lastAlignedRef = useRef(false);
  const lastOrientationRef = useRef<{ a: number; b: number; g: number } | null>(null);
  const calibMotionAccRef = useRef(0);
  const recentDeltasRef = useRef<number[]>([]);
  const showCalibRef = useRef(showCalibModal);
  const calibDoneRef = useRef(calibDone);

  useEffect(() => {
    showCalibRef.current = showCalibModal;
    calibDoneRef.current = calibDone;
  }, [showCalibModal, calibDone]);

  const finishCalibration = useCallback(() => {
    setCalibProgress(100);
    setCalibDone(true);
    try {
      sessionStorage.setItem(CALIBRATION_SESSION_KEY, 'done');
    } catch {}
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate([30, 40, 65]);
      } catch {}
    }
    window.setTimeout(() => {
      setShowCalibModal(false);
    }, 650);
  }, []);

  const openCalibrationPopup = useCallback(() => {
    calibMotionAccRef.current = 0;
    lastOrientationRef.current = null;
    setCalibProgress(0);
    setCalibDone(false);
    setShowCalibModal(true);
  }, []);

  const handleOrientationEvent = useCallback(
    (ev: DeviceOrientationWithWebkit, isAbsoluteStream: boolean) => {
      if (isAbsoluteStream && typeof ev.alpha === 'number') {
        hasAbsoluteRef.current = true;
      } else if (!isAbsoluteStream && hasAbsoluteRef.current && typeof ev.webkitCompassHeading !== 'number') {
        return;
      }

      let rawHeading: number | null = null;
      if (typeof ev.webkitCompassHeading === 'number' && Number.isFinite(ev.webkitCompassHeading)) {
        rawHeading = normalize360(ev.webkitCompassHeading);
        if (typeof ev.webkitCompassAccuracy === 'number' && ev.webkitCompassAccuracy > 28) {
          setStability('low');
        }
      } else if (typeof ev.alpha === 'number' && Number.isFinite(ev.alpha)) {
        rawHeading = computeTiltCompensatedHeading(ev.alpha, ev.beta, ev.gamma);
      }

      if (rawHeading === null) return;
      setSensorActive(true);

      // ۱. محاسبه پیشرفت زنده کالیبره ∞ در صورت باز بودن پاپ‌آپ
      if (showCalibRef.current && !calibDoneRef.current) {
        const curA = ev.alpha ?? rawHeading;
        const curB = ev.beta ?? 0;
        const curG = ev.gamma ?? 0;
        const prev = lastOrientationRef.current;
        if (prev) {
          const dA = Math.abs(shortestDelta(prev.a, curA));
          const dB = Math.abs(curB - prev.b);
          const dG = Math.abs(curG - prev.g);
          const stepMotion = Math.min(28, dA * 0.55 + dB * 0.9 + dG * 0.9);
          if (stepMotion > 0.8) {
            calibMotionAccRef.current += stepMotion;
            const pct = Math.min(100, Math.round((calibMotionAccRef.current / 420) * 100));
            setCalibProgress(pct);
            if (pct >= 100) {
              finishCalibration();
            }
          }
        }
        lastOrientationRef.current = { a: curA, b: curB, g: curG };
      }

      // ۲. فیلتر برداری دایره‌ای تطبیقی (Adaptive Circular Vector Low-Pass) + Deadband
      const rad = toRad(rawHeading);
      const nx = Math.sin(rad);
      const ny = Math.cos(rad);

      if (!vecInitRef.current) {
        vecXRef.current = nx;
        vecYRef.current = ny;
        targetHeadingRef.current = rawHeading;
        smoothContinuousRef.current = -rawHeading;
        vecInitRef.current = true;
        return;
      }

      const prevFiltered = targetHeadingRef.current;
      const diff = Math.abs(shortestDelta(prevFiltered, rawHeading));

      // ثبت پایداری سیگنال مغناطیسی در ۲۰ نمونه اخیر
      recentDeltasRef.current.push(diff);
      if (recentDeltasRef.current.length > 20) recentDeltasRef.current.shift();
      const avgJitter =
        recentDeltasRef.current.reduce((acc, v) => acc + v, 0) / recentDeltasRef.current.length;
      if (avgJitter > 10) setStability('low');
      else if (avgJitter > 4.5) setStability('medium');
      else setStability('high');

      // ناحیه مرده میکرو-لرزش دست: حرکت‌های زیر ۰.۴۵ درجه نادیده گرفته می‌شوند
      if (diff < 0.45) return;

      // ضریب میرایی هوشمند: در سکون فوق‌العاده نرم (0.065)، در چرخش سریع پاسخگو (0.28)
      const alphaFactor =
        diff < 2.5 ? 0.065 : diff < 8 ? 0.11 : diff < 22 ? 0.18 : 0.28;

      vecXRef.current = vecXRef.current * (1 - alphaFactor) + nx * alphaFactor;
      vecYRef.current = vecYRef.current * (1 - alphaFactor) + ny * alphaFactor;

      const filteredDeg = normalize360(toDeg(Math.atan2(vecXRef.current, vecYRef.current)));
      targetHeadingRef.current = filteredDeg;
    },
    [finishCalibration]
  );

  // ثبت لیسنرهای سنسور قطب‌نما (اولویت با deviceorientationabsolute در اندروید)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const DOE = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };
    if (DOE && typeof DOE.requestPermission === 'function') {
      setNeedsIosPermission(true);
      return;
    }

    const onAbs = (e: Event) => handleOrientationEvent(e as DeviceOrientationWithWebkit, true);
    const onRel = (e: Event) => handleOrientationEvent(e as DeviceOrientationWithWebkit, false);

    window.addEventListener('deviceorientationabsolute', onAbs, true);
    window.addEventListener('deviceorientation', onRel, true);

    return () => {
      window.removeEventListener('deviceorientationabsolute', onAbs, true);
      window.removeEventListener('deviceorientation', onRel, true);
    };
  }, [handleOrientationEvent]);

  const requestIosCompassPermission = async () => {
    try {
      const DOE = window.DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<'granted' | 'denied'>;
      };
      if (DOE && typeof DOE.requestPermission === 'function') {
        const res = await DOE.requestPermission();
        if (res === 'granted') {
          setNeedsIosPermission(false);
          const onRel = (e: Event) => handleOrientationEvent(e as DeviceOrientationWithWebkit, false);
          window.addEventListener('deviceorientation', onRel, true);
        }
      }
    } catch {}
  };

  // حلقه انیمیشن نرم 60fps برای چرخش بدون پرش صفحه قطب‌نما و تشخیص قفل قبله با هیسترزیس
  useEffect(() => {
    let rafId = 0;
    let lastUiCommit = 0;

    const tick = (now: number) => {
      const activeTargetHeading = sensorActive ? targetHeadingRef.current : manualPreviewDeg;
      const desiredDialRotation = -activeTargetHeading;

      const cur = smoothContinuousRef.current;
      const curNorm = normalize360(cur);
      const desiredNorm = normalize360(desiredDialRotation);
      const delta = shortestDelta(curNorm, desiredNorm);

      // حرکت فنری فوق‌العاده نرم (Spring Damping) بدون پرش در مرز ۰/۳۶۰
      if (Math.abs(delta) > 0.04) {
        smoothContinuousRef.current = cur + delta * 0.16;
      }

      if (now - lastUiCommit > 32) {
        lastUiCommit = now;
        const visualHeading = normalize360(-smoothContinuousRef.current);
        setContinuousDialDeg(smoothContinuousRef.current);
        setDisplayHeading(Math.round(visualHeading));

        const errAbs = Math.abs(shortestDelta(visualHeading, qiblaAngle));
        // هیسترزیس: قفل شدن در ±5 درجه و باز شدن در ±7.5 درجه (بدون چشمک زدن!)
        const nextAligned = lastAlignedRef.current ? errAbs <= 7.5 : errAbs <= 5.0;
        if (nextAligned !== lastAlignedRef.current) {
          lastAlignedRef.current = nextAligned;
          setIsAligned(nextAligned);
          if (
            nextAligned &&
            sensorActive &&
            !showCalibRef.current &&
            typeof navigator !== 'undefined' &&
            typeof navigator.vibrate === 'function'
          ) {
            try {
              navigator.vibrate([35, 30, 75]);
            } catch {}
          }
        }
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [sensorActive, manualPreviewDeg, qiblaAngle]);

  // محاسبه راهنمای چرخش لحظه‌ای به سمت قبله
  const turnDelta = shortestDelta(displayHeading, qiblaAngle);
  const absTurn = Math.round(Math.abs(turnDelta));

  const guidance = useMemo(() => {
    if (isAligned) {
      return {
        text: 'دقیقاً رو به قبله هستید (کعبه معظمه)',
        dir: 'locked' as const,
      };
    }
    if (absTurn >= 150) {
      return {
        text: 'به سمت پشت خود بچرخید',
        dir: turnDelta > 0 ? ('right' as const) : ('left' as const),
      };
    }
    if (turnDelta > 0) {
      return {
        text: absTurn <= 20 ? `کمی به راست بچرخید (${toFaDigits(absTurn)}°)` : `به سمت راست بچرخید (${toFaDigits(absTurn)}°)`,
        dir: 'right' as const,
      };
    }
    return {
      text: absTurn <= 20 ? `کمی به چپ بچرخید (${toFaDigits(absTurn)}°)` : `به سمت چپ بچرخید (${toFaDigits(absTurn)}°)`,
      dir: 'left' as const,
    };
  }, [isAligned, absTurn, turnDelta]);

  // خطوط درجه‌بندی دور صفحه قطب‌نما (هر ۵ درجه)
  const dialTicks = useMemo(() => {
    const items: { angle: number; major: boolean; cardinal?: string }[] = [];
    for (let deg = 0; deg < 360; deg += 5) {
      let cardinal: string | undefined;
      if (deg === 0) cardinal = 'ش';
      else if (deg === 90) cardinal = 'ق';
      else if (deg === 180) cardinal = 'ج';
      else if (deg === 270) cardinal = 'غ';
      items.push({ angle: deg, major: deg % 30 === 0, cardinal });
    }
    return items;
  }, []);

  const calibStrokeDash = 2 * Math.PI * 52;
  const calibStrokeOffset = calibStrokeDash * (1 - calibProgress / 100);

  if (!props.embedded && !localOpen) {
    return null;
  }

  const cardBody = (
    <div
      className="w-full max-w-md rounded-[30px] p-4 border shadow-2xl space-y-3.5 relative overflow-hidden select-none max-h-[92vh] overflow-y-auto"
      style={{
        background: isAligned
          ? 'linear-gradient(170deg, rgba(6, 56, 42, 0.99) 0%, rgba(4, 24, 19, 1) 100%)'
          : 'linear-gradient(170deg, rgba(8, 28, 34, 0.99) 0%, rgba(4, 15, 20, 1) 100%)',
        borderColor: isAligned ? 'rgba(52, 211, 153, 0.65)' : 'rgba(251, 191, 36, 0.32)',
        transition: 'background 400ms ease, border-color 400ms ease',
      }}
      dir="rtl"
      onClick={(e) => e.stopPropagation()}
    >
      {/* هدر استاندارد پاپ‌آپ قبله‌نما با دکمه واضح خروج/بازگشت و کالیبره */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0"
            style={{
              background: isAligned ? 'rgba(52, 211, 153, 0.2)' : 'rgba(251, 191, 36, 0.14)',
              borderColor: isAligned ? '#34D399' : 'rgba(251, 191, 36, 0.4)',
              color: isAligned ? '#34D399' : '#FBBF24',
            }}
          >
            <Compass size={20} />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-black text-white truncate">قبله‌نمای هوشمند</h2>
            <div className="flex items-center gap-1 text-[11px] text-emerald-100/70 mt-0.5 truncate">
              <MapPin size={11} className="text-amber-300 shrink-0" />
              <span className="truncate">{locationInfo.cityLabel}</span>
              <span>·</span>
              <span>{toFaDigits(Math.round(qiblaAngle))}° {cardinalLabelFa(qiblaAngle)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!showCalibModal && (
            <button
              type="button"
              onClick={openCalibrationPopup}
              className="px-2.5 py-1.5 rounded-xl border text-[11px] font-black flex items-center gap-1 transition-transform active:scale-95"
              style={{
                background: stability === 'low' ? 'rgba(245, 158, 11, 0.22)' : 'rgba(255, 255, 255, 0.06)',
                borderColor: stability === 'low' ? '#F59E0B' : 'rgba(255, 255, 255, 0.16)',
                color: stability === 'low' ? '#FDE68A' : '#E2E8F0',
              }}
            >
              <RefreshCw size={12} />
              <span>کالیبره ∞</span>
            </button>
          )}
          {!props.embedded && (
            <button
              type="button"
              onClick={handleCloseQibla}
              aria-label="بستن قبله‌نما"
              className="w-8 h-8 rounded-full border border-white/20 bg-white/10 flex items-center justify-center text-white transition-transform active:scale-90"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* مرحله ۱ (درون همان پاپ‌آپ): راهنمای کالیبره ∞ -> پس از اتمام مستقیم وارد قبله‌نما در همین پاپ‌آپ می‌شود */}
      {showCalibModal ? (
        <div className="space-y-4 py-1">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-black">
            <Sparkles size={15} />
            <span>کالیبره قطب‌نما برای دقت بالا و حذف لرزش</span>
          </div>

          <div className="flex flex-col items-center justify-center py-2">
            <div className="relative w-48 h-32 flex items-center justify-center">
              <svg viewBox="0 0 180 110" className="w-full h-full">
                <defs>
                  <linearGradient id="noorInfGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#34D399" />
                    <stop offset="50%" stopColor="#FBBF24" />
                    <stop offset="100%" stopColor="#38BDF8" />
                  </linearGradient>
                </defs>
                <path
                  d="M 90 55 C 122 12, 166 18, 166 55 C 166 92, 122 98, 90 55 C 58 12, 14 18, 14 55 C 14 92, 58 98, 90 55 Z"
                  fill="none"
                  stroke="rgba(255,255,255,0.14)"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <path
                  d="M 90 55 C 122 12, 166 18, 166 55 C 166 92, 122 98, 90 55 C 58 12, 14 18, 14 55 C 14 92, 58 98, 90 55 Z"
                  fill="none"
                  stroke="url(#noorInfGrad)"
                  strokeWidth="3"
                  strokeDasharray="6 6"
                  opacity="0.88"
                />
                <circle r="8" fill="#FBBF24" stroke="#FEF9C3" strokeWidth="2">
                  <animateMotion
                    dur="2.4s"
                    repeatCount="indefinite"
                    path="M 90 55 C 122 12, 166 18, 166 55 C 166 92, 122 98, 90 55 C 58 12, 14 18, 14 55 C 14 92, 58 98, 90 55 Z"
                  />
                </circle>
              </svg>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="10" />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke={calibDone ? '#34D399' : '#FBBF24'}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={calibStrokeDash}
                    strokeDashoffset={calibStrokeOffset}
                    style={{ transition: 'stroke-dashoffset 150ms ease' }}
                  />
                </svg>
                <span className="absolute text-xs font-black text-white">
                  {calibDone ? '✓' : `${toFaDigits(calibProgress)}٪`}
                </span>
              </div>
              <div className="text-right space-y-1">
                <div className="text-xs font-black text-amber-200">
                  {calibDone ? 'کالیبره انجام شد! ورود به قبله‌نما...' : 'گوشی را به شکل ∞ حرکت دهید'}
                </div>
                <p className="text-[11px] text-emerald-100/75 leading-relaxed">
                  ۳ ثانیه گوشی را در هوا مانند عدد ۸ انگلیسی بچرخانید و از فلز دور نگه دارید.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={finishCalibration}
              className="flex-1 py-3 rounded-2xl font-black text-xs shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
                color: '#041511',
              }}
            >
              ادامه به قبله‌نما
            </button>
            <button
              type="button"
              onClick={() => setShowCalibModal(false)}
              className="px-4 py-3 rounded-2xl font-black text-xs border border-white/15 bg-white/5 text-slate-200"
            >
              رد کردن
            </button>
          </div>
        </div>
      ) : (
        /* مرحله ۲ (درون همان پاپ‌آپ): صفحه اصلی قبله‌نما + دکمه خروج/بازگشت */
        <div className="space-y-3.5 animate-fade-in">
          <div
            className="rounded-2xl px-3.5 py-2.5 border flex items-center justify-center gap-2 text-center transition-all duration-300"
            style={{
              background: isAligned
                ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.28) 0%, rgba(251, 191, 36, 0.22) 100%)'
                : 'rgba(255, 255, 255, 0.04)',
              borderColor: isAligned ? '#34D399' : 'rgba(255, 255, 255, 0.1)',
            }}
          >
            {guidance.dir === 'locked' && <CheckCircle2 size={17} className="text-emerald-300 shrink-0" />}
            {guidance.dir === 'right' && <RotateCw size={16} className="text-amber-300 shrink-0" />}
            {guidance.dir === 'left' && <RotateCcw size={16} className="text-amber-300 shrink-0" />}
            <span className="text-xs font-black" style={{ color: isAligned ? '#A7F3D0' : '#FEF3C7' }}>
              {guidance.text}
            </span>
          </div>

          {needsIosPermission && (
            <button
              type="button"
              onClick={() => { void requestIosCompassPermission(); }}
              className="w-full py-2.5 rounded-2xl font-black text-xs shadow-lg"
              style={{ background: 'linear-gradient(135deg, #FBBF24 0%, #D97706 100%)', color: '#041511' }}
            >
              فعال‌سازی سنسور قطب‌نمای گوشی
            </button>
          )}

          <div className="relative flex items-center justify-center py-2">
            <div
              className="absolute w-72 h-72 rounded-full pointer-events-none transition-all duration-500"
              style={{
                background: isAligned
                  ? 'radial-gradient(circle, rgba(52, 211, 153, 0.28) 0%, rgba(251, 191, 36, 0.14) 45%, transparent 72%)'
                  : 'radial-gradient(circle, rgba(251, 191, 36, 0.10) 0%, transparent 65%)',
              }}
            />

            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
              <div
                className="w-3.5 h-3.5 rotate-45 rounded-[3px] shadow-lg transition-colors duration-300"
                style={{
                  background: isAligned ? '#34D399' : '#FBBF24',
                  boxShadow: isAligned ? '0 0 14px #34D399' : '0 0 10px rgba(251,191,36,0.7)',
                }}
              />
              <div
                className="w-0.5 h-4 -mt-1 transition-colors duration-300"
                style={{ background: isAligned ? '#34D399' : 'rgba(251, 191, 36, 0.8)' }}
              />
            </div>

            <div
              className="relative w-64 h-64 rounded-full p-2 shadow-2xl border-2"
              style={{
                background: 'radial-gradient(circle at 50% 45%, #0D2C26 0%, #051613 78%, #020B09 100%)',
                borderColor: isAligned ? '#34D399' : 'rgba(251, 191, 36, 0.42)',
                boxShadow: isAligned
                  ? '0 0 36px rgba(52, 211, 153, 0.32), inset 0 0 24px rgba(52, 211, 153, 0.18)'
                  : '0 16px 36px rgba(0, 0, 0, 0.55), inset 0 0 24px rgba(251, 191, 36, 0.08)',
                transition: 'border-color 300ms ease, box-shadow 300ms ease',
              }}
            >
              <svg
                viewBox="0 0 260 260"
                className="w-full h-full will-change-transform"
                style={{ transform: `rotate(${continuousDialDeg.toFixed(2)}deg)` }}
              >
                <circle cx="130" cy="130" r="118" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                <circle cx="130" cy="130" r="92" fill="none" stroke="rgba(251,191,36,0.14)" strokeWidth="1" strokeDasharray="3 5" />

                {dialTicks.map((t) => (
                  <g key={t.angle} transform={`rotate(${t.angle} 130 130)`}>
                    <line
                      x1="130"
                      y1={t.major ? 14 : 18}
                      x2="130"
                      y2={t.major ? 26 : 24}
                      stroke={t.angle === 0 ? '#F87171' : t.major ? 'rgba(251,191,36,0.75)' : 'rgba(255,255,255,0.22)'}
                      strokeWidth={t.angle === 0 ? 2.6 : t.major ? 1.8 : 1}
                      strokeLinecap="round"
                    />
                    {t.cardinal && (
                      <text
                        x="130"
                        y="42"
                        textAnchor="middle"
                        fill={t.angle === 0 ? '#FCA5A5' : '#D1FAE5'}
                        fontSize="13"
                        fontWeight="900"
                      >
                        {t.cardinal}
                      </text>
                    )}
                  </g>
                ))}

                <g transform={`rotate(${qiblaAngle.toFixed(2)} 130 130)`}>
                  <path
                    d="M130 34 L138 130 L130 144 L122 130 Z"
                    fill={isAligned ? '#34D399' : '#FBBF24'}
                    fillOpacity="0.92"
                  />
                  <path
                    d="M130 144 L134 188 L130 198 L126 188 Z"
                    fill="rgba(255,255,255,0.18)"
                  />
                  <g transform="translate(130, 26)">
                    <circle
                      r="14"
                      fill={isAligned ? '#065F46' : '#1E1B10'}
                      stroke={isAligned ? '#34D399' : '#FBBF24'}
                      strokeWidth="2"
                    />
                    <rect x="-6.5" y="-6.5" width="13" height="13" rx="2" fill="#0B0F14" stroke="#FDE68A" strokeWidth="1" />
                    <line x1="-6.5" y1="-2" x2="6.5" y2="-2" stroke="#FBBF24" strokeWidth="2.2" />
                  </g>
                </g>

                <circle cx="130" cy="130" r="9" fill="#041511" stroke={isAligned ? '#34D399' : '#FBBF24'} strokeWidth="2.5" />
                <circle cx="130" cy="130" r="3" fill={isAligned ? '#34D399' : '#FDE68A'} />
              </svg>

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black/55 border border-white/10 text-[10px] font-black text-emerald-100/90 backdrop-blur-sm">
                جهت فعلی: {toFaDigits(displayHeading)}°
              </div>
            </div>
          </div>

          {!sensorActive && (
            <div className="rounded-2xl p-3 border border-white/10 bg-white/[0.03] space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-amber-200 font-bold">حالت پیش‌نمایش (سنسور فعال نیست)</span>
                <span className="text-emerald-200 font-black">{toFaDigits(manualPreviewDeg)}°</span>
              </div>
              <input
                type="range"
                min={0}
                max={359}
                value={manualPreviewDeg}
                onChange={(e) => setManualPreviewDeg(Number(e.target.value))}
                aria-label="چرخش آزمایشی قطب‌نما"
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl p-2.5 border border-white/10 bg-white/[0.03]">
              <div className="text-[10px] text-emerald-100/60">زاویه قبله</div>
              <div className="text-xs font-black text-amber-300 mt-0.5">{toFaDigits(Math.round(qiblaAngle))}°</div>
            </div>

            <div className="rounded-2xl p-2.5 border border-white/10 bg-white/[0.03]">
              <div className="text-[10px] text-emerald-100/60">فاصله تا کعبه</div>
              <div className="text-xs font-black text-white mt-0.5">{toFaDigits(distanceKm)} کیلومتر</div>
            </div>

            <div className="rounded-2xl p-2.5 border border-white/10 bg-white/[0.03]">
              <div className="text-[10px] text-emerald-100/60">دقت سنسور</div>
              <div
                className="text-xs font-black mt-0.5 flex items-center justify-center gap-1"
                style={{
                  color: stability === 'high' ? '#34D399' : stability === 'medium' ? '#FBBF24' : '#FB7185',
                }}
              >
                {stability === 'low' ? <AlertTriangle size={12} /> : <ShieldCheck size={12} />}
                <span>{stability === 'high' ? 'پایدار' : stability === 'medium' ? 'متوسط' : 'نیاز به کالیبره'}</span>
              </div>
            </div>
          </div>

          {!props.embedded && (
            <button
              type="button"
              onClick={handleCloseQibla}
              className="w-full py-3 rounded-2xl border border-white/15 bg-white/5 text-xs font-black text-white transition-transform active:scale-98"
            >
              بازگشت و خروج
            </button>
          )}
        </div>
      )}
    </div>
  );

  if (props.embedded) {
    return cardBody;
  }

  if (typeof document === 'undefined') {
    return cardBody;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-3.5 animate-fade-in"
      style={{ background: 'rgba(2, 10, 12, 0.86)', backdropFilter: 'blur(10px)' }}
      onClick={handleCloseQibla}
    >
      {cardBody}
    </div>,
    document.body
  );
}

export default QiblaCompass;
