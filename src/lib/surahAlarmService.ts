import { Capacitor, registerPlugin } from '@capacitor/core';
import { calculatePrayerTimes } from '@/lib/prayerTimes';
import { getCityById, getGuestCityId } from '@/lib/cities';
import { addMinutesToTimeStr } from '@/lib/deenIntelligenceStore';
import { toFaDigits } from '@/lib/jalali';

interface SurahNativeAlarmBridge {
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
  downloadAdhanAudio(opts: {
    adhanId: string;
    audioUrl: string;
    fallbackUrl?: string;
  }): Promise<{ downloaded: boolean }>;
  requestNotificationPermission(): Promise<{ granted: boolean }>;
}

const NoorAlarm = registerPlugin<SurahNativeAlarmBridge>('NoorAlarm');

export type SurahAlarmAnchor = 'maghrib' | 'fajr' | 'dhuhr' | 'custom';

export interface SurahAlarmRecord {
  surahNumber: number;
  surahNameFa: string;
  virtueFa: string;
  anchor: SurahAlarmAnchor;
  offsetMinutes: number;
  customTime: string;
  speed: number;
  enabled: boolean;
  resolvedClock: string;
  updatedAt: string;
}

const SURAH_ALARMS_KEY = 'noor_surah_native_alarms_v1';
const SURAH_ALARM_BASE_ID = 73000;
const SURAH_TEST_ALARM_ID = 73999;

export interface SurahAudioDescriptor {
  adhanId: string;
  bundledPath?: string;
  remoteUrl: string;
  fallbackUrl: string;
}

export const SURAH_NATIVE_AUDIO_MAP: Record<number, SurahAudioDescriptor> = {
  56: {
    adhanId: 'post_waqiah',
    bundledPath: '/adhans/post_waqiah.mp3',
    remoteUrl: 'https://server8.mp3quran.net/afs/056.mp3',
    fallbackUrl: 'https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/056.mp3',
  },
  36: {
    adhanId: 'post_yasin',
    bundledPath: '/adhans/post_yasin.mp3',
    remoteUrl: 'https://server8.mp3quran.net/afs/036.mp3',
    fallbackUrl: 'https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/036.mp3',
  },
  67: {
    adhanId: 'post_mulk',
    bundledPath: '/adhans/post_mulk.mp3',
    remoteUrl: 'https://server8.mp3quran.net/afs/067.mp3',
    fallbackUrl: 'https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/067.mp3',
  },
  55: {
    adhanId: 'post_rahman',
    bundledPath: '/adhans/post_rahman.mp3',
    remoteUrl: 'https://server8.mp3quran.net/afs/055.mp3',
    fallbackUrl: 'https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/055.mp3',
  },
  51: {
    adhanId: 'post_dhariyat',
    bundledPath: '/adhans/post_dhariyat.mp3',
    remoteUrl: 'https://server8.mp3quran.net/afs/051.mp3',
    fallbackUrl: 'https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/051.mp3',
  },
  37: {
    adhanId: 'post_saffat',
    bundledPath: '/adhans/post_saffat.mp3',
    remoteUrl: 'https://server8.mp3quran.net/afs/037.mp3',
    fallbackUrl: 'https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/037.mp3',
  },
  62: {
    adhanId: 'surah_062',
    remoteUrl: 'https://server8.mp3quran.net/afs/062.mp3',
    fallbackUrl: 'https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/062.mp3',
  },
  97: {
    adhanId: 'surah_097',
    remoteUrl: 'https://server8.mp3quran.net/afs/097.mp3',
    fallbackUrl: 'https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/097.mp3',
  },
  112: {
    adhanId: 'surah_112',
    remoteUrl: 'https://server8.mp3quran.net/afs/112.mp3',
    fallbackUrl: 'https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/112.mp3',
  },
};

