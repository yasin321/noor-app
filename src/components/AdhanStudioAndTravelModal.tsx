import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Sliders, Plane, Building2, Volume2, X, Check, Play, Square } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import {
  loadAdhanStudio,
  saveAdhanStudio,
  loadMosqueAndTravel,
  saveMosqueAndTravel,
  type SoundProfileId,
  type PrayerAlarmMode,
} from '@/lib/deenIntelligenceStore';
import { adhans, playAdhanPreview, stopAdhanPreview } from '@/lib/adhans';
import { CITIES, setGuestCityId } from '@/lib/cities';
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

export function AdhanStudioAndTravelModal({ initialSection = 'studio', onClose, onChanged }: Props) {
  const { theme } = useTheme();
  const [tab, setTab] = useState<'studio' | 'travel' | 'mosque'>(initialSection);
  const [studio, setStudio] = useState(() => loadAdhanStudio());
  const [mt, setMt] = useState(() => loadMosqueAndTravel());
  const [playingPrayer, setPlayingPrayer] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const activeProf = studio.profiles[studio.activeProfile];

  const handleSelectProfile = (profId: SoundProfileId) => {
    const next = { ...studio, activeProfile: profId };
    setStudio(next);
    saveAdhanStudio(next);
    if (profId === 'travel' && !mt.travelModeEnabled) {
      const nextMt = { ...mt, travelModeEnabled: true };
      setMt(nextMt);
      saveMosqueAndTravel(nextMt);
    }
    onChanged?.();
  };

  const updatePrayerPatch = (
    pKey: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha',
    patch: Partial<(typeof activeProf.prayers)['fajr']>
  ) => {
    const next = {
      ...studio,
      profiles: {
        ...studio.profiles,
        [studio.activeProfile]: {
          ...activeProf,
          prayers: {
            ...activeProf.prayers,
            [pKey]: {
              ...activeProf.prayers[pKey],
              ...patch,
            },
          },
        },
      },
    };
    setStudio(next);
    saveAdhanStudio(next);
    onChanged?.();
  };

  const handlePreviewPrayerAudio = async (pKey: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha') => {
    if (playingPrayer === pKey) {
      stopAdhanPreview();
      setPlayingPrayer(null);
      return;
    }
    const cfg = activeProf.prayers[pKey];
    const targetAdhan = adhans.find((a) => a.id === cfg.adhanId) ?? adhans[0];
    setPlayingPrayer(pKey);
    const dur = cfg.mode === 'short_10s' ? 10 : 18;
    try {
      await playAdhanPreview(targetAdhan, dur, cfg.volumePercent);
    } catch {
      // ignore
    }
  };

  const handleSaveMosqueTravel = (nextMt: typeof mt) => {
    setMt(nextMt);
    saveMosqueAndTravel(nextMt);
    if (nextMt.travelModeEnabled) {
      setGuestCityId(nextMt.destinationCityId);
    }
    setSavedNotice('✓ تنظیمات هوشمند ذخیره و روی صفحهٔ اول اعمال شد.');
    setTimeout(() => setSavedNotice(null), 2500);
    onChanged?.();
  };

  const node = (
    <div
      className="fixed inset-0 z-[999] overflow-y-auto flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)' }}
      dir="rtl"
    >
      <div
        className="w-full max-w-md rounded-3xl p-5 border shadow-2xl my-auto max-h-[90vh] overflow-y-auto"
        style={{ background: theme.surface, borderColor: theme.border }}
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-2">
            <Sliders size={19} color={theme.primary} />
            <h2 className="text-base font-black text-app">استودیوی شخصی اذان، سفر و مسجد</h2>
          </div>
          <button
            type="button"
            onClick={() => {
              stopAdhanPreview();
              onClose();
            }}
            className="text-muted p-1"
          >
            <X size={20} />
          </button>
        </div>

        {savedNotice && (
          <div
            className="mb-3 rounded-2xl px-3 py-2 text-xs font-bold text-center"
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
            onClick={() => setTab('studio')}
            className="py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
            style={{
              background: tab === 'studio' ? theme.primary : 'transparent',
              color: tab === 'studio' ? theme.bg : theme.textMuted,
            }}
          >
            <Volume2 size={13} /> استودیو اذان
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
          <button
            type="button"
            onClick={() => setTab('mosque')}
            className="py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
            style={{
              background: tab === 'mosque' ? theme.primary : 'transparent',
              color: tab === 'mosque' ? theme.bg : theme.textMuted,
            }}
          >
            <Building2 size={13} /> برنامه مسجد
          </button>
        </div>

        {tab === 'studio' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-muted block mb-2">
                پروفایل موقعیت (خانه / محل کار / مسافرت):
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['home', 'work', 'travel'] as SoundProfileId[]).map((pid) => {
                  const p = studio.profiles[pid];
                  const active = studio.activeProfile === pid;
                  return (
                    <button
                      key={pid}
                      type="button"
                      onClick={() => handleSelectProfile(pid)}
                      className="p-2.5 rounded-2xl border text-center transition-all"
                      style={{
                        borderColor: active ? theme.primary : theme.border,
                        background: active ? `color-mix(in srgb, ${theme.primary} 16%, transparent)` : 'transparent',
                      }}
                    >
                      <span className="text-xs font-black block text-app">{p.badge}</span>
                      <span className="text-[10px] text-primary font-bold mt-1 block">
                        {active ? 'فعال ✓' : 'انتخاب'}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted mt-2 leading-relaxed">{activeProf.descriptionFa}</p>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-app">تنظیم اختصاصی هر نماز در «{activeProf.nameFa}»:</p>
              {PRAYER_LABELS.map((pl) => {
                const cfg = activeProf.prayers[pl.key];
                const isPlaying = playingPrayer === pl.key;

                return (
                  <div key={pl.key} className="card-flat p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-app">{pl.nameFa}</span>
                      <button
                        type="button"
                        onClick={() => void handlePreviewPrayerAudio(pl.key)}
                        className="px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1"
                        style={{ background: theme.primary, color: theme.bg }}
                      >
                        {isPlaying ? <Square size={11} /> : <Play size={11} />}
                        <span>{isPlaying ? 'توقف پیش‌نمایش' : 'پیش‌نمایش صدا'}</span>
                      </button>
                    </div>

                    {/* انتخاب مؤذن اختصاصی برای همین نماز */}
                    <div>
                      <label className="text-[10px] text-muted block mb-1">مؤذن اختصاصی این نماز:</label>
                      <select
                        value={cfg.adhanId}
                        onChange={(e) => updatePrayerPatch(pl.key, { adhanId: e.target.value })}
                        className="w-full px-2.5 py-2 rounded-xl text-xs text-app border outline-none"
                        style={{ borderColor: theme.border, background: theme.bg }}
                      >
                        {adhans.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.reciter} — {a.nameFa}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* حالت پخش: اذان کامل | ۱۰ ثانیه اول | اعلان کوتاه | بی‌صدا */}
                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { id: 'full_adhan' as PrayerAlarmMode, label: '🕌 کامل' },
                        { id: 'short_10s' as PrayerAlarmMode, label: '⏱️ ۱۰ ثانیه' },
                        { id: 'short_beep' as PrayerAlarmMode, label: '🔔 کوتاه' },
                        { id: 'silent' as PrayerAlarmMode, label: '🔕 بی‌صدا' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => updatePrayerPatch(pl.key, { mode: m.id })}
                          className="py-1.5 rounded-xl text-[10px] font-bold border"
                          style={{
                            borderColor: cfg.mode === m.id ? theme.primary : theme.border,
                            background: cfg.mode === m.id ? theme.primary : 'transparent',
                            color: cfg.mode === m.id ? theme.bg : theme.textMuted,
                          }}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>

                    {/* تنظیم درصد بلندی صدا */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-muted">بلندی صدا: {toFaDigits(cfg.volumePercent)}٪</span>
                      <input
                        type="range"
                        min={10}
                        max={100}
                        step={5}
                        value={cfg.volumePercent}
                        onChange={(e) => updatePrayerPatch(pl.key, { volumePercent: Number(e.target.value) })}
                        className="w-36 accent-emerald-400"
                      />
                    </div>

                    {/* نوتیفیکیشن دعای کوتاه قبل از اذان (۰، ۱۰، ۱۵ یا ۳۰ دقیقه قبل) */}
                    <div className="flex items-center justify-between gap-1 pt-1 border-t" style={{ borderColor: theme.border }}>
                      <span className="text-[10px] text-muted">اعلان دعای کوتاه قبل از اذان:</span>
                      <div className="flex gap-1">
                        {[
                          { min: 0, label: 'خاموش' },
                          { min: 10, label: '۱۰د قبل' },
                          { min: 15, label: '۱۵د قبل' },
                          { min: 30, label: '۳۰د قبل' },
                        ].map((opt) => (
                          <button
                            key={opt.min}
                            type="button"
                            onClick={() => updatePrayerPatch(pl.key, { preReminderMinutes: opt.min })}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-bold"
                            style={{
                              background:
                                cfg.preReminderMinutes === opt.min
                                  ? theme.accent
                                  : `color-mix(in srgb, ${theme.textMuted} 15%, transparent)`,
                              color: cfg.preReminderMinutes === opt.min ? theme.bg : theme.textMuted,
                            }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
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

            <div className="card-flat p-3.5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-app">نوع اقامه در مقصد (قصر / تمام)</p>
                <p className="text-[10px] text-muted mt-0.5">
                  در سفرهای زیر ۱۰ روز (بیش از مسافت شرعی)، نمازهای ۴ رکعتی شکسته (۲ رکعت) است.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleSaveMosqueTravel({ ...mt, isQasrPrayer: !mt.isQasrPrayer })}
                className="px-3 py-1.5 rounded-xl text-xs font-bold shrink-0"
                style={{ background: theme.primary, color: theme.bg }}
              >
                {mt.isQasrPrayer ? 'شکسته (۲ رکعتی)' : 'تمام (قصد ۱۰ روز)'}
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
                فاصله زمانی اقامه جماعت مسجد پس از اذان افق شهر (دقیقه):
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

            <div>
              <label className="text-xs font-bold text-muted block mb-1.5">برنامه یا اطلاعیه مسجد</label>
              <input
                type="text"
                value={mt.mosqueAnnouncement}
                onChange={(e) => setMt({ ...mt, mosqueAnnouncement: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs text-app border outline-none"
                style={{ borderColor: theme.border, background: theme.bg }}
              />
            </div>

            <button
              type="button"
              onClick={() => handleSaveMosqueTravel(mt)}
              className="w-full py-3 rounded-2xl text-xs font-bold"
              style={{ background: theme.primary, color: theme.bg }}
            >
              ذخیره برنامه مسجد
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            stopAdhanPreview();
            onClose();
          }}
          className="w-full mt-5 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1 border"
          style={{ borderColor: theme.border, color: theme.text }}
        >
          <Check size={15} />
          <span>بستن</span>
        </button>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(node, document.body) : node;
}
