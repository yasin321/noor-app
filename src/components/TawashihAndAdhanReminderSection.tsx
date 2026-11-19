import { createPortal } from 'react-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Volume2, Square, Clock, Check, Copy, Sparkles, X } from 'lucide-react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { adhans, playAdhanPreview, stopAdhanPreview } from '@/lib/adhans';
import {
  setAlarmPlaybackSpeed,
  purgeLegacyPrePostAdhanReminders,
} from '@/lib/reminderService';
import { calculatePrayerTimes } from '@/lib/prayerTimes';
import { CITIES } from '@/lib/cities';

interface NativeAlarmBridge {
  scheduleNativeAlarm(opts: {
    id: number;
    triggerAtMillis: number;
    title: string;
    body: string;
    soundType?: string;
    adhanId?: string;
    audioUrl?: string;
    durationSeconds?: number;
    volumePercent?: number;
    playbackRate?: number;
  }): Promise<void>;
  cancelNativeAlarm(opts: { id: number }): Promise<void>;
  requestNotificationPermission(): Promise<{ granted: boolean }>;
  openBatteryOptimizationSettings(): Promise<void>;
}

const NoorAlarm = registerPlugin<NativeAlarmBridge>('NoorAlarm');

export type PrayerTabKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface TrackOption {
  id: string;
  titleFa: string;
  subtitleFa: string;
  durationFa: string;
  audioFile: string;
  audioAdhanId: string;
}

export const PRE_ADHAN_TRACKS: TrackOption[] = [
  {
    id: 'rabbana_shajarian',
    titleFa: 'ربنای استاد شجریان',
    subtitleFa: 'مناجات سحر و افطار',
    durationFa: '۴:۴۲',
    audioFile: '/adhans/rabbana.mp3',
    audioAdhanId: 'rabbana',
  },
  {
    id: 'nadali_alifani',
    titleFa: 'دعای نادعلی (ع)',
    subtitleFa: 'با نوای علی فانی',
    durationFa: '۵:۱۵',
    audioFile: '/adhans/nadali_alifani.mp3',
    audioAdhanId: 'nadali_alifani',
  },
  {
    id: 'munajat_sahar',
    titleFa: 'مناجات سحرگاهی',
    subtitleFa: 'گروه بین‌المللی تواشیح',
    durationFa: '۳:۱۰',
    audioFile: '/adhans/chant_aqim.mp3',
    audioAdhanId: 'chant_aqim',
  },
  {
    id: 'salawat_reza',
    titleFa: 'صلوات خاصه امام رضا (ع)',
    subtitleFa: 'گروه همخوانی آستان قدس رضوی',
    durationFa: '۲:۱۵',
    audioFile: '/adhans/chant_salawat.mp3',
    audioAdhanId: 'chant_salawat',
  },
  {
    id: 'tasbihat_pre',
    titleFa: 'تسبیحات آرامش',
    subtitleFa: 'مناجات پیش از اذان',
    durationFa: '۱:۵۸',
    audioFile: '/adhans/chant_tasbihat.mp3',
    audioAdhanId: 'chant_tasbihat',
  },
];

export const POST_ADHAN_TRACKS: TrackOption[] = [
  {
    id: 'surah_waqiah',
    titleFa: 'سوره واقعه',
    subtitleFa: 'برکت و وسعت رزق',
    durationFa: '۹:۴۵',
    audioFile: '/adhans/post_waqiah.mp3',
    audioAdhanId: 'post_waqiah',
  },
  {
    id: 'surah_yasin',
    titleFa: 'سوره یس',
    subtitleFa: 'قلب قرآن کریم',
    durationFa: '۱۲:۳۰',
    audioFile: '/adhans/post_yasin.mp3',
    audioAdhanId: 'post_yasin',
  },
  {
    id: 'surah_rahman',
    titleFa: 'سوره الرحمن',
    subtitleFa: 'عروس قرآن',
    durationFa: '۸:۲۰',
    audioFile: '/adhans/post_rahman.mp3',
    audioAdhanId: 'post_rahman',
  },
  {
    id: 'surah_mulk',
    titleFa: 'سوره ملک',
    subtitleFa: 'آرامش شبانگاهی',
    durationFa: '۶:۱۵',
    audioFile: '/adhans/post_mulk.mp3',
    audioAdhanId: 'post_mulk',
  },
  {
    id: 'ayat_kursi',
    titleFa: 'آیةالکرسی و تسبیحات',
    subtitleFa: 'تعقیبات عامه نماز',
    durationFa: '۳:۱۲',
    audioFile: '/adhans/post_kursi.mp3',
    audioAdhanId: 'post_kursi',
  },
];

export interface SlotConfig {
  enabled: boolean;
  minutesOffset: number;
  mode: 'audio' | 'notification_only';
  trackId: string;
  speed: number;
}

export interface PrayerTawashihConfig {
  before: SlotConfig;
  after: SlotConfig;
}

export type AllPrayersTawashihMap = Record<PrayerTabKey, PrayerTawashihConfig>;

const STORAGE_KEY = 'noor_tawashih_redesign_config_v2';
const SYNC_EVENT_NAME = 'noor-tawashih-config-synced';

const DEFAULT_CONFIG: AllPrayersTawashihMap = {
  fajr: {
    before: { enabled: true, minutesOffset: 15, mode: 'audio', trackId: 'rabbana_shajarian', speed: 1.0 },
    after: { enabled: true, minutesOffset: 10, mode: 'audio', trackId: 'surah_waqiah', speed: 1.0 },
  },
  dhuhr: {
    before: { enabled: true, minutesOffset: 10, mode: 'audio', trackId: 'nadali_alifani', speed: 1.0 },
    after: { enabled: true, minutesOffset: 10, mode: 'audio', trackId: 'surah_yasin', speed: 1.0 },
  },
  asr: {
    before: { enabled: false, minutesOffset: 10, mode: 'audio', trackId: 'salawat_reza', speed: 1.0 },
    after: { enabled: false, minutesOffset: 10, mode: 'audio', trackId: 'ayat_kursi', speed: 1.0 },
  },
  maghrib: {
    before: { enabled: true, minutesOffset: 15, mode: 'audio', trackId: 'rabbana_shajarian', speed: 1.0 },
    after: { enabled: true, minutesOffset: 10, mode: 'audio', trackId: 'surah_rahman', speed: 1.0 },
  },
  isha: {
    before: { enabled: false, minutesOffset: 10, mode: 'audio', trackId: 'munajat_sahar', speed: 1.0 },
    after: { enabled: true, minutesOffset: 15, mode: 'audio', trackId: 'surah_mulk', speed: 1.0 },
  },
};

