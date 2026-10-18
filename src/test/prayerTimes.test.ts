import { describe, it, expect } from 'vitest';
import { calculatePrayerTimes, getNextPrayer, timeToMinutes } from '@/lib/prayerTimes';

describe('prayerTimes', () => {
  it('should calculate prayer times for Tehran on a known date', () => {
    const date = new Date(2026, 0, 1); // Jan 1, 2026
    const times = calculatePrayerTimes(date, 35.6892, 51.3890, 'Asia/Tehran', 'jafari');

    expect(times.fajr).toMatch(/^\d{2}:\d{2}$/);
    expect(times.sunrise).toMatch(/^\d{2}:\d{2}$/);
    expect(times.dhuhr).toMatch(/^\d{2}:\d{2}$/);
    expect(times.asr).toMatch(/^\d{2}:\d{2}$/);
    expect(times.maghrib).toMatch(/^\d{2}:\d{2}$/);
    expect(times.isha).toMatch(/^\d{2}:\d{2}$/);
  });

  it('should have fajr before sunrise', () => {
    const date = new Date(2026, 5, 21); // summer solstice
    const times = calculatePrayerTimes(date, 35.6892, 51.3890, 'Asia/Tehran', 'jafari');

    const fajrMin = timeToMinutes(times.fajr);
    const sunriseMin = timeToMinutes(times.sunrise);
    expect(fajrMin).toBeLessThan(sunriseMin);
  });

  it('should have sunrise before dhuhr', () => {
    const date = new Date(2026, 5, 21);
    const times = calculatePrayerTimes(date, 35.6892, 51.3890, 'Asia/Tehran', 'jafari');

    const sunriseMin = timeToMinutes(times.sunrise);
    const dhuhrMin = timeToMinutes(times.dhuhr);
    expect(sunriseMin).toBeLessThan(dhuhrMin);
  });

  it('should have dhuhr before asr', () => {
    const date = new Date(2026, 5, 21);
    const times = calculatePrayerTimes(date, 35.6892, 51.3890, 'Asia/Tehran', 'jafari');

    const dhuhrMin = timeToMinutes(times.dhuhr);
    const asrMin = timeToMinutes(times.asr);
    expect(dhuhrMin).toBeLessThan(asrMin);
  });

  it('should have asr before maghrib', () => {
    const date = new Date(2026, 5, 21);
    const times = calculatePrayerTimes(date, 35.6892, 51.3890, 'Asia/Tehran', 'jafari');

    const asrMin = timeToMinutes(times.asr);
    const maghribMin = timeToMinutes(times.maghrib);
    expect(asrMin).toBeLessThan(maghribMin);
  });

  it('should have maghrib before isha', () => {
    const date = new Date(2026, 5, 21);
    const times = calculatePrayerTimes(date, 35.6892, 51.3890, 'Asia/Tehran', 'jafari');

    const maghribMin = timeToMinutes(times.maghrib);
    const ishaMin = timeToMinutes(times.isha);
    expect(maghribMin).toBeLessThan(ishaMin);
  });

  it('should have maghrib after sunset for jafari method (4 degree angle)', () => {
    const date = new Date(2026, 5, 21);
    const timesJafari = calculatePrayerTimes(date, 35.6892, 51.3890, 'Asia/Tehran', 'jafari');
    const timesMWL = calculatePrayerTimes(date, 35.6892, 51.3890, 'Asia/Tehran', 'mwl');

    const jafariMaghrib = timeToMinutes(timesJafari.maghrib);
    const mwlMaghrib = timeToMinutes(timesMWL.maghrib);
    expect(jafariMaghrib).toBeGreaterThan(mwlMaghrib);
  });

  it('should calculate hijri date', () => {
    const date = new Date(2026, 0, 1);
    const times = calculatePrayerTimes(date, 35.6892, 51.3890, 'Asia/Tehran', 'jafari');
    expect(times.hijriDate).toBeTruthy();
    expect(times.hijri).toMatch(/^\d+\/\d{2}\/\d{2}/);
  });

  it('should return next prayer info', () => {
    const date = new Date(2026, 5, 21, 10, 0); // 10 AM
    const times = calculatePrayerTimes(date, 35.6892, 51.3890, 'Asia/Tehran', 'jafari');
    const next = getNextPrayer(times, 'Asia/Tehran');
    expect(next).toBeTruthy();
    expect(next!.nameFa).toBeTruthy();
    expect(next!.remaining).toBeTruthy();
  });

  it('should handle different timezone from device', () => {
    const date = new Date(2026, 0, 15, 10, 0);
    const times = calculatePrayerTimes(date, 51.5074, -0.1278, 'Europe/London', 'jafari');
    expect(times.location).toBe('');
  });
});
