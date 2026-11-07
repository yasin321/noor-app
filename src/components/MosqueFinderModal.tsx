import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Navigation, Footprints, Car, Bus, Compass, X, LocateFixed, Check, ExternalLink, Sparkles, CheckCircle2, AlertTriangle, Route, Search, Map as MapIcon, Plus, Minus, KeyRound } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useTheme } from '@/hooks/useTheme';
import { NoorAlarm } from '@/lib/reminderService';
import {
  searchNearbyMosques,
  fetchNeshanExactRoute,
  geocodeSearchQuery,
  getGoogleMapsApiKey,
  setGoogleMapsApiKey,
  saveLocationMetrics,
  clearReverseGeocodeCache,
  type NearbyMosque,
} from '@/lib/neshanMosqueService';
import { saveCustomGpsCoords, clearCustomGpsCoords } from '@/lib/cities';
import { loadMosqueAndTravel, saveMosqueAndTravel } from '@/lib/deenIntelligenceStore';
import { toFaDigits } from '@/lib/jalali';

interface Props {
  cityName: string;
  defaultLat: number;
  defaultLng: number;
  onClose: () => void;
  onMosqueSelected?: () => void;
}

// تبدیل مختصات جغرافیایی (Lat/Lng) به تایل‌های استاندارد نقشه خیابان‌ها (Slippy Map Tiles)
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

