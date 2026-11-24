import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  NOOR_APPLICATION_ID,
  resolveStoreChannel,
  isMarketChannel,
  resolveStoreUpdateLink,
} from '@/lib/storeChannel';

describe('CafeBazaar & Myket Store Release Compliance', () => {
  it('uses unique applicationId ir.noorcompanion.app across Capacitor, Gradle & Strings', () => {
    expect(NOOR_APPLICATION_ID).toBe('ir.noorcompanion.app');
    const cap = fs.readFileSync(path.join(process.cwd(), 'capacitor.config.ts'), 'utf8');
    const gradle = fs.readFileSync(path.join(process.cwd(), 'android/app/build.gradle'), 'utf8');
    const strings = fs.readFileSync(path.join(process.cwd(), 'android/app/src/main/res/values/strings.xml'), 'utf8');
    expect(cap).toContain("appId: 'ir.noorcompanion.app'");
    expect(gradle).toContain('applicationId "ir.noorcompanion.app"');
    expect(strings).toContain('ir.noorcompanion.app');
  });

  it('never exposes direct .apk self-update URLs in CafeBazaar or Myket builds', () => {
    expect(resolveStoreChannel('bazaar')).toBe('bazaar');
    expect(resolveStoreChannel('myket')).toBe('myket');
    expect(isMarketChannel('bazaar')).toBe(true);
    expect(isMarketChannel('myket')).toBe(true);
    expect(isMarketChannel('direct')).toBe(false);

    const bazaarUrl = resolveStoreUpdateLink('https://example.com/app.apk', 'bazaar');
    const myketUrl = resolveStoreUpdateLink('https://example.com/app.apk', 'myket');
    expect(bazaarUrl).toContain('cafebazaar.ir/app/ir.noorcompanion.app');
    expect(bazaarUrl).not.toContain('.apk');
    expect(myketUrl).toContain('myket.ir/app/ir.noorcompanion.app');
    expect(myketUrl).not.toContain('.apk');
  });

  it('removes unused CAMERA permission from AndroidManifest.xml', () => {
    const manifest = fs.readFileSync(path.join(process.cwd(), 'android/app/src/main/AndroidManifest.xml'), 'utf8');
    expect(manifest).not.toContain('android.permission.CAMERA');
  });

  it('ships official Privacy Policy with support contact & account deletion instructions', () => {
    const html = fs.readFileSync(path.join(process.cwd(), 'public/privacy.html'), 'utf8');
    expect(html).toContain('ir.noorcompanion.app');
    expect(html).toContain('ycnakbari@gmail.com');
    expect(html).toContain('@ak_yacn');
    expect(html).toContain('حذف حساب');
  });
});
