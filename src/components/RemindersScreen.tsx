import { useState, useEffect } from 'react';
import { Plus, Bell, Trash2, Calendar, Clock, Repeat, X, Check, AlertCircle, Pencil } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
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
    <div className="px-5 pt-6 pb-28 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-app">یادآوری‌ها</h1>
          <p className="text-muted text-xs mt-1">یادآوری ذکر و نماز</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: theme.primary }}
        >
          <Plus size={20} color={theme.bg} />
        </button>
      </div>

      {!notifSupported && (
        <div className="flex items-start gap-2 p-3 rounded-xl mb-4" style={{ background: `color-mix(in srgb, ${theme.accent} 10%, transparent)` }}>
          <AlertCircle size={14} color={theme.accent} className="flex-shrink-0 mt-0.5" />
          <p className="text-muted text-xs leading-relaxed">
            اعلان زمان‌بندی‌شده فقط در نسخه اندروید کار می‌کند. در مرورگر، یادآوری‌ها فقط وقتی برنامه باز است نمایش داده می‌شوند.
          </p>
        </div>
      )}

      {reminders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Bell size={48} color={theme.textMuted} className="opacity-30 mb-4" />
          <p className="text-muted text-sm">هنوز یادآوری‌ای ثبت نشده</p>
          <p className="text-muted text-xs mt-1 opacity-60">با دکمه + یادآوری جدید بسازید</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reminders.map((r) => (
            <div key={r.id} className="card-flat p-4 cursor-pointer" onClick={() => setEditingReminder(r)}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-app font-bold text-sm">{r.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock size={12} color={theme.textMuted} />
                    <span className="text-muted text-xs" dir="ltr">{r.time}</span>
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
                  onClick={() => handleToggle(r.id)}
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

function AddReminderModal({ notifEnabled, onClose, onCreated, initialReminder }: { notifEnabled: boolean; onClose: () => void; onCreated: () => void; initialReminder?: LocalReminder }) {
  const { theme } = useTheme();
  const dhikrItems = getAllDhikr();
  const [title, setTitle] = useState(initialReminder?.title ?? '');
  const [time, setTime] = useState(initialReminder?.time ?? '08:00');
  const [type, setType] = useState<'recurring' | 'once'>(initialReminder?.type ?? 'recurring');
  const [days, setDays] = useState<number[]>(initialReminder?.days ?? []);
  const [date, setDate] = useState(initialReminder?.date ?? '');
  const [dhikrId, setDhikrId] = useState<string | null>(initialReminder?.dhikrId ?? null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleDay = (d: number) => {
    setDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  };

  const handleCreate = async () => {
    if (!title.trim()) { setError('عنوان را وارد کنید'); return; }
    if (type === 'recurring' && days.length === 0) {
      setError('حداقل یک روز انتخاب کنید یا همه روزها را فعال کنید'); return;
    }
    if (type === 'once' && !date) { setError('تاریخ را انتخاب کنید'); return; }

    setLoading(true);
    setError(null);

    const result = initialReminder
      ? await updateReminder(initialReminder.id, {
          title: title.trim(),
          time,
          days: type === 'recurring' ? days : [],
          dhikrId,
          type,
          date: type === 'once' ? date : null,
          enabled: true,
        }, notifEnabled)
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

  return (
    <div className="fixed inset-0 z-60 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div
        className="w-full max-w-md rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto animate-slide-up"
        style={{ background: theme.surface }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-app">{initialReminder ? 'ویرایش یادآوری' : 'یادآوری جدید'}</h2>
          <button onClick={onClose} className="text-muted">
            <X size={22} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-muted text-xs mb-1.5 block">عنوان</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً: ذکر صبح"
              className="w-full px-4 py-3 rounded-2xl text-sm text-app border outline-none"
              style={{ borderColor: theme.border, background: `color-mix(in srgb, ${theme.bg} 50%, transparent)` }}
            />
          </div>

          <div className="flex gap-2 p-1 rounded-2xl" style={{ background: `color-mix(in srgb, ${theme.primary} 8%, transparent)` }}>
            <button
              onClick={() => setType('recurring')}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5"
              style={{ background: type === 'recurring' ? theme.primary : 'transparent', color: type === 'recurring' ? theme.bg : theme.textMuted }}
            >
              <Repeat size={14} /> تکراری
            </button>
            <button
              onClick={() => setType('once')}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5"
              style={{ background: type === 'once' ? theme.primary : 'transparent', color: type === 'once' ? theme.bg : theme.textMuted }}
            >
              <Calendar size={14} /> یکباره
            </button>
          </div>

          <div>
            <label className="text-muted text-xs mb-1.5 block">زمان</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl text-sm text-app border outline-none"
              style={{ borderColor: theme.border, background: `color-mix(in srgb, ${theme.bg} 50%, transparent)` }}
              dir="ltr"
            />
          </div>

          {type === 'recurring' && (
            <div>
              <label className="text-muted text-xs mb-1.5 block">روزها</label>
              <div className="grid grid-cols-4 gap-2">
                {ALL_DAYS.map((d) => (
                  <button
                    key={d}
                    onClick={() => toggleDay(d)}
                    className="py-2 rounded-xl text-xs font-medium"
                    style={{
                      background: days.includes(d) ? theme.primary : `color-mix(in srgb, ${theme.primary} 8%, transparent)`,
                      color: days.includes(d) ? theme.bg : theme.textMuted,
                    }}
                  >
                    {getDayLabel(d)}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setDays(ALL_DAYS)}
                className="mt-2 text-xs text-primary"
              >
                همه روزها
              </button>
            </div>
          )}

          {type === 'once' && (
            <div>
              <label className="text-muted text-xs mb-1.5 block">تاریخ</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl text-sm text-app border outline-none"
                style={{ borderColor: theme.border, background: `color-mix(in srgb, ${theme.bg} 50%, transparent)` }}
                dir="ltr"
              />
            </div>
          )}

          <div>
            <label className="text-muted text-xs mb-1.5 block">ذکر مرتبط (اختیاری)</label>
            <select
              value={dhikrId ?? ''}
              onChange={(e) => setDhikrId(e.target.value || null)}
              className="w-full px-4 py-3 rounded-2xl text-sm text-app border outline-none"
              style={{ borderColor: theme.border, background: `color-mix(in srgb, ${theme.bg} 50%, transparent)` }}
            >
              <option value="">بدون ذکر</option>
              {dhikrItems.map((d) => (
                <option key={d.id} value={d.id}>{d.translit}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)' }}>
              <AlertCircle size={14} color="#fca5a5" className="flex-shrink-0 mt-0.5" />
              <p className="text-xs" style={{ color: '#fca5a5' }}>{error}</p>
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: theme.primary, color: theme.bg }}
          >
            <Check size={18} /> {loading ? '...' : initialReminder ? 'ذخیره تغییرات' : 'ایجاد یادآوری'}
          </button>
        </div>
      </div>
    </div>
  );
}
