import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  Bell,
  Trash2,
  Calendar,
  Clock,
  Repeat,
  X,
  Check,
  AlertCircle,
  Pencil,
  CheckCircle2,
  Circle,
  Sparkles,
  BookOpen,
  Gauge,
  Volume2,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useTheme } from '@/hooks/useTheme';
import { useBackHandler } from '@/lib/backNavigation';
import { useAuth } from '@/hooks/useAuth';
import { useI18n, type AppLang } from '@/i18n';
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
  saveReminder,
} from '@/lib/reminderStorage';
import {
  loadSurahAlarms,
  scheduleSurahNativeAlarm,
  cancelSurahNativeAlarm,
  deleteSurahNativeAlarm,
  type SurahAlarmRecord,
  type SurahAlarmAnchor,
} from '@/lib/surahAlarmService';
import { getAllDhikr } from '@/lib/dhikrLibrary';
import { QuranAndMuhasabaModal } from '@/components/QuranAndMuhasabaModal';

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const PLAYBACK_SPEEDS = [1, 1.25, 1.5, 2, 3];
const GUEST_NOTIF_KEY = 'noor_guest_notif_enabled';

const DAY_LABELS_EN = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const DAY_LABELS_ES = ['Sáb', 'Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie'];

const SURAH_NAMES_I18N: Record<number, { en: string; es: string }> = {
  56: { en: "Surah Al-Waqi'ah", es: 'Sura Al-Wáqiah' },
  36: { en: 'Surah Ya-Sin', es: 'Sura Ya-Sin' },
  67: { en: 'Surah Al-Mulk', es: 'Sura Al-Mulk' },
  55: { en: 'Surah Ar-Rahman', es: 'Sura Ar-Rahmán' },
  51: { en: 'Surah Adh-Dhariyat', es: 'Sura Adh-Dhariyat' },
  37: { en: 'Surah As-Saffat', es: 'Sura As-Saffat' },
  62: { en: "Surah Al-Jumu'ah", es: "Sura Al-Yumu'ah" },
  97: { en: 'Surah Al-Qadr', es: 'Sura Al-Qadr' },
  112: { en: 'Surah Al-Ikhlas', es: 'Sura Al-Ijlás' },
};

function getLocalizedDay(dayIdx: number, lang: AppLang): string {
  if (lang === 'en') return DAY_LABELS_EN[dayIdx] ?? '';
  if (lang === 'es') return DAY_LABELS_ES[dayIdx] ?? '';
  return getDayLabel(dayIdx);
}

function getSurahTitle(rec: SurahAlarmRecord, lang: AppLang): string {
  const m = SURAH_NAMES_I18N[rec.surahNumber];
  if (lang === 'en') return m?.en || rec.surahNameFa;
  if (lang === 'es') return m?.es || rec.surahNameFa;
  return rec.surahNameFa;
}

function describeSurahAnchor(rec: SurahAlarmRecord, lang: AppLang, formatDigits: (v: string | number) => string): string {
  if (rec.anchor === 'custom') {
    if (lang === 'en') return 'Daily at ' + rec.resolvedClock;
    if (lang === 'es') return 'Diario a las ' + rec.resolvedClock;
    return 'هر روز ساعت دلخواه ' + formatDigits(rec.resolvedClock);
  }
  const offset = formatDigits(rec.offsetMinutes);
  const clock = formatDigits(rec.resolvedClock);
  if (lang === 'en') {
    const p = rec.anchor === 'fajr' ? 'Fajr' : rec.anchor === 'dhuhr' ? 'Dhuhr' : 'Maghrib';
    return offset + ' min after ' + p + ' (' + clock + ')';
  }
  if (lang === 'es') {
    const p = rec.anchor === 'fajr' ? 'Fajr' : rec.anchor === 'dhuhr' ? 'Dhuhr' : 'Magrib';
    return offset + ' min tras ' + p + ' (' + clock + ')';
  }
  const pFa = rec.anchor === 'fajr' ? 'اذان صبح' : rec.anchor === 'dhuhr' ? 'اذان ظهر' : 'اذان مغرب';
  return offset + ' دقیقه بعد از ' + pFa + ' (' + clock + ')';
}

