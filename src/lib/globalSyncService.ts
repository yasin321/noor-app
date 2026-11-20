import { Capacitor, registerPlugin } from '@capacitor/core';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface NativeMediaDownloader {
  downloadAdhanAudio(opts: {
    adhanId: string;
    audioUrl: string;
    fallbackUrl?: string;
  }): Promise<{ downloaded: boolean; path?: string }>;
  listDownloadedAdhans(): Promise<{ ids: string[] }>;
}

const NoorAlarmMedia = registerPlugin<NativeMediaDownloader>('NoorAlarm');

export type OtaMediaCategory = 'adhan' | 'pre_adhan' | 'post_adhan' | 'dua' | 'surah';

export interface OtaMediaItem {
  id: string;
  category: OtaMediaCategory;
  title_fa: string;
  subtitle_fa: string;
  reciter_fa: string;
  audio_url: string;
  duration_fa: string;
  file_size_kb: number;
  is_featured: boolean;
  sort_order: number;
  catalog_version: number;
}

export interface RemoteWallpaperItem {
  id: string;
  title_fa: string;
  subtitle_fa: string;
  category: 'shrine' | 'mosque' | 'occasion' | 'nature';
  occasion_tag: string;
  image_url: string;
  file_size_kb: number;
  is_featured: boolean;
  sort_order: number;
}

export interface RemoteThemeItem {
  id: string;
  name_en: string;
  name_fa: string;
  occasion_fa: string;
  bg_color: string;
  surface_color: string;
  surface_alt_color: string;
  card_color: string;
  primary_color: string;
  accent_color: string;
  text_color: string;
  text_muted_color: string;
  border_color: string;
  wallpaper_url: string;
  is_featured: boolean;
  sort_order: number;
}

export interface RemoteAppRelease {
  platform: 'android' | 'web_ios' | 'chrome_ext';
  version_code: number;
  version_name: string;
  download_url: string;
  changelog_fa: string;
  force_update: boolean;
  published_at: string;
}

export interface GlobalSyncMeta {
  catalog_version: number;
  min_android_version_code: number;
  announcement_fa: string;
  announcement_active: boolean;
  updated_at: string;
}

export interface GlobalSyncSnapshot {
  syncedAtIso: string | null;
  catalogVersion: number;
  mediaItems: OtaMediaItem[];
  wallpapers: RemoteWallpaperItem[];
  themes: RemoteThemeItem[];
  latestRelease: RemoteAppRelease | null;
  updateAvailable: boolean;
  forceUpdate: boolean;
  announcementFa: string;
  announcementActive: boolean;
}

const OTA_CATALOG_KEY = 'noor_ota_media_catalog_v1';
const OTA_WALLPAPERS_KEY = 'noor_ota_wallpapers_v1';
const OTA_THEMES_KEY = 'noor_ota_themes_v1';
const GLOBAL_SYNC_STATE_KEY = 'noor_global_sync_snapshot_v1';
const DISMISSED_UPDATE_KEY = 'noor_dismissed_release_code_v1';
const DISMISSED_ANNOUNCEMENT_KEY = 'noor_dismissed_announcement_v1';

export const GLOBAL_SYNC_UPDATED_EVENT = 'noor-global-sync-updated';

export function getCurrentAppVersion(): { versionCode: number; versionName: string } {
  const rawCode = Number(import.meta.env.VITE_APP_VERSION_CODE ?? 0);
  const versionCode = Number.isFinite(rawCode) && rawCode > 0 ? Math.floor(rawCode) : 1;
  const versionName = String(import.meta.env.VITE_APP_VERSION_NAME || 'v3.0.0');
  return { versionCode, versionName };
}

export function getCachedOtaMediaCatalog(): OtaMediaItem[] {
  try {
    const raw = localStorage.getItem(OTA_CATALOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OtaMediaItem[]) : [];
  } catch {
    return [];
  }
}

export function getCachedRemoteWallpapers(): RemoteWallpaperItem[] {
  try {
    const raw = localStorage.getItem(OTA_WALLPAPERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RemoteWallpaperItem[]) : [];
  } catch {
    return [];
  }
}

