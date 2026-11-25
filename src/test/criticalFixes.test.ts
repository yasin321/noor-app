import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  registerBackHandler,
  dispatchBackPress,
  clearAllBackHandlersForTest,
} from '@/lib/backNavigation';
import {
  normalizeTargetCountInput,
  resolveTargetCountInput,
} from '@/components/LibraryScreen';

describe('Critical Android 15 Alarm, Volume/Power Stop, Dhikr Count & Edge-Back Fixes', () => {
  beforeEach(() => {
    clearAllBackHandlersForTest();
  });

  it('dispatches Android system back gestures in strict LIFO order (modal -> subpage -> tab -> root exit)', () => {
    const trace: string[] = [];
    const unsubTab = registerBackHandler(() => { trace.push('tab-to-home'); return true; });
    const unsubSub = registerBackHandler(() => { trace.push('close-subpage'); return true; });
    const unsubModal = registerBackHandler(() => { trace.push('close-modal'); return true; });

    expect(dispatchBackPress()).toBe(true);
    expect(trace).toEqual(['close-modal']);
    unsubModal();

    expect(dispatchBackPress()).toBe(true);
    expect(trace).toEqual(['close-modal', 'close-subpage']);
    unsubSub();

    expect(dispatchBackPress()).toBe(true);
    expect(trace).toEqual(['close-modal', 'close-subpage', 'tab-to-home']);
    unsubTab();

    // At root Home screen with no overlays, returns false so native double-back exit runs
    expect(dispatchBackPress()).toBe(false);
  });

  it('allows clearing custom dhikr count input completely and accepts Latin & Persian digits', () => {
    expect(normalizeTargetCountInput('')).toBe('');
    expect(normalizeTargetCountInput('۱۲۵')).toBe('125');
    expect(normalizeTargetCountInput('abc330xyz')).toBe('330');

    expect(resolveTargetCountInput('', 33)).toBe(33);
    expect(resolveTargetCountInput('۱۴۰', 33)).toBe(140);
    expect(resolveTargetCountInput('0', 33)).toBe(33);
    expect(resolveTargetCountInput('250000', 33)).toBe(100000);
  });

  it('enforces Android 15 FullScreenIntent compliance, hardware volume/power stop & OnBackPressedCallback in Java', () => {
    const javaDir = path.join(process.cwd(), 'android/app/src/main/java/com/noor/app');
    const receiver = fs.readFileSync(path.join(javaDir, 'AdhanAlarmReceiver.java'), 'utf8');
    const service = fs.readFileSync(path.join(javaDir, 'AdhanForegroundService.java'), 'utf8');
    const activity = fs.readFileSync(path.join(javaDir, 'AdhanAlarmActivity.java'), 'utf8');
    const plugin = fs.readFileSync(path.join(javaDir, 'NoorAlarmPlugin.java'), 'utf8');
    const main = fs.readFileSync(path.join(javaDir, 'MainActivity.java'), 'utf8');

    // No premature screen wake before fullScreenIntent
    expect(receiver).not.toContain('SCREEN_BRIGHT_WAKE_LOCK');
    expect(service).not.toContain('SCREEN_BRIGHT_WAKE_LOCK');
    expect(service).toContain('noor_fullscreen_alarm_v8');
    expect(service).toContain('PendingIntent.getBroadcast');

    // Hardware volume & power/lock button stops playback
    expect(service).toContain('Intent.ACTION_SCREEN_OFF');
    expect(service).toContain('android.media.VOLUME_CHANGED_ACTION');
    expect(activity).toContain('dispatchKeyEvent');
    expect(activity).toContain('KEYCODE_VOLUME_UP');
    expect(activity).toContain('KEYCODE_VOLUME_DOWN');

    // Android 14/15 Full-screen intent permission bridge
    expect(plugin).toContain('canUseFullScreenIntent');
    expect(plugin).toContain('ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT');

    // Android 12-16 system back gesture dispatcher
    expect(main).toContain('OnBackPressedCallback');
    expect(main).toContain('__noorHandleNativeBack');
  });
});
