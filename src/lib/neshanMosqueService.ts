export type MosqueProvider = 'osm_map' | 'photon' | 'nominatim' | 'osm' | 'neshan' | 'google' | 'curated' | 'user';

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
  category: 'مسجد جامع' | 'مسجد محله' | 'نمازخانه' | 'حرم و زیارتگاه' | 'حسینیه و مصلی';
  provider?: MosqueProvider;
  providers?: MosqueProvider[];
  providerId?: string;
  fetchedAt?: number;
}

export interface MosqueSourceDiag {
  count: number;
  success: boolean;
  durationMs: number;
  statusCode?: number;
}

export interface MosqueSearchDiagnostics {
  center: { lat: number; lng: number };
  radiusMeters: number;
  usedCache: boolean;
  sources: {
    osmMap: MosqueSourceDiag;
    photon: MosqueSourceDiag;
    nominatim: MosqueSourceDiag;
    osm: MosqueSourceDiag;
    neshan: MosqueSourceDiag;
    google: MosqueSourceDiag;
    local: MosqueSourceDiag;
  };
  totalBeforeDedup: number;
  totalAfterDedup: number;
  totalAfterRadiusFilter: number;
  removedDuplicates: number;
  discardedOutOfRadius: number;
}

export interface LocationPerformanceMetrics {
  gpsAcquisitionMs: number;
  apiResponseMs: number;
  usedAddressCache: boolean;
  accuracyMeters: number | null;
  timestampIso: string;
}

const ADDRESS_CACHE_KEY = 'noor_reverse_geocode_cache_v5';
const MOSQUE_CACHE_KEY = 'noor_mosque_discovery_cache_v3';
const USER_MOSQUES_KEY = 'noor_user_suggested_mosques_v1';
const METRICS_STORAGE_KEY = 'noor_location_perf_metrics_v1';
const GOOGLE_MAPS_KEY_STORAGE = 'noor_google_maps_api_key_v1';

interface CachedAddressEntry {
  lat: number;
  lng: number;
  formattedAddress: string;
  savedAt: number;
}

interface CachedMosqueSearchEntry {
  lat: number;
  lng: number;
  radiusMeters: number;
  mosques: NearbyMosque[];
  userAddress: string;
  source: 'neshan' | 'osm_iran' | 'google' | 'curated';
  diagnostics: MosqueSearchDiagnostics;
  savedAt: number;
}

export interface UserSuggestedMosque {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category: NearbyMosque['category'];
  createdAt: number;
}

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

