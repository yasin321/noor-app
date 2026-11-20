import { Capacitor } from '@capacitor/core';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  loadAdhanStudio,
  loadQuranContinuity,
  saveQuranContinuity,
  loadMosqueAndTravel,
  saveMosqueAndTravel,
} from '@/lib/deenIntelligenceStore';
import { loadReminders } from '@/lib/reminderStorage';
import { getCustomDhikr } from '@/lib/dhikrLibrary';
import { getTodayTotal, getTodayRounds, getSession } from '@/lib/tasbihStorage';
import { getGuestCityId, setGuestCityId } from '@/lib/cities';
import {
  loadTawashihConfig,
  syncAllTawashihNativeAlarms,
} from '@/components/TawashihAndAdhanReminderSection';
import { loadSurahAlarms, syncAllSurahNativeAlarms } from '@/lib/surahAlarmService';

export interface CloudSyncStatus {
  lastSyncedAtIso: string | null;
  lastDirection: 'up' | 'down' | 'both' | null;
  lastError: string | null;
}

const CLOUD_SYNC_STATUS_KEY = 'noor_cloud_sync_status_v1';
export const CLOUD_SYNC_STATUS_EVENT = 'noor-cloud-sync-status-changed';

export function getLastCloudSyncStatus(): CloudSyncStatus {
  try {
    const raw = localStorage.getItem(CLOUD_SYNC_STATUS_KEY);
    if (raw) return JSON.parse(raw) as CloudSyncStatus;
  } catch {}
  return { lastSyncedAtIso: null, lastDirection: null, lastError: null };
}

function saveCloudSyncStatus(status: CloudSyncStatus): void {
  try {
    localStorage.setItem(CLOUD_SYNC_STATUS_KEY, JSON.stringify(status));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(CLOUD_SYNC_STATUS_EVENT, { detail: status }));
    }
  } catch {}
}

function getPlatformTag(): string {
  const p = Capacitor.getPlatform();
  if (p === 'android') return 'android';
  if (p === 'ios') return 'ios';
  return 'web';
}

function getTodayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

function safeParseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function syncLocalStateToCloud(userId: string | null | undefined): Promise<boolean> {
  if (!userId || !isSupabaseConfigured || userId.startsWith('local_')) return false;
  try {
    const appSettings = {
      fontFamily: localStorage.getItem('noor_font_family') || 'Vazirmatn',
      fontScale: localStorage.getItem('noor_font_scale') || 'normal',
      quranDisplayMode: localStorage.getItem('noor_quran_display_mode_v1') || 'page',
      adhanDurationMode: localStorage.getItem('noor_adhan_duration_mode_v1') || 'full',
      adhanStudio: loadAdhanStudio(),
      mosqueTravel: loadMosqueAndTravel(),
    };
    const quranState = loadQuranContinuity();
    const remindersBackup = {
      reminders: loadReminders(),
      completionLog: safeParseJson<Record<string, unknown>>(
        localStorage.getItem('noor_reminders_completion_log_v1'),
        {}
      ),
    };
    const tawashihConfig = loadTawashihConfig();
    const surahAlarms = loadSurahAlarms();
    const customDhikrs = getCustomDhikr();
    const qazaState = safeParseJson<Record<string, unknown>>(
      localStorage.getItem('noor_qaza_ledger_v1') || localStorage.getItem('noor_vip_qaza_v1'),
      {}
    );

    const { error } = await supabase
      .from('profiles')
      .update({
        city_id: getGuestCityId(),
        adhan_id: localStorage.getItem('noor_guest_adhan_id') || 'moazenzadeh_ardabili',
        theme_id: localStorage.getItem('noor_theme') || 'emerald',
        app_settings: appSettings,
        quran_state: quranState,
        reminders_backup: remindersBackup,
        tawashih_config: tawashihConfig,
        surah_alarms: surahAlarms,
        qaza_state: qazaState,
        custom_dhikrs: customDhikrs,
        last_synced_platform: getPlatformTag(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) return false;

    // همگام‌سازی آمار روزانه تسبیح (بدون از دست رفتن شمارش بین گوشی و کروم)
    const todayTotal = getTodayTotal();
    const todayRounds = getTodayRounds();
    const activeSession = getSession();
    if (todayTotal > 0 || todayRounds > 0) {
      await supabase.from('tasbih_logs').upsert(
        {
          user_id: userId,
          log_date: getTodayIsoDate(),
          dhikr_id: activeSession.dhikrId || 'salawat',
          count: todayTotal,
          rounds: todayRounds,
        },
        { onConflict: 'user_id,log_date,dhikr_id' }
      );
    }

    saveCloudSyncStatus({
      lastSyncedAtIso: new Date().toISOString(),
      lastDirection: 'up',
      lastError: null,
    });
    return true;
  } catch {
    return false;
  }
}

export async function pullCloudStateToLocal(userId: string | null | undefined): Promise<boolean> {
  if (!userId || !isSupabaseConfigured || userId.startsWith('local_')) return false;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) return false;

    if (typeof data.city_id === 'string' && data.city_id.trim()) {
      setGuestCityId(data.city_id);
      window.dispatchEvent(new Event('noor-city-changed'));
    }

    if (typeof data.adhan_id === 'string' && data.adhan_id.trim()) {
      localStorage.setItem('noor_guest_adhan_id', data.adhan_id);
    }

    if (data.quran_state && typeof data.quran_state === 'object' && 'surahIndex' in data.quran_state) {
      const localQ = loadQuranContinuity();
      const cloudQ = data.quran_state as ReturnType<typeof loadQuranContinuity>;
      const mergedBookmarks = [...(cloudQ.bookmarks || [])];
      for (const lb of localQ.bookmarks || []) {
        if (!mergedBookmarks.some((cb) => cb.surahNameFa === lb.surahNameFa && cb.ayahNumber === lb.ayahNumber)) {
          mergedBookmarks.push(lb);
        }
      }
      saveQuranContinuity({
        ...localQ,
        ...cloudQ,
        bookmarks: mergedBookmarks.slice(0, 40),
      });
    }

    if (data.app_settings && typeof data.app_settings === 'object') {
      const settings = data.app_settings as Record<string, unknown>;
      if (settings.mosqueTravel && typeof settings.mosqueTravel === 'object') {
        const curMt = loadMosqueAndTravel();
        saveMosqueAndTravel({ ...curMt, ...(settings.mosqueTravel as Partial<typeof curMt>) });
      }
    }

    if (Array.isArray(data.custom_dhikrs) && data.custom_dhikrs.length > 0) {
      const localCustom = getCustomDhikr();
      const merged = [...localCustom];
      for (const item of data.custom_dhikrs) {
        if (item && typeof item.id === 'string' && !merged.some((x) => x.id === item.id)) {
          merged.push(item);
        }
      }
      localStorage.setItem('noor_custom_dhikr_v1', JSON.stringify(merged));
    }

    if (data.tawashih_config && typeof data.tawashih_config === 'object' && 'fajr' in data.tawashih_config) {
      const existingRaw = localStorage.getItem('noor_tawashih_redesign_config_v2');
      if (!existingRaw) {
        localStorage.setItem('noor_tawashih_redesign_config_v2', JSON.stringify(data.tawashih_config));
        void syncAllTawashihNativeAlarms(loadTawashihConfig());
      }
    }

    if (data.surah_alarms && typeof data.surah_alarms === 'object' && Object.keys(data.surah_alarms).length > 0) {
      const existingSurah = localStorage.getItem('noor_surah_native_alarms_v1');
      if (!existingSurah) {
        localStorage.setItem('noor_surah_native_alarms_v1', JSON.stringify(data.surah_alarms));
        void syncAllSurahNativeAlarms();
      }
    }

    saveCloudSyncStatus({
      lastSyncedAtIso: new Date().toISOString(),
      lastDirection: 'down',
      lastError: null,
    });
    return true;
  } catch {
    return false;
  }
}

export async function runFullUserCloudSync(
  userId: string | null | undefined
): Promise<{ ok: boolean; syncedAtIso: string | null }> {
  if (!userId || !isSupabaseConfigured || userId.startsWith('local_')) {
    return { ok: false, syncedAtIso: null };
  }
  await pullCloudStateToLocal(userId);
  const ok = await syncLocalStateToCloud(userId);
  const syncedAtIso = ok ? new Date().toISOString() : null;
  saveCloudSyncStatus({
    lastSyncedAtIso: syncedAtIso ?? getLastCloudSyncStatus().lastSyncedAtIso,
    lastDirection: 'both',
    lastError: ok ? null : 'همگام‌سازی ابری کامل نشد',
  });
  return { ok, syncedAtIso };
}
