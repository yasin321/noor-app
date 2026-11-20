import { describe, expect, it } from 'vitest';
import {
  isValidIranPhone,
  normalizeIranPhone,
  formatIranPhoneDisplay,
  evaluatePasswordStrength,
  isValidGlobalPhone,
  phoneToSyntheticEmail,
} from '@/lib/authService';
import { getAdhanDurationSeconds } from '@/lib/adhans';
import { computeSurahClock } from '@/lib/surahAlarmService';

describe('Iran phone auth validation & formatting', () => {
  it('accepts formatted 11-digit Iranian mobile numbers like 0915 733 1216', () => {
    expect(isValidIranPhone('0915 733 1216')).toBe(true);
    expect(isValidIranPhone('09157331216')).toBe(true);
    expect(isValidIranPhone('۰۹۱۵ ۷۳۳ ۱۲۱۶')).toBe(true);
    expect(isValidIranPhone('+989157331216')).toBe(true);
    expect(normalizeIranPhone('0915 733 1216')).toBe('09157331216');
    expect(formatIranPhoneDisplay('09157331216')).toBe('0915 733 1216');
  });

  it('accepts international E.164 mobile numbers (Spain, US, UK) alongside Iran', () => {
    expect(isValidGlobalPhone('0915 733 1216')).toBe(true);
    expect(isValidGlobalPhone('+34 612 345 678')).toBe(true);
    expect(isValidGlobalPhone('+1 212 555 0199')).toBe(true);
    expect(isValidGlobalPhone('+44 7700 900077')).toBe(true);
    expect(phoneToSyntheticEmail('09157331216')).toBe('989157331216@phone.noor.app');
    expect(phoneToSyntheticEmail('+34 612 345 678')).toBe('34612345678@phone.noor.app');
  });

  it('rejects invalid or incomplete mobile numbers', () => {
    expect(isValidIranPhone('0915733121')).toBe(false);
    expect(isValidIranPhone('08157331216')).toBe(false);
    expect(isValidIranPhone('')).toBe(false);
  });

  it('evaluates password strength levels properly', () => {
    expect(evaluatePasswordStrength('123456').score).toBe(1);
    expect(evaluatePasswordStrength('noor1234').score).toBe(2);
    expect(evaluatePasswordStrength('Noor@2026!').score).toBe(3);
  });
});

describe('Adhan playback duration & surah custom clock', () => {
  it('maps adhan duration modes to exact seconds', () => {
    expect(getAdhanDurationSeconds('10s')).toBe(10);
    expect(getAdhanDurationSeconds('30s')).toBe(30);
    expect(getAdhanDurationSeconds('full')).toBe(0);
  });

  it('preserves user custom surah alarm time accurately', () => {
    const res = computeSurahClock('custom', 30, '21:45');
    expect(res.clock).toBe('21:45');
  });
});
