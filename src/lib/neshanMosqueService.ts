export interface NearbyMosque {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distanceMeters: number;
  walkingMinutes: number;
  drivingMinutes: number;
  transitMinutes: number;
  category: 'مسجد جامع' | 'مسجد محله' | 'حرم و زیارتگاه' | 'حسینیه و مصلی';
}

export interface LocationPerformanceMetrics {
  gpsAcquisitionMs: number;
  apiResponseMs: number;
  usedAddressCache: boolean;
  accuracyMeters: number | null;
  timestampIso: string;
}

const ADDRESS_CACHE_KEY = 'noor_reverse_geocode_cache_v2';
const METRICS_STORAGE_KEY = 'noor_location_perf_metrics_v1';
const MIN_DISTANCE_FOR_NEW_GEOCODE_METERS = 75;
const CACHE_TTL_MS = 15 * 60 * 1000;

// کلید سرویس نشان فقط در لایه داخلی و متغیر محیطی نگهداری می‌شود و هرگز در UI یا لاگ نمایش داده نمی‌شود
function getInternalNeshanKey(): string {
  try {
    const envKey = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_NESHAN_API_KEY;
    if (envKey && envKey.startsWith('service.')) return envKey.trim();
  } catch {}
  return 'service.c2ba51761f214fe3a707e823b50b00c5';
}

export function getNeshanApiKey(): string {
  return getInternalNeshanKey();
}

export function setNeshanApiKey(_key: string): void {
  // Deprecated for security: API tokens are managed internally
}

export function saveLocationMetrics(metrics: LocationPerformanceMetrics): void {
  try {
    localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(metrics));
  } catch {}
}

export function getLastLocationMetrics(): LocationPerformanceMetrics | null {
  try {
    const raw = localStorage.getItem(METRICS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function calculateHaversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function estimateTravelTimes(distanceMeters: number) {
  return {
    walkingMinutes: Math.max(1, Math.round(distanceMeters / 72)),
    drivingMinutes: Math.max(1, Math.round(distanceMeters / 420) + 1),
    transitMinutes: Math.max(2, Math.round(distanceMeters / 260) + 2),
  };
}

interface CachedAddressEntry {
  lat: number;
  lng: number;
  formattedAddress: string;
  cityFa: string;
  neighbourhoodFa: string;
  timestamp: number;
}

function loadCachedAddress(lat: number, lng: number): CachedAddressEntry | null {
  try {
    const raw = localStorage.getItem(ADDRESS_CACHE_KEY);
    if (!raw) return null;
    const parsed: CachedAddressEntry = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) return null;
    const dist = calculateHaversineMeters(lat, lng, parsed.lat, parsed.lng);
    if (dist <= MIN_DISTANCE_FOR_NEW_GEOCODE_METERS && parsed.formattedAddress) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function saveCachedAddress(entry: CachedAddressEntry): void {
  try {
    localStorage.setItem(ADDRESS_CACHE_KEY, JSON.stringify(entry));
  } catch {}
}

async function fetchWithTimeoutAndRetry(url: string, options: RequestInit, timeoutMs = 3200, retries = 1): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) return res;
    } catch (err) {
      clearTimeout(timer);
      if (attempt === retries) throw err;
    }
  }
  throw new Error('Network request timeout');
}

let inFlightReverseKey: string | null = null;
let inFlightReversePromise: Promise<{ formattedAddress: string; usedCache: boolean; elapsedMs: number }> | null = null;

export async function reverseGeocodeFast(lat: number, lng: number): Promise<{ formattedAddress: string; usedCache: boolean; elapsedMs: number }> {
  const cached = loadCachedAddress(lat, lng);
  if (cached) {
    return { formattedAddress: cached.formattedAddress, usedCache: true, elapsedMs: 0 };
  }

  const reqKey = lat.toFixed(4) + ',' + lng.toFixed(4);
  if (inFlightReverseKey === reqKey && inFlightReversePromise) {
    return inFlightReversePromise;
  }

  inFlightReverseKey = reqKey;
  inFlightReversePromise = (async () => {
    const t0 = performance.now();
    const apiKey = getInternalNeshanKey();
    try {
      const res = await fetchWithTimeoutAndRetry(
        'https://api.neshan.org/v5/reverse?lat=' + lat + '&lng=' + lng,
        { headers: { 'Api-Key': apiKey } },
        3000,
        1
      );
      const data = await res.json();
      const city = data.city || data.county || '';
      const hood = data.neighbourhood || data.district || '';
      const route = data.route_name || '';
      const plaque = data.plaque ? 'پلاک ' + data.plaque : '';
      const parts = [city, hood, route, plaque].filter(Boolean);
      const formatted =
        parts.length > 0
          ? parts.join('، ')
          : data.formatted_address || 'موقعیت مکانی دریافت شد';

      saveCachedAddress({
        lat,
        lng,
        formattedAddress: formatted,
        cityFa: city,
        neighbourhoodFa: hood,
        timestamp: Date.now(),
      });
      return { formattedAddress: formatted, usedCache: false, elapsedMs: Math.round(performance.now() - t0) };
    } catch {
      return { formattedAddress: 'مختصات GPS فعال است (بدون نیاز به اینترنت)', usedCache: false, elapsedMs: Math.round(performance.now() - t0) };
    } finally {
      inFlightReverseKey = null;
      inFlightReversePromise = null;
    }
  })();

  return inFlightReversePromise;
}

