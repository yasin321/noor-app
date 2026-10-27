import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Sliders, Plane, Building2, Volume2, X, Check } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import {
  loadAdhanStudio,
  saveAdhanStudio,
  loadMosqueAndTravel,
  saveMosqueAndTravel,
  type SoundProfileId,
  type PrayerAlarmMode,
} from '@/lib/deenIntelligenceStore';
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

  const updatePrayerMode = (pKey: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha', mode: PrayerAlarmMode) => {
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
              mode,
            },
          },
        },
      },
    };
    setStudio(next);
    saveAdhanStudio(next);
    onChanged?.();
  };

  const updatePrayerPreMin = (pKey: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha', preReminderMinutes: number) => {
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
              preReminderMinutes,
            },
          },
        },
      },
    };
    setStudio(next);
    saveAdhanStudio(next);
    onChanged?.();
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
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
      dir="rtl"
    >
      <div
        className="w-full max-w-md rounded-3xl p-5 border shadow-2xl my-auto max-h-[90vh] overflow-y-auto"
        style={{ background: theme.surface, borderColor: theme.border }}
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-2">
            <Sliders size={19} color={theme.primary} />
            <h2 className="text-base font-black text-app">استودیوی اذان، حالت سفر و مسجد</h2>
          </div>
          <button type="button" onClick={onClose} className="text-muted p-1">
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
                انتخاب پروفایل هوشمند موقعیت (خانه / کار / مسافرت):
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
                      className="p-3 rounded-2xl border text-center transition-all"
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

            <div className="space-y-2.5">
              <p className="text-xs font-bold text-app">تنظیم اختصاصی هر وعده در «{activeProf.nameFa}»:</p>
              {PRAYER_LABELS.map((pl) => {
                const cfg = activeProf.prayers[pl.key];
                return (
                  <div key={pl.key} className="card-flat p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-app">{pl.nameFa}</span>
                      <span className="text-[10px] text-muted">
                        پیش‌یادآور: {cfg.preReminderMinutes === 0 ? 'سر وقت' : `${toFaDigits(cfg.preReminderMinutes)} دقیقه قبل`}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'full_adhan' as PrayerAlarmMode, label: '🕌 اذان کامل' },
                        { id: 'short_beep' as PrayerAlarmMode, label: '🔔 اعلان کوتاه' },
                        { id: 'silent' as PrayerAlarmMode, label: '🔕 بی‌صدا' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => updatePrayerMode(pl.key, m.id)}
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
                    <div className="flex items-center justify-between gap-1 pt-1">
                      <span className="text-[10px] text-muted">یادآوری قبل از اذان:</span>
                      <div className="flex gap-1">
                        {[0, 5, 10, 15].map((minVal) => (
                          <button
                            key={minVal}
                            type="button"
                            onClick={() => updatePrayerPreMin(pl.key, minVal)}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-bold"
                            style={{
                              background: cfg.preReminderMinutes === minVal ? theme.accent : `color-mix(in srgb, ${theme.textMuted} 15%, transparent)`,
                              color: cfg.preReminderMinutes === minVal ? theme.bg : theme.textMuted,
                            }}
                          >
                            {minVal === 0 ? '۰' : `${toFaDigits(minVal)}د`}
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
          onClick={onClose}
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
