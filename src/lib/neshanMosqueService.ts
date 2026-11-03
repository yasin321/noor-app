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
const MIN_DISTANCE_FOR_NEW_GEOCODE_METERS = 15;
const CACHE_TTL_MS = 90 * 1000;

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

export function setNeshanApiKey(_key: string): void {}

export function clearReverseGeocodeCache(): void {
  try {
    localStorage.removeItem(ADDRESS_CACHE_KEY);
  } catch {}
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

export const haversineMeters = calculateHaversineMeters;

function estimateTravelTimes(distanceMeters: number) {
  return {
    walkingMinutes: Math.max(1, Math.round(distanceMeters / 75)),
    drivingMinutes: Math.max(1, Math.round(distanceMeters / 430) + 1),
    transitMinutes: Math.max(2, Math.round(distanceMeters / 270) + 2),
  };
}

function detectCategory(titleStr: string): NearbyMosque['category'] {
  if (titleStr.includes('جامع')) return 'مسجد جامع';
  if (titleStr.includes('حرم') || titleStr.includes('امامزاده')) return 'حرم و زیارتگاه';
  if (titleStr.includes('مصلی') || titleStr.includes('حسینیه')) return 'حسینیه و مصلی';
  return 'مسجد محله';
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

async function fetchWithTimeoutAndRetry(url: string, options: RequestInit, timeoutMs = 3400, retries = 1): Promise<Response> {
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
        3200,
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
      return { formattedAddress: 'مختصات GPS فعال است', usedCache: false, elapsedMs: Math.round(performance.now() - t0) };
    } finally {
      inFlightReverseKey = null;
      inFlightReversePromise = null;
    }
  })();

  return inFlightReversePromise;
}

// بانک آفلاین مساجد مهم شهرهای ایران (فقط مساجد همان شهر کاربر نمایش داده می‌شوند، نه شهرهای دیگر!)
const CURATED_IRAN_MOSQUES: Array<{ name: string; address: string; lat: number; lng: number; category: NearbyMosque['category'] }> = [
  // مشهد مقدس (شامل محله‌های مرکزی، احمدآباد، بلوار رضا، کوهسنگی، سجاد، وکیل‌آباد و حرم)
  { name: 'مسجد الرضا (ع) — بلوار رضا', address: 'مشهد، بلوار احمدآباد، بلوار رضا', lat: 36.2862, lng: 59.5664, category: 'مسجد محله' },
  { name: 'مسجد توفیق — احمدآباد', address: 'مشهد، بلوار احمدآباد، بین ابوذر غفاری و رضا', lat: 36.2888, lng: 59.5685, category: 'مسجد محله' },
  { name: 'مسجد بعثت — بلوار بعثت', address: 'مشهد، بلوار بعثت، تقاطع رضا', lat: 36.2825, lng: 59.5632, category: 'مسجد جامع' },
  { name: 'مسجد المهدی (عج) — کوهسنگی', address: 'مشهد، خیابان کوهسنگی، نزدیک پارک کوهسنگی', lat: 36.2784, lng: 59.5698, category: 'مسجد محله' },
  { name: 'مسجد قبا — خیام', address: 'مشهد، بلوار خیام جنوبی', lat: 36.2985, lng: 59.5542, category: 'مسجد جامع' },
  { name: 'مسجد امام صادق (ع) — بلوار سجاد', address: 'مشهد، بلوار سجاد، چهارراه بزرگمهر', lat: 36.3105, lng: 59.5468, category: 'مسجد جامع' },
  { name: 'مسجد گوهرشاد', address: 'مشهد مقدس، صحن گوهرشاد حرم مطهر', lat: 36.2869, lng: 59.6154, category: 'مسجد جامع' },
  { name: 'حرم مطهر امام رضا (ع)', address: 'مشهد مقدس، فلکه آب', lat: 36.2877, lng: 59.6157, category: 'حرم و زیارتگاه' },
  { name: 'مسجد هفتاد و دو تن', address: 'مشهد مقدس، خیابان خسروی نو', lat: 36.2855, lng: 59.6112, category: 'مسجد جامع' },
  { name: 'مصلی بزرگ امام خمینی مشهد', address: 'مشهد، بلوار مصلی', lat: 36.2768, lng: 59.6382, category: 'حسینیه و مصلی' },
  // تهران
  { name: 'مسجد دانشگاه تهران', address: 'تهران، خیابان انقلاب، خیابان ۱۶ آذر', lat: 35.7025, lng: 51.3956, category: 'مسجد جامع' },
  { name: 'مصلی بزرگ امام خمینی (ره)', address: 'تهران، بزرگراه شهید قاسم سلیمانی', lat: 35.7367, lng: 51.4301, category: 'حسینیه و مصلی' },
  { name: 'مسجد ارک تهران', address: 'تهران، میدان پانزده خرداد', lat: 35.6789, lng: 51.4205, category: 'مسجد جامع' },
  { name: 'حرم حضرت عبدالعظیم حسنی (ع)', address: 'تهران، شهرری، میدان حرم', lat: 35.5861, lng: 51.4342, category: 'حرم و زیارتگاه' },
  // قم، اصفهان، شیراز
  { name: 'حرم مطهر حضرت معصومه (س)', address: 'قم، میدان آستانه', lat: 34.6418, lng: 50.8790, category: 'حرم و زیارتگاه' },
  { name: 'مسجد مقدس جمکران', address: 'قم، بلوار پیامبر اعظم (ص)', lat: 34.5936, lng: 50.9225, category: 'مسجد جامع' },
  { name: 'آستان مقدس شاهچراغ (ع)', address: 'شیراز، میدان احمدی', lat: 29.6095, lng: 52.5435, category: 'حرم و زیارتگاه' },
  { name: 'مسجد جامع عباسی (مسجد امام)', address: 'اصفهان، میدان نقش جهان', lat: 32.6546, lng: 51.6775, category: 'مسجد جامع' },
];

