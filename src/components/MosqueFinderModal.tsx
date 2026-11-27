import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Navigation,
  Footprints,
  Car,
  Bus,
  Compass,
  X,
  LocateFixed,
  Check,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Route,
  Search,
  Map as MapIcon,
  Plus,
  Minus,
  Layers,
  RefreshCw,
  PlusCircle,
  Info,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useTheme } from '@/hooks/useTheme';
import { NoorAlarm } from '@/lib/reminderService';
import {
  searchNearbyMosques,
  readCachedMosqueSearch,
  fetchNeshanExactRoute,
  geocodeSearchQuery,
  saveLocationMetrics,
  clearReverseGeocodeCache,
  clearMosqueDiscoveryCache,
  saveUserSuggestedMosque,
  type NearbyMosque,
  type MosqueSearchDiagnostics,
} from '@/lib/neshanMosqueService';
import { saveCustomGpsCoords } from '@/lib/cities';
import { loadMosqueAndTravel, saveMosqueAndTravel } from '@/lib/deenIntelligenceStore';
import { toFaDigits } from '@/lib/jalali';
import { useBackHandler } from '@/lib/backNavigation';

interface Props {
  cityName: string;
  defaultLat: number;
  defaultLng: number;
  onClose: () => void;
  onMosqueSelected?: () => void;
}

const RADIUS_OPTIONS = [
  { meters: 500, label: '۵۰۰ متر' },
  { meters: 1000, label: '۱ کیلومتر' },
  { meters: 2000, label: '۲ کیلومتر' },
  { meters: 5000, label: '۵ کیلومتر' },
] as const;

type CategoryFilter = 'all' | 'mosque' | 'prayer_room' | 'hosseiniyeh' | 'shrine';

function latLngToTileXY(lat: number, lng: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const x = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { x, y };
}

