import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { adhans } from '@/lib/adhans';
import { dhikrLibrary } from '@/lib/dhikrLibrary';
import { POST_ADHAN_TRACKS } from '@/components/TawashihAndAdhanReminderSection';
import { DISPLAY_SCALE_CSS_MAP, normalizeDisplayScale } from '@/lib/displayScale';
import { ZARRAB_SURAH_NUMBER, ZARRAB_ESFAHANI_PHRASES } from '@/lib/zarrabEsfahaniData';
import { getSurahAudioDescriptor } from '@/lib/surahAlarmService';
import { calculateCelestialAzimuth } from '@/components/QiblaCompass';

describe('Final Release Gate — Offline Defaults, Quran Zarrab, Large Widget & Sun/Moon Qibla', () => {
  it('bundles Karim Mansouri (ahlolbait_30) offline on disk and in catalog', () => {
    const mp3Path = path.join(process.cwd(), 'public/adhans/ahlolbait_30.mp3');
    expect(fs.existsSync(mp3Path), 'Missing offline public/adhans/ahlolbait_30.mp3').toBe(true);
    expect(fs.statSync(mp3Path).size).toBeGreaterThan(50_000);

    const km = adhans.find((a) => a.id === 'ahlolbait_30');
    expect(km).toBeDefined();
    expect(km?.bundledOffline).toBe(true);
    expect(km?.audioUrl).toBe('/adhans/ahlolbait_30.mp3');
  });

  it('moves Salawat Zarrab Esfahani out of Dhikr library into Quran section (surah #115) with synced phrases & offline audio', () => {
    expect(dhikrLibrary.some((d) => d.id === 'salawat_zarrab_esfahani')).toBe(false);
    expect(ZARRAB_ESFAHANI_PHRASES.length).toBeGreaterThanOrEqual(15);

    const desc = getSurahAudioDescriptor(ZARRAB_SURAH_NUMBER);
    expect(desc.bundledPath).toBe('/adhans/post_zarrab_esfahani.mp3');

    const postTrack = POST_ADHAN_TRACKS.find((t) => t.id === 'salawat_zarrab_esfahani');
    expect(postTrack?.audioFile).toBe('/adhans/post_zarrab_esfahani.mp3');
  });

  it('enlarges Prayer Widget fonts & wires live HomeScreen updates to NoorAlarm.updatePrayerWidget', () => {
    const xml = fs.readFileSync(
      path.join(process.cwd(), 'android/app/src/main/res/layout/noor_prayer_widget.xml'),
      'utf8'
    );
    expect(xml).toContain('android:textSize="21dp"');
    expect(xml).toContain('android:textSize="17dp"');

    const home = fs.readFileSync(path.join(process.cwd(), 'src/components/HomeScreen.tsx'), 'utf8');
    expect(home).toContain('NoorAlarm.updatePrayerWidget');
  });

  it('computes valid offline Sun/Moon azimuth for magnetometer-less phones & keeps medium scale symmetric', () => {
    const res = calculateCelestialAzimuth(36.2605, 59.6168, new Date('2026-06-21T08:00:00Z'));
    expect(res.azimuthDeg).toBeGreaterThanOrEqual(0);
    expect(res.azimuthDeg).toBeLessThan(360);
    expect(['sun', 'moon']).toContain(res.body);

    expect(normalizeDisplayScale('medium')).toBe('medium');
    expect(DISPLAY_SCALE_CSS_MAP.medium).toContain('clamp(');
  });
});
