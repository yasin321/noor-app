import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  HERO_30_DESIGNS,
  OFFLINE_SHRINE_IMAGE_MAP,
  getOfflineIranSafeImage,
  resolveCityMatchedHeroDesign,
} from '@/components/HeroHorizon30Gallery';

describe('Hero Horizon Gallery — 25 Unique Verified Offline Documentary Photos', () => {
  it('maps every single design to a unique local offline image file (zero duplicates)', () => {
    expect(HERO_30_DESIGNS.length).toBe(25);
    const usedPaths = new Set<string>();

    for (const design of HERO_30_DESIGNS) {
      const imgPath = getOfflineIranSafeImage(design.id);
      expect(OFFLINE_SHRINE_IMAGE_MAP[design.id], `Missing explicit map for ${design.id}`).toBe(imgPath);
      expect(usedPaths.has(imgPath), `Duplicate image ${imgPath} used by ${design.id}`).toBe(false);
      usedPaths.add(imgPath);

      const diskPath = path.join(process.cwd(), 'public', imgPath.replace(/^\//, ''));
      expect(fs.existsSync(diskPath), `Missing image on disk: ${diskPath}`).toBe(true);
      expect(fs.statSync(diskPath).size, `Image too small/corrupt: ${diskPath}`).toBeGreaterThan(5000);
    }
  });

  it('auto-matches major Iranian cities to their dedicated documentary landmarks', () => {
    expect(resolveCityMatchedHeroDesign('تهران')?.id).toBe('city_tehran_abdolazim');
    expect(resolveCityMatchedHeroDesign('تبریز')?.id).toBe('city_tabriz_blue_mosque');
    expect(resolveCityMatchedHeroDesign('یزد')?.id).toBe('city_yazd_jameh');
    expect(resolveCityMatchedHeroDesign('کرمان')?.id).toBe('city_kerman_jameh');
    expect(resolveCityMatchedHeroDesign('شیراز')?.id).toBe('city_shiraz_shahcheragh');
    expect(resolveCityMatchedHeroDesign('مشهد')?.id).toBe('shrine_mashhad_reza');
    expect(resolveCityMatchedHeroDesign('اصفهان')?.id).toBe('arch_isfahan_lotfollah');
    expect(resolveCityMatchedHeroDesign('قم')?.id).toBe('shrine_qom_jamkaran');
    expect(resolveCityMatchedHeroDesign('ساری')?.id).toBe('city_tabriz_blue_mosque');
    expect(resolveCityMatchedHeroDesign('کرمانشاه')?.id).toBe('city_shiraz_shahcheragh');
  });
});