export function MosqueFinderModal({ cityName, defaultLat, defaultLng, onClose, onMosqueSelected }: Props) {
  const { theme } = useTheme();
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: defaultLat, lng: defaultLng });
  const [mapZoom, setMapZoom] = useState<number>(16);
  const [gpsStatus, setGpsStatus] = useState<'searching' | 'locked' | 'fallback'>('searching');
  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(null);
  const [providerLabel, setProviderLabel] = useState<string>('Fused GPS');
  const [loading, setLoading] = useState<boolean>(true);
  const [mosques, setMosques] = useState<NearbyMosque[]>([]);
  const [userAddress, setUserAddress] = useState<string>('در حال مکان‌یابی دقیق...');
  const [travelMode, setTravelMode] = useState<'walk' | 'car' | 'transit'>('walk');
  const [selectedMosque, setSelectedMosque] = useState<NearbyMosque | null>(null);
  const [routeDetail, setRouteDetail] = useState<{ durationText: string; distanceText: string; summary: string } | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Array<{ title: string; address: string; lat: number; lng: number }>>([]);
  const [searchingPlace, setSearchingPlace] = useState<boolean>(false);

  const [showGoogleKeyBox, setShowGoogleKeyBox] = useState<boolean>(false);
  const [googleKeyInput, setGoogleKeyInput] = useState<string>(() => getGoogleMapsApiKey());
  const [toast, setToast] = useState<string | null>(null);
  const mapBoxRef = useRef<HTMLDivElement | null>(null);

  const showNotice = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3400);
  };

  const lockOnCoordinates = async (lat: number, lng: number, acc: number | null, srcLabel: string, nativeAddrHint?: string) => {
    setCoords({ lat, lng });
    setAccuracyMeters(acc !== null ? Math.round(acc) : null);
    setProviderLabel(srcLabel);
    setGpsStatus('locked');
    setLoading(true);
    saveCustomGpsCoords(lat, lng);

    const res = await searchNearbyMosques(lat, lng, nativeAddrHint);
    setMosques(res.mosques);
    if (res.userAddress) {
      setUserAddress(res.userAddress);
      saveCustomGpsCoords(lat, lng, res.userAddress);
    }
    if (res.mosques.length > 0) setSelectedMosque(res.mosques[0]);
    setLoading(false);
    saveLocationMetrics({
      gpsAcquisitionMs: 250,
      apiResponseMs: res.apiResponseMs,
      usedAddressCache: false,
      accuracyMeters: acc !== null ? Math.round(acc) : null,
      timestampIso: new Date().toISOString(),
    });
  };

  const detectLiveGps = async () => {
    clearReverseGeocodeCache();
    clearCustomGpsCoords();
    setGpsStatus('searching');
    setUserAddress('در حال قفل کردن رادار Fused GPS روی کوچه و خیابان شما...');
    setLoading(true);

    let bestAccuracy = Infinity;
    let lockedAny = false;

    const onCandidateFix = async (lat: number, lng: number, realAcc: number, src: string, nativeAddr?: string) => {
      if (lockedAny && realAcc >= bestAccuracy - 3) return;
      bestAccuracy = realAcc;
      lockedAny = true;
      await lockOnCoordinates(lat, lng, realAcc, src, nativeAddr);
    };

    // ۱. اولویت اول در اندروید: موتور رسمی Google Play Services FusedLocationProviderClient
    if (Capacitor.getPlatform() === 'android' && typeof NoorAlarm.requestAndGetLocation === 'function') {
      try {
        const res = await NoorAlarm.requestAndGetLocation();
        if (res.hasCoords && typeof res.lat === 'number' && typeof res.lng === 'number') {
          const nativeAcc = typeof res.accuracy === 'number' ? res.accuracy : 15;
          await onCandidateFix(res.lat, res.lng, nativeAcc, 'Fused GPS نیتیو', res.nativeAddress);
        }
      } catch {}
    }

    // ۲. استریم زنده و پیوسته High-Accuracy GPS برای بهبود لحظه‌ای دقت تا زیر ۱۰ متر
    let watchId: number | null = null;
    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const acc = pos.coords.accuracy || 18;
          if (acc <= 180 || !lockedAny) {
            void onCandidateFix(pos.coords.latitude, pos.coords.longitude, acc, 'رادار زنده GPS');
          }
        },
        () => {},
        { enableHighAccuracy: true, timeout: 9000, maximumAge: 0 }
      );
      setTimeout(() => {
        if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      }, 9500);
    }

    setTimeout(async () => {
      if (!lockedAny) {
        setGpsStatus('fallback');
        const fallbackRes = await searchNearbyMosques(coords.lat, coords.lng);
        setMosques(fallbackRes.mosques);
        if (fallbackRes.mosques.length > 0) setSelectedMosque(fallbackRes.mosques[0]);
        setUserAddress('مکان‌یاب گوشی خاموش است — روی نقشه زیر محله خود را لمس یا جستجو کنید');
        setLoading(false);
      }
    }, 5200);
  };

  useEffect(() => {
    void detectLiveGps();
  }, []);

  useEffect(() => {
    if (!selectedMosque) return;
    setRouteDetail(null);
    fetchNeshanExactRoute(
      coords.lat,
      coords.lng,
      selectedMosque.lat,
      selectedMosque.lng,
      travelMode === 'walk' ? 'pedestrian' : 'car'
    ).then((info) => {
      if (info) setRouteDetail(info);
    });
  }, [selectedMosque, travelMode, coords.lat, coords.lng]);

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchingPlace(true);
    const list = await geocodeSearchQuery(searchQuery);
    setSearchResults(list);
    setSearchingPlace(false);
    if (list.length === 0) {
      showNotice('مکانی با این نام یافت نشد؛ نام شهر و خیابان را دقیق‌تر بنویسید.');
    }
  };

  // قابلیت کلیک مستقیم روی نقشه زنده برای جابه‌جایی نقطه‌گیر دقیق روی کوچه یا ساختمان کاربر
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
    showNotice('📍 موقعیت به نقطه انتخابی شما روی نقشه منتقل شد!');
    void lockOnCoordinates(nextLatLng.lat, nextLatLng.lng, 5, 'انتخاب روی نقشه');
  };

  const handleSetAsMyMosque = (m: NearbyMosque) => {
    const mt = loadMosqueAndTravel();
    saveMosqueAndTravel({
      ...mt,
      selectedMosqueName: m.name,
      mosqueAnnouncement: 'فاصله: ' + formatDist(m.distanceMeters) + ' (' + toFaDigits(m.walkingMinutes) + ' دقیقه پیاده) — ' + m.address,
    });
    showNotice('🕌 «' + m.name + '» به عنوان مسجد منتخب شما در صفحه اول ثبت شد!');
    onMosqueSelected?.();
  };

  const openInNeshanApp = (m: NearbyMosque) => {
    const neshanUrl = 'https://nshn.ir/?lat=' + m.lat + '&lng=' + m.lng;
    window.open(neshanUrl, '_blank', 'noopener,noreferrer');
  };

  const openInGoogleMaps = (m: NearbyMosque) => {
    const modeParam = travelMode === 'walk' ? 'walking' : travelMode === 'transit' ? 'transit' : 'driving';
    const gUrl = 'https://www.google.com/maps/dir/?api=1&origin=' + coords.lat + ',' + coords.lng + '&destination=' + m.lat + ',' + m.lng + '&travelmode=' + modeParam;
    window.open(gUrl, '_blank', 'noopener,noreferrer');
  };

  const formatDist = (meters: number) => {
    if (meters < 1000) return toFaDigits(meters) + ' متر';
    return toFaDigits((meters / 1000).toFixed(1)) + ' کیلومتر';
  };

  // محاسبه تایل‌های شبکه ۳ در ۳ برای نقشه زنده خیابان‌ها
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
        <div className="flex items-center justify-between pb-3 mb-3 border-b" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md"
              style={{ background: theme.primary }}
            >
              <Navigation size={19} color={theme.bg} />
            </div>
            <div>
              <h2 className="text-base font-black text-app">رادار مسجدیاب و نقشه زنده نشان</h2>
              <p className="text-[11px] text-muted font-medium">موتور ترکیبی Fused GPS + نشان + Maps.me + گوگل</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowGoogleKeyBox((v) => !v)}
              title="افزودن کلید Google Maps (اختیاری)"
              className="w-8 h-8 rounded-xl flex items-center justify-center border"
              style={{ borderColor: googleKeyInput ? theme.primary : theme.border, color: googleKeyInput ? theme.primary : theme.textMuted }}
            >
              <KeyRound size={15} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center border text-muted"
              style={{ borderColor: theme.border }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {showGoogleKeyBox && (
          <div className="mb-3 p-3 rounded-2xl border space-y-2" style={{ borderColor: theme.primary, background: theme.bg }}>
            <p className="text-[11px] font-bold text-app">🔑 کلید Google Maps API (اختیاری — در کنار نشان و Maps.me):</p>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={googleKeyInput}
                onChange={(e) => setGoogleKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                dir="ltr"
                className="flex-1 px-3 py-1.5 rounded-xl text-xs text-app border outline-none"
                style={{ borderColor: theme.border, background: theme.surface }}
              />
              <button
                type="button"
                onClick={() => {
                  setGoogleMapsApiKey(googleKeyInput);
                  setShowGoogleKeyBox(false);
                  showNotice('✅ کلید Google Maps ذخیره شد!');
                  void detectLiveGps();
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{ background: theme.primary, color: theme.bg }}
              >
                ذخیره
              </button>
            </div>
          </div>
        )}

        {/* نوار وضعیت آدرس خیابان و دکمه رادار Fused GPS */}
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
              {gpsStatus === 'locked' ? (
                <CheckCircle2 size={18} color={theme.primary} />
              ) : (
                <AlertTriangle size={18} color={theme.accent} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center flex-wrap gap-1.5">
                <span className="text-xs font-black text-app">
                  {gpsStatus === 'locked' ? 'موقعیت دقیق شما:' : 'در حال اسکن ماهواره...'}
                </span>
                <span
                  className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'color-mix(in srgb, ' + theme.primary + ' 20%, transparent)', color: theme.primary }}
                >
                  {providerLabel}{accuracyMeters ? ' · دقت ' + toFaDigits(accuracyMeters) + ' متر' : ''}
                </span>
              </div>
              <p className="text-xs text-primary font-bold leading-relaxed mt-1 break-words">{userAddress}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void detectLiveGps()}
            className="px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1 shrink-0 shadow-sm"
            style={{ background: theme.primary, color: theme.bg }}
          >
            <LocateFixed size={13} />
            <span>رادار GPS</span>
          </button>
        </div>

        {/* باکس جستجوی سریع هر خیابان یا محله (مثلاً: مشهد فردوسی ۲) */}
        <form onSubmit={handleManualSearch} className="mb-3">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-2xl border"
            style={{ background: theme.bg, borderColor: theme.border }}
          >
            <Search size={15} color={theme.textMuted} className="shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی نام محله یا خیابان (مثلاً: مشهد فردوسی ۲)..."
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
                    void lockOnCoordinates(sr.lat, sr.lng, 5, 'جستجوی دقیق محله', sr.title + '، ' + sr.address);
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

        {/* نقشه زنده و تعاملی خیابان‌ها (Interactive Street Map) با نقطه آبی کاربر و پین مساجد */}
        <div className="mb-3.5 relative rounded-3xl overflow-hidden border-2 shadow-lg" style={{ borderColor: theme.primary, height: '195px', background: '#0c2620' }}>
          <div
            ref={mapBoxRef}
            onClick={handleMapClick}
            className="w-full h-full relative cursor-crosshair select-none overflow-hidden"
            title="روی هر نقطه از نقشه بزنید تا موقعیت دقیق شما به همان کوچه منتقل شود"
          >
            {/* شبکه تایل‌های نقشه */}
            {[-1, 0, 1].map((dy) =>
              [-1, 0, 1].map((dx) => {
                const tx = baseTileX + dx;
                const ty = baseTileY + dy;
                const leftPx = 'calc(50% + ' + (dx * 256 - fracX) + 'px)';
                const topPx = 'calc(50% + ' + (dy * 256 - fracY) + 'px)';
                return (
                  <img
                    key={tx + '_' + ty + '_' + mapZoom}
                    src={`https://tile.openstreetmap.org/${mapZoom}/${tx}/${ty}.png`}
                    alt=""
                    draggable={false}
                    className="absolute w-[256px] h-[256px] max-w-none pointer-events-none"
                    style={{ left: leftPx, top: topPx, filter: 'contrast(1.05) saturate(1.1)' }}
                  />
                );
              })
            )}

            {/* پین‌های سبز مساجد اطراف روی نقشه زنده */}
            {mosques.slice(0, 8).map((m, idx) => {
              const mTile = latLngToTileXY(m.lat, m.lng, mapZoom);
              const offsetX = (mTile.x - centerTile.x) * 256;
              const offsetY = (mTile.y - centerTile.y) * 256;
              if (Math.abs(offsetX) > 220 || Math.abs(offsetY) > 110) return null;
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
                  }}
                  className="absolute z-20 px-2 py-0.5 rounded-full text-[10px] font-black text-white shadow-lg border border-white flex items-center gap-0.5"
                >
                  <span>🕌</span>
                  <span className="max-w-[85px] truncate">{toFaDigits(idx + 1)}. {m.name.replace('مسجد ', '')}</span>
                </button>
              );
            })}

            {/* دایره آبی تپنده موقعیت فعلی کاربر در مرکز نقشه (مشابه اپ نشان و Maps.me) */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none flex items-center justify-center"
            >
              <div className="w-11 h-11 rounded-full bg-blue-500/25 animate-ping absolute" />
              <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-lg relative" />
            </div>
          </div>

          {/* دکمه‌های زوم نقشه و راهنمای کلیک */}
          <div className="absolute top-2 left-2 z-30 flex flex-col gap-1">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setMapZoom((z) => Math.min(18, z + 1)); }}
              className="w-7 h-7 rounded-lg bg-black/75 text-white flex items-center justify-center shadow"
            >
              <Plus size={14} />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setMapZoom((z) => Math.max(13, z - 1)); }}
              className="w-7 h-7 rounded-lg bg-black/75 text-white flex items-center justify-center shadow"
            >
              <Minus size={14} />
            </button>
          </div>
          <div className="absolute bottom-1.5 right-2 left-2 z-30 pointer-events-none flex items-center justify-between text-[10px] font-bold px-2.5 py-1 rounded-xl bg-black/70 text-white">
            <span className="flex items-center gap-1"><MapIcon size={11} color="#34D399" /> نقشه زنده محله شما (🔵 = شما)</span>
            <span className="text-amber-300">لمس هر نقطه = انتقال مکان به آنجا</span>
          </div>
        </div>

        {toast && (
          <div
            className="mb-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-center shadow-lg"
            style={{ background: theme.primary, color: theme.bg }}
          >
            {toast}
          </div>
        )}

        <div
          className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl mb-3.5"
          style={{ background: theme.bg, border: '1px solid ' + theme.border }}
        >
          {[
            { id: 'walk' as const, label: 'پیاده‌روی', Icon: Footprints },
            { id: 'car' as const, label: 'با خودرو', Icon: Car },
            { id: 'transit' as const, label: 'اتوبوس و مترو', Icon: Bus },
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
                <span
                  className="text-[10px] font-black px-2.5 py-0.5 rounded-full inline-block mb-1"
                  style={{ background: 'color-mix(in srgb, ' + theme.accent + ' 20%, transparent)', color: theme.accent }}
                >
                  🕌 {selectedMosque.category}
                </span>
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
                <span className="text-[9px] font-bold text-muted block">فاصله تا شما</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-2xl border" style={{ borderColor: travelMode === 'walk' ? theme.primary : theme.border, background: theme.surface }}>
                <span className="text-[10px] text-muted block">پیاده‌روی</span>
                <strong className="text-xs font-black text-app">{toFaDigits(selectedMosque.walkingMinutes)} دقیقه</strong>
              </div>
              <div className="p-2 rounded-2xl border" style={{ borderColor: travelMode === 'car' ? theme.primary : theme.border, background: theme.surface }}>
                <span className="text-[10px] text-muted block">با خودرو</span>
                <strong className="text-xs font-black text-app">
                  {routeDetail && travelMode === 'car' ? routeDetail.durationText : toFaDigits(selectedMosque.drivingMinutes) + ' دقیقه'}
                </strong>
              </div>
              <div className="p-2 rounded-2xl border" style={{ borderColor: travelMode === 'transit' ? theme.primary : theme.border, background: theme.surface }}>
                <span className="text-[10px] text-muted block">حمل‌ونقل عمومی</span>
                <strong className="text-xs font-black text-app">{toFaDigits(selectedMosque.transitMinutes)} دقیقه</strong>
              </div>
            </div>

            {routeDetail?.summary && (
              <div
                className="px-3 py-1.5 rounded-xl border flex items-center justify-center gap-1.5 text-[11px] font-bold"
                style={{ borderColor: theme.accent, color: theme.accent }}
              >
                <Route size={13} />
                <span>مسیر پیشنهادی نشان: {routeDetail.summary} ({routeDetail.distanceText})</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => openInNeshanApp(selectedMosque)}
                className="py-2.5 px-3 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md"
                style={{ background: theme.primary, color: theme.bg }}
              >
                <Navigation size={14} />
                <span>مسیریابی در نشان</span>
                <ExternalLink size={12} />
              </button>
              <button
                type="button"
                onClick={() => openInGoogleMaps(selectedMosque)}
                className="py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 border"
                style={{ borderColor: theme.accent, color: theme.accent }}
              >
                <Compass size={14} />
                <span>نقشه گوگل / Maps.me</span>
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

        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-black text-app">
              {loading && mosques.length === 0
                ? 'در حال اسکن مساجد محله شما...'
                : 'مساجد نزدیک به شما (' + toFaDigits(mosques.length) + ' مسجد):'}
            </span>
            <span className="text-[10px] font-bold text-primary">مرتب‌شده بر اساس کمترین فاصله</span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
            {mosques.map((m: NearbyMosque, idx: number) => {
              const isSel = selectedMosque?.id === m.id;
              const timeVal =
                travelMode === 'walk'
                  ? toFaDigits(m.walkingMinutes) + ' دقیقه پیاده'
                  : travelMode === 'car'
                  ? toFaDigits(m.drivingMinutes) + ' دقیقه خودرو'
                  : toFaDigits(m.transitMinutes) + ' دقیقه اتوبوس';

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
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-4 py-3 rounded-2xl text-xs font-bold border"
          style={{ borderColor: theme.border, color: theme.text }}
        >
          <Check size={14} className="inline ml-1" /> بستن مسجدیاب
        </button>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(node, document.body) : node;
}