export function getGoogleMapsApiKey(): string {
  try {
    return localStorage.getItem(GOOGLE_MAPS_KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

export function setGoogleMapsApiKey(key: string): void {
  try {
    localStorage.setItem(GOOGLE_MAPS_KEY_STORAGE, key.trim());
  } catch {}
}

export function clearReverseGeocodeCache(): void {
  try {
    localStorage.removeItem(ADDRESS_CACHE_KEY);
    localStorage.removeItem('noor_reverse_geocode_cache_v4_multi');
    localStorage.removeItem('noor_reverse_geocode_cache_v3_exact');
    localStorage.removeItem('noor_reverse_geocode_cache_v2');
  } catch {}
}

export function clearMosqueDiscoveryCache(): void {
  try {
    localStorage.removeItem(MOSQUE_CACHE_KEY);
    localStorage.removeItem('noor_mosque_discovery_cache_v2');
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

export function getUserSuggestedMosques(): UserSuggestedMosque[] {
  try {
    const raw = localStorage.getItem(USER_MOSQUES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveUserSuggestedMosque(input: {
  name: string;
  address: string;
  lat: number;
  lng: number;
  category: NearbyMosque['category'];
}): UserSuggestedMosque {
  const existing = getUserSuggestedMosques();
  const entry: UserSuggestedMosque = {
    id: 'user_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    name: input.name.trim(),
    address: input.address.trim() || 'ثبت‌شده توسط کاربر روی نقشه',
    lat: input.lat,
    lng: input.lng,
    category: input.category,
    createdAt: Date.now(),
  };
  try {
    localStorage.setItem(USER_MOSQUES_KEY, JSON.stringify([entry, ...existing].slice(0, 100)));
    clearMosqueDiscoveryCache();
  } catch {}
  return entry;
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

export function normalizePersianMosqueName(raw: string): string {
  const faDigits: Record<string, string> = {
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  };
  return String(raw || '')
    .replace(/[۰-۹٠-٩]/g, (d) => faDigits[d] || d)
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/[يى]/g, 'ی')
    .replace(/[كک]/g, 'ک')
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ؤ]/g, 'و')
    .replace(/[ة]/g, 'ه')
    .replace(/[\u200c\u200d\s\-_ـ—–.,،:؛/\\]+/g, '')
    .trim()
    .toLowerCase();
}

function estimateTravelTimes(distanceMeters: number) {
  return {
    walkingMinutes: Math.max(1, Math.round(distanceMeters / 75)),
    drivingMinutes: Math.max(1, Math.round(distanceMeters / 430) + 1),
    transitMinutes: Math.max(2, Math.round(distanceMeters / 270) + 2),
  };
}

function detectCategory(titleStr: string): NearbyMosque['category'] {
  const t = titleStr || '';
  if (t.includes('جامع')) return 'مسجد جامع';
  if (t.includes('نمازخانه') || t.toLowerCase().includes('prayer room')) return 'نمازخانه';
  if (t.includes('حرم') || t.includes('امامزاده') || t.includes('آستان')) return 'حرم و زیارتگاه';
  if (t.includes('مصلی') || t.includes('مصلای') || t.includes('حسینیه') || t.includes('حسينيه') || t.includes('تکیه') || t.includes('مهدیه')) {
    return 'حسینیه و مصلی';
  }
  return 'مسجد محله';
}

function isMosqueLikeTitle(titleStr: string): boolean {
  return /مسجد|حسینیه|حسينيه|مصلی|مصلي|مصلا|نمازخانه|حرم|امامزاده|آستان|مهدیه|مهديه|تکیه|تكيه|mosque|masjid|musalla|prayer/i.test(
    titleStr || ''
  );
}

class HttpStatusError extends Error {
  status: number;
  constructor(status: number) {
    super('HTTP ' + status);
    this.status = status;
  }
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 4500): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) return res;
    throw new HttpStatusError(res.status);
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

function metersToLatLngDelta(lat: number, radiusMeters: number): { dLat: number; dLng: number } {
  const dLat = radiusMeters / 111320;
  const cosLat = Math.max(0.2, Math.cos((lat * Math.PI) / 180));
  const dLng = radiusMeters / (111320 * cosLat);
  return { dLat, dLng };
}

function readAddressCache(lat: number, lng: number): string | null {
  try {
    const raw = localStorage.getItem(ADDRESS_CACHE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CachedAddressEntry;
    if (!entry || typeof entry.lat !== 'number' || typeof entry.lng !== 'number') return null;
    if (Date.now() - entry.savedAt > 10 * 60 * 1000) return null;
    if (calculateHaversineMeters(lat, lng, entry.lat, entry.lng) <= 35) {
      return entry.formattedAddress;
    }
  } catch {}
  return null;
}

function writeAddressCache(lat: number, lng: number, formattedAddress: string): void {
  try {
    const entry: CachedAddressEntry = { lat, lng, formattedAddress, savedAt: Date.now() };
    localStorage.setItem(ADDRESS_CACHE_KEY, JSON.stringify(entry));
  } catch {}
}

export function readCachedMosqueSearch(
  lat: number,
  lng: number,
  radiusMeters: number
): CachedMosqueSearchEntry | null {
  try {
    const raw = localStorage.getItem(MOSQUE_CACHE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CachedMosqueSearchEntry;
    if (!entry || !Array.isArray(entry.mosques) || entry.mosques.length === 0) return null;
    if (Date.now() - entry.savedAt > 5 * 60 * 1000) return null;
    if (entry.radiusMeters !== radiusMeters) return null;
    if (calculateHaversineMeters(lat, lng, entry.lat, entry.lng) <= 50) {
      return entry;
    }
  } catch {}
  return null;
}

function writeCachedMosqueSearch(entry: CachedMosqueSearchEntry): void {
  try {
    if (entry.mosques.length === 0) return;
    localStorage.setItem(MOSQUE_CACHE_KEY, JSON.stringify(entry));
  } catch {}
}

async function reverseGeocodeNominatim(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=fa`;
    const res = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } }, 3400);
    const data = await res.json();
    const addr = data?.address || {};
    const city = addr.city || addr.town || addr.municipality || addr.state || '';
    const suburb = addr.suburb || addr.neighbourhood || addr.quarter || addr.district || '';
    const road = addr.road || addr.pedestrian || addr.residential || '';
    const house = addr.house_number ? 'پلاک ' + addr.house_number : '';
    const amenity = data?.name && data.name !== road ? data.name : '';
    const parts = [city, suburb, road, amenity, house].filter(Boolean);
    if (parts.length >= 2) return parts.join('، ');
    if (data?.display_name) {
      return String(data.display_name).split('،').slice(0, 4).join('، ').trim();
    }
    return null;
  } catch {
    return null;
  }
}

async function reverseGeocodeNeshan(lat: number, lng: number): Promise<string | null> {
  try {
    const apiKey = getInternalNeshanKey();
    const res = await fetchWithTimeout(
      `https://api.neshan.org/v5/reverse?lat=${lat}&lng=${lng}`,
      { headers: { 'Api-Key': apiKey } },
      3200
    );
    const data = await res.json();
    const city = (data.city || '').trim();
    const hood = (data.neighbourhood || '').trim();
    const route = (data.route_name || '').trim();
    const fullFormatted = String(data.formatted_address || '')
      .replace(/بخش مرکزی شهرستان\s+[^،,]+[,،]?\s*/g, '')
      .replace(/شهرستان\s+[^،,]+[,،]?\s*/g, '')
      .trim();
    if (fullFormatted && fullFormatted.length > 5) return fullFormatted;
    const parts = [city, hood, route].filter(Boolean);
    return parts.length > 0 ? parts.join('، ') : null;
  } catch {
    return null;
  }
}

async function reverseGeocodeGoogle(lat: number, lng: number): Promise<string | null> {
  const gKey = getGoogleMapsApiKey();
  if (!gKey) return null;
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=fa&key=${encodeURIComponent(gKey)}`;
    const res = await fetchWithTimeout(url, {}, 3400);
    const data = await res.json();
    const first = data?.results?.[0]?.formatted_address;
    return first ? String(first) : null;
  } catch {
    return null;
  }
}

export async function reverseGeocodeFast(
  lat: number,
  lng: number,
  nativeFallback?: string,
  forceRefresh = false
): Promise<{ formattedAddress: string; usedCache: boolean; elapsedMs: number }> {
  const t0 = performance.now();
  if (!forceRefresh) {
    const cached = readAddressCache(lat, lng);
    if (cached) {
      return { formattedAddress: cached, usedCache: true, elapsedMs: Math.round(performance.now() - t0) };
    }
  }

  const [neshanAddr, osmAddr, googleAddr] = await Promise.all([
    reverseGeocodeNeshan(lat, lng),
    reverseGeocodeNominatim(lat, lng),
    reverseGeocodeGoogle(lat, lng),
  ]);

  let best = googleAddr || '';
  if (!best) {
    if (osmAddr && neshanAddr) {
      best = osmAddr.length >= neshanAddr.length ? osmAddr : neshanAddr;
    } else {
      best = neshanAddr || osmAddr || nativeFallback || `مختصات دقیق: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  }

  if (best && !best.startsWith('مختصات دقیق:')) {
    writeAddressCache(lat, lng, best);
  }

  return {
    formattedAddress: best,
    usedCache: false,
    elapsedMs: Math.round(performance.now() - t0),
  };
}

export async function geocodeSearchQuery(
  query: string,
  biasLat = 35.6892,
  biasLng = 51.3890
): Promise<Array<{ title: string; address: string; lat: number; lng: number }>> {
  const q = query.trim();
  if (!q) return [];
  const results: Array<{ title: string; address: string; lat: number; lng: number }> = [];

  const photonJob = (async () => {
    try {
      const res = await fetchWithTimeout(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lat=${biasLat}&lon=${biasLng}&limit=6`,
        {},
        3500
      );
      const data = await res.json();
      for (const f of (data?.features || []).slice(0, 6)) {
        const coords = f?.geometry?.coordinates;
        if (!Array.isArray(coords) || coords.length < 2) continue;
        const p = f.properties || {};
        results.push({
          title: String(p.name || p.street || q),
          address: [p.city, p.district, p.street].filter(Boolean).join('، '),
          lat: Number(coords[1]),
          lng: Number(coords[0]),
        });
      }
    } catch {}
  })();

  const osmJob = (async () => {
    try {
      const res = await fetchWithTimeout(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&limit=5&accept-language=fa`,
        {},
        3500
      );
      const data = await res.json();
      for (const it of (Array.isArray(data) ? data : []).slice(0, 5)) {
        if (it?.lat && it?.lon) {
          results.push({
            title: String(it.name || it.display_name?.split('،')[0] || q),
            address: String(it.display_name || ''),
            lat: Number(it.lat),
            lng: Number(it.lon),
          });
        }
      }
    } catch {}
  })();

  const neshanJob = (async () => {
    try {
      const apiKey = getInternalNeshanKey();
      const res = await fetchWithTimeout(
        `https://api.neshan.org/v1/search?term=${encodeURIComponent(q)}&lat=${biasLat}&lng=${biasLng}`,
        { headers: { 'Api-Key': apiKey } },
        3200
      );
      const data = await res.json();
      for (const it of (data?.items || []).slice(0, 5)) {
        if (it?.location?.y && it?.location?.x) {
          results.push({
            title: String(it.title || q),
            address: String(it.address || it.region || ''),
            lat: Number(it.location.y),
            lng: Number(it.location.x),
          });
        }
      }
    } catch {}
  })();

  await Promise.all([photonJob, osmJob, neshanJob]);
  return results.slice(0, 8);
}

const CURATED_IRAN_MOSQUES: Array<{ name: string; address: string; lat: number; lng: number; category: NearbyMosque['category'] }> = [
  { name: 'مسجد المنتظر (عج) — ارشاد / پیامبر اعظم', address: 'مشهد، بلوار ارشاد / بزرگراه پیامبر اعظم، نزدیک فردوسی و آزادی', lat: 36.3312, lng: 59.5485, category: 'مسجد جامع' },
  { name: 'مسجد باباغدیر', address: 'مشهد، محدوده باباغدیر / بلوار فردوسی و قرنی', lat: 36.3195, lng: 59.5718, category: 'مسجد محله' },
  { name: 'مسجد صادقیه — بلوار فردوسی', address: 'مشهد، بلوار فردوسی، میدان فردوسی', lat: 36.3242, lng: 59.5662, category: 'مسجد جامع' },
  { name: 'مسجد صاحب‌الزمان (عج) — مهدی‌آباد', address: 'مشهد، بلوار فردوسی، خیابان نوربخش', lat: 36.3219, lng: 59.5614, category: 'مسجد محله' },
  { name: 'مسجد المهدی (عج) — بلوار فردوسی', address: 'مشهد، بلوار فردوسی، نزدیک فردوسی ۲ و نوربخش', lat: 36.3228, lng: 59.5635, category: 'مسجد محله' },
  { name: 'مسجد الجواد (ع) — فرامرز عباسی', address: 'مشهد، بلوار فردوسی، چهارراه فرامرز عباسی', lat: 36.3204, lng: 59.5558, category: 'مسجد جامع' },
  { name: 'مسجد امام علی (ع) — بلوار جانباز', address: 'مشهد، بلوار جانباز، نزدیک مهدی‌آباد و فردوسی', lat: 36.3264, lng: 59.5612, category: 'مسجد جامع' },
  { name: 'مسجد قبا — بلوار خیام', address: 'مشهد، بلوار خیام شمالی، نزدیک فردوسی', lat: 36.3168, lng: 59.5648, category: 'مسجد جامع' },
  { name: 'مسجد امام سجاد (ع) — بلوار سجاد', address: 'مشهد، بلوار سجاد، چهارراه بهارستان', lat: 36.3145, lng: 59.5510, category: 'مسجد جامع' },
  { name: 'مسجد الرضا (ع) — بلوار رضا', address: 'مشهد، بلوار احمدآباد، بلوار رضا', lat: 36.2862, lng: 59.5664, category: 'مسجد محله' },
  { name: 'مسجد گوهرشاد', address: 'مشهد مقدس، صحن گوهرشاد حرم مطهر', lat: 36.2869, lng: 59.6154, category: 'مسجد جامع' },
  { name: 'حرم مطهر امام رضا (ع)', address: 'مشهد مقدس، فلکه آب', lat: 36.2877, lng: 59.6157, category: 'حرم و زیارتگاه' },
  { name: 'مسجد دانشگاه تهران', address: 'تهران، خیابان انقلاب، خیابان ۱۶ آذر', lat: 35.7025, lng: 51.3956, category: 'مسجد جامع' },
  { name: 'مصلی بزرگ امام خمینی (ره)', address: 'تهران، بزرگراه شهید قاسم سلیمانی', lat: 35.7367, lng: 51.4301, category: 'حسینیه و مصلی' },
  { name: 'حرم مطهر حضرت معصومه (س)', address: 'قم، میدان آستانه', lat: 34.6418, lng: 50.8790, category: 'حرم و زیارتگاه' },
  { name: 'مسجد مقدس جمکران', address: 'قم، بلوار پیامبر اعظم (ص)', lat: 34.5936, lng: 50.9225, category: 'مسجد جامع' },
  { name: 'آستان مقدس شاهچراغ (ع)', address: 'شیراز، میدان احمدی', lat: 29.6095, lng: 52.5435, category: 'حرم و زیارتگاه' },
  { name: 'مسجد جامع عباسی (مسجد امام)', address: 'اصفهان، میدان نقش جهان', lat: 32.6546, lng: 51.6775, category: 'مسجد جامع' },
];

export function getInstantLocalMosques(lat: number, lng: number, radiusMeters = 5000): NearbyMosque[] {
  const now = Date.now();
  const userEntries: NearbyMosque[] = getUserSuggestedMosques().map((m) => {
    const dist = calculateHaversineMeters(lat, lng, m.lat, m.lng);
    return {
      id: m.id,
      name: m.name,
      address: m.address,
      lat: m.lat,
      lng: m.lng,
      distanceMeters: dist,
      category: m.category,
      provider: 'user',
      providers: ['user'],
      providerId: m.id,
      fetchedAt: m.createdAt,
      ...estimateTravelTimes(dist),
    };
  });

  const curatedEntries: NearbyMosque[] = CURATED_IRAN_MOSQUES.map((m, idx) => {
    const dist = calculateHaversineMeters(lat, lng, m.lat, m.lng);
    return {
      id: 'curated_' + idx,
      name: m.name,
      address: m.address,
      lat: m.lat,
      lng: m.lng,
      distanceMeters: dist,
      category: m.category,
      provider: 'curated',
      providers: ['curated'],
      providerId: 'curated_' + idx,
      fetchedAt: now,
      ...estimateTravelTimes(dist),
    };
  });

  return [...userEntries, ...curatedEntries]
    .filter((m) => m.distanceMeters <= radiusMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}

// =========================================================================
// لایه ۱ (هم‌تراز ۱۰۰٪ با تایل‌های نقشه): رادار مستقیم OSM Map API 0.6
// هر مسجدی که روی نقشه محله کشیده شده (node یا way) را بدون وابستگی به Overpass می‌خواند
// =========================================================================
async function fetchOsmDirectMapMosques(
  lat: number,
  lng: number,
  radiusMeters: number
): Promise<{ items: NearbyMosque[]; success: boolean; durationMs: number; statusCode?: number }> {
  const t0 = performance.now();
  const now = Date.now();
  const boxRadii = [Math.min(380, Math.max(280, radiusMeters)), 220];
  let lastCode: number | undefined;

  for (const boxR of boxRadii) {
    const { dLat, dLng } = metersToLatLngDelta(lat, boxR);
    const minLng = (lng - dLng).toFixed(6);
    const minLat = (lat - dLat).toFixed(6);
    const maxLng = (lng + dLng).toFixed(6);
    const maxLat = (lat + dLat).toFixed(6);
    const url = `https://api.openstreetmap.org/api/0.6/map.json?bbox=${minLng},${minLat},${maxLng},${maxLat}`;

    try {
      const res = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } }, 5500);
      const data = await res.json();
      const elements = Array.isArray(data?.elements) ? data.elements : [];

      const nodeMap = new Map<number, { lat: number; lon: number }>();
      for (const el of elements) {
        if (el.type === 'node' && typeof el.lat === 'number' && typeof el.lon === 'number') {
          nodeMap.set(el.id, { lat: el.lat, lon: el.lon });
        }
      }

      const items: NearbyMosque[] = [];
      for (const el of elements) {
        const tags = el.tags as Record<string, string> | undefined;
        if (!tags) continue;

        const amenity = String(tags.amenity || '').toLowerCase();
        const building = String(tags.building || '').toLowerCase();
        const religion = String(tags.religion || '').toLowerCase();
        const rawName = String(tags['name:fa'] || tags.name || tags.official_name || '').trim();
        const isNonMuslim = religion !== '' && religion !== 'muslim' && religion !== 'islam';

        const isMosque =
          !isNonMuslim &&
          (amenity === 'place_of_worship' || building === 'mosque' || isMosqueLikeTitle(rawName));
        if (!isMosque) continue;

        let mLat: number | null = null;
        let mLng: number | null = null;
        if (el.type === 'node' && typeof el.lat === 'number' && typeof el.lon === 'number') {
          mLat = el.lat;
          mLng = el.lon;
        } else if (el.type === 'way' && Array.isArray(el.nodes) && el.nodes.length > 0) {
          let sumLat = 0;
          let sumLng = 0;
          let cnt = 0;
          for (const nid of el.nodes as number[]) {
            const nc = nodeMap.get(nid);
            if (nc) {
              sumLat += nc.lat;
              sumLng += nc.lon;
              cnt++;
            }
          }
          if (cnt > 0) {
            mLat = sumLat / cnt;
            mLng = sumLng / cnt;
          }
        }
        if (mLat === null || mLng === null) continue;

        const name = rawName || 'مسجد محله';
        const street =
          [tags['addr:neighbourhood'], tags['addr:suburb'], tags['addr:street'], tags['addr:full'], tags['addr:Full']]
            .filter(Boolean)
            .join('، ') || 'ثبت‌شده روی نقشه محله شما';
        const dist = calculateHaversineMeters(lat, lng, mLat, mLng);
        const providerId = `osm_${el.type}_${el.id}`;
        items.push({
          id: providerId,
          providerId,
          provider: 'osm_map',
          providers: ['osm_map'],
          fetchedAt: now,
          name,
          address: street,
          lat: mLat,
          lng: mLng,
          distanceMeters: dist,
          category: detectCategory(name),
          ...estimateTravelTimes(dist),
        });
      }

      return {
        items: items.sort((a, b) => a.distanceMeters - b.distanceMeters),
        success: true,
        durationMs: Math.round(performance.now() - t0),
      };
    } catch (err) {
      if (err instanceof HttpStatusError) lastCode = err.status;
    }
  }

  return { items: [], success: false, durationMs: Math.round(performance.now() - t0), statusCode: lastCode };
}

// =========================================================================
// لایه ۲ (فوق‌سریع و تاییدشده): Photon (Komoot OSM Search Engine)
// =========================================================================
async function fetchPhotonNearbyMosques(
  lat: number,
  lng: number,
  radiusMeters: number
): Promise<{ items: NearbyMosque[]; success: boolean; durationMs: number }> {
  const t0 = performance.now();
  const now = Date.now();
  const { dLat, dLng } = metersToLatLngDelta(lat, Math.max(radiusMeters, 800));
  const bbox = `${(lng - dLng).toFixed(5)},${(lat - dLat).toFixed(5)},${(lng + dLng).toFixed(5)},${(lat + dLat).toFixed(5)}`;
  const terms = ['مسجد', 'حسینیه', 'نمازخانه', 'مصلی'];
  const collected: NearbyMosque[] = [];
  let anySuccess = false;

  await Promise.all(
    terms.map(async (term, tIdx) => {
      try {
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(term)}&lat=${lat}&lon=${lng}&bbox=${bbox}&limit=40`;
        const res = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } }, 4200);
        const data = await res.json();
        anySuccess = true;
        const features = Array.isArray(data?.features) ? data.features : [];
        for (const [idx, f] of features.entries()) {
          const coords = f?.geometry?.coordinates;
          if (!Array.isArray(coords) || coords.length < 2) continue;
          const mLng = Number(coords[0]);
          const mLat = Number(coords[1]);
          if (Number.isNaN(mLat) || Number.isNaN(mLng)) continue;
          const p = f.properties || {};
          const name = String(p.name || '').trim();
          const isWorship = p.osm_key === 'amenity' && p.osm_value === 'place_of_worship';
          if (!isWorship && !isMosqueLikeTitle(name)) continue;

          const dist = calculateHaversineMeters(lat, lng, mLat, mLng);
          if (dist > radiusMeters * 1.25) continue;

          const osmTypeWord = p.osm_type === 'N' ? 'node' : p.osm_type === 'W' ? 'way' : p.osm_type === 'R' ? 'relation' : 'el';
          const providerId = p.osm_id ? `osm_${osmTypeWord}_${p.osm_id}` : `photon_${tIdx}_${idx}_${dist}`;
          const addrParts = [p.city, p.district, p.locality, p.street].filter(Boolean);
          const cleanName = name || 'مسجد محله';
          collected.push({
            id: providerId,
            providerId,
            provider: 'photon',
            providers: ['photon'],
            fetchedAt: now,
            name: cleanName,
            address: addrParts.length > 0 ? addrParts.join('، ') : 'در نزدیکی موقعیت شما',
            lat: mLat,
            lng: mLng,
            distanceMeters: dist,
            category: detectCategory(cleanName),
            ...estimateTravelTimes(dist),
          });
        }
      } catch {}
    })
  );

  return {
    items: collected,
    success: anySuccess,
    durationMs: Math.round(performance.now() - t0),
  };
}

// =========================================================================
// لایه ۳: Nominatim Viewbox (تاییدشده روی شبکه موبایل ایران)
// =========================================================================
async function fetchNominatimViewboxMosques(
  lat: number,
  lng: number,
  radiusMeters: number
): Promise<{ items: NearbyMosque[]; success: boolean; durationMs: number }> {
  const t0 = performance.now();
  const now = Date.now();
  const { dLat, dLng } = metersToLatLngDelta(lat, Math.max(radiusMeters, 700));
  const vbox = `${(lng - dLng).toFixed(5)},${(lat + dLat).toFixed(5)},${(lng + dLng).toFixed(5)},${(lat - dLat).toFixed(5)}`;
  const terms = ['مسجد', 'حسینیه'];
  const collected: NearbyMosque[] = [];
  let anySuccess = false;

  await Promise.all(
    terms.map(async (term, tIdx) => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(term)}&viewbox=${vbox}&bounded=1&limit=35&accept-language=fa`;
        const res = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } }, 4200);
        const data = await res.json();
        anySuccess = true;
        for (const [idx, item] of (Array.isArray(data) ? data : []).entries()) {
          const mLat = Number(item.lat);
          const mLng = Number(item.lon);
          if (Number.isNaN(mLat) || Number.isNaN(mLng)) continue;
          const name = String(item.name || item.display_name?.split('،')[0] || '').trim();
          const isWorship = item.class === 'amenity' && item.type === 'place_of_worship';
          if (!isWorship && !isMosqueLikeTitle(name)) continue;

          const dist = calculateHaversineMeters(lat, lng, mLat, mLng);
          if (dist > radiusMeters * 1.2) continue;

          const providerId =
            item.osm_type && item.osm_id ? `osm_${item.osm_type}_${item.osm_id}` : `nom_${tIdx}_${idx}_${dist}`;
          const cleanName = name || 'مسجد محله';
          const shortAddr = String(item.display_name || '')
            .split('،')
            .slice(1, 4)
            .join('، ')
            .trim();
          collected.push({
            id: providerId,
            providerId,
            provider: 'nominatim',
            providers: ['nominatim'],
            fetchedAt: now,
            name: cleanName,
            address: shortAddr || 'در نزدیکی موقعیت شما',
            lat: mLat,
            lng: mLng,
            distanceMeters: dist,
            category: detectCategory(cleanName),
            ...estimateTravelTimes(dist),
          });
        }
      } catch {}
    })
  );

  return {
    items: collected,
    success: anySuccess,
    durationMs: Math.round(performance.now() - t0),
  };
}

