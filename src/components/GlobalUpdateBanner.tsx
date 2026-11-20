import { useEffect, useState } from 'react';
import { Download, Sparkles, X, Megaphone } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useI18n } from '@/i18n';
import {
  getCachedGlobalSyncSnapshot,
  GLOBAL_SYNC_UPDATED_EVENT,
  isReleaseDismissed,
  dismissReleaseBanner,
  isAnnouncementDismissed,
  dismissAnnouncementBanner,
  type GlobalSyncSnapshot,
} from '@/lib/globalSyncService';

export function GlobalUpdateBanner() {
  const { theme } = useTheme();
  const { dir, t } = useI18n();
  const [snap, setSnap] = useState<GlobalSyncSnapshot>(() => getCachedGlobalSyncSnapshot());
  const [dismissedTick, setDismissedTick] = useState(0);

  useEffect(() => {
    const onUpdated = () => setSnap(getCachedGlobalSyncSnapshot());
    window.addEventListener(GLOBAL_SYNC_UPDATED_EVENT, onUpdated);
    return () => window.removeEventListener(GLOBAL_SYNC_UPDATED_EVENT, onUpdated);
  }, []);

  void dismissedTick;

  const showUpdate =
    snap.updateAvailable &&
    snap.latestRelease &&
    (snap.forceUpdate || !isReleaseDismissed(snap.latestRelease.version_code));

  const showAnnouncement =
    !showUpdate &&
    snap.announcementActive &&
    Boolean(snap.announcementFa.trim()) &&
    !isAnnouncementDismissed(snap.announcementFa);

  if (!showUpdate && !showAnnouncement) return null;

  if (showUpdate && snap.latestRelease) {
    const rel = snap.latestRelease;
    return (
      <div className="max-w-lg mx-auto px-3.5 pt-3 relative z-40 animate-fade-in" dir={dir}>
        <div
          className="rounded-3xl p-3.5 border shadow-xl space-y-2.5"
          style={{
            background:
              'linear-gradient(135deg, color-mix(in srgb, ' +
              theme.primary +
              ' 20%, ' +
              theme.surface +
              '), ' +
              theme.surface +
              ')',
            borderColor: theme.accent,
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: theme.accent, color: theme.bg }}
              >
                <Sparkles size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-app">
                  {t('banner.updateTitle')} ({rel.version_name})
                </p>
                {rel.changelog_fa && (
                  <p className="text-[11px] text-muted mt-0.5 leading-relaxed">{rel.changelog_fa}</p>
                )}
              </div>
            </div>
            {!snap.forceUpdate && (
              <button
                type="button"
                aria-label={t('common.close')}
                onClick={() => {
                  dismissReleaseBanner(rel.version_code);
                  setDismissedTick((v) => v + 1);
                }}
                className="text-muted p-1 shrink-0"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <a
            href={rel.download_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md"
            style={{ background: theme.primary, color: theme.bg }}
          >
            <Download size={14} />
            <span>{t('banner.updateBtn')}</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-3.5 pt-3 relative z-40 animate-fade-in" dir={dir}>
      <div
        className="rounded-2xl px-3.5 py-2.5 border flex items-center justify-between gap-2.5 shadow-md"
        style={{
          background: 'color-mix(in srgb, ' + theme.accent + ' 14%, ' + theme.surface + ')',
          borderColor: 'color-mix(in srgb, ' + theme.accent + ' 45%, ' + theme.border + ')',
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Megaphone size={15} color={theme.accent} className="shrink-0" />
          <p className="text-[11.5px] font-bold text-app leading-relaxed">{snap.announcementFa}</p>
        </div>
        <button
          type="button"
          aria-label={t('common.close')}
          onClick={() => {
            dismissAnnouncementBanner(snap.announcementFa);
            setDismissedTick((v) => v + 1);
          }}
          className="text-muted p-1 shrink-0"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
