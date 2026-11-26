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
  Sun,
  Moon,
  Map as MapIcon,
  Navigation,
  Plus,
  Minus,
} from 'lucide-react';
import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';
import { getCityById, getGuestCityId, getCustomGpsCoords, CITIES } from '@/lib/cities';
import { useBackHandler } from '@/lib/backNavigation';

interface NativeCompassEvent {
  heading: number;
  pitch: number;
  roll: number;
  accuracy?: number;
  mode?: string;
  isMagnetic?: boolean;
  isRelativeGyro?: boolean;
}

interface NativeCompassBridge {
  startCompass(opts: { lat: number; lng: number }): Promise<{
    available: boolean;
    isMagnetic?: boolean;
    isRelativeGyro?: boolean;
    mode?: string;
    declination?: number;
    hasMag?: boolean;
    hasUncalMag?: boolean;
    hasAccel?: boolean;
    hasGyro?: boolean;
    hasRotVec?: boolean;
    hasGeoRot?: boolean;
    hasGameRot?: boolean;
  }>;
  stopCompass(): Promise<void>;
  getCompassSnapshot(): Promise<{
    hasSample: boolean;
    heading: number;
    pitch: number;
    roll: number;
    accuracy: number;
    samples: number;
    mode: string;
    isMagnetic?: boolean;
    isRelativeGyro?: boolean;
    hasMag: boolean;
    hasUncalMag: boolean;
    hasAccel?: boolean;
    hasGyro: boolean;
    hasRotVec: boolean;
    hasGeoRot?: boolean;
    hasGameRot?: boolean;
  }>;
  addListener(
    eventName: 'compassHeading',
    listenerFunc: (data: NativeCompassEvent) => void
  ): Promise<PluginListenerHandle>;
}

const NoorCompass = registerPlugin<NativeCompassBridge>('NoorAlarm');

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

// محاسبه نجومی زاویه دقیق خورشید (در روز) و ماه (در شب) — ۱۰۰٪ آفلاین برای همه گوشی‌ها
export function calculateCelestialAzimuth(
  latDeg: number,
  lngDeg: number,
  date: Date = new Date()
): { body: 'sun' | 'moon'; labelFa: string; azimuthDeg: number; altitudeDeg: number } {
  const rad = Math.PI / 180;
  const deg = 180 / Math.PI;
  const jd = date.getTime() / 86400000 + 2440587.5;
  const d = jd - 2451545.0;

  const g = (357.529 + 0.98560028 * d) * rad;
  const q = 280.459 + 0.98564736 * d;
  const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * rad;
  const e = (23.439 - 0.00000036 * d) * rad;
  const raSun = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L));
  const decSun = Math.asin(Math.sin(e) * Math.sin(L));

  const gmst = (18.697374558 + 24.06570982441908 * d) % 24;
  const lst = ((gmst * 15 + lngDeg) % 360 + 360) % 360;
  const phi = latDeg * rad;

  const haSun = ((lst - raSun * deg + 540) % 360 - 180) * rad;
  const altSun = Math.asin(
    Math.max(-1, Math.min(1, Math.sin(phi) * Math.sin(decSun) + Math.cos(phi) * Math.cos(decSun) * Math.cos(haSun)))
  );
  const azSun = (Math.atan2(-Math.sin(haSun), Math.tan(decSun) * Math.cos(phi) - Math.sin(phi) * Math.cos(haSun)) * deg + 360) % 360;

  if (altSun * deg > -2) {
    return {
      body: 'sun',
      labelFa: 'خورشید',
      azimuthDeg: Math.round(azSun),
      altitudeDeg: Math.round(altSun * deg),
    };
  }

  const Lmoon = (218.316 + 13.176396 * d) * rad;
  const Mmoon = (134.963 + 13.064993 * d) * rad;
  const Fmoon = (93.272 + 13.22935 * d) * rad;
  const lonM = Lmoon + 6.289 * rad * Math.sin(Mmoon);
  const latM = 5.128 * rad * Math.sin(Fmoon);
  const raMoon = Math.atan2(Math.sin(lonM) * Math.cos(e) - Math.tan(latM) * Math.sin(e), Math.cos(lonM));
  const decMoon = Math.asin(Math.sin(latM) * Math.cos(e) + Math.cos(latM) * Math.sin(e) * Math.sin(lonM));
  const haMoon = ((lst - raMoon * deg + 540) % 360 - 180) * rad;
  const altMoon = Math.asin(
    Math.max(-1, Math.min(1, Math.sin(phi) * Math.sin(decMoon) + Math.cos(phi) * Math.cos(decMoon) * Math.cos(haMoon)))
  );
  const azMoon = (Math.atan2(-Math.sin(haMoon), Math.tan(decMoon) * Math.cos(phi) - Math.sin(phi) * Math.cos(haMoon)) * deg + 360) % 360;

  return {
    body: 'moon',
    labelFa: 'ماه',
    azimuthDeg: Math.round(azMoon),
    altitudeDeg: Math.round(altMoon * deg),
  };
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

