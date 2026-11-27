export type MosqueProvider = 'neshan' | 'osm' | 'google' | 'curated' | 'user';

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
}

export interface MosqueSearchDiagnostics {
  center: { lat: number; lng: number };
  radiusMeters: number;
  usedCache: boolean;
  sources: {
    neshan: MosqueSourceDiag;
    osm: MosqueSourceDiag;
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
const MOSQUE_CACHE_KEY = 'noor_mosque_discovery_cache_v2';
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
  if (t.includes('مصلی') || t.includes('مصلای') || t.includes('حسینیه') || t.includes('تکیه') || t.includes('مهدیه')) return 'حسینیه و مصلی';
  return 'مسجد محله';
}

function isMosqueLikeTitle(titleStr: string): boolean {
  return /مسجد|حسینیه|حسينيه|مصلی|مصلي|مصلا|نمازخانه|حرم|امامزاده|آستان|مهدیه|مهديه|تکیه|تكيه|mosque|masjid|musalla|prayer/i.test(
    titleStr || ''
  );
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 4500): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) return res;
    throw new Error('HTTP ' + res.status);
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
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
    if (!entry || !Array.isArray(entry.mosques)) return null;
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
    localStorage.setItem(MOSQUE_CACHE_KEY, JSON.stringify(entry));
  } catch {}
}

// موتور ۱ آدرس‌یابی معکوس: OpenStreetMap Nominatim (صرفاً برای آدرس‌یابی)
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

// موتور ۲ آدرس‌یابی معکوس: API رسمی نشان (v5/reverse)
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

