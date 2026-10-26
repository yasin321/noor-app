import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Bell, Trash2, Calendar, Clock, Repeat, X, Check, AlertCircle, Pencil, CheckCircle2, Circle, Sparkles, Flame } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import {
  loadReminders,
  createReminder,
  updateReminder,
  toggleReminder,
  deleteReminder,
  rescheduleAll,
  checkPermission,
  requestPermission,
  getDayLabel,
  type LocalReminder,
} from '@/lib/reminderService';
import {
  isReminderCompletedOnDate,
  toggleReminderCompletionOnDate,
  getReminderTotalCompletedDays,
  getPlannedVsActualStats,
  saveReminder,
} from '@/lib/reminderStorage';
import { getAllDhikr } from '@/lib/dhikrLibrary';
import { toFaDigits } from '@/lib/jalali';

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const GUEST_NOTIF_KEY = 'noor_guest_notif_enabled';

function getGuestNotifEnabled(): boolean {
  try {
    return localStorage.getItem(GUEST_NOTIF_KEY) !== 'false';
  } catch {
    return true;
  }
}

const SMART_PRESETS: Array<{
  id: string;
  badge: string;
  title: string;
  body: string;
  time: string;
  days: number[];
  dhikrId: string | null;
  durationDays: number | null;
}> = [
  {
    id: 'preset_parents',
    badge: '🕯️ پنجشنبه‌ها (مزار و والدین)',
    title: 'فاتحه و خیرات برای پدر، مادر و اهل قبور',
    body: 'خواندن سوره حمد، ۳ توحید و ۷ قدر برای شادی روح والدین و درگذشتگان',
    time: '16:30',
    days: [5], // پنجشنبه
    dhikrId: 'ahlul_qubur_fatiha',
    durationDays: null,
  },
  {
    id: 'preset_waqiah',
    badge: '📖 برنامه هر شب',
    title: 'تلاوت سوره مبارکه واقعه (وسعت رزق)',
    body: 'توصیه امام صادق (ع): هر شب پس از نماز مغرب و عشاء پیش از خواب',
    time: '21:00',
    days: ALL_DAYS,
    dhikrId: 'surah_waqiah',
    durationDays: 40,
  },
  {
    id: 'preset_charity_90',
    badge: '🌱 دوره ۳ ماهه (صدقه و نذر)',
    title: 'صدقه و استغفار دوره‌ای (برنامه ۳ ماهه)',
    body: 'پرداخت صدقه و ذکر اللَّهُمَّ عَافِنَا وَاعْفُ عَنَّا برای دفع بلا و سلامتی خانواده',
    time: '08:30',
    days: [0, 3, 6], // شنبه، سه‌شنبه، جمعه
    dhikrId: 'fateminia_afina',
    durationDays: 90,
  },
  {
    id: 'preset_chilla_40',
    badge: '✨ چله ۴۰ روزه معنوی',
    title: 'چله ۴۰ روزه دعای فرج و عاقبت‌به‌خیری',
    body: 'مداومت ۴۰ روزه بر ذکر اللَّهُمَّ سَلِّمْ وَ تَمِّمْ و دعای الهی عظم البلاء',
    time: '06:30',
    days: ALL_DAYS,
    dhikrId: 'fateminia_sallim',
    durationDays: 40,
  },
];

