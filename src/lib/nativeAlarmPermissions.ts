import { Capacitor, registerPlugin } from '@capacitor/core';

interface FullScreenAlarmBridge {
  checkFullScreenIntentPermission(): Promise<{
    granted: boolean;
    apiLevel: number;
    needsSettings: boolean;
  }>;
  openFullScreenIntentSettings(): Promise<void>;
  openAppNotificationSettings(): Promise<void>;
  checkExactAlarmPermission(): Promise<{
    granted: boolean;
    apiLevel: number;
  }>;
  openExactAlarmSettings(): Promise<void>;
}

const NoorAlarmPerm = registerPlugin<FullScreenAlarmBridge>('NoorAlarm');

export interface FullScreenPermissionStatus {
  granted: boolean;
  apiLevel: number;
  needsSettings: boolean;
}

export interface ExactAlarmPermissionStatus {
  granted: boolean;
  apiLevel: number;
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

export async function openAppNotificationSettings(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await NoorAlarmPerm.openAppNotificationSettings();
  } catch {}
}

export async function checkExactAlarmPermission(): Promise<ExactAlarmPermissionStatus> {
  if (!Capacitor.isNativePlatform()) {
    return { granted: true, apiLevel: 0 };
  }
  try {
    const res = await NoorAlarmPerm.checkExactAlarmPermission();
    return {
      granted: Boolean(res?.granted),
      apiLevel: Number(res?.apiLevel || 0),
    };
  } catch {
    return { granted: true, apiLevel: 0 };
  }
}

export async function openExactAlarmSettings(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await NoorAlarmPerm.openExactAlarmSettings();
  } catch {}
}