function tileXYToLatLng(x: number, y: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const lng = (x / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
  const lat = (latRad * 180) / Math.PI;
  return { lat, lng };
}

function providerLabelFa(p: string): string {
  if (p === 'neshan') return 'نشان';
  if (p === 'osm') return 'OSM';
  if (p === 'google') return 'گوگل';
  if (p === 'user') return 'ثبت شما';
  return 'مرجع نور';
}

export function MosqueFinderModal({ cityName, defaultLat, defaultLng, onClose, onMosqueSelected }: Props) {
  const { theme } = useTheme();
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: defaultLat, lng: defaultLng });
  const [searchRadius, setSearchRadius] = useState<number>(1000);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [mapLayer, setMapLayer] = useState<'street' | 'satellite'>('street');
  const [mapZoom, setMapZoom] = useState<number>(16);
  const [gpsStatus, setGpsStatus] = useState<'searching' | 'locked' | 'fallback'>('searching');
  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(null);
  const [providerLabel, setProviderLabel] = useState<string>('موقعیت‌یاب دقیق');
  const [loading, setLoading] = useState<boolean>(true);
  const [mosques, setMosques] = useState<NearbyMosque[]>([]);
  const [diagnostics, setDiagnostics] = useState<MosqueSearchDiagnostics | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);
  const [userAddress, setUserAddress] = useState<string>('در حال مکان‌یابی دقیق...');
  const [travelMode, setTravelMode] = useState<'walk' | 'car' | 'transit'>('walk');
  const [selectedMosque, setSelectedMosque] = useState<NearbyMosque | null>(null);
  const [routeDetail, setRouteDetail] = useState<{ durationText: string; distanceText: string; summary: string } | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Array<{ title: string; address: string; lat: number; lng: number }>>([]);
  const [searchingPlace, setSearchingPlace] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);

  const [showSuggestForm, setShowSuggestForm] = useState<boolean>(false);
  const [suggestName, setSuggestName] = useState<string>('');
  const [suggestCategory, setSuggestCategory] = useState<NearbyMosque['category']>('مسجد محله');

  const mapBoxRef = useRef<HTMLDivElement | null>(null);
  const requestIdRef = useRef<number>(0);
  const watchIdRef = useRef<number | null>(null);
  const coordsRef = useRef(coords);
  const radiusRef = useRef(searchRadius);

  useEffect(() => {
    coordsRef.current = coords;
  }, [coords]);

  useEffect(() => {
    radiusRef.current = searchRadius;
  }, [searchRadius]);

  useBackHandler(true, onClose);

  const showNotice = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3400);
  }, []);

  const runDiscovery = useCallback(
    async (
      lat: number,
      lng: number,
      radiusMeters: number,
      acc: number | null,
      srcLabel: string,
      nativeAddrHint?: string,
      forceRefresh = false
    ) => {
      const reqId = ++requestIdRef.current;
      setCoords({ lat, lng });
      setAccuracyMeters(acc !== null ? Math.round(acc) : null);
      setProviderLabel(srcLabel);
      setGpsStatus('locked');
      saveCustomGpsCoords(lat, lng);

      // نمایش فوری از کش ۵۰ متری (و ادامه آپدیت تازه در پس‌زمینه)
      if (!forceRefresh) {
        const cached = readCachedMosqueSearch(lat, lng, radiusMeters);
        if (cached && reqId === requestIdRef.current) {
          setMosques(cached.mosques);
          setDiagnostics({ ...cached.diagnostics, usedCache: true });
          if (cached.userAddress) setUserAddress(cached.userAddress);
          if (cached.mosques.length > 0) setSelectedMosque(cached.mosques[0]);
        }
      }

      setLoading(true);
      const res = await searchNearbyMosques(lat, lng, nativeAddrHint, { radiusMeters, forceRefresh });
      if (reqId !== requestIdRef.current) return;

      setMosques(res.mosques);
      setDiagnostics(res.diagnostics);
      if (res.userAddress) {
        setUserAddress(res.userAddress);
        saveCustomGpsCoords(lat, lng, res.userAddress);
      }
      setSelectedMosque((prev) => {
        if (prev && res.mosques.some((m) => m.id === prev.id)) return prev;
        return res.mosques[0] ?? null;
      });
      setLoading(false);

      saveLocationMetrics({
        gpsAcquisitionMs: 220,
        apiResponseMs: res.apiResponseMs,
        usedAddressCache: false,
        accuracyMeters: acc !== null ? Math.round(acc) : null,
        timestampIso: new Date().toISOString(),
      });
    },
    []
  );

  // اجرای هم‌زمان GPS نیتیو و استریم watchPosition با ضدتداخل
  const detectLiveGps = useCallback(
    async (forceRefresh = false) => {
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (forceRefresh) {
        clearReverseGeocodeCache();
        clearMosqueDiscoveryCache();
      }

      setGpsStatus('searching');
      setUserAddress('در حال یافتن موقعیت دقیق کوچه و خیابان شما...');
      setLoading(true);

      let bestAccuracy = Infinity;
      let lockedAny = false;
      const gpsSessionReqBase = requestIdRef.current;

      const onCandidateFix = async (lat: number, lng: number, realAcc: number, src: string, nativeAddr?: string) => {
        if (lockedAny && realAcc >= bestAccuracy - 8) return;
        bestAccuracy = realAcc;
        lockedAny = true;
        await runDiscovery(lat, lng, radiusRef.current, realAcc, src, nativeAddr, forceRefresh);
      };

      // ۱. شروع موازی موتور رسمی Google Play Services FusedLocationProviderClient در اندروید
      if (Capacitor.getPlatform() === 'android' && typeof NoorAlarm.requestAndGetLocation === 'function') {
        void NoorAlarm.requestAndGetLocation()
          .then((res) => {
            if (res.hasCoords && typeof res.lat === 'number' && typeof res.lng === 'number') {
              const nativeAcc = typeof res.accuracy === 'number' ? res.accuracy : 14;
              void onCandidateFix(res.lat, res.lng, nativeAcc, 'GPS دقیق خودکار', res.nativeAddress);
            }
          })
          .catch(() => {});
      }

      // ۲. شروع هم‌زمان استریم زنده High-Accuracy برای بهبود لحظه‌ای دقت تا زیر ۱۰ متر
      if ('geolocation' in navigator) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const acc = pos.coords.accuracy || 18;
            if (acc <= 180 || !lockedAny) {
              void onCandidateFix(pos.coords.latitude, pos.coords.longitude, acc, 'مکان‌یاب زنده');
            }
          },
          () => {},
          { enableHighAccuracy: true, timeout: 9000, maximumAge: forceRefresh ? 0 : 15000 }
        );
        window.setTimeout(() => {
          if (watchIdRef.current !== null && 'geolocation' in navigator) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
          }
        }, 9000);
      }

      window.setTimeout(async () => {
        if (!lockedAny && requestIdRef.current === gpsSessionReqBase) {
          setGpsStatus('fallback');
          await runDiscovery(
            coordsRef.current.lat,
            coordsRef.current.lng,
            radiusRef.current,
            null,
            'موقعیت شهر ' + cityName,
            undefined,
            forceRefresh
          );
          setUserAddress('مکان‌یاب گوشی خاموش است — روی نقشه زیر محله خود را لمس یا جستجو کنید');
        }
      }, 4800);
    },
    [cityName, runDiscovery]
  );

  useEffect(() => {
    void detectLiveGps(false);
    return () => {
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [detectLiveGps]);

  // دریافت مسیر واقعی خیابان از نشان برای مسجد منتخب
  useEffect(() => {
    if (!selectedMosque) return;
    let cancelled = false;
    setRouteDetail(null);
    if (travelMode === 'transit') return;
    void fetchNeshanExactRoute(
      coords.lat,
      coords.lng,
      selectedMosque.lat,
      selectedMosque.lng,
      travelMode === 'walk' ? 'pedestrian' : 'car'
    ).then((info) => {
      if (!cancelled && info) setRouteDetail(info);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedMosque, travelMode, coords.lat, coords.lng]);

  const handleRadiusChange = (nextRadius: number) => {
    setSearchRadius(nextRadius);
    if (nextRadius <= 500) setMapZoom(17);
    else if (nextRadius <= 1000) setMapZoom(16);
    else if (nextRadius <= 2000) setMapZoom(15);
    else setMapZoom(14);
    void runDiscovery(coords.lat, coords.lng, nextRadius, accuracyMeters, providerLabel, userAddress, false);
  };

  const filteredMosques = useMemo(() => {
    return mosques.filter((m) => {
      if (categoryFilter === 'all') return true;
      if (categoryFilter === 'mosque') return m.category === 'مسجد محله' || m.category === 'مسجد جامع';
      if (categoryFilter === 'prayer_room') return m.category === 'نمازخانه';
      if (categoryFilter === 'hosseiniyeh') return m.category === 'حسینیه و مصلی';
      if (categoryFilter === 'shrine') return m.category === 'حرم و زیارتگاه';
      return true;
    });
  }, [mosques, categoryFilter]);

  useEffect(() => {
    if (filteredMosques.length === 0) {
      setSelectedMosque(null);
    } else if (!selectedMosque || !filteredMosques.some((m) => m.id === selectedMosque.id)) {
      setSelectedMosque(filteredMosques[0]);
    }
  }, [filteredMosques, selectedMosque]);

  const categoryCounts = useMemo(() => {
    let mosque = 0, prayer_room = 0, hosseiniyeh = 0, shrine = 0;
    for (const m of mosques) {
      if (m.category === 'مسجد محله' || m.category === 'مسجد جامع') mosque++;
      else if (m.category === 'نمازخانه') prayer_room++;
      else if (m.category === 'حسینیه و مصلی') hosseiniyeh++;
      else if (m.category === 'حرم و زیارتگاه') shrine++;
    }
    return { all: mosques.length, mosque, prayer_room, hosseiniyeh, shrine };
  }, [mosques]);

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchingPlace(true);
    const list = await geocodeSearchQuery(searchQuery, coords.lat, coords.lng);
    setSearchResults(list);
    setSearchingPlace(false);
    if (list.length === 0) {
      showNotice('مکانی با این نام یافت نشد؛ نام شهر و خیابان را دقیق‌تر بنویسید.');
    }
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapBoxRef.current) return;
    const rect = mapBoxRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const dxPixels = clickX - rect.width / 2;
    const dyPixels = clickY - rect.height / 2;
    const centerTile = latLngToTileXY(coords.lat, coords.lng, mapZoom);
    const targetTileX = centerTile.x + dxPixels / 256;
    const targetTileY = centerTile.y + dyPixels / 256;
    const nextLatLng = tileXYToLatLng(targetTileX, targetTileY, mapZoom);
    showNotice('موقعیت به نقطه انتخابی شما روی نقشه منتقل شد.');
    void runDiscovery(nextLatLng.lat, nextLatLng.lng, searchRadius, 5, 'انتخاب روی نقشه', undefined, false);
  };

  const handleSaveSuggestedMosque = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestName.trim()) {
      showNotice('لطفاً نام مسجد یا نمازخانه را بنویسید.');
      return;
    }
    saveUserSuggestedMosque({
      name: suggestName.trim(),
      address: userAddress,
      lat: coords.lat,
      lng: coords.lng,
      category: suggestCategory,
    });
    setSuggestName('');
    setShowSuggestForm(false);
    showNotice('مسجد جدید با موفقیت ثبت شد و به لیست اطراف شما اضافه گردید.');
    void runDiscovery(coords.lat, coords.lng, searchRadius, accuracyMeters, providerLabel, userAddress, true);
  };

  const handleSetAsMyMosque = (m: NearbyMosque) => {
    const mt = loadMosqueAndTravel();
    saveMosqueAndTravel({
      ...mt,
      selectedMosqueName: m.name,
      mosqueAnnouncement:
        'فاصله مستقیم: ' + formatDist(m.distanceMeters) + ' (حدود ' + toFaDigits(m.walkingMinutes) + ' دقیقه پیاده) — ' + m.address,
    });
    showNotice('«' + m.name + '» به عنوان مسجد منتخب شما در صفحه اول ثبت شد.');
    onMosqueSelected?.();
  };

  const openInNeshanApp = (m: NearbyMosque) => {
    window.open('https://nshn.ir/?lat=' + m.lat + '&lng=' + m.lng, '_blank', 'noopener,noreferrer');
  };

  const openInBalad = (m: NearbyMosque) => {
    window.open(
      'https://balad.ir/search?q=' + encodeURIComponent(m.name) + '&lat=' + m.lat + '&lng=' + m.lng,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const openInGoogleMaps = (m: NearbyMosque) => {
    const modeParam = travelMode === 'walk' ? 'walking' : travelMode === 'transit' ? 'transit' : 'driving';
    const gUrl =
      'https://www.google.com/maps/dir/?api=1&origin=' +
      coords.lat +
      ',' +
      coords.lng +
      '&destination=' +
      m.lat +
      ',' +
      m.lng +
      '&travelmode=' +
      modeParam;
    window.open(gUrl, '_blank', 'noopener,noreferrer');
  };

  const formatDist = (meters: number) => {
    if (meters < 1000) return toFaDigits(meters) + ' متر';
    return toFaDigits((meters / 1000).toFixed(1)) + ' کیلومتر';
  };

  const centerTile = latLngToTileXY(coords.lat, coords.lng, mapZoom);
  const baseTileX = Math.floor(centerTile.x);
  const baseTileY = Math.floor(centerTile.y);
  const fracX = (centerTile.x - baseTileX) * 256;
  const fracY = (centerTile.y - baseTileY) * 256;

  const node = (
    <div
      className="fixed inset-0 z-[999] overflow-y-auto flex items-stretch sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.86)', backdropFilter: 'blur(8px)' }}
      dir="rtl"
    >
      <div
        className="w-full sm:max-w-lg min-h-[100dvh] sm:min-h-0 sm:rounded-3xl p-4 sm:p-5 border-0 sm:border shadow-2xl overflow-y-auto"
        style={{ background: theme.surface, borderColor: theme.border }}
      >
        {/* هدر */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md" style={{ background: theme.primary }}>
              <Navigation size={19} color={theme.bg} />
            </div>
            <div>
              <h2 className="text-base font-black text-app">مسجدیاب دقیق اطراف من</h2>
              <p className="text-[11px] text-muted font-medium">اسکن هم‌زمان نشان + نقشه جهانی به ترتیب کمترین فاصله</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => void runDiscovery(coords.lat, coords.lng, searchRadius, accuracyMeters, providerLabel, userAddress, true)}
              className="w-8 h-8 rounded-xl flex items-center justify-center border text-primary"
              style={{ borderColor: theme.border }}
              title="بروزرسانی تازه لیست مساجد"
              aria-label="بروزرسانی"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center border text-muted"
              style={{ borderColor: theme.border }}
              aria-label="بستن"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* نوار وضعیت مکان و GPS */}
        <div
          className="mb-3 p-3 rounded-2xl border flex items-center justify-between gap-2.5"
          style={{
            borderColor: gpsStatus === 'locked' ? theme.primary : theme.accent,
            background:
              gpsStatus === 'locked'
                ? 'radial-gradient(circle at right, color-mix(in srgb, ' + theme.primary + ' 16%, transparent), ' + theme.bg + ')'
                : 'color-mix(in srgb, ' + theme.accent + ' 12%, ' + theme.bg + ')',
          }}
        >
          <div className="flex items-start gap-2 min-w-0 flex-1">
            <div className="mt-0.5 shrink-0">
              {gpsStatus === 'locked' ? <CheckCircle2 size={18} color={theme.primary} /> : <AlertTriangle size={18} color={theme.accent} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center flex-wrap gap-1.5">
                <span className="text-xs font-black text-app">
                  {gpsStatus === 'locked' ? 'موقعیت شما:' : 'در حال دریافت موقعیت...'}
                </span>
                <span
                  className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'color-mix(in srgb, ' + theme.primary + ' 20%, transparent)', color: theme.primary }}
                >
                  {providerLabel}
                  {accuracyMeters ? ' · ±' + toFaDigits(accuracyMeters) + ' متر' : ''}
                </span>
              </div>
              <p className="text-xs text-primary font-bold leading-relaxed mt-1 break-words">{userAddress}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void detectLiveGps(true)}
            className="px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1 shrink-0 shadow-sm"
            style={{ background: theme.primary, color: theme.bg }}
          >
            <LocateFixed size={13} />
            <span>مکان‌یابی</span>
          </button>
        </div>

        {/* انتخاب سریع شعاع جست‌وجو (متصل به موتور) */}
        <div className="mb-3 flex items-center justify-between gap-1.5">
          <span className="text-[11px] font-black text-muted shrink-0">شعاع اسکن:</span>
          <div className="grid grid-cols-4 gap-1.5 flex-1">
            {RADIUS_OPTIONS.map((opt) => {
              const active = searchRadius === opt.meters;
              return (
                <button
                  key={opt.meters}
                  type="button"
                  onClick={() => handleRadiusChange(opt.meters)}
                  className="py-1.5 rounded-xl text-[11px] font-black border transition-all"
                  style={{
                    background: active ? theme.primary : theme.bg,
                    color: active ? theme.bg : theme.textMuted,
                    borderColor: active ? theme.primary : theme.border,
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* باکس جستجوی سریع نام محله یا خیابان */}
        <form onSubmit={handleManualSearch} className="mb-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl border" style={{ background: theme.bg, borderColor: theme.border }}>
            <Search size={15} color={theme.textMuted} className="shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی نام محله یا خیابان (مثلاً: مشهد بلوار فردوسی)..."
              className="flex-1 bg-transparent text-xs text-app outline-none"
            />
            {searchQuery && (
              <button type="button" onClick={() => { setSearchQuery(''); setSearchResults([]); }} className="text-muted">
                <X size={14} />
              </button>
            )}
            <button
              type="submit"
              disabled={searchingPlace}
              className="px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0"
              style={{ background: 'color-mix(in srgb, ' + theme.primary + ' 18%, transparent)', color: theme.primary }}
            >
              {searchingPlace ? '...' : 'بیاب'}
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-1.5 rounded-2xl border p-1.5 space-y-1 max-h-40 overflow-y-auto" style={{ background: theme.bg, borderColor: theme.primary }}>
              {searchResults.map((sr, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setSearchResults([]);
                    void runDiscovery(sr.lat, sr.lng, searchRadius, 5, 'جستجوی محله', sr.title + '، ' + sr.address, false);
                  }}
                  className="w-full text-right px-2.5 py-1.5 rounded-xl text-xs hover:opacity-80 flex items-center justify-between gap-2"
                  style={{ background: theme.surface }}
                >
                  <div className="truncate">
                    <strong className="text-primary font-bold">{sr.title}</strong>
                    <span className="text-[10px] text-muted mr-1.5">{sr.address}</span>
                  </div>
                  <span className="text-[10px] font-bold text-accent shrink-0">انتخاب ←</span>
                </button>
              ))}
            </div>
          )}
        </form>

        {/* نقشه زنده محله (خیابان / ماهواره‌ای HD) با پین‌های شماره‌دار مساجد */}
        <div className="mb-3 relative rounded-3xl overflow-hidden border-2 shadow-lg" style={{ borderColor: theme.primary, height: '205px', background: '#0c2620' }}>
          <div
            ref={mapBoxRef}
            onClick={handleMapClick}
            className="w-full h-full relative cursor-crosshair select-none overflow-hidden"
            title="روی هر نقطه از نقشه بزنید تا موقعیت به همان کوچه منتقل شود"
          >
            {[-1, 0, 1].map((dy) =>
              [-1, 0, 1].map((dx) => {
                const tx = baseTileX + dx;
                const ty = baseTileY + dy;
                const leftPx = 'calc(50% + ' + (dx * 256 - fracX) + 'px)';
                const topPx = 'calc(50% + ' + (dy * 256 - fracY) + 'px)';
                const tileUrl =
                  mapLayer === 'satellite'
                    ? `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${mapZoom}/${ty}/${tx}`
                    : `https://tile.openstreetmap.org/${mapZoom}/${tx}/${ty}.png`;
                return (
                  <img
                    key={mapLayer + '_' + tx + '_' + ty + '_' + mapZoom}
                    src={tileUrl}
                    alt=""
                    draggable={false}
                    className="absolute w-[256px] h-[256px] max-w-none pointer-events-none"
                    style={{ left: leftPx, top: topPx, filter: 'contrast(1.05) saturate(1.08)' }}
                  />
                );
              })
            )}

            {/* پین‌های شماره‌دار مساجد به ترتیب نزدیکی */}
            {filteredMosques.slice(0, 18).map((m, idx) => {
              const mTile = latLngToTileXY(m.lat, m.lng, mapZoom);
              const offsetX = (mTile.x - centerTile.x) * 256;
              const offsetY = (mTile.y - centerTile.y) * 256;
              if (Math.abs(offsetX) > 230 || Math.abs(offsetY) > 102) return null;
              const isSel = selectedMosque?.id === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMosque(m);
                  }}
                  style={{
                    left: `calc(50% + ${offsetX}px)`,
                    top: `calc(50% + ${offsetY}px)`,
                    transform: 'translate(-50%, -100%)',
                    background: isSel ? '#F59E0B' : '#059669',
                    zIndex: isSel ? 28 : 20,
                  }}
                  className="absolute px-2 py-0.5 rounded-full text-[10px] font-black text-white shadow-lg border border-white flex items-center gap-0.5"
                >
                  <span>{toFaDigits(idx + 1)}</span>
                  <span className="max-w-[78px] truncate">· {m.name.replace(/^مسجد\s+/, '')}</span>
                </button>
              );
            })}

            {/* نقطه آبی موقعیت فعلی کاربر */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none flex items-center justify-center">
              <div className="w-11 h-11 rounded-full bg-blue-500/25 animate-ping absolute" />
              <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-lg relative" />
            </div>
          </div>

          <div className="absolute top-2 left-2 z-30 flex flex-col gap-1">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setMapZoom((z) => Math.min(18, z + 1)); }}
              className="w-7 h-7 rounded-lg bg-black/75 text-white flex items-center justify-center shadow"
              aria-label="بزرگنمایی"
            >
              <Plus size={14} />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setMapZoom((z) => Math.max(13, z - 1)); }}
              className="w-7 h-7 rounded-lg bg-black/75 text-white flex items-center justify-center shadow"
              aria-label="کوچکنمایی"
            >
              <Minus size={14} />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setMapLayer((l) => (l === 'street' ? 'satellite' : 'street')); }}
              className="w-7 h-7 rounded-lg bg-black/80 text-amber-300 flex items-center justify-center shadow border border-amber-400/40"
              title={mapLayer === 'street' ? 'نمای ماهواره‌ای' : 'نمای خیابان'}
              aria-label="تغییر لایه نقشه"
            >
              <Layers size={14} />
            </button>
          </div>

          <div className="absolute bottom-1.5 right-2 left-2 z-30 pointer-events-none flex items-center justify-between text-[10px] font-bold px-2.5 py-1 rounded-xl bg-black/75 text-white">
            <span className="flex items-center gap-1">
              <MapIcon size={11} color="#34D399" /> {mapLayer === 'satellite' ? 'نمای ماهواره‌ای' : 'نقشه خیابان'} ({toFaDigits(filteredMosques.length)} مورد)
            </span>
            <span className="text-amber-300">لمس هر نقطه = جابه‌جایی مکان</span>
          </div>
        </div>

        {/* فیلتر دسته‌بندی اماکن */}
        <div className="mb-3 flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all' as const, label: 'همه', count: categoryCounts.all },
            { id: 'mosque' as const, label: 'مسجد', count: categoryCounts.mosque },
            { id: 'prayer_room' as const, label: 'نمازخانه', count: categoryCounts.prayer_room },
            { id: 'hosseiniyeh' as const, label: 'حسینیه و مصلی', count: categoryCounts.hosseiniyeh },
            { id: 'shrine' as const, label: 'حرم و زیارتگاه', count: categoryCounts.shrine },
          ].map((cat) => {
            const active = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold border whitespace-nowrap transition-all flex items-center gap-1"
                style={{
                  background: active ? 'color-mix(in srgb, ' + theme.primary + ' 20%, ' + theme.surface + ')' : theme.bg,
                  borderColor: active ? theme.primary : theme.border,
                  color: active ? theme.primary : theme.textMuted,
                }}
              >
                <span>{cat.label}</span>
                <span className="text-[10px] opacity-80">({toFaDigits(cat.count)})</span>
              </button>
            );
          })}
        </div>

        {toast && (
          <div
            className="mb-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-center shadow-lg"
            style={{ background: theme.primary, color: theme.bg }}
          >
            {toast}
          </div>
        )}

        {/* انتخاب شیوه رفت‌وآمد */}
        <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl mb-3" style={{ background: theme.bg, border: '1px solid ' + theme.border }}>
          {[
            { id: 'walk' as const, label: 'پیاده‌روی', Icon: Footprints },
            { id: 'car' as const, label: 'با خودرو', Icon: Car },
            { id: 'transit' as const, label: 'حمل‌ونقل', Icon: Bus },
          ].map((m) => {
            const active = travelMode === m.id;
            const IconComp = m.Icon;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setTravelMode(m.id)}
                className="py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                style={{
                  background: active ? theme.primary : 'transparent',
                  color: active ? theme.bg : theme.textMuted,
                }}
              >
                <IconComp size={14} />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* کارت مسجد منتخب با تفکیک فاصله مستقیم و مسیر واقعی */}
        {selectedMosque && (
          <div
            className="rounded-3xl p-4 mb-3.5 border-2 space-y-3 relative overflow-hidden"
            style={{
              background: 'radial-gradient(circle at top left, color-mix(in srgb, ' + theme.primary + ' 20%, ' + theme.surface + '), ' + theme.bg + ')',
              borderColor: theme.primary,
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center flex-wrap gap-1.5 mb-1">
                  <span
                    className="text-[10px] font-black px-2.5 py-0.5 rounded-full inline-block"
                    style={{ background: 'color-mix(in srgb, ' + theme.accent + ' 20%, transparent)', color: theme.accent }}
                  >
                    🕌 {selectedMosque.category}
                  </span>
                  {(selectedMosque.providers || []).map((p) => (
                    <span
                      key={p}
                      className="text-[9px] font-bold px-2 py-0.5 rounded-full border"
                      style={{ borderColor: theme.border, color: theme.textMuted }}
                    >
                      {providerLabelFa(p)}
                    </span>
                  ))}
                </div>
                <h3 className="text-base font-black text-app leading-snug">{selectedMosque.name}</h3>
                <p className="text-xs text-muted mt-0.5 leading-relaxed">{selectedMosque.address}</p>
              </div>
              <div
                className="px-3 py-2 rounded-2xl text-center shrink-0 border"
                style={{
                  background: 'color-mix(in srgb, ' + theme.primary + ' 14%, ' + theme.surface + ')',
                  borderColor: 'color-mix(in srgb, ' + theme.primary + ' 40%, transparent)',
                }}
              >
                <span className="text-sm font-black text-primary block">{formatDist(selectedMosque.distanceMeters)}</span>
                <span className="text-[9px] font-bold text-muted block">فاصله مستقیم</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-2xl border" style={{ borderColor: travelMode === 'walk' ? theme.primary : theme.border, background: theme.surface }}>
                <span className="text-[10px] text-muted block">
                  {routeDetail && travelMode === 'walk' ? 'پیاده (واقعی)' : 'پیاده (تخمینی)'}
                </span>
                <strong className="text-xs font-black text-app">
                  {routeDetail && travelMode === 'walk' ? routeDetail.durationText : toFaDigits(selectedMosque.walkingMinutes) + ' دقیقه'}
                </strong>
              </div>
              <div className="p-2 rounded-2xl border" style={{ borderColor: travelMode === 'car' ? theme.primary : theme.border, background: theme.surface }}>
                <span className="text-[10px] text-muted block">
                  {routeDetail && travelMode === 'car' ? 'خودرو (واقعی)' : 'خودرو (تخمینی)'}
                </span>
                <strong className="text-xs font-black text-app">
                  {routeDetail && travelMode === 'car' ? routeDetail.durationText : toFaDigits(selectedMosque.drivingMinutes) + ' دقیقه'}
                </strong>
              </div>
              <div className="p-2 rounded-2xl border" style={{ borderColor: travelMode === 'transit' ? theme.primary : theme.border, background: theme.surface }}>
                <span className="text-[10px] text-muted block">عمومی (تخمینی)</span>
                <strong className="text-xs font-black text-app">{toFaDigits(selectedMosque.transitMinutes)} دقیقه</strong>
              </div>
            </div>

            {routeDetail && (
              <div
                className="px-3 py-1.5 rounded-xl border flex items-center justify-center gap-1.5 text-[11px] font-bold"
                style={{ borderColor: theme.accent, color: theme.accent }}
              >
                <Route size={13} />
                <span>
                  مسیر واقعی خیابان: {routeDetail.distanceText}
                  {routeDetail.summary ? ' از ' + routeDetail.summary : ''}
                </span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => openInNeshanApp(selectedMosque)}
                className="py-2.5 px-2 rounded-2xl text-[11px] font-black flex items-center justify-center gap-1 shadow-md"
                style={{ background: theme.primary, color: theme.bg }}
              >
                <Navigation size={13} />
                <span>نشان</span>
                <ExternalLink size={11} />
              </button>
              <button
                type="button"
                onClick={() => openInBalad(selectedMosque)}
                className="py-2.5 px-2 rounded-2xl text-[11px] font-black flex items-center justify-center gap-1 border"
                style={{ borderColor: theme.primary, color: theme.primary }}
              >
                <MapIcon size={13} />
                <span>بلد</span>
              </button>
              <button
                type="button"
                onClick={() => openInGoogleMaps(selectedMosque)}
                className="py-2.5 px-2 rounded-2xl text-[11px] font-bold flex items-center justify-center gap-1 border"
                style={{ borderColor: theme.accent, color: theme.accent }}
              >
                <Compass size={13} />
                <span>گوگل‌مپ</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleSetAsMyMosque(selectedMosque)}
              className="w-full py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5"
              style={{ background: 'color-mix(in srgb, ' + theme.primary + ' 14%, transparent)', color: theme.primary }}
            >
              <Sparkles size={13} />
              <span>انتخاب به عنوان مسجد ثابت من در صفحه اول</span>
            </button>
          </div>
        )}

        {/* لیست مساجد مرتب‌شده بر اساس کمترین فاصله */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-black text-app">
              {loading && filteredMosques.length === 0
                ? 'در حال اسکن هم‌زمان مساجد محله...'
                : 'نزدیک‌ترین اماکن (' + toFaDigits(filteredMosques.length) + ' مورد):'}
            </span>
            <span className="text-[10px] font-bold text-primary">مرتب‌شده بر اساس نزدیکی</span>
          </div>

          {!loading && filteredMosques.length === 0 ? (
            <div className="p-4 rounded-2xl border text-center space-y-2.5" style={{ background: theme.bg, borderColor: theme.border }}>
              <p className="text-xs text-muted font-bold">
                در شعاع {searchRadius < 1000 ? toFaDigits(searchRadius) + ' متر' : toFaDigits(searchRadius / 1000) + ' کیلومتر'} موردی با این فیلتر پیدا نشد.
              </p>
              {searchRadius < 5000 && (
                <button
                  type="button"
                  onClick={() => handleRadiusChange(searchRadius < 1000 ? 1000 : searchRadius < 2000 ? 2000 : 5000)}
                  className="px-4 py-2 rounded-xl text-xs font-black"
                  style={{ background: theme.primary, color: theme.bg }}
                >
                  افزایش شعاع اسکن به {searchRadius < 1000 ? '۱ کیلومتر' : searchRadius < 2000 ? '۲ کیلومتر' : '۵ کیلومتر'}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
              {filteredMosques.map((m: NearbyMosque, idx: number) => {
                const isSel = selectedMosque?.id === m.id;
                const timeVal =
                  travelMode === 'walk'
                    ? 'حدود ' + toFaDigits(m.walkingMinutes) + ' دقیقه پیاده'
                    : travelMode === 'car'
                    ? 'حدود ' + toFaDigits(m.drivingMinutes) + ' دقیقه خودرو'
                    : 'حدود ' + toFaDigits(m.transitMinutes) + ' دقیقه عمومی';

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMosque(m)}
                    className="w-full p-3 rounded-2xl border text-right flex items-center justify-between gap-2.5 transition-all"
                    style={{
                      borderColor: isSel ? theme.primary : theme.border,
                      background: isSel ? 'color-mix(in srgb, ' + theme.primary + ' 14%, ' + theme.surface + ')' : theme.bg,
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0"
                        style={{
                          background: isSel ? theme.primary : 'color-mix(in srgb, ' + theme.primary + ' 14%, transparent)',
                          color: isSel ? theme.bg : theme.primary,
                        }}
                      >
                        {toFaDigits(idx + 1)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-app truncate">{m.name}</p>
                        <p className="text-[11px] text-muted mt-0.5 truncate">{m.address}</p>
                      </div>
                    </div>
                    <div className="text-left shrink-0">
                      <span className="text-xs font-black text-primary block">{formatDist(m.distanceMeters)}</span>
                      <span className="text-[10px] text-accent font-bold block">{timeVal}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* معرفی مسجد جاافتاده + پنل شفافیت منابع */}
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowSuggestForm((s) => !s)}
              className="text-[11px] font-bold flex items-center gap-1 text-primary"
            >
              <PlusCircle size={13} />
              <span>مسجدی جا افتاده؟ ثبت سریع در محله</span>
            </button>

            {diagnostics && (
              <button
                type="button"
                onClick={() => setShowDiagnostics((d) => !d)}
                className="text-[10px] font-bold flex items-center gap-1 text-muted"
              >
                <Info size={12} />
                <span>گزارش منابع</span>
              </button>
            )}
          </div>

          {showSuggestForm && (
            <form
              onSubmit={handleSaveSuggestedMosque}
              className="p-3 rounded-2xl border space-y-2"
              style={{ background: theme.bg, borderColor: theme.primary }}
            >
              <p className="text-[11px] font-bold text-app">
                مسجد در نقطه فعلی نقشه (نقطه آبی) ثبت و بلافاصله به لیست شما اضافه می‌شود:
              </p>
              <input
                type="text"
                value={suggestName}
                onChange={(e) => setSuggestName(e.target.value)}
                placeholder="نام مسجد یا نمازخانه (مثلاً: مسجد حضرت ولیعصر)"
                className="w-full px-3 py-2 rounded-xl border text-xs bg-transparent text-app outline-none"
                style={{ borderColor: theme.border }}
              />
              <div className="flex items-center gap-2">
                <select
                  value={suggestCategory}
                  onChange={(e) => setSuggestCategory(e.target.value as NearbyMosque['category'])}
                  className="flex-1 px-2.5 py-2 rounded-xl border text-xs bg-transparent text-app outline-none"
                  style={{ borderColor: theme.border, background: theme.surface }}
                >
                  <option value="مسجد محله">مسجد محله</option>
                  <option value="مسجد جامع">مسجد جامع</option>
                  <option value="نمازخانه">نمازخانه</option>
                  <option value="حسینیه و مصلی">حسینیه و مصلی</option>
                  <option value="حرم و زیارتگاه">حرم و زیارتگاه</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-black shrink-0"
                  style={{ background: theme.primary, color: theme.bg }}
                >
                  ثبت مسجد
                </button>
              </div>
            </form>
          )}

          {showDiagnostics && diagnostics && (
            <div
              className="p-2.5 rounded-2xl border text-[10px] text-muted leading-relaxed"
              style={{ background: theme.bg, borderColor: theme.border }}
            >
              نشان: <strong>{toFaDigits(diagnostics.sources.neshan.count)}</strong> · OSM:{' '}
              <strong>{toFaDigits(diagnostics.sources.osm.count)}</strong> · گوگل:{' '}
              <strong>{toFaDigits(diagnostics.sources.google.count)}</strong> · محلی:{' '}
              <strong>{toFaDigits(diagnostics.sources.local.count)}</strong> | تکراری ادغام‌شده:{' '}
              <strong>{toFaDigits(diagnostics.removedDuplicates)}</strong> · خارج از شعاع:{' '}
              <strong>{toFaDigits(diagnostics.discardedOutOfRadius)}</strong>
              {diagnostics.usedCache ? ' (کش سریع)' : ''}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-3.5 py-3 rounded-2xl text-xs font-bold border"
          style={{ borderColor: theme.border, color: theme.text }}
        >
          <Check size={14} className="inline ml-1" /> بستن مسجدیاب
        </button>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(node, document.body) : node;
}