export function RemindersScreen() {
  const { theme } = useTheme();
  const { profile } = useAuth();
  const [reminders, setReminders] = useState<LocalReminder[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingReminder, setEditingReminder] = useState<LocalReminder | null>(null);
  const [notifSupported, setNotifSupported] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const notifEnabled = profile?.notif_enabled ?? getGuestNotifEnabled();

  useEffect(() => {
    setNotifSupported(Capacitor.isNativePlatform());
    setReminders(loadReminders());
    if (Capacitor.isNativePlatform()) {
      (async () => {
        const perm = await checkPermission();
        if (perm !== 'granted') {
          await requestPermission();
        }
        await rescheduleAll(notifEnabled);
        setReminders(loadReminders());
      })();
    }
  }, [refreshKey, notifEnabled]);

  const refresh = () => setRefreshKey((k) => k + 1);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggle = async (id: string) => {
    await toggleReminder(id, notifEnabled);
    refresh();
  };

  const handleDelete = async (id: string) => {
    await deleteReminder(id);
    refresh();
  };

  const handleCheckCompletedToday = (r: LocalReminder) => {
    const done = toggleReminderCompletionOnDate(r.id);
    if (done && 'vibrate' in navigator) navigator.vibrate?.(15);
    showToast(done ? `✅ «${r.title}» در کارنامه امروز شما ثبت شد!` : `تیک انجام «${r.title}» برداشته شد.`);
    refresh();
  };

  const handleQuickAddPreset = async (preset: (typeof SMART_PRESETS)[number]) => {
    const res = await createReminder({
      title: preset.title,
      body: preset.body,
      time: preset.time,
      days: preset.days,
      dhikrId: preset.dhikrId,
      type: 'recurring',
      notifEnabled,
    });
    if (preset.durationDays) {
      saveReminder({
        ...res.reminder,
        durationDays: preset.durationDays,
      });
    }
    showToast(`✨ برنامه «${preset.title}» به لیست شما اضافه شد.`);
    refresh();
  };

  const pva = getPlannedVsActualStats(30);

  return (
    <div className="px-5 pt-6 pb-28 animate-fade-in" dir="rtl">
      {toast && (
        <div
          className="fixed top-4 inset-x-5 z-50 rounded-2xl px-4 py-3 text-xs font-bold text-center shadow-xl animate-fade-in"
          style={{ background: theme.primary, color: theme.bg }}
        >
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-black text-app">برنامه و یادآوری‌ها</h1>
          <p className="text-muted text-xs mt-1">مدیریت چله‌ها، نذرها و تحقق برنامه روزانه</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="px-3.5 py-2.5 rounded-2xl flex items-center gap-1.5 text-xs font-bold shadow-md"
          style={{ background: theme.primary, color: theme.bg }}
        >
          <Plus size={18} color={theme.bg} />
          <span>برنامه جدید</span>
        </button>
      </div>

      {/* کارت مدیریتی Planned vs. Actual امروز (شبیه داشبورد مدیریتی) */}
      <div
        className="rounded-3xl p-4 mb-4 border"
        style={{
          background: `radial-gradient(circle at top left, color-mix(in srgb, ${theme.primary} 16%, transparent), ${theme.surface})`,
          borderColor: `color-mix(in srgb, ${theme.primary} 30%, ${theme.border})`,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Flame size={16} color={theme.accent} />
            <span className="text-xs font-bold text-app">تحقق برنامه عبادی امروز (Planned vs. Actual)</span>
          </div>
          <span className="text-xs font-black text-primary">
            {toFaDigits(pva.todayCompleted)} از {toFaDigits(pva.todayPlanned)} ({toFaDigits(pva.todayPercent)}٪)
          </span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden mb-2" style={{ background: `color-mix(in srgb, ${theme.primary} 12%, transparent)` }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pva.todayPercent}%`,
              background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent})`,
            }}
          />
        </div>
        <p className="text-[11px] text-muted">
          با زدن دایرهٔ تیک کنار هر برنامه، انجام شدن آن را در کارنامهٔ امروزت ثبت کن. (مجموع ۳۰ روز اخیر: {toFaDigits(pva.periodCompletedTotal)} عمل انجام‌شده)
        </p>
      </div>

      {/* قالب‌های آماده ۱ کلیکی برای نذر، چله، سوره واقعه و مزار والدین */}
      <div className="mb-5">
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <Sparkles size={13} color={theme.primary} />
          <span className="text-xs font-bold text-app">افزودن سریع برنامه‌های مجرب (۱ کلیکی):</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {SMART_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => void handleQuickAddPreset(preset)}
              className="card-flat p-3 text-right transition-transform active:scale-[0.98] flex flex-col justify-between"
            >
              <span className="text-[10px] font-bold text-primary mb-1 block">{preset.badge}</span>
              <p className="text-app font-bold text-xs leading-snug line-clamp-2">{preset.title}</p>
              <span className="text-[10px] text-muted mt-1.5 block" dir="ltr">⏰ {preset.time}</span>
            </button>
          ))}
        </div>
      </div>

      {!notifSupported && (
        <div className="flex items-start gap-2 p-3 rounded-xl mb-4" style={{ background: `color-mix(in srgb, ${theme.accent} 10%, transparent)` }}>
          <AlertCircle size={14} color={theme.accent} className="flex-shrink-0 mt-0.5" />
          <p className="text-muted text-xs leading-relaxed">
            اعلان زمان‌بندی‌شده در نسخه اندروید حتی هنگام قفل بودن گوشی کار می‌کند.
          </p>
        </div>
      )}

      {reminders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14">
          <Bell size={44} color={theme.textMuted} className="opacity-30 mb-3" />
          <p className="text-muted text-sm">هنوز برنامه‌ای ثبت نشده است</p>
          <p className="text-muted text-xs mt-1 opacity-60">از کارت‌های آماده بالا یا دکمه «+ برنامه جدید» استفاده کنید</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {reminders.map((r) => {
            const doneToday = isReminderCompletedOnDate(r.id);
            const totalDoneDays = getReminderTotalCompletedDays(r.id);
            const duration = r.durationDays ?? null;
            const chillaProgress = duration && duration > 0 ? Math.min(100, Math.round((totalDoneDays / duration) * 100)) : null;

            return (
              <div
                key={r.id}
                className="card-flat p-4 cursor-pointer transition-all"
                style={{
                  borderColor: doneToday ? theme.primary : undefined,
                }}
                onClick={() => setEditingReminder(r)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  {/* دکمه تیک زدن انجام امروز (Actual) */}
                  <button
                    type="button"
                    aria-label={doneToday ? 'انجام شده در امروز' : 'ثبت انجام در امروز'}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCheckCompletedToday(r);
                    }}
                    className="mt-0.5 shrink-0"
                    style={{ color: doneToday ? theme.primary : theme.textMuted }}
                  >
                    {doneToday ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm ${doneToday ? 'line-through opacity-75 text-primary' : 'text-app'}`}>
                      {r.title}
                    </p>
                    {r.body && <p className="text-muted text-xs mt-1 line-clamp-2">{r.body}</p>}
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex items-center gap-1">
                        <Clock size={12} color={theme.primary} />
                        <span className="text-primary font-bold text-xs" dir="ltr">{r.time}</span>
                      </div>
                      {totalDoneDays > 0 && (
                        <span className="text-[11px] font-bold text-accent">
                          ✓ {toFaDigits(totalDoneDays)} روز انجام شده
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      aria-label="ویرایش یادآوری"
                      onClick={() => setEditingReminder(r)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: `color-mix(in srgb, ${theme.primary} 10%, transparent)`, color: theme.primary }}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleToggle(r.id)}
                      className="w-11 h-6 rounded-full transition-all relative flex-shrink-0"
                      style={{ background: r.enabled ? theme.primary : `color-mix(in srgb, ${theme.textMuted} 25%, transparent)` }}
                    >
                      <div
                        className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                        style={{ right: r.enabled ? '2px' : '22px' }}
                      />
                    </button>
                  </div>
                </div>

                {/* نوار پیشرفت چله یا دوره ۳ ماهه */}
                {duration && chillaProgress !== null && (
                  <div className="mt-2.5 pt-2 border-t" style={{ borderColor: theme.border }}>
                    <div className="flex justify-between text-[10px] text-muted mb-1">
                      <span>پیشرفت دوره ({toFaDigits(duration)} روزه)</span>
                      <span className="font-bold text-primary">
                        {toFaDigits(totalDoneDays)} از {toFaDigits(duration)} روز ({toFaDigits(chillaProgress)}٪)
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `color-mix(in srgb, ${theme.primary} 12%, transparent)` }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${chillaProgress}%`, background: theme.primary }}
                      />
                    </div>
                  </div>
                )}

                {r.type === 'recurring' && r.days.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {r.days.map((d) => (
                      <span
                        key={d}
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{ background: `color-mix(in srgb, ${theme.primary} 10%, transparent)`, color: theme.primary }}
                      >
                        {getDayLabel(d)}
                      </span>
                    ))}
                  </div>
                )}
                {r.type === 'once' && r.date && (
                  <div className="flex items-center gap-2 mt-2">
                    <Calendar size={12} color={theme.textMuted} />
                    <span className="text-muted text-xs" dir="ltr">{r.date}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); void handleDelete(r.id); }}
                  className="mt-3 flex items-center gap-1 text-xs"
                  style={{ color: '#fca5a5' }}
                >
                  <Trash2 size={12} /> حذف برنامه
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && (
        <AddReminderModal
          notifEnabled={notifEnabled}
          onClose={() => setShowAdd(false)}
          onCreated={() => { setShowAdd(false); refresh(); }}
        />
      )}

      {editingReminder && (
        <AddReminderModal
          notifEnabled={notifEnabled}
          initialReminder={editingReminder}
          onClose={() => setEditingReminder(null)}
          onCreated={() => { setEditingReminder(null); refresh(); }}
        />
      )}
    </div>
  );
}

function AddReminderModal({
  notifEnabled,
  onClose,
  onCreated,
  initialReminder,
}: {
  notifEnabled: boolean;
  onClose: () => void;
  onCreated: () => void;
  initialReminder?: LocalReminder;
}) {
  const { theme } = useTheme();
  const dhikrItems = getAllDhikr();
  const [title, setTitle] = useState(initialReminder?.title ?? '');
  const [body, setBody] = useState(initialReminder?.body ?? '');
  const [time, setTime] = useState(initialReminder?.time ?? '08:00');
  const [type, setType] = useState<'recurring' | 'once'>(initialReminder?.type ?? 'recurring');
  const [days, setDays] = useState<number[]>(initialReminder?.days ?? ALL_DAYS);
  const [date, setDate] = useState(initialReminder?.date ?? '');
  const [dhikrId, setDhikrId] = useState<string | null>(initialReminder?.dhikrId ?? null);
  const [durationDays, setDurationDays] = useState<number | null>(initialReminder?.durationDays ?? null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleDay = (d: number) => {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const handleSelectDhikr = (idVal: string) => {
    const val = idVal || null;
    setDhikrId(val);
    if (val) {
      const found = dhikrItems.find((d) => d.id === val);
      if (found) {
        if (!title.trim()) setTitle(found.arabic.slice(0, 38));
        if (!body.trim()) setBody(`${found.translation} (${toFaDigits(found.count)} مرتبه)`);
      }
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('لطفاً عنوان یادآوری را وارد کنید');
      return;
    }
    if (type === 'recurring' && days.length === 0) {
      setError('حداقل یک روز از هفته را انتخاب کنید');
      return;
    }
    if (type === 'once' && !date) {
      setError('لطفاً تاریخ را انتخاب کنید');
      return;
    }

    setLoading(true);
    setError(null);

    const result = initialReminder
      ? await updateReminder(
          initialReminder.id,
          {
            title: title.trim(),
            body: body.trim(),
            time,
            days: type === 'recurring' ? days : [],
            dhikrId,
            type,
            date: type === 'once' ? date : null,
            enabled: true,
          },
          notifEnabled
        )
      : await createReminder({
          title: title.trim(),
          body: body.trim(),
          time,
          days: type === 'recurring' ? days : [],
          dhikrId,
          type,
          date: type === 'once' ? date : null,
          notifEnabled,
        });

    if (result.reminder && durationDays) {
      saveReminder({
        ...result.reminder,
        durationDays,
      });
    }

    setLoading(false);

    if (!result.schedule.success) {
      setError(result.schedule.error ?? 'خطا در ذخیره یادآوری');
      return;
    }

    onCreated();
  };

  const modalNode = (
    <div
      className="fixed inset-0 z-[999] overflow-y-auto flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(6px)' }}
      dir="rtl"
    >
      <div
        className="w-full max-w-md rounded-3xl p-5 my-auto max-h-[88vh] overflow-y-auto border shadow-2xl animate-fade-in"
        style={{ background: theme.surface, borderColor: theme.border }}
      >
        <div
          className="sticky top-0 z-10 flex items-center justify-between pb-3 mb-4 border-b"
          style={{ background: theme.surface, borderColor: theme.border }}
        >
          <h2 className="text-lg font-black text-app">
            {initialReminder ? 'ویرایش برنامه عبادی' : 'ثبت برنامه و یادآوری جدید'}
          </h2>
          <button type="button" onClick={onClose} className="text-muted p-1">
            <X size={22} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-muted text-xs font-bold mb-1.5 block">
              انتخاب از گنجینه اذکار و سوره‌ها (اختیاری)
            </label>
            <select
              value={dhikrId ?? ''}
              onChange={(e) => handleSelectDhikr(e.target.value)}
              className="w-full px-3.5 py-3 rounded-2xl text-xs font-medium text-app border outline-none"
              style={{ borderColor: theme.border, background: theme.bg }}
            >
              <option value="">— بدون ذکر (برنامه یا نذر شخصی) —</option>
              {dhikrItems.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.arabic.slice(0, 32)} — {d.translation.slice(0, 36)} ({toFaDigits(d.count)} بار)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-muted text-xs font-bold mb-1.5 block">عنوان برنامه / یادآوری</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً: سوره واقعه، صدقه ۱۰ روزه یا زیارت والدین"
              className="w-full px-4 py-3 rounded-2xl text-sm text-app border outline-none"
              style={{ borderColor: theme.border, background: theme.bg }}
            />
          </div>

          <div>
            <label className="text-muted text-xs font-bold mb-1.5 block">توضیح یا نیت (اختیاری)</label>
            <input
              type="text"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="مثلاً: بعد از نماز مغرب به نیت سلامتی مادر"
              className="w-full px-4 py-2.5 rounded-2xl text-xs text-app border outline-none"
              style={{ borderColor: theme.border, background: theme.bg }}
            />
          </div>

          {/* انتخاب دوره هدف (چله ۴۰ روزه، ۱ ماهه، ۳ ماهه فصلی) */}
          <div>
            <label className="text-muted text-xs font-bold mb-1.5 block">دوره زمانی هدف (چله / برنامه فصلی)</label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: 'همیشگی', val: null },
                { label: '۳۰ روزه', val: 30 },
                { label: 'چله (۴۰ روز)', val: 40 },
                { label: '۳ ماهه (۹۰ روز)', val: 90 },
              ].map((opt) => (
                <button
                  key={String(opt.val)}
                  type="button"
                  onClick={() => setDurationDays(opt.val)}
                  className="py-2 rounded-xl text-[11px] font-bold"
                  style={{
                    background: durationDays === opt.val ? theme.primary : `color-mix(in srgb, ${theme.primary} 10%, transparent)`,
                    color: durationDays === opt.val ? theme.bg : theme.textMuted,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div
            className="flex gap-2 p-1 rounded-2xl"
            style={{ background: `color-mix(in srgb, ${theme.primary} 10%, transparent)` }}
          >
            <button
              type="button"
              onClick={() => setType('recurring')}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              style={{
                background: type === 'recurring' ? theme.primary : 'transparent',
                color: type === 'recurring' ? theme.bg : theme.textMuted,
              }}
            >
              <Repeat size={14} /> برنامه هفتگی / روزانه
            </button>
            <button
              type="button"
              onClick={() => setType('once')}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              style={{
                background: type === 'once' ? theme.primary : 'transparent',
                color: type === 'once' ? theme.bg : theme.textMuted,
              }}
            >
              <Calendar size={14} /> یک‌باره در تاریخ مشخص
            </button>
          </div>

          <div>
            <label className="text-muted text-xs font-bold mb-1.5 block">ساعت هشدار</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl text-sm font-bold text-app border outline-none"
              style={{ borderColor: theme.border, background: theme.bg }}
              dir="ltr"
            />
          </div>

          {type === 'recurring' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-muted text-xs font-bold">روزهای هفته</label>
                <button
                  type="button"
                  onClick={() => setDays(ALL_DAYS)}
                  className="text-xs font-bold text-primary"
                >
                  همه روزها
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {ALL_DAYS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    className="py-2 rounded-xl text-xs font-bold"
                    style={{
                      background: days.includes(d)
                        ? theme.primary
                        : `color-mix(in srgb, ${theme.primary} 10%, transparent)`,
                      color: days.includes(d) ? theme.bg : theme.textMuted,
                    }}
                  >
                    {getDayLabel(d)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {type === 'once' && (
            <div>
              <label className="text-muted text-xs font-bold mb-1.5 block">تاریخ</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl text-sm text-app border outline-none"
                style={{ borderColor: theme.border, background: theme.bg }}
                dir="ltr"
              />
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.12)' }}>
              <AlertCircle size={14} color="#fca5a5" className="flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs" style={{ color: '#fca5a5' }}>{error}</p>
                {error.includes('آلارم‌ها و یادآوری‌ها') && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await LocalNotifications.changeExactNotificationSetting();
                        setError('اگر مجوز را فعال کردی، دوباره دکمه ذخیره را بزن.');
                      } catch {
                        setError('از تنظیمات اندروید، مجوز «آلارم‌ها و یادآوری‌ها» را برای نور فعال کن.');
                      }
                    }}
                    className="mt-2 rounded-lg px-3 py-2 text-xs font-bold"
                    style={{ background: 'rgba(239,68,68,0.2)', color: '#fecaca' }}
                  >
                    باز کردن تنظیمات آلارم دقیق
                  </button>
                )}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={loading}
            className="w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
            style={{ background: theme.primary, color: theme.bg }}
          >
            <Check size={18} />
            <span>{loading ? 'در حال ثبت...' : initialReminder ? 'ذخیره تغییرات' : 'ثبت در برنامه من'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode;
}
