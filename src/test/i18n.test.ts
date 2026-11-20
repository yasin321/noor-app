import { describe, it, expect } from 'vitest';
import {
  translations,
  LANGUAGE_OPTIONS,
  getDirectionForLang,
  formatDigitsForLang,
  formatDateForLang,
  getPrayerLabelForLang,
  translateKey,
  type AppLang,
  type TranslationKey,
} from '@/i18n';
import { getCityById, getCityDisplayName, getCountryDisplayName } from '@/lib/cities';

describe('i18n 3-language architecture (FA / EN / ES)', () => {
  it('has 100% key parity and zero empty values across fa, en, and es', () => {
    const faKeys = Object.keys(translations.fa) as TranslationKey[];
    expect(faKeys.length).toBeGreaterThan(50);

    for (const lang of ['fa', 'en', 'es'] as AppLang[]) {
      const langKeys = Object.keys(translations[lang]);
      expect(langKeys.length).toBe(faKeys.length);
      for (const k of faKeys) {
        expect(translations[lang][k]).toBeTruthy();
        expect(translations[lang][k].trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('resolves RTL for Persian and LTR for English & Spanish', () => {
    expect(getDirectionForLang('fa')).toBe('rtl');
    expect(getDirectionForLang('en')).toBe('ltr');
    expect(getDirectionForLang('es')).toBe('ltr');
    expect(LANGUAGE_OPTIONS.map((o) => o.id)).toEqual(['fa', 'en', 'es']);
  });

  it('formats digits according to active language', () => {
    expect(formatDigitsForLang('05:17', 'fa')).toBe('۰۵:۱۷');
    expect(formatDigitsForLang('05:17', 'en')).toBe('05:17');
    expect(formatDigitsForLang('05:17', 'es')).toBe('05:17');
  });

  it('provides accurate prayer names and localized dates in FA, EN, ES', () => {
    expect(getPrayerLabelForLang('maghrib', 'fa')).toBe('مغرب');
    expect(getPrayerLabelForLang('maghrib', 'en')).toBe('Maghrib');
    expect(getPrayerLabelForLang('maghrib', 'es')).toBe('Magrib');

    const d = new Date(2026, 10, 20, 12, 0);
    expect(formatDateForLang(d, 'fa')).toContain('آبان');
    expect(formatDateForLang(d, 'en')).toContain('2026');
    expect(formatDateForLang(d, 'es')).toContain('2026');
  });

  it('resolves trilingual city and country names cleanly', () => {
    const madrid = getCityById('madrid');
    expect(getCityDisplayName(madrid, 'fa')).toBe('مادرید');
    expect(getCityDisplayName(madrid, 'en')).toBe('Madrid');
    expect(getCityDisplayName(madrid, 'es')).toBe('Madrid');
    expect(getCountryDisplayName(madrid, 'fa')).toBe('اسپانیا');
    expect(getCountryDisplayName(madrid, 'en')).toBe('Spain');
    expect(getCountryDisplayName(madrid, 'es')).toBe('España');

    const ny = getCityById('new_york');
    expect(getCityDisplayName(ny, 'es')).toBe('Nueva York');
    expect(getCountryDisplayName(ny, 'es')).toBe('Estados Unidos');
  });

  it('keeps default Persian nav labels intact for E2E regression safety', () => {
    expect(translateKey('fa', 'nav.tasbih')).toBe('ذکرشمار');
    expect(translateKey('fa', 'nav.library')).toBe('ذکرها');
    expect(translateKey('fa', 'nav.home')).toBe('خانه');
    expect(translateKey('fa', 'nav.reminders')).toBe('یادآوری');
    expect(translateKey('fa', 'nav.settings')).toBe('تنظیمات');
  });
});
