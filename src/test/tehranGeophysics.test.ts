import { describe, it, expect } from 'vitest';
import { calculatePrayerTimes, timeToMinutes } from '@/lib/prayerTimes';

function diffMin(a: string, b: string): number {
  let d = Math.abs(timeToMinutes(a) - timeToMinutes(b));
  if (d > 720) d = 1440 - d;
  return d;
}

describe('Iran Official Geophysics Calendar (method=tehran, ±1 min precision)', () => {
  const nov20 = new Date(2026, 10, 20, 12, 0); // جمعه ۲۹ آبان ۱۴۰۵

  it('matches official Tehran prayer times within ±1 minute', () => {
    const t = calculatePrayerTimes(nov20, 35.6892, 51.3890, 'Asia/Tehran', 'tehran');
    expect(diffMin(t.fajr, '05:17')).toBeLessThanOrEqual(1);
    expect(diffMin(t.sunrise, '06:45')).toBeLessThanOrEqual(1);
    expect(diffMin(t.dhuhr, '11:50')).toBeLessThanOrEqual(1);
    expect(diffMin(t.asr, '14:35')).toBeLessThanOrEqual(1);
    expect(diffMin(t.maghrib, '17:14')).toBeLessThanOrEqual(1);
    expect(diffMin(t.isha, '18:03')).toBeLessThanOrEqual(1);
    expect(diffMin(t.midnight, '23:06')).toBeLessThanOrEqual(1);
  });

  it('matches official Mashhad prayer times within ±1 minute', () => {
    const t = calculatePrayerTimes(nov20, 36.2605, 59.6168, 'Asia/Tehran', 'tehran');
    expect(diffMin(t.fajr, '04:45')).toBeLessThanOrEqual(1);
    expect(diffMin(t.sunrise, '06:13')).toBeLessThanOrEqual(1);
    expect(diffMin(t.dhuhr, '11:17')).toBeLessThanOrEqual(1);
    expect(diffMin(t.maghrib, '16:40')).toBeLessThanOrEqual(1);
    expect(diffMin(t.midnight, '22:33')).toBeLessThanOrEqual(1);
  });
});
