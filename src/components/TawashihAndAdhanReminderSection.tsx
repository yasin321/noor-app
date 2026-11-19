import { createPortal } from 'react-dom';
import { useState, useEffect, useRef } from 'react';
import { Bell, Volume2, Square, Clock, Check, Copy } from 'lucide-react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { adhans, playAdhanPreview, stopAdhanPreview } from '@/lib/adhans';
import { setAlarmPlaybackSpeed } from '@/lib/reminderService';
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
  if (!id) return isAfter ? 'surah_waqiah' : 'rabbana_shajarian';
  if (id === 'rabbanaghfir' || id === 'rabbana') return 'rabbana_shajarian';
  if (id === 'nadali') return 'nadali_alifani';
  const list = isAfter ? POST_ADHAN_TRACKS : PRE_ADHAN_TRACKS;
  if (list.some((t) => t.id === id)) return id;
  return list[0].id;
}

export function loadTawashihConfig(): AllPrayersTawashihMap {
  return loadSavedTawashihConfig();
}

function loadSavedTawashihConfig(): AllPrayersTawashihMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const keys: PrayerTabKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
        for (const k of keys) {
          if (!parsed[k]) parsed[k] = DEFAULT_CONFIG[k];
          parsed[k].before.trackId = normalizeTrackId(parsed[k].before?.trackId, false);
          parsed[k].after.trackId = normalizeTrackId(parsed[k].after?.trackId, true);
        }
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_CONFIG;
}

function saveTawashihConfig(cfg: AllPrayersTawashihMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch {}
}

const PRAYER_META: { key: PrayerTabKey; labelFa: string; adhanTitleFa: string }[] = [
  { key: 'fajr', labelFa: 'صبح', adhanTitleFa: 'اذان صبح' },
  { key: 'dhuhr', labelFa: 'ظهر', adhanTitleFa: 'اذان ظهر' },
  { key: 'asr', labelFa: 'عصر', adhanTitleFa: 'اذان عصر' },
  { key: 'maghrib', labelFa: 'مغرب', adhanTitleFa: 'اذان مغرب' },
  { key: 'isha', labelFa: 'عشاء', adhanTitleFa: 'اذان عشاء' },
];

const OFFSET_OPTIONS = [1, 2, 3, 5, 10, 15, 20, 30];
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

function formatOffsetLabelFa(mins: number, suffix: string): string {
  return `${toFaDigits(mins)} دقیقه ${suffix}`;
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

function resolveEffectivePrayerTimes(passedTimes?: any): Record<string, string> {
  if (passedTimes && passedTimes.fajr && passedTimes.dhuhr) {
    return passedTimes;
  }
  try {
    const savedCityId = localStorage.getItem('noor_guest_city') || 'mashhad';
    const foundCity: any = CITIES.find((c: any) => c.id === savedCityId || c.name === savedCityId) || CITIES[0] || { lat: 36.2605, lng: 59.6168 };
    return calculatePrayerTimes(new Date(), foundCity.lat, foundCity.lng) as any;
  } catch {
    return { fajr: '04:52', dhuhr: '11:19', asr: '14:03', maghrib: '16:40', isha: '17:32' };
  }
}

export async function syncAllTawashihNativeAlarms(
  nextCfg: AllPrayersTawashihMap,
  passedTimes?: any,
  cityNameFa: string = 'مشهد'
): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
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
    const pKey = pMeta.key;
    const baseTime = toEnDigits(effectiveTimes[pKey] || '04:52');
    const pCfg = nextCfg[pKey];
    if (!pCfg) continue;

    // ۱. آلارم قبل از اذان
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
          soundType: pCfg.before.mode === 'notification_only' ? 'silent' : 'surah_chant',
          adhanId: track.audioAdhanId,
          audioUrl: track.audioFile,
          durationSeconds: 0,
          volumePercent: pCfg.before.mode === 'notification_only' ? 0 : 100,
          playbackRate: pCfg.before.speed || 1.0,
        }).catch(() => {});
      }
    }

    // ۲. آلارم بعد از اذان
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
          title: `📖 یادآور پس از ${pMeta.adhanTitleFa} — ${track.titleFa}`,
          body: pCfg.after.mode === 'notification_only'
            ? `یادآور تعقیبات ${pMeta.adhanTitleFa}`
            : `${track.subtitleFa} (سرعت ${toFaDigits(pCfg.after.speed || 1)}x)`,
          soundType: pCfg.after.mode === 'notification_only' ? 'silent' : 'surah_chant',
          adhanId: track.audioAdhanId,
          audioUrl: track.audioFile,
          durationSeconds: 0,
          volumePercent: pCfg.after.mode === 'notification_only' ? 0 : 100,
          playbackRate: pCfg.after.speed || 1.0,
        }).catch(() => {});
      }
    }
  }
}

