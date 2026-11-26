import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { calculateQiblaDirection } from '@/components/QiblaCompass';

describe('Native 3-Tier Qibla Compass & Android 7-16 Universal Compatibility', () => {
  it('computes accurate Qibla angles for Iranian and global cities', () => {
    const tehran = calculateQiblaDirection(35.6892, 51.389);
    const mashhad = calculateQiblaDirection(36.2605, 59.6168);
    expect(tehran).toBeGreaterThan(216);
    expect(tehran).toBeLessThan(221);
    expect(mashhad).toBeGreaterThan(232);
    expect(mashhad).toBeLessThan(236);
  });

  it('implements 3-tier SensorManager cascade, GeomagneticField true north & Android 12-16 safe delay', () => {
    const plugin = fs.readFileSync(
      path.join(process.cwd(), 'android/app/src/main/java/com/noor/app/NoorAlarmPlugin.java'),
      'utf8'
    );
    expect(plugin).toContain('public void startCompass(PluginCall call)');
    expect(plugin).toContain('public void stopCompass(PluginCall call)');
    expect(plugin).toContain('Sensor.TYPE_ROTATION_VECTOR');
    expect(plugin).toContain('Sensor.TYPE_GEOMAGNETIC_ROTATION_VECTOR');
    expect(plugin).toContain('Sensor.TYPE_ACCELEROMETER');
    expect(plugin).toContain('Sensor.TYPE_MAGNETIC_FIELD');
    expect(plugin).toContain('GeomagneticField');
    expect(plugin).toContain('SensorManager.SENSOR_DELAY_GAME');
    expect(plugin).not.toContain('SENSOR_DELAY_FASTEST');
    expect(plugin).toContain('handleOnDestroy');
  });

  it('wires QiblaCompass to native compassHeading listener and handles no_magnetometer gracefully', () => {
    const comp = fs.readFileSync(path.join(process.cwd(), 'src/components/QiblaCompass.tsx'), 'utf8');
    expect(comp).toContain("NoorCompass.addListener('compassHeading'");
    expect(comp).toContain('NoorCompass.startCompass');
    expect(comp).toContain('NoorCompass.stopCompass');
    expect(comp).toContain('no_magnetometer');
  });

  it('targets es2019/chrome74 in vite.config.ts for older Android 7/8/9 WebViews', () => {
    const vite = fs.readFileSync(path.join(process.cwd(), 'vite.config.ts'), 'utf8');
    expect(vite).toContain('chrome74');
    expect(vite).toContain('es2019');
  });
});