function getGuestNotifEnabled(): boolean {
  try {
    return localStorage.getItem(GUEST_NOTIF_KEY) !== 'false';
  } catch {
    return true;
  }
}

interface SmartPresetItem {
  id: string;
  badgeFa: string;
  badgeEn: string;
  badgeEs: string;
  titleFa: string;
  titleEn: string;
  titleEs: string;
  bodyFa: string;
  bodyEn: string;
  bodyEs: string;
  time: string;
  days: number[];
  dhikrId: string | null;
  durationDays: number | null;
}

const SMART_PRESETS: SmartPresetItem[] = [
  {
    id: 'preset_parents',
    badgeFa: '🕯️ پنجشنبه‌ها (مزار و والدین)',
    badgeEn: '🕯️ Thursdays (Parents & Loved Ones)',
    badgeEs: '🕯️ Jueves (Padres y Seres Queridos)',
    titleFa: 'فاتحه و خیرات برای پدر، مادر و اهل قبور',
    titleEn: 'Fatihah & Charity for Parents',
    titleEs: 'Al-Fatiha y caridad por los padres',
    bodyFa: 'خواندن سوره حمد، ۳ توحید و ۷ قدر برای شادی روح والدین و درگذشتگان',
    bodyEn: 'Recite Surah Al-Fatihah and 3x Al-Ikhlas as a gift for parents & loved ones',
    bodyEs: 'Recitar Al-Fatiha y 3 veces Al-Ijlás por los padres y seres queridos',
    time: '16:30',
    days: [5],
    dhikrId: 'ahlul_qubur_fatiha',
    durationDays: null,
  },
  {
    id: 'preset_waqiah',
    badgeFa: '📖 برنامه هر شب',
    badgeEn: '📖 Nightly Habit (40 Days)',
    badgeEs: '📖 Hábito Nocturno (40 días)',
    titleFa: 'تلاوت سوره مبارکه واقعه (وسعت رزق)',
    titleEn: "Nightly Surah Al-Waqi'ah",
    titleEs: 'Sura Al-Wáqiah cada noche',
    bodyFa: 'توصیه امام صادق (ع): هر شب پس از نماز مغرب و عشاء پیش از خواب',
    bodyEn: 'Recite nightly after Maghrib/Isha for sustenance and peace',
    bodyEs: 'Recitar cada noche después de Magrib/Isha para bendición y sustento',
    time: '21:00',
    days: ALL_DAYS,
    dhikrId: 'surah_waqiah',
    durationDays: 40,
  },
  {
    id: 'preset_charity_90',
    badgeFa: '🌱 دوره ۳ ماهه (صدقه و نذر)',
    badgeEn: '🌱 90-Day Charity & Istighfar',
    badgeEs: '🌱 Caridad e Istighfar (90 días)',
    titleFa: 'صدقه و استغفار دوره‌ای (برنامه ۳ ماهه)',
    titleEn: 'Periodic Charity & Istighfar',
    titleEs: 'Caridad periódica e Istighfar',
    bodyFa: 'پرداخت صدقه و ذکر اللَّهُمَّ عَافِنَا وَاعْفُ عَنَّا برای دفع بلا و سلامتی خانواده',
    bodyEn: 'Give small charity and recite dua for family health and safety',
    bodyEs: 'Dar caridad y recitar súplica por la salud y protección familiar',
    time: '08:30',
    days: [0, 3, 6],
    dhikrId: 'fateminia_afina',
    durationDays: 90,
  },
  {
    id: 'preset_chilla_40',
    badgeFa: '✨ چله ۴۰ روزه معنوی',
    badgeEn: '✨ 40-Day Spiritual Challenge',
    badgeEs: '✨ Reto Espiritual de 40 días',
    titleFa: 'چله ۴۰ روزه دعای فرج و عاقبت‌به‌خیری',
    titleEn: '40-Day Morning Dua & Salawat',
    titleEs: '40 días de Salawat y súplica matutina',
    bodyFa: 'مداومت ۴۰ روزه بر ذکر اللَّهُمَّ سَلِّمْ وَ تَمِّمْ و دعای الهی عظم البلاء',
    bodyEn: 'Consistent 40-day morning remembrance for peace and blessings',
    bodyEs: 'Constancia de 40 días cada mañana para paz y bendiciones',
    time: '06:30',
    days: ALL_DAYS,
    dhikrId: 'fateminia_sallim',
    durationDays: 40,
  },
];

