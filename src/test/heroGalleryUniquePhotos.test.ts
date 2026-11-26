import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  HERO_30_DESIGNS,
  OFFLINE_SHRINE_IMAGE_MAP,
  getOfflineIranSafeImage,
  resolveCityMatchedHeroDesign,
  resolveOccasionHeroDesign,
  gregorianToJalali,
} from '@/components/HeroHorizon30Gallery';

describe('Hero Horizon Gallery — 40 Unique Verified Offline Photos (Shrines, Occasions, Nature & Cosmos)', () => {
  it('maps every single design (40/40) to a unique local offline image file (zero duplicates)', () => {
    expect(HERO_30_DESIGNS.length).toBe(40);
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

  it('auto-matches major Iranian cities without Persian substring overlap', () => {
    expect(resolveCityMatchedHeroDesign('تهران')?.id).toBe('city_tehran_abdolazim');
    expect(resolveCityMatchedHeroDesign('تبریز')?.id).toBe('city_tabriz_blue_mosque');
    expect(resolveCityMatchedHeroDesign('ساری')?.id).toBe('city_tabriz_blue_mosque');
    expect(resolveCityMatchedHeroDesign('یزد')?.id).toBe('city_yazd_jameh');
    expect(resolveCityMatchedHeroDesign('کرمان')?.id).toBe('city_kerman_jameh');
    expect(resolveCityMatchedHeroDesign('کرمانشاه')?.id).toBe('city_shiraz_shahcheragh');
    expect(resolveCityMatchedHeroDesign('شیراز')?.id).toBe('city_shiraz_shahcheragh');
    expect(resolveCityMatchedHeroDesign('مشهد')?.id).toBe('shrine_mashhad_reza');
    expect(resolveCityMatchedHeroDesign('اصفهان')?.id).toBe('arch_isfahan_lotfollah');
    expect(resolveCityMatchedHeroDesign('قم')?.id).toBe('shrine_qom_jamkaran');
  });

  it('auto-matches Iranian seasonal occasions (Nowruz, Chaharshanbe Suri, Sizdah Bedar, Yalda) & Hijri months', () => {
    // تبدیل شمسی دقیق
    expect(gregorianToJalali(2026, 3, 21)).toEqual({ jy: 1405, jm: 1, jd: 1 });
    expect(gregorianToJalali(2026, 4, 2)).toEqual({ jy: 1405, jm: 1, jd: 13 });
    expect(gregorianToJalali(2026, 12, 21)).toEqual({ jy: 1405, jm: 9, jd: 30 });

    // مناسبت‌های سنتی ایران (با hijri خنثی)
    expect(resolveOccasionHeroDesign(new Date(2026, 2, 21, 10, 0), 'dhuhr', { month: 5, day: 10 }).id).toBe('occ_iran_nowruz');
    expect(resolveOccasionHeroDesign(new Date(2026, 3, 2, 10, 0), 'dhuhr', { month: 5, day: 22 }).id).toBe('occ_iran_sizdah_bedar');
    expect(resolveOccasionHeroDesign(new Date(2026, 11, 21, 20, 0), 'isha', { month: 6, day: 10 }).id).toBe('occ_iran_yalda');
    expect(resolveOccasionHeroDesign(new Date(2026, 2, 17, 19, 0), 'maghrib', { month: 5, day: 6 }).id).toBe('occ_iran_chaharshanbe');

    // ماه‌های رجب، شعبان، رمضان (هلال، افطار، قدر) و محرم/عاشورا
    expect(resolveOccasionHeroDesign(new Date(2026, 5, 10, 10, 0), 'dhuhr', { month: 7, day: 13 }).id).toBe('occ_rajab_raghaib');
    expect(resolveOccasionHeroDesign(new Date(2026, 5, 10, 10, 0), 'dhuhr', { month: 8, day: 15 }).id).toBe('occ_shaban_celebration');
    expect(resolveOccasionHeroDesign(new Date(2026, 5, 10, 18, 0), 'maghrib', { month: 9, day: 12 }).id).toBe('occ_ramadan_iftar');
    expect(resolveOccasionHeroDesign(new Date(2026, 5, 10, 5, 0), 'fajr', { month: 9, day: 2 }).id).toBe('occ_ramadan_crescent');
    expect(resolveOccasionHeroDesign(new Date(2026, 5, 10, 22, 0), 'isha', { month: 9, day: 21 }).id).toBe('occ_laylat_al_qadr');
    expect(resolveOccasionHeroDesign(new Date(2026, 5, 10, 12, 0), 'dhuhr', { month: 1, day: 10 }).id).toBe('muharram_ashura_candles');
  });
});