export function getCachedRemoteThemes(): RemoteThemeItem[] {
  try {
    const raw = localStorage.getItem(OTA_THEMES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RemoteThemeItem[]) : [];
  } catch {
    return [];
  }
}

export function getCachedGlobalSyncSnapshot(): GlobalSyncSnapshot {
  try {
    const raw = localStorage.getItem(GLOBAL_SYNC_STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<GlobalSyncSnapshot>;
      return {
        syncedAtIso: parsed.syncedAtIso ?? null,
        catalogVersion: typeof parsed.catalogVersion === 'number' ? parsed.catalogVersion : 0,
        mediaItems: Array.isArray(parsed.mediaItems) ? parsed.mediaItems : getCachedOtaMediaCatalog(),
        wallpapers: Array.isArray(parsed.wallpapers) ? parsed.wallpapers : getCachedRemoteWallpapers(),
        themes: Array.isArray(parsed.themes) ? parsed.themes : getCachedRemoteThemes(),
        latestRelease: parsed.latestRelease ?? null,
        updateAvailable: Boolean(parsed.updateAvailable),
        forceUpdate: Boolean(parsed.forceUpdate),
        announcementFa: parsed.announcementFa || '',
        announcementActive: Boolean(parsed.announcementActive),
      };
    }
  } catch {}
  return {
    syncedAtIso: null,
    catalogVersion: 0,
    mediaItems: getCachedOtaMediaCatalog(),
    wallpapers: getCachedRemoteWallpapers(),
    themes: getCachedRemoteThemes(),
    latestRelease: null,
    updateAvailable: false,
    forceUpdate: false,
    announcementFa: '',
    announcementActive: false,
  };
}

function saveGlobalSyncSnapshot(snap: GlobalSyncSnapshot): void {
  try {
    localStorage.setItem(OTA_CATALOG_KEY, JSON.stringify(snap.mediaItems));
    localStorage.setItem(OTA_WALLPAPERS_KEY, JSON.stringify(snap.wallpapers));
    localStorage.setItem(OTA_THEMES_KEY, JSON.stringify(snap.themes));
    localStorage.setItem(GLOBAL_SYNC_STATE_KEY, JSON.stringify(snap));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(GLOBAL_SYNC_UPDATED_EVENT, { detail: snap }));
      window.dispatchEvent(new Event('noor-hero-config-changed'));
    }
  } catch {}
}

export function isReleaseDismissed(versionCode: number): boolean {
  try {
    return Number(localStorage.getItem(DISMISSED_UPDATE_KEY) || 0) === versionCode;
  } catch {
    return false;
  }
}

export function dismissReleaseBanner(versionCode: number): void {
  try {
    localStorage.setItem(DISMISSED_UPDATE_KEY, String(versionCode));
  } catch {}
}

export function isAnnouncementDismissed(text: string): boolean {
  try {
    return (localStorage.getItem(DISMISSED_ANNOUNCEMENT_KEY) || '') === text;
  } catch {
    return false;
  }
}

export function dismissAnnouncementBanner(text: string): void {
  try {
    localStorage.setItem(DISMISSED_ANNOUNCEMENT_KEY, text);
  } catch {}
}

export async function downloadOtaMediaToDevice(item: OtaMediaItem): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const res = await NoorAlarmMedia.downloadAdhanAudio({
      adhanId: item.id,
      audioUrl: item.audio_url,
    });
    return Boolean(res?.downloaded);
  } catch {
    return false;
  }
}

export async function listOfflineOtaMediaIds(): Promise<string[]> {
  if (!Capacitor.isNativePlatform()) return [];
  try {
    const res = await NoorAlarmMedia.listDownloadedAdhans();
    return Array.isArray(res?.ids) ? res.ids : [];
  } catch {
    return [];
  }
}

