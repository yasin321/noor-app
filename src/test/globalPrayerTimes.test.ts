import { describe, it, expect } from 'vitest';
import {
  calculatePrayerTimes,
  timeToMinutes,
  getRecommendedMethodForCountry,
} from '@/lib/prayerTimes';
import { CITIES, findNearestCity, getCityById } from '@/lib/cities';

const GLOBAL_SAMPLE = [
  { id: 'tehran', method: 'tehran' },
  { id: 'mashhad', method: 'tehran' },
  { id: 'london', method: 'mwl' },
  { id: 'stockholm', method: 'mwl' },
  { id: 'new_york', method: 'isna' },
  { id: 'madrid', method: 'mwl' },
  { id: 'mexico_city', method: 'isna' },
  { id: 'buenos_aires', method: 'mwl' },
  { id: 'sydney', method: 'mwl' },
];

describe('Global Prayer Times Engine (5 Continents + High Latitude + DST)', () => {
  const winter = new Date(2026, 10, 20, 12, 0);
  const summer = new Date(2026, 5, 21, 12, 0);

  for (const item of GLOBAL_SAMPLE) {
    const city = getCityById(item.id);
    for (const [season, date] of [
      ['winter', winter],
      ['summer solstice', summer],
    ] as const) {
      it(`computes valid ordered prayer times for ${city.name} (${season})`, () => {
        const t = calculatePrayerTimes(date, city.lat, city.lng, city.timezone, item.method, {
          madhab: 'standard',
          highLatRule: 'angle_based',
        });

        for (const k of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha', 'midnight'] as const) {
          expect(t[k]).toMatch(/^[0-9]{2}:[0-9]{2}$/);
          expect(t[k]).not.toBe('--:--');
        }

        const f = timeToMinutes(t.fajr);
        const s = timeToMinutes(t.sunrise);
        const d = timeToMinutes(t.dhuhr);
        const a = timeToMinutes(t.asr);
        const m = timeToMinutes(t.maghrib);
        expect(f).toBeLessThan(s);
        expect(s).toBeLessThan(d);
        expect(d).toBeLessThan(a);
        expect(a).toBeLessThan(m);
      });
    }
  }

  it('shifts Hanafi Asr later than Standard Asr', () => {
    const city = getCityById('london');
    const std = calculatePrayerTimes(winter, city.lat, city.lng, city.timezone, 'mwl', { madhab: 'standard' });
    const han = calculatePrayerTimes(winter, city.lat, city.lng, city.timezone, 'mwl', { madhab: 'hanafi' });
    expect(timeToMinutes(han.asr) - timeToMinutes(std.asr)).toBeGreaterThanOrEqual(20);
  });

  it('finds exact nearest global city via Haversine GPS', () => {
    expect(CITIES.length).toBeGreaterThanOrEqual(100);
    expect(findNearestCity(40.42, -3.70).city.id).toBe('madrid');
    expect(findNearestCity(51.51, -0.13).city.id).toBe('london');
    expect(findNearestCity(40.71, -74.01).city.id).toBe('new_york');
    expect(findNearestCity(36.26, 59.61).city.id).toBe('mashhad');
    expect(getRecommendedMethodForCountry('IR')).toBe('tehran');
    expect(getRecommendedMethodForCountry('US')).toBe('isna');
    expect(getRecommendedMethodForCountry('ES')).toBe('mwl');
  });
});
