import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  RefreshCw,
  Cloud,
  Download,
  Check,
  Play,
  Square,
  Sparkles,
  Smartphone,
  Globe,
  ShieldCheck,
  X,
  Volume2,
  ArrowUpCircle,
  LogIn,
  Image as ImageIcon,
  Palette,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useI18n, type TranslationKey } from '@/i18n';
import {
  getCachedGlobalSyncSnapshot,
  getCurrentAppVersion,
  runGlobalSync,
  downloadOtaMediaToDevice,
  listOfflineOtaMediaIds,
  type GlobalSyncSnapshot,
  type OtaMediaItem,
  type OtaMediaCategory,
  type RemoteWallpaperItem,
  type RemoteThemeItem,
} from '@/lib/globalSyncService';
import {
  getLastCloudSyncStatus,
  runFullUserCloudSync,
  type CloudSyncStatus,
} from '@/lib/cloudSyncService';
import { saveHeroConfig, loadHeroConfig } from '@/components/HeroHorizon30Gallery';
import { rescheduleAllReminders } from '@/lib/reminderService';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getStoreChannel, resolveStoreUpdateLink } from '@/lib/storeChannel';

interface Props {
  onClose: () => void;
  onOpenAuth?: () => void;
  onAppliedAdhan?: (adhanId: string) => void;
}

const CATEGORY_KEYS: Record<'all' | OtaMediaCategory, TranslationKey> = {
  all: 'sync.catAll',
  adhan: 'sync.catAdhan',
  pre_adhan: 'sync.catPreAdhan',
  post_adhan: 'sync.catPostAdhan',
  dua: 'sync.catDua',
  surah: 'sync.catSurah',
};

