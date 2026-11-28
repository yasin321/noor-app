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
    provider: 'osm_map',
    providers: ['osm_map'],
    ...overrides,
  };
}

describe('Mosque Discovery Engine v3 (6-Layer Zero-Miss Radar)', () => {
  it('normalizes Persian/Arabic characters, ZWNJ, and honorific parentheses', () => {
    expect(normalizePersianMosqueName('مسجد صاحب‌الزمان (عج)')).toBe(
      normalizePersianMosqueName('مسجد صاحب الزمان')
    );
    expect(normalizePersianMosqueName('حسينيه علي ابن ابيطالب')).toBe(
      normalizePersianMosqueName('حسینیه علی ابن ابیطالب')
    );
  });

  it('preserves two distinct mosques that are only 30 meters apart', () => {
    const a = makeMosque({ id: 'a', providerId: 'osm_node_1', name: 'مسجد امام حسن', lat: 36.3200, lng: 59.5600, distanceMeters: 40 });
    const b = makeMosque({ id: 'b', providerId: 'osm_node_2', provider: 'photon', providers: ['photon'], name: 'مسجد صاحب الزمان', lat: 36.32025, lng: 59.5600, distanceMeters: 68 });
    const { unique, removedCount } = deduplicateMosquesSmart([a, b]);
    expect(unique).toHaveLength(2);
    expect(removedCount).toBe(0);
  });

  it('merges the same mosque reported by OSM Map and Photon with shared osm providerId', () => {
    const a = makeMosque({ id: 'osm_way_50', providerId: 'osm_way_50', provider: 'osm_map', providers: ['osm_map'], name: 'مسجد و حسینیه ولیعصر', lat: 36.2920, lng: 59.5655, distanceMeters: 25 });
    const b = makeMosque({ id: 'osm_way_50', providerId: 'osm_way_50', provider: 'photon', providers: ['photon'], name: 'مسجد محله', lat: 36.2920, lng: 59.5655, distanceMeters: 25 });
    const { unique, removedCount } = deduplicateMosquesSmart([a, b]);
    expect(unique).toHaveLength(1);
    expect(removedCount).toBe(1);
    expect(unique[0].name).toBe('مسجد و حسینیه ولیعصر');
    expect(unique[0].providers).toContain('osm_map');
    expect(unique[0].providers).toContain('photon');
  });

  it('never returns mosques from distant cities outside radius', () => {
    const list = getInstantLocalMosques(38.08, 46.2919, 5000);
    expect(list).toHaveLength(0);
  });

  it('includes resilient multi-source layers (OSM Map 0.6 + Photon + Nominatim + Overpass race + Google Places New)', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'src/lib/neshanMosqueService.ts'), 'utf8');
    expect(src).toContain('api.openstreetmap.org/api/0.6/map.json');
    expect(src).toContain('photon.komoot.io/api/');
    expect(src).toContain('nominatim.openstreetmap.org/search');
    expect(src).toContain('nwr["amenity"="place_of_worship"]');
    expect(src).toContain('places.googleapis.com/v1/places:searchNearby');
  });
});