function computeBearingDeg(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function latLngToTileXY(lat: number, lng: number, zoom: number): { x: number; y: number; fracX: number; fracY: number } {
  const n = 2 ** zoom;
  const xExact = ((lng + 180) / 360) * n;
  const latRad = toRad(lat);
  const yExact = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  const x = Math.floor(xExact);
  const y = Math.floor(yExact);
  return { x, y, fracX: xExact - x, fracY: yExact - y };
}

interface DeviceOrientationWithWebkit extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
  webkitCompassAccuracy?: number;
}

function approxDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function resolveQiblaLocationLabel(
  lat: number,
  lng: number,
  explicitLabel?: string,
  fallbackCity?: { lat: number; lng: number; nameFa: string }
): string {
  if (fallbackCity && approxDistanceKm(lat, lng, fallbackCity.lat, fallbackCity.lng) <= 35) {
    return explicitLabel || fallbackCity.nameFa;
  }
  let nearestName: string | null = null;
  let nearestDist = Infinity;
  for (const city of CITIES) {
    const d = approxDistanceKm(lat, lng, city.lat, city.lng);
    if (d < nearestDist) {
      nearestDist = d;
      nearestName = city.nameFa;
    }
  }
  if (nearestName && nearestDist <= 90) {
    return nearestName;
  }
  if (explicitLabel && fallbackCity && explicitLabel !== fallbackCity.nameFa) {
    return explicitLabel;
  }
  return 'موقعیت GPS شما';
}

