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

const ADDRESS_CACHE_KEY = 'noor_reverse_geocode_cache_v3_exact';
const METRICS_STORAGE_KEY = 'noor_location_perf_metrics_v1';

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
    localStorage.removeItem('noor_reverse_geocode_cache_v2');
    localStorage.removeItem('noor_reverse_geocode_cache_v1');
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

async function fetchWithTimeoutAndRetry(url: string, options: RequestInit, timeoutMs = 3600, retries = 1): Promise<Response> {
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

// پیاده‌سازی دقیق مستندات رسمی نشان (GET https://api.neshan.org/v5/reverse?lat=...&lng=...)
// استخراج دقیق نام شهر + محله + خیابان/کوچه اصلی (مثل: مشهد، محله مهدی‌آباد، فردوسی ۲، نوربخش ۱۹)
export async function reverseGeocodeFast(lat: number, lng: number): Promise<{ formattedAddress: string; usedCache: boolean; elapsedMs: number }> {
  const t0 = performance.now();
  const apiKey = getInternalNeshanKey();
  try {
    const res = await fetchWithTimeoutAndRetry(
      'https://api.neshan.org/v5/reverse?lat=' + lat + '&lng=' + lng,
      { headers: { 'Api-Key': apiKey } },
      3400,
      1
    );
    const data = await res.json();

    // اگر نشان formatted_address تمیز برگردانده بود، بخش‌های زاید اداری مثل «بخش مرکزی شهرستان...» را حذف می‌کنیم
    const city = (data.city || '').trim();
    const hood = (data.neighbourhood || '').trim();
    const route = (data.route_name || '').trim();
    let fullFormatted = String(data.formatted_address || '').trim();
    fullFormatted = fullFormatted
      .replace(/بخش مرکزی شهرستان\s+[^،,]+[,،]?\s*/g, '')
      .replace(/شهرستان\s+[^،,]+[,،]?\s*/g, '')
      .trim();

    let finalAddress = '';
    if (fullFormatted && fullFormatted.length > 5) {
      finalAddress = fullFormatted;
    } else {
      const cleanParts = [city, hood, route].filter(Boolean);
      finalAddress = cleanParts.join('، ') || 'موقعیت دقیق GPS دریافت شد';
    }

    return {
      formattedAddress: finalAddress,
      usedCache: false,
      elapsedMs: Math.round(performance.now() - t0),
    };
  } catch {
    return {
      formattedAddress: 'مختصات دقیق GPS: ' + lat.toFixed(4) + ', ' + lng.toFixed(4),
      usedCache: false,
      elapsedMs: Math.round(performance.now() - t0),
    };
  }
}

const CURATED_IRAN_MOSQUES: Array<{ name: string; address: string; lat: number; lng: number; category: NearbyMosque['category'] }> = [
  // مساجد محدوده بلوار فردوسی، نوربخش، مهدی‌آباد، فرامرز عباسی، جانباز و سجاد مشهد
  { name: 'مسجد المهدی (عج) — بلوار فردوسی', address: 'مشهد، بلوار فردوسی، نزدیک میدان فردوسی و نوربخش', lat: 36.3228, lng: 59.5635, category: 'مسجد محله' },
  { name: 'مسجد الجواد (ع) — فرامرز عباسی', address: 'مشهد، بلوار فردوسی، چهارراه فرامرز عباسی', lat: 36.3204, lng: 59.5558, category: 'مسجد جامع' },
  { name: 'مسجد امام علی (ع) — بلوار جانباز', address: 'مشهد، بلوار جانباز، نزدیک فردوسی و مهدی‌آباد', lat: 36.3264, lng: 59.5612, category: 'مسجد جامع' },
  { name: 'مسجد قبا — بلوار خیام', address: 'مشهد، بلوار خیام شمالی، نزدیک فردوسی', lat: 36.3168, lng: 59.5648, category: 'مسجد جامع' },
  { name: 'مسجد امام سجاد (ع) — بلوار سجاد', address: 'مشهد، بلوار سجاد، چهارراه بهارستان', lat: 36.3145, lng: 59.5510, category: 'مسجد جامع' },
  // سایر نقاط مشهد
  { name: 'مسجد الرضا (ع) — بلوار رضا', address: 'مشهد، بلوار احمدآباد، بلوار رضا', lat: 36.2862, lng: 59.5664, category: 'مسجد محله' },
  { name: 'مسجد گوهرشاد', address: 'مشهد مقدس، صحن گوهرشاد حرم مطهر', lat: 36.2869, lng: 59.6154, category: 'مسجد جامع' },
  { name: 'حرم مطهر امام رضا (ع)', address: 'مشهد مقدس، فلکه آب', lat: 36.2877, lng: 59.6157, category: 'حرم و زیارتگاه' },
  // تهران، قم، اصفهان، شیراز
  { name: 'مسجد دانشگاه تهران', address: 'تهران، خیابان انقلاب، خیابان ۱۶ آذر', lat: 35.7025, lng: 51.3956, category: 'مسجد جامع' },
  { name: 'مصلی بزرگ امام خمینی (ره)', address: 'تهران، بزرگراه شهید قاسم سلیمانی', lat: 35.7367, lng: 51.4301, category: 'حسینیه و مصلی' },
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

  const sameCity = all.filter((m) => m.distanceMeters <= 25000);
  return sameCity.length > 0 ? sameCity : all.slice(0, 4);
}

async function fetchOverpassNearbyMosques(lat: number, lng: number): Promise<NearbyMosque[]> {
  try {
    const query = `[out:json][timeout:4];(node["amenity"="place_of_worship"]["religion"="muslim"](around:3500,${lat},${lng});way["amenity"="place_of_worship"]["religion"="muslim"](around:3500,${lat},${lng}););out center 18;`;
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
      .filter((x: NearbyMosque | null): x is NearbyMosque => x !== null && x.distanceMeters <= 20000)
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

  const neshanPromise = (async (): Promise<NearbyMosque[]> => {
    try {
      const searchRes = await fetchWithTimeoutAndRetry(
        'https://api.neshan.org/v1/search?term=' + encodeURIComponent('مسجد') + '&lat=' + lat + '&lng=' + lng,
        { headers: { 'Api-Key': apiKey } },
        3400,
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
          const addrClean = String(it.address || it.region || 'در نزدیکی موقعیت شما')
            .replace(/بخش مرکزی شهرستان\s+[^،,]+[,،]?\s*/g, '')
            .trim();
          return {
            id: 'neshan_' + idx + '_' + dist,
            name: titleStr,
            address: addrClean,
            lat: mLat,
            lng: mLng,
            distanceMeters: dist,
            category: detectCategory(titleStr),
            ...times,
          };
        })
        .filter((m: NearbyMosque) => m.distanceMeters <= 20000);
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