const CURATED_IRAN_MOSQUES: Array<{ name: string; address: string; lat: number; lng: number; category: NearbyMosque['category'] }> = [
  { name: 'حرم مطهر امام رضا (ع)', address: 'مشهد مقدس، فلکه آب', lat: 36.2877, lng: 59.6157, category: 'حرم و زیارتگاه' },
  { name: 'مسجد گوهرشاد', address: 'مشهد مقدس، صحن گوهرشاد حرم مطهر', lat: 36.2869, lng: 59.6154, category: 'مسجد جامع' },
  { name: 'حرم مطهر حضرت معصومه (س)', address: 'قم، میدان آستانه', lat: 34.6418, lng: 50.8790, category: 'حرم و زیارتگاه' },
  { name: 'مسجد مقدس جمکران', address: 'قم، بلوار پیامبر اعظم (ص)', lat: 34.5936, lng: 50.9225, category: 'مسجد جامع' },
  { name: 'مسجد دانشگاه تهران', address: 'تهران، خیابان انقلاب،خیابان ۱۶ آذر', lat: 35.7025, lng: 51.3956, category: 'مسجد جامع' },
  { name: 'مصلی بزرگ امام خمینی (ره)', address: 'تهران، بزرگراه شهید قاسم سلیمانی', lat: 35.7367, lng: 51.4301, category: 'حسینیه و مصلی' },
  { name: 'آستان مقدس شاهچراغ (ع)', address: 'شیراز، میدان احمدی', lat: 29.6095, lng: 52.5435, category: 'حرم و زیارتگاه' },
  { name: 'مسجد جامع عباسی (مسجد امام)', address: 'اصفهان، میدان نقش جهان', lat: 32.6546, lng: 51.6775, category: 'مسجد جامع' },
];

export function getInstantLocalMosques(lat: number, lng: number): NearbyMosque[] {
  return CURATED_IRAN_MOSQUES.map((m, idx) => {
    const dist = calculateHaversineMeters(lat, lng, m.lat, m.lng);
    const times = estimateTravelTimes(dist);
    return {
      id: 'curated_' + idx,
      name: m.name,
      address: m.address,
      lat: m.lat,
      lng: m.lng,
      distanceMeters: dist,
      category: m.category,
      ...times,
    };
  }).sort((a, b) => a.distanceMeters - b.distanceMeters);
}

export async function searchNearbyMosques(
  lat: number,
  lng: number
): Promise<{ mosques: NearbyMosque[]; userAddress: string; source: 'neshan' | 'osm_iran' | 'curated'; apiResponseMs: number }> {
  const t0 = performance.now();
  const apiKey = getInternalNeshanKey();
  const addressPromise = reverseGeocodeFast(lat, lng);

  try {
    const searchRes = await fetchWithTimeoutAndRetry(
      'https://api.neshan.org/v1/search?term=' + encodeURIComponent('مسجد') + '&lat=' + lat + '&lng=' + lng,
      { headers: { 'Api-Key': apiKey } },
      3200,
      1
    );
    const data = await searchRes.json();
    const items = Array.isArray(data?.items) ? data.items : [];
    const parsed: NearbyMosque[] = items
      .filter((it: Record<string, unknown>) => it && typeof it.location === 'object' && it.location !== null)
      .slice(0, 12)
      .map((it: { title?: string; address?: string; region?: string; location: { y: number; x: number } }, idx: number) => {
        const mLat = Number(it.location.y);
        const mLng = Number(it.location.x);
        const dist = calculateHaversineMeters(lat, lng, mLat, mLng);
        const times = estimateTravelTimes(dist);
        const titleStr = String(it.title || 'مسجد محله');
        const cat: NearbyMosque['category'] = titleStr.includes('جامع')
          ? 'مسجد جامع'
          : titleStr.includes('حرم') || titleStr.includes('امامزاده')
          ? 'حرم و زیارتگاه'
          : titleStr.includes('مصلی') || titleStr.includes('حسینیه')
          ? 'حسینیه و مصلی'
          : 'مسجد محله';
        return {
          id: 'neshan_' + idx + '_' + dist,
          name: titleStr,
          address: String(it.address || it.region || 'در نزدیکی موقعیت شما'),
          lat: mLat,
          lng: mLng,
          distanceMeters: dist,
          category: cat,
          ...times,
        };
      })
      .sort((a: NearbyMosque, b: NearbyMosque) => a.distanceMeters - b.distanceMeters);

    const addrInfo = await addressPromise;
    const elapsed = Math.round(performance.now() - t0);
    if (parsed.length > 0) {
      return { mosques: parsed, userAddress: addrInfo.formattedAddress, source: 'neshan', apiResponseMs: elapsed };
    }
  } catch {
    // Fallback to offline local radar if offline or timeout
  }

  const addrInfo = await addressPromise;
  return {
    mosques: getInstantLocalMosques(lat, lng),
    userAddress: addrInfo.formattedAddress,
    source: 'curated',
    apiResponseMs: Math.round(performance.now() - t0),
  };
}

export async function fetchNeshanExactRoute(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  type: 'car' | 'pedestrian' = 'car'
): Promise<{ durationText: string; distanceText: string; summary: string } | null> {
  try {
    const apiKey = getInternalNeshanKey();
    const url =
      'https://api.neshan.org/v4/direction/no-traffic?type=' +
      type +
      '&origin=' +
      originLat +
      ',' +
      originLng +
      '&destination=' +
      destLat +
      ',' +
      destLng;
    const res = await fetchWithTimeoutAndRetry(url, { headers: { 'Api-Key': apiKey } }, 2800, 0);
    const data = await res.json();
    const leg = data?.routes?.[0]?.legs?.[0];
    if (!leg) return null;
    return {
      durationText: String(leg.duration?.text || ''),
      distanceText: String(leg.distance?.text || ''),
      summary: String(leg.summary || ''),
    };
  } catch {
    return null;
  }
}

export const haversineMeters = calculateHaversineMeters;

export function clearReverseGeocodeCache(): void {
  try {
    localStorage.removeItem('noor_reverse_geocode_cache_v2');
  } catch {}
}