// =========================================================================
// لایه ۴: مسابقه موازی ۵ آینه Overpass با کوئری سبک nwr (بدون regex کند)
// =========================================================================
async function fetchOverpassNearbyMosques(
  lat: number,
  lng: number,
  radiusMeters: number
): Promise<{ items: NearbyMosque[]; success: boolean; durationMs: number }> {
  const t0 = performance.now();
  const r = Math.max(300, Math.min(6000, Math.round(radiusMeters)));
  const query =
    `[out:json][timeout:6];(` +
    `nwr["amenity"="place_of_worship"]["religion"="muslim"](around:${r},${lat},${lng});` +
    `nwr["amenity"="place_of_worship"][!"religion"](around:${r},${lat},${lng});` +
    `nwr["building"="mosque"](around:${r},${lat},${lng});` +
    `);out center;`;

  const mirrors = [
    'https://overpass.openstreetmap.fr/api/interpreter',
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  ];

  const now = Date.now();
  const body = 'data=' + encodeURIComponent(query);

  const raceMirror = async (endpoint: string): Promise<NearbyMosque[]> => {
    const res = await fetchWithTimeout(
      endpoint,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      },
      5500
    );
    const data = await res.json();
    const elements = Array.isArray(data?.elements) ? data.elements : [];
    const parsed: NearbyMosque[] = [];
    for (const el of elements) {
      const mLat = typeof el.lat === 'number' ? el.lat : el.center?.lat;
      const mLng = typeof el.lon === 'number' ? el.lon : el.center?.lon;
      if (typeof mLat !== 'number' || typeof mLng !== 'number') continue;
      const tags = el.tags || {};
      const name = String(tags['name:fa'] || tags.name || tags.official_name || 'مسجد محله').trim();
      const street =
        [tags['addr:neighbourhood'], tags['addr:suburb'], tags['addr:street'], tags['addr:full'], tags['addr:Full']]
          .filter(Boolean)
          .join('، ') || 'در نزدیکی موقعیت شما';
      const dist = calculateHaversineMeters(lat, lng, mLat, mLng);
      const providerId = `osm_${el.type || 'el'}_${el.id}`;
      parsed.push({
        id: providerId,
        providerId,
        provider: 'osm',
        providers: ['osm'],
        fetchedAt: now,
        name,
        address: street,
        lat: mLat,
        lng: mLng,
        distanceMeters: dist,
        category: detectCategory(name),
        ...estimateTravelTimes(dist),
      });
    }
    return parsed;
  };

  const raceFirstFulfilled = <T,>(promises: Promise<T>[]): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      if (promises.length === 0) {
        reject(new Error('No mirrors'));
        return;
      }
      let remaining = promises.length;
      let done = false;
      for (const p of promises) {
        p.then(
          (val) => {
            if (!done) {
              done = true;
              resolve(val);
            }
          },
          () => {
            remaining--;
            if (remaining === 0 && !done) {
              reject(new Error('All Overpass mirrors failed'));
            }
          }
        );
      }
    });

  try {
    const items: NearbyMosque[] = await raceFirstFulfilled(mirrors.map((m) => raceMirror(m)));
    return {
      items: items.sort((a: NearbyMosque, b: NearbyMosque) => a.distanceMeters - b.distanceMeters),
      success: true,
      durationMs: Math.round(performance.now() - t0),
    };
  } catch {
    return { items: [], success: false, durationMs: Math.round(performance.now() - t0) };
  }
}

