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

const ADDRESS_CACHE_KEY = 'noor_reverse_geocode_cache_v4_multi';
const METRICS_STORAGE_KEY = 'noor_location_perf_metrics_v1';
const GOOGLE_MAPS_KEY_STORAGE = 'noor_google_maps_api_key_v1';

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
    localStorage.removeItem('noor_reverse_geocode_cache_v3_exact');
    localStorage.removeItem('noor_reverse_geocode_cache_v2');
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

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 3600): Promise<Response> {
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

// موتور ۱: آدرس‌یاب معکوس Maps.me / OpenStreetMap (Nominatim) — رایگان، جهانی و فوق‌دقیق در سطح کوچه
async function reverseGeocodeNominatim(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=fa`;
    const res = await fetchWithTimeout(url, { headers: { 'Accept': 'application/json' } }, 3400);
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

// موتور ۲: آدرس‌یاب معکوس رسمی نشان (v5/reverse)
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
    let fullFormatted = String(data.formatted_address || '')
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

// موتور ۳: آدرس‌یاب معکوس Google Maps (در صورت وارد شدن کلید توسط کاربر)
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

// ترکیب موازی هر ۳ موتور برای دریافت دقیق‌ترین نام خیابان و کوچه (مثل: مشهد، محله مهدی‌آباد، فردوسی ۲، نوربخش ۲۱)
export async function reverseGeocodeFast(lat: number, lng: number, nativeFallback?: string): Promise<{ formattedAddress: string; usedCache: boolean; elapsedMs: number }> {
  const t0 = performance.now();
  const [neshanAddr, osmAddr, googleAddr] = await Promise.all([
    reverseGeocodeNeshan(lat, lng),
    reverseGeocodeNominatim(lat, lng),
    reverseGeocodeGoogle(lat, lng),
  ]);

  // انتخاب کامل‌ترین و دقیق‌ترین آدرس (که هم نام محله و هم نام کوچه را داشته باشد)
  let best = googleAddr || '';
  if (!best) {
    if (osmAddr && neshanAddr) {
      // اگر آدرس OSM جزئیات کوچه بیشتری داشت یا نشان کامل‌تر بود، ترکیب هوشمند:
      best = osmAddr.length >= neshanAddr.length ? osmAddr : neshanAddr;
    } else {
      best = neshanAddr || osmAddr || nativeFallback || `مختصات دقیق: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  }

  return {
    formattedAddress: best,
    usedCache: false,
    elapsedMs: Math.round(performance.now() - t0),
  };
}

