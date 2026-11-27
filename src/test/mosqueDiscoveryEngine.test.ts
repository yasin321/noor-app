import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  normalizePersianMosqueName,
  deduplicateMosquesSmart,
  getInstantLocalMosques,
  type NearbyMosque,
} from '@/lib/neshanMosqueService';

function makeMosque(overrides: Partial<NearbyMosque>): NearbyMosque {
  return {
    id: 'm1',
    name: 'مسجد نمونه',
    address: 'تهران',
    lat: 35.7,
    lng: 51.4,
    distanceMeters: 100,
    walkingMinutes: 2,
    drivingMinutes: 1,
    transitMinutes: 2,
    category: 'مسجد محله',
    provider: 'neshan',
    providers: ['neshan'],
    ...overrides,
  };
}

describe('Mosque Discovery Engine v2 (No Missed Nearby Mosques)', () => {
  it('normalizes Persian/Arabic characters, ZWNJ, and honorific parentheses', () => {
    expect(normalizePersianMosqueName('مسجد صاحب‌الزمان (عج)')).toBe(
      normalizePersianMosqueName('مسجد صاحب الزمان')
    );
    expect(normalizePersianMosqueName('حسينيه علي ابن ابيطالب')).toBe(
      normalizePersianMosqueName('حسینیه علی ابن ابیطالب')
    );
  });

  it('preserves two distinct mosques that are only 30 meters apart (no blind distance dedup)', () => {
    const a = makeMosque({ id: 'a', providerId: 'n1', name: 'مسجد امام حسن', lat: 36.3200, lng: 59.5600, distanceMeters: 40 });
    const b = makeMosque({ id: 'b', providerId: 'o1', provider: 'osm', providers: ['osm'], name: 'مسجد صاحب الزمان', lat: 36.32025, lng: 59.5600, distanceMeters: 68 });
    const { unique, removedCount } = deduplicateMosquesSmart([a, b]);
    expect(unique).toHaveLength(2);
    expect(removedCount).toBe(0);
  });

  it('merges the same mosque reported by Neshan and OSM with spelling differences', () => {
    const a = makeMosque({ id: 'a', providerId: 'n1', provider: 'neshan', providers: ['neshan'], name: 'مسجد صاحب‌الزمان (عج)', lat: 36.3219, lng: 59.5614, distanceMeters: 50 });
    const b = makeMosque({ id: 'b', providerId: 'o1', provider: 'osm', providers: ['osm'], name: 'مسجد صاحب الزمان', lat: 36.3220, lng: 59.5615, distanceMeters: 62 });
    const { unique, removedCount } = deduplicateMosquesSmart([a, b]);
    expect(unique).toHaveLength(1);
    expect(removedCount).toBe(1);
    expect(unique[0].providers).toContain('neshan');
    expect(unique[0].providers).toContain('osm');
  });

  it('never returns mosques from distant cities when user is outside radius', () => {
    // مختصات تبریز (خارج از شعاع ۵ کیلومتری لیست ثابت)
    const list = getInstantLocalMosques(38.08, 46.2919, 5000);
    expect(list).toHaveLength(0);
  });

  it('uses full nwr Overpass query without 25-item cap and no hardcoded Mashhad search terms', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'src/lib/neshanMosqueService.ts'), 'utf8');
    expect(src).toContain('nwr["amenity"="place_of_worship"]["religion"="muslim"]');
    expect(src).toContain('nwr["building"="mosque"]');
    expect(src).not.toContain('out center 25');
    expect(src).toContain('https://api.neshan.org/v1/nearby');
    expect(src).toContain('places.googleapis.com/v1/places:searchNearby');
    expect(src).not.toContain("'مسجد باباغدیر', 'حسینیه'");
  });
});