// =========================================================================
// لایه ۵: API نشان (با گزارش کد خطای دقیق مثل HTTP 485 بدون Rate-Limit Spam)
// =========================================================================
async function fetchNeshanNearbyMosques(
  lat: number,
  lng: number,
  radiusMeters: number
): Promise<{ items: NearbyMosque[]; success: boolean; durationMs: number; statusCode?: number }> {
  const t0 = performance.now();
  const apiKey = getInternalNeshanKey();
  const now = Date.now();
  const collected: NearbyMosque[] = [];
  let anySuccess = false;
  let lastErrCode: number | undefined;

  const parseItem = (it: Record<string, unknown>, prefix: string, idx: number) => {
    const loc = it?.location as { x?: number | string; y?: number | string } | undefined;
    if (!loc) return;
    const mLat = Number(loc.y);
    const mLng = Number(loc.x);
    if (Number.isNaN(mLat) || Number.isNaN(mLng)) return;
    const titleStr = String(it.title || '').trim();
    const catStr = String(it.category || '') + ' ' + String(it.type || '');
    if (!isMosqueLikeTitle(titleStr) && !/mosque|religious|worship|shrine/i.test(catStr)) return;
    const dist = calculateHaversineMeters(lat, lng, mLat, mLng);
    if (dist > Math.max(radiusMeters * 1.35, radiusMeters + 500)) return;
    const addrClean = String(it.address || it.neighbourhood || it.region || 'در نزدیکی موقعیت شما')
      .replace(/بخش مرکزی شهرستان\s+[^،,]+[,،]?\s*/g, '')
      .replace(/شهرستان\s+[^،,]+[,،]?\s*/g, '')
      .trim();
    const rawId = it.id ? String(it.id) : `${mLat.toFixed(5)}_${mLng.toFixed(5)}`;
    const providerId = `neshan_${rawId}`;
    collected.push({
      id: `${prefix}_${idx}_${dist}`,
      providerId,
      provider: 'neshan',
      providers: ['neshan'],
      fetchedAt: now,
      name: titleStr || 'مسجد',
      address: addrClean || 'در نزدیکی موقعیت شما',
      lat: mLat,
      lng: mLng,
      distanceMeters: dist,
      category: detectCategory(titleStr),
      ...estimateTravelTimes(dist),
    });
  };

  const terms = ['مسجد', 'حسینیه', 'نمازخانه'];
  await Promise.all(
    terms.map(async (term, tIdx) => {
      try {
        const res = await fetchWithTimeout(
          `https://api.neshan.org/v1/search?term=${encodeURIComponent(term)}&lat=${lat}&lng=${lng}`,
          { headers: { 'Api-Key': apiKey } },
          3600
        );
        const data = await res.json();
        anySuccess = true;
        const items = Array.isArray(data?.items) ? data.items : [];
        items.forEach((it: Record<string, unknown>, idx: number) => parseItem(it, `neshan_s${tIdx}`, idx));
      } catch (err) {
        if (err instanceof HttpStatusError) lastErrCode = err.status;
      }
    })
  );

  return {
    items: collected,
    success: anySuccess,
    durationMs: Math.round(performance.now() - t0),
    statusCode: anySuccess ? 200 : lastErrCode,
  };
}