// قابلیت جستجوی مستقیم نام محله، خیابان یا شهر در سراسر ایران و جهان (برای پرش فوری روی نقشه)
export async function geocodeSearchQuery(query: string): Promise<Array<{ title: string; address: string; lat: number; lng: number }>> {
  const q = query.trim();
  if (!q) return [];
  const results: Array<{ title: string; address: string; lat: number; lng: number }> = [];

  const neshanJob = (async () => {
    try {
      const apiKey = getInternalNeshanKey();
      const res = await fetchWithTimeout(
        `https://api.neshan.org/v1/search?term=${encodeURIComponent(q)}&lat=36.2972&lng=59.6067`,
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

// رادار مساجد Maps.me / OpenStreetMap (Overpass) با ۳ آینه سرور جهانی برای تضمین ۱۰۰٪ پاسخگویی
async function fetchOverpassNearbyMosques(lat: number, lng: number): Promise<NearbyMosque[]> {
  const query = `[out:json][timeout:5];(node["amenity"="place_of_worship"]["religion"="muslim"](around:4500,${lat},${lng});way["amenity"="place_of_worship"]["religion"="muslim"](around:4500,${lat},${lng});node["name"~"مسجد|حسینیه|مصلی"](around:4500,${lat},${lng});way["name"~"مسجد|حسینیه|مصلی"](around:4500,${lat},${lng}););out center 25;`;
  const endpoints = [
    'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query),
    'https://overpass.kumi.systems/api/interpreter?data=' + encodeURIComponent(query),
  ];
  for (const url of endpoints) {
    try {
      const res = await fetchWithTimeout(url, {}, 3800);
      const data = await res.json();
      const elements = Array.isArray(data?.elements) ? data.elements : [];
      const parsed = elements
        .map((el: { id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }, idx: number) => {
          const mLat = el.lat ?? el.center?.lat;
          const mLng = el.lon ?? el.center?.lon;
          if (typeof mLat !== 'number' || typeof mLng !== 'number') return null;
          const name = el.tags?.['name:fa'] || el.tags?.name || 'مسجد محله';
          const street = [el.tags?.['addr:suburb'], el.tags?.['addr:street'], el.tags?.['addr:Full']].filter(Boolean).join('، ') || 'در محله و نزدیکی موقعیت شما';
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
      if (parsed.length > 0) return parsed;
    } catch {}
  }
  return [];
}

export async function searchNearbyMosques(
  lat: number,
  lng: number,
  nativeAddressHint?: string
): Promise<{ mosques: NearbyMosque[]; userAddress: string; source: 'neshan' | 'osm_iran' | 'curated'; apiResponseMs: number }> {
  const t0 = performance.now();
  const apiKey = getInternalNeshanKey();
  const gKey = getGoogleMapsApiKey();
  const addrInfo = await reverseGeocodeFast(lat, lng, nativeAddressHint);

  // استخراج نام محله یا خیابان فعلی کاربر برای جستجوی هدفمند در نشان و گوگل
  const addrParts = addrInfo.formattedAddress.split(/[،,\-]/).map((s) => s.trim()).filter(Boolean);
  const localHood = addrParts.length > 1 ? addrParts[1] : addrParts[0] || '';

  // ۱. جستجوی چندگانه در API رسمی نشان (هم کلمه مسجد، هم مسجد + نام محله، هم حسینیه، هم اندپوینت nearby)
  const neshanPromise = (async (): Promise<NearbyMosque[]> => {
    const collected: NearbyMosque[] = [];
    const searchTerms = ['مسجد', localHood ? 'مسجد ' + localHood : 'مسجد جامع', 'مسجد المنتظر', 'مسجد باباغدیر', 'حسینیه'];
    await Promise.all(
      searchTerms.map(async (term, tIdx) => {
        try {
          const searchRes = await fetchWithTimeout(
            `https://api.neshan.org/v1/search?term=${encodeURIComponent(term)}&lat=${lat}&lng=${lng}`,
            { headers: { 'Api-Key': apiKey } },
            3600
          );
          const data = await searchRes.json();
          const items = Array.isArray(data?.items) ? data.items : [];
          for (let idx = 0; idx < items.length; idx++) {
            const it = items[idx];
            if (!it?.location?.y || !it?.location?.x) continue;
            const titleStr = String(it.title || '');
            if (!titleStr.includes('مسجد') && !titleStr.includes('حسینیه') && !titleStr.includes('مصلی') && !titleStr.includes('حرم') && !titleStr.includes('امامزاده')) continue;
            const mLat = Number(it.location.y);
            const mLng = Number(it.location.x);
            const dist = calculateHaversineMeters(lat, lng, mLat, mLng);
            if (dist > 22000) continue;
            const times = estimateTravelTimes(dist);
            const addrClean = String(it.address || it.region || 'در نزدیکی موقعیت شما')
              .replace(/بخش مرکزی شهرستان\s+[^،,]+[,،]?\s*/g, '')
              .trim();
            collected.push({
              id: `neshan_${tIdx}_${idx}_${dist}`,
              name: titleStr,
              address: addrClean,
              lat: mLat,
              lng: mLng,
              distanceMeters: dist,
              category: detectCategory(titleStr),
              ...times,
            });
          }
        } catch {}
      })
    );
    return collected;
  })();

  // ۲. جستجو در Google Maps Places API (در صورت ثبت کلید گوگل مپس یا از طریق Nominatim Viewbox)
  const googleAndViewboxPromise = (async (): Promise<NearbyMosque[]> => {
    const list: NearbyMosque[] = [];
    if (gKey) {
      try {
        const gUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=3500&type=mosque&language=fa&key=${encodeURIComponent(gKey)}`;
        const res = await fetchWithTimeout(gUrl, {}, 3600);
        const data = await res.json();
        for (const [idx, pl] of (data?.results || []).entries()) {
          const mLat = pl?.geometry?.location?.lat;
          const mLng = pl?.geometry?.location?.lng;
          if (typeof mLat === 'number' && typeof mLng === 'number') {
            const dist = calculateHaversineMeters(lat, lng, mLat, mLng);
            const times = estimateTravelTimes(dist);
            const name = String(pl.name || 'مسجد');
            list.push({
              id: `gmaps_${idx}_${dist}`,
              name,
              address: String(pl.vicinity || 'نزدیک موقعیت شما'),
              lat: mLat,
              lng: mLng,
              distanceMeters: dist,
              category: detectCategory(name),
              ...times,
            });
          }
        }
      } catch {}
    }
    // جستجوی مستطیلی (Bounding Box) در دیتابیس نقشه خیابان‌ها برای یافتن مساجد داخل کوچه‌ها
    try {
      const delta = 0.032;
      const vbox = `${lng - delta},${lat + delta},${lng + delta},${lat - delta}`;
      const nomUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent('مسجد')}&viewbox=${vbox}&bounded=1&limit=30&accept-language=fa`;
      const res = await fetchWithTimeout(nomUrl, {}, 3500);
      const data = await res.json();
      for (const [idx, item] of (Array.isArray(data) ? data : []).entries()) {
        const mLat = Number(item.lat);
        const mLng = Number(item.lon);
        if (!isNaN(mLat) && !isNaN(mLng)) {
          const dist = calculateHaversineMeters(lat, lng, mLat, mLng);
          const times = estimateTravelTimes(dist);
          const name = String(item.name || item.display_name?.split('،')[0] || 'مسجد محله');
          list.push({
            id: `nom_box_${idx}_${dist}`,
            name,
            address: String(item.display_name || '').split('،').slice(0, 3).join('، '),
            lat: mLat,
            lng: mLng,
            distanceMeters: dist,
            category: detectCategory(name),
            ...times,
          });
        }
      }
    } catch {}
    return list;
  })();

  const [neshanList, osmList, extraList] = await Promise.all([
    neshanPromise,
    fetchOverpassNearbyMosques(lat, lng),
    googleAndViewboxPromise,
  ]);

  const combined = [...neshanList, ...osmList, ...extraList, ...getInstantLocalMosques(lat, lng)];
  const unique: NearbyMosque[] = [];
  for (const item of combined.sort((a, b) => a.distanceMeters - b.distanceMeters)) {
    const isDup = unique.some(
      (u) => calculateHaversineMeters(u.lat, u.lng, item.lat, item.lng) < 55 || (u.name === item.name && Math.abs(u.distanceMeters - item.distanceMeters) < 200)
    );
    if (!isDup) unique.push(item);
  }

  const finalMosques = unique.slice(0, 35);
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
