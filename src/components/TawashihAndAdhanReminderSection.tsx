import { useState, useEffect, useRef } from 'react';
import { Bell, Volume2, Play, Square, Clock, Check, Copy } from 'lucide-react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { adhans, playAdhanPreview, stopAdhanPreview } from '@/lib/adhans';
import { setAlarmPlaybackSpeed, getAlarmPlaybackSpeed } from '@/lib/reminderService';

interface NativeAlarmBridge {
  scheduleNativeAlarm(opts: {
    id: number;
    triggerAtMillis: number;
    title: string;
    body: string;
    soundType?: string;
    adhanId?: string;
    durationSeconds?: number;
    volumePercent?: number;
    playbackRate?: number;
  }): Promise<void>;
  cancelNativeAlarm(opts: { id: number }): Promise<void>;
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
    id: 'rabbanaghfir',
    titleFa: 'ربنا',
    subtitleFa: 'استاد شجریان',
    durationFa: '۲:۴۲',
    audioFile: '/adhans/chant_rabbanaghfir.mp3',
    audioAdhanId: 'chant_rabbanaghfir',
  },
  {
    id: 'munajat_sahar',
    titleFa: 'مناجات سحر',
    subtitleFa: 'گروه تواشیح',
    durationFa: '۳:۱۰',
    audioFile: '/adhans/chant_aqim.mp3',
    audioAdhanId: 'chant_aqim',
  },
  {
    id: 'salawat_reza',
    titleFa: 'صلوات خاصه امام رضا (ع)',
    subtitleFa: 'گروه همخوانی',
    durationFa: '۲:۱۵',
    audioFile: '/adhans/chant_salawat.mp3',
    audioAdhanId: 'chant_salawat',
  },
  {
    id: 'tasbihat_pre',
    titleFa: 'تسبیحات قبل از اذان',
    subtitleFa: 'گروه تواشیح',
    durationFa: '۱:۵۸',
    audioFile: '/adhans/chant_tasbihat.mp3',
    audioAdhanId: 'chant_tasbihat',
  },
  {
    id: 'istighfar_pre',
    titleFa: 'استغفار و نیایش ملکوتی',
    subtitleFa: 'ابتهال و مناجات',
    durationFa: '۲:۲۰',
    audioFile: '/adhans/chant_istighfar.mp3',
    audioAdhanId: 'chant_istighfar',
  },
];