export async function runGlobalSync(opts?: {
  forceCatalogRefresh?: boolean;
}): Promise<{
  ok: boolean;
  snapshot: GlobalSyncSnapshot;
  newTracksCount: number;
  newWallpapersCount: number;
  newThemesCount: number;
  error?: string;
}> {
  const prev = getCachedGlobalSyncSnapshot();
  if (!isSupabaseConfigured) {
    return {
      ok: false,
      snapshot: prev,
      newTracksCount: 0,
      newWallpapersCount: 0,
      newThemesCount: 0,
      error: 'اتصال ابری تنظیم نشده است',
    };
  }

  try {
    const platform: 'android' | 'web_ios' =
      Capacitor.getPlatform() === 'android' ? 'android' : 'web_ios';
    const currentVer = getCurrentAppVersion();

    const [metaRes, relRes] = await Promise.all([
      supabase.from('global_sync_meta').select('*').eq('id', 1).maybeSingle(),
      supabase
        .from('app_releases')
        .select('*')
        .eq('platform', platform)
        .eq('is_active', true)
        .order('version_code', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const meta = (metaRes.data as GlobalSyncMeta | null) ?? null;
    const latestRelease = (relRes.data as RemoteAppRelease | null) ?? null;

    const remoteCatalogVer = meta?.catalog_version ?? 1;
    let mediaItems = prev.mediaItems;
    let wallpapers = prev.wallpapers;
    let themes = prev.themes;
    let newTracksCount = 0;
    let newWallpapersCount = 0;
    let newThemesCount = 0;

    const shouldFetchCatalog =
      opts?.forceCatalogRefresh ||
      remoteCatalogVer > prev.catalogVersion ||
      (prev.mediaItems.length === 0 && prev.wallpapers.length === 0 && prev.themes.length === 0);

    if (shouldFetchCatalog) {
      const [catRes, wpRes, thRes] = await Promise.all([
        supabase
          .from('media_catalog')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('remote_wallpapers')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('remote_themes')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
      ]);

      if (Array.isArray(catRes.data)) {
        const prevIds = new Set(prev.mediaItems.map((x) => x.id));
        const nextItems = catRes.data as OtaMediaItem[];
        newTracksCount = nextItems.filter((x) => !prevIds.has(x.id)).length;
        mediaItems = nextItems;
      }

      if (Array.isArray(wpRes.data)) {
        const prevWpIds = new Set(prev.wallpapers.map((x) => x.id));
        const nextWps = wpRes.data as RemoteWallpaperItem[];
        newWallpapersCount = nextWps.filter((x) => !prevWpIds.has(x.id)).length;
        wallpapers = nextWps;
      }

      if (Array.isArray(thRes.data)) {
        const prevThIds = new Set(prev.themes.map((x) => x.id));
        const nextThs = thRes.data as RemoteThemeItem[];
        newThemesCount = nextThs.filter((x) => !prevThIds.has(x.id)).length;
        themes = nextThs;
      }
    }

    const hasNewRelease = Boolean(
      latestRelease && latestRelease.version_code > currentVer.versionCode
    );
    const mustForceUpdate = Boolean(
      hasNewRelease &&
        (latestRelease?.force_update ||
          (platform === 'android' &&
            meta &&
            meta.min_android_version_code > currentVer.versionCode))
    );

    const nextSnap: GlobalSyncSnapshot = {
      syncedAtIso: new Date().toISOString(),
      catalogVersion: remoteCatalogVer,
      mediaItems,
      wallpapers,
      themes,
      latestRelease,
      updateAvailable: hasNewRelease,
      forceUpdate: mustForceUpdate,
      announcementFa: meta?.announcement_fa || '',
      announcementActive: Boolean(meta?.announcement_active && meta?.announcement_fa),
    };

    saveGlobalSyncSnapshot(nextSnap);
    return { ok: true, snapshot: nextSnap, newTracksCount, newWallpapersCount, newThemesCount };
  } catch {
    return {
      ok: false,
      snapshot: prev,
      newTracksCount: 0,
      newWallpapersCount: 0,
      newThemesCount: 0,
      error: 'ارتباط با سرور نور برقرار نشد',
    };
  }
}