export function GlobalSyncHubModal({ onClose, onOpenAuth, onAppliedAdhan }: Props) {
  const { theme, themeId, setThemeId } = useTheme();
  const { user, profile, updateProfile } = useAuth();
  const { lang, dir, isRtl, t, formatDigits } = useI18n();

  const [snap, setSnap] = useState<GlobalSyncSnapshot>(() => getCachedGlobalSyncSnapshot());
  const [cloudStatus, setCloudStatus] = useState<CloudSyncStatus>(() => getLastCloudSyncStatus());
  const [syncing, setSyncing] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [hubTab, setHubTab] = useState<'audio' | 'wallpapers' | 'themes'>('audio');
  const [selectedCat, setSelectedCat] = useState<'all' | OtaMediaCategory>('all');
  const [offlineIds, setOfflineIds] = useState<string[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [activeHeroId, setActiveHeroId] = useState<string>(() => loadHeroConfig().selectedId);
  const [activeAdhanId, setActiveAdhanId] = useState<string>(() => {
    try {
      return localStorage.getItem('noor_guest_adhan_id') || 'ahlolbait_30';
    } catch {
      return 'ahlolbait_30';
    }
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentVer = getCurrentAppVersion();
  const storeCh = getStoreChannel();
  const storeUpdateLabel =
    storeCh === 'bazaar'
      ? t('sync.updateBazaar')
      : storeCh === 'myket'
      ? t('sync.updateMyket')
      : t('sync.downloadApk');

  const formatSyncTime = (iso: string | null): string => {
    if (!iso) return t('sync.never');
    try {
      const d = new Date(iso);
      const locale = lang === 'fa' ? 'fa-IR' : lang === 'es' ? 'es-ES' : 'en-US';
      const time = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
      return t('sync.todayAt') + ' ' + time;
    } catch {
      return t('sync.done');
    }
  };

  const stopPreview = () => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch {}
      audioRef.current = null;
    }
    setPlayingId(null);
  };

  useEffect(() => {
    void listOfflineOtaMediaIds().then(setOfflineIds);
    return () => stopPreview();
  }, []);

  const flashBanner = (msg: string) => {
    setStatusBanner(msg);
    window.setTimeout(() => setStatusBanner(null), 4400);
  };

  const handleGlobalSyncNow = async () => {
    if (syncing) return;
    setSyncing(true);
    setStatusBanner(null);

    try {
      const globalRes = await runGlobalSync({ forceCatalogRefresh: true });
      setSnap(globalRes.snapshot);

      let cloudOk = false;
      if (user?.id && !user.id.startsWith('local_')) {
        const cRes = await runFullUserCloudSync(user.id);
        cloudOk = cRes.ok;
        setCloudStatus(getLastCloudSyncStatus());
      }

      if (!globalRes.ok) {
        flashBanner('⚠️ ' + (globalRes.error || t('auth.errGeneric')));
      } else {
        const totalNew =
          globalRes.newTracksCount + globalRes.newWallpapersCount + globalRes.newThemesCount;
        const msg =
          totalNew > 0
            ? '✅ +' + formatDigits(totalNew) + ' · ' + t('sync.done')
            : '✅ ' + t('sync.syncedBadge') + (cloudOk ? ' (Cloud ✓)' : '');
        flashBanner(msg);
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleTogglePlay = (item: OtaMediaItem) => {
    if (playingId === item.id) {
      stopPreview();
      return;
    }
    stopPreview();
    const audio = new Audio(item.audio_url);
    audioRef.current = audio;
    setPlayingId(item.id);
    audio.onended = () => setPlayingId(null);
    audio.onerror = () => {
      setPlayingId(null);
      flashBanner('⚠️ ' + t('auth.errGeneric'));
    };
    audio.play().catch(() => {
      setPlayingId(null);
    });
  };

  const handleDownloadAndUse = async (item: OtaMediaItem, setAsAdhan: boolean) => {
    setDownloadingId(item.id);
    try {
      if (Capacitor.isNativePlatform()) {
        const ok = await downloadOtaMediaToDevice(item);
        const ids = await listOfflineOtaMediaIds();
        setOfflineIds(ids);
        if (!ok) {
          flashBanner('⚠️ ' + t('auth.errGeneric'));
          return;
        }
      }

      if (setAsAdhan) {
        try {
          localStorage.setItem('noor_guest_adhan_id', item.id);
        } catch {}
        setActiveAdhanId(item.id);
        if (profile) {
          await updateProfile({ adhan_id: item.id });
        }
        await rescheduleAllReminders(profile?.notif_enabled ?? true);
        onAppliedAdhan?.(item.id);
        flashBanner('✅ ' + item.title_fa + ' — ' + t('sync.activeMuezzin'));
      } else {
        flashBanner('✅ ' + item.title_fa + ' — ' + t('sync.savedOffline'));
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const handleApplyRemoteWallpaper = (wp: RemoteWallpaperItem) => {
    const heroId = 'ota_wp_' + wp.id;
    saveHeroConfig({ mode: 'manual', selectedId: heroId });
    setActiveHeroId(heroId);
    flashBanner('✅ ' + wp.title_fa + ' — ' + t('sync.applied'));
  };

  const handleApplyRemoteTheme = async (rt: RemoteThemeItem) => {
    setThemeId(rt.id);
    if (rt.wallpaper_url) {
      const heroId = 'ota_theme_wp_' + rt.id;
      saveHeroConfig({ mode: 'manual', selectedId: heroId });
      setActiveHeroId(heroId);
    }
    if (profile) {
      await updateProfile({ theme_id: rt.id });
    }
    flashBanner('✨ ' + (lang === 'fa' ? rt.name_fa : rt.name_en || rt.name_fa) + ' — ' + t('sync.applied'));
  };

  const filteredItems = snap.mediaItems.filter(
    (m) => selectedCat === 'all' || m.category === selectedCat
  );

  const node = (
    <div
      className="fixed inset-0 z-[999] overflow-y-auto flex items-stretch sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)' }}
      dir={dir}
      onClick={() => {
        stopPreview();
        onClose();
      }}
    >
      <div
        className="w-full sm:max-w-lg min-h-[100dvh] sm:min-h-0 sm:rounded-3xl p-5 border-0 sm:border shadow-2xl overflow-y-auto space-y-4"
        style={{ background: theme.surface, borderColor: theme.border }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-start justify-between gap-3 pb-3.5 border-b"
          style={{ borderColor: theme.border }}
        >
          <div className="flex items-start gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-md"
              style={{
                background: 'linear-gradient(135deg, ' + theme.primary + ', ' + theme.accent + ')',
                color: theme.bg,
              }}
            >
              <Cloud size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-app">{t('sync.title')}</h2>
              <p className="text-[11px] text-muted mt-0.5">{t('sync.subtitle')}</p>
            </div>
          </div>
          <button
            type="button"
            aria-label={t('common.close')}
            onClick={() => {
              stopPreview();
              onClose();
            }}
            className="w-8 h-8 rounded-xl border flex items-center justify-center text-muted shrink-0"
            style={{ borderColor: theme.border }}
          >
            <X size={17} />
          </button>
        </div>

        {statusBanner && (
          <div
            className="rounded-2xl px-3.5 py-2.5 text-xs font-bold text-center shadow-lg animate-fade-in"
            style={{ background: theme.primary, color: theme.bg }}
          >
            {statusBanner}
          </div>
        )}

        <div
          className="rounded-3xl p-4 border space-y-3"
          style={{
            background:
              'radial-gradient(circle at top left, color-mix(in srgb, ' +
              theme.primary +
              ' 20%, ' +
              theme.bg +
              '), ' +
              theme.bg +
              ')',
            borderColor: 'color-mix(in srgb, ' + theme.primary + ' 45%, ' + theme.border + ')',
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-black text-app flex items-center gap-1.5">
                <Sparkles size={14} color={theme.accent} />
                <span>{t('sync.cardTitle')}</span>
              </p>
              <p className="text-[10.5px] text-muted mt-0.5">
                {t('sync.lastCheck')} {formatSyncTime(snap.syncedAtIso)} · {t('sync.catalogVer')} {formatDigits(snap.catalogVersion || 1)}
              </p>
            </div>
            <span
              className="px-2.5 py-1 rounded-full text-[10px] font-black border shrink-0"
              style={{
                borderColor: isSupabaseConfigured ? 'rgba(52, 211, 153, 0.45)' : theme.border,
                background: isSupabaseConfigured ? 'rgba(16, 185, 129, 0.14)' : 'transparent',
                color: isSupabaseConfigured ? '#34d399' : theme.textMuted,
              }}
            >
              {isSupabaseConfigured ? t('sync.online') : t('sync.offline')}
            </span>
          </div>

          <button
            type="button"
            disabled={syncing}
            onClick={() => void handleGlobalSyncNow()}
            className="w-full py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.99] disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, ' + theme.primary + ', ' + theme.accent + ')',
              color: theme.bg,
            }}
          >
            <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? t('sync.syncingBtn') : t('sync.syncNowBtn')}</span>
          </button>

          <div
            className="pt-2.5 border-t flex items-center justify-between gap-2 text-[11px]"
            style={{ borderColor: theme.border }}
          >
            {user ? (
              <>
                <div className="min-w-0">
                  <p className="font-bold text-app truncate">
                    {t('sync.activeAccount')} {profile?.display_name || t('common.noorUser')}
                    {user.phone ? ' (' + formatDigits(user.phone) + ')' : ''}
                  </p>
                  <p className="text-[10px] text-muted">
                    {t('sync.lastCloudBackup')} {formatSyncTime(cloudStatus.lastSyncedAtIso)}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 shrink-0">
                  <ShieldCheck size={13} /> {t('sync.syncedBadge')}
                </span>
              </>
            ) : (
              <>
                <span className="text-muted">{t('sync.guestPrompt')}</span>
                {onOpenAuth && (
                  <button
                    type="button"
                    onClick={() => {
                      stopPreview();
                      onClose();
                      onOpenAuth();
                    }}
                    className="px-3 py-1.5 rounded-xl text-[10.5px] font-black flex items-center gap-1 shrink-0"
                    style={{ background: theme.primary, color: theme.bg }}
                  >
                    <LogIn size={12} /> {t('sync.signInBtn')}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div
          className="rounded-2xl p-3.5 border flex items-center justify-between gap-3"
          style={{
            background: theme.bg,
            borderColor: snap.updateAvailable ? theme.accent : theme.border,
          }}
        >
          <div className="min-w-0">
            <p className="text-xs font-black text-app flex items-center gap-1.5">
              <ArrowUpCircle size={15} color={snap.updateAvailable ? theme.accent : theme.primary} />
              <span>
                {snap.updateAvailable && snap.latestRelease
                  ? t('sync.updateReadyPrefix') + ' ' + snap.latestRelease.version_name + ' ' + t('sync.updateReadySuffix')
                  : t('sync.upToDate') + ' (' + currentVer.versionName + ')'}
              </span>
            </p>
            <p className="text-[10.5px] text-muted mt-0.5 leading-relaxed">
              {snap.updateAvailable && snap.latestRelease?.changelog_fa
                ? snap.latestRelease.changelog_fa
                : t('sync.upToDateDesc')}
            </p>
          </div>
          {snap.updateAvailable && snap.latestRelease && (
            <a
              href={resolveStoreUpdateLink(snap.latestRelease.download_url, storeCh)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl text-[11px] font-black shrink-0"
              style={{ background: theme.accent, color: theme.bg }}
            >
              {storeUpdateLabel}
            </a>
          )}
        </div>

        <div
          className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl border"
          style={{ background: theme.bg, borderColor: theme.border }}
        >
          {[
            { id: 'audio' as const, label: t('sync.tabAudio'), count: snap.mediaItems.length, Icon: Volume2 },
            { id: 'wallpapers' as const, label: t('sync.tabWallpapers'), count: snap.wallpapers.length, Icon: ImageIcon },
            { id: 'themes' as const, label: t('sync.tabThemes'), count: snap.themes.length, Icon: Palette },
          ].map((tabItem) => {
            const active = hubTab === tabItem.id;
            const IconComp = tabItem.Icon;
            return (
              <button
                key={tabItem.id}
                type="button"
                onClick={() => {
                  stopPreview();
                  setHubTab(tabItem.id);
                }}
                className="py-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 transition-all"
                style={{
                  background: active ? theme.primary : 'transparent',
                  color: active ? theme.bg : theme.textMuted,
                }}
              >
                <IconComp size={13} />
                <span>
                  {tabItem.label} ({formatDigits(tabItem.count)})
                </span>
              </button>
            );
          })}
        </div>

        {hubTab === 'audio' ? (
          <div className="space-y-2.5">
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {(Object.keys(CATEGORY_KEYS) as Array<'all' | OtaMediaCategory>).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCat(cat)}
                  className="px-2.5 py-1 rounded-xl text-[10.5px] font-bold border shrink-0 transition-all"
                  style={{
                    borderColor: selectedCat === cat ? theme.primary : theme.border,
                    background: selectedCat === cat ? theme.primary : theme.bg,
                    color: selectedCat === cat ? theme.bg : theme.textMuted,
                  }}
                >
                  {t(CATEGORY_KEYS[cat])}
                </button>
              ))}
            </div>

            {filteredItems.length === 0 ? (
              <div
                className="rounded-2xl p-5 border text-center space-y-1.5"
                style={{ background: theme.bg, borderColor: theme.border }}
              >
                <p className="text-xs font-bold text-app">{t('sync.emptyAudioTitle')}</p>
                <p className="text-[10.5px] text-muted leading-relaxed">{t('sync.emptyAudioDesc')}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
                {filteredItems.map((item) => {
                  const isOffline = offlineIds.includes(item.id);
                  const isPlaying = playingId === item.id;
                  const isDownloading = downloadingId === item.id;
                  const isSelectedAdhan = item.category === 'adhan' && activeAdhanId === item.id;

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl p-3 border space-y-2"
                      style={{
                        background: theme.bg,
                        borderColor: isSelectedAdhan ? theme.primary : theme.border,
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-black text-app truncate">{item.title_fa}</p>
                          <p className="text-[10.5px] text-muted truncate mt-0.5">
                            {[item.reciter_fa, item.subtitle_fa, item.duration_fa]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        </div>
                        <span
                          className="px-2 py-0.5 rounded-lg text-[9.5px] font-bold shrink-0"
                          style={{
                            background: 'color-mix(in srgb, ' + theme.accent + ' 16%, transparent)',
                            color: theme.accent,
                          }}
                        >
                          {t(CATEGORY_KEYS[item.category])}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleTogglePlay(item)}
                          className="px-3 py-1.5 rounded-xl text-[11px] font-bold border flex items-center gap-1"
                          style={{
                            borderColor: isPlaying ? '#f87171' : theme.accent,
                            color: isPlaying ? '#fca5a5' : theme.accent,
                          }}
                        >
                          {isPlaying ? <Square size={11} /> : <Play size={11} />}
                          <span>{isPlaying ? t('sync.stop') : t('sync.listen')}</span>
                        </button>

                        <button
                          type="button"
                          disabled={isDownloading}
                          onClick={() => void handleDownloadAndUse(item, item.category === 'adhan')}
                          className="flex-1 py-1.5 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 disabled:opacity-60"
                          style={{
                            background: isSelectedAdhan
                              ? 'color-mix(in srgb, ' + theme.primary + ' 18%, transparent)'
                              : theme.primary,
                            color: isSelectedAdhan ? theme.primary : theme.bg,
                          }}
                        >
                          {isSelectedAdhan ? (
                            <>
                              <Check size={13} /> {t('sync.activeMuezzin')}
                            </>
                          ) : isDownloading ? (
                            t('sync.downloading')
                          ) : item.category === 'adhan' ? (
                            <>
                              <Download size={12} /> {isOffline ? t('sync.selectMuezzin') : t('sync.downloadMuezzin')}
                            </>
                          ) : (
                            <>
                              <Download size={12} /> {isOffline ? t('sync.savedOffline') : t('sync.saveOffline')}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : hubTab === 'wallpapers' ? (
          snap.wallpapers.length === 0 ? (
            <div
              className="rounded-2xl p-5 border text-center space-y-1.5"
              style={{ background: theme.bg, borderColor: theme.border }}
            >
              <p className="text-xs font-bold text-app">{t('sync.emptyWpTitle')}</p>
              <p className="text-[10.5px] text-muted leading-relaxed">{t('sync.emptyWpDesc')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-0.5">
              {snap.wallpapers.map((wp) => {
                const isSelected = activeHeroId === 'ota_wp_' + wp.id;
                return (
                  <button
                    key={wp.id}
                    type="button"
                    onClick={() => handleApplyRemoteWallpaper(wp)}
                    className={'rounded-2xl overflow-hidden border transition-transform active:scale-[0.98] ' + (isRtl ? 'text-right' : 'text-left')}
                    style={{
                      background: theme.bg,
                      borderColor: isSelected ? theme.primary : theme.border,
                    }}
                  >
                    <div className="h-24 w-full relative overflow-hidden bg-black/30">
                      <img
                        src={wp.image_url}
                        alt={wp.title_fa}
                        className="w-full h-full object-cover"
                      />
                      {isSelected && (
                        <span
                          className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ background: theme.primary, color: theme.bg }}
                        >
                          <Check size={13} />
                        </span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-black text-app truncate">{wp.title_fa}</p>
                      <p className="text-[10px] text-muted truncate mt-0.5">
                        {wp.occasion_tag || wp.subtitle_fa}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )
        ) : snap.themes.length === 0 ? (
          <div
            className="rounded-2xl p-5 border text-center space-y-1.5"
            style={{ background: theme.bg, borderColor: theme.border }}
          >
            <p className="text-xs font-bold text-app">{t('sync.emptyThemeTitle')}</p>
            <p className="text-[10.5px] text-muted leading-relaxed">{t('sync.emptyThemeDesc')}</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
            {snap.themes.map((rt) => {
              const active = themeId === rt.id;
              return (
                <button
                  key={rt.id}
                  type="button"
                  onClick={() => void handleApplyRemoteTheme(rt)}
                  className={'w-full rounded-2xl p-3 border flex items-center justify-between gap-3 transition-transform active:scale-[0.99] ' + (isRtl ? 'text-right' : 'text-left')}
                  style={{
                    background: rt.surface_color || theme.bg,
                    borderColor: active ? rt.primary_color : theme.border,
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-11 h-11 rounded-xl shrink-0 border flex items-center justify-center"
                      style={{
                        background:
                          'linear-gradient(135deg, ' + rt.primary_color + ', ' + rt.accent_color + ')',
                        borderColor: 'rgba(255,255,255,0.2)',
                      }}
                    >
                      {active ? <Check size={17} color={rt.bg_color} /> : <Palette size={17} color={rt.bg_color} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black truncate" style={{ color: rt.text_color || '#fff' }}>
                        {lang === 'fa' ? rt.name_fa : rt.name_en || rt.name_fa}
                      </p>
                      <p className="text-[10px] truncate mt-0.5" style={{ color: rt.text_muted_color || '#cbd5e1' }}>
                        {rt.occasion_fa || t('sync.tabThemes')}
                      </p>
                    </div>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-xl text-[10.5px] font-black shrink-0"
                    style={{ background: rt.primary_color, color: rt.bg_color }}
                  >
                    {active ? t('sync.applied') : t('sync.apply')}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div
          className="rounded-2xl p-3 border flex items-center justify-between gap-2 text-[10.5px] text-muted"
          style={{ background: theme.bg, borderColor: theme.border }}
        >
          <div className="flex items-center gap-2">
            <Smartphone size={14} color={theme.primary} />
            <Globe size={14} color={theme.accent} />
            <span>{t('sync.ecosystemNote')}</span>
          </div>
          <span className="font-bold text-primary shrink-0">{formatDigits(2026)}</span>
        </div>

        <button
          type="button"
          onClick={() => {
            stopPreview();
            onClose();
          }}
          className="w-full py-2.5 rounded-2xl text-xs font-bold border"
          style={{ borderColor: theme.border, color: theme.text }}
        >
          {t('common.close')}
        </button>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(node, document.body) : node;
}