function normalizeTrackId(id: string, isAfter: boolean): string {
  const s = (id || '').toLowerCase();
  if (!s) return isAfter ? 'surah_waqiah' : 'rabbana_shajarian';
  if (isAfter) {
    if (s.includes('waqiah')) return 'surah_waqiah';
    if (s.includes('yasin')) return 'surah_yasin';
    if (s.includes('rahman')) return 'surah_rahman';
    if (s.includes('mulk')) return 'surah_mulk';
    if (s.includes('kursi') || s.includes('tasbih') || s.includes('bahjat') || s.includes('fatima')) return 'ayat_kursi';
    const found = POST_ADHAN_TRACKS.find((t) => t.id === id);
    return found ? found.id : POST_ADHAN_TRACKS[0].id;
  } else {
    if (s.includes('rab')) return 'rabbana_shajarian';
    if (s.includes('nad')) return 'nadali_alifani';
    if (s.includes('salawat')) return 'salawat_reza';
    if (s.includes('tasbih') || s.includes('istighfar')) return 'tasbihat_pre';
    if (s.includes('aqim') || s.includes('sahar') || s.includes('munajat')) return 'munajat_sahar';
    const found = PRE_ADHAN_TRACKS.find((t) => t.id === id);
    return found ? found.id : PRE_ADHAN_TRACKS[0].id;
  }
}

export function loadTawashihConfig(): AllPrayersTawashihMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const keys: PrayerTabKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
        const normalized = {} as AllPrayersTawashihMap;
        for (const k of keys) {
          const item = parsed[k] || DEFAULT_CONFIG[k];
          normalized[k] = {
            before: {
              ...DEFAULT_CONFIG[k].before,
              ...(item.before || {}),
              trackId: normalizeTrackId(item.before?.trackId, false),
            },
            after: {
              ...DEFAULT_CONFIG[k].after,
              ...(item.after || {}),
              trackId: normalizeTrackId(item.after?.trackId, true),
            },
          };
        }
        return normalized;
      }
    }
  } catch {}
  return DEFAULT_CONFIG;
}

function saveTawashihConfig(cfg: AllPrayersTawashihMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(SYNC_EVENT_NAME, { detail: cfg }));
    }
  } catch {}
}

const PRAYER_META: { key: PrayerTabKey; labelFa: string; adhanTitleFa: string }[] = [
  { key: 'fajr', labelFa: 'صبح', adhanTitleFa: 'اذان صبح' },
  { key: 'dhuhr', labelFa: 'ظهر', adhanTitleFa: 'اذان ظهر' },
  { key: 'asr', labelFa: 'عصر', adhanTitleFa: 'اذان عصر' },
  { key: 'maghrib', labelFa: 'مغرب', adhanTitleFa: 'اذان مغرب' },
  { key: 'isha', labelFa: 'عشاء', adhanTitleFa: 'اذان عشاء' },
];

const QUICK_OFFSET_PILLS = [2, 5, 10, 15, 20, 30];
const SPEED_OPTIONS = [1.0, 1.25, 1.5, 2.0];

function toEnDigits(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
}

function toFaDigits(n: number | string): string {
  if (n === undefined || n === null) return '';
  const map: Record<string, string> = { '0': '۰', '1': '۱', '2': '۲', '3': '۳', '4': '۴', '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹' };
  return String(n).replace(/[0-9]/g, (d) => map[d] || d);
}