export function TawashihAndAdhanReminderSection({
  times,
  cityName,
  cityNameFa,
  onToast,
}: {
  times?: any;
  cityName?: string;
  cityNameFa?: string;
  onToast?: (msg: string) => void;
}) {
  const resolvedCityName = cityNameFa || cityName || 'مشهد';
  const effectiveTimes = resolveEffectivePrayerTimes(times);

  const [config, setConfig] = useState<AllPrayersTawashihMap>(() => loadSavedTawashihConfig());
  const [activePrayer, setActivePrayer] = useState<PrayerTabKey>('fajr');
  const [editingSlot, setEditingSlot] = useState<'before' | 'after' | null>(null);

  const [draftMode, setDraftMode] = useState<'audio' | 'notification_only'>('audio');
  const [draftTrackId, setDraftTrackId] = useState<string>('rabbana_shajarian');
  const [draftSpeed, setDraftSpeed] = useState<number>(1.0);

  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopLocalAudio = () => {
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
  };

  useEffect(() => {
    return () => { stopLocalAudio(); };
  }, []);

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
    (audio as any).preservesPitch = true;
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

  // ذخیره و زمان‌بندی فوری پشت دست کاربر در هر تغییر
  const updateAndSaveInstantly = (nextCfg: AllPrayersTawashihMap, toastMessage?: string) => {
    setConfig(nextCfg);
    saveTawashihConfig(nextCfg);
    try {
      const cur = nextCfg[activePrayer];
      const bTrack = PRE_ADHAN_TRACKS.find((t) => t.id === cur.before.trackId);
      const aTrack = POST_ADHAN_TRACKS.find((t) => t.id === cur.after.trackId);
      if (bTrack) localStorage.setItem('noor_pre_adhan_chant_id_v1', bTrack.audioAdhanId);
      if (aTrack) localStorage.setItem('noor_after_adhan_reminder_track_v1', aTrack.audioAdhanId);
    } catch {}
    void syncAllTawashihNativeAlarms(nextCfg, effectiveTimes, resolvedCityName);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('noor-alarms-updated'));
    }
    if (toastMessage && onToast) onToast(toastMessage);
  };

  const currentPrayerCfg = config[activePrayer] || DEFAULT_CONFIG[activePrayer];
  const currentMeta = PRAYER_META.find((m) => m.key === activePrayer) || PRAYER_META[0];
  const rawPrayerTime = toEnDigits(effectiveTimes[activePrayer] || '04:52');
  const beforeClock = addMinutesToTimeStr(rawPrayerTime, -currentPrayerCfg.before.minutesOffset);
  const afterClock = addMinutesToTimeStr(rawPrayerTime, currentPrayerCfg.after.minutesOffset);

  const selectedBeforeTrack = PRE_ADHAN_TRACKS.find((t) => t.id === currentPrayerCfg.before.trackId) || PRE_ADHAN_TRACKS[0];
  const selectedAfterTrack = POST_ADHAN_TRACKS.find((t) => t.id === currentPrayerCfg.after.trackId) || POST_ADHAN_TRACKS[0];

  const activeCountForCurrent = PRAYER_META.reduce((sum, pm) => {
    const item = config[pm.key];
    return sum + (item?.before?.enabled ? 1 : 0) + (item?.after?.enabled ? 1 : 0);
  }, 0);

  const openEditorForSlot = (slot: 'before' | 'after') => {
    stopLocalAudio();
    const slotCfg = currentPrayerCfg[slot];
    setDraftMode(slotCfg.mode);
    setDraftTrackId(slotCfg.trackId);
    setDraftSpeed(slotCfg.speed || 1.0);
    setEditingSlot(slot);
  };

  // هر تغییری در داخل پاپ‌آپ انجام شود، همان لحظه پشت دست کاربر ذخیره و کوک می‌شود
  const applySlotPatchInstantly = (
    slot: 'before' | 'after',
    patch: Partial<SlotConfig>,
    toastMsg?: string
  ) => {
    const nextSlot: SlotConfig = {
      ...currentPrayerCfg[slot],
      ...patch,
    };
    const nextCfg: AllPrayersTawashihMap = {
      ...config,
      [activePrayer]: {
        ...currentPrayerCfg,
        [slot]: nextSlot,
      },
    };
    updateAndSaveInstantly(nextCfg, toastMsg);
  };

  const handleSaveEditor = () => {
    if (!editingSlot) return;
    stopLocalAudio();
    setAlarmPlaybackSpeed(draftSpeed);
    const slotLabel = editingSlot === 'before' ? 'قبل از اذان' : 'بعد از اذان';
    applySlotPatchInstantly(
      editingSlot,
      { enabled: true, mode: draftMode, trackId: draftTrackId, speed: draftSpeed },
      `✅ تنظیمات ${slotLabel} برای ${currentMeta.adhanTitleFa} به صورت خودکار کوک شد`
    );
    setEditingSlot(null);
  };

  const handleTurnOffSlot = () => {
    if (!editingSlot) return;
    stopLocalAudio();
    applySlotPatchInstantly(editingSlot, { enabled: false }, '🔕 این یادآور غیرفعال شد');
    setEditingSlot(null);
  };

  const toggleSlotDirectly = (slot: 'before' | 'after') => {
    const nextEnabled = !currentPrayerCfg[slot].enabled;
    const label = slot === 'before' ? 'تواشیح قبل از اذان' : 'یادآور بعد از اذان';
    applySlotPatchInstantly(
      slot,
      { enabled: nextEnabled },
      nextEnabled ? `🔔 ${label} (${currentMeta.labelFa}) خودکار کوک شد` : `🔕 ${label} (${currentMeta.labelFa}) خاموش شد`
    );
  };

  const updateOffsetMinutes = (slot: 'before' | 'after', mins: number) => {
    const targetClock = slot === 'before'
      ? addMinutesToTimeStr(rawPrayerTime, -mins)
      : addMinutesToTimeStr(rawPrayerTime, mins);
    applySlotPatchInstantly(
      slot,
      { minutesOffset: mins, enabled: true },
      `⏰ یادآور روی ساعت ${toFaDigits(targetClock)} خودکار کوک شد`
    );
  };

  const handleTestNativeAlarm10s = async () => {
    stopLocalAudio();
    const track = selectedBeforeTrack || PRE_ADHAN_TRACKS[0];
    const testSpeed = currentPrayerCfg.before.speed || 1.0;
    if (!Capacitor.isNativePlatform()) {
      togglePlayTrack(track, testSpeed);
      if (onToast) onToast('🔊 پیش‌نمایش تست در مرورگر پخش شد (تست قفل صفحه روی گوشی اندروید فعال است)');
      return;
    }
    try {
      await NoorAlarm.requestNotificationPermission().catch(() => {});
      await LocalNotifications.requestPermissions().catch(() => {});
      await NoorAlarm.scheduleNativeAlarm({
        id: 79999,
        triggerAtMillis: Date.now() + 10000,
        title: `🕌 تست واقعی آلارم نور — ${track.titleFa}`,
        body: `در حال پخش با سرعت ${toFaDigits(testSpeed)}x (صفحه قفل تست شد)`,
        soundType: 'surah_chant',
        adhanId: track.audioAdhanId,
        audioUrl: track.audioFile,
        durationSeconds: 0,
        volumePercent: 100,
        playbackRate: testSpeed,
      });
      if (onToast) onToast('✅ آلارم تست برای ۱۰ ثانیه بعد کوک شد! الان صفحه گوشی را قفل و خاموش کنید.');
    } catch {
      if (onToast) onToast('❌ خطا در ثبت آلارم تست؛ دسترسی اعلان و باتری را بررسی کنید.');
    }
  };

  const applyCurrentToAllPrayers = () => {
    const template = currentPrayerCfg;
    const nextCfg: AllPrayersTawashihMap = {
      fajr: { before: { ...template.before }, after: { ...template.after } },
      dhuhr: { before: { ...template.before }, after: { ...template.after } },
      asr: { before: { ...template.before }, after: { ...template.after } },
      maghrib: { before: { ...template.before }, after: { ...template.after } },
      isha: { before: { ...template.before }, after: { ...template.after } },
    };
    updateAndSaveInstantly(nextCfg, '✨ تنظیمات برای تمام ۵ نماز به صورت خودکار کوک شد!');
  };

  const editorTracks = editingSlot === 'after' ? POST_ADHAN_TRACKS : PRE_ADHAN_TRACKS;

  return (
    <div
      className="rounded-[28px] p-4 border shadow-xl space-y-3.5 relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(13, 39, 34, 0.96) 0%, rgba(8, 26, 22, 0.98) 100%)',
        borderColor: 'rgba(52, 211, 153, 0.22)',
      }}
      dir="rtl"
    >
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
            <p className="text-[10px] text-emerald-100/60 mt-0.5">
              نوای قبل و تلاوت بعد از اذان
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
          {toFaDigits(activeCountForCurrent)} فعال
        </span>
      </div>

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

      <div className="relative space-y-2.5">
        {/* قبل از اذان */}
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
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-black" style={{ background: 'rgba(251, 191, 36, 0.18)', color: '#FBBF24' }}>
                  قبل از اذان
                </span>
                <select
                  aria-label="دقیقه قبل از اذان"
                  value={currentPrayerCfg.before.minutesOffset}
                  onChange={(e) => updateOffsetMinutes('before', Number(e.target.value))}
                  className="bg-black/30 text-emerald-100 px-2 py-0.5 rounded-lg border text-[10px] font-bold outline-none cursor-pointer border-white/10"
                >
                  {OFFSET_OPTIONS.map((m) => (
                    <option key={m} value={m} className="bg-slate-900 text-white">{formatOffsetLabelFa(m, 'قبل')}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <strong className="text-xs font-black tracking-wider text-white">{toFaDigits(beforeClock)}</strong>
                <button
                  type="button"
                  role="switch"
                  aria-checked={currentPrayerCfg.before.enabled}
                  onClick={() => toggleSlotDirectly('before')}
                  className="w-10 h-5 rounded-full p-0.5 transition-colors flex items-center"
                  style={{
                    background: currentPrayerCfg.before.enabled ? '#FBBF24' : 'rgba(255,255,255,0.18)',
                    justifyContent: currentPrayerCfg.before.enabled ? 'flex-start' : 'flex-end',
                  }}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-md block" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div
                onClick={() => togglePlayTrack(selectedBeforeTrack, currentPrayerCfg.before.speed)}
                role="button"
                tabIndex={0}
                className="flex-1 rounded-xl p-2 border flex items-center justify-between gap-2 cursor-pointer transition-colors"
                style={{
                  background: 'rgba(15, 46, 39, 0.65)',
                  borderColor: playingTrackId === selectedBeforeTrack.id ? '#FBBF24' : 'rgba(255,255,255,0.08)',
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(251, 191, 36, 0.2)', color: '#FBBF24' }}>
                    {playingTrackId === selectedBeforeTrack.id ? <Square size={12} /> : <Volume2 size={14} />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-white truncate">
                      {currentPrayerCfg.before.mode === 'notification_only' ? 'فقط اعلان (بدون صدا)' : selectedBeforeTrack.titleFa}
                    </div>
                    <div className="text-[10px] text-emerald-100/60 truncate">
                      {currentPrayerCfg.before.mode === 'notification_only'
                        ? 'نوتیفیکیشن بی‌صدا'
                        : `${selectedBeforeTrack.subtitleFa} · سرعت ${toFaDigits(currentPrayerCfg.before.speed || 1)}x`}
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => editingSlot === 'before' ? setEditingSlot(null) : openEditorForSlot('before')}
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-black transition-colors shrink-0"
                style={{ color: editingSlot === 'before' ? '#FBBF24' : 'rgba(236, 253, 245, 0.7)' }}
              >
                تغییر ‹
              </button>
            </div>
          </div>
        </div>

        {/* اذان اصلی */}
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

        {/* بعد از اذان */}
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
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-black" style={{ background: 'rgba(52, 211, 153, 0.18)', color: '#34D399' }}>
                  بعد از اذان
                </span>
                <select
                  aria-label="دقیقه بعد از اذان"
                  value={currentPrayerCfg.after.minutesOffset}
                  onChange={(e) => updateOffsetMinutes('after', Number(e.target.value))}
                  className="bg-black/30 text-emerald-100 px-2 py-0.5 rounded-lg border text-[10px] font-bold outline-none cursor-pointer border-white/10"
                >
                  {OFFSET_OPTIONS.map((m) => (
                    <option key={m} value={m} className="bg-slate-900 text-white">{formatOffsetLabelFa(m, 'بعد')}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <strong className="text-xs font-black tracking-wider text-white">{toFaDigits(afterClock)}</strong>
                <button
                  type="button"
                  role="switch"
                  aria-checked={currentPrayerCfg.after.enabled}
                  onClick={() => toggleSlotDirectly('after')}
                  className="w-10 h-5 rounded-full p-0.5 transition-colors flex items-center"
                  style={{
                    background: currentPrayerCfg.after.enabled ? '#34D399' : 'rgba(255,255,255,0.18)',
                    justifyContent: currentPrayerCfg.after.enabled ? 'flex-start' : 'flex-end',
                  }}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-md block" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div
                onClick={() => togglePlayTrack(selectedAfterTrack, currentPrayerCfg.after.speed)}
                role="button"
                tabIndex={0}
                className="flex-1 rounded-xl p-2 border flex items-center justify-between gap-2 cursor-pointer transition-colors"
                style={{
                  background: 'rgba(15, 46, 39, 0.65)',
                  borderColor: playingTrackId === selectedAfterTrack.id ? '#34D399' : 'rgba(255,255,255,0.08)',
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(52, 211, 153, 0.2)', color: '#34D399' }}>
                    {playingTrackId === selectedAfterTrack.id ? <Square size={12} /> : <Volume2 size={14} />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-white truncate">
                      {currentPrayerCfg.after.mode === 'notification_only' ? 'فقط اعلان (بدون صدا)' : selectedAfterTrack.titleFa}
                    </div>
                    <div className="text-[10px] text-emerald-100/60 truncate">
                      {currentPrayerCfg.after.mode === 'notification_only'
                        ? 'نوتیفیکیشن بی‌صدا'
                        : `${selectedAfterTrack.subtitleFa} · سرعت ${toFaDigits(currentPrayerCfg.after.speed || 1)}x`}
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => editingSlot === 'after' ? setEditingSlot(null) : openEditorForSlot('after')}
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-black transition-colors shrink-0"
                style={{ color: editingSlot === 'after' ? '#34D399' : 'rgba(236, 253, 245, 0.7)' }}
              >
                تغییر ‹
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* مودال انتخاب با ثبت خودکار لحظه‌ای پشت دست کاربر */}
      {editingSlot && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: 'rgba(2, 12, 10, 0.84)', backdropFilter: 'blur(8px)' }}
          onClick={() => { stopLocalAudio(); setEditingSlot(null); }}
        >
          <div
            className="w-full max-w-md rounded-3xl p-4 border space-y-3.5 shadow-2xl max-h-[86vh] flex flex-col"
            style={{ background: 'linear-gradient(165deg, #0A2922 0%, #051612 100%)', borderColor: 'rgba(251, 191, 36, 0.45)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <div>
                <h4 className="text-xs font-black text-amber-300">
                  {editingSlot === 'before' ? `تنظیم تواشیح قبل از ${currentMeta.adhanTitleFa}` : `تنظیم سوره و تعقیبات بعد از ${currentMeta.adhanTitleFa}`}
                </h4>
                <p className="text-[10px] text-emerald-100/65 mt-0.5">هر تغییری بدهید در همان لحظه خودکار ذخیره و کوک می‌شود</p>
              </div>
              <button
                type="button"
                onClick={() => { stopLocalAudio(); setEditingSlot(null); }}
                className="w-7 h-7 rounded-xl border flex items-center justify-center text-xs text-white/80 border-white/20 bg-white/5"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setDraftMode('audio');
                  applySlotPatchInstantly(editingSlot, { enabled: true, mode: 'audio', trackId: draftTrackId, speed: draftSpeed });
                }}
                className="p-3 rounded-2xl border flex items-center justify-between transition-all text-right"
                style={{
                  background: draftMode === 'audio' ? 'rgba(42, 39, 18, 0.75)' : 'rgba(255,255,255,0.03)',
                  borderColor: draftMode === 'audio' ? '#FBBF24' : 'rgba(255,255,255,0.1)',
                }}
              >
                <div>
                  <div className="text-xs font-black" style={{ color: draftMode === 'audio' ? '#FBBF24' : '#FFFFFF' }}>پخش تواشیح</div>
                  <div className="text-[10px] opacity-65 text-white mt-0.5">صدای کامل نوا</div>
                </div>
                <Volume2 size={16} className={draftMode === 'audio' ? 'text-amber-300' : 'text-gray-400'} />
              </button>

              <button
                type="button"
                onClick={() => {
                  stopLocalAudio();
                  setDraftMode('notification_only');
                  applySlotPatchInstantly(editingSlot, { enabled: true, mode: 'notification_only', trackId: draftTrackId, speed: draftSpeed });
                }}
                className="p-3 rounded-2xl border flex items-center justify-between transition-all text-right"
                style={{
                  background: draftMode === 'notification_only' ? 'rgba(42, 39, 18, 0.75)' : 'rgba(255,255,255,0.03)',
                  borderColor: draftMode === 'notification_only' ? '#FBBF24' : 'rgba(255,255,255,0.1)',
                }}
              >
                <div>
                  <div className="text-xs font-black" style={{ color: draftMode === 'notification_only' ? '#FBBF24' : '#FFFFFF' }}>فقط اعلان</div>
                  <div className="text-[10px] opacity-65 text-white mt-0.5">بدون صدا</div>
                </div>
                <Bell size={16} className={draftMode === 'notification_only' ? 'text-amber-300' : 'text-gray-400'} />
              </button>
            </div>

            {draftMode === 'audio' && (
              <>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-black text-white">انتخاب نوا یا سوره مبارکه</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-emerald-200/70 ml-1">سرعت:</span>
                    {SPEED_OPTIONS.map((sp) => (
                      <button
                        key={sp}
                        type="button"
                        onClick={() => {
                          // AUTO_SAVE_ON_SPEED_CLICK
                          setDraftSpeed(sp);
                          setAlarmPlaybackSpeed(sp);
                          if (audioRef.current) { audioRef.current.playbackRate = sp; }
                          applySlotPatchInstantly(editingSlot, { enabled: true, mode: draftMode, trackId: draftTrackId, speed: sp });
                        }}
                        className="px-2 py-0.5 rounded-lg text-[10px] font-black border"
                        style={{
                          background: draftSpeed === sp ? '#FBBF24' : 'rgba(255,255,255,0.05)',
                          borderColor: draftSpeed === sp ? '#FBBF24' : 'rgba(255,255,255,0.12)',
                          color: draftSpeed === sp ? '#041511' : '#D1FAE5',
                        }}
                      >
                        {toFaDigits(sp)}x
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
                  {editorTracks.map((tr) => {
                    const isSelected = draftTrackId === tr.id;
                    const isPlaying = playingTrackId === tr.id;
                    return (
                      <div
                        key={tr.id}
                        onClick={() => {
                          // AUTO_SAVE_ON_TRACK_CLICK
                          setDraftTrackId(tr.id);
                          applySlotPatchInstantly(editingSlot, { enabled: true, mode: draftMode, trackId: tr.id, speed: draftSpeed });
                        }}
                        role="button"
                        tabIndex={0}
                        className="rounded-2xl p-3 border flex items-center justify-between gap-3 cursor-pointer transition-all"
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
                              setDraftTrackId(tr.id);
                              applySlotPatchInstantly(editingSlot, { enabled: true, mode: draftMode, trackId: tr.id, speed: draftSpeed });
                              togglePlayTrack(tr, draftSpeed);
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

                        <div className="w-5 h-5 rounded-full border flex items-center justify-center shrink-0" style={{ background: isSelected ? '#FBBF24' : 'transparent', borderColor: isSelected ? '#FBBF24' : 'rgba(255,255,255,0.25)' }}>
                          {isSelected && <Check size={12} strokeWidth={3} className="text-black" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleSaveEditor}
                className="flex-1 py-3 rounded-2xl font-black text-xs shadow-lg"
                style={{ background: 'linear-gradient(135deg, #FBBF24 0%, #D97706 100%)', color: '#041511' }}
              >
                تأیید و بستن
              </button>
              <button
                type="button"
                onClick={handleTurnOffSlot}
                className="px-4 py-3 rounded-2xl font-black text-xs border text-gray-200 bg-white/5 border-white/20"
              >
                خاموش کن
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

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
            } else if (onToast) {
              onToast('این گزینه در اپلیکیشن اندروید تنظیمات باتری را باز می‌کند');
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
