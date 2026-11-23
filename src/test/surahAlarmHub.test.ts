import { describe, it, expect, beforeEach } from 'vitest';
import {
  scheduleSurahNativeAlarm,
  cancelSurahNativeAlarm,
  deleteSurahNativeAlarm,
  loadSurahAlarms,
} from '@/lib/surahAlarmService';

describe('Unified Surah Alarm Hub (Schedule / Pause / Edit / Delete)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists scheduled surah with speed & custom clock, pauses without data loss, edits, and deletes cleanly', async () => {
    await scheduleSurahNativeAlarm({
      surahNumber: 56,
      surahNameFa: 'سوره مبارکه واقعه',
      virtueFa: 'وسعت رزق',
      anchor: 'custom',
      offsetMinutes: 30,
      customTime: '22:30',
      speed: 1.5,
    });

    let all = loadSurahAlarms();
    expect(all[56]).toBeDefined();
    expect(all[56].enabled).toBe(true);
    expect(all[56].resolvedClock).toBe('22:30');
    expect(all[56].speed).toBe(1.5);

    // Pause keeps clock and speed intact
    await cancelSurahNativeAlarm(56);
    all = loadSurahAlarms();
    expect(all[56].enabled).toBe(false);
    expect(all[56].resolvedClock).toBe('22:30');
    expect(all[56].speed).toBe(1.5);

    // Edit updates time & speed and re-enables
    await scheduleSurahNativeAlarm({
      surahNumber: 56,
      surahNameFa: 'سوره مبارکه واقعه',
      virtueFa: 'وسعت رزق',
      anchor: 'custom',
      offsetMinutes: 30,
      customTime: '23:15',
      speed: 2,
    });
    all = loadSurahAlarms();
    expect(all[56].enabled).toBe(true);
    expect(all[56].resolvedClock).toBe('23:15');
    expect(all[56].speed).toBe(2);

    // Delete removes completely from hub
    await deleteSurahNativeAlarm(56);
    all = loadSurahAlarms();
    expect(all[56]).toBeUndefined();
  });
});