// =========================================================================
// لایه ۶: Google Places API (New) با rankPreference: DISTANCE
// =========================================================================
async function fetchGooglePlacesMosques(
  lat: number,
  lng: number,
  radiusMeters: number
): Promise<{ items: NearbyMosque[]; success: boolean; durationMs: number }> {
  const t0 = performance.now();
  const gKey = getGoogleMapsApiKey();
  if (!gKey) {
    return { items: [], success: false, durationMs: 0 };
  }

  const now = Date.now();
  try {
    const res = await fetchWithTimeout(
      'https://places.googleapis.com/v1/places:searchNearby',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': gKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location',
        },
        body: JSON.stringify({
          includedTypes: ['mosque'],
          maxResultCount: 20,
          rankPreference: 'DISTANCE',
          languageCode: 'fa',
          locationRestriction: {
            circle: {
              center: { latitude: lat, longitude: lng },
              radius: Math.min(50000, Math.max(300, radiusMeters)),
            },
          },
        }),
      },
      4200
    );
    const data = await res.json();
    const places = Array.isArray(data?.places) ? data.places : [];
    const items: NearbyMosque[] = [];
    for (const [idx, pl] of places.entries()) {
      const mLat = pl?.location?.latitude;
      const mLng = pl?.location?.longitude;
      if (typeof mLat !== 'number' || typeof mLng !== 'number') continue;
      const name = String(pl?.displayName?.text || 'مسجد').trim();
      const dist = calculateHaversineMeters(lat, lng, mLat, mLng);
      const providerId = pl?.id ? `google_${pl.id}` : `google_${idx}_${dist}`;
      items.push({
        id: providerId,
        providerId,
        provider: 'google',
        providers: ['google'],
        fetchedAt: now,
        name,
        address: String(pl?.formattedAddress || 'نزدیک موقعیت شما'),
        lat: mLat,
        lng: mLng,
        distanceMeters: dist,
        category: detectCategory(name),
        ...estimateTravelTimes(dist),
      });
    }
    return { items, success: true, durationMs: Math.round(performance.now() - t0) };
  } catch {
    return { items: [], success: false, durationMs: Math.round(performance.now() - t0) };
  }
}

