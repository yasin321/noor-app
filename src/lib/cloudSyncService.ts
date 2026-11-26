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
import { getCustomDhikr, getFavoriteDhikrIds } from '@/lib/dhikrLibrary';
import { getTodayTotal, getTodayRounds, getSession } from '@/lib/tasbihStorage';
import { getGuestCityId, setGuestCityId } from '@/lib/cities';
import {
  loadTawashihConfig,
  syncAllTawashihNativeAlarms,
} from '@/components/TawashihAndAdhanReminderSection';
import { loadSurahAlarms, syncAllSurahNativeAlarms } from '@/lib/surahAlarmService';
import { rescheduleAllReminders } from '@/lib/reminderService';

export interface CloudSyncStatus {
  lastSyncedAtIso: string | null;
  lastDirection: 'up' | 'down' | 'both' | null;
  lastError: string | null;
}

const CLOUD_SYNC_STATUS_KEY = 'noor_cloud_sync_status_v1';
export const CLOUD_SYNC_STATUS_EVENT = 'noor-cloud-sync-status-changed';

// کلیدهایی که هرگز نباید به سرور ارسال شوند (حریم خصوصی محاسبه نفس + کش‌های حجیم + نشست محلی)
function isExcludedFromCloudSnapshot(key: string): boolean {
  if (!key.startsWith('noor_')) return true;
  const k = key.toLowerCase();
  return (
    k.includes('muhasaba') ||
    k.includes('surah_cache') ||
    k.includes('ota_') ||
    k.includes('global_sync') ||
    k.includes('cloud_sync') ||
    k.includes('phone_accounts') ||
    k.includes('phone_session') ||
    k.includes('logs') ||
    k.includes('diagnostic') ||
    k.includes('geocode') ||
    k.includes('weather_cache') ||
    k.includes('downloaded_adhan')
  );
}

function collectDeviceUserSnapshot(): Record<string, string> {
  const snapshot: Record<string, string> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || isExcludedFromCloudSnapshot(k)) continue;
      const val = localStorage.getItem(k);
      if (typeof val === 'string' && val.length <= 65000) {
        snapshot[k] = val;
      }
    }
  } catch {}
  return snapshot;
}

