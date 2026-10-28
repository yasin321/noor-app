import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Navigation, Footprints, Car, Bus, Compass, X, LocateFixed, Check, KeyRound, ExternalLink, Sparkles } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useTheme } from '@/hooks/useTheme';
import { NoorAlarm } from '@/lib/reminderService';
import {
  searchNearbyMosques,
  fetchNeshanExactRoute,
  getNeshanApiKey,
  setNeshanApiKey,
  type NearbyMosque,
} from '@/lib/neshanMosqueService';
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
  const [loading, setLoading] = useState<boolean>(true);
  const [mosques, setMosques] = useState<NearbyMosque[]>([]);
  const [userAddress, setUserAddress] = useState<string>(`محدوده ${cityName}`);
  const [travelMode, setTravelMode] = useState<'walk' | 'car' | 'transit'>('walk');
  const [selectedMosque, setSelectedMosque] = useState<NearbyMosque | null>(null);
  const [routeDetail, setRouteDetail] = useState<{ durationText: string; distanceText: string; summary: string } | null>(null);
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);
  const [apiKeyInput, setApiKeyInput] = useState<string>(() => getNeshanApiKey());
  const [toast, setToast] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const loadNearby = async (lat: number, lng: number) => {
    setLoading(true);
    const res = await searchNearbyMosques(lat, lng);
    setMosques(res.mosques);
    if (res.userAddress && res.userAddress !== 'موقعیت فعلی شما') {
      setUserAddress(res.userAddress);
    }
    if (res.mosques.length > 0) {
      setSelectedMosque(res.mosques[0]);
    }
    setLoading(false);
  };

  const detectLiveGps = async () => {
    setLoading(true);
    showNotice('📍 در حال دریافت موقعیت دقیق GPS شما...');
    if (Capacitor.getPlatform() === 'android' && typeof NoorAlarm.requestAndGetLocation === 'function') {
      try {
        const res = await NoorAlarm.requestAndGetLocation();
        if (res.hasCoords && typeof res.lat === 'number' && typeof res.lng === 'number') {
          setCoords({ lat: res.lat, lng: res.lng });
          await loadNearby(res.lat, res.lng);
          showNotice('✅ نزدیک‌ترین مساجد اطراف موقعیت دقیق شما پیدا شد.');
          return;
        }
      } catch {}
    }

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCoords({ lat, lng });
          void loadNearby(lat, lng);
          showNotice('✅ موقعیت دقیق شما دریافت شد.');
        },
        () => {
          void loadNearby(defaultLat, defaultLng);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      await loadNearby(defaultLat, defaultLng);
    }
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
      mosqueAnnouncement: `فاصله: ${toFaDigits(m.distanceMeters)} متر (${toFaDigits(m.walkingMinutes)} دقیقه پیاده) — ${m.address}`,
    });
    showNotice(`🕌 «${m.name}» به عنوان مسجد منتخب شما در صفحه اول ثبت شد!`);
    onMosqueSelected?.();
  };

  const openInNeshanApp = (m: NearbyMosque) => {
    // لینک استاندارد باز کردن مستقیم مسیریاب نشان، بلد یا گوگل‌مپ روی موبایل
    const neshanUrl = `https://nshn.ir/?lat=${m.lat}&lng=${m.lng}`;
    window.open(neshanUrl, '_blank', 'noopener,noreferrer');
  };

  const openInGoogleMaps = (m: NearbyMosque) => {
    const modeParam = travelMode === 'walk' ? 'walking' : travelMode === 'transit' ? 'transit' : 'driving';
    const gUrl = `https://www.google.com/maps/dir/?api=1&origin=${coords.lat},${coords.lng}&destination=${m.lat},${m.lng}&travelmode=${modeParam}`;
    window.open(gUrl, '_blank', 'noopener,noreferrer');
  };

  const formatDist = (meters: number) => {
    if (meters < 1000) return `${toFaDigits(meters)} متر`;
    return `${toFaDigits((meters / 1000).toFixed(1))} کیلومتر`;
  };

  const node = (
    <div
      className="fixed inset-0 z-[999] overflow-y-auto flex items-center justify-center p-3.5 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.84)', backdropFilter: 'blur(7px)' }}
      dir="rtl"
    >
      <div
        className="w-full max-w-md rounded-3xl p-4 border shadow-2xl my-auto max-h-[92vh] overflow-y-auto"
        style={{ background: theme.surface, borderColor: theme.border }}
      >
        {/* هدر مسجدیاب نشان */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{ background: `color-mix(in srgb, ${theme.primary} 18%, transparent)` }}
            >
              <Navigation size={18} color={theme.primary} />
            </div>
            <div>
              <h2 className="text-base font-black text-app">مسجدیاب و مسیریاب هوشمند نشان</h2>
              <p className="text-[11px] text-muted truncate max-w-[210px]">{userAddress}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowKeyInput((v) => !v)}
              title="تنظیم کلید وب‌سرویس نشان"
              className="p-2 rounded-xl border text-muted"
              style={{ borderColor: theme.border }}
            >
              <KeyRound size={15} color={apiKeyInput ? theme.primary : theme.textMuted} />
            </button>
            <button type="button" onClick={onClose} className="text-muted p-1.5">
              <X size={20} />
            </button>
          </div>
        </div>

        {toast && (
          <div
            className="mb-3 rounded-2xl px-3 py-2.5 text-xs font-bold text-center shadow-lg"
            style={{ background: theme.primary, color: theme.bg }}
          >
            {toast}
          </div>
        )}

        {/* باکس اختیاری وارد کردن کلید API نشان (service.xxx) */}
        {showKeyInput && (
          <div className="card-flat p-3.5 mb-3 space-y-2 border" style={{ borderColor: theme.primary }}>
            <p className="text-xs font-bold text-app">🔑 اتصال به کلید وب‌سرویس نقشه نشان (Neshan API):</p>
            <p className="text-[11px] text-muted leading-relaxed">
              در پنل نشان (platform.neshan.org) یک کلید از تب «سرویس‌ها» (با پیشوند <code>service.</code>) بسازید و اینجا وارد کنید:
            </p>
            <div className="flex gap-1.5">
              <input
                type="text"
                dir="ltr"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="service.xxxxxxxxxxxxxxxxxxxxxxxx"
                className="flex-1 px-3 py-2 rounded-xl text-xs text-app border outline-none font-mono"
                style={{ borderColor: theme.border, background: theme.bg }}
              />
              <button
                type="button"
                onClick={() => {
                  setNeshanApiKey(apiKeyInput);
                  setShowKeyInput(false);
                  void loadNearby(coords.lat, coords.lng);
                  showNotice('✅ کلید وب‌سرویس نشان ذخیره و استعلام جدید انجام شد!');
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold"
                style={{ background: theme.primary, color: theme.bg }}
              >
                ذخیره
              </button>
            </div>
          </div>
        )}

        {/* انتخاب نوع وسیله نقلیه برای رسیدن به نماز اول وقت (پیاده / خودرو / اتوبوس و مترو) */}
        <div className="mb-3.5">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-xs font-bold text-muted">نحوه حرکت شما به سمت مسجد:</span>
            <button
              type="button"
              onClick={() => void detectLiveGps()}
              className="text-[11px] font-bold flex items-center gap-1"
              style={{ color: theme.primary }}
            >
              <LocateFixed size={12} /> بروزرسانی GPS
            </button>
          </div>

          <div
            className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl"
            style={{ background: theme.bg, border: `1px solid ${theme.border}` }}
          >
            {[
              { id: 'walk' as const, label: '🚶 پیاده', icon: Footprints },
              { id: 'car' as const, label: '🚗 با خودرو', icon: Car },
              { id: 'transit' as const, label: '🚌 اتوبوس/مترو', icon: Bus },
            ].map((m) => {
              const active = travelMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setTravelMode(m.id)}
                  className="py-2 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: active ? theme.primary : 'transparent',
                    color: active ? theme.bg : theme.textMuted,
                  }}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* کارت مسجد انتخاب‌شده + رادار فاصله و دکمه مسیریابی مستقیم */}
        {selectedMosque && (
          <div
            className="rounded-3xl p-4 mb-3.5 border space-y-3"
            style={{
              background: `radial-gradient(circle at top right, color-mix(in srgb, ${theme.primary} 18%, transparent), ${theme.bg})`,
              borderColor: theme.primary,
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span
                  className="text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block mb-1"
                  style={{ background: `color-mix(in srgb, ${theme.accent} 18%, transparent)`, color: theme.accent }}
                >
                  ✨ نزدیک‌ترین پیشنهاد: {selectedMosque.category}
                </span>
                <h3 className="text-base font-black text-app">{selectedMosque.name}</h3>
                <p className="text-xs text-muted mt-0.5 leading-relaxed">{selectedMosque.address}</p>
              </div>
              <div className="text-left shrink-0">
                <span className="text-sm font-black text-primary block">{formatDist(selectedMosque.distanceMeters)}</span>
                <span className="text-[10px] text-muted">فاصله مستقیم</span>
              </div>
            </div>

            {/* زمان رسیدن به تفکیک پیاده / خودرو / اتوبوس */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div
                className="p-2 rounded-2xl border"
                style={{
                  borderColor: travelMode === 'walk' ? theme.primary : theme.border,
                  background: travelMode === 'walk' ? `color-mix(in srgb, ${theme.primary} 14%, transparent)` : theme.surface,
                }}
              >
                <span className="text-[10px] text-muted block">🚶 پیاده‌روی</span>
                <strong className="text-xs font-black text-app">{toFaDigits(selectedMosque.walkingMinutes)} دقیقه</strong>
              </div>
              <div
                className="p-2 rounded-2xl border"
                style={{
                  borderColor: travelMode === 'car' ? theme.primary : theme.border,
                  background: travelMode === 'car' ? `color-mix(in srgb, ${theme.primary} 14%, transparent)` : theme.surface,
                }}
              >
                <span className="text-[10px] text-muted block">🚗 با ماشین</span>
                <strong className="text-xs font-black text-app">
                  {routeDetail && travelMode === 'car' ? routeDetail.durationText : `${toFaDigits(selectedMosque.drivingMinutes)} دقیقه`}
                </strong>
              </div>
              <div
                className="p-2 rounded-2xl border"
                style={{
                  borderColor: travelMode === 'transit' ? theme.primary : theme.border,
                  background: travelMode === 'transit' ? `color-mix(in srgb, ${theme.primary} 14%, transparent)` : theme.surface,
                }}
              >
                <span className="text-[10px] text-muted block">🚌 حمل‌ونقل عمومی</span>
                <strong className="text-xs font-black text-app">{toFaDigits(selectedMosque.transitMinutes)} دقیقه</strong>
              </div>
            </div>

            {routeDetail?.summary && (
              <p className="text-[11px] text-accent font-bold text-center">
                🛣️ مسیر پیشنهادی نشان: {routeDetail.summary} ({routeDetail.distanceText})
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => openInNeshanApp(selectedMosque)}
                className="py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
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
                <span>نقشه گوگل / بلد</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleSetAsMyMosque(selectedMosque)}
              className="w-full py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1"
              style={{ background: `color-mix(in srgb, ${theme.primary} 14%, transparent)`, color: theme.primary }}
            >
              <Sparkles size={13} />
              <span>انتخاب به عنوان مسجد ثابت من در صفحه اول</span>
            </button>
          </div>
        )}

        {/* لیست سایر مساجد نزدیک */}
        <div>
          <p className="text-xs font-bold text-muted mb-2 px-1">
            {loading ? 'در حال اسکن مساجد اطراف شما...' : `مساجد نزدیک به شما (${toFaDigits(mosques.length)} مسجد):`}
          </p>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
            {mosques.map((m) => {
              const isSel = selectedMosque?.id === m.id;
              const timeVal =
                travelMode === 'walk'
                  ? `${toFaDigits(m.walkingMinutes)}د پیاده`
                  : travelMode === 'car'
                  ? `${toFaDigits(m.drivingMinutes)}د خودرو`
                  : `${toFaDigits(m.transitMinutes)}د اتوبوس`;

              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMosque(m)}
                  className="w-full card-flat p-3 text-right flex items-center justify-between gap-2 transition-all"
                  style={{
                    borderColor: isSel ? theme.primary : theme.border,
                    background: isSel ? `color-mix(in srgb, ${theme.primary} 12%, ${theme.surface})` : theme.surface,
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={14} color={isSel ? theme.primary : theme.textMuted} className="shrink-0" />
                      <p className="text-xs font-bold text-app truncate">{m.name}</p>
                    </div>
                    <p className="text-[11px] text-muted mt-0.5 truncate">{m.address}</p>
                  </div>
                  <div className="text-left shrink-0">
                    <span className="text-xs font-black text-primary block">{formatDist(m.distanceMeters)}</span>
                    <span className="text-[10px] text-accent font-bold">{timeVal}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-4 py-2.5 rounded-2xl text-xs font-bold border"
          style={{ borderColor: theme.border, color: theme.text }}
        >
          <Check size={14} className="inline ml-1" /> بستن مسجدیاب
        </button>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(node, document.body) : node;
}