function areNamesSimilar(normA: string, normB: string): boolean {
  if (!normA || !normB) return false;
  if (normA === normB) return true;
  const stripCore = (s: string) => s.replace(/^(مسجدجامع|مسجدوحسینیه|مسجد|حسینیه|مصلی|مصلای|نمازخانه|حرم|امامزاده)/, '');
  const coreA = stripCore(normA);
  const coreB = stripCore(normB);
  if (coreA.length >= 4 && coreB.length >= 4) {
    if (coreA === coreB) return true;
    if (coreA.includes(coreB) || coreB.includes(coreA)) return true;
  }
  return false;
}

const PROVIDER_PRIORITY: Record<MosqueProvider, number> = {
  user: 7,
  google: 6,
  neshan: 5,
  osm_map: 4,
  osm: 4,
  photon: 3,
  nominatim: 3,
  curated: 1,
};

export function deduplicateMosquesSmart(items: NearbyMosque[]): {
  unique: NearbyMosque[];
  removedCount: number;
} {
  const sorted = [...items].sort((a, b) => {
    if (a.distanceMeters !== b.distanceMeters) return a.distanceMeters - b.distanceMeters;
    return (PROVIDER_PRIORITY[b.provider || 'curated'] || 0) - (PROVIDER_PRIORITY[a.provider || 'curated'] || 0);
  });

  const unique: NearbyMosque[] = [];
  let removedCount = 0;

  for (const item of sorted) {
    const itemNorm = normalizePersianMosqueName(item.name);
    let matchIdx = -1;

    for (let i = 0; i < unique.length; i++) {
      const u = unique[i];
      if (u.providerId && item.providerId && u.providerId === item.providerId) {
        matchIdx = i;
        break;
      }

      const geoDist = calculateHaversineMeters(u.lat, u.lng, item.lat, item.lng);
      const uNorm = normalizePersianMosqueName(u.name);
      const sameName = areNamesSimilar(uNorm, itemNorm);

      if (sameName && geoDist <= 170) {
        matchIdx = i;
        break;
      }

      const isGenericName = (n: string) => n === 'مسجد' || n === 'مسجدمحله' || n === 'نمازخانه';
      if (geoDist <= 15 && (isGenericName(itemNorm) || isGenericName(uNorm))) {
        matchIdx = i;
        break;
      }
    }

    if (matchIdx === -1) {
      unique.push({
        ...item,
        providers: item.providers || (item.provider ? [item.provider] : []),
      });
    } else {
      removedCount++;
      const existing = unique[matchIdx];
      const mergedProviders = Array.from(
        new Set([...(existing.providers || []), ...(item.providers || (item.provider ? [item.provider] : []))])
      );
      const isExistingGeneric = existing.name === 'مسجد محله' || existing.name === 'مسجد';
      const isItemGeneric = item.name === 'مسجد محله' || item.name === 'مسجد';
      const preferNewName = (isExistingGeneric && !isItemGeneric) || (!isItemGeneric && item.name.length > existing.name.length + 3);
      const isExistingGenericAddr =
        existing.address.includes('نزدیکی موقعیت شما') || existing.address.includes('ثبت‌شده روی نقشه');
      const isItemGenericAddr =
        item.address.includes('نزدیکی موقعیت شما') || item.address.includes('ثبت‌شده روی نقشه');
      const preferNewAddr = isExistingGenericAddr && !isItemGenericAddr;

      unique[matchIdx] = {
        ...existing,
        name: preferNewName ? item.name : existing.name,
        address: preferNewAddr ? item.address : existing.address,
        providers: mergedProviders,
      };
    }
  }

  unique.sort((a, b) => a.distanceMeters - b.distanceMeters);
  return { unique, removedCount };
}

