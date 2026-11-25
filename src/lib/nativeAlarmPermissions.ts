import { Capacitor, registerPlugin } from '@capacitor/core';

interface FullScreenAlarmBridge {
  checkFullScreenIntentPermission(): Promise<{
    granted: boolean;
    apiLevel: number;
    needsSettings: boolean;
  }>;
  openFullScreenIntentSettings(): Promise<void>;
}

const NoorAlarmPerm = registerPlugin<FullScreenAlarmBridge>('NoorAlarm');

export interface FullScreenPermissionStatus {
  granted: boolean;
  apiLevel: number;
  needsSettings: boolean;
}

export async function checkFullScreenIntentPermission(): Promise<FullScreenPermissionStatus> {
  if (!Capacitor.isNativePlatform()) {
    return { granted: true, apiLevel: 0, needsSettings: false };
  }
  try {
    const res = await NoorAlarmPerm.checkFullScreenIntentPermission();
    return {
      granted: Boolean(res?.granted),
      apiLevel: Number(res?.apiLevel || 0),
      needsSettings: Boolean(res?.needsSettings),
    };
  } catch {
    return { granted: true, apiLevel: 0, needsSettings: false };
  }
}

export async function openFullScreenIntentSettings(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await NoorAlarmPerm.openFullScreenIntentSettings();
  } catch {}
}
