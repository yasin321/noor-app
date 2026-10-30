import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plane, Building2, BellRing, X, Check } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import {
  loadMosqueAndTravel,
  saveMosqueAndTravel,
  PRE_ADHAN_CHANT_OPTIONS,
  addMinutesToTimeStr,
  type PreAdhanChantId,
} from '@/lib/deenIntelligenceStore';
import { CITIES, getCityById, getGuestCityId, setGuestCityId, clearCustomGpsCoords, getCustomGpsCoords } from '@/lib/cities';
import { calculatePrayerTimes } from '@/lib/prayerTimes';
import { createReminder, updateReminder, deleteReminder, loadReminders, NoorAlarm } from '@/lib/reminderService';
import { Capacitor } from '@capacitor/core';
import { toFaDigits } from '@/lib/jalali';

interface Props {
  initialSection?: 'studio' | 'travel' | 'mosque';
  onClose: () => void;
  onChanged?: () => void;
}

const PRAYER_LABELS: Array<{ key: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'; nameFa: string }> = [
  { key: 'fajr', nameFa: 'نماز صبح' },
  { key: 'dhuhr', nameFa: 'نماز ظهر' },
  { key: 'asr', nameFa: 'نماز عصر' },
  { key: 'maghrib', nameFa: 'نماز مغرب' },
  { key: 'isha', nameFa: 'نماز عشاء' },
];

