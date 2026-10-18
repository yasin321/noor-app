import { describe, it, expect } from 'vitest';
import { calculatePrayerTimes, timeToMinutes } from '@/lib/prayerTimes';

// Reference data from AlAdhan API (https://api.aladhan.com/v1/timings)
// Method 0 = Shia Ithna-Ashari, Leva Institute, Qum (Jafari)
//   Fajr angle: 16°, Isha angle: 14°, Maghrib angle: 4°, Midnight: JAFARI
// Coordinates: Tehran (35.6892, 51.3890), timezone Asia/Tehran
//
// Tolerance: ±3 minutes — minor differences are expected due to slight
// variations in solar position algorithms (Equation of Time, declination).
// The AlAdhan API uses the PrayTimes.org algorithm; our implementation
// follows the same formulas but with a simplified EoT approximation.

const TOLERANCE_MIN = 3;

type ReferenceRow = {
  date: Date;
  label: string;
  ref: {
    fajr: string; sunrise: string; dhuhr: string;
    asr: string; maghrib: string; isha: string; midnight: string;
  };
};

const TEHRAN_REF: ReferenceRow[] = [
  {
    label: 'Tehran — 2026-10-18 (autumn)',
    date: new Date(2026, 9, 18, 12, 0),
    ref: {
      fajr: '04:58', sunrise: '06:13', dhuhr: '11:50',
      asr: '15:00', maghrib: '17:41', isha: '18:31', midnight: '23:49',
    },
  },
  {
    label: 'Tehran — 2026-06-21 (summer solstice)',
    date: new Date(2026, 5, 21, 12, 0),
    ref: {
      fajr: '03:14', sunrise: '04:49', dhuhr: '12:06',
      asr: '15:55', maghrib: '19:42', isha: '20:44', midnight: '00:06',
    },
  },
];

function diffMin(our: string, ref: string): number {
  const o = timeToMinutes(our);
  const r = timeToMinutes(ref);
  if (isNaN(o) || isNaN(r)) return NaN;
  let d = Math.abs(o - r);
  if (d > 12 * 60) d = 24 * 60 - d;
  return d;
}

describe('Jafari reference data (AlAdhan API, method=0)', () => {
  for (const row of TEHRAN_REF) {
    describe(row.label, () => {
      const times = calculatePrayerTimes(row.date, 35.6892, 51.3890, 'Asia/Tehran', 'jafari');

      const checks: { key: string; our: string; ref: string }[] = [
        { key: 'fajr', our: times.fajr, ref: row.ref.fajr },
        { key: 'sunrise', our: times.sunrise, ref: row.ref.sunrise },
        { key: 'dhuhr', our: times.dhuhr, ref: row.ref.dhuhr },
        { key: 'asr', our: times.asr, ref: row.ref.asr },
        { key: 'maghrib', our: times.maghrib, ref: row.ref.maghrib },
        { key: 'isha', our: times.isha, ref: row.ref.isha },
        { key: 'midnight', our: times.midnight, ref: row.ref.midnight },
      ];

      for (const c of checks) {
        it(`${c.key} should be within ±${TOLERANCE_MIN} min of reference (${c.ref})`, () => {
          const d = diffMin(c.our, c.ref);
          expect(isNaN(d)).toBe(false);
          expect(d).toBeLessThanOrEqual(TOLERANCE_MIN);
        });
      }
    });
  }
});
