import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plane, Building2, BellRing, X, Check, Square, Play, Sparkles, Trash2 } from 'lucide-react';
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
  const { theme } = useTheme();
  const [tab, setTab] = useState<'pre_adhan' | 'post_adhan' | 'mosque' | 'travel'>(
    initialSection === 'travel'
      ? 'travel'
      : initialSection === 'mosque'
      ? 'mosque'
      : initialSection === 'post_adhan'
      ? 'post_adhan'
      : 'pre_adhan'
  );
  const [mt, setMt] = useState(() => loadMosqueAndTravel());
  const [selectedPrayer, setSelectedPrayer] = useState<PrayerKey>('maghrib');
  const [preMinutes, setPreMinutes] = useState<number>(10);
  const [selectedChantId, setSelectedChantId] = useState<PreAdhanChantId>('chant_salawat');

  const [postPrayer, setPostPrayer] = useState<PrayerKey>('fajr');
  const [postMinutes, setPostMinutes] = useState<number>(15);
  const [selectedPostId, setSelectedPostId] = useState<string>('post_fajr_ya_fatima');

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

  // وقتی نماز تب «پس از اذان» عوض می‌شود، اولین عمل پیشنهادی مخصوص همان نماز را انتخاب کن
  useEffect(() => {
    const matching = POST_ADHAN_OPTIONS.filter((o) => o.prayers.includes(postPrayer));
    if (matching.length > 0 && !matching.some((m) => m.id === selectedPostId)) {
      setSelectedPostId(matching[0].id);
      setPostMinutes(matching[0].defaultOffsetMin);
    }
  }, [postPrayer]);

  const showNotice = (msg: string) => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(null), 4000);
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

  const handleSavePreAdhanAlarm = async (enable: boolean) => {
    const pNameFa = PRAYER_LABELS.find((x) => x.key === selectedPrayer)?.nameFa ?? 'نماز';
    const existingList = loadReminders().filter(
      (r) => r.id.startsWith('pre_adhan_' + selectedPrayer) || r.title.includes('تا اذان ' + pNameFa)
    );
    for (const oldRem of existingList) {
      await deleteReminder(oldRem.id);
    }

    if (!enable) {
      refreshAlarms();
      showNotice('اعلان پیش از اذان ' + pNameFa + ' خاموش شد.');
      onChanged?.();
      return;
    }

    const city = getCityById(getGuestCityId());
    const exactGps = getCustomGpsCoords();
    const lat = exactGps ? exactGps.lat : city.lat;
    const lng = exactGps ? exactGps.lng : city.lng;
    const pTimes = calculatePrayerTimes(new Date(), lat, lng, city.timezone, 'tehran');
    const triggerTime = addMinutesToTimeStr(pTimes[selectedPrayer], -preMinutes);
    const chant: PreAdhanChantOption = PRE_ADHAN_CHANT_OPTIONS.find((c) => c.id === selectedChantId) ?? PRE_ADHAN_CHANT_OPTIONS[0];

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
      '✅ ذکر «' + chant.titleFa + '» برای ' + toFaDigits(preMinutes) + ' دقیقه قبل از اذان ' + pNameFa + ' (ساعت ' + toFaDigits(triggerTime) + '، هماهنگ خودکار با افق هر روز) فعال شد!'
    );
    onChanged?.();
  };

  const handleSavePostAdhanAlarm = async (enable: boolean) => {
    const pNameFa = PRAYER_LABELS.find((x) => x.key === postPrayer)?.nameFa ?? 'نماز';
    const postItem: PostAdhanItemOption =
      POST_ADHAN_OPTIONS.find((o) => o.id === selectedPostId) ?? POST_ADHAN_OPTIONS[0];
    const dynPrefix = 'post_adhan_' + postPrayer + '_' + postMinutes + '_' + postItem.id;

    if (!enable) {
      const existingList = loadReminders().filter((r) => r.id.startsWith('post_adhan_' + postPrayer));
      for (const oldRem of existingList) {
        await deleteReminder(oldRem.id);
      }
      refreshAlarms();
      showNotice('اعلان تعقیبات پس از ' + pNameFa + ' خاموش شد.');
      onChanged?.();
      return;
    }

    const city = getCityById(getGuestCityId());
    const exactGps = getCustomGpsCoords();
    const lat = exactGps ? exactGps.lat : city.lat;
    const lng = exactGps ? exactGps.lng : city.lng;
    const pTimes = calculatePrayerTimes(new Date(), lat, lng, city.timezone, 'tehran');
    const triggerTime = addMinutesToTimeStr(pTimes[postPrayer], postMinutes);

    const nowIso = new Date().toISOString();
    const postReminder: LocalReminder = {
      id: dynPrefix,
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
      '✅ یادآور تعقیبات «' + postItem.titleFa + '» برای ' + toFaDigits(postMinutes) + ' دقیقه پس از اذان ' + pNameFa + ' (امروز ساعت ' + toFaDigits(triggerTime) + ') فعال شد!'
    );
    onChanged?.();
  };

  const handleTestLockscreen = async (mode: 'pre' | 'post') => {
    if (mode === 'pre') {
      const pNameFa = PRAYER_LABELS.find((x) => x.key === selectedPrayer)?.nameFa ?? 'نماز مغرب';
      const chant = PRE_ADHAN_CHANT_OPTIONS.find((c) => c.id === selectedChantId) ?? PRE_ADHAN_CHANT_OPTIONS[0];
      showNotice('🔥 تست ۵ ثانیه‌ای قبل از اذان کوک شد! همین الان صفحه گوشی را قفل (خاموش) کنید.');
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
      const pNameFa = PRAYER_LABELS.find((x) => x.key === postPrayer)?.nameFa ?? 'نماز صبح';
      const postItem = POST_ADHAN_OPTIONS.find((o) => o.id === selectedPostId) ?? POST_ADHAN_OPTIONS[0];
      showNotice('🔥 تست ۵ ثانیه‌ای تعقیبات پس از اذان کوک شد! همین الان صفحه گوشی را قفل (خاموش) کنید.');
      if (Capacitor.getPlatform() === 'android') {
        try {
          await NoorAlarm.scheduleNativeAlarm({
            id: 999903,
            triggerAtMillis: Date.now() + 5000,
            title: '📿 ' + toFaDigits(postMinutes) + ' دقیقه پس از اذان ' + pNameFa + ' (تعقیبات)',
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
    setMt(nextMt);
    saveMosqueAndTravel(nextMt);
    if (nextMt.travelModeEnabled) {
      clearCustomGpsCoords();
      setGuestCityId(nextMt.destinationCityId);
    }
    showNotice('✓ تنظیمات ذخیره و روی صفحهٔ اول اعمال شد.');
    onChanged?.();
  };

  const preAlarmsList = activeAlarms.filter((r) => r.id.startsWith('pre_adhan_'));
  const postAlarmsList = activeAlarms.filter((r) => r.id.startsWith('post_adhan_'));
  const filteredPostOptions = POST_ADHAN_OPTIONS.filter((o) => o.prayers.includes(postPrayer));

  const node = (
    <div
      className="fixed inset-0 z-[999] overflow-y-auto flex items-stretch sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.84)', backdropFilter: 'blur(7px)' }}
      dir="rtl"
    >
      <div
        className="w-full sm:max-w-lg min-h-[100dvh] sm:min-h-0 sm:rounded-3xl p-4 sm:p-5 border-0 sm:border shadow-2xl overflow-y-auto"
        style={{ background: theme.surface, borderColor: theme.border }}
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-2">
            <BellRing color={theme.primary} size={19} />
            <h2 className="text-base font-black text-app">اعلان‌های قبل از اذان، پس از اذان و مسجد</h2>
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

        <div
          className="grid grid-cols-4 gap-1 p-1 rounded-2xl mb-4"
          style={{ background: 'color-mix(in srgb, ' + theme.primary + ' 10%, transparent)' }}
        >
          <button
            type="button"
            onClick={() => setTab('pre_adhan')}
            className="py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1"
            style={{
              background: tab === 'pre_adhan' ? theme.primary : 'transparent',
              color: tab === 'pre_adhan' ? theme.bg : theme.textMuted,
            }}
          >
            🔔 قبل اذان
          </button>
          <button
            type="button"
            onClick={() => setTab('post_adhan')}
            className="py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1"
            style={{
              background: tab === 'post_adhan' ? theme.primary : 'transparent',
              color: tab === 'post_adhan' ? theme.bg : theme.textMuted,
            }}
          >
            📿 پس از اذان
          </button>
          <button
            type="button"
            onClick={() => setTab('mosque')}
            className="py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1"
            style={{
              background: tab === 'mosque' ? theme.primary : 'transparent',
              color: tab === 'mosque' ? theme.bg : theme.textMuted,
            }}
          >
            🕌 مسجد
          </button>
          <button
            type="button"
            onClick={() => setTab('travel')}
            className="py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1"
            style={{
              background: tab === 'travel' ? theme.primary : 'transparent',
              color: tab === 'travel' ? theme.bg : theme.textMuted,
            }}
          >
            ✈️ سفر
          </button>
        </div>

        {tab === 'pre_adhan' && (
          <div className="space-y-4">
            <div className="card-flat p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-app">۱. قبل از کدام اذان اعلام شود؟</p>
                <span className="text-[10px] font-bold text-primary">🔄 هماهنگ خودکار با افق هر روز</span>
              </div>
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

              <p className="text-xs font-black text-app pt-1">۲. چند دقیقه قبل از اذان؟</p>
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

              <p className="text-xs font-black text-app pt-1">
                ۳. انتخاب ذکر و تواشیح کوتاه قبل از اذان (با صوت منطبق با متن 🎧):
              </p>
              <div className="space-y-2.5">
                {PRE_ADHAN_CHANT_OPTIONS.map((ch) => {
                  const active = selectedChantId === ch.id;
                  const isPlaying = playingAudioId === ch.id;
                  return (
                    <div
                      key={ch.id}
                      onClick={() => setSelectedChantId(ch.id)}
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

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => void handleSavePreAdhanAlarm(true)}
                  className="py-3 rounded-2xl text-xs font-bold shadow-md"
                  style={{ background: theme.primary, color: theme.bg }}
                >
                  🔔 ثبت اعلان قبل از اذان
                </button>
                <button
                  type="button"
                  onClick={() => void handleSavePreAdhanAlarm(false)}
                  className="py-3 rounded-2xl text-xs font-bold border text-muted"
                  style={{ borderColor: theme.border }}
                >
                  حذف اعلان این نماز
                </button>
              </div>
            </div>

            {preAlarmsList.length > 0 && (
              <div className="card-flat p-3.5 space-y-2">
                <p className="text-xs font-black text-primary">اعلان‌های فعال قبل از اذان شما:</p>
                {preAlarmsList.map((al) => (
                  <div key={al.id} className="flex items-center justify-between gap-2 p-2.5 rounded-xl border" style={{ borderColor: theme.border }}>
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

            <div
              className="p-3.5 rounded-2xl border flex items-center justify-between gap-2"
              style={{ borderColor: theme.accent, background: 'color-mix(in srgb, ' + theme.accent + ' 10%, transparent)' }}
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-app">📱 تست ۵ ثانیه‌ای قبل از اذان روی صفحه قفل</p>
                <p className="text-[10px] text-muted mt-0.5 leading-relaxed">
                  دکمه را بزنید و گوشی را قفل کنید؛ ۵ ثانیه بعد صفحه روشن شده و همین ذکر پخش می‌شود.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleTestLockscreen('pre')}
                className="px-3 py-2.5 rounded-xl text-xs font-bold shrink-0 shadow-md"
                style={{ background: theme.accent, color: theme.bg }}
              >
                تست ۵ ثانیه‌ای
              </button>
            </div>
          </div>
        )}

        {tab === 'post_adhan' && (
          <div className="space-y-4">
            <div className="card-flat p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-app">۱. تعقیبات و اعمال پس از کدام نماز؟</p>
                <span className="text-[10px] font-bold text-accent">📿 مختص هر نماز</span>
              </div>
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

              <p className="text-xs font-black text-app pt-1">۲. چند دقیقه پس از اذان یادآوری شود؟</p>
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

              <p className="text-xs font-black text-app pt-1">
                ۳. انتخاب ذکر، سوره یا تعقیب مخصوص این نماز (با پخش صوت 🎧):
              </p>
              <div className="space-y-2.5">
                {filteredPostOptions.map((item) => {
                  const active = selectedPostId === item.id;
                  const isPlaying = playingAudioId === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedPostId(item.id)}
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

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => void handleSavePostAdhanAlarm(true)}
                  className="py-3 rounded-2xl text-xs font-bold shadow-md"
                  style={{ background: theme.primary, color: theme.bg }}
                >
                  📿 فعال‌سازی تعقیبات پس از اذان
                </button>
                <button
                  type="button"
                  onClick={() => void handleSavePostAdhanAlarm(false)}
                  className="py-3 rounded-2xl text-xs font-bold border text-muted"
                  style={{ borderColor: theme.border }}
                >
                  حذف تعقیبات این نماز
                </button>
              </div>
            </div>

            {postAlarmsList.length > 0 && (
              <div className="card-flat p-3.5 space-y-2">
                <p className="text-xs font-black text-primary">یادآورهای فعال پس از اذان (تعقیبات) شما:</p>
                {postAlarmsList.map((al) => (
                  <div key={al.id} className="flex items-center justify-between gap-2 p-2.5 rounded-xl border" style={{ borderColor: theme.border }}>
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

            <div
              className="p-3.5 rounded-2xl border flex items-center justify-between gap-2"
              style={{ borderColor: theme.accent, background: 'color-mix(in srgb, ' + theme.accent + ' 10%, transparent)' }}
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-app">📱 تست ۵ ثانیه‌ای تعقیبات پس از اذان</p>
                <p className="text-[10px] text-muted mt-0.5 leading-relaxed">
                  دکمه را بزنید و صفحه گوشی را قفل کنید تا باز شدن صفحهٔ تعقیبات پس از نماز را ببینید.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleTestLockscreen('post')}
                className="px-3 py-2.5 rounded-xl text-xs font-bold shrink-0 shadow-md"
                style={{ background: theme.accent, color: theme.bg }}
              >
                تست ۵ ثانیه‌ای
              </button>
            </div>
          </div>
        )}

        {tab === 'mosque' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-muted block mb-1.5">نام مسجد محله یا محل کار شما</label>
              <input
                type="text"
                value={mt.selectedMosqueName}
                onChange={(e) => setMt({ ...mt, selectedMosqueName: e.target.value })}
                placeholder="مثلاً: مسجد جامع، مسجدالنبی یا حرم مطهر"
                className="w-full px-3.5 py-2.5 rounded-xl text-xs text-app border outline-none"
                style={{ borderColor: theme.border, background: theme.bg }}
              />
            </div>

            <div>
              <p className="text-xs font-bold text-app mb-2">
                فاصله زمانی اقامه جماعت مسجد پس از اذان (دقیقه):
              </p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { key: 'fajr' as const, label: 'جماعت صبح' },
                  { key: 'dhuhr' as const, label: 'جماعت ظهر' },
                  { key: 'maghrib' as const, label: 'جماعت مغرب' },
                ]).map((item) => (
                  <div key={item.key} className="card-flat p-2.5 text-center">
                    <span className="text-[11px] text-muted block mb-1">{item.label}</span>
                    <select
                      value={mt.jamaatOffsetsMinutes[item.key]}
                      onChange={(e) =>
                        setMt({
                          ...mt,
                          jamaatOffsetsMinutes: {
                            ...mt.jamaatOffsetsMinutes,
                            [item.key]: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2 py-1.5 rounded-lg text-xs font-bold text-primary border outline-none text-center"
                      style={{ borderColor: theme.border, background: theme.bg }}
                    >
                      {[5, 10, 15, 20, 30].map((m) => (
                        <option key={m} value={m}>+{toFaDigits(m)} دقیقه</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSaveMosqueTravel(mt)}
              className="w-full py-3 rounded-2xl text-xs font-bold"
              style={{ background: theme.primary, color: theme.bg }}
            >
              ذخیره ساعت جماعت مسجد
            </button>
          </div>
        )}

        {tab === 'travel' && (
          <div className="space-y-4">
            <div className="card-flat p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-app">فعال‌سازی حالت سفر هوشمند ✈️</p>
                <p className="text-[11px] text-muted mt-0.5">
                  تنظیم خودکار اوقات شرعی مقصد و یادآوری احکام نماز شکسته (قصر)
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleSaveMosqueTravel({ ...mt, travelModeEnabled: !mt.travelModeEnabled })}
                className="w-11 h-6 rounded-full transition-all relative shrink-0"
                style={{ background: mt.travelModeEnabled ? theme.primary : 'color-mix(in srgb, ' + theme.textMuted + ' 25%, transparent)' }}
              >
                <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ right: mt.travelModeEnabled ? '2px' : '22px' }} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-bold text-muted block mb-1">شهر مبدا (وطن)</label>
                <select
                  value={mt.originCityId}
                  onChange={(e) => handleSaveMosqueTravel({ ...mt, originCityId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl text-xs text-app border outline-none"
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
                  className="w-full px-3 py-2.5 rounded-xl text-xs text-app border outline-none"
                  style={{ borderColor: theme.border, background: theme.bg }}
                >
                  {CITIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.nameFa}</option>
                  ))}
                </select>
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