export const POST_ADHAN_TRACKS: TrackOption[] = [
  {
    id: 'dua_after_adhan',
    titleFa: 'دعای بعد از اذان',
    subtitleFa: 'قاری مهمان',
    durationFa: '۱:۴۸',
    audioFile: '/adhans/post_furqan.mp3',
    audioAdhanId: 'post_furqan',
  },
  {
    id: 'surah_waqiah',
    titleFa: 'تلاوت سوره مبارکه واقعه',
    subtitleFa: 'ترتیل مجلسی — وسعت رزق',
    durationFa: '۹:۴۵',
    audioFile: '/adhans/post_waqiah.mp3',
    audioAdhanId: 'post_waqiah',
  },
  {
    id: 'surah_yasin',
    titleFa: 'تلاوت سوره مبارکه یس',
    subtitleFa: 'ترتیل مجلسی — قلب قرآن',
    durationFa: '۱۲:۳۰',
    audioFile: '/adhans/post_yasin.mp3',
    audioAdhanId: 'post_yasin',
  },
  {
    id: 'surah_rahman',
    titleFa: 'تلاوت سوره مبارکه الرحمن',
    subtitleFa: 'ترتیل مجلسی — عروس قرآن',
    durationFa: '۸:۲۰',
    audioFile: '/adhans/post_rahman.mp3',
    audioAdhanId: 'post_rahman',
  },
  {
    id: 'surah_mulk',
    titleFa: 'تلاوت سوره مبارکه ملک',
    subtitleFa: 'ترتیل مجلسی — آرامش شبانگاهی',
    durationFa: '۶:۱۵',
    audioFile: '/adhans/post_mulk.mp3',
    audioAdhanId: 'post_mulk',
  },
  {
    id: 'ayat_kursi',
    titleFa: 'آیةالکرسی و تسبیحات حضرت زهرا (س)',
    subtitleFa: 'تعقیبات عامه نماز',
    durationFa: '۳:۱۲',
    audioFile: '/adhans/post_kursi.mp3',
    audioAdhanId: 'post_kursi',
  },
  {
    id: 'surah_saffat',
    titleFa: 'تلاوت آیات سوره مبارکه صافات',
    subtitleFa: 'ترتیل منتخب',
    durationFa: '۴:۱۰',
    audioFile: '/adhans/post_saffat.mp3',
    audioAdhanId: 'post_saffat',
  },
  {
    id: 'surah_dhariyat',
    titleFa: 'تلاوت آیات سوره مبارکه ذاریات',
    subtitleFa: 'ترتیل منتخب',
    durationFa: '۳:۴۰',
    audioFile: '/adhans/post_dhariyat.mp3',
    audioAdhanId: 'post_dhariyat',
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
    before: { enabled: true, minutesOffset: 10, mode: 'audio', trackId: 'munajat_sahar', speed: 1.0 },
    after: { enabled: true, minutesOffset: 5, mode: 'audio', trackId: 'dua_after_adhan', speed: 1.0 },
  },
  dhuhr: {
    before: { enabled: false, minutesOffset: 10, mode: 'audio', trackId: 'salawat_reza', speed: 1.0 },
    after: { enabled: false, minutesOffset: 5, mode: 'audio', trackId: 'ayat_kursi', speed: 1.0 },
  },
  asr: {
    before: { enabled: false, minutesOffset: 10, mode: 'audio', trackId: 'tasbihat_pre', speed: 1.0 },
    after: { enabled: false, minutesOffset: 5, mode: 'audio', trackId: 'istighfar_pre', speed: 1.0 },
  },
  maghrib: {
    before: { enabled: true, minutesOffset: 10, mode: 'audio', trackId: 'rabbanaghfir', speed: 1.0 },
    after: { enabled: true, minutesOffset: 30, mode: 'audio', trackId: 'surah_waqiah', speed: 1.0 },
  },
  isha: {
    before: { enabled: false, minutesOffset: 10, mode: 'audio', trackId: 'salawat_reza', speed: 1.0 },
    after: { enabled: false, minutesOffset: 15, mode: 'audio', trackId: 'surah_mulk', speed: 1.0 },
  },
};

export function loadTawashihConfig(): AllPrayersTawashihMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch {}
  return DEFAULT_CONFIG;
}

export function saveTawashihConfig(cfg: AllPrayersTawashihMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    window.dispatchEvent(new Event('noor-tawashih-config-changed'));
  } catch {}
}

function toFaDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
}

