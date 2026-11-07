import { getAlarmPlaybackSpeed, setAlarmPlaybackSpeed } from '@/lib/reminderService';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plane, BellRing, X, Check, Square, Play, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import {
  loadMosqueAndTravel,
  saveMosqueAndTravel,
  PRE_ADHAN_CHANT_OPTIONS,
  POST_ADHAN_OPTIONS,
  addMinutesToTimeStr,
  type PreAdhanChantId,
  type PreAdhanChantOption,
  type PostAdhanItemOption,
  type PrayerKey,
} from '@/lib/deenIntelligenceStore';
import { CITIES, getCityById, getGuestCityId, setGuestCityId, clearCustomGpsCoords, getCustomGpsCoords } from '@/lib/cities';
import { calculateHaversineMeters } from '@/lib/neshanMosqueService';
import { calculatePrayerTimes } from '@/lib/prayerTimes';
import { scheduleReminder, deleteReminder, loadReminders, NoorAlarm, type LocalReminder } from '@/lib/reminderService';
import { saveReminder } from '@/lib/reminderStorage';
import { stopAdhanPreview } from '@/lib/adhans';
import { Capacitor } from '@capacitor/core';
import { toFaDigits } from '@/lib/jalali';

interface Props {
  initialSection?: 'studio' | 'post_adhan' | 'travel' | 'mosque';
  onClose: () => void;
  onChanged?: () => void;
}

const PRAYER_LABELS: Array<{ key: PrayerKey; nameFa: string }> = [
  { key: 'fajr', nameFa: 'نماز صبح' },
  { key: 'dhuhr', nameFa: 'نماز ظهر' },
  { key: 'asr', nameFa: 'نماز عصر' },
  { key: 'maghrib', nameFa: 'نماز مغرب' },
  { key: 'isha', nameFa: 'نماز عشاء' },
];

