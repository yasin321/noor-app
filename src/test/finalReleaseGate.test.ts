import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { adhans } from '@/lib/adhans';
import { dhikrLibrary } from '@/lib/dhikrLibrary';
import { POST_ADHAN_TRACKS } from '@/components/TawashihAndAdhanReminderSection';
import { DISPLAY_SCALE_CSS_MAP, normalizeDisplayScale } from '@/lib/displayScale';

describe('Final Release Gate — Offline Karim Mansouri Default & Font Scale Symmetry', () => {
  it('bundles Karim Mansouri (ahlolbait_30) offline on disk and in catalog', () => {
    const mp3Path = path.join(process.cwd(), 'public/adhans/ahlolbait_30.mp3');
    expect(fs.existsSync(mp3Path), 'Missing offline public/adhans/ahlolbait_30.mp3').toBe(true);
    expect(fs.statSync(mp3Path).size).toBeGreaterThan(50_000);

    const km = adhans.find((a) => a.id === 'ahlolbait_30');
    expect(km).toBeDefined();
    expect(km?.bundledOffline).toBe(true);
    expect(km?.audioUrl).toBe('/adhans/ahlolbait_30.mp3');
  });

  it('unifies default adhan fallback to ahlolbait_30 across TS and Java', () => {
    const files = [
      'src/lib/reminderService.ts',
      'src/lib/cloudSyncService.ts',
      'src/hooks/useAuth.tsx',
      'src/components/GlobalSyncHubModal.tsx',
      'src/components/TawashihAndAdhanReminderSection.tsx',
      'android/app/src/main/java/com/noor/app/AdhanForegroundService.java',
      'android/app/src/main/java/com/noor/app/NoorAlarmPlugin.java',
    ];
    for (const rel of files) {
      const txt = fs.readFileSync(path.join(process.cwd(), rel), 'utf8');
      expect(txt, `Missing ahlolbait_30 default in ${rel}`).toContain('ahlolbait_30');
    }
    const srv = fs.readFileSync(
      path.join(process.cwd(), 'android/app/src/main/java/com/noor/app/AdhanForegroundService.java'),
      'utf8'
    );
    expect(srv).toContain('public/adhans/ahlolbait_30.mp3');
  });

  it('supports medium display scale and symmetric 2x2 grid in SettingsScreen', () => {
    expect(normalizeDisplayScale('medium')).toBe('medium');
    expect(DISPLAY_SCALE_CSS_MAP.medium).toContain('clamp(');

    const settings = fs.readFileSync(path.join(process.cwd(), 'src/components/SettingsScreen.tsx'), 'utf8');
    expect(settings).toContain('className="grid grid-cols-2 gap-2"');
    expect(settings).toContain("id: 'compact'");
  });

  it('bundles Salawat Abul-Hasan Zarrab Esfahani (Mohsen Farahmand) offline for Friday afternoon', () => {
    const mp3Path = path.join(process.cwd(), 'public/adhans/post_zarrab_esfahani.mp3');
    expect(fs.existsSync(mp3Path), 'Missing public/adhans/post_zarrab_esfahani.mp3').toBe(true);
    expect(fs.statSync(mp3Path).size).toBeGreaterThan(50_000);

    const postTrack = POST_ADHAN_TRACKS.find((t) => t.id === 'salawat_zarrab_esfahani');
    expect(postTrack?.audioFile).toBe('/adhans/post_zarrab_esfahani.mp3');

    const libItem = dhikrLibrary.find((d) => d.id === 'salawat_zarrab_esfahani');
    expect(libItem?.audioUrl).toBe('/adhans/post_zarrab_esfahani.mp3');

    const srv = fs.readFileSync(
      path.join(process.cwd(), 'android/app/src/main/java/com/noor/app/AdhanForegroundService.java'),
      'utf8'
    );
    expect(srv).toContain('public/adhans/post_zarrab_esfahani.mp3');
  });
});