export function AdhanStudioAndTravelModal({ initialSection = 'mosque', onClose, onChanged }: Props) {
  const { theme } = useTheme();
  const [tab, setTab] = useState<'mosque' | 'pre_adhan' | 'travel'>(
    initialSection === 'travel' ? 'travel' : initialSection === 'studio' ? 'pre_adhan' : 'mosque'
  );
  const [mt, setMt] = useState(() => loadMosqueAndTravel());
  const [selectedPrayer, setSelectedPrayer] = useState<'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'>('maghrib');
  const [preMinutes, setPreMinutes] = useState<number>(10);
  const [selectedChantId, setSelectedChantId] = useState<PreAdhanChantId>('tawashih_salawat');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(null), 3500);
  };

  const handleSavePreAdhanAlarm = async (enable: boolean) => {
    const pNameFa = PRAYER_LABELS.find((x) => x.key === selectedPrayer)?.nameFa ?? 'نماز';
    const existing = loadReminders().find((r) => r.title.includes(`تا اذان ${pNameFa}`));

    if (!enable) {
      if (existing) await deleteReminder(existing.id);
      showNotice(`اعلان پیش از اذان ${pNameFa} خاموش شد.`);
      onChanged?.();
      return;
    }

    const city = getCityById(getGuestCityId());
    const exactGps = getCustomGpsCoords();
    const lat = exactGps ? exactGps.lat : city.lat;
    const lng = exactGps ? exactGps.lng : city.lng;
    const pTimes = calculatePrayerTimes(new Date(), lat, lng, city.timezone, 'tehran');
    const triggerTime = addMinutesToTimeStr(pTimes[selectedPrayer], -preMinutes);
    const chant = PRE_ADHAN_CHANT_OPTIONS.find((c) => c.id === selectedChantId) ?? PRE_ADHAN_CHANT_OPTIONS[0];

    const title = `🌿 ${toFaDigits(preMinutes)} دقیقه تا اذان ${pNameFa} (${chant.titleFa})`;
    const body = `${chant.arabicText} — ${chant.translationFa}`;

    if (existing) {
      await updateReminder(existing.id, { title, body, time: triggerTime, enabled: true }, true);
    } else {
      await createReminder({
        title,
        body,
        time: triggerTime,
        days: [0, 1, 2, 3, 4, 5, 6],
        dhikrId: null,
        type: 'recurring',
        notifEnabled: true,
      });
    }
    showNotice(`🔔 یادآور «${chant.titleFa}» برای ${toFaDigits(preMinutes)} دقیقه قبل از اذان ${pNameFa} (ساعت ${toFaDigits(triggerTime)}) کوک شد!`);
    onChanged?.();
  };

  const handleTestFullScreenNow = async () => {
    showNotice('🔥 تست ۵ ثانیه‌ای فعال شد! همین الان صفحه گوشی را قفل (خاموش) کنید تا روشن شدن تمام‌صفحه را ببینید.');
    if (Capacitor.getPlatform() === 'android') {
      const adhanId = localStorage.getItem('noor_guest_adhan_id') || 'mahur_saeed';
      try {
        await NoorAlarm.scheduleNativeAlarm({
          id: 999901,
          triggerAtMillis: Date.now() + 5000,
          title: '🕌 اذان به افق شهر شما',
          body: 'حَیَّ عَلَی الصَّلَاة — تست باز شدن تمام‌صفحه روی قفل گوشی',
          soundType: 'adhan',
          adhanId,
          durationSeconds: 15,
          volumePercent: 100,
        });
      } catch {}
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

  const node = (
    <div
      className="fixed inset-0 z-[999] overflow-y-auto flex items-center justify-center p-3.5 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.84)', backdropFilter: 'blur(7px)' }}
      dir="rtl"
    >
      <div
        className="w-full max-w-md rounded-3xl p-4 border shadow-2xl my-auto max-h-[92vh] overflow-y-auto"
        style={{ background: theme.surface, borderColor: theme.border }}
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-2">
            <Building2 size={19} color={theme.primary} />
            <h2 className="text-base font-black text-app">برنامه مسجد، دعای قبل اذان و سفر</h2>
          </div>
          <button type="button" onClick={onClose} className="text-muted p-1">
            <X size={20} />
          </button>
        </div>

        {savedNotice && (
          <div
            className="mb-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-center shadow-lg"
            style={{ background: theme.primary, color: theme.bg }}
          >
            {savedNotice}
          </div>
        )}

        <div
          className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl mb-4"
          style={{ background: `color-mix(in srgb, ${theme.primary} 10%, transparent)` }}
        >
          <button
            type="button"
            onClick={() => setTab('mosque')}
            className="py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
            style={{
              background: tab === 'mosque' ? theme.primary : 'transparent',
              color: tab === 'mosque' ? theme.bg : theme.textMuted,
            }}
          >
            <Building2 size={13} /> ساعت مسجد
          </button>
          <button
            type="button"
            onClick={() => setTab('pre_adhan')}
            className="py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
            style={{
              background: tab === 'pre_adhan' ? theme.primary : 'transparent',
              color: tab === 'pre_adhan' ? theme.bg : theme.textMuted,
            }}
          >
            <BellRing size={13} /> اعلان قبل اذان
          </button>
          <button
            type="button"
            onClick={() => setTab('travel')}
            className="py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
            style={{
              background: tab === 'travel' ? theme.primary : 'transparent',
              color: tab === 'travel' ? theme.bg : theme.textMuted,
            }}
          >
            <Plane size={13} /> حالت سفر
          </button>
        </div>

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

        {tab === 'pre_adhan' && (
          <div className="space-y-4">
            <div className="card-flat p-3.5 space-y-3">
              <p className="text-xs font-black text-app">۱. برای کدام نماز اعلان آمادگی قبل از اذان می‌خواهید؟</p>
              <div className="grid grid-cols-5 gap-1">
                {PRAYER_LABELS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setSelectedPrayer(p.key)}
                    className="py-2 rounded-xl text-[11px] font-bold border"
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

              <p className="text-xs font-black text-app pt-1">۲. چند دقیقه قبل از اذان یادآوری شود؟</p>
              <div className="grid grid-cols-4 gap-1.5">
                {[5, 10, 15, 30].map((min) => (
                  <button
                    key={min}
                    type="button"
                    onClick={() => setPreMinutes(min)}
                    className="py-2 rounded-xl text-xs font-bold border"
                    style={{
                      borderColor: preMinutes === min ? theme.accent : theme.border,
                      background: preMinutes === min ? theme.accent : 'transparent',
                      color: preMinutes === min ? theme.bg : theme.textMuted,
                    }}
                  >
                    {toFaDigits(min)} دقیقه قبل
                  </button>
                ))}
              </div>

              <p className="text-xs font-black text-app pt-1">۳. چه تواشیح، آیه یا دعایی نمایش و پخش شود؟</p>
              <div className="space-y-2">
                {PRE_ADHAN_CHANT_OPTIONS.map((ch) => {
                  const active = selectedChantId === ch.id;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setSelectedChantId(ch.id)}
                      className="w-full p-3 rounded-2xl border text-right transition-all"
                      style={{
                        borderColor: active ? theme.primary : theme.border,
                        background: active ? `color-mix(in srgb, ${theme.primary} 14%, transparent)` : theme.bg,
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-app">{ch.titleFa}</span>
                        <span className="text-[10px] font-bold text-primary">{ch.categoryFa}</span>
                      </div>
                      <p className="text-xs text-primary font-bold leading-relaxed">{ch.arabicText}</p>
                      <p className="text-[10px] text-muted mt-0.5">{ch.translationFa}</p>
                    </button>
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
                  🔔 فعال‌سازی قبل از اذان
                </button>
                <button
                  type="button"
                  onClick={() => void handleSavePreAdhanAlarm(false)}
                  className="py-3 rounded-2xl text-xs font-bold border text-muted"
                  style={{ borderColor: theme.border }}
                >
                  خاموش کردن
                </button>
              </div>
            </div>

            <div
              className="p-3.5 rounded-2xl border flex items-center justify-between gap-2"
              style={{ borderColor: theme.accent, background: `color-mix(in srgb, ${theme.accent} 10%, transparent)` }}
            >
              <div>
                <p className="text-xs font-black text-app">📱 تست باز شدن تمام‌صفحه روی قفل گوشی</p>
                <p className="text-[10px] text-muted mt-0.5">دکمه را بزنید و صفحه گوشی را خاموش کنید (۵ ثانیه بعد روشن می‌شود)</p>
              </div>
              <button
                type="button"
                onClick={() => void handleTestFullScreenNow()}
                className="px-3 py-2 rounded-xl text-xs font-bold shrink-0"
                style={{ background: theme.accent, color: theme.bg }}
              >
                تست ۵ ثانیه‌ای
              </button>
            </div>
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
                style={{ background: mt.travelModeEnabled ? theme.primary : `color-mix(in srgb, ${theme.textMuted} 25%, transparent)` }}
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
          onClick={onClose}
          className="w-full mt-4 py-2.5 rounded-2xl text-xs font-bold border"
          style={{ borderColor: theme.border, color: theme.text }}
        >
          <Check size={14} className="inline ml-1" /> بستن
        </button>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(node, document.body) : node;
}
