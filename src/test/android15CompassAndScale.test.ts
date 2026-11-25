import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { DISPLAY_SCALE_CSS_MAP, normalizeDisplayScale } from '@/lib/displayScale';

describe('Android 15 Samsung Scaling, Native Compass Truncation/Watchdog & Quran Swipe Isolation', () => {
  it('provides responsive clamp() font scales including compact mode', () => {
    expect(normalizeDisplayScale('compact')).toBe('compact');
    expect(normalizeDisplayScale('invalid')).toBe('normal');
    expect(DISPLAY_SCALE_CSS_MAP.normal).toContain('clamp(');
    expect(DISPLAY_SCALE_CSS_MAP.compact).toContain('clamp(');
  });

  it('locks WebView textZoom(100) in MainActivity and sets text-size-adjust in index.css', () => {
    const main = fs.readFileSync(
      path.join(process.cwd(), 'android/app/src/main/java/com/noor/app/MainActivity.java'),
      'utf8'
    );
    const css = fs.readFileSync(path.join(process.cwd(), 'src/index.css'), 'utf8');
    expect(main).toContain('setTextZoom(100)');
    expect(main).toContain('setSupportZoom(false)');
    expect(css).toContain('-webkit-text-size-adjust: 100%');
    expect(css).toContain('clamp(');
  });

  it('fixes Samsung 5-element rotation vector crash, uses MainLooper & adds 1.5s accel+mag watchdog', () => {
    const plugin = fs.readFileSync(
      path.join(process.cwd(), 'android/app/src/main/java/com/noor/app/NoorAlarmPlugin.java'),
      'utf8'
    );
    expect(plugin).toContain('event.values.length > 4');
    expect(plugin).toContain('truncatedRot');
    expect(plugin).toContain('Looper.getMainLooper()');
    expect(plugin).toContain('accel_mag_watchdog');
  });

  it('isolates horizontal scroll strips from tab-swipe and removes weekday calendar icon box', () => {
    const app = fs.readFileSync(path.join(process.cwd(), 'src/App.tsx'), 'utf8');
    const quran = fs.readFileSync(path.join(process.cwd(), 'src/components/QuranAndMuhasabaModal.tsx'), 'utf8');
    const figma = fs.readFileSync(path.join(process.cwd(), 'src/components/FigmaLuxuryElements.tsx'), 'utf8');

    expect(app).toContain('node.scrollWidth > node.clientWidth');
    expect(quran).toContain('touch-pan-x');
    expect(quran).toContain('data-no-swipe="true"');
    expect(figma).not.toContain('<Calendar size={17} color="#FBBF24" />');
  });
});