export function AdhanStudioAndTravelModal({ initialSection = 'studio', onClose, onChanged }: Props) {
  const [alarmSpeed, setAlarmSpeed] = useState<number>(() => getAlarmPlaybackSpeed());
  const { theme } = useTheme();
  const [tab, setTab] = useState<'pre_adhan' | 'post_adhan' | 'travel'>(
    initialSection === 'travel'
      ? 'travel'
      : initialSection === 'post_adhan'
      ? 'post_adhan'
      : 'pre_adhan'
  );
  const [mt, setMt] = useState(() => loadMosqueAndTravel());
  const [selectedPrayer, setSelectedPrayer] = useState<PrayerKey>('maghrib');
  const [preMinutes, setPreMinutes] = useState<number>(10);
  const [selectedChantId, setSelectedChantId] = useState<PreAdhanChantId>('chant_salawat');

  const [postPrayer, setPostPrayer] = useState<PrayerKey>('maghrib');
  const [postMinutes, setPostMinutes] = useState<number>(20);
  const [selectedPostId, setSelectedPostId] = useState<string>('post_surah_waqiah');

  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [activeAlarms, setActiveAlarms] = useState<LocalReminder[]>(() => loadReminders());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const refreshAlarms = () => setActiveAlarms(loadReminders());

  const stopAllAudio = () => {
    if (Capacitor.getPlatform() === 'android') {
      void NoorAlarm.stopActiveAlarm().catch(() => {});
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    stopAdhanPreview();
    setPlayingAudioId(null);
  };

  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, []);

  const showNotice = (msg: string) => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(null), 4200);
  };

  const handlePlayPreview = async (id: string, primaryUrl: string, fallbackUrl: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (playingAudioId === id) {
      stopAllAudio();
      return;
    }
    stopAllAudio();
    setPlayingAudioId(id);

    try {
      const player = new Audio(primaryUrl);
      audioRef.current = player;
      player.onended = () => setPlayingAudioId(null);
      player.onerror = () => {
        const fb = new Audio(fallbackUrl);
        audioRef.current = fb;
        fb.onended = () => setPlayingAudioId(null);
        void fb.play().catch(() => setPlayingAudioId(null));
      };
      await player.play();
    } catch {
      try {
        const fb = new Audio(fallbackUrl);
        audioRef.current = fb;
        fb.onended = () => setPlayingAudioId(null);
        await fb.play();
      } catch {
        setPlayingAudioId(null);
      }
    }
  };

  const handleSavePreAdhanAlarm = async (enable: boolean, customChantId?: PreAdhanChantId) => {
    const targetChantId = customChantId ?? selectedChantId;
    const pNameFa = PRAYER_LABELS.find((x) => x.key === selectedPrayer)?.nameFa ?? 'نماز';
    const existingList = loadReminders().filter(
      (r) => r.id.startsWith('pre_adhan_' + selectedPrayer) || r.title.includes('تا اذان ' + pNameFa)
    );
    for (const oldRem of existingList) {
      await deleteReminder(oldRem.id);
    }

    if (!enable) {
      refreshAlarms();
      showNotice('اعلان پیش از اذان ' + pNameFa + ' حذف شد.');
      onChanged?.();
      return;
    }

    const city = getCityById(getGuestCityId());
    const exactGps = getCustomGpsCoords();
    const lat = exactGps ? exactGps.lat : city.lat;
    const lng = exactGps ? exactGps.lng : city.lng;
    const pTimes = calculatePrayerTimes(new Date(), lat, lng, city.timezone, 'tehran');
    const triggerTime = addMinutesToTimeStr(pTimes[selectedPrayer], -preMinutes);
    const chant: PreAdhanChantOption = PRE_ADHAN_CHANT_OPTIONS.find((c) => c.id === targetChantId) ?? PRE_ADHAN_CHANT_OPTIONS[0];

    const dynId = 'pre_adhan_' + selectedPrayer + '_' + preMinutes + '_' + chant.id;
    const nowIso = new Date().toISOString();
    const dynReminder: LocalReminder = {
      id: dynId,
      title: '🔔 ' + toFaDigits(preMinutes) + ' دقیقه مانده تا اذان ' + pNameFa + ' (' + chant.titleFa + ')',
      body: chant.arabicText + ' — ' + chant.translationFa,
      time: triggerTime,
      days: [0, 1, 2, 3, 4, 5, 6],
      enabled: true,
      dhikrId: null,
      type: 'recurring',
      date: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    saveReminder(dynReminder);
    await scheduleReminder(dynReminder, true);
    refreshAlarms();
    showNotice(
      '✅ اعلان قبل از اذان «' + chant.titleFa + '» برای ' + toFaDigits(preMinutes) + ' دقیقه قبل از ' + pNameFa + ' (ساعت ' + toFaDigits(triggerTime) + ') فعال شد!'
    );
    onChanged?.();
  };

  const handleSavePostAdhanAlarm = async (enable: boolean, customPostItemId?: string) => {
    const targetPostId = customPostItemId ?? selectedPostId;
    const pNameFa = PRAYER_LABELS.find((x) => x.key === postPrayer)?.nameFa ?? 'نماز';
    const postItem: PostAdhanItemOption =
      POST_ADHAN_OPTIONS.find((o) => o.id === targetPostId) ?? POST_ADHAN_OPTIONS[0];

    const existingForPrayer = loadReminders().filter((r) => r.id.startsWith('post_adhan_' + postPrayer));
    for (const oldRem of existingForPrayer) {
      await deleteReminder(oldRem.id);
    }

    if (!enable) {
      refreshAlarms();
      showNotice('اعلان پس از اذان ' + pNameFa + ' حذف شد.');
      onChanged?.();
      return;
    }

    const city = getCityById(getGuestCityId());
    const exactGps = getCustomGpsCoords();
    const lat = exactGps ? exactGps.lat : city.lat;
    const lng = exactGps ? exactGps.lng : city.lng;
    const pTimes = calculatePrayerTimes(new Date(), lat, lng, city.timezone, 'tehran');
    const triggerTime = addMinutesToTimeStr(pTimes[postPrayer], postMinutes);

    const dynId = 'post_adhan_' + postPrayer + '_' + postMinutes + '_' + postItem.id;
    const nowIso = new Date().toISOString();
    const postReminder: LocalReminder = {
      id: dynId,
      title: '📿 ' + toFaDigits(postMinutes) + ' دقیقه پس از اذان ' + pNameFa + ': ' + postItem.titleFa,
      body: postItem.arabicText + ' — ' + postItem.translationFa,
      time: triggerTime,
      days: [0, 1, 2, 3, 4, 5, 6],
      enabled: true,
      dhikrId: postItem.dhikrLibraryId,
      type: 'recurring',
      date: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    saveReminder(postReminder);
    await scheduleReminder(postReminder, true);
    refreshAlarms();
    showNotice(
      '✅ اعلان پس از اذان «' + postItem.titleFa + '» برای ' + toFaDigits(postMinutes) + ' دقیقه بعد از ' + pNameFa + ' (ساعت ' + toFaDigits(triggerTime) + ') فعال شد!'
    );
    onChanged?.();
  };

  const handleTestLockscreen = async (mode: 'pre' | 'post') => {
    if (mode === 'pre') {
      const pNameFa = PRAYER_LABELS.find((x) => x.key === selectedPrayer)?.nameFa ?? 'نماز مغرب';
      const chant = PRE_ADHAN_CHANT_OPTIONS.find((c) => c.id === selectedChantId) ?? PRE_ADHAN_CHANT_OPTIONS[0];
      showNotice('🔥 تست ۵ ثانیه‌ای قبل از اذان فعال شد! صفحه گوشی را قفل کنید یا ۵ ثانیه صبر کنید.');
      if (Capacitor.getPlatform() === 'android') {
        try {
          await NoorAlarm.scheduleNativeAlarm({
            id: 999902,
            triggerAtMillis: Date.now() + 5000,
            title: '🔔 ' + toFaDigits(preMinutes) + ' دقیقه مانده تا اذان ' + pNameFa,
            body: chant.arabicText + '\n\n' + chant.translationFa,
            soundType: 'short_10s',
            adhanId: chant.audioAdhanId,
            durationSeconds: chant.durationSec,
            volumePercent: 100,
          });
        } catch {}
      } else {
        setTimeout(() => void handlePlayPreview(chant.id, chant.audioUrl, chant.fallbackAudioUrl), 5000);
      }
    } else {
      const pNameFa = PRAYER_LABELS.find((x) => x.key === postPrayer)?.nameFa ?? 'نماز مغرب';
      const postItem = POST_ADHAN_OPTIONS.find((o) => o.id === selectedPostId) ?? POST_ADHAN_OPTIONS[0];
      showNotice('🔥 تست ۵ ثانیه‌ای پس از اذان («' + postItem.titleFa + '») فعال شد! ۵ ثانیه صبر کنید.');
      if (Capacitor.getPlatform() === 'android') {
        try {
          await NoorAlarm.scheduleNativeAlarm({
            id: 999903,
            triggerAtMillis: Date.now() + 5000,
            title: '📿 ' + toFaDigits(postMinutes) + ' دقیقه پس از اذان ' + pNameFa,
            body: postItem.arabicText + '\n\n' + postItem.translationFa,
            soundType: 'short_10s',
            adhanId: postItem.audioAdhanId,
            durationSeconds: postItem.durationSec,
            volumePercent: 100,
          });
        } catch {}
      } else {
        setTimeout(() => void handlePlayPreview(postItem.id, postItem.audioUrl, postItem.fallbackAudioUrl), 5000);
      }
    }
  };

  const handleSaveMosqueTravel = (nextMt: typeof mt) => {
    const originCity = getCityById(nextMt.originCityId);
    const destCity = getCityById(nextMt.destinationCityId);
    const distKm = Math.round(calculateHaversineMeters(originCity.lat, originCity.lng, destCity.lat, destCity.lng) / 1000);
    // اگر فاصله کمتر از مسافت شرعی (۲۲.۵ کیلومتر) باشد، نماز تمام است
    const effectiveQasr = distKm < 23 ? false : nextMt.isQasrPrayer;
    const updatedMt = { ...nextMt, isQasrPrayer: effectiveQasr };
    setMt(updatedMt);
    saveMosqueAndTravel(updatedMt);

    clearCustomGpsCoords();
    if (updatedMt.travelModeEnabled) {
      setGuestCityId(updatedMt.destinationCityId);
      showNotice(
        '✈️ حالت سفر به مقصد «' + destCity.nameFa + '» فعال شد! افق شرعی صفحه اول و حکم ' + (effectiveQasr ? 'نماز شکسته (۲ رکعتی)' : 'نماز تمام (۴ رکعتی)') + ' اعمال گردید.'
      );
    } else {
      setGuestCityId(updatedMt.originCityId);
      showNotice('🏠 حالت سفر غیرفعال شد و افق شرعی به شهر وطن («' + originCity.nameFa + '» — نماز تمام) بازگشت.');
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('noor-travel-mode-changed', { detail: updatedMt }));
    }
    onChanged?.();
  };

  const preAlarmsList = activeAlarms.filter((r) => r.id.startsWith('pre_adhan_'));
  const postAlarmsList = activeAlarms.filter((r) => r.id.startsWith('post_adhan_'));
  const originCityObj = getCityById(mt.originCityId);
  const destCityObj = getCityById(mt.destinationCityId);
  const travelDistanceKm = Math.round(
    calculateHaversineMeters(originCityObj.lat, originCityObj.lng, destCityObj.lat, destCityObj.lng) / 1000
  );
  const isSharaiDistance = travelDistanceKm >= 23;

  const node = (
    <div
      className="fixed inset-0 z-[999] overflow-y-auto flex items-stretch sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.86)', backdropFilter: 'blur(7px)' }}
      dir="rtl"
    >
      <div
        className="w-full sm:max-w-lg min-h-[100dvh] sm:min-h-0 sm:rounded-3xl p-4 sm:p-5 border-0 sm:border shadow-2xl overflow-y-auto"
        style={{ background: theme.surface, borderColor: theme.border }}
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-2">
            <BellRing color={theme.primary} size={19} />
            <h2 className="text-base font-black text-app">اعلان قبل از اذان، سوره پس از اذان و نماز مسافر</h2>
          </div>
          <button
            type="button"
            onClick={() => {
              stopAllAudio();
              onClose();
            }}
            className="text-muted p-1"
          >
            <X size={20} />
          </button>
        </div>

        {savedNotice && (
          <div
            className="mb-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-center shadow-lg leading-relaxed"
            style={{ background: theme.primary, color: theme.bg }}
          >
            {savedNotice}
          </div>
        )}

        {/* فقط ۳ تب کاربردی و سرراست (بدون تب زاید مسجد) */}
        <div
          className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl mb-4"
          style={{ background: 'color-mix(in srgb, ' + theme.primary + ' 10%, transparent)' }}
        >
          <button
            type="button"
            onClick={() => setTab('pre_adhan')}
            className="py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
            style={{
              background: tab === 'pre_adhan' ? theme.primary : 'transparent',
              color: tab === 'pre_adhan' ? theme.bg : theme.textMuted,
            }}
          >
            🔔 قبل از اذان
          </button>
          <button
            type="button"
            onClick={() => setTab('post_adhan')}
            className="py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
            style={{
              background: tab === 'post_adhan' ? theme.primary : 'transparent',
              color: tab === 'post_adhan' ? theme.bg : theme.textMuted,
            }}
          >
            📿 پس از اذان و سوره
          </button>
          <button
            type="button"
            onClick={() => setTab('travel')}
            className="py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
            style={{
              background: tab === 'travel' ? theme.primary : 'transparent',
              color: tab === 'travel' ? theme.bg : theme.textMuted,
            }}
          >
            ✈️ نماز شکسته (سفر)
          </button>
        </div>

        {tab === 'pre_adhan' && (
          <div className="space-y-3.5">
            {preAlarmsList.length > 0 && (
              <div className="card-flat p-3 space-y-2 border" style={{ borderColor: theme.primary }}>
                <p className="text-xs font-black text-primary">🔔 اعلان‌های فعال قبل از اذان شما:</p>
                {preAlarmsList.map((al) => (
                  <div key={al.id} className="flex items-center justify-between gap-2 p-2 rounded-xl border" style={{ borderColor: theme.border }}>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-app truncate">{al.title}</p>
                      <p className="text-[10px] text-accent font-bold mt-0.5" dir="ltr">⏰ ساعت امروز: {al.time}</p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteReminder(al.id);
                        refreshAlarms();
                        onChanged?.();
                      }}
                      className="p-1.5 text-red-400"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="card-flat p-3.5 space-y-3">
              <p className="text-xs font-black text-app">۱. انتخاب نماز و فاصله زمانی قبل از اذان:</p>
              <div className="grid grid-cols-5 gap-1">
                {PRAYER_LABELS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setSelectedPrayer(p.key)}
                    className="py-2 rounded-xl text-[11px] font-bold border transition-all"
                    style={{
                      borderColor: selectedPrayer === p.key ? theme.primary : theme.border,
                      background: selectedPrayer === p.key ? theme.primary : 'transparent',
                      color: selectedPrayer === p.key ? theme.bg : theme.textMuted,
                    }}
                  >
                    {p.nameFa.replace('نماز ', '')}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-5 gap-1">
                {[5, 10, 15, 20, 30].map((min) => (
                  <button
                    key={min}
                    type="button"
                    onClick={() => setPreMinutes(min)}
                    className="py-2 rounded-xl text-[11px] font-bold border transition-all"
                    style={{
                      borderColor: preMinutes === min ? theme.accent : theme.border,
                      background: preMinutes === min ? theme.accent : 'transparent',
                      color: preMinutes === min ? theme.bg : theme.textMuted,
                    }}
                  >
                    {toFaDigits(min)}د قبل
                  </button>
                ))}
              </div>

              {/* دکمه ثبت و تست در بالای لیست تا همیشه جلوی چشم کاربر باشد */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => void handleSavePreAdhanAlarm(true)}
                  className="py-2.5 rounded-2xl text-xs font-bold shadow-md"
                  style={{ background: theme.primary, color: theme.bg }}
                >
                  🔔 ثبت اعلان قبل از اذان
                </button>
                <button
                  type="button"
                  onClick={() => void handleTestLockscreen('pre')}
                  className="py-2.5 rounded-2xl text-xs font-bold shadow-md"
                  style={{ background: theme.accent, color: theme.bg }}
                >
                  📱 تست ۵ ثانیه‌ای
                </button>
              </div>

              <p className="text-xs font-black text-app pt-1">
                ۲. انتخاب ذکر یا تواشیح کوتاه قبل از اذان (با لمس هر کارت ثبت می‌شود):
              </p>
              <div className="space-y-2.5">
                {PRE_ADHAN_CHANT_OPTIONS.map((ch) => {
                  const active = selectedChantId === ch.id;
                  const isPlaying = playingAudioId === ch.id;
                  return (
                    <div
                      key={ch.id}
                      onClick={() => {
                        setSelectedChantId(ch.id);
                        void handleSavePreAdhanAlarm(true, ch.id);
                      }}
                      className="w-full p-3.5 rounded-2xl border text-right transition-all cursor-pointer"
                      style={{
                        borderColor: active ? theme.primary : theme.border,
                        background: active ? 'color-mix(in srgb, ' + theme.primary + ' 14%, transparent)' : theme.bg,
                      }}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-black text-app">{ch.titleFa}</span>
                        <button
                          type="button"
                          onClick={(e) => void handlePlayPreview(ch.id, ch.audioUrl, ch.fallbackAudioUrl, e)}
                          className="px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 shrink-0 shadow-sm"
                          style={{
                            background: isPlaying ? '#ef4444' : theme.accent,
                            color: isPlaying ? '#ffffff' : theme.bg,
                          }}
                        >
                          {isPlaying ? <Square size={10} /> : <Play size={10} />}
                          <span>{isPlaying ? '⏹️ توقف صوت' : '🎧 شنیدن ذکر'}</span>
                        </button>
                      </div>
                      <p className="text-sm text-primary font-bold leading-relaxed my-1">{ch.arabicText}</p>
                      <p className="text-[11px] text-muted leading-relaxed">{ch.translationFa}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab === 'post_adhan' && (
          <div className="space-y-3.5">
            <div className="p-3.5 rounded-2xl border space-y-2" style={{ borderColor: theme.border, background: theme.bg }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-app">⏩ سرعت پخش صوت اعلان و تلاوت سوره:</span>
                <span className="text-[11px] font-black text-primary" dir="ltr">{alarmSpeed}x</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5" dir="ltr">
                {[0.85, 1.0, 1.25, 1.5, 2.0].map((sp) => {
                  const active = alarmSpeed === sp;
                  return (
                    <button
                      key={sp}
                      type="button"
                      onClick={() => {
                        setAlarmPlaybackSpeed(sp);
                        setAlarmSpeed(sp);
                      }}
                      className="py-1.5 rounded-xl text-xs font-bold border transition-all"
                      style={{
                        borderColor: active ? theme.primary : theme.border,
                        background: active ? theme.primary : theme.surface,
                        color: active ? theme.bg : theme.text,
                      }}
                    >
                      {sp}x
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted leading-relaxed">
                ✨ تمام سوره‌ها و ادعیه انتخابی پس از اذان به طور کامل تا آخرین آیه و با سرعت انتخابی شما پخش می‌شوند.
              </p>
            </div>
            {postAlarmsList.length > 0 && (
              <div className="card-flat p-3 space-y-2 border" style={{ borderColor: theme.primary }}>
                <p className="text-xs font-black text-primary">📿 یادآورهای فعال سوره و تعقیبات پس از اذان شما:</p>
                {postAlarmsList.map((al) => (
                  <div key={al.id} className="flex items-center justify-between gap-2 p-2 rounded-xl border" style={{ borderColor: theme.border }}>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-app truncate">{al.title}</p>
                      <p className="text-[10px] text-accent font-bold mt-0.5" dir="ltr">⏰ ساعت امروز: {al.time}</p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteReminder(al.id);
                        refreshAlarms();
                        onChanged?.();
                      }}
                      className="p-1.5 text-red-400"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="card-flat p-3.5 space-y-3">
              <p className="text-xs font-black text-app">۱. بعد از کدام نماز و چند دقیقه پس از اذان یادآوری شود؟</p>
              <div className="grid grid-cols-5 gap-1">
                {PRAYER_LABELS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPostPrayer(p.key)}
                    className="py-2 rounded-xl text-[11px] font-bold border transition-all"
                    style={{
                      borderColor: postPrayer === p.key ? theme.primary : theme.border,
                      background: postPrayer === p.key ? theme.primary : 'transparent',
                      color: postPrayer === p.key ? theme.bg : theme.textMuted,
                    }}
                  >
                    {p.nameFa.replace('نماز ', '')}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-6 gap-1">
                {[10, 15, 20, 30, 45, 60].map((min) => (
                  <button
                    key={min}
                    type="button"
                    onClick={() => setPostMinutes(min)}
                    className="py-2 rounded-xl text-[11px] font-bold border transition-all"
                    style={{
                      borderColor: postMinutes === min ? theme.accent : theme.border,
                      background: postMinutes === min ? theme.accent : 'transparent',
                      color: postMinutes === min ? theme.bg : theme.textMuted,
                    }}
                  >
                    +{toFaDigits(min)}د
                  </button>
                ))}
              </div>

              {/* دکمه ثبت فوری و تست ۵ ثانیه‌ای در بالای لیست پس از اذان */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => void handleSavePostAdhanAlarm(true)}
                  className="py-2.5 rounded-2xl text-xs font-bold shadow-md"
                  style={{ background: theme.primary, color: theme.bg }}
                >
                  📿 ثبت اعلان پس از اذان
                </button>
                <button
                  type="button"
                  onClick={() => void handleTestLockscreen('post')}
                  className="py-2.5 rounded-2xl text-xs font-bold shadow-md"
                  style={{ background: theme.accent, color: theme.bg }}
                >
                  📱 تست ۵ ثانیه‌ای سوره/ذکر
                </button>
              </div>

              <p className="text-xs font-black text-app pt-1">
                ۲. انتخاب سوره مجرب (واقعه، یس، ملک، ذاریات، الرحمن) یا تعقیب بعد از نماز (با لمس هر کارت ثبت می‌شود):
              </p>
              <div className="space-y-2.5">
                {POST_ADHAN_OPTIONS.map((item) => {
                  const active = selectedPostId === item.id;
                  const isPlaying = playingAudioId === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedPostId(item.id);
                        void handleSavePostAdhanAlarm(true, item.id);
                      }}
                      className="w-full p-3.5 rounded-2xl border text-right transition-all cursor-pointer"
                      style={{
                        borderColor: active ? theme.primary : theme.border,
                        background: active ? 'color-mix(in srgb, ' + theme.primary + ' 14%, transparent)' : theme.bg,
                      }}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-bold text-accent">{item.badgeFa}</span>
                        <button
                          type="button"
                          onClick={(e) => void handlePlayPreview(item.id, item.audioUrl, item.fallbackAudioUrl, e)}
                          className="px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 shrink-0 shadow-sm"
                          style={{
                            background: isPlaying ? '#ef4444' : theme.primary,
                            color: isPlaying ? '#ffffff' : theme.bg,
                          }}
                        >
                          {isPlaying ? <Square size={10} /> : <Play size={10} />}
                          <span>{isPlaying ? '⏹️ توقف صوت' : '🎧 شنیدن صوت'}</span>
                        </button>
                      </div>
                      <p className="text-xs font-black text-app mb-1">{item.titleFa}</p>
                      <p className="text-sm text-primary font-bold leading-relaxed my-1">{item.arabicText}</p>
                      <p className="text-[11px] text-muted leading-relaxed">{item.translationFa}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab === 'travel' && (
          <div className="space-y-4">
            <div className="card-flat p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-app">فعال‌سازی حالت سفر هوشمند و نماز شکسته ✈️</p>
                <p className="text-[11px] text-muted mt-0.5">
                  تغییر خودکار افق شرعی به شهر مقصد و محاسبه حکم نماز قصر (شکسته ۲ رکعتی) یا تمام
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleSaveMosqueTravel({ ...mt, travelModeEnabled: !mt.travelModeEnabled })}
                className="w-12 h-6 rounded-full transition-all relative shrink-0"
                style={{ background: mt.travelModeEnabled ? theme.primary : 'color-mix(in srgb, ' + theme.textMuted + ' 25%, transparent)' }}
              >
                <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ right: mt.travelModeEnabled ? '2px' : '24px' }} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-bold text-muted block mb-1">شهر مبدا (وطن شما)</label>
                <select
                  value={mt.originCityId}
                  onChange={(e) => handleSaveMosqueTravel({ ...mt, originCityId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl text-xs font-bold text-app border outline-none"
                  style={{ borderColor: theme.border, background: theme.bg }}
                >
                  {CITIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.nameFa}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted block mb-1">شهر مقصد سفر</label>
                <select
                  value={mt.destinationCityId}
                  onChange={(e) => handleSaveMosqueTravel({ ...mt, destinationCityId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl text-xs font-bold text-app border outline-none"
                  style={{ borderColor: theme.border, background: theme.bg }}
                >
                  {CITIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.nameFa}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* باکس محاسبه خودکار مسافت شرعی بین شهر مبدا و مقصد */}
            <div
              className="p-3.5 rounded-2xl border flex items-start gap-2.5"
              style={{
                borderColor: isSharaiDistance ? theme.primary : '#f59e0b',
                background: isSharaiDistance ? 'color-mix(in srgb, ' + theme.primary + ' 12%, transparent)' : 'rgba(245,158,11,0.12)',
              }}
            >
              {isSharaiDistance ? (
                <CheckCircle2 size={18} color={theme.primary} className="shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle size={18} color="#f59e0b" className="shrink-0 mt-0.5" />
              )}
              <div className="text-xs leading-relaxed">
                <p className="font-black text-app">
                  فاصله مستقیم {originCityObj.nameFa} تا {destCityObj.nameFa}: {toFaDigits(travelDistanceKm)} کیلومتر
                </p>
                <p className="text-muted text-[11px] mt-0.5">
                  {isSharaiDistance
                    ? 'بیشتر از مسافت شرعی (حداقل ۲۲.۵ کیلومتر) است؛ در صورت قصد اقامت کمتر از ۱۰ روز، نمازهای ۴ رکعتی شکسته (۲ رکعت) خوانده می‌شوند.'
                    : 'فاصله کمتر از حد مسافت شرعی است یا مبدا و مقصد یکی است؛ بنابراین نمازها تمام (۴ رکعتی) می‌باشد.'}
                </p>
              </div>
            </div>

            {/* انتخاب مدت اقامت در مقصد (کمتر از ۱۰ روز = شکسته | ۱۰ روز یا بیشتر = تمام) */}
            <div className="card-flat p-3.5 space-y-2.5">
              <p className="text-xs font-black text-app">مدت اقامت شما در مقصد ({destCityObj.nameFa}):</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={!isSharaiDistance}
                  onClick={() => handleSaveMosqueTravel({ ...mt, travelModeEnabled: true, isQasrPrayer: true })}
                  className="p-3 rounded-2xl border text-right transition-all disabled:opacity-40"
                  style={{
                    borderColor: mt.isQasrPrayer && isSharaiDistance ? theme.primary : theme.border,
                    background: mt.isQasrPrayer && isSharaiDistance ? 'color-mix(in srgb, ' + theme.primary + ' 16%, transparent)' : theme.bg,
                  }}
                >
                  <span className="text-xs font-black text-app block">✈️ کمتر از ۱۰ روز</span>
                  <span className="text-[11px] text-primary font-bold mt-1 block">نماز شکسته (قصر — ۲ رکعتی)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveMosqueTravel({ ...mt, travelModeEnabled: true, isQasrPrayer: false })}
                  className="p-3 rounded-2xl border text-right transition-all"
                  style={{
                    borderColor: !mt.isQasrPrayer || !isSharaiDistance ? theme.primary : theme.border,
                    background: !mt.isQasrPrayer || !isSharaiDistance ? 'color-mix(in srgb, ' + theme.primary + ' 16%, transparent)' : theme.bg,
                  }}
                >
                  <span className="text-xs font-black text-app block">🏠 قصد ۱۰ روز یا بیشتر</span>
                  <span className="text-[11px] text-accent font-bold mt-1 block">نماز تمام (کامل — ۴ رکعتی)</span>
                </button>
              </div>
            </div>

            {/* جدول واضح وضعیت تعداد رکعت هر ۵ نماز در مقصد */}
            <div className="card-flat p-3.5 space-y-2">
              <p className="text-xs font-black text-app">وضعیت نمازهای یومیه شما در این سفر:</p>
              <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
                {[
                  { name: 'صبح', rakat: '۲ رکعت', changed: false },
                  { name: 'ظهر', rakat: mt.isQasrPrayer && isSharaiDistance ? '۲ رکعت (شکسته)' : '۴ رکعت (تمام)', changed: mt.isQasrPrayer && isSharaiDistance },
                  { name: 'عصر', rakat: mt.isQasrPrayer && isSharaiDistance ? '۲ رکعت (شکسته)' : '۴ رکعت (تمام)', changed: mt.isQasrPrayer && isSharaiDistance },
                  { name: 'مغرب', rakat: '۳ رکعت', changed: false },
                  { name: 'عشاء', rakat: mt.isQasrPrayer && isSharaiDistance ? '۲ رکعت (شکسته)' : '۴ رکعت (تمام)', changed: mt.isQasrPrayer && isSharaiDistance },
                ].map((pr, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-xl border"
                    style={{
                      borderColor: pr.changed ? theme.accent : theme.border,
                      background: pr.changed ? 'color-mix(in srgb, ' + theme.accent + ' 14%, transparent)' : theme.bg,
                    }}
                  >
                    <span className="text-[11px] font-bold text-muted block">{pr.name}</span>
                    <strong className="text-[10px] font-black block mt-1" style={{ color: pr.changed ? theme.accent : theme.text }}>
                      {pr.rakat}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            stopAllAudio();
            onClose();
          }}
          className="w-full mt-4 py-2.5 rounded-2xl text-xs font-bold border"
          style={{ borderColor: theme.border, color: theme.text }}
        >
          <Check className="inline ml-1" size={14} /> بستن
        </button>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(node, document.body) : node;
}