function isFreshInstallDevice(): boolean {
  try {
    const hasTawashih = Boolean(localStorage.getItem('noor_tawashih_redesign_config_v2'));
    const hasTasbih = getTodayTotal() > 0 || getTodayRounds() > 0 || getSession().count > 0;
    const hasFavs = getFavoriteDhikrIds().length > 0;
    const hasCustom = getCustomDhikr().length > 0;
    return !hasTawashih && !hasTasbih && !hasFavs && !hasCustom;
  } catch {
    return false;
  }
}

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
      favoriteDhikrIds: getFavoriteDhikrIds(),
      customDhikrCounts: safeParseJson<Record<string, number>>(
        localStorage.getItem('noor_custom_dhikr_counts_v1'),
        {}
      ),
      heroConfig: safeParseJson<Record<string, unknown>>(
        localStorage.getItem('noor_hero_gallery_config_v3'),
        {}
      ),
      adhanStudio: loadAdhanStudio(),
      mosqueTravel: loadMosqueAndTravel(),
      device_snapshot: collectDeviceUserSnapshot(),
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
    const activeThemeId =
      localStorage.getItem('noor_theme_id') || localStorage.getItem('noor_theme') || 'emerald';

    const { error } = await supabase
      .from('profiles')
      .update({
        city_id: getGuestCityId(),
        adhan_id: localStorage.getItem('noor_guest_adhan_id') || 'ahlolbait_30',
        theme_id: activeThemeId,
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

    const freshDevice = isFreshInstallDevice();

    // ۱. بازیابی کامل کلیدهای کاربر روی دستگاه جدید یا بعد از نصب مجدد (ذکرشمار، قضا، زنگوله‌ها، فونت، والپیپر، تعقیبات...)
    if (data.app_settings && typeof data.app_settings === 'object') {
      const settings = data.app_settings as Record<string, unknown>;
      const snap = settings.device_snapshot as Record<string, unknown> | undefined;
      if (snap && typeof snap === 'object') {
        for (const [k, v] of Object.entries(snap)) {
          if (typeof v !== 'string' || isExcludedFromCloudSnapshot(k)) continue;
          const existing = localStorage.getItem(k);
          if (freshDevice || existing === null || existing === '' || existing === '[]' || existing === '{}') {
            localStorage.setItem(k, v);
          }
        }
      }

      // ادغام هوشمند علاقه‌مندی‌های ذکر (Favorites) حتی روی دستگاهی که قبلاً دیتا داشته
      if (Array.isArray(settings.favoriteDhikrIds)) {
        const mergedFavs = Array.from(
          new Set([
            ...getFavoriteDhikrIds(),
            ...settings.favoriteDhikrIds.filter((x): x is string => typeof x === 'string'),
          ])
        );
        localStorage.setItem('noor_favorite_dhikrs_v1', JSON.stringify(mergedFavs));
      }

      // ادغام تعداد دلخواه هر ذکر
      if (settings.customDhikrCounts && typeof settings.customDhikrCounts === 'object') {
        const localCounts = safeParseJson<Record<string, number>>(
          localStorage.getItem('noor_custom_dhikr_counts_v1'),
          {}
        );
        const mergedCounts = {
          ...(settings.customDhikrCounts as Record<string, number>),
          ...localCounts,
        };
        localStorage.setItem('noor_custom_dhikr_counts_v1', JSON.stringify(mergedCounts));
      }

      if (settings.mosqueTravel && typeof settings.mosqueTravel === 'object') {
        const curMt = loadMosqueAndTravel();
        saveMosqueAndTravel({ ...curMt, ...(settings.mosqueTravel as Partial<typeof curMt>) });
      }
    }

    if (typeof data.city_id === 'string' && data.city_id.trim()) {
      setGuestCityId(data.city_id);
      window.dispatchEvent(new Event('noor-city-changed'));
    }

    if (typeof data.adhan_id === 'string' && data.adhan_id.trim()) {
      localStorage.setItem('noor_guest_adhan_id', data.adhan_id);
    }

    if (typeof data.theme_id === 'string' && data.theme_id.trim()) {
      localStorage.setItem('noor_theme_id', data.theme_id);
    }

    if (typeof data.birth_month === 'number' && typeof data.birth_day === 'number') {
      const existingB = localStorage.getItem('noor_user_birthday_v1');
      if (!existingB) {
        localStorage.setItem(
          'noor_user_birthday_v1',
          JSON.stringify({
            month: data.birth_month,
            day: data.birth_day,
            year: typeof data.birth_year === 'number' ? data.birth_year : null,
            calendar: data.birth_year && data.birth_year > 1900 ? 'gregorian' : 'jalali',
          })
        );
      }
    }

    // ۲. ادغام نشانک‌ها و موقعیت قرآن
    if (data.quran_state && typeof data.quran_state === 'object' && 'surahIndex' in data.quran_state) {
      const localQ = loadQuranContinuity();
      const cloudQ = data.quran_state as ReturnType<typeof loadQuranContinuity>;
      const mergedBookmarks = [...(cloudQ.bookmarks || [])];
      for (const lb of localQ.bookmarks || []) {
        if (
          !mergedBookmarks.some(
            (cb) => cb.surahNameFa === lb.surahNameFa && cb.ayahNumber === lb.ayahNumber
          )
        ) {
          mergedBookmarks.push(lb);
        }
      }
      saveQuranContinuity({
        ...localQ,
        ...cloudQ,
        bookmarks: mergedBookmarks.slice(0, 40),
      });
    }

    // ۳. ادغام ذکرهای شخصی
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

    // ۴. بازیابی تعقیبات و آلارم سوره‌ها + کوک مجدد نیتیو در اندروید
    if (data.tawashih_config && typeof data.tawashih_config === 'object' && 'fajr' in data.tawashih_config) {
      if (freshDevice || !localStorage.getItem('noor_tawashih_redesign_config_v2')) {
        localStorage.setItem('noor_tawashih_redesign_config_v2', JSON.stringify(data.tawashih_config));
      }
      void syncAllTawashihNativeAlarms(loadTawashihConfig());
    }

    if (data.surah_alarms && typeof data.surah_alarms === 'object' && Object.keys(data.surah_alarms).length > 0) {
      if (freshDevice || !localStorage.getItem('noor_surah_native_alarms_v1')) {
        localStorage.setItem('noor_surah_native_alarms_v1', JSON.stringify(data.surah_alarms));
      }
      void syncAllSurahNativeAlarms();
    }

    if (freshDevice) {
      const notifOn = localStorage.getItem('noor_guest_notif_enabled') !== 'false';
      void rescheduleAllReminders(notifOn);
    }

    // اطلاع‌رسانی زنده به تمام صفحات برای رفرش فوری UI
    window.dispatchEvent(new Event('noor-tasbih-session-changed'));
    window.dispatchEvent(new Event('noor-hero-config-changed'));
    window.dispatchEvent(new Event('noor-tawashih-config-synced'));

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


const AUTO_SYNC_EVENTS = [
  'noor-tasbih-session-changed',
  'noor-city-changed',
  'noor-calc-method-changed',
  'noor-adhan-config-changed',
  'noor-hero-config-changed',
  'noor-home-modules-changed',
  'noor-app-lang-changed',
  'noor-dhikr-library-changed',
  'noor-tawashih-config-synced',
  'noor-surah-alarm-changed',
];

export function installAutoCloudSync(userId: string | null | undefined): () => void {
  if (!userId || !isSupabaseConfigured || userId.startsWith('local_') || typeof window === 'undefined') {
    return () => {};
  }

  let debounceTimer: number | null = null;
  let lastPullTs = Date.now();
  let isSyncing = false;

  const flushUpload = async () => {
    if (isSyncing) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    isSyncing = true;
    try {
      await syncLocalStateToCloud(userId);
    } finally {
      isSyncing = false;
    }
  };

  const scheduleUpload = () => {
    if (debounceTimer !== null) window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      debounceTimer = null;
      void flushUpload();
    }, 8000);
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      if (debounceTimer !== null) {
        window.clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      void flushUpload();
    } else if (document.visibilityState === 'visible') {
      if (Date.now() - lastPullTs > 120_000) {
        lastPullTs = Date.now();
        void runFullUserCloudSync(userId);
      }
    }
  };

  const onOnline = () => {
    lastPullTs = Date.now();
    void runFullUserCloudSync(userId);
  };

  const onPageHide = () => {
    void flushUpload();
  };

  for (const ev of AUTO_SYNC_EVENTS) {
    window.addEventListener(ev, scheduleUpload);
  }
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('online', onOnline);
  window.addEventListener('pagehide', onPageHide);

  return () => {
    if (debounceTimer !== null) window.clearTimeout(debounceTimer);
    for (const ev of AUTO_SYNC_EVENTS) {
      window.removeEventListener(ev, scheduleUpload);
    }
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('online', onOnline);
    window.removeEventListener('pagehide', onPageHide);
  };
}