function addMinutesToTimeStr(timeStr: string, minutes: number): string {
  const clean = toEnDigits(timeStr).trim();
  if (!clean || !clean.includes(':')) return '12:00';
  const [hStr, mStr] = clean.split(':');
  let h = parseInt(hStr, 10);
  let m = parseInt(mStr, 10);
  if (isNaN(h)) h = 12;
  if (isNaN(m)) m = 0;
  m += minutes;
  while (m < 0) { m += 60; h = (h - 1 + 24) % 24; }
  while (m >= 60) { m -= 60; h = (h + 1) % 24; }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function resolveEffectivePrayerTimes(passedTimes?: Record<string, string>): Record<string, string> {
  if (passedTimes && passedTimes.fajr && passedTimes.dhuhr) {
    return passedTimes;
  }
  try {
    const savedCityId = localStorage.getItem('noor_guest_city') || 'mashhad';
    const foundCity = CITIES.find((c) => c.id === savedCityId || c.name === savedCityId) || CITIES[0];
    return calculatePrayerTimes(new Date(), foundCity.lat, foundCity.lng) as unknown as Record<string, string>;
  } catch {
    return { fajr: '04:52', dhuhr: '11:19', asr: '14:03', maghrib: '16:40', isha: '17:32' };
  }
}

// صف ترتیبی (Serialized Queue) با شماره نسخه تا تغییرات سریع پشت‌سرهم هیچ‌وقت تداخل نکنند و همیشه فقط آخرین انتخاب بماند
let latestSyncTicket = 0;
let syncQueueChain: Promise<void> = Promise.resolve();

export async function syncAllTawashihNativeAlarms(
  nextCfg: AllPrayersTawashihMap,
  passedTimes?: Record<string, string>,
  cityNameFa: string = 'مشهد'
): Promise<void> {
  const myTicket = ++latestSyncTicket;

  syncQueueChain = syncQueueChain
    .catch(() => {})
    .then(async () => {
      if (myTicket !== latestSyncTicket) return;

      // ۱. پاک‌سازی قطعی هرگونه یادآور قدیمی و تکراری pre_adhan_* و post_adhan_*
      await purgeLegacyPrePostAdhanReminders().catch(() => {});

      if (!Capacitor.isNativePlatform()) return;
      if (myTicket !== latestSyncTicket) return;

      try {
        await LocalNotifications.requestPermissions();
      } catch {}

      const effectiveTimes = resolveEffectivePrayerTimes(passedTimes);
      const baseIds: Record<PrayerTabKey, { before: number; after: number }> = {
        fajr: { before: 72101, after: 72201 },
        dhuhr: { before: 72102, after: 72202 },
        asr: { before: 72103, after: 72203 },
        maghrib: { before: 72104, after: 72204 },
        isha: { before: 72105, after: 72205 },
      };

      for (const pMeta of PRAYER_META) {
        if (myTicket !== latestSyncTicket) return;
        const pKey = pMeta.key;
        const baseTime = toEnDigits(effectiveTimes[pKey] || '04:52');
        const pCfg = nextCfg[pKey];
        if (!pCfg) continue;

        // الف) قبل از اذان: ابتدا قبلی را قطعی پاک کن، سپس در صورت فعال بودن جدیدترین را کوک کن
        const beforeId = baseIds[pKey].before;
        await NoorAlarm.cancelNativeAlarm({ id: beforeId }).catch(() => {});
        if (pCfg.before.enabled) {
          const targetClock = addMinutesToTimeStr(baseTime, -pCfg.before.minutesOffset);
          const [hh, mm] = targetClock.split(':').map((n) => parseInt(n, 10));
          if (!isNaN(hh) && !isNaN(mm)) {
            const targetDate = new Date();
            targetDate.setHours(hh, mm, 0, 0);
            if (targetDate.getTime() <= Date.now()) {
              targetDate.setDate(targetDate.getDate() + 1);
            }
            const track = PRE_ADHAN_TRACKS.find((t) => t.id === pCfg.before.trackId) || PRE_ADHAN_TRACKS[0];

            await NoorAlarm.scheduleNativeAlarm({
              id: beforeId,
              triggerAtMillis: targetDate.getTime(),
              title: `🌙 ${toFaDigits(pCfg.before.minutesOffset)} دقیقه تا ${pMeta.adhanTitleFa} (${cityNameFa})`,
              body: pCfg.before.mode === 'notification_only'
                ? `یادآور پیش از ${pMeta.adhanTitleFa}`
                : `پخش ${track.titleFa} — ${track.subtitleFa}`,
              soundType: pCfg.before.mode === 'notification_only' ? 'notification_only' : 'surah_chant',
              adhanId: track.audioAdhanId,
              audioUrl: track.audioFile,
              durationSeconds: 0,
              volumePercent: pCfg.before.mode === 'notification_only' ? 0 : 100,
              playbackRate: pCfg.before.speed || 1.0,
            }).catch(() => {});
          }
        }

        // ب) بعد از اذان: ابتدا قبلی را قطعی پاک کن، سپس در صورت فعال بودن جدیدترین را کوک کن
        const afterId = baseIds[pKey].after;
        await NoorAlarm.cancelNativeAlarm({ id: afterId }).catch(() => {});
        if (pCfg.after.enabled) {
          const targetClock = addMinutesToTimeStr(baseTime, pCfg.after.minutesOffset);
          const [hh, mm] = targetClock.split(':').map((n) => parseInt(n, 10));
          if (!isNaN(hh) && !isNaN(mm)) {
            const targetDate = new Date();
            targetDate.setHours(hh, mm, 0, 0);
            if (targetDate.getTime() <= Date.now()) {
              targetDate.setDate(targetDate.getDate() + 1);
            }
            const track = POST_ADHAN_TRACKS.find((t) => t.id === pCfg.after.trackId) || POST_ADHAN_TRACKS[0];

            await NoorAlarm.scheduleNativeAlarm({
              id: afterId,
              triggerAtMillis: targetDate.getTime(),
              title: `📖 ${pMeta.adhanTitleFa} — ${track.titleFa}`,
              body: pCfg.after.mode === 'notification_only'
                ? `یادآور تعقیبات ${pMeta.adhanTitleFa}`
                : `${track.subtitleFa} · سرعت ${toFaDigits(pCfg.after.speed || 1)}x`,
              soundType: pCfg.after.mode === 'notification_only' ? 'notification_only' : 'surah_chant',
              adhanId: track.audioAdhanId,
              audioUrl: track.audioFile,
              durationSeconds: 0,
              volumePercent: pCfg.after.mode === 'notification_only' ? 0 : 100,
              playbackRate: pCfg.after.speed || 1.0,
            }).catch(() => {});
          }
        }
      }
    });

  return syncQueueChain;
}

// پل یکپارچه برای آپدیت از سایر بخش‌های برنامه (مثل مودال استودیو اذان) بدون ساخت آلارم تکراری
export function applyExternalTawashihSelection(
  prayer: PrayerTabKey,
  slot: 'before' | 'after',
  patch: Partial<SlotConfig>,
  cityNameFa?: string
): AllPrayersTawashihMap {
  const current = loadTawashihConfig();
  const nextSlot: SlotConfig = {
    ...current[prayer][slot],
    ...patch,
    trackId: patch.trackId ? normalizeTrackId(patch.trackId, slot === 'after') : current[prayer][slot].trackId,
  };
  const nextCfg: AllPrayersTawashihMap = {
    ...current,
    [prayer]: {
      ...current[prayer],
      [slot]: nextSlot,
    },
  };
  saveTawashihConfig(nextCfg);
  void syncAllTawashihNativeAlarms(nextCfg, undefined, cityNameFa || 'مشهد');
  return nextCfg;
}

export function TawashihAndAdhanReminderSection({
  times,
  cityName,
  cityNameFa,
  onToast,
}: {
  times?: Record<string, string>;
  cityName?: string;
  cityNameFa?: string;
  onToast?: (msg: string) => void;
}) {
  const resolvedCityName = cityNameFa || cityName || 'مشهد';
  const effectiveTimes = resolveEffectivePrayerTimes(times);

  const [config, setConfig] = useState<AllPrayersTawashihMap>(() => loadTawashihConfig());
  const [activePrayer, setActivePrayer] = useState<PrayerTabKey>('fajr');
  const [editingSlot, setEditingSlot] = useState<'before' | 'after' | null>(null);
  const [liveStatusBadge, setLiveStatusBadge] = useState<string | null>(null);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const badgeTimerRef = useRef<number | null>(null);

  const flashSavedBadge = useCallback((msg: string) => {
    setLiveStatusBadge(msg);
    if (badgeTimerRef.current) window.clearTimeout(badgeTimerRef.current);
    badgeTimerRef.current = window.setTimeout(() => setLiveStatusBadge(null), 2600);
  }, []);

  const stopLocalAudio = useCallback(() => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.removeAttribute('src');
      } catch {}
      audioRef.current = null;
    }
    setPlayingTrackId(null);
    void stopAdhanPreview();
  }, []);

  useEffect(() => {
    const onExternalSync = () => setConfig(loadTawashihConfig());
    window.addEventListener(SYNC_EVENT_NAME, onExternalSync);
    return () => {
      window.removeEventListener(SYNC_EVENT_NAME, onExternalSync);
      stopLocalAudio();
      if (badgeTimerRef.current) window.clearTimeout(badgeTimerRef.current);
    };
  }, [stopLocalAudio]);

  const togglePlayTrack = (track: TrackOption, speedToUse = 1.0) => {
    if (playingTrackId === track.id) {
      stopLocalAudio();
      return;
    }
    stopLocalAudio();
    const audio = new Audio(track.audioFile);
    const validSpeed = Number.isFinite(speedToUse) && speedToUse >= 0.5 && speedToUse <= 3.0 ? speedToUse : 1.0;
    audio.playbackRate = validSpeed;
    audio.defaultPlaybackRate = validSpeed;
    (audio as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = true;
    audio.volume = 1.0;
    audioRef.current = audio;
    setPlayingTrackId(track.id);

    audio.onloadedmetadata = () => { audio.playbackRate = validSpeed; };
    audio.onplay = () => { audio.playbackRate = validSpeed; };
    audio.onended = () => { setPlayingTrackId(null); };
    audio.onerror = () => { setPlayingTrackId(null); };
    audio.play().catch(() => { setPlayingTrackId(null); });
  };

  const togglePlayMainAdhan = () => {
    if (playingTrackId === 'main_adhan_preview') {
      stopLocalAudio();
      return;
    }
    stopLocalAudio();
    const selectedAdhanId = localStorage.getItem('noor_guest_adhan_id') || 'moazenzadeh_ardabili';
    const found = adhans.find((a) => a.id === selectedAdhanId) || adhans[0];
    setPlayingTrackId('main_adhan_preview');
    void playAdhanPreview(found, 0, 100, () => {
      setPlayingTrackId(null);
    });
  };

  useEffect(() => {
    void syncAllTawashihNativeAlarms(config, effectiveTimes, resolvedCityName);
  }, [effectiveTimes.fajr, effectiveTimes.dhuhr, effectiveTimes.asr, effectiveTimes.maghrib, effectiveTimes.isha, resolvedCityName]);

  // ذخیره، پاک کردن آلارم قبلی و کوک فوری جدیدترین انتخاب پشت دست کاربر
  const commitConfigInstantly = useCallback(
    (nextCfg: AllPrayersTawashihMap, badgeText: string, toastText?: string) => {
      setConfig(nextCfg);
      saveTawashihConfig(nextCfg);
      void syncAllTawashihNativeAlarms(nextCfg, effectiveTimes, resolvedCityName);
      flashSavedBadge(badgeText);
      if (toastText && onToast) onToast(toastText);
    },
    [effectiveTimes, resolvedCityName, flashSavedBadge, onToast]
  );

  const currentPrayerCfg = config[activePrayer] || DEFAULT_CONFIG[activePrayer];
  const currentMeta = PRAYER_META.find((m) => m.key === activePrayer) || PRAYER_META[0];
  const rawPrayerTime = toEnDigits(effectiveTimes[activePrayer] || '04:52');
  const beforeClock = addMinutesToTimeStr(rawPrayerTime, -currentPrayerCfg.before.minutesOffset);
  const afterClock = addMinutesToTimeStr(rawPrayerTime, currentPrayerCfg.after.minutesOffset);

  const selectedBeforeTrack = PRE_ADHAN_TRACKS.find((t) => t.id === currentPrayerCfg.before.trackId) || PRE_ADHAN_TRACKS[0];
  const selectedAfterTrack = POST_ADHAN_TRACKS.find((t) => t.id === currentPrayerCfg.after.trackId) || POST_ADHAN_TRACKS[0];

  const activeTotalCount = PRAYER_META.reduce((sum, pm) => {
    const item = config[pm.key];
    return sum + (item?.before?.enabled ? 1 : 0) + (item?.after?.enabled ? 1 : 0);
  }, 0);

  const patchSlotInstantly = (
    slot: 'before' | 'after',
    patch: Partial<SlotConfig>,
    customBadge?: string
  ) => {
    const nextSlot: SlotConfig = { ...currentPrayerCfg[slot], ...patch };
    const nextCfg: AllPrayersTawashihMap = {
      ...config,
      [activePrayer]: {
        ...currentPrayerCfg,
        [slot]: nextSlot,
      },
    };
    const nextClock =
      slot === 'before'
        ? addMinutesToTimeStr(rawPrayerTime, -nextSlot.minutesOffset)
        : addMinutesToTimeStr(rawPrayerTime, nextSlot.minutesOffset);

    const badge =
      customBadge ||
      (nextSlot.enabled
        ? `✓ ذخیره شد · کوک برای ساعت ${toFaDigits(nextClock)}`
        : '🔕 یادآور خاموش و آلارم قبلی پاک شد');

    commitConfigInstantly(nextCfg, badge);
  };

  const applyCurrentToAllPrayers = () => {
    const tpl = currentPrayerCfg;
    const nextCfg: AllPrayersTawashihMap = {
      fajr: { before: { ...tpl.before }, after: { ...tpl.after } },
      dhuhr: { before: { ...tpl.before }, after: { ...tpl.after } },
      asr: { before: { ...tpl.before }, after: { ...tpl.after } },
      maghrib: { before: { ...tpl.before }, after: { ...tpl.after } },
      isha: { before: { ...tpl.before }, after: { ...tpl.after } },
    };
    commitConfigInstantly(
      nextCfg,
      '✓ برای تمام ۵ نماز جایگزین و کوک شد',
      '✨ تنظیمات برای همه نمازها جایگزین شد (آلارم‌های قبلی پاک شدند)'
    );
  };

  const handleTestNativeAlarm10s = async () => {
    stopLocalAudio();
    const track = currentPrayerCfg.after.enabled ? selectedAfterTrack : selectedBeforeTrack;
    const testSpeed = currentPrayerCfg.after.enabled ? currentPrayerCfg.after.speed : currentPrayerCfg.before.speed;
    if (!Capacitor.isNativePlatform()) {
      togglePlayTrack(track, testSpeed);
      flashSavedBadge('🔊 پیش‌نمایش تست در مرورگر پخش شد');
      return;
    }
    try {
      await NoorAlarm.requestNotificationPermission().catch(() => {});
      await LocalNotifications.requestPermissions().catch(() => {});
      await NoorAlarm.cancelNativeAlarm({ id: 79999 }).catch(() => {});
      await NoorAlarm.scheduleNativeAlarm({
        id: 79999,
        triggerAtMillis: Date.now() + 10000,
        title: `🕌 تست آلارم نور — ${track.titleFa}`,
        body: `پخش با سرعت ${toFaDigits(testSpeed)}x (تست قفل صفحه)`,
        soundType: 'surah_chant',
        adhanId: track.audioAdhanId,
        audioUrl: track.audioFile,
        durationSeconds: 0,
        volumePercent: 100,
        playbackRate: testSpeed,
      });
      flashSavedBadge('✅ برای ۱۰ ثانیه بعد کوک شد · صفحه را قفل کنید');
      if (onToast) onToast('✅ آلارم تست برای ۱۰ ثانیه بعد کوک شد! الان صفحه گوشی را قفل کنید.');
    } catch {
      flashSavedBadge('❌ دسترسی اعلان یا باتری را بررسی کنید');
    }
  };

  const editingSlotCfg = editingSlot ? currentPrayerCfg[editingSlot] : null;
  const editorTracks = editingSlot === 'after' ? POST_ADHAN_TRACKS : PRE_ADHAN_TRACKS;
  const editingClock =
    editingSlot === 'before'
      ? beforeClock
      : editingSlot === 'after'
      ? afterClock
      : rawPrayerTime;

  return (
    <div
      className="rounded-[28px] p-4 border shadow-xl space-y-3.5 relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(13, 39, 34, 0.96) 0%, rgba(8, 26, 22, 0.98) 100%)',
        borderColor: 'rgba(52, 211, 153, 0.22)',
      }}
      dir="rtl"
    >
      {/* هدر */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              background: 'rgba(16, 185, 129, 0.16)',
              border: '1px solid rgba(52, 211, 153, 0.35)',
              color: '#34D399',
            }}
          >
            <Volume2 size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">تواشیح و تعقیبات</h3>
            <p className="text-[10.5px] text-emerald-100/65 mt-0.5">
              نوای قبل و تلاوت بعد از اذان · ذخیره و جایگزینی خودکار
            </p>
          </div>
        </div>

        <span
          className="px-2.5 py-1 rounded-full text-[10px] font-black border shrink-0"
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            borderColor: 'rgba(52, 211, 153, 0.4)',
            color: '#34D399',
          }}
        >
          {toFaDigits(activeTotalCount)} فعال
        </span>
      </div>

      {/* نوار تایید زنده لحظه‌ای (جایگزین دکمه ذخیره) */}
      {liveStatusBadge && (
        <div
          className="px-3 py-2 rounded-2xl border flex items-center justify-center gap-1.5 text-[11px] font-black animate-fade-in"
          style={{
            background: 'rgba(16, 185, 129, 0.18)',
            borderColor: 'rgba(52, 211, 153, 0.45)',
            color: '#A7F3D0',
          }}
        >
          <Sparkles size={13} className="text-amber-300 shrink-0" />
          <span>{liveStatusBadge}</span>
        </div>
      )}

      {/* تب‌های ۵ نماز */}
      <div
        className="grid grid-cols-5 gap-1 p-1 rounded-2xl border"
        style={{ background: 'rgba(4, 16, 14, 0.65)', borderColor: 'rgba(255, 255, 255, 0.07)' }}
      >
        {PRAYER_META.map((pm) => {
          const isSelected = activePrayer === pm.key;
          const pState = config[pm.key] || DEFAULT_CONFIG[pm.key];
          return (
            <button
              key={pm.key}
              type="button"
              onClick={() => {
                stopLocalAudio();
                setEditingSlot(null);
                setActivePrayer(pm.key);
              }}
              className="py-1.5 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all"
              style={{
                background: isSelected ? 'rgba(20, 62, 52, 0.95)' : 'transparent',
                border: isSelected ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid transparent',
                color: isSelected ? '#FFFFFF' : 'rgba(236, 253, 245, 0.55)',
              }}
            >
              <span className="text-[11px] font-black">{pm.labelFa}</span>
              <div className="flex items-center gap-1 h-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: pState.before.enabled ? '#FBBF24' : 'rgba(255,255,255,0.15)' }} />
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: pState.after.enabled ? '#34D399' : 'rgba(255,255,255,0.15)' }} />
              </div>
            </button>
          );
        })}
      </div>

      {/* تایم‌لاین ۳ مرحله‌ای: قبل از اذان -> اذان -> بعد از اذان */}
      <div className="relative space-y-2.5">
        {/* ۱. قبل از اذان */}
        <div className="flex items-stretch gap-2.5">
          <div className="flex flex-col items-center pt-2 shrink-0">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center border"
              style={{
                background: currentPrayerCfg.before.enabled ? 'rgba(251, 191, 36, 0.16)' : 'rgba(255,255,255,0.04)',
                borderColor: currentPrayerCfg.before.enabled ? '#FBBF24' : 'rgba(255,255,255,0.15)',
                color: currentPrayerCfg.before.enabled ? '#FBBF24' : 'rgba(255,255,255,0.4)',
              }}
            >
              <Clock size={14} />
            </div>
            <div className="w-0.5 flex-1 my-1" style={{ background: 'rgba(52, 211, 153, 0.25)' }} />
          </div>

          <div
            className="flex-1 rounded-2xl p-3 border space-y-2.5 transition-all"
            style={{
              background: 'rgba(7, 24, 21, 0.78)',
              borderColor: currentPrayerCfg.before.enabled ? 'rgba(251, 191, 36, 0.35)' : 'rgba(255, 255, 255, 0.08)',
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-black" style={{ background: 'rgba(251, 191, 36, 0.18)', color: '#FBBF24' }}>
                  قبل از اذان
                </span>
                <strong className="text-xs font-black tracking-wider text-white">
                  {currentPrayerCfg.before.enabled ? toFaDigits(beforeClock) : 'خاموش'}
                </strong>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={currentPrayerCfg.before.enabled}
                onClick={() => patchSlotInstantly('before', { enabled: !currentPrayerCfg.before.enabled })}
                className="w-10 h-5 rounded-full p-0.5 transition-colors flex items-center"
                style={{
                  background: currentPrayerCfg.before.enabled ? '#FBBF24' : 'rgba(255,255,255,0.18)',
                  justifyContent: currentPrayerCfg.before.enabled ? 'flex-start' : 'flex-end',
                }}
              >
                <span className="w-4 h-4 rounded-full bg-white shadow-md block" />
              </button>
            </div>

            {/* چیپ‌های انتخاب سریع دقیقه (تک‌کلیکی و خودکار) */}
            <div className="flex items-center gap-1 flex-wrap">
              {QUICK_OFFSET_PILLS.map((m) => {
                const active = currentPrayerCfg.before.enabled && currentPrayerCfg.before.minutesOffset === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => patchSlotInstantly('before', { minutesOffset: m, enabled: true })}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-black border transition-all active:scale-95"
                    style={{
                      background: active ? '#FBBF24' : 'rgba(255,255,255,0.04)',
                      borderColor: active ? '#FBBF24' : 'rgba(255,255,255,0.1)',
                      color: active ? '#041511' : 'rgba(236,253,245,0.7)',
                    }}
                  >
                    {toFaDigits(m)} دق
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-2">
              <div
                onClick={() => { stopLocalAudio(); setEditingSlot('before'); }}
                role="button"
                tabIndex={0}
                className="flex-1 rounded-xl p-2 border flex items-center justify-between gap-2 cursor-pointer transition-colors"
                style={{
                  background: 'rgba(15, 46, 39, 0.65)',
                  borderColor: 'rgba(255,255,255,0.08)',
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlayTrack(selectedBeforeTrack, currentPrayerCfg.before.speed);
                    }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(251, 191, 36, 0.2)', color: '#FBBF24' }}
                  >
                    {playingTrackId === selectedBeforeTrack.id ? <Square size={11} /> : <Volume2 size={13} />}
                  </button>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-white truncate">
                      {currentPrayerCfg.before.mode === 'notification_only' ? 'فقط اعلان (بدون صدا)' : selectedBeforeTrack.titleFa}
                    </div>
                    <div className="text-[10px] text-emerald-100/60 truncate">
                      {currentPrayerCfg.before.mode === 'notification_only'
                        ? 'نوتیفیکیشن بی‌صدا'
                        : `${selectedBeforeTrack.subtitleFa} · ${toFaDigits(currentPrayerCfg.before.speed || 1)}x`}
                    </div>
                  </div>
                </div>
                <span className="text-[10.5px] font-black text-amber-300 shrink-0 px-1">تغییر ‹</span>
              </div>
            </div>
          </div>
        </div>

        {/* ۲. اذان اصلی */}
        <div className="flex items-center gap-2.5">
          <div className="flex flex-col items-center shrink-0">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)', color: '#041511' }}
            >
              <Bell size={15} />
            </div>
          </div>

          <div
            className="flex-1 rounded-2xl px-3.5 py-2.5 border flex items-center justify-between"
            style={{
              background: 'linear-gradient(90deg, rgba(16, 68, 56, 0.85) 0%, rgba(9, 39, 33, 0.9) 100%)',
              borderColor: 'rgba(52, 211, 153, 0.4)',
            }}
          >
            <div>
              <div className="text-xs font-black text-white">{currentMeta.adhanTitleFa}</div>
              <div className="text-[10px] text-emerald-200/70">پخش اذان کامل</div>
            </div>

            <div className="flex items-center gap-2">
              <strong className="text-sm font-black tracking-wider text-sky-400">{toFaDigits(rawPrayerTime)}</strong>
              <button
                type="button"
                onClick={togglePlayMainAdhan}
                className="w-7 h-7 rounded-full border flex items-center justify-center bg-white/5 border-white/20 text-white"
              >
                {playingTrackId === 'main_adhan_preview' ? <Square size={11} /> : <Volume2 size={13} />}
              </button>
            </div>
          </div>
        </div>

        {/* ۳. بعد از اذان */}
        <div className="flex items-stretch gap-2.5">
          <div className="flex flex-col items-center pt-1 shrink-0">
            <div className="w-0.5 h-2 mb-1" style={{ background: 'rgba(52, 211, 153, 0.25)' }} />
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center border"
              style={{
                background: currentPrayerCfg.after.enabled ? 'rgba(52, 211, 153, 0.16)' : 'rgba(255,255,255,0.04)',
                borderColor: currentPrayerCfg.after.enabled ? '#34D399' : 'rgba(255,255,255,0.15)',
                color: currentPrayerCfg.after.enabled ? '#34D399' : 'rgba(255,255,255,0.4)',
              }}
            >
              <Clock size={14} />
            </div>
          </div>

          <div
            className="flex-1 rounded-2xl p-3 border space-y-2.5 transition-all"
            style={{
              background: 'rgba(7, 24, 21, 0.78)',
              borderColor: currentPrayerCfg.after.enabled ? 'rgba(52, 211, 153, 0.35)' : 'rgba(255, 255, 255, 0.08)',
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-black" style={{ background: 'rgba(52, 211, 153, 0.18)', color: '#34D399' }}>
                  بعد از اذان
                </span>
                <strong className="text-xs font-black tracking-wider text-white">
                  {currentPrayerCfg.after.enabled ? toFaDigits(afterClock) : 'خاموش'}
                </strong>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={currentPrayerCfg.after.enabled}
                onClick={() => patchSlotInstantly('after', { enabled: !currentPrayerCfg.after.enabled })}
                className="w-10 h-5 rounded-full p-0.5 transition-colors flex items-center"
                style={{
                  background: currentPrayerCfg.after.enabled ? '#34D399' : 'rgba(255,255,255,0.18)',
                  justifyContent: currentPrayerCfg.after.enabled ? 'flex-start' : 'flex-end',
                }}
              >
                <span className="w-4 h-4 rounded-full bg-white shadow-md block" />
              </button>
            </div>

            {/* چیپ‌های انتخاب سریع دقیقه (تک‌کلیکی و خودکار) */}
            <div className="flex items-center gap-1 flex-wrap">
              {QUICK_OFFSET_PILLS.map((m) => {
                const active = currentPrayerCfg.after.enabled && currentPrayerCfg.after.minutesOffset === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => patchSlotInstantly('after', { minutesOffset: m, enabled: true })}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-black border transition-all active:scale-95"
                    style={{
                      background: active ? '#34D399' : 'rgba(255,255,255,0.04)',
                      borderColor: active ? '#34D399' : 'rgba(255,255,255,0.1)',
                      color: active ? '#041511' : 'rgba(236,253,245,0.7)',
                    }}
                  >
                    {toFaDigits(m)} دق
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-2">
              <div
                onClick={() => { stopLocalAudio(); setEditingSlot('after'); }}
                role="button"
                tabIndex={0}
                className="flex-1 rounded-xl p-2 border flex items-center justify-between gap-2 cursor-pointer transition-colors"
                style={{
                  background: 'rgba(15, 46, 39, 0.65)',
                  borderColor: 'rgba(255,255,255,0.08)',
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlayTrack(selectedAfterTrack, currentPrayerCfg.after.speed);
                    }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(52, 211, 153, 0.2)', color: '#34D399' }}
                  >
                    {playingTrackId === selectedAfterTrack.id ? <Square size={11} /> : <Volume2 size={13} />}
                  </button>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-white truncate">
                      {currentPrayerCfg.after.mode === 'notification_only' ? 'فقط اعلان (بدون صدا)' : selectedAfterTrack.titleFa}
                    </div>
                    <div className="text-[10px] text-emerald-100/60 truncate">
                      {currentPrayerCfg.after.mode === 'notification_only'
                        ? 'نوتیفیکیشن بی‌صدا'
                        : `${selectedAfterTrack.subtitleFa} · ${toFaDigits(currentPrayerCfg.after.speed || 1)}x`}
                    </div>
                  </div>
                </div>
                <span className="text-[10.5px] font-black text-emerald-300 shrink-0 px-1">تغییر ‹</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* پنجره انتخاب شیک و بدون دکمه ذخیره (هر لمس بلافاصله جایگزین قبلی و کوک می‌شود) */}
      {editingSlot && editingSlotCfg && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: 'rgba(2, 12, 10, 0.84)', backdropFilter: 'blur(8px)' }}
          onClick={() => { stopLocalAudio(); setEditingSlot(null); }}
          dir="rtl"
        >
          <div
            className="w-full max-w-md rounded-3xl p-4 border space-y-3.5 shadow-2xl max-h-[86vh] flex flex-col"
            style={{ background: 'linear-gradient(165deg, #0A2922 0%, #051612 100%)', borderColor: 'rgba(251, 191, 36, 0.45)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <div>
                <h4 className="text-xs font-black text-amber-300">
                  {editingSlot === 'before' ? `تواشیح قبل از ${currentMeta.adhanTitleFa}` : `سوره و تعقیبات بعد از ${currentMeta.adhanTitleFa}`}
                </h4>
                <p className="text-[10.5px] text-emerald-200/80 mt-0.5">
                  {editingSlotCfg.enabled
                    ? `✓ کوک خودکار روی ساعت ${toFaDigits(editingClock)} · آلارم قبلی خودکار پاک می‌شود`
                    : 'با انتخاب هر گزینه به‌صورت خودکار فعال و کوک می‌شود'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { stopLocalAudio(); setEditingSlot(null); }}
                aria-label="بستن"
                className="w-8 h-8 rounded-full border flex items-center justify-center text-white/85 border-white/20 bg-white/5"
              >
                <X size={15} />
              </button>
            </div>

            {/* حالت پخش صوتی یا فقط اعلان */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => patchSlotInstantly(editingSlot, { enabled: true, mode: 'audio' })}
                className="p-3 rounded-2xl border flex items-center justify-between transition-all text-right"
                style={{
                  background: editingSlotCfg.mode === 'audio' ? 'rgba(42, 39, 18, 0.75)' : 'rgba(255,255,255,0.03)',
                  borderColor: editingSlotCfg.mode === 'audio' ? '#FBBF24' : 'rgba(255,255,255,0.1)',
                }}
              >
                <div>
                  <div className="text-xs font-black" style={{ color: editingSlotCfg.mode === 'audio' ? '#FBBF24' : '#FFFFFF' }}>پخش صوتی</div>
                  <div className="text-[10px] opacity-65 text-white mt-0.5">پخش کامل نوا یا سوره</div>
                </div>
                <Volume2 size={16} className={editingSlotCfg.mode === 'audio' ? 'text-amber-300' : 'text-gray-400'} />
              </button>

              <button
                type="button"
                onClick={() => {
                  stopLocalAudio();
                  patchSlotInstantly(editingSlot, { enabled: true, mode: 'notification_only' });
                }}
                className="p-3 rounded-2xl border flex items-center justify-between transition-all text-right"
                style={{
                  background: editingSlotCfg.mode === 'notification_only' ? 'rgba(42, 39, 18, 0.75)' : 'rgba(255,255,255,0.03)',
                  borderColor: editingSlotCfg.mode === 'notification_only' ? '#FBBF24' : 'rgba(255,255,255,0.1)',
                }}
              >
                <div>
                  <div className="text-xs font-black" style={{ color: editingSlotCfg.mode === 'notification_only' ? '#FBBF24' : '#FFFFFF' }}>فقط اعلان</div>
                  <div className="text-[10px] opacity-65 text-white mt-0.5">یادآور بی‌صدا</div>
                </div>
                <Bell size={16} className={editingSlotCfg.mode === 'notification_only' ? 'text-amber-300' : 'text-gray-400'} />
              </button>
            </div>

            {editingSlotCfg.mode === 'audio' && (
              <>
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-xs font-black text-white">انتخاب تک‌کلیکی (ذخیره آنی)</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-emerald-200/70 ml-1">سرعت:</span>
                    {SPEED_OPTIONS.map((sp) => (
                      <button
                        key={sp}
                        type="button"
                        onClick={() => {
                          setAlarmPlaybackSpeed(sp);
                          if (audioRef.current) audioRef.current.playbackRate = sp;
                          patchSlotInstantly(editingSlot, { enabled: true, speed: sp });
                        }}
                        className="px-2 py-0.5 rounded-lg text-[10px] font-black border"
                        style={{
                          background: editingSlotCfg.speed === sp ? '#FBBF24' : 'rgba(255,255,255,0.05)',
                          borderColor: editingSlotCfg.speed === sp ? '#FBBF24' : 'rgba(255,255,255,0.12)',
                          color: editingSlotCfg.speed === sp ? '#041511' : '#D1FAE5',
                        }}
                      >
                        {toFaDigits(sp)}x
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
                  {editorTracks.map((tr) => {
                    const isSelected = editingSlotCfg.trackId === tr.id;
                    const isPlaying = playingTrackId === tr.id;
                    return (
                      <div
                        key={tr.id}
                        onClick={() => {
                          patchSlotInstantly(
                            editingSlot,
                            { enabled: true, mode: 'audio', trackId: tr.id },
                            `✓ «${tr.titleFa}» جایگزین و برای ${toFaDigits(editingClock)} کوک شد`
                          );
                        }}
                        role="button"
                        tabIndex={0}
                        className="rounded-2xl p-3 border flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99]"
                        style={{
                          background: isSelected ? 'rgba(42, 39, 18, 0.55)' : 'rgba(13, 36, 31, 0.65)',
                          borderColor: isSelected ? '#FBBF24' : 'rgba(255, 255, 255, 0.08)',
                        }}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              patchSlotInstantly(editingSlot, { enabled: true, mode: 'audio', trackId: tr.id });
                              togglePlayTrack(tr, editingSlotCfg.speed);
                            }}
                            className="w-8 h-8 rounded-full border flex items-center justify-center shrink-0"
                            style={{
                              background: isPlaying ? '#FBBF24' : 'rgba(255,255,255,0.06)',
                              borderColor: isPlaying ? '#FBBF24' : 'rgba(255,255,255,0.16)',
                              color: isPlaying ? '#041511' : '#D1FAE5',
                            }}
                          >
                            {isPlaying ? <Square size={12} /> : <Volume2 size={14} />}
                          </button>
                          <div className="min-w-0 text-right">
                            <div className="text-xs font-black text-white truncate">{tr.titleFa}</div>
                            <div className="text-[10px] text-emerald-100/60 truncate mt-0.5">{tr.subtitleFa} · {tr.durationFa}</div>
                          </div>
                        </div>

                        <div
                          className="w-5 h-5 rounded-full border flex items-center justify-center shrink-0"
                          style={{
                            background: isSelected ? '#FBBF24' : 'transparent',
                            borderColor: isSelected ? '#FBBF24' : 'rgba(255,255,255,0.25)',
                          }}
                        >
                          {isSelected && <Check size={12} strokeWidth={3} className="text-black" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
              <span className="text-[10.5px] font-bold text-emerald-300 flex items-center gap-1">
                <Check size={13} />
                <span>تغییرات خودکار ذخیره شده‌اند</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  stopLocalAudio();
                  patchSlotInstantly(editingSlot, { enabled: false });
                  setEditingSlot(null);
                }}
                className="px-3.5 py-2 rounded-xl font-black text-[11px] border text-rose-200 bg-rose-500/10 border-rose-400/30"
              >
                خاموش کردن این یادآور
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* دکمه‌های کاربردی پایین */}
      <button
        type="button"
        onClick={applyCurrentToAllPrayers}
        className="w-full py-2.5 rounded-2xl border text-[11px] font-black flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
        style={{ background: 'rgba(255, 255, 255, 0.03)', borderColor: 'rgba(255, 255, 255, 0.08)', color: 'rgba(236, 253, 245, 0.78)' }}
      >
        <Copy size={13} />
        <span>اعمال برای همه نمازها</span>
      </button>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => { void handleTestNativeAlarm10s(); }}
          className="py-2.5 px-2 rounded-2xl border text-[11px] font-black flex items-center justify-center gap-1.5 transition-transform active:scale-[0.98]"
          style={{
            background: 'rgba(251, 191, 36, 0.14)',
            borderColor: 'rgba(251, 191, 36, 0.45)',
            color: '#FDE68A',
          }}
        >
          <Bell size={13} />
          <span>تست آلارم (۱۰ ثانیه)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (Capacitor.isNativePlatform()) {
              void NoorAlarm.requestNotificationPermission().catch(() => {});
              void NoorAlarm.openBatteryOptimizationSettings().catch(() => {});
            } else {
              flashSavedBadge('این دکمه روی گوشی تنظیمات باتری را باز می‌کند');
            }
          }}
          className="py-2.5 px-2 rounded-2xl border text-[11px] font-black flex items-center justify-center gap-1.5 transition-transform active:scale-[0.98]"
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            borderColor: 'rgba(52, 211, 153, 0.35)',
            color: '#A7F3D0',
          }}
        >
          <Clock size={13} />
          <span>تنظیمات صفحه خاموش</span>
        </button>
      </div>
    </div>
  );
}
