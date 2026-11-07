import { describe, it, expect } from 'vitest';
import { ALL_114_SURAHS, getQuranDisplayMode, setQuranDisplayMode } from '@/lib/quranCatalog';
import { haversineMeters, getNeshanApiKey } from '@/lib/neshanMosqueService';
import { adhans, getAdhanDurationMode, setAdhanDurationMode, getAdhanDurationSeconds } from '@/lib/adhans';

describe('Noor Comprehensive Architecture & Modules', () => {
  it('contains all 114 surahs of the Holy Quran with Persian names and ayah counts', () => {
    expect(ALL_114_SURAHS.length).toBe(114);
    expect(ALL_114_SURAHS[0].number).toBe(1);
    expect(ALL_114_SURAHS[55].number).toBe(56); // Surah Al-Waqiah
    expect(ALL_114_SURAHS[55].ayahCount).toBe(96);
    expect(ALL_114_SURAHS[113].number).toBe(114);
  });

  it('persists Quran display mode (page / chunk5 / single)', () => {
    setQuranDisplayMode('chunk5');
    expect(getQuranDisplayMode()).toBe('chunk5');
    setQuranDisplayMode('page');
    expect(getQuranDisplayMode()).toBe('page');
  });

  it('calculates accurate Haversine distance for Neshan Mosque Finder', () => {
    // فاصله تقریبی دو نقطه در مشهد مقدس
    const dist = haversineMeters(36.2880, 59.6157, 36.2910, 59.6190);
    expect(dist).toBeGreaterThan(300);
    expect(dist).toBeLessThan(600);
    expect(getNeshanApiKey()).toContain('service.');
  });

  it('manages adhan playback duration modes (full, 10s, 30s) and distinct reciters', () => {
    expect(adhans.length).toBeGreaterThanOrEqual(10);
    expect(adhans.some((a) => a.id === 'moazenzadeh_ardabili')).toBe(true);
    expect(adhans.some((a) => a.id === 'turkey_istanbul')).toBe(true);

    setAdhanDurationMode('10s');
    expect(getAdhanDurationMode()).toBe('10s');
    expect(getAdhanDurationSeconds()).toBe(10);

    setAdhanDurationMode('full');
    expect(getAdhanDurationSeconds()).toBe(0);
  });
});
