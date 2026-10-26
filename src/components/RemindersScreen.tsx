import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import { Plus, Bell, Trash2, Calendar, Clock, Repeat, X, Check, AlertCircle, Pencil } from 'lucide-react';
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

export function RemindersScreen() {
  const { theme } = useTheme();
  const { profile } = useAuth();
  const [reminders, setReminders] = useState<LocalReminder[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingReminder, setEditingReminder] = useState<LocalReminder | null>(null);
  const [notifSupported, setNotifSupported] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

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

  const handleToggle = async (id: string) => {
    await toggleReminder(id, notifEnabled);
    refresh();
  };

  const handleDelete = async (id: string) => {
    await deleteReminder(id);
    refresh();
  };

  return (
    <div className="px-5 pt-6 pb-28 animate-fade-in" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-app">برنامه و یادآوری‌ها</h1>
          <p className="text-muted text-xs mt-1">مدیریت برنامه عبادی، اذکار و نذرها</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="px-3.5 py-2.5 rounded-2xl flex items-center gap-1.5 text-xs font-bold shadow-md"
          style={{ background: theme.primary, color: theme.bg }}
        >
          <Plus size={18} color={theme.bg} />
          <span>یادآوری جدید</span>
        </button>
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
        <div className="flex flex-col items-center justify-center py-20">
          <Bell size={48} color={theme.textMuted} className="opacity-30 mb-4" />
          <p className="text-muted text-sm">هنوز یادآوری‌ای ثبت نشده است</p>
          <p className="text-muted text-xs mt-1 opacity-60">با دکمه «+ یادآوری جدید» برنامه خود را تنظیم کنید</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {reminders.map((r) => (
            <div key={r.id} className="card-flat p-4 cursor-pointer" onClick={() => setEditingReminder(r)}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-app font-bold text-sm">{r.title}</p>
                  {r.body && <p className="text-muted text-xs mt-1 truncate">{r.body}</p>}
                  <div className="flex items-center gap-2 mt-1.5">
                    <Clock size={12} color={theme.primary} />
                    <span className="text-primary font-bold text-xs" dir="ltr">{r.time}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    aria-label="ویرایش یادآوری"
                    onClick={() => setEditingReminder(r)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: `color-mix(in srgb, ${theme.primary} 10%, transparent)`, color: theme.primary }}
                  >
                    <Pencil size={16} />
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
                <Trash2 size={12} /> حذف
              </button>
            </div>
          ))}
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
  const [time, setTime] = useState(initialReminder?.time ?? '08:00');
  const [type, setType] = useState<'recurring' | 'once'>(initialReminder?.type ?? 'recurring');
  const [days, setDays] = useState<number[]>(initialReminder?.days ?? ALL_DAYS);
  const [date, setDate] = useState(initialReminder?.date ?? '');
  const [dhikrId, setDhikrId] = useState<string | null>(initialReminder?.dhikrId ?? null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleDay = (d: number) => {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const handleSelectDhikr = (idVal: string) => {
    const val = idVal || null;
    setDhikrId(val);
    if (val && !title.trim()) {
      const found = dhikrItems.find((d) => d.id === val);
      if (found) setTitle(found.arabic.slice(0, 35));
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
          time,
          days: type === 'recurring' ? days : [],
          dhikrId,
          type,
          date: type === 'once' ? date : null,
          notifEnabled,
        });

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
            {initialReminder ? 'ویرایش برنامه یادآوری' : 'ثبت یادآوری جدید'}
          </h2>
          <button type="button" onClick={onClose} className="text-muted p-1">
            <X size={22} />
          </button>
        </div>

        <div className="space-y-4">
          {/* انتخاب ذکر با نمایش واضح متن عربی و فارسی (حل کامل مشکل ناخوانا بودن لیست ذکر) */}
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
              <option value="">— بدون ذکر (یادآوری شخصی دلخواه) —</option>
              {dhikrItems.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.arabic.slice(0, 32)} — {d.translation.slice(0, 36)} ({toFaDigits(d.count)} بار)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-muted text-xs font-bold mb-1.5 block">عنوان یادآوری</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً: سوره واقعه، ذکر صبح یا زیارت والدین"
              className="w-full px-4 py-3 rounded-2xl text-sm text-app border outline-none"
              style={{ borderColor: theme.border, background: theme.bg }}
            />
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
                <label className="text-muted text-xs font-bold">روزهای تکرار</label>
                <button
                  type="button"
                  onClick={() => setDays(ALL_DAYS)}
                  className="text-xs font-bold text-primary"
                >
                  انتخاب همه روزها
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
            <span>{loading ? 'در حال ثبت...' : initialReminder ? 'ذخیره تغییرات' : 'ایجاد یادآوری'}</span>
          </button>
        </div>
      </div>
    </div>
  );
  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode;
}
