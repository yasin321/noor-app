import { describe, it, expect, beforeEach } from 'vitest';
import { addCustomDhikr, getCustomDhikr } from '@/lib/dhikrLibrary';
import {
  computeSurahClock,
  normalizeCustomClock,
  getSurahAudioDescriptor,
} from '@/lib/surahAlarmService';
import { isTodayUserBirthday, saveUserBirthday } from '@/lib/inboxService';
import { getJalaliParts } from '@/lib/jalali';

describe('Six-Item UX & Native Reliability Polish', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves custom personal dhikr with user-selected category', () => {
    const created = addCustomDhikr({
      arabic: 'سوره واقعه هدیه به والدین',
      translation: 'نیت برکت و شادی روح والدین',
      count: 1,
      category: 'mafatih',
      source: 'استاد عالی',
    });
    expect(created.category).toBe('mafatih');
    const saved = getCustomDhikr();
    expect(saved.length).toBe(1);
    expect(saved[0].category).toBe('mafatih');
  });

  it('resolves custom surah alarm times (Latin & Persian digits) and uses full surah MP3s', () => {
    expect(normalizeCustomClock('22:30')).toBe('22:30');
    expect(normalizeCustomClock('۲۲:۳۰')).toBe('22:30');
    expect(computeSurahClock('custom', 30, '22:30').clock).toBe('22:30');

    const waqiah = getSurahAudioDescriptor(56);
    expect(waqiah.adhanId).toBe('full_surah_056');
    expect(waqiah.bundledPath).toBeUndefined();
    expect(waqiah.remoteUrl).toContain('056.mp3');
  });

  it('detects both Jalali and Gregorian birthdays accurately', async () => {
    const sample = new Date(2026, 10, 23, 12, 0); // Nov 23, 2026
    const { jm, jd } = getJalaliParts(sample);

    await saveUserBirthday({ month: jm, day: jd, year: null, calendar: 'jalali' });
    expect(isTodayUserBirthday(sample).isBirthday).toBe(true);

    await saveUserBirthday({ month: 11, day: 23, year: 1995, calendar: 'gregorian' });
    expect(isTodayUserBirthday(sample).isBirthday).toBe(true);
    expect(isTodayUserBirthday(new Date(2026, 10, 24, 12, 0)).isBirthday).toBe(false);
  });
});
