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
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import {
  getCachedGlobalSyncSnapshot,
  getCurrentAppVersion,
  runGlobalSync,
  downloadOtaMediaToDevice,
  listOfflineOtaMediaIds,
  type GlobalSyncSnapshot,
  type OtaMediaItem,
  type OtaMediaCategory,
} from '@/lib/globalSyncService';
import {
  getLastCloudSyncStatus,
  runFullUserCloudSync,
  type CloudSyncStatus,
} from '@/lib/cloudSyncService';
import { rescheduleAllReminders } from '@/lib/reminderService';
import { isSupabaseConfigured } from '@/lib/supabase';
import { toFaDigits } from '@/lib/jalali';

interface Props {
  onClose: () => void;
  onOpenAuth?: () => void;
  onAppliedAdhan?: (adhanId: string) => void;
}

const CATEGORY_LABELS: Record<'all' | OtaMediaCategory, string> = {
  all: 'همه',
  adhan: 'اذان جدید',
  pre_adhan: 'پیش‌اذان',
  post_adhan: 'تعقیبات',
  dua: 'دعا و مناجات',
  surah: 'تلاوت سوره',
};

function formatSyncTimeFa(iso: string | null): string {
  if (!iso) return 'هنوز انجام نشده';
  try {
    const d = new Date(iso);
    const time = d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    return 'امروز ساعت ' + time;
  } catch {
    return 'انجام شده';
  }
}

