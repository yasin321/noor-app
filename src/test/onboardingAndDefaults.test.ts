import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { getAdhanDurationMode } from '@/lib/adhans';
import { loadHeroConfig } from '@/components/HeroHorizon30Gallery';
import { getHomeModulesVisibility } from '@/components/HomeScreen';
import { loadTawashihConfig } from '@/components/TawashihAndAdhanReminderSection';
import { TUTORIAL_SEEN_KEY } from '@/components/AppTutorialModal';

describe('First-Run 6-Slide Onboarding, Minimalist Defaults & Permission Manager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('sets Karim Mansouri (ahlolbait_30) full adhan, Nasir al-Mulk Shiraz hero & minimalist home defaults', () => {
    expect(getAdhanDurationMode()).toBe('full');

    const heroCfg = loadHeroConfig();
    expect(heroCfg.mode).toBe('manual');
    expect(heroCfg.selectedId).toBe('arch_shiraz_nasir_al_mulk');

    const vis = getHomeModulesVisibility();
    expect(vis.showDeenWidgets).toBe(false);
    expect(vis.showContextualTip).toBe(false);
    expect(vis.showDailySummary).toBe(false);
    expect(vis.showAsrPrayer).toBe(true);
    expect(vis.showIshaPrayer).toBe(true);
    expect(vis.showMidnightTime).toBe(true);

    const tawashih = loadTawashihConfig();
    for (const slot of Object.values(tawashih)) {
      expect(slot.before.enabled).toBe(false);
      expect(slot.after.enabled).toBe(false);
    }

    const settingsSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/SettingsScreen.tsx'), 'utf8');
    expect(settingsSrc).toContain("|| 'ahlolbait_30'");
  });

  it('enforces first-run-only onboarding album, removes Home guide button & stays Android 7-16 safe', () => {
    expect(TUTORIAL_SEEN_KEY).toBe('noor_tutorial_seen_v1');

    const appSrc = fs.readFileSync(path.join(process.cwd(), 'src/App.tsx'), 'utf8');
    const homeSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/HomeScreen.tsx'), 'utf8');
    const modalSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/AppTutorialModal.tsx'), 'utf8');

    expect(appSrc).toContain("localStorage.getItem(FIRST_RUN_TUTORIAL_KEY) !== '1'");
    expect(appSrc).toContain('{!showFirstTimeGuide && <NotificationPermissionModal />}');
    expect(homeSrc).not.toContain('onOpenGuide');
    expect(homeSrc).not.toContain('showQuickGuide');

    expect(modalSrc).toContain('const TOTAL_SLIDES = 6;');
    expect(modalSrc).toContain('useState(true)');
    expect(modalSrc).toContain('data-no-swipe="true"');
    expect(modalSrc).not.toContain('color-mix(');
  });

  it('exposes persistent Permission Manager in Settings & guarded Android 7-16 native settings openers', () => {
    const settingsSrc = fs.readFileSync(path.join(process.cwd(), 'src/components/SettingsScreen.tsx'), 'utf8');
    const pluginSrc = fs.readFileSync(
      path.join(process.cwd(), 'android/app/src/main/java/com/noor/app/NoorAlarmPlugin.java'),
      'utf8'
    );

    expect(settingsSrc).toContain('data-permission-manager="true"');
    expect(settingsSrc).toContain('openAppNotificationSettings');
    expect(pluginSrc).toContain('openAppNotificationSettings');
    expect(pluginSrc).toContain('ACTION_APP_NOTIFICATION_SETTINGS');
    expect(pluginSrc).toContain('ACTION_APPLICATION_DETAILS_SETTINGS');
    expect(pluginSrc).toContain('checkExactAlarmPermission');
  });
});