export function getInstantLocalMosques(lat: number, lng: number): NearbyMosque[] {
  const all = CURATED_IRAN_MOSQUES.map((m, idx) => {
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

  // فقط مساجد داخل همان شهر (حداکثر شعاع ۳۵ کیلومتر) نمایش داده شوند تا مساجد تهران در مشهد نیاید!
  const sameCity = all.filter((m) => m.distanceMeters <= 35000);
  return sameCity.length > 0 ? sameCity : all.slice(0, 4);
}

// رادار زنده مساجد محله از نقشه باز جهانی (Overpass Mosque Radar) در شعاع ۴ کیلومتری کاربر
async function fetchOverpassNearbyMosques(lat: number, lng: number): Promise<NearbyMosque[]> {
  try {
    const query = `[out:json][timeout:4];(node["amenity"="place_of_worship"]["religion"="muslim"](around:4000,${lat},${lng});way["amenity"="place_of_worship"]["religion"="muslim"](around:4000,${lat},${lng}););out center 15;`;
    const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);
    const res = await fetchWithTimeoutAndRetry(url, {}, 3500, 0);
    const data = await res.json();
    const elements = Array.isArray(data?.elements) ? data.elements : [];
    return elements
      .map((el: { id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }, idx: number) => {
        const mLat = el.lat ?? el.center?.lat;
        const mLng = el.lon ?? el.center?.lon;
        if (typeof mLat !== 'number' || typeof mLng !== 'number') return null;
        const name = el.tags?.['name:fa'] || el.tags?.name || 'مسجد محله';
        const street = el.tags?.['addr:street'] || el.tags?.['addr:district'] || 'در محله و نزدیکی موقعیت شما';
        const dist = calculateHaversineMeters(lat, lng, mLat, mLng);
        const times = estimateTravelTimes(dist);
        return {
          id: 'osm_' + el.id + '_' + idx,
          name,
          address: street,
          lat: mLat,
          lng: mLng,
          distanceMeters: dist,
          category: detectCategory(name),
          ...times,
        };
      })
      .filter((x: NearbyMosque | null): x is NearbyMosque => x !== null && x.distanceMeters <= 25000)
      .sort((a: NearbyMosque, b: NearbyMosque) => a.distanceMeters - b.distanceMeters);
  } catch {
    return [];
  }
}

export async function searchNearbyMosques(
  lat: number,
  lng: number
): Promise<{ mosques: NearbyMosque[]; userAddress: string; source: 'neshan' | 'osm_iran' | 'curated'; apiResponseMs: number }> {
  const t0 = performance.now();
  const apiKey = getInternalNeshanKey();
  const addressPromise = reverseGeocodeFast(lat, lng);

  // اجرای موازی جستجوی نشان و رادار مساجد محله برای تضمین یافتن نزدیک‌ترین مسجد سر کوچه
  const neshanPromise = (async (): Promise<NearbyMosque[]> => {
    try {
      const searchRes = await fetchWithTimeoutAndRetry(
        'https://api.neshan.org/v1/search?term=' + encodeURIComponent('مسجد') + '&lat=' + lat + '&lng=' + lng,
        { headers: { 'Api-Key': apiKey } },
        3200,
        1
      );
      const data = await searchRes.json();
      const items = Array.isArray(data?.items) ? data.items : [];
      return items
        .filter((it: Record<string, unknown>) => it && typeof it.location === 'object' && it.location !== null)
        .map((it: { title?: string; address?: string; region?: string; location: { y: number; x: number } }, idx: number) => {
          const mLat = Number(it.location.y);
          const mLng = Number(it.location.x);
          const dist = calculateHaversineMeters(lat, lng, mLat, mLng);
          const times = estimateTravelTimes(dist);
          const titleStr = String(it.title || 'مسجد محله');
          return {
            id: 'neshan_' + idx + '_' + dist,
            name: titleStr,
            address: String(it.address || it.region || 'در نزدیکی موقعیت شما'),
            lat: mLat,
            lng: mLng,
            distanceMeters: dist,
            category: detectCategory(titleStr),
            ...times,
          };
        })
        .filter((m: NearbyMosque) => m.distanceMeters <= 25000);
    } catch {
      return [];
    }
  })();

  const [neshanList, osmList, addrInfo] = await Promise.all([
    neshanPromise,
    fetchOverpassNearbyMosques(lat, lng),
    addressPromise,
  ]);

  const combined = [...neshanList, ...osmList, ...getInstantLocalMosques(lat, lng)];
  // حذف مساجد تکراری که در فاصله کمتر از ۸۰ متر از هم هستند و مرتب‌سازی بر اساس کمترین فاصله تا کاربر
  const unique: NearbyMosque[] = [];
  for (const item of combined.sort((a, b) => a.distanceMeters - b.distanceMeters)) {
    const isDup = unique.some((u) => calculateHaversineMeters(u.lat, u.lng, item.lat, item.lng) < 85);
    if (!isDup) unique.push(item);
  }

  const finalMosques = unique.slice(0, 12);
  const elapsed = Math.round(performance.now() - t0);
  return {
    mosques: finalMosques,
    userAddress: addrInfo.formattedAddress,
    source: neshanList.length > 0 ? 'neshan' : osmList.length > 0 ? 'osm_iran' : 'curated',
    apiResponseMs: elapsed,
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