export function QiblaCompass(props: QiblaCompassProps) {
  const locationInfo = useMemo(() => {
    const savedCity = getCityById(getGuestCityId());
    const gps = getCustomGpsCoords();
    const lat =
      props.lat ?? props.latitude ?? props.cityLat ?? props.city?.lat ?? gps?.lat ?? savedCity.lat;
    const lng =
      props.lng ?? props.longitude ?? props.cityLng ?? props.city?.lng ?? gps?.lng ?? savedCity.lng;
    const explicitCityLabel =
      props.cityNameFa ?? props.cityName ?? props.city?.nameFa ?? props.city?.name;
    const cityLabel = resolveQiblaLocationLabel(lat, lng, explicitCityLabel, savedCity);
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

  const celestial = useMemo(
    () => calculateCelestialAzimuth(locationInfo.lat, locationInfo.lng, new Date()),
    [locationInfo.lat, locationInfo.lng]
  );

  const distanceKm = useMemo(
    () => calculateDistanceToKaabaKm(locationInfo.lat, locationInfo.lng),
    [locationInfo.lat, locationInfo.lng]
  );

  const [activeTab, setActiveTab] = useState<'compass' | 'map'>('compass');
  const [mapZoom, setMapZoom] = useState<number>(16);
  const [sensorMode, setSensorMode] = useState<'magnetic' | 'gyro_relative' | 'celestial_manual'>('celestial_manual');
  const [hardwareNoMag, setHardwareNoMag] = useState(false);
  const [needsIosPermission, setNeedsIosPermission] = useState(false);
  const [isAligned, setIsAligned] = useState(false);
  const [stability, setStability] = useState<'high' | 'medium' | 'low'>('high');
  const [displayHeading, setDisplayHeading] = useState(0);
  const [manualPreviewDeg, setManualPreviewDeg] = useState(0);
  const [gpsWalkActive, setGpsWalkActive] = useState(false);
  const [gpsWalkHint, setGpsWalkHint] = useState<string>('');
  const [celestialHint, setCelestialHint] = useState<string>('');

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

  useBackHandler(!props.embedded && localOpen, handleCloseQibla);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCloseQibla();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleCloseQibla]);

  // رف‌های موتور GPU ۶۰فریمی (بدون ری‌رندر React حین چرخش)
  const dialSvgRef = useRef<SVGSVGElement | null>(null);
  const cardinalTextRefs = useRef<Array<SVGTextElement | null>>([null, null, null, null]);
  const dialContainerRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{ startAngle: number; startHeading: number } | null>(null);

  const nativeStreamActiveRef = useRef(false);
  const hasAbsoluteRef = useRef(false);
  const sensorModeRef = useRef<'magnetic' | 'gyro_relative' | 'celestial_manual'>('celestial_manual');
  const latestRawGyroRef = useRef<number>(0);
  const gyroOffsetRef = useRef<number>(0);
  const manualPreviewRef = useRef<number>(0);

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

  useEffect(() => {
    sensorModeRef.current = sensorMode;
  }, [sensorMode]);

  useEffect(() => {
    manualPreviewRef.current = manualPreviewDeg;
  }, [manualPreviewDeg]);

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
    }, 550);
  }, []);

  const openCalibrationPopup = useCallback(() => {
    calibMotionAccRef.current = 0;
    lastOrientationRef.current = null;
    setCalibProgress(0);
    setCalibDone(false);
    setShowCalibModal(true);
  }, []);

  const alignToReferenceHeading = useCallback(
    (refDeg: number, message: string) => {
      const cleanRef = normalize360(refDeg);
      if (sensorModeRef.current === 'gyro_relative') {
        gyroOffsetRef.current = normalize360(cleanRef - latestRawGyroRef.current);
        const rad = toRad(cleanRef);
        vecXRef.current = Math.sin(rad);
        vecYRef.current = Math.cos(rad);
        targetHeadingRef.current = cleanRef;
        vecInitRef.current = true;
      } else {
        setManualPreviewDeg(Math.round(cleanRef));
        manualPreviewRef.current = cleanRef;
      }
      setCelestialHint(message);
      props.onToast?.(message);
    },
    [props]
  );

  const feedCompassSample = useCallback(
    (
      rawHeading: number,
      curPitch: number,
      curRoll: number,
      nativeAccuracy?: number,
      isRelativeGyro = false
    ) => {
      if (!Number.isFinite(rawHeading)) return;

      let effectiveHeading: number;
      if (isRelativeGyro) {
        latestRawGyroRef.current = normalize360(rawHeading);
        effectiveHeading = normalize360(latestRawGyroRef.current + gyroOffsetRef.current);
        if (sensorModeRef.current !== 'gyro_relative') {
          sensorModeRef.current = 'gyro_relative';
          setSensorMode('gyro_relative');
          setHardwareNoMag(true);
          setShowCalibModal(false);
        }
      } else {
        effectiveHeading = normalize360(rawHeading);
        if (sensorModeRef.current !== 'magnetic') {
          sensorModeRef.current = 'magnetic';
          setSensorMode('magnetic');
          setHardwareNoMag(false);
        }
      }

      if (!isRelativeGyro && showCalibRef.current && !calibDoneRef.current) {
        const prev = lastOrientationRef.current;
        if (prev) {
          const dA = Math.abs(shortestDelta(prev.a, effectiveHeading));
          const dB = Math.abs(curPitch - prev.b);
          const dG = Math.abs(curRoll - prev.g);
          const stepMotion = Math.min(32, dA * 0.65 + dB * 1.15 + dG * 1.15);
          if (stepMotion > 0.7) {
            calibMotionAccRef.current += stepMotion;
            const threshold = nativeAccuracy === 3 ? 260 : 340;
            const pct = Math.min(100, Math.round((calibMotionAccRef.current / threshold) * 100));
            setCalibProgress(pct);
            if (pct >= 100) {
              finishCalibration();
            }
          }
        }
        lastOrientationRef.current = { a: effectiveHeading, b: curPitch, g: curRoll };
      }

      const rad = toRad(effectiveHeading);
      const nx = Math.sin(rad);
      const ny = Math.cos(rad);

      if (!vecInitRef.current) {
        vecXRef.current = nx;
        vecYRef.current = ny;
        targetHeadingRef.current = effectiveHeading;
        smoothContinuousRef.current = -effectiveHeading;
        vecInitRef.current = true;
        return;
      }

      const prevFiltered = targetHeadingRef.current;
      const diff = Math.abs(shortestDelta(prevFiltered, effectiveHeading));

      if (!isRelativeGyro) {
        if (typeof nativeAccuracy === 'number' && nativeAccuracy >= 0) {
          if (nativeAccuracy <= 1) setStability('low');
          else if (nativeAccuracy === 2) setStability('medium');
          else setStability('high');
        } else {
          recentDeltasRef.current.push(diff);
          if (recentDeltasRef.current.length > 20) recentDeltasRef.current.shift();
          const avgJitter =
            recentDeltasRef.current.reduce((acc, v) => acc + v, 0) / recentDeltasRef.current.length;
          if (avgJitter > 10) setStability('low');
          else if (avgJitter > 4.5) setStability('medium');
          else setStability('high');
        }
      }

      if (diff < 0.35) return;

      const alphaFactor =
        diff < 2.0 ? 0.14 : diff < 8 ? 0.24 : diff < 22 ? 0.36 : 0.48;

      vecXRef.current = vecXRef.current * (1 - alphaFactor) + nx * alphaFactor;
      vecYRef.current = vecYRef.current * (1 - alphaFactor) + ny * alphaFactor;

      targetHeadingRef.current = normalize360(toDeg(Math.atan2(vecXRef.current, vecYRef.current)));
    },
    [finishCalibration]
  );

  const handleOrientationEvent = useCallback(
    (ev: DeviceOrientationWithWebkit, isAbsoluteStream: boolean) => {
      if (nativeStreamActiveRef.current) return;
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
        // در اندروید بدون رویداد absolute (وقتی مغناطیس‌سنج نیست)، جهت نسبی است نه مغناطیسی
        rawHeading = computeTiltCompensatedHeading(ev.alpha, ev.beta, ev.gamma);
      }

      if (rawHeading === null) return;
      const isRelative = !isAbsoluteStream && typeof ev.webkitCompassHeading !== 'number';
      feedCompassSample(rawHeading, ev.beta ?? 0, ev.gamma ?? 0, undefined, isRelative);
    },
    [feedCompassSample]
  );

  // موتور سخت‌افزاری نیتیو اندروید (۷لایه ۵۰ هرتز + Pull Snapshot)
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return;
    let disposed = false;
    let listenerHandle: PluginListenerHandle | null = null;
    let pollTimer: number | null = null;
    let pushReceived = false;

    const bootNativeCompass = async () => {
      try {
        listenerHandle = await NoorCompass.addListener('compassHeading', (data) => {
          if (disposed) return;
          pushReceived = true;
          nativeStreamActiveRef.current = true;
          feedCompassSample(
            data.heading,
            data.pitch ?? 0,
            data.roll ?? 0,
            data.accuracy,
            Boolean(data.isRelativeGyro)
          );
        });

        const res = await NoorCompass.startCompass({
          lat: locationInfo.lat,
          lng: locationInfo.lng,
        });
        if (disposed) return;

        if (!res || !res.available || res.mode === 'no_magnetometer') {
          setHardwareNoMag(true);
          setSensorMode('celestial_manual');
          setShowCalibModal(false);
          return;
        }

        if (res.isRelativeGyro) {
          setHardwareNoMag(true);
          setSensorMode('gyro_relative');
          setShowCalibModal(false);
        }

        pollTimer = window.setInterval(() => {
          if (disposed || pushReceived) return;
          void NoorCompass.getCompassSnapshot()
            .then((snap) => {
              if (disposed || pushReceived || !snap) return;
              if (snap.hasSample) {
                nativeStreamActiveRef.current = true;
                feedCompassSample(
                  snap.heading,
                  snap.pitch ?? 0,
                  snap.roll ?? 0,
                  snap.accuracy,
                  Boolean(snap.isRelativeGyro)
                );
              } else if (!snap.hasMag && !snap.hasUncalMag && !snap.hasGeoRot && !snap.hasRotVec && !snap.hasGyro && !snap.hasGameRot) {
                setHardwareNoMag(true);
                setSensorMode('celestial_manual');
                setShowCalibModal(false);
              }
            })
            .catch(() => {});
        }, 65);
      } catch {
        // پشتیبان مرورگر فعال می‌ماند
      }
    };

    void bootNativeCompass();

    return () => {
      disposed = true;
      nativeStreamActiveRef.current = false;
      if (pollTimer !== null) window.clearInterval(pollTimer);
      if (listenerHandle) void listenerHandle.remove();
      void NoorCompass.stopCompass().catch(() => {});
    };
  }, [locationInfo.lat, locationInfo.lng, feedCompassSample]);

  // پشتیبان وب و iOS — دکمه مجوز iOS هرگز روی اندروید نمایش داده نمی‌شود!
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isAndroidNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
    const isIosUa = /iPad|iPhone|iPod/.test(navigator.userAgent || '');

    const DOE = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };
    if (!isAndroidNative && isIosUa && DOE && typeof DOE.requestPermission === 'function') {
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

  // قطب‌نمای حرکتی GPS برای فضای باز (روی گوشی‌های بدون مغناطیس‌سنج)
  useEffect(() => {
    if (!gpsWalkActive || typeof navigator === 'undefined' || !navigator.geolocation) return;
    let lastPos: { lat: number; lng: number } | null = null;
    setGpsWalkHint('در فضای باز ۵ قدم مستقیم راه بروید تا شمال واقعی قفل شود...');

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, heading, speed } = pos.coords;
        if (typeof heading === 'number' && Number.isFinite(heading) && (speed ?? 0) >= 0.6) {
          alignToReferenceHeading(heading, 'شمال واقعی از طریق حرکت GPS قفل شد.');
          setGpsWalkHint('جهت حرکت GPS قفل شد (' + toFaDigits(Math.round(heading)) + '°)');
          return;
        }
        if (lastPos) {
          const movedMeters = approxDistanceKm(lastPos.lat, lastPos.lng, latitude, longitude) * 1000;
          if (movedMeters >= 4) {
            const bearing = computeBearingDeg(lastPos.lat, lastPos.lng, latitude, longitude);
            alignToReferenceHeading(bearing, 'شمال واقعی از مسیر حرکت GPS قفل شد.');
            setGpsWalkHint('شمال واقعی از حرکت شما قفل شد (' + toFaDigits(Math.round(bearing)) + '°)');
            lastPos = { lat: latitude, lng: longitude };
          }
        } else {
          lastPos = { lat: latitude, lng: longitude };
        }
      },
      () => {
        setGpsWalkHint('GPS در فضای باز فعال نشد؛ از خورشید/ماه یا نقشه قبله استفاده کنید.');
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 12000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [gpsWalkActive, alignToReferenceHeading]);

  // حلقه GPU ۶۰fps بدون Re-render اضافی (مثل ساعت ژاپنی بدون کوچک‌ترین لگ)
  useEffect(() => {
    let rafId = 0;
    let lastTextCommitMs = 0;
    let lastRoundedHeading = -1;
    const cardinalAngles = [0, 90, 180, 270];

    const tick = (now: number) => {
      const mode = sensorModeRef.current;
      const activeTargetHeading =
        mode === 'magnetic' || mode === 'gyro_relative'
          ? targetHeadingRef.current
          : manualPreviewRef.current;

      const desiredDialRotation = -activeTargetHeading;
      const cur = smoothContinuousRef.current;
      const delta = shortestDelta(normalize360(cur), normalize360(desiredDialRotation));

      if (Math.abs(delta) > 0.03) {
        smoothContinuousRef.current = cur + delta * 0.22;
      }

      const dialDeg = smoothContinuousRef.current;

      // به‌روزرسانی مستقیم GPU Transform روی SVG بدون ری‌رندر React
      if (dialSvgRef.current) {
        dialSvgRef.current.style.transform = `rotate3d(0, 0, 1, ${dialDeg.toFixed(2)}deg)`;
      }
      for (let i = 0; i < 4; i++) {
        const txtEl = cardinalTextRefs.current[i];
        if (txtEl) {
          txtEl.setAttribute('transform', `rotate(${(-(cardinalAngles[i] + dialDeg)).toFixed(1)} 130 42)`);
        }
      }

      // به‌روزرسانی متن عدد زاویه فقط وقتی عدد تغییر کند (حداکثر هر 90ms)
      if (now - lastTextCommitMs >= 90) {
        const visualHeading = normalize360(-dialDeg);
        const rounded = Math.round(visualHeading) % 360;
        if (rounded !== lastRoundedHeading) {
          lastRoundedHeading = rounded;
          lastTextCommitMs = now;
          setDisplayHeading(rounded);
        }

        const errAbs = Math.abs(shortestDelta(visualHeading, qiblaAngle));
        const nextAligned = lastAlignedRef.current ? errAbs <= 7.5 : errAbs <= 5.0;
        if (nextAligned !== lastAlignedRef.current) {
          lastAlignedRef.current = nextAligned;
          setIsAligned(nextAligned);
          if (
            nextAligned &&
            mode !== 'celestial_manual' &&
            !showCalibRef.current &&
            typeof navigator !== 'undefined' &&
            typeof navigator.vibrate === 'function'
          ) {
            try {
              navigator.vibrate([30, 30, 65]);
            } catch {}
          }
        }
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [qiblaAngle]);

  // چرخش لمسی مستقیم روی خود دایره قطب‌نما در حالت بدون مغناطیس‌سنج
  const getPointerAngleFromCenter = (clientX: number, clientY: number): number | null => {
    const el = dialContainerRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return toDeg(Math.atan2(clientY - cy, clientX - cx));
  };

  const handleDialPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (sensorMode === 'magnetic') return;
    const ang = getPointerAngleFromCenter(e.clientX, e.clientY);
    if (ang === null) return;
    dragStartRef.current = {
      startAngle: ang,
      startHeading: sensorMode === 'gyro_relative' ? targetHeadingRef.current : manualPreviewRef.current,
    };
  };

  const handleDialPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current || sensorMode === 'magnetic') return;
    const ang = getPointerAngleFromCenter(e.clientX, e.clientY);
    if (ang === null) return;
    const deltaAng = ang - dragStartRef.current.startAngle;
    const nextHeading = normalize360(dragStartRef.current.startHeading - deltaAng);
    if (sensorMode === 'gyro_relative') {
      gyroOffsetRef.current = normalize360(nextHeading - latestRawGyroRef.current);
      targetHeadingRef.current = nextHeading;
    } else {
      manualPreviewRef.current = nextHeading;
      setManualPreviewDeg(Math.round(nextHeading));
    }
  };

  const handleDialPointerUp = () => {
    dragStartRef.current = null;
  };

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

  const dialTicks = useMemo(() => {
    const items: { angle: number; major: boolean; cardinal?: string; cardinalIndex?: number }[] = [];
    for (let deg = 0; deg < 360; deg += 5) {
      let cardinal: string | undefined;
      let cardinalIndex: number | undefined;
      if (deg === 0) { cardinal = 'ش'; cardinalIndex = 0; }
      else if (deg === 90) { cardinal = 'ق'; cardinalIndex = 1; }
      else if (deg === 180) { cardinal = 'ج'; cardinalIndex = 2; }
      else if (deg === 270) { cardinal = 'غ'; cardinalIndex = 3; }
      items.push({ angle: deg, major: deg % 30 === 0, cardinal, cardinalIndex });
    }
    return items;
  }, []);

  // کاشی‌های نقشه داخلی (۳×۳ OpenStreetMap — باز بدون فیلترشکن در ایران)
  const mapGrid = useMemo(() => {
    const t = latLngToTileXY(locationInfo.lat, locationInfo.lng, mapZoom);
    const maxTile = 2 ** mapZoom;
    const tiles: Array<{ dx: number; dy: number; url: string; key: string }> = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const tx = ((t.x + dx) % maxTile + maxTile) % maxTile;
        const ty = Math.max(0, Math.min(maxTile - 1, t.y + dy));
        tiles.push({
          dx,
          dy,
          key: `${mapZoom}_${tx}_${ty}`,
          url: `https://tile.openstreetmap.org/${mapZoom}/${tx}/${ty}.png`,
        });
      }
    }
    return {
      tiles,
      offsetX: (0.5 - t.fracX) * 256,
      offsetY: (0.5 - t.fracY) * 256,
    };
  }, [locationInfo.lat, locationInfo.lng, mapZoom]);

  const calibStrokeDash = 2 * Math.PI * 52;
  const calibStrokeOffset = calibStrokeDash * (1 - calibProgress / 100);

  if (!props.embedded && !localOpen) {
    return null;
  }

  const cardBody = (
    <div
      className="w-full max-w-md rounded-[30px] p-4 border shadow-2xl space-y-3 relative overflow-hidden select-none max-h-[93vh] overflow-y-auto"
      style={{
        background: isAligned && activeTab === 'compass'
          ? 'linear-gradient(170deg, rgba(6, 56, 42, 0.99) 0%, rgba(4, 24, 19, 1) 100%)'
          : 'linear-gradient(170deg, rgba(8, 28, 34, 0.99) 0%, rgba(4, 15, 20, 1) 100%)',
        borderColor: isAligned && activeTab === 'compass' ? 'rgba(52, 211, 153, 0.65)' : 'rgba(251, 191, 36, 0.32)',
        transition: 'background 350ms ease, border-color 350ms ease',
      }}
      dir="rtl"
      onClick={(e) => e.stopPropagation()}
    >
      {/* هدر */}
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
            <div className="flex items-center gap-1 text-[11px] text-emerald-100/75 mt-0.5 truncate">
              <MapPin size={11} className="text-amber-300 shrink-0" />
              <span className="truncate">{locationInfo.cityLabel}</span>
              <span>·</span>
              <span>{toFaDigits(Math.round(qiblaAngle))}° {cardinalLabelFa(qiblaAngle)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!showCalibModal && sensorMode === 'magnetic' && (
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

      {/* دو تب جهانی: قطب‌نما (سنسور + خورشید/ماه) و نقشه قبله داخلی */}
      {!showCalibModal && (
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl border border-white/10 bg-white/[0.04]">
          <button
            type="button"
            onClick={() => setActiveTab('compass')}
            className="py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all"
            style={{
              background: activeTab === 'compass' ? 'linear-gradient(135deg, #FBBF24 0%, #D97706 100%)' : 'transparent',
              color: activeTab === 'compass' ? '#041511' : '#E2E8F0',
            }}
          >
            <Compass size={14} />
            <span>قطب‌نما و {celestial.labelFa}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('map')}
            className="py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all"
            style={{
              background: activeTab === 'map' ? 'linear-gradient(135deg, #34D399 0%, #10B981 100%)' : 'transparent',
              color: activeTab === 'map' ? '#041511' : '#E2E8F0',
            }}
          >
            <MapIcon size={14} />
            <span>نقشه قبله (همه گوشی‌ها)</span>
          </button>
        </div>
      )}

      {/* مرحله کالیبره ∞ (فقط برای گوشی‌های دارای مغناطیس‌سنج) */}
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
      ) : activeTab === 'map' ? (
        /* تب ۲: نقشه قبله داخلی (۱۰۰٪ دقیق برای همه گوشی‌ها — حتی بدون مغناطیس‌سنج و داخل خانه) */
        <div className="space-y-3 animate-fade-in">
          <div className="rounded-2xl px-3 py-2 border border-emerald-400/30 bg-emerald-500/10 text-[11px] text-emerald-100 leading-relaxed text-right">
            گوشی را هم‌جهت خیابان یا ساختمان روی نقشه قرار دهید؛ <strong className="text-amber-300">خط طلایی</strong> دقیقاً جهت کعبه ({toFaDigits(Math.round(qiblaAngle))}° {cardinalLabelFa(qiblaAngle)}) است.
          </div>

          <div
            className="relative w-full h-64 rounded-2xl overflow-hidden border border-amber-400/35 shadow-inner"
            style={{
              background: 'radial-gradient(circle at 50% 50%, #0D2D26 0%, #051613 100%)',
            }}
          >
            {/* لایه کاشی‌های OpenStreetMap (۳×۳ حول موقعیت کاربر) */}
            <div
              className="absolute left-1/2 top-1/2 pointer-events-none"
              style={{
                width: 768,
                height: 768,
                transform: `translate(${-384 + mapGrid.offsetX}px, ${-384 + mapGrid.offsetY}px)`,
              }}
            >
              {mapGrid.tiles.map((tile) => (
                <img
                  key={tile.key}
                  src={tile.url}
                  alt=""
                  loading="lazy"
                  className="absolute w-64 h-64 object-cover"
                  style={{
                    left: (tile.dx + 1) * 256,
                    top: (tile.dy + 1) * 256,
                    filter: 'brightness(0.84) contrast(1.06)',
                  }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.opacity = '0';
                  }}
                />
              ))}
            </div>

            {/* گرید جهت‌یاب پشتیبان + خط مستقیم طلایی قبله */}
            <svg viewBox="0 0 320 260" className="absolute inset-0 w-full h-full pointer-events-none">
              <circle cx="160" cy="130" r="95" fill="none" stroke="rgba(251,191,36,0.28)" strokeWidth="1.2" strokeDasharray="4 4" />
              <text x="160" y="18" textAnchor="middle" fill="#FCA5A5" fontSize="12" fontWeight="900">شمال (ش)</text>
              <text x="160" y="250" textAnchor="middle" fill="#D1FAE5" fontSize="11" fontWeight="800">جنوب (ج)</text>
              <text x="302" y="134" textAnchor="middle" fill="#D1FAE5" fontSize="11" fontWeight="800">ق</text>
              <text x="18" y="134" textAnchor="middle" fill="#D1FAE5" fontSize="11" fontWeight="800">غ</text>

              <g transform={`rotate(${qiblaAngle.toFixed(2)} 160 130)`}>
                <line
                  x1="160"
                  y1="130"
                  x2="160"
                  y2="16"
                  stroke="#FBBF24"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="7 5"
                />
                <polygon points="160,6 151,24 169,24" fill="#FBBF24" />
                <circle cx="160" cy="34" r="11" fill="#0B0F14" stroke="#FBBF24" strokeWidth="2" />
                <rect x="155" y="29" width="10" height="10" rx="1.5" fill="#111827" stroke="#FDE68A" strokeWidth="1" />
                <line x1="155" y1="32.5" x2="165" y2="32.5" stroke="#FBBF24" strokeWidth="1.8" />
              </g>

              <circle cx="160" cy="130" r="8" fill="#10B981" stroke="#FFFFFF" strokeWidth="2.5" />
            </svg>

            {/* دکمه‌های زوم نقشه */}
            <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
              <button
                type="button"
                onClick={() => setMapZoom((z) => Math.min(18, z + 1))}
                className="w-8 h-8 rounded-xl bg-[#041511]/90 border border-white/25 text-white flex items-center justify-center shadow"
                aria-label="بزرگ‌نمایی نقشه"
              >
                <Plus size={15} />
              </button>
              <button
                type="button"
                onClick={() => setMapZoom((z) => Math.max(12, z - 1))}
                className="w-8 h-8 rounded-xl bg-[#041511]/90 border border-white/25 text-white flex items-center justify-center shadow"
                aria-label="کوچک‌نمایی نقشه"
              >
                <Minus size={15} />
              </button>
            </div>

            <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-full bg-[#041511]/90 border border-amber-400/35 text-[10px] font-black text-amber-200">
              {locationInfo.cityLabel} · {toFaDigits(Math.round(qiblaAngle))}° {cardinalLabelFa(qiblaAngle)}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('compass')}
            className="w-full py-2.5 rounded-2xl text-xs font-black border border-amber-400/40 bg-amber-400/15 text-amber-200"
          >
            بازگشت به نمای قطب‌نما و {celestial.labelFa}
          </button>
        </div>
      ) : (
        /* تب ۱: قطب‌نمای ۶۰fps + نشانگر زنده خورشید/ماه روی دایره + ژیروسکوپ زنده / GPS */
        <div className="space-y-3 animate-fade-in">
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
              فعال‌سازی سنسور قطب‌نمای iOS
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
              ref={dialContainerRef}
              onPointerDown={handleDialPointerDown}
              onPointerMove={handleDialPointerMove}
              onPointerUp={handleDialPointerUp}
              onPointerCancel={handleDialPointerUp}
              className="relative w-64 h-64 rounded-full p-2 shadow-2xl border-2 touch-none"
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
                ref={dialSvgRef}
                viewBox="0 0 260 260"
                className="w-full h-full will-change-transform"
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
                    {t.cardinal && typeof t.cardinalIndex === 'number' && (
                      <text
                        ref={(el) => { cardinalTextRefs.current[t.cardinalIndex!] = el; }}
                        x="130"
                        y="42"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={t.angle === 0 ? '#FCA5A5' : '#D1FAE5'}
                        fontSize="13"
                        fontWeight="900"
                      >
                        {t.cardinal}
                      </text>
                    )}
                  </g>
                ))}

                {/* نشانگر زنده خورشید (روز) یا ماه (شب) روی رینگ قطب‌نما */}
                <g transform={`rotate(${celestial.azimuthDeg} 130 130)`}>
                  <line x1="130" y1="62" x2="130" y2="122" stroke={celestial.body === 'sun' ? 'rgba(251,191,36,0.38)' : 'rgba(147,197,253,0.4)'} strokeWidth="1.5" strokeDasharray="3 3" />
                  <circle
                    cx="130"
                    cy="58"
                    r="11"
                    fill={celestial.body === 'sun' ? '#F59E0B' : '#1E3A8A'}
                    stroke={celestial.body === 'sun' ? '#FEF08A' : '#93C5FD'}
                    strokeWidth="2"
                  />
                  <text
                    x="130"
                    y="58.5"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={celestial.body === 'sun' ? '#041511' : '#E0F2FE'}
                    fontSize="9"
                    fontWeight="900"
                  >
                    {celestial.body === 'sun' ? 'خ' : 'م'}
                  </text>
                </g>

                {/* عقربه طلایی قبله و کعبه */}
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

              <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#041511]/95 border border-amber-400/35 text-[10px] font-black text-emerald-100 shadow-lg whitespace-nowrap">
                جهت فعلی: {toFaDigits(displayHeading)}°
              </div>
            </div>
          </div>

          {/* پنل هوشمند برای گوشی‌های بدون مغناطیس‌سنج (خورشید/ماه + ژیروسکوپ زنده + GPS حرکتی + نقشه) */}
          {sensorMode !== 'magnetic' && (
            <div className="rounded-2xl p-3 border border-amber-400/25 bg-white/[0.04] space-y-2.5">
              <div className="text-[11px] text-amber-200 font-bold leading-relaxed text-right">
                {sensorMode === 'gyro_relative'
                  ? 'حالت ژیروسکوپ زنده فعال است: بالای گوشی را به سمت ' + celestial.labelFa + ' بگیرید و دکمه هم‌ترازی را بزنید تا با چرخش دست، قبله دقیق نشان داده شود.'
                  : hardwareNoMag
                  ? 'این گوشی تراشه مغناطیس‌سنج ندارد — از هم‌ترازی دقیق ' + celestial.labelFa + '، GPS حرکتی یا نقشه قبله استفاده کنید:'
                  : 'با کشیدن انگشت روی قطب‌نما یا هم‌ترازی ' + celestial.labelFa + ' جهت قبله را دقیق ببینید:'}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    alignToReferenceHeading(
                      celestial.azimuthDeg,
                      'بالای گوشی را به سمت ' + celestial.labelFa + ' واقعی بگیرید؛ عقربه طلایی دقیقاً قبله است.'
                    )
                  }
                  className="py-2.5 px-2 rounded-xl text-[11px] font-black border flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                  style={{
                    background: 'rgba(251, 191, 36, 0.18)',
                    borderColor: 'rgba(251, 191, 36, 0.55)',
                    color: '#FEF08A',
                  }}
                >
                  {celestial.body === 'sun' ? <Sun size={14} /> : <Moon size={14} />}
                  <span>هم‌ترازی با {celestial.labelFa} ({toFaDigits(celestial.azimuthDeg)}°)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('map')}
                  className="py-2.5 px-2 rounded-xl text-[11px] font-black border flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                  style={{
                    background: 'rgba(16, 185, 129, 0.18)',
                    borderColor: 'rgba(52, 211, 153, 0.5)',
                    color: '#A7F3D0',
                  }}
                >
                  <MapIcon size={14} />
                  <span>نقشه قبله (داخل خانه)</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setGpsWalkActive((v) => !v)}
                className="w-full py-2 px-3 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1.5 transition-all"
                style={{
                  background: gpsWalkActive ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  borderColor: gpsWalkActive ? '#38BDF8' : 'rgba(255, 255, 255, 0.14)',
                  color: gpsWalkActive ? '#BAE6FD' : '#CBD5E1',
                }}
              >
                <Navigation size={13} />
                <span>{gpsWalkActive ? 'توقف قبله‌یاب حرکتی GPS' : 'قبله‌یاب حرکتی GPS (فضای باز)'}</span>
              </button>

              {(gpsWalkHint || celestialHint) && (
                <p className="text-[10.5px] text-emerald-200/90 text-center leading-relaxed">
                  {gpsWalkActive && gpsWalkHint ? gpsWalkHint : celestialHint}
                </p>
              )}

              {sensorMode === 'celestial_manual' && (
                <input
                  type="range"
                  min={0}
                  max={359}
                  value={manualPreviewDeg}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    manualPreviewRef.current = v;
                    setManualPreviewDeg(v);
                  }}
                  aria-label="تنظیم زاویه قطب‌نما"
                  className="w-full accent-amber-400 cursor-pointer"
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* نوار اطلاعاتی پایین */}
      {!showCalibModal && (
        <>
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
              <div className="text-[10px] text-emerald-100/60">حالت قبله‌یاب</div>
              <div
                className="text-xs font-black mt-0.5 flex items-center justify-center gap-1"
                style={{
                  color:
                    sensorMode === 'magnetic'
                      ? stability === 'high' ? '#34D399' : stability === 'medium' ? '#FBBF24' : '#FB7185'
                      : sensorMode === 'gyro_relative'
                      ? '#38BDF8'
                      : '#FBBF24',
                }}
              >
                {sensorMode === 'magnetic' && stability === 'low' ? <AlertTriangle size={12} /> : <ShieldCheck size={12} />}
                <span>
                  {sensorMode === 'magnetic'
                    ? stability === 'high' ? 'مغناطیسی دقیق' : stability === 'medium' ? 'متوسط' : 'نیاز به کالیبره'
                    : sensorMode === 'gyro_relative'
                    ? 'ژیروسکوپ زنده'
                    : 'نجومی و نقشه'}
                </span>
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
        </>
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