export function getSurahAudioDescriptor(surahNumber: number): SurahAudioDescriptor {
  if (SURAH_NATIVE_AUDIO_MAP[surahNumber]) {
    return SURAH_NATIVE_AUDIO_MAP[surahNumber];
  }
  const pad = String(surahNumber).padStart(3, '0');
  return {
    adhanId: 'surah_' + pad,
    remoteUrl: 'https://server8.mp3quran.net/afs/' + pad + '.mp3',
    fallbackUrl: 'https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/' + pad + '.mp3',
  };
}

export function getSurahAlarmNativeId(surahNumber: number): number {
  return SURAH_ALARM_BASE_ID + surahNumber;
}

export function loadSurahAlarms(): Record<number, SurahAlarmRecord> {
  try {
    const raw = localStorage.getItem(SURAH_ALARMS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveSurahAlarms(map: Record<number, SurahAlarmRecord>): void {
  try {
    localStorage.setItem(SURAH_ALARMS_KEY, JSON.stringify(map));
  } catch {}
}

export function computeSurahClock(
  anchor: SurahAlarmAnchor,
  offsetMinutes: number,
  customTime: string
): { clock: string; descFa: string } {
  if (anchor === 'custom') {
    const safe = /^d{1,2}:d{2}$/.test(customTime) ? customTime : '21:00';
    return { clock: safe, descFa: 'ساعت ' + toFaDigits(safe) };
  }
  const city = getCityById(getGuestCityId());
  const pTimes = calculatePrayerTimes(new Date(), city.lat, city.lng, city.timezone, 'tehran');
  const base =
    anchor === 'fajr' ? pTimes.fajr : anchor === 'dhuhr' ? pTimes.dhuhr : pTimes.maghrib;
  const label = anchor === 'fajr' ? 'اذان صبح' : anchor === 'dhuhr' ? 'اذان ظهر' : 'اذان مغرب';
  const clock = addMinutesToTimeStr(base, offsetMinutes);
  return {
    clock,
    descFa: toFaDigits(offsetMinutes) + ' دقیقه بعد از ' + label + ' (' + toFaDigits(clock) + ')',
  };
}

function clockToNextTriggerMillis(clock: string): number {
  const [hh, mm] = clock.split(':').map((n) => parseInt(n, 10));
  const target = new Date();
  target.setHours(Number.isFinite(hh) ? hh : 21, Number.isFinite(mm) ? mm : 0, 0, 0);
  if (target.getTime() <= Date.now() + 1500) {
    target.setDate(target.getDate() + 1);
  }
  return target.getTime();
}

async function ensureNativeSurahAudioCached(desc: SurahAudioDescriptor): Promise<void> {
  if (!Capacitor.isNativePlatform() || desc.bundledPath) return;
  try {
    await NoorAlarm.downloadAdhanAudio({
      adhanId: desc.adhanId,
      audioUrl: desc.remoteUrl,
      fallbackUrl: desc.fallbackUrl,
    });
  } catch {}
}

export async function scheduleSurahNativeAlarm(input: {
  surahNumber: number;
  surahNameFa: string;
  virtueFa: string;
  anchor: SurahAlarmAnchor;
  offsetMinutes: number;
  customTime: string;
  speed: number;
}): Promise<{ record: SurahAlarmRecord; descFa: string }> {
  const { clock, descFa } = computeSurahClock(input.anchor, input.offsetMinutes, input.customTime);
  const safeSpeed = Number.isFinite(input.speed) && input.speed >= 0.5 && input.speed <= 3.0 ? input.speed : 1.0;

  const record: SurahAlarmRecord = {
    surahNumber: input.surahNumber,
    surahNameFa: input.surahNameFa,
    virtueFa: input.virtueFa,
    anchor: input.anchor,
    offsetMinutes: input.offsetMinutes,
    customTime: input.customTime,
    speed: safeSpeed,
    enabled: true,
    resolvedClock: clock,
    updatedAt: new Date().toISOString(),
  };

  const all = loadSurahAlarms();
  all[input.surahNumber] = record;
  saveSurahAlarms(all);

  if (Capacitor.isNativePlatform()) {
    const alarmId = getSurahAlarmNativeId(input.surahNumber);
    const desc = getSurahAudioDescriptor(input.surahNumber);
    await NoorAlarm.requestNotificationPermission().catch(() => {});
    void ensureNativeSurahAudioCached(desc);
    await NoorAlarm.cancelNativeAlarm({ id: alarmId }).catch(() => {});
    await NoorAlarm.scheduleNativeAlarm({
      id: alarmId,
      triggerAtMillis: clockToNextTriggerMillis(clock),
      title: 'تلاوت ' + input.surahNameFa,
      body: input.virtueFa + ' · ' + descFa,
      soundType: 'surah_chant',
      adhanId: desc.adhanId,
      audioUrl: desc.bundledPath || desc.remoteUrl,
      durationSeconds: 0,
      volumePercent: 100,
      playbackRate: safeSpeed,
    }).catch(() => {});
  }

  return { record, descFa };
}

export async function cancelSurahNativeAlarm(surahNumber: number): Promise<void> {
  const all = loadSurahAlarms();
  if (all[surahNumber]) {
    all[surahNumber] = { ...all[surahNumber], enabled: false, updatedAt: new Date().toISOString() };
    saveSurahAlarms(all);
  }
  if (Capacitor.isNativePlatform()) {
    await NoorAlarm.cancelNativeAlarm({ id: getSurahAlarmNativeId(surahNumber) }).catch(() => {});
  }
}

export async function triggerSurahAlarmTest10s(input: {
  surahNumber: number;
  surahNameFa: string;
  virtueFa: string;
  speed: number;
}): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  const desc = getSurahAudioDescriptor(input.surahNumber);
  const safeSpeed = Number.isFinite(input.speed) && input.speed >= 0.5 && input.speed <= 3.0 ? input.speed : 1.0;

  await NoorAlarm.requestNotificationPermission().catch(() => {});
  await ensureNativeSurahAudioCached(desc);
  await NoorAlarm.cancelNativeAlarm({ id: SURAH_TEST_ALARM_ID }).catch(() => {});
  await NoorAlarm.scheduleNativeAlarm({
    id: SURAH_TEST_ALARM_ID,
    triggerAtMillis: Date.now() + 10000,
    title: 'تلاوت ' + input.surahNameFa,
    body: input.virtueFa,
    soundType: 'surah_chant',
    adhanId: desc.adhanId,
    audioUrl: desc.bundledPath || desc.remoteUrl,
    durationSeconds: 0,
    volumePercent: 100,
    playbackRate: safeSpeed,
  });
  return true;
}

export async function syncAllSurahNativeAlarms(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const all = loadSurahAlarms();
  for (const key of Object.keys(all)) {
    const rec = all[Number(key)];
    if (!rec) continue;
    const alarmId = getSurahAlarmNativeId(rec.surahNumber);
    await NoorAlarm.cancelNativeAlarm({ id: alarmId }).catch(() => {});
    if (!rec.enabled) continue;

    const { clock, descFa } = computeSurahClock(rec.anchor, rec.offsetMinutes, rec.customTime);
    const desc = getSurahAudioDescriptor(rec.surahNumber);
    rec.resolvedClock = clock;
    void ensureNativeSurahAudioCached(desc);

    await NoorAlarm.scheduleNativeAlarm({
      id: alarmId,
      triggerAtMillis: clockToNextTriggerMillis(clock),
      title: 'تلاوت ' + rec.surahNameFa,
      body: rec.virtueFa + ' · ' + descFa,
      soundType: 'surah_chant',
      adhanId: desc.adhanId,
      audioUrl: desc.bundledPath || desc.remoteUrl,
      durationSeconds: 0,
      volumePercent: 100,
      playbackRate: rec.speed || 1.0,
    }).catch(() => {});
  }
  saveSurahAlarms(all);
}