export async function searchNearbyMosques(
  lat: number,
  lng: number,
  nativeAddressHint?: string,
  options?: { radiusMeters?: number; forceRefresh?: boolean }
): Promise<{
  mosques: NearbyMosque[];
  userAddress: string;
  source: 'neshan' | 'osm_iran' | 'google' | 'curated';
  apiResponseMs: number;
  diagnostics: MosqueSearchDiagnostics;
}> {
  const t0 = performance.now();
  const radiusMeters = Math.max(300, Math.min(8000, Math.round(options?.radiusMeters ?? 1000)));
  const forceRefresh = Boolean(options?.forceRefresh);

  const localT0 = performance.now();
  const localItems = getInstantLocalMosques(lat, lng, radiusMeters);
  const localDuration = Math.round(performance.now() - localT0);

  // اجرای ۱۰۰٪ موازی هر ۶ منبع + آدرس‌یابی معکوس
  const [addrInfo, osmMapRes, photonRes, nomRes, overpassRes, neshanRes, googleRes] = await Promise.all([
    reverseGeocodeFast(lat, lng, nativeAddressHint, forceRefresh),
    fetchOsmDirectMapMosques(lat, lng, radiusMeters),
    fetchPhotonNearbyMosques(lat, lng, radiusMeters),
    fetchNominatimViewboxMosques(lat, lng, radiusMeters),
    fetchOverpassNearbyMosques(lat, lng, radiusMeters),
    fetchNeshanNearbyMosques(lat, lng, radiusMeters),
    fetchGooglePlacesMosques(lat, lng, radiusMeters),
  ]);

  const rawCombined = [
    ...osmMapRes.items,
    ...photonRes.items,
    ...nomRes.items,
    ...overpassRes.items,
    ...neshanRes.items,
    ...googleRes.items,
    ...localItems,
  ];

  const { unique, removedCount } = deduplicateMosquesSmart(rawCombined);
  const inRadius = unique.filter((m) => m.distanceMeters <= radiusMeters);
  const discardedOutOfRadius = unique.length - inRadius.length;

  const osmTotal = osmMapRes.items.length + photonRes.items.length + nomRes.items.length + overpassRes.items.length;
  const source: 'neshan' | 'osm_iran' | 'google' | 'curated' =
    neshanRes.items.length > 0
      ? 'neshan'
      : osmTotal > 0
      ? 'osm_iran'
      : googleRes.items.length > 0
      ? 'google'
      : 'curated';

  const diagnostics: MosqueSearchDiagnostics = {
    center: { lat, lng },
    radiusMeters,
    usedCache: false,
    sources: {
      osmMap: { count: osmMapRes.items.length, success: osmMapRes.success, durationMs: osmMapRes.durationMs, statusCode: osmMapRes.statusCode },
      photon: { count: photonRes.items.length, success: photonRes.success, durationMs: photonRes.durationMs },
      nominatim: { count: nomRes.items.length, success: nomRes.success, durationMs: nomRes.durationMs },
      osm: { count: overpassRes.items.length, success: overpassRes.success, durationMs: overpassRes.durationMs },
      neshan: { count: neshanRes.items.length, success: neshanRes.success, durationMs: neshanRes.durationMs, statusCode: neshanRes.statusCode },
      google: { count: googleRes.items.length, success: googleRes.success, durationMs: googleRes.durationMs },
      local: { count: localItems.length, success: true, durationMs: localDuration },
    },
    totalBeforeDedup: rawCombined.length,
    totalAfterDedup: unique.length,
    totalAfterRadiusFilter: inRadius.length,
    removedDuplicates: removedCount,
    discardedOutOfRadius,
  };

  writeCachedMosqueSearch({
    lat,
    lng,
    radiusMeters,
    mosques: inRadius,
    userAddress: addrInfo.formattedAddress,
    source,
    diagnostics,
    savedAt: Date.now(),
  });

  return {
    mosques: inRadius,
    userAddress: addrInfo.formattedAddress,
    source,
    apiResponseMs: Math.round(performance.now() - t0),
    diagnostics,
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
    const res = await fetchWithTimeout(url, { headers: { 'Api-Key': apiKey } }, 2800);
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