import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Navigation, Footprints, Car, Bus, Compass, X, LocateFixed, Check, ExternalLink, Sparkles, CheckCircle2, AlertTriangle, Route } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useTheme } from '@/hooks/useTheme';
import { NoorAlarm } from '@/lib/reminderService';
import {
  searchNearbyMosques,
  fetchNeshanExactRoute,
  saveLocationMetrics,
  clearReverseGeocodeCache,
  type NearbyMosque,
} from '@/lib/neshanMosqueService';
import { saveCustomGpsCoords, getCustomGpsCoords } from '@/lib/cities';
import { loadMosqueAndTravel, saveMosqueAndTravel } from '@/lib/deenIntelligenceStore';
import { toFaDigits } from '@/lib/jalali';

interface Props {
  cityName: string;
  defaultLat: number;
  defaultLng: number;
  onClose: () => void;
  onMosqueSelected?: () => void;
}

export function MosqueFinderModal({ cityName, defaultLat, defaultLng, onClose, onMosqueSelected }: Props) {
  const { theme } = useTheme();
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: defaultLat, lng: defaultLng });
  const [gpsStatus, setGpsStatus] = useState<'searching' | 'locked' | 'fallback'>('searching');
  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [mosques, setMosques] = useState<NearbyMosque[]>([]);
  const [userAddress, setUserAddress] = useState<string>('محدوده ' + cityName);
  const [travelMode, setTravelMode] = useState<'walk' | 'car' | 'transit'>('walk');
  const [selectedMosque, setSelectedMosque] = useState<NearbyMosque | null>(null);
  const [routeDetail, setRouteDetail] = useState<{ durationText: string; distanceText: string; summary: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const detectLiveGps = async () => {
    const tStart = performance.now();
    clearReverseGeocodeCache();
    setGpsStatus('searching');
    setUserAddress('در حال اسکن رادار GPS و دریافت آدرس خیابان شما...');
    setLoading(true);

    const onExactCoords = async (lat: number, lng: number, acc: number | null) => {
      const gpsMs = Math.round(performance.now() - tStart);
      setCoords({ lat, lng });
      setAccuracyMeters(acc);
      setGpsStatus('locked');
      saveCustomGpsCoords(lat, lng);
      const res = await searchNearbyMosques(lat, lng);
      setMosques(res.mosques);
      if (res.userAddress) {
        setUserAddress(res.userAddress);
        saveCustomGpsCoords(lat, lng, res.userAddress);
      }
      if (res.mosques.length > 0) setSelectedMosque(res.mosques[0]);
      setLoading(false);
      saveLocationMetrics({
        gpsAcquisitionMs: gpsMs,
        apiResponseMs: res.apiResponseMs,
        usedAddressCache: false,
        accuracyMeters: acc,
        timestampIso: new Date().toISOString(),
      });
    };

    if (Capacitor.getPlatform() === 'android' && typeof NoorAlarm.requestAndGetLocation === 'function') {
      try {
        const res = await NoorAlarm.requestAndGetLocation();
        if (res.hasCoords && typeof res.lat === 'number' && typeof res.lng === 'number') {
          await onExactCoords(res.lat, res.lng, 12);
          return;
        }
      } catch {}
    }

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          void onExactCoords(pos.coords.latitude, pos.coords.longitude, Math.round(pos.coords.accuracy || 12));
        },
        () => {
          navigator.geolocation.getCurrentPosition(
            (pos2) => {
              void onExactCoords(pos2.coords.latitude, pos2.coords.longitude, Math.round(pos2.coords.accuracy || 25));
            },
            async () => {
              const saved = getCustomGpsCoords();
              const useLat = saved ? saved.lat : coords.lat;
              const useLng = saved ? saved.lng : coords.lng;
              setGpsStatus('fallback');
              const fallbackRes = await searchNearbyMosques(useLat, useLng);
              setMosques(fallbackRes.mosques);
              if (fallbackRes.mosques.length > 0) setSelectedMosque(fallbackRes.mosques[0]);
              setUserAddress(fallbackRes.userAddress || ('محدوده ' + cityName));
              setLoading(false);
            },
            { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
          );
        },
        { enableHighAccuracy: true, timeout: 4000, maximumAge: 15000 }
      );
      return;
    }

    setGpsStatus('fallback');
    setLoading(false);
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
        {/* هدر لوکس مسجدیاب */}
        <div className="flex items-center justify-between pb-3.5 mb-3 border-b" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center relative shadow-md"
              style={{
                background: 'linear-gradient(135deg, ' + theme.primary + ', color-mix(in srgb, ' + theme.primary + ' 60%, #000))',
              }}
            >
              <Navigation size={19} color={theme.bg} />
            </div>
            <div>
              <h2 className="text-base font-black text-app">رادار مسجدیاب و مسیریاب نشان</h2>
              <p className="text-[11px] text-muted font-medium">یافتن نزدیک‌ترین مساجد محله به موقعیت لحظه‌ای شما</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center border text-muted"
            style={{ borderColor: theme.border }}
          >
            <X size={18} />
          </button>
        </div>

        {/* نوار وضعیت رادار GPS و آدرس دقیق خیابان */}
        <div
          className="mb-3.5 p-3 rounded-2xl border flex items-center justify-between gap-2.5"
          style={{
            borderColor: gpsStatus === 'locked' ? theme.primary : theme.accent,
            background:
              gpsStatus === 'locked'
                ? 'radial-gradient(circle at right, color-mix(in srgb, ' + theme.primary + ' 16%, transparent), ' + theme.bg + ')'
                : 'color-mix(in srgb, ' + theme.accent + ' 12%, ' + theme.bg + ')',
          }}
        >
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <div className="mt-0.5 shrink-0">
              {gpsStatus === 'locked' ? (
                <CheckCircle2 size={18} color={theme.primary} />
              ) : (
                <AlertTriangle size={18} color={theme.accent} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-app">
                  {gpsStatus === 'locked'
                    ? 'موقعیت دقیق شما قفل شد'
                    : gpsStatus === 'searching'
                    ? 'در حال اسکن ماهواره GPS...'
                    : 'موقعیت تقریبی شهر'}
                </span>
                {accuracyMeters && gpsStatus === 'locked' && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'color-mix(in srgb, ' + theme.primary + ' 20%, transparent)', color: theme.primary }}
                  >
                    دقت {toFaDigits(accuracyMeters)} متر
                  </span>
                )}
              </div>
              <p className="text-[11px] text-primary font-bold leading-relaxed mt-0.5 break-words">{userAddress}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void detectLiveGps()}
            className="px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1 shrink-0 shadow-sm"
            style={{ background: theme.primary, color: theme.bg }}
          >
            <LocateFixed size={13} />
            <span>بروزرسانی</span>
          </button>
        </div>

        {toast && (
          <div
            className="mb-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-center shadow-lg"
            style={{ background: theme.primary, color: theme.bg }}
          >
            {toast}
          </div>
        )}

        {/* انتخابگر مدرن نوع وسیله نقلیه (با آیکون‌های تمیز بدون کاراکتر خراب) */}
        <div
          className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl mb-4"
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
                className="py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                style={{
                  background: active ? theme.primary : 'transparent',
                  color: active ? theme.bg : theme.textMuted,
                  boxShadow: active ? '0 4px 12px color-mix(in srgb, ' + theme.primary + ' 30%, transparent)' : undefined,
                }}
              >
                <IconComp size={14} />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* کارت قهرمان (Hero Card) برای مسجد انتخاب‌شده */}
        {selectedMosque && (
          <div
            className="rounded-3xl p-4 mb-4 border-2 space-y-3.5 relative overflow-hidden"
            style={{
              background: 'radial-gradient(circle at top left, color-mix(in srgb, ' + theme.primary + ' 20%, ' + theme.surface + '), ' + theme.bg + ')',
              borderColor: theme.primary,
              boxShadow: '0 10px 28px rgba(0, 0, 0, 0.35)',
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className="text-[10px] font-black px-2.5 py-0.5 rounded-full"
                    style={{ background: 'color-mix(in srgb, ' + theme.accent + ' 20%, transparent)', color: theme.accent }}
                  >
                    🕌 {selectedMosque.category}
                  </span>
                  {selectedMosque.distanceMeters <= 1500 && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'color-mix(in srgb, ' + theme.primary + ' 20%, transparent)', color: theme.primary }}
                    >
                      در محله شما
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-black text-app leading-snug">{selectedMosque.name}</h3>
                <p className="text-xs text-muted mt-1 leading-relaxed">{selectedMosque.address}</p>
              </div>

              <div
                className="px-3 py-2 rounded-2xl text-center shrink-0 border"
                style={{
                  background: 'color-mix(in srgb, ' + theme.primary + ' 14%, ' + theme.surface + ')',
                  borderColor: 'color-mix(in srgb, ' + theme.primary + ' 40%, transparent)',
                }}
              >
                <span className="text-sm font-black text-primary block">{formatDist(selectedMosque.distanceMeters)}</span>
                <span className="text-[9px] font-bold text-muted block mt-0.5">فاصله مستقیم</span>
              </div>
            </div>

            {/* ۳ باکس زمان رسیدن بر اساس پیاده / خودرو / اتوبوس */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div
                onClick={() => setTravelMode('walk')}
                className="p-2.5 rounded-2xl border cursor-pointer transition-all"
                style={{
                  borderColor: travelMode === 'walk' ? theme.primary : theme.border,
                  background: travelMode === 'walk' ? 'color-mix(in srgb, ' + theme.primary + ' 18%, transparent)' : theme.surface,
                }}
              >
                <Footprints size={14} color={travelMode === 'walk' ? theme.primary : theme.textMuted} className="mx-auto mb-1" />
                <span className="text-[10px] text-muted block">پیاده‌روی</span>
                <strong className="text-xs font-black text-app">{toFaDigits(selectedMosque.walkingMinutes)} دقیقه</strong>
              </div>

              <div
                onClick={() => setTravelMode('car')}
                className="p-2.5 rounded-2xl border cursor-pointer transition-all"
                style={{
                  borderColor: travelMode === 'car' ? theme.primary : theme.border,
                  background: travelMode === 'car' ? 'color-mix(in srgb, ' + theme.primary + ' 18%, transparent)' : theme.surface,
                }}
              >
                <Car size={14} color={travelMode === 'car' ? theme.primary : theme.textMuted} className="mx-auto mb-1" />
                <span className="text-[10px] text-muted block">با خودرو</span>
                <strong className="text-xs font-black text-app">
                  {routeDetail && travelMode === 'car' ? routeDetail.durationText : toFaDigits(selectedMosque.drivingMinutes) + ' دقیقه'}
                </strong>
              </div>

              <div
                onClick={() => setTravelMode('transit')}
                className="p-2.5 rounded-2xl border cursor-pointer transition-all"
                style={{
                  borderColor: travelMode === 'transit' ? theme.primary : theme.border,
                  background: travelMode === 'transit' ? 'color-mix(in srgb, ' + theme.primary + ' 18%, transparent)' : theme.surface,
                }}
              >
                <Bus size={14} color={travelMode === 'transit' ? theme.primary : theme.textMuted} className="mx-auto mb-1" />
                <span className="text-[10px] text-muted block">حمل‌ونقل عمومی</span>
                <strong className="text-xs font-black text-app">{toFaDigits(selectedMosque.transitMinutes)} دقیقه</strong>
              </div>
            </div>

            {routeDetail?.summary && (
              <div
                className="px-3 py-2 rounded-xl border flex items-center justify-center gap-1.5 text-[11px] font-bold"
                style={{
                  borderColor: 'color-mix(in srgb, ' + theme.accent + ' 40%, transparent)',
                  background: 'color-mix(in srgb, ' + theme.accent + ' 10%, transparent)',
                  color: theme.accent,
                }}
              >
                <Route size={13} />
                <span>مسیر پیشنهادی نشان: {routeDetail.summary} ({routeDetail.distanceText})</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => openInNeshanApp(selectedMosque)}
                className="py-3 px-3 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 shadow-lg"
                style={{ background: theme.primary, color: theme.bg }}
              >
                <Navigation size={14} />
                <span>مسیریابی در نشان</span>
                <ExternalLink size={12} />
              </button>
              <button
                type="button"
                onClick={() => openInGoogleMaps(selectedMosque)}
                className="py-3 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 border"
                style={{ borderColor: theme.accent, color: theme.accent, background: 'color-mix(in srgb, ' + theme.accent + ' 8%, transparent)' }}
              >
                <Compass size={14} />
                <span>نقشه گوگل / بلد</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleSetAsMyMosque(selectedMosque)}
              className="w-full py-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 border"
              style={{
                borderColor: 'color-mix(in srgb, ' + theme.primary + ' 35%, transparent)',
                background: 'color-mix(in srgb, ' + theme.primary + ' 12%, transparent)',
                color: theme.primary,
              }}
            >
              <Sparkles size={13} />
              <span>انتخاب به عنوان مسجد ثابت من در صفحه اول</span>
            </button>
          </div>
        )}

        {/* لیست مساجد نزدیک در همین شهر و محله */}
        <div>
          <div className="flex items-center justify-between mb-2.5 px-1">
            <span className="text-xs font-black text-app">
              {loading && mosques.length === 0
                ? 'در حال اسکن مساجد محله شما...'
                : 'مساجد نزدیک به شما در این محدوده (' + toFaDigits(mosques.length) + ' مسجد):'}
            </span>
            <span className="text-[10px] font-bold text-primary">مرتب‌شده بر اساس کمترین فاصله</span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
            {mosques.map((m: NearbyMosque, idx: number) => {
              const isSel = selectedMosque?.id === m.id;
              const timeVal =
                travelMode === 'walk'
                  ? toFaDigits(m.walkingMinutes) + ' دقیقه پیاده'
                  : travelMode === 'car'
                  ? toFaDigits(m.drivingMinutes) + ' دقیقه با خودرو'
                  : toFaDigits(m.transitMinutes) + ' دقیقه اتوبوس';

              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMosque(m)}
                  className="w-full p-3.5 rounded-2xl border text-right flex items-center justify-between gap-3 transition-all"
                  style={{
                    borderColor: isSel ? theme.primary : theme.border,
                    background: isSel
                      ? 'linear-gradient(90deg, color-mix(in srgb, ' + theme.primary + ' 16%, ' + theme.surface + '), ' + theme.surface + ')'
                      : theme.bg,
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0"
                      style={{
                        background: isSel ? theme.primary : 'color-mix(in srgb, ' + theme.primary + ' 14%, transparent)',
                        color: isSel ? theme.bg : theme.primary,
                      }}
                    >
                      {toFaDigits(idx + 1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-black text-app truncate">{m.name}</p>
                      </div>
                      <p className="text-[11px] text-muted mt-0.5 truncate">{m.address}</p>
                    </div>
                  </div>

                  <div className="text-left shrink-0">
                    <span className="text-xs font-black text-primary block">{formatDist(m.distanceMeters)}</span>
                    <span className="text-[10px] text-accent font-bold block mt-0.5">{timeVal}</span>
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