// موتور ۳ آدرس‌یابی معکوس: Google Maps (در صورت ثبت کلید)
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

  const neshanJob = (async () => {
    try {
      const apiKey = getInternalNeshanKey();
      const res = await fetchWithTimeout(
        `https://api.neshan.org/v1/search?term=${encodeURIComponent(q)}&lat=${biasLat}&lng=${biasLng}`,
        { headers: { 'Api-Key': apiKey } },
        3400
      );
      const data = await res.json();
      for (const it of (data?.items || []).slice(0, 6)) {
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

  const osmJob = (async () => {
    try {
      const res = await fetchWithTimeout(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&limit=5&accept-language=fa`,
        {},
        3400
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

  await Promise.all([neshanJob, osmJob]);
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

// فقط مساجد داخل شعاع واقعی کاربر را برمی‌گرداند (هرگز مساجد شهرهای دیگر با صدها کیلومتر فاصله را نشان نمی‌دهد)
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

// موتور OSM Overpass کامل (nwr = node + way + relation) بدون سقف ۲۵تایی و دقیقاً هماهنگ با شعاع انتخابی کاربر
async function fetchOverpassNearbyMosques(
  lat: number,
  lng: number,
  radiusMeters: number
): Promise<{ items: NearbyMosque[]; success: boolean; durationMs: number }> {
  const t0 = performance.now();
  const r = Math.max(300, Math.min(8000, Math.round(radiusMeters)));
  const query =
    `[out:json][timeout:10];(` +
    `nwr["amenity"="place_of_worship"]["religion"="muslim"](around:${r},${lat},${lng});` +
    `nwr["amenity"="place_of_worship"]["name"~"مسجد|حسینیه|حسينيه|مصلی|مصلي|نمازخانه|حرم|امامزاده|mosque|masjid|musalla",i](around:${r},${lat},${lng});` +
    `nwr["name:fa"~"مسجد|حسینیه|مصلی|نمازخانه|حرم|امامزاده",i](around:${r},${lat},${lng});` +
    `nwr["building"="mosque"](around:${r},${lat},${lng});` +
    `);out center;`;

  const endpoints = [
    'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query),
    'https://overpass.kumi.systems/api/interpreter?data=' + encodeURIComponent(query),
    'https://z.overpass-api.de/api/interpreter?data=' + encodeURIComponent(query),
  ];

  const now = Date.now();
  for (const url of endpoints) {
    try {
      const res = await fetchWithTimeout(url, {}, 6500);
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
      return {
        items: parsed.sort((a, b) => a.distanceMeters - b.distanceMeters),
        success: true,
        durationMs: Math.round(performance.now() - t0),
      };
    } catch {}
  }

  return { items: [], success: false, durationMs: Math.round(performance.now() - t0) };
}

// موتور نشان: ترکیب موازی v1/nearby (فاصله‌محور) + v1/search با ترم‌های عمومی سراسر کشور
async function fetchNeshanNearbyMosques(
  lat: number,
  lng: number,
  radiusMeters: number
): Promise<{ items: NearbyMosque[]; success: boolean; durationMs: number }> {
  const t0 = performance.now();
  const apiKey = getInternalNeshanKey();
  const now = Date.now();
  const collected: NearbyMosque[] = [];
  let anySuccess = false;

  const parseNeshanItem = (it: Record<string, unknown>, prefix: string, idx: number) => {
    const loc = it?.location as { x?: number; y?: number } | undefined;
    if (!loc || typeof loc.y !== 'number' || typeof loc.x !== 'number') return;
    const titleStr = String(it.title || '').trim();
    const catStr = String(it.category || '') + ' ' + String(it.type || '');
    if (!isMosqueLikeTitle(titleStr) && !/mosque|religious|worship|shrine/i.test(catStr)) return;
    const mLat = Number(loc.y);
    const mLng = Number(loc.x);
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

  // ۱. اندپوینت نزدیک‌محور نشان (در صورت فعال بودن برای کلید سرویس)
  const nearbyJob = (async () => {
    try {
      const res = await fetchWithTimeout(
        `https://api.neshan.org/v1/nearby?location=${lat},${lng}`,
        { headers: { 'Api-Key': apiKey } },
        3800
      );
      const data = await res.json();
      anySuccess = true;
      const items = Array.isArray(data?.items) ? data.items : [];
      items.forEach((it: Record<string, unknown>, idx: number) => parseNeshanItem(it, 'neshan_nearby', idx));
    } catch {}
  })();

  // ۲. جستجوی موازی با ترم‌های عمومی سراسر کشور (بدون هاردکد یک شهر خاص)
  const searchTerms = ['مسجد', 'نمازخانه', 'حسینیه', 'مصلی', 'امامزاده'];
  const searchJobs = searchTerms.map(async (term, tIdx) => {
    try {
      const res = await fetchWithTimeout(
        `https://api.neshan.org/v1/search?term=${encodeURIComponent(term)}&lat=${lat}&lng=${lng}`,
        { headers: { 'Api-Key': apiKey } },
        3800
      );
      const data = await res.json();
      anySuccess = true;
      const items = Array.isArray(data?.items) ? data.items : [];
      items.forEach((it: Record<string, unknown>, idx: number) => parseNeshanItem(it, `neshan_s${tIdx}`, idx));
    } catch {}
  });

  await Promise.all([nearbyJob, ...searchJobs]);

  return {
    items: collected,
    success: anySuccess,
    durationMs: Math.round(performance.now() - t0),
  };
}

// موتور Google Places API (New) با rankPreference: DISTANCE (در صورت ثبت کلید گوگل مپس)
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
  // حذف پیشوندهای پرتکرار برای مقایسه دقیق هسته نام (مثلاً «مسجد جامع امام علی» با «مسجد امام علی»)
  const stripCore = (s: string) => s.replace(/^(مسجدجامع|مسجد|حسینیه|مصلی|مصلای|نمازخانه|حرم|امامزاده)/, '');
  const coreA = stripCore(normA);
  const coreB = stripCore(normB);
  if (coreA.length >= 4 && coreB.length >= 4) {
    if (coreA === coreB) return true;
    if (coreA.includes(coreB) || coreB.includes(coreA)) return true;
  }
  return false;
}

const PROVIDER_PRIORITY: Record<MosqueProvider, number> = {
  user: 5,
  google: 4,
  neshan: 3,
  osm: 2,
  curated: 1,
};

// الگوریتم تکراری‌زدایی هوشمند ۳مرحله‌ای: هرگز صرفاً به‌خاطر فاصله (بدون تطابق نام یا مختصات دقیقاً یکسان) مسجدی را حذف نمی‌کند
export function deduplicateMosquesSmart(items: NearbyMosque[]): {
  unique: NearbyMosque[];
  removedCount: number;
} {
  const sorted = [...items].sort((a, b) => {
    const pDiff = (PROVIDER_PRIORITY[b.provider || 'curated'] || 0) - (PROVIDER_PRIORITY[a.provider || 'curated'] || 0);
    if (a.distanceMeters !== b.distanceMeters) return a.distanceMeters - b.distanceMeters;
    return pDiff;
  });

  const unique: NearbyMosque[] = [];
  let removedCount = 0;

  for (const item of sorted) {
    const itemNorm = normalizePersianMosqueName(item.name);
    let matchIdx = -1;

    for (let i = 0; i < unique.length; i++) {
      const u = unique[i];
      // مرحله ۱: شناسه منبع یکسان
      if (u.providerId && item.providerId && u.providerId === item.providerId) {
        matchIdx = i;
        break;
      }

      const geoDist = calculateHaversineMeters(u.lat, u.lng, item.lat, item.lng);
      const uNorm = normalizePersianMosqueName(u.name);
      const sameName = areNamesSimilar(uNorm, itemNorm);

      // مرحله ۲: نام مشابه + نزدیکی مکانی (تا ۱۷۰ متر برای اختلاف مرکز ساختمان vs درب ورودی)
      if (sameName && geoDist <= 170) {
        matchIdx = i;
        break;
      }

      // مرحله ۳: مختصات تقریباً یکسان (زیر ۱۲ متر) و یکی دارای نام عمومی «مسجد محله» یا «مسجد»
      const isGenericName = (n: string) => n === 'مسجد' || n === 'مسجدمحله' || n === 'نمازخانه';
      if (geoDist <= 12 && (isGenericName(itemNorm) || isGenericName(uNorm))) {
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
      const preferNewName =
        (existing.name === 'مسجد محله' || existing.name === 'مسجد') &&
        item.name !== 'مسجد محله' &&
        item.name !== 'مسجد';
      const preferNewAddr =
        existing.address.includes('نزدیکی موقعیت شما') && !item.address.includes('نزدیکی موقعیت شما');

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

  // ۱. اجرای ۱۰۰٪ موازی همه منابع + Reverse Geocoding (بدون انتظار سریالی برای آدرس)
  const localT0 = performance.now();
  const localItems = getInstantLocalMosques(lat, lng, radiusMeters);
  const localDuration = Math.round(performance.now() - localT0);

  const [addrInfo, neshanRes, osmRes, googleRes] = await Promise.all([
    reverseGeocodeFast(lat, lng, nativeAddressHint, forceRefresh),
    fetchNeshanNearbyMosques(lat, lng, radiusMeters),
    fetchOverpassNearbyMosques(lat, lng, radiusMeters),
    fetchGooglePlacesMosques(lat, lng, radiusMeters),
  ]);

  const rawCombined = [...neshanRes.items, ...osmRes.items, ...googleRes.items, ...localItems];
  const { unique, removedCount } = deduplicateMosquesSmart(rawCombined);

  // یکسان‌سازی سخت‌گیرانه شعاع برای همه منابع (وقتی کاربر ۱ کیلومتر زده، مسجد ۴ کیلومتری نمایش داده نمی‌شود)
  const inRadius = unique.filter((m) => m.distanceMeters <= radiusMeters);
  const discardedOutOfRadius = unique.length - inRadius.length;

  const source: 'neshan' | 'osm_iran' | 'google' | 'curated' =
    neshanRes.items.length > 0
      ? 'neshan'
      : osmRes.items.length > 0
      ? 'osm_iran'
      : googleRes.items.length > 0
      ? 'google'
      : 'curated';

  const diagnostics: MosqueSearchDiagnostics = {
    center: { lat, lng },
    radiusMeters,
    usedCache: false,
    sources: {
      neshan: { count: neshanRes.items.length, success: neshanRes.success, durationMs: neshanRes.durationMs },
      osm: { count: osmRes.items.length, success: osmRes.success, durationMs: osmRes.durationMs },
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