export function RemindersScreen() {
  const { theme } = useTheme();
  const { profile } = useAuth();
  const { lang, dir, isRtl, t, formatDigits } = useI18n();

  const [reminders, setReminders] = useState<LocalReminder[]>([]);
  const [surahAlarms, setSurahAlarms] = useState<SurahAlarmRecord[]>(() =>
    Object.values(loadSurahAlarms()).sort((a, b) => a.resolvedClock.localeCompare(b.resolvedClock))
  );
  const [activeTab, setActiveTab] = useState<'all' | 'surahs' | 'custom'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editingReminder, setEditingReminder] = useState<LocalReminder | null>(null);
  const [editingSurah, setEditingSurah] = useState<SurahAlarmRecord | null>(null);
  const [notifSupported, setNotifSupported] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [showMuhasaba, setShowMuhasaba] = useState(false);

  useBackHandler(showMuhasaba, () => setShowMuhasaba(false));
  useBackHandler(showAdd, () => setShowAdd(false));
  useBackHandler(Boolean(editingReminder), () => setEditingReminder(null));
  useBackHandler(Boolean(editingSurah), () => setEditingSurah(null));

  const notifEnabled = profile?.notif_enabled ?? getGuestNotifEnabled();

  const reloadSurahList = useCallback(() => {
    const list = Object.values(loadSurahAlarms()).sort((a, b) =>
      a.resolvedClock.localeCompare(b.resolvedClock)
    );
    setSurahAlarms(list);
  }, []);

  useEffect(() => {
    setNotifSupported(Capacitor.isNativePlatform());
    setReminders(loadReminders());
    reloadSurahList();
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
  }, [refreshKey, notifEnabled, reloadSurahList]);

  useEffect(() => {
    const onSurahChanged = () => reloadSurahList();
    window.addEventListener('noor-surah-alarm-changed', onSurahChanged);
    window.addEventListener('storage', onSurahChanged);
    return () => {
      window.removeEventListener('noor-surah-alarm-changed', onSurahChanged);
      window.removeEventListener('storage', onSurahChanged);
    };
  }, [reloadSurahList]);

  const refresh = () => setRefreshKey((k) => k + 1);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const handleToggle = async (id: string) => {
    await toggleReminder(id, notifEnabled);
    refresh();
  };

  const handleDelete = async (id: string) => {
    await deleteReminder(id);
    refresh();
  };

  const handleToggleSurahAlarm = async (rec: SurahAlarmRecord) => {
    const title = getSurahTitle(rec, lang);
    if (rec.enabled) {
      await cancelSurahNativeAlarm(rec.surahNumber);
      reloadSurahList();
      showToast('🔕 ' + title + ' — ' + t('rem.surahPaused'));
    } else {
      await scheduleSurahNativeAlarm({
        surahNumber: rec.surahNumber,
        surahNameFa: rec.surahNameFa,
        virtueFa: rec.virtueFa,
        anchor: rec.anchor,
        offsetMinutes: rec.offsetMinutes,
        customTime: rec.customTime,
        speed: rec.speed || 1,
      });
      reloadSurahList();
      showToast('🔔 ' + title + ' — ' + t('rem.surahActive') + ' (' + formatDigits(rec.resolvedClock) + ')');
    }
  };

  const handleDeleteSurahAlarm = async (rec: SurahAlarmRecord) => {
    const title = getSurahTitle(rec, lang);
    await deleteSurahNativeAlarm(rec.surahNumber);
    reloadSurahList();
    showToast('🗑️ ' + title + ' — ' + t('rem.surahDeleteBtn'));
  };

  const handleCheckCompletedToday = (r: LocalReminder) => {
    const done = toggleReminderCompletionOnDate(r.id);
    if (done && 'vibrate' in navigator) navigator.vibrate?.(15);
    showToast(done ? '✅ ' + r.title : r.title);
    refresh();
  };

  const handleQuickAddPreset = async (preset: SmartPresetItem) => {
    const title = lang === 'en' ? preset.titleEn : lang === 'es' ? preset.titleEs : preset.titleFa;
    const body = lang === 'en' ? preset.bodyEn : lang === 'es' ? preset.bodyEs : preset.bodyFa;
    const res = await createReminder({
      title,
      body,
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
    showToast('✨ ' + title);
    refresh();
  };

  const showSurahsSection = activeTab === 'all' || activeTab === 'surahs';
  const showCustomSection = activeTab === 'all' || activeTab === 'custom';

  return (
    <div className="w-full max-w-xl mx-auto px-3.5 pt-4 pb-28 animate-fade-in" dir={dir}>
      {showMuhasaba && <QuranAndMuhasabaModal initialMode="muhasaba" onClose={() => setShowMuhasaba(false)} />}
      {toast && (
        <div
          className="fixed top-4 inset-x-5 z-50 rounded-2xl px-4 py-3 text-xs font-bold text-center shadow-xl animate-fade-in"
          style={{ background: theme.primary, color: theme.bg }}
        >
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <h1 className="text-2xl font-black text-app">{t('rem.title')}</h1>
          <p className="text-muted text-xs mt-1">{t('rem.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="px-3.5 py-2.5 rounded-2xl flex items-center gap-1.5 text-xs font-bold shadow-md shrink-0"
          style={{ background: theme.primary, color: theme.bg }}
        >
          <Plus size={18} color={theme.bg} />
          <span>{t('rem.newBtn')}</span>
        </button>
      </div>

      {/* نوار فیلتر یکپارچه: همه / سوره‌های کوک‌شده / برنامه‌های من */}
      <div
        className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl border mb-4"
        style={{ background: theme.surface, borderColor: theme.border }}
      >
        {[
          { id: 'all' as const, label: t('rem.tabAll'), count: surahAlarms.length + reminders.length },
          { id: 'surahs' as const, label: t('rem.tabSurahs'), count: surahAlarms.length },
          { id: 'custom' as const, label: t('rem.tabCustom'), count: reminders.length },
        ].map((tabItem) => {
          const active = activeTab === tabItem.id;
          return (
            <button
              key={tabItem.id}
              type="button"
              onClick={() => setActiveTab(tabItem.id)}
              className="py-2 px-1 rounded-xl text-[11px] font-black transition-all truncate"
              style={{
                background: active ? theme.primary : 'transparent',
                color: active ? theme.bg : theme.textMuted,
              }}
            >
              {tabItem.label} ({formatDigits(tabItem.count)})
            </button>
          );
        })}
      </div>

      {/* ۱. بخش مدیریت یکپارچه سوره‌های کوک‌شده (نمایش مشخصات کامل + سوییچ + ویرایش + حذف) */}
      {showSurahsSection && (
        <section className="mb-5">
          <div className="flex items-center justify-between gap-2 mb-2 px-1">
            <span className="text-xs font-black text-accent flex items-center gap-1.5">
              <BookOpen size={14} color={theme.accent} />
              <span>{t('rem.surahSectionTitle')}</span>
            </span>
            {surahAlarms.length > 0 && (
              <span className="text-[10.5px] font-bold text-muted">
                {formatDigits(surahAlarms.filter((s) => s.enabled).length)} / {formatDigits(surahAlarms.length)}
              </span>
            )}
          </div>

          {surahAlarms.length === 0 ? (
            activeTab === 'surahs' && (
              <div className="card-flat p-6 text-center space-y-2">
                <Volume2 size={32} color={theme.textMuted} className="mx-auto opacity-40" />
                <p className="text-xs text-muted leading-relaxed">{t('rem.surahEmpty')}</p>
              </div>
            )
          ) : (
            <div className="space-y-2.5">
              {surahAlarms.map((rec) => {
                const title = getSurahTitle(rec, lang);
                const anchorDesc = describeSurahAnchor(rec, lang, formatDigits);
                return (
                  <div
                    key={rec.surahNumber}
                    className="rounded-3xl p-4 border space-y-2.5 transition-all"
                    style={{
                      background: rec.enabled
                        ? 'radial-gradient(circle at top left, color-mix(in srgb, ' + theme.accent + ' 14%, ' + theme.surface + '), ' + theme.surface + ')'
                        : theme.surface,
                      borderColor: rec.enabled ? theme.accent : theme.border,
                      opacity: rec.enabled ? 1 : 0.72,
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className="px-2 py-0.5 rounded-full text-[9.5px] font-black"
                            style={{
                              background: rec.enabled ? 'rgba(16, 185, 129, 0.18)' : 'rgba(148, 163, 184, 0.15)',
                              color: rec.enabled ? '#34d399' : theme.textMuted,
                            }}
                          >
                            {rec.enabled ? t('rem.surahActive') : t('rem.surahPaused')}
                          </span>
                          <span
                            className="px-2 py-0.5 rounded-full text-[9.5px] font-black inline-flex items-center gap-1"
                            style={{
                              background: 'color-mix(in srgb, ' + theme.accent + ' 18%, transparent)',
                              color: theme.accent,
                            }}
                          >
                            <Gauge size={10} /> {t('rem.surahSpeed')}: {rec.speed || 1}x
                          </span>
                        </div>
                        <h3 className="text-sm font-black text-app mt-1.5">{title}</h3>
                        <p className="text-xs font-bold text-primary mt-1 flex items-center gap-1.5">
                          <Clock size={13} color={theme.primary} />
                          <span>{anchorDesc}</span>
                        </p>
                        <p className="text-[10.5px] text-muted mt-0.5">{t('rem.surahFullBadge')}</p>
                      </div>

                      {/* سوییچ روشن/خاموش موقت */}
                      <button
                        type="button"
                        aria-pressed={rec.enabled}
                        onClick={() => void handleToggleSurahAlarm(rec)}
                        className="w-11 h-6 rounded-full transition-all relative shrink-0 mt-1"
                        style={{
                          background: rec.enabled
                            ? theme.primary
                            : `color-mix(in srgb, ${theme.textMuted} 25%, transparent)`,
                        }}
                      >
                        <div
                          className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                          style={isRtl ? { right: rec.enabled ? '2px' : '22px' } : { left: rec.enabled ? '22px' : '2px' }}
                        />
                      </button>
                    </div>

                    <div
                      className="flex items-center justify-between gap-2 pt-2.5 border-t"
                      style={{ borderColor: theme.border }}
                    >
                      <button
                        type="button"
                        onClick={() => setEditingSurah(rec)}
                        className="px-3 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1.5 border"
                        style={{
                          borderColor: 'color-mix(in srgb, ' + theme.primary + ' 45%, ' + theme.border + ')',
                          background: 'color-mix(in srgb, ' + theme.primary + ' 12%, transparent)',
                          color: theme.primary,
                        }}
                      >
                        <Pencil size={12} />
                        <span>{t('rem.surahEditBtn')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleDeleteSurahAlarm(rec)}
                        className="px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1"
                        style={{ color: '#fca5a5', background: 'rgba(239, 68, 68, 0.1)' }}
                      >
                        <Trash2 size={12} />
                        <span>{t('rem.surahDeleteBtn')}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ۲. بخش دفترچه خلوت، قالب‌های سریع و یادآورهای شخصی */}
      {showCustomSection && (
        <>
          <div className="card-flat p-3.5 mb-4 flex items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-app block">{t('rem.muhasabaTitle')}</span>
              <span className="text-[11px] text-muted">{t('rem.muhasabaDesc')}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowMuhasaba(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold shrink-0"
              style={{ background: `color-mix(in srgb, ${theme.accent} 18%, transparent)`, color: theme.accent }}
            >
              {isRtl ? t('rem.muhasabaBtn') + ' ←' : t('rem.muhasabaBtn') + ' →'}
            </button>
          </div>

          <div className="mb-5">
            <div className="flex items-center gap-1.5 mb-2 px-1">
              <Sparkles size={13} color={theme.primary} />
              <span className="text-xs font-bold text-app">{t('rem.presetsHeader')}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SMART_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => void handleQuickAddPreset(preset)}
                  className={'card-flat p-3 transition-transform active:scale-[0.98] flex flex-col justify-between ' + (isRtl ? 'text-right' : 'text-left')}
                >
                  <span className="text-[10px] font-bold text-primary mb-1 block">
                    {lang === 'en' ? preset.badgeEn : lang === 'es' ? preset.badgeEs : preset.badgeFa}
                  </span>
                  <p className="text-app font-bold text-xs leading-snug line-clamp-2">
                    {lang === 'en' ? preset.titleEn : lang === 'es' ? preset.titleEs : preset.titleFa}
                  </p>
                  <span className="text-[10px] text-muted mt-1.5 block" dir="ltr">
                    ⏰ {formatDigits(preset.time)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {!notifSupported && (
            <div className="flex items-start gap-2 p-3 rounded-xl mb-4" style={{ background: `color-mix(in srgb, ${theme.accent} 10%, transparent)` }}>
              <AlertCircle size={14} color={theme.accent} className="flex-shrink-0 mt-0.5" />
              <p className="text-muted text-xs leading-relaxed">{t('rem.androidNote')}</p>
            </div>
          )}

          {reminders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Bell size={40} color={theme.textMuted} className="opacity-30 mb-3" />
              <p className="text-muted text-sm">{t('rem.emptyTitle')}</p>
              <p className="text-muted text-xs mt-1 opacity-60 text-center">{t('rem.emptyDesc')}</p>
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
                    style={{ borderColor: doneToday ? theme.primary : undefined }}
                    onClick={() => setEditingReminder(r)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <button
                        type="button"
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
                            <span className="text-primary font-bold text-xs" dir="ltr">{formatDigits(r.time)}</span>
                          </div>
                          {totalDoneDays > 0 && (
                            <span className="text-[11px] font-bold text-accent">
                              {t('rem.doneDaysPrefix')} {formatDigits(totalDoneDays)} {t('rem.doneDaysSuffix')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
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
                            style={isRtl ? { right: r.enabled ? '2px' : '22px' } : { left: r.enabled ? '22px' : '2px' }}
                          />
                        </button>
                      </div>
                    </div>

                    {duration && chillaProgress !== null && (
                      <div className="mt-2.5 pt-2 border-t" style={{ borderColor: theme.border }}>
                        <div className="flex justify-between text-[10px] text-muted mb-1">
                          <span>{t('rem.progressLabel')} ({formatDigits(duration)})</span>
                          <span className="font-bold text-primary">
                            {formatDigits(totalDoneDays)} / {formatDigits(duration)} ({formatDigits(chillaProgress)}%)
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `color-mix(in srgb, ${theme.primary} 12%, transparent)` }}>
                          <div className="h-full rounded-full" style={{ width: `${chillaProgress}%`, background: theme.primary }} />
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
                            {getLocalizedDay(d, lang)}
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
                      <Trash2 size={12} /> {t('rem.deleteProgram')}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
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

      {editingSurah && (
        <EditSurahAlarmModal
          record={editingSurah}
          onClose={() => setEditingSurah(null)}
          onSaved={(msg) => {
            setEditingSurah(null);
            reloadSurahList();
            showToast(msg);
          }}
        />
      )}
    </div>
  );
}

function EditSurahAlarmModal({
  record,
  onClose,
  onSaved,
}: {
  record: SurahAlarmRecord;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const { theme } = useTheme();
  const { lang, dir, t, formatDigits } = useI18n();
  const [anchor, setAnchor] = useState<SurahAlarmAnchor>(record.anchor);
  const [offsetMinutes, setOffsetMinutes] = useState<number>(record.offsetMinutes || 30);
  const [customTime, setCustomTime] = useState<string>(record.customTime || record.resolvedClock || '21:30');
  const [speed, setSpeed] = useState<number>(record.speed || 1);
  const [saving, setSaving] = useState(false);

  const surahTitle = getSurahTitle(record, lang);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { record: updated } = await scheduleSurahNativeAlarm({
        surahNumber: record.surahNumber,
        surahNameFa: record.surahNameFa,
        virtueFa: record.virtueFa,
        anchor,
        offsetMinutes,
        customTime,
        speed,
      });
      onSaved('✅ ' + surahTitle + ' · ' + formatDigits(updated.resolvedClock) + ' · ' + updated.speed + 'x');
    } finally {
      setSaving(false);
    }
  };

  const node = (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)' }}
      dir={dir}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl p-5 border shadow-2xl space-y-4"
        style={{ background: theme.surface, borderColor: theme.border }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: theme.border }}>
          <div>
            <h3 className="text-base font-black text-app">{t('rem.surahEditTitle')}</h3>
            <p className="text-xs font-bold text-primary mt-0.5">{surahTitle}</p>
          </div>
          <button type="button" onClick={onClose} className="text-muted p-1">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {[
            { id: 'maghrib' as const, label: t('rem.surahAnchorMaghrib') },
            { id: 'fajr' as const, label: t('rem.surahAnchorFajr') },
            { id: 'dhuhr' as const, label: t('rem.surahAnchorDhuhr') },
            { id: 'custom' as const, label: t('rem.surahAnchorCustom') },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setAnchor(opt.id)}
              className="py-2.5 px-2 rounded-xl text-[11px] font-bold border"
              style={{
                borderColor: anchor === opt.id ? theme.accent : theme.border,
                background:
                  anchor === opt.id
                    ? 'color-mix(in srgb, ' + theme.accent + ' 18%, transparent)'
                    : theme.bg,
                color: anchor === opt.id ? theme.accent : theme.textMuted,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {anchor !== 'custom' ? (
          <div className="space-y-1.5">
            <label className="text-xs text-muted font-bold block">{t('rem.surahOffsetLabel')}</label>
            <div className="grid grid-cols-4 gap-1.5">
              {[15, 30, 45, 60].map((min) => (
                <button
                  key={min}
                  type="button"
                  onClick={() => setOffsetMinutes(min)}
                  className="py-2 rounded-xl text-xs font-bold border"
                  style={{
                    borderColor: offsetMinutes === min ? theme.primary : theme.border,
                    background: offsetMinutes === min ? theme.primary : theme.bg,
                    color: offsetMinutes === min ? theme.bg : theme.textMuted,
                  }}
                >
                  +{formatDigits(min)} {t('common.minutes')}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs text-muted font-bold">{t('rem.surahCustomClockLabel')}</label>
            <input
              type="time"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              dir="ltr"
              className="px-3.5 py-2 rounded-xl text-sm font-bold text-app border outline-none"
              style={{ borderColor: theme.border, background: theme.bg }}
            />
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs text-muted font-bold flex items-center gap-1.5">
            <Gauge size={13} color={theme.accent} />
            <span>{t('rem.surahSpeedLabel')}</span>
          </label>
          <div className="grid grid-cols-5 gap-1.5" dir="ltr">
            {PLAYBACK_SPEEDS.map((spd) => {
              const active = Math.abs(speed - spd) < 0.01;
              return (
                <button
                  key={spd}
                  type="button"
                  onClick={() => setSpeed(spd)}
                  className="py-2 rounded-xl text-xs font-black border"
                  style={{
                    borderColor: active ? theme.accent : theme.border,
                    background: active ? theme.accent : theme.bg,
                    color: active ? theme.bg : theme.textMuted,
                  }}
                >
                  {spd}x
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="w-full py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md disabled:opacity-60"
          style={{ background: theme.primary, color: theme.bg }}
        >
          <Check size={16} />
          <span>{saving ? t('rem.saving') : t('rem.surahSaveChanges')}</span>
        </button>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(node, document.body) : node;
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
  const { lang, dir, t, formatDigits } = useI18n();
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
        if (!body.trim()) setBody(found.translation + ' (' + formatDigits(found.count) + ')');
      }
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      setError(t('rem.errTitle'));
      return;
    }
    if (type === 'recurring' && days.length === 0) {
      setError(t('rem.errDays'));
      return;
    }
    if (type === 'once' && !date) {
      setError(t('rem.errDate'));
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
      setError(result.schedule.error ?? t('auth.errGeneric'));
      return;
    }

    onCreated();
  };

  const modalNode = (
    <div
      className="fixed inset-0 z-[999] overflow-y-auto flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(6px)' }}
      dir={dir}
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
            {initialReminder ? t('rem.modalTitleEdit') : t('rem.modalTitleNew')}
          </h2>
          <button type="button" onClick={onClose} className="text-muted p-1">
            <X size={22} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-muted text-xs font-bold mb-1.5 block">{t('rem.selectDhikrLabel')}</label>
            <select
              value={dhikrId ?? ''}
              onChange={(e) => handleSelectDhikr(e.target.value)}
              className="w-full px-3.5 py-3 rounded-2xl text-xs font-medium text-app border outline-none"
              style={{ borderColor: theme.border, background: theme.bg }}
            >
              <option value="">{t('rem.noDhikrOpt')}</option>
              {dhikrItems.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.arabic.slice(0, 32)} — {d.translation.slice(0, 36)} ({formatDigits(d.count)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-muted text-xs font-bold mb-1.5 block">{t('rem.fieldTitle')}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('rem.fieldTitlePh')}
              className="w-full px-4 py-3 rounded-2xl text-sm text-app border outline-none"
              style={{ borderColor: theme.border, background: theme.bg }}
            />
          </div>

          <div>
            <label className="text-muted text-xs font-bold mb-1.5 block">{t('rem.fieldBody')}</label>
            <input
              type="text"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t('rem.fieldBodyPh')}
              className="w-full px-4 py-2.5 rounded-2xl text-xs text-app border outline-none"
              style={{ borderColor: theme.border, background: theme.bg }}
            />
          </div>

          <div>
            <label className="text-muted text-xs font-bold mb-1.5 block">{t('rem.fieldDuration')}</label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: t('rem.durForever'), val: null },
                { label: t('rem.dur30'), val: 30 },
                { label: t('rem.dur40'), val: 40 },
                { label: t('rem.dur90'), val: 90 },
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
              <Repeat size={14} /> {t('rem.typeRecurring')}
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
              <Calendar size={14} /> {t('rem.typeOnce')}
            </button>
          </div>

          <div>
            <label className="text-muted text-xs font-bold mb-1.5 block">{t('rem.fieldTime')}</label>
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
                <label className="text-muted text-xs font-bold">{t('rem.fieldDays')}</label>
                <button
                  type="button"
                  onClick={() => setDays(ALL_DAYS)}
                  className="text-xs font-bold text-primary"
                >
                  {t('rem.allDaysBtn')}
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
                    {getLocalizedDay(d, lang)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {type === 'once' && (
            <div>
              <label className="text-muted text-xs font-bold mb-1.5 block">{t('rem.fieldDate')}</label>
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
                      } catch {}
                    }}
                    className="mt-2 rounded-lg px-3 py-2 text-xs font-bold"
                    style={{ background: 'rgba(239,68,68,0.2)', color: '#fecaca' }}
                  >
                    Settings
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
            <span>{loading ? t('rem.saving') : initialReminder ? t('rem.saveEdit') : t('rem.saveNew')}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode;
}
