import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { resolveLegacyColorMix } from '@/lib/legacyCssCompat';

const JAVA_DIR = path.join(process.cwd(), 'android/app/src/main/java/com/noor/app');

function readAllJavaFiles(): { name: string; content: string }[] {
  return fs
    .readdirSync(JAVA_DIR)
    .filter((f) => f.endsWith('.java'))
    .map((name) => ({ name, content: fs.readFileSync(path.join(JAVA_DIR, name), 'utf8') }));
}

describe('Permanent Android 7–16 (API 24–36) Universal Compatibility Gate', () => {
  it('resolves CSS color-mix() accurately to rgba() for legacy Android 7–11 WebViews', () => {
    expect(resolveLegacyColorMix('color-mix(in srgb, #10b981 20%, transparent)')).toBe('rgba(16, 185, 129, 0.2)');
    expect(resolveLegacyColorMix('color-mix(in srgb, #000000 50%, #ffffff)')).toBe('rgba(128, 128, 128, 1)');
    expect(
      resolveLegacyColorMix('linear-gradient(135deg, #10b981, color-mix(in srgb, #10b981 50%, transparent))')
    ).toBe('linear-gradient(135deg, #10b981, rgba(16, 185, 129, 0.5))');
    expect(resolveLegacyColorMix('rgba(16, 185, 129, 0.4)')).toBe('rgba(16, 185, 129, 0.4)');
  });

  it('keeps valid CSS universal selector & fallbacks in index.css and index.html', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'src/index.css'), 'utf8');
    const html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
    expect(css).not.toMatch(/^-\s*\{/m);
    expect(html).not.toMatch(/^-\s*\{/m);
    expect(css).toContain('background: var(--surface);');
    expect(css).toContain('background: var(--primary);');
  });

  it('enforces FLAG_IMMUTABLE on every PendingIntent across all Java files (Android 12–16)', () => {
    for (const file of readAllJavaFiles()) {
      const matches = [...file.content.matchAll(/PendingIntent\.get(?:Activity|Broadcast|Service)\s*\([^;]+\);/g)];
      for (const m of matches) {
        expect(
          m[0].includes('FLAG_IMMUTABLE') || m[0].includes('FLAG_MUTABLE'),
          `Missing PendingIntent mutability flag in ${file.name}: ${m[0]}`
        ).toBe(true);
      }
    }
  });

  it('guards every dynamic registerReceiver with API 33+ export flag (Android 14–16)', () => {
    for (const file of readAllJavaFiles()) {
      if (file.content.includes('registerReceiver(')) {
        expect(file.content, `Unprotected registerReceiver in ${file.name}`).toMatch(
          /RECEIVER_NOT_EXPORTED|RECEIVER_EXPORTED/
        );
      }
    }
  });

  it('guards API 26+ (NotificationChannel, VibrationEffect) & API 27+ (setShowWhenLocked) for Android 7–8', () => {
    for (const file of readAllJavaFiles()) {
      if (file.content.includes('new NotificationChannel(')) {
        expect(file.content, `Missing API 26 guard for NotificationChannel in ${file.name}`).toContain('VERSION_CODES.O');
      }
      if (file.content.includes('VibrationEffect.')) {
        expect(file.content, `Missing API 26 guard for VibrationEffect in ${file.name}`).toContain('VERSION_CODES.O');
      }
      if (file.content.includes('setShowWhenLocked(')) {
        expect(file.content, `Missing API 27 guard for setShowWhenLocked in ${file.name}`).toContain('VERSION_CODES.O_MR1');
      }
    }
  });

  it('enforces Android 15–16 Edge-to-Edge WindowInsets, Predictive Back, safe alarm stop & BootReceiver FGS compliance', () => {
    const main = fs.readFileSync(path.join(JAVA_DIR, 'MainActivity.java'), 'utf8');
    const alarmAct = fs.readFileSync(path.join(JAVA_DIR, 'AdhanAlarmActivity.java'), 'utf8');
    const alarmSrv = fs.readFileSync(path.join(JAVA_DIR, 'AdhanForegroundService.java'), 'utf8');
    const boot = fs.readFileSync(path.join(JAVA_DIR, 'BootReceiver.java'), 'utf8');

    expect(main).toContain('WindowInsetsCompat.Type.systemBars()');
    expect(main).toContain('WindowInsetsCompat.Type.ime()');
    expect(main).toContain('OnBackPressedCallback');

    expect(alarmAct).not.toContain('startService(stopIntent)');
    expect(alarmAct).toContain('stopPlaybackAndDismiss()');
    expect(alarmAct).toContain('WindowInsetsCompat.Type.displayCutout()');

    expect(alarmSrv).toContain('Service.STOP_FOREGROUND_REMOVE');
    expect(alarmSrv).not.toContain('stopForeground(true)');

    expect(boot).not.toContain('startForegroundService');
  });
});