export function GlobalSyncHubModal({ onClose, onOpenAuth, onAppliedAdhan }: Props) {
  const { theme } = useTheme();
  const { user, profile, updateProfile } = useAuth();
  const [snap, setSnap] = useState<GlobalSyncSnapshot>(() => getCachedGlobalSyncSnapshot());
  const [cloudStatus, setCloudStatus] = useState<CloudSyncStatus>(() => getLastCloudSyncStatus());
  const [syncing, setSyncing] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [selectedCat, setSelectedCat] = useState<'all' | OtaMediaCategory>('all');
  const [offlineIds, setOfflineIds] = useState<string[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [activeAdhanId, setActiveAdhanId] = useState<string>(() => {
    try {
      return localStorage.getItem('noor_guest_adhan_id') || 'moazenzadeh_ardabili';
    } catch {
      return 'moazenzadeh_ardabili';
    }
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentVer = getCurrentAppVersion();

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
    window.setTimeout(() => setStatusBanner(null), 4200);
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
        flashBanner('⚠️ ' + (globalRes.error || 'اتصال اینترنت را بررسی کنید و دوباره تلاش نمایید.'));
      } else {
        const parts: string[] = [];
        if (globalRes.newTracksCount > 0) {
          parts.push(toFaDigits(globalRes.newTracksCount) + ' نوای جدید دریافت شد');
        } else {
          parts.push('کاتالوگ نواها و نسخه بررسی شد');
        }
        if (globalRes.snapshot.updateAvailable && globalRes.snapshot.latestRelease) {
          parts.push('نسخه جدید ' + globalRes.snapshot.latestRelease.version_name + ' آماده نصب است');
        }
        if (cloudOk) {
          parts.push('پشتیبان ابری حساب شما همگام شد');
        }
        flashBanner('✅ ' + parts.join(' · '));
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
      flashBanner('⚠️ پخش آنلاین این فایل ممکن نشد؛ اتصال اینترنت را بررسی کنید.');
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
          flashBanner('⚠️ دریافت آفلاین کامل نشد؛ اینترنت را بررسی کنید.');
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
        flashBanner('✅ «' + item.title_fa + '» دانلود و به عنوان مؤذن اصلی گوشی فعال شد!');
      } else {
        flashBanner('✅ «' + item.title_fa + '» برای پخش آفلاین روی گوشی ذخیره شد.');
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredItems = snap.mediaItems.filter(
    (m) => selectedCat === 'all' || m.category === selectedCat
  );

  const node = (
    <div
      className="fixed inset-0 z-[999] overflow-y-auto flex items-stretch sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)' }}
      dir="rtl"
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
        {/* هدر مرکز همگام‌سازی */}
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
              <h2 className="text-base font-black text-app">مرکز همگام‌سازی و نواهای جدید</h2>
              <p className="text-[11px] text-muted mt-0.5">
                همگام‌سازی ابری حساب · دریافت اذان و تواشیح جدید بدون آپدیت اپ
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="بستن"
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

        {/* کارت دکمه جادویی سینک گلوبال تک‌لمسی */}
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
                <span>سینک گلوبال نور</span>
              </p>
              <p className="text-[10.5px] text-muted mt-0.5">
                آخرین بررسی: {formatSyncTimeFa(snap.syncedAtIso)} · کاتالوگ نسخه {toFaDigits(snap.catalogVersion || 1)}
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
              {isSupabaseConfigured ? 'متصل به سرور' : 'حالت آفلاین'}
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
            <span>
              {syncing
                ? 'در حال همگام‌سازی با سرور نور...'
                : 'بررسی نواهای جدید، نسخه اپ و همگام‌سازی حساب'}
            </span>
          </button>

          {/* وضعیت حساب کاربری چنددستگاهی */}
          <div
            className="pt-2.5 border-t flex items-center justify-between gap-2 text-[11px]"
            style={{ borderColor: theme.border }}
          >
            {user ? (
              <>
                <div className="min-w-0">
                  <p className="font-bold text-app truncate">
                    حساب فعال: {profile?.display_name || 'کاربر نور'}
                    {user.phone ? ' (' + toFaDigits(user.phone) + ')' : ''}
                  </p>
                  <p className="text-[10px] text-muted">
                    آخرین بکاپ ابری: {formatSyncTimeFa(cloudStatus.lastSyncedAtIso)}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 shrink-0">
                  <ShieldCheck size={13} /> همگام
                </span>
              </>
            ) : (
              <>
                <span className="text-muted">برای پشتیبان‌گیری ابری و سینک بین دستگاه‌ها وارد شوید:</span>
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
                    <LogIn size={12} /> ورود / ثبت‌نام
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* کارت نسخه و بروزرسانی برنامه */}
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
                  ? 'نسخه جدید ' + snap.latestRelease.version_name + ' آماده نصب است'
                  : 'نسخه فعلی شما به‌روز است (' + currentVer.versionName + ')'}
              </span>
            </p>
            {snap.updateAvailable && snap.latestRelease?.changelog_fa ? (
              <p className="text-[10.5px] text-muted mt-0.5 leading-relaxed">
                {snap.latestRelease.changelog_fa}
              </p>
            ) : (
              <p className="text-[10.5px] text-muted mt-0.5">
                هر زمان نسخه جدیدی منتشر شود، خودکار اینجا نمایش داده می‌شود.
              </p>
            )}
          </div>
          {snap.updateAvailable && snap.latestRelease && (
            <a
              href={snap.latestRelease.download_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl text-[11px] font-black shrink-0"
              style={{ background: theme.accent, color: theme.bg }}
            >
              دانلود APK
            </a>
          )}
        </div>

        {/* کتابخانه زنده نواها و اذان‌های جدید (OTA) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-0.5">
            <h3 className="text-xs font-black text-app flex items-center gap-1.5">
              <Volume2 size={15} color={theme.primary} />
              <span>کتابخانه آنلاین اذان و نواهای جدید ({toFaDigits(snap.mediaItems.length)})</span>
            </h3>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {(Object.keys(CATEGORY_LABELS) as Array<'all' | OtaMediaCategory>).map((cat) => (
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
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          {filteredItems.length === 0 ? (
            <div
              className="rounded-2xl p-5 border text-center space-y-1.5"
              style={{ background: theme.bg, borderColor: theme.border }}
            >
              <p className="text-xs font-bold text-app">فعلاً نوای آنلاین تازه‌ای در این دسته ثبت نشده</p>
              <p className="text-[10.5px] text-muted leading-relaxed">
                به‌محض انتشار اذان، تواشیح یا دعای جدید در سرور نور، با دکمه «سینک گلوبال» بدون نیاز به آپدیت برنامه اینجا اضافه می‌شود.
              </p>
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
                          {[item.reciter_fa, item.subtitle_fa, item.duration_fa].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <span
                        className="px-2 py-0.5 rounded-lg text-[9.5px] font-bold shrink-0"
                        style={{
                          background: 'color-mix(in srgb, ' + theme.accent + ' 16%, transparent)',
                          color: theme.accent,
                        }}
                      >
                        {CATEGORY_LABELS[item.category]}
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
                        <span>{isPlaying ? 'توقف' : 'شنیدن'}</span>
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
                            <Check size={13} /> مؤذن فعال شما
                          </>
                        ) : isDownloading ? (
                          'در حال دریافت...'
                        ) : item.category === 'adhan' ? (
                          <>
                            <Download size={12} /> {isOffline ? 'انتخاب مؤذن' : 'دانلود و انتخاب مؤذن'}
                          </>
                        ) : (
                          <>
                            <Download size={12} /> {isOffline ? 'ذخیره‌شده روی گوشی ✓' : 'ذخیره آفلاین'}
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

        {/* نقشه اکوسیستم چندپلتفرمه نور */}
        <div
          className="rounded-2xl p-3 border flex items-center justify-between gap-2 text-[10.5px] text-muted"
          style={{ background: theme.bg, borderColor: theme.border }}
        >
          <div className="flex items-center gap-2">
            <Smartphone size={14} color={theme.primary} />
            <Globe size={14} color={theme.accent} />
            <span>آماده همگام‌سازی بین اندروید، نسخه وب آیفون و افزونه کروم</span>
          </div>
          <span className="font-bold text-primary shrink-0">۲۰۲۶</span>
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
          بستن
        </button>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(node, document.body) : node;
}