function addMinutesToTimeStr(timeStr: string, deltaMinutes: number): string {
  const parts = (timeStr || '04:49').split(':').map((n) => parseInt(n, 10));
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return timeStr;
  let total = parts[0] * 60 + parts[1] + deltaMinutes;
  while (total < 0) total += 1440;
  total = total % 1440;
  const hh = String(Math.floor(total / 60)).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

const PRAYER_META: { key: PrayerTabKey; labelFa: string; adhanTitleFa: string }[] = [
  { key: 'fajr', labelFa: 'صبح', adhanTitleFa: 'اذان صبح' },
  { key: 'dhuhr', labelFa: 'ظهر', adhanTitleFa: 'اذان ظهر' },
  { key: 'asr', labelFa: 'عصر', adhanTitleFa: 'اذان عصر' },
  { key: 'maghrib', labelFa: 'مغرب', adhanTitleFa: 'اذان مغرب' },
  { key: 'isha', labelFa: 'عشاء', adhanTitleFa: 'اذان عشاء' },
];

const OFFSET_OPTIONS = [5, 10, 15, 20, 30, 45];
const SPEED_OPTIONS = [1, 1.25, 1.5, 2];

interface Props {
  times: {
    fajr?: string;
    dhuhr?: string;
    asr?: string;
    maghrib?: string;
    isha?: string;
  } | null;
  cityNameFa: string;
  onToast?: (msg: string) => void;
}

export function TawashihAndAdhanReminderSection({ times, cityNameFa, onToast }: Props) {
  const [config, setConfig] = useState<AllPrayersTawashihMap>(() => loadTawashihConfig());
  const [activePrayer, setActivePrayer] = useState<PrayerTabKey>('fajr');
  const [editingSlot, setEditingSlot] = useState<'before' | 'after' | null>(null);

  // حالت‌های موقت داخل کشوی ویرایش («تغییر»)
  const [draftMode, setDraftMode] = useState<'audio' | 'notification_only'>('audio');
  const [draftTrackId, setDraftTrackId] = useState<string>('munajat_sahar');
  const [draftSpeed, setDraftSpeed] = useState<number>(() => getAlarmPlaybackSpeed());
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
    return () => {
      stopLocalAudio();
    };
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
    audio.volume = 1.0;
    audioRef.current = audio;
    setPlayingTrackId(track.id);

    audio.onplay = () => {
      audio.playbackRate = validSpeed;
    };
    audio.onended = () => {
      setPlayingTrackId(null);
    };
    audio.onerror = () => {
      setPlayingTrackId(null);
    };
    audio.play().catch(() => {
      setPlayingTrackId(null);
    });
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

  // همگام‌سازی آلارم‌های نیتیو اندروید برای قبل و بعد از اذان
  const syncNativeAlarms = async (nextCfg: AllPrayersTawashihMap) => {
    if (!Capacitor.isNativePlatform() || !times) return;
    const baseIds: Record<PrayerTabKey, { before: number; after: number }> = {
      fajr: { before: 72101, after: 72201 },
      dhuhr: { before: 72102, after: 72202 },
      asr: { before: 72103, after: 72203 },
      maghrib: { before: 72104, after: 72204 },
      isha: { before: 72105, after: 72205 },
    };

    for (const pMeta of PRAYER_META) {
      const pKey = pMeta.key;
      const baseTime = (times as any)[pKey] || '04:49';
      const pCfg = nextCfg[pKey];

      // ۱. قبل از اذان
      const beforeId = baseIds[pKey].before;
      if (!pCfg.before.enabled) {
        await NoorAlarm.cancelNativeAlarm({ id: beforeId }).catch(() => {});
      } else {
        const targetClock = addMinutesToTimeStr(baseTime, -pCfg.before.minutesOffset);
        const [hh, mm] = targetClock.split(':').map((n) => parseInt(n, 10));
        if (!isNaN(hh) && !isNaN(mm)) {
          const targetDate = new Date();
          targetDate.setHours(hh, mm, 0, 0);
          if (targetDate.getTime() <= Date.now()) targetDate.setDate(targetDate.getDate() + 1);
          const track = PRE_ADHAN_TRACKS.find((t) => t.id === pCfg.before.trackId) || PRE_ADHAN_TRACKS[0];

          await NoorAlarm.scheduleNativeAlarm({
            id: beforeId,
            triggerAtMillis: targetDate.getTime(),
            title: `🌙 ${toFaDigits(pCfg.before.minutesOffset)} دقیقه تا ${pMeta.adhanTitleFa} (${cityNameFa})`,
            body: `پخش ${track.titleFa} — ${track.subtitleFa}`,
            soundType: pCfg.before.mode === 'notification_only' ? 'silent' : 'surah_chant',
            adhanId: track.audioAdhanId,
            durationSeconds: 0,
            volumePercent: pCfg.before.mode === 'notification_only' ? 0 : 100,
            playbackRate: pCfg.before.speed || 1.0,
          }).catch(() => {});
        }
      }

      // ۲. بعد از اذان
      const afterId = baseIds[pKey].after;
      if (!pCfg.after.enabled) {
        await NoorAlarm.cancelNativeAlarm({ id: afterId }).catch(() => {});
      } else {
        const targetClock = addMinutesToTimeStr(baseTime, pCfg.after.minutesOffset);
        const [hh, mm] = targetClock.split(':').map((n) => parseInt(n, 10));
        if (!isNaN(hh) && !isNaN(mm)) {
          const targetDate = new Date();
          targetDate.setHours(hh, mm, 0, 0);
          if (targetDate.getTime() <= Date.now()) targetDate.setDate(targetDate.getDate() + 1);
          const track = POST_ADHAN_TRACKS.find((t) => t.id === pCfg.after.trackId) || POST_ADHAN_TRACKS[0];

          await NoorAlarm.scheduleNativeAlarm({
            id: afterId,
            triggerAtMillis: targetDate.getTime(),
            title: `📖 یادآور پس از ${pMeta.adhanTitleFa} — ${track.titleFa}`,
            body: `${track.subtitleFa} (سرعت ${toFaDigits(pCfg.after.speed || 1)}x)`,
            soundType: pCfg.after.mode === 'notification_only' ? 'silent' : 'surah_chant',
            adhanId: track.audioAdhanId,
            durationSeconds: 0,
            volumePercent: pCfg.after.mode === 'notification_only' ? 0 : 100,
            playbackRate: pCfg.after.speed || 1.0,
          }).catch(() => {});
        }
      }
    }
  };

  const updateAndSave = (nextCfg: AllPrayersTawashihMap, toastMessage?: string) => {
    setConfig(nextCfg);
    saveTawashihConfig(nextCfg);
    void syncNativeAlarms(nextCfg);
    if (toastMessage && onToast) onToast(toastMessage);
  };

  const currentPrayerCfg = config[activePrayer];
  const currentMeta = PRAYER_META.find((m) => m.key === activePrayer) || PRAYER_META[0];
  const rawPrayerTime = (times && (times as any)[activePrayer]) || '04:49';
  const beforeClock = addMinutesToTimeStr(rawPrayerTime, -currentPrayerCfg.before.minutesOffset);
  const afterClock = addMinutesToTimeStr(rawPrayerTime, currentPrayerCfg.after.minutesOffset);

  const selectedBeforeTrack =
    PRE_ADHAN_TRACKS.find((t) => t.id === currentPrayerCfg.before.trackId) || PRE_ADHAN_TRACKS[1];
  const selectedAfterTrack =
    POST_ADHAN_TRACKS.find((t) => t.id === currentPrayerCfg.after.trackId) || POST_ADHAN_TRACKS[0];

  // شمارش تعداد فعال برای نماز انتخابی و کل نمازها
  const activeCountForCurrent =
    (currentPrayerCfg.before.enabled ? 1 : 0) + (currentPrayerCfg.after.enabled ? 1 : 0);

  const openEditorForSlot = (slot: 'before' | 'after') => {
    stopLocalAudio();
    const slotCfg = currentPrayerCfg[slot];
    setDraftMode(slotCfg.mode);
    setDraftTrackId(slotCfg.trackId);
    setDraftSpeed(slotCfg.speed || 1.0);
    setEditingSlot(slot);
  };

  const handleSaveEditor = () => {
    if (!editingSlot) return;
    stopLocalAudio();
    setAlarmPlaybackSpeed(draftSpeed);
    const nextCfg: AllPrayersTawashihMap = {
      ...config,
      [activePrayer]: {
        ...currentPrayerCfg,
        [editingSlot]: {
          ...currentPrayerCfg[editingSlot],
          enabled: true,
          mode: draftMode,
          trackId: draftTrackId,
          speed: draftSpeed,
        },
      },
    };
    const slotLabel = editingSlot === 'before' ? 'قبل از اذان' : 'بعد از اذان';
    updateAndSave(nextCfg, `✅ تنظیمات ${slotLabel} برای ${currentMeta.adhanTitleFa} ذخیره و فعال شد`);
    setEditingSlot(null);
  };

  const handleTurnOffSlot = () => {
    if (!editingSlot) return;
    stopLocalAudio();
    const nextCfg: AllPrayersTawashihMap = {
      ...config,
      [activePrayer]: {
        ...currentPrayerCfg,
        [editingSlot]: {
          ...currentPrayerCfg[editingSlot],
          enabled: false,
        },
      },
    };
    updateAndSave(nextCfg, '🔕 این یادآور غیرفعال شد');
    setEditingSlot(null);
  };

  const toggleSlotDirectly = (slot: 'before' | 'after') => {
    const nextEnabled = !currentPrayerCfg[slot].enabled;
    const nextCfg: AllPrayersTawashihMap = {
      ...config,
      [activePrayer]: {
        ...currentPrayerCfg,
        [slot]: {
          ...currentPrayerCfg[slot],
          enabled: nextEnabled,
        },
      },
    };
    const label = slot === 'before' ? 'تواشیح قبل از اذان' : 'یادآور بعد از اذان';
    updateAndSave(
      nextCfg,
      nextEnabled ? `🔔 ${label} (${currentMeta.labelFa}) فعال شد` : `🔕 ${label} (${currentMeta.labelFa}) خاموش شد`
    );
  };

  const updateOffsetMinutes = (slot: 'before' | 'after', mins: number) => {
    const nextCfg: AllPrayersTawashihMap = {
      ...config,
      [activePrayer]: {
        ...currentPrayerCfg,
        [slot]: {
          ...currentPrayerCfg[slot],
          minutesOffset: mins,
        },
      },
    };
    updateAndSave(nextCfg);
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
    updateAndSave(nextCfg, '✨ تنظیمات تواشیح و یادآور برای تمام ۵ نماز اعمال شد!');
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
      {/* ۱. هدر سکشن: آیکون موج در راست + عنوان و توضیح + بج تعداد فعال در چپ */}
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M2 10v3" />
              <path d="M6 6v11" />
              <path d="M10 3v18" />
              <path d="M14 8v7" />
              <path d="M18 5v13" />
              <path d="M22 10v3" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-black text-white">تواشیح و یادآور اذان</h3>
            <p className="text-[10px] text-emerald-100/60 mt-0.5">
              نوای معنوی یا اعلان، چند دقیقه قبل و بعد از هر اذان
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

      {/* ۲. نوار تب‌های ۵ نماز (صبح، ظهر، عصر، مغرب، عشاء) با نقطه‌های نشانگر قبل و بعد */}
      <div
        className="grid grid-cols-5 gap-1 p-1 rounded-2xl border"
        style={{
          background: 'rgba(4, 16, 14, 0.65)',
          borderColor: 'rgba(255, 255, 255, 0.07)',
        }}
      >
        {PRAYER_META.map((pm) => {
          const isSelected = activePrayer === pm.key;
          const pState = config[pm.key];
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
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: pState.before.enabled ? '#FBBF24' : 'rgba(255,255,255,0.15)',
                  }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: pState.after.enabled ? '#34D399' : 'rgba(255,255,255,0.15)',
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* ۳. تایم‌لاین ۳ مرحله‌ای (قبل از اذان -> اذان اصلی -> بعد از اذان) */}
      <div className="relative space-y-2.5">
        {/* ردیف اول: قبل از اذان */}
        <div className="flex items-stretch gap-2.5">
          {/* ستون آیکون تایم‌لاین در سمت راست */}
          <div className="flex flex-col items-center pt-2 shrink-0">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center border"
              style={{
                background: currentPrayerCfg.before.enabled ? 'rgba(251, 191, 36, 0.16)' : 'rgba(255,255,255,0.04)',
                borderColor: currentPrayerCfg.before.enabled ? '#FBBF24' : 'rgba(255,255,255,0.15)',
                color: currentPrayerCfg.before.enabled ? '#FBBF24' : 'rgba(255,255,255,0.4)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M6 8v8" />
                <path d="M10 5v14" />
                <path d="M14 9v6" />
                <path d="M18 7v10" />
              </svg>
            </div>
            <div className="w-0.5 flex-1 my-1" style={{ background: 'rgba(52, 211, 153, 0.25)' }} />
          </div>

          {/* کارت قبل از اذان */}
          <div
            className="flex-1 rounded-2xl p-3 border space-y-2.5 transition-all"
            style={{
              background: 'rgba(7, 24, 21, 0.78)',
              borderColor: currentPrayerCfg.before.enabled ? 'rgba(251, 191, 36, 0.35)' : 'rgba(255, 255, 255, 0.08)',
            }}
          >
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span
                  className="px-2 py-0.5 rounded-lg text-[10px] font-black"
                  style={{ background: 'rgba(251, 191, 36, 0.18)', color: '#FBBF24' }}
                >
                  قبل از اذان
                </span>
                <div
                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold"
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)', color: '#D1FAE5' }}
                >
                  <Clock size={11} className=" opacity-75" />
                  <select
                    aria-label="دقیقه قبل از اذان"
                    value={currentPrayerCfg.before.minutesOffset}
                    onChange={(e) => updateOffsetMinutes('before', Number(e.target.value))}
                    className="bg-transparent text-[10px] font-bold outline-none cursor-pointer"
                  >
                    {OFFSET_OPTIONS.map((m) => (
                      <option key={m} value={m} className="bg-slate-900 text-white">
                        {toFaDigits(m)} دقیقه قبل
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <strong className="text-xs font-black tracking-wider text-white">
                  {toFaDigits(beforeClock)}
                </strong>
                {/* سوییچ طلایی */}
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
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(251, 191, 36, 0.2)', color: '#FBBF24' }}
                  >
                    {playingTrackId === selectedBeforeTrack.id ? <Square size={12} /> : <Volume2 size={14} />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-white truncate">
                      {currentPrayerCfg.before.mode === 'notification_only'
                        ? 'فقط اعلان (بدون صدا)'
                        : selectedBeforeTrack.titleFa}
                    </div>
                    <div className="text-[10px] text-emerald-100/60 truncate">
                      {currentPrayerCfg.before.mode === 'notification_only'
                        ? 'نوتیفیکیشن بی‌صدا'
                        : `${selectedBeforeTrack.subtitleFa} · ${selectedBeforeTrack.durationFa}`}
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  editingSlot === 'before' ? setEditingSlot(null) : openEditorForSlot('before')
                }
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-black transition-colors shrink-0"
                style={{
                  color: editingSlot === 'before' ? '#FBBF24' : 'rgba(236, 253, 245, 0.7)',
                  background: editingSlot === 'before' ? 'rgba(251, 191, 36, 0.15)' : 'transparent',
                }}
              >
                تغییر ‹
              </button>
            </div>
          </div>
        </div>

        {/* ردیف دوم: اذان اصلی در مرکز تایم‌لاین */}
        <div className="flex items-center gap-2.5">
          <div className="flex flex-col items-center shrink-0">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
                color: '#041511',
                boxShadow: '0 0 14px rgba(52, 211, 153, 0.45)',
              }}
            >
              <Bell size={15} strokeWidth={2.5} />
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
              <strong className="text-sm font-black tracking-wider" style={{ color: '#38BDF8' }}>
                {toFaDigits(rawPrayerTime)}
              </strong>
              <button
                type="button"
                onClick={togglePlayMainAdhan}
                title="پخش پیش‌نمایش اذان"
                className="w-7 h-7 rounded-full border flex items-center justify-center transition-transform active:scale-90"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  borderColor: 'rgba(255,255,255,0.18)',
                  color: '#ECFDF5',
                }}
              >
                {playingTrackId === 'main_adhan_preview' ? <Square size={11} /> : <Volume2 size={13} />}
              </button>
            </div>
          </div>
        </div>

        {/* ردیف سوم: بعد از اذان */}
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M6 8v8" />
                <path d="M10 5v14" />
                <path d="M14 9v6" />
                <path d="M18 7v10" />
              </svg>
            </div>
          </div>

          {/* کارت بعد از اذان */}
          <div
            className="flex-1 rounded-2xl p-3 border space-y-2.5 transition-all"
            style={{
              background: 'rgba(7, 24, 21, 0.78)',
              borderColor: currentPrayerCfg.after.enabled ? 'rgba(52, 211, 153, 0.35)' : 'rgba(255, 255, 255, 0.08)',
            }}
          >
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span
                  className="px-2 py-0.5 rounded-lg text-[10px] font-black"
                  style={{ background: 'rgba(52, 211, 153, 0.18)', color: '#34D399' }}
                >
                  بعد از اذان
                </span>
                <div
                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold"
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)', color: '#D1FAE5' }}
                >
                  <Clock size={11} className="opacity-75" />
                  <select
                    aria-label="دقیقه بعد از اذان"
                    value={currentPrayerCfg.after.minutesOffset}
                    onChange={(e) => updateOffsetMinutes('after', Number(e.target.value))}
                    className="bg-transparent text-[10px] font-bold outline-none cursor-pointer"
                  >
                    {OFFSET_OPTIONS.map((m) => (
                      <option key={m} value={m} className="bg-slate-900 text-white">
                        {toFaDigits(m)} دقیقه بعد
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <strong className="text-xs font-black tracking-wider text-white">
                  {toFaDigits(afterClock)}
                </strong>
                {/* سوییچ سبز */}
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
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(52, 211, 153, 0.2)', color: '#34D399' }}
                  >
                    {playingTrackId === selectedAfterTrack.id ? <Square size={12} /> : <Volume2 size={14} />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-white truncate">
                      {currentPrayerCfg.after.mode === 'notification_only'
                        ? 'فقط اعلان (بدون صدا)'
                        : selectedAfterTrack.titleFa}
                    </div>
                    <div className="text-[10px] text-emerald-100/60 truncate">
                      {currentPrayerCfg.after.mode === 'notification_only'
                        ? 'نوتیفیکیشن بی‌صدا'
                        : `${selectedAfterTrack.subtitleFa} · ${selectedAfterTrack.durationFa} (سرعت ${toFaDigits(currentPrayerCfg.after.speed || 1)}x)`}
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  editingSlot === 'after' ? setEditingSlot(null) : openEditorForSlot('after')
                }
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-black transition-colors shrink-0"
                style={{
                  color: editingSlot === 'after' ? '#FBBF24' : 'rgba(236, 253, 245, 0.7)',
                  background: editingSlot === 'after' ? 'rgba(251, 191, 36, 0.15)' : 'transparent',
                }}
              >
                تغییر ‹
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ۴. پنل کشویی انتخاب تواشیح / سوره و نوع اعلان (دقیقاً مطابق عکس دوم هنگام زدن روی «تغییر») */}
      {editingSlot && (
        <div
          className="rounded-3xl p-4 border space-y-3.5 mt-2 shadow-2xl"
          style={{
            background: 'rgba(5, 19, 16, 0.96)',
            borderColor: 'rgba(251, 191, 36, 0.4)',
          }}
        >
          {/* دو کارت انتخاب حالت: پخش تواشیح (صدای کامل نوا) یا فقط اعلان (بدون صدا) */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setDraftMode('audio')}
              className="p-3 rounded-2xl border flex items-center justify-between transition-all text-right"
              style={{
                background: draftMode === 'audio' ? 'rgba(42, 39, 18, 0.75)' : 'rgba(255,255,255,0.03)',
                borderColor: draftMode === 'audio' ? '#FBBF24' : 'rgba(255,255,255,0.1)',
              }}
            >
              <div>
                <div className="text-xs font-black" style={{ color: draftMode === 'audio' ? '#FBBF24' : '#FFFFFF' }}>
                  پخش تواشیح
                </div>
                <div className="text-[10px] opacity-65 text-white mt-0.5">صدای کامل نوا</div>
              </div>
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{
                  background: draftMode === 'audio' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255,255,255,0.06)',
                  color: draftMode === 'audio' ? '#FBBF24' : '#9CA3AF',
                }}
              >
                <Volume2 size={16} />
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                stopLocalAudio();
                setDraftMode('notification_only');
              }}
              className="p-3 rounded-2xl border flex items-center justify-between transition-all text-right"
              style={{
                background: draftMode === 'notification_only' ? 'rgba(42, 39, 18, 0.75)' : 'rgba(255,255,255,0.03)',
                borderColor: draftMode === 'notification_only' ? '#FBBF24' : 'rgba(255,255,255,0.1)',
              }}
            >
              <div>
                <div className="text-xs font-black" style={{ color: draftMode === 'notification_only' ? '#FBBF24' : '#FFFFFF' }}>
                  فقط اعلان
                </div>
                <div className="text-[10px] opacity-65 text-white mt-0.5">بدون صدا</div>
              </div>
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{
                  background: draftMode === 'notification_only' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255,255,255,0.06)',
                  color: draftMode === 'notification_only' ? '#FBBF24' : '#9CA3AF',
                }}
              >
                <Bell size={16} />
              </div>
            </button>
          </div>

          {draftMode === 'audio' && (
            <>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-black text-white">
                  {editingSlot === 'before' ? 'انتخاب تواشیح و مناجات' : 'انتخاب سوره، دعا یا تواشیح'}
                </span>
                {/* انتخابگر سرعت پخش */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-emerald-200/70 ml-1">سرعت:</span>
                  {SPEED_OPTIONS.map((sp) => (
                    <button
                      key={sp}
                      type="button"
                      onClick={() => setDraftSpeed(sp)}
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

              {/* فهرست کارت‌های تواشیح / سوره با دکمه پخش تست و رادیوباتن طلایی */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
                {editorTracks.map((tr) => {
                  const isSelected = draftTrackId === tr.id;
                  const isPlaying = playingTrackId === tr.id;
                  return (
                    <div
                      key={tr.id}
                      onClick={() => setDraftTrackId(tr.id)}
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
                            togglePlayTrack(tr, draftSpeed);
                          }}
                          aria-label={`پخش ${tr.titleFa}`}
                          className="w-8 h-8 rounded-full border flex items-center justify-center shrink-0 transition-transform active:scale-90"
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
                          <div className="text-[10px] text-emerald-100/60 truncate mt-0.5">
                            {tr.subtitleFa} · {tr.durationFa}
                          </div>
                        </div>
                      </div>

                      {/* دایره چک‌مارک طلایی در سمت چپ مطابق طرح */}
                      <div
                        className="w-5 h-5 rounded-full border flex items-center justify-center shrink-0"
                        style={{
                          background: isSelected ? '#FBBF24' : 'transparent',
                          borderColor: isSelected ? '#FBBF24' : 'rgba(255,255,255,0.25)',
                          color: '#041511',
                        }}
                      >
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* دکمه‌های پایین کشو: ذخیره و فعال‌سازی (زرد بزرگ) + خاموش کن */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleSaveEditor}
              className="flex-1 py-3 rounded-2xl font-black text-xs shadow-lg transition-transform active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #FBBF24 0%, #D97706 100%)',
                color: '#041511',
              }}
            >
              ذخیره و فعال‌سازی
            </button>
            <button
              type="button"
              onClick={handleTurnOffSlot}
              className="px-4 py-3 rounded-2xl font-black text-xs border transition-transform active:scale-95"
              style={{
                background: 'rgba(255,255,255,0.04)',
                borderColor: 'rgba(255,255,255,0.14)',
                color: '#E5E7EB',
              }}
            >
              خاموش کن
            </button>
          </div>
        </div>
      )}

      {/* ۵. دکمه «اعمال همین تنظیم برای همه نمازها» در پایین سکشن */}
      <button
        type="button"
        onClick={applyCurrentToAllPrayers}
        className="w-full py-2.5 rounded-2xl border text-[11px] font-black flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          borderColor: 'rgba(255, 255, 255, 0.08)',
          color: 'rgba(236, 253, 245, 0.78)',
        }}
      >
        <Copy size={13} />
        <span>اعمال همین تنظیم برای همه نمازها</span>
      </button>
    </div>
  );
}
