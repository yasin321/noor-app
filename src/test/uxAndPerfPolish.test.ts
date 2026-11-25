import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { resolveQiblaLocationLabel } from '@/components/QiblaCompass';

describe('Senior QA & UI/UX Polish Verification', () => {
  it('resolves Mashhad city name accurately when GPS is in Mashhad even if saved city is Tehran', () => {
    const tehranFallback = { lat: 35.6892, lng: 51.389, nameFa: 'تهران' };
    const resolved = resolveQiblaLocationLabel(36.2605, 59.6168, 'تهران', tehranFallback);
    expect(resolved).toContain('مشهد');
    expect(resolved).not.toBe('تهران');

    const tehranResolved = resolveQiblaLocationLabel(35.7, 51.4, 'تهران', tehranFallback);
    expect(tehranResolved).toBe('تهران');
  });

  it('guards network fetch calls in quranCatalog & SettingsScreen with AbortController timeouts', () => {
    const quran = fs.readFileSync(path.join(process.cwd(), 'src/lib/quranCatalog.ts'), 'utf8');
    const settings = fs.readFileSync(path.join(process.cwd(), 'src/components/SettingsScreen.tsx'), 'utf8');
    expect(quran).toContain('new AbortController()');
    expect(quran).toContain('fetchWithTimeout');
    expect(settings).toContain('new AbortController()');
  });

  it('enables React.lazy code-splitting, removes dead legacy HomeScreen & cleans MosqueFinder header', () => {
    const app = fs.readFileSync(path.join(process.cwd(), 'src/App.tsx'), 'utf8');
    const home = fs.readFileSync(path.join(process.cwd(), 'src/components/HomeScreen.tsx'), 'utf8');
    const mosque = fs.readFileSync(path.join(process.cwd(), 'src/components/MosqueFinderModal.tsx'), 'utf8');

    expect(app).toContain('lazy(');
    expect(app).toContain('<Suspense');
    expect(home).not.toContain('LegacyHomeScreenUnused');
    expect(mosque).not.toContain('AIzaSy...');
  });
});
