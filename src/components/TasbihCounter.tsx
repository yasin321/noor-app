import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Capacitor, registerPlugin } from '@capacitor/core';

interface TasbihNativeFeedback {
  vibrateTick(opts: { kind: 'bead' | 'milestone' | 'complete' }): Promise<void>;
  playBeadClick(opts: { kind: 'bead' | 'milestone' | 'complete' }): Promise<void>;
}
const NoorTasbihFeedback = registerPlugin<TasbihNativeFeedback>('NoorAlarm');
import {
  RotateCcw,
  BookOpen,
  Award,
  Volume2,
  VolumeX,
  Vibrate,
  Moon,
  X,
  Undo2,
  Hand,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useI18n } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { useTasbih } from '@/hooks/useTasbih';
import { getAllDhikr } from '@/lib/dhikrLibrary';
import { toFaDigits } from '@/lib/jalali';
import type { Tab } from '@/components/BottomNav';

const TARGET_PRESETS = [14, 33, 34, 40, 70, 100];
const PREFS_KEY = 'noor_tasbih_pro_prefs_v1';

interface TasbihPrefs {
  soundEnabled: boolean;
  hapticEnabled: boolean;
  multiFingerMode: 'each' | 'single'; // each = هر انگشت ۱ ذکر (۲ انگشت=+۲، ۳ انگشت=+۳) | single = تک‌شمارش
}

interface TapRipple {
  id: number;
  x: number;
  y: number;
  label: string;
  gold?: boolean;
}

function loadTasbihPrefs(): TasbihPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        soundEnabled: typeof p.soundEnabled === 'boolean' ? p.soundEnabled : true,
        hapticEnabled: typeof p.hapticEnabled === 'boolean' ? p.hapticEnabled : true,
        multiFingerMode: p.multiFingerMode === 'single' ? 'single' : 'each',
      };
    }
  } catch {}
  return { soundEnabled: true, hapticEnabled: true, multiFingerMode: 'each' };
}

function saveTasbihPrefs(p: TasbihPrefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {}
}

// موتور صوتی سبک WebAudio (صفر کیلوبایت) برای صدای طبیعی و آرامش‌بخش دانه تسبیح
let sharedAudioCtx: AudioContext | null = null;
function triggerNativeHaptic(type: 'bead' | 'milestone' | 'complete') {
  if (Capacitor.isNativePlatform()) {
    void NoorTasbihFeedback.vibrateTick({ kind: type }).catch(() => {});
    return;
  }
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      if (type === 'complete') navigator.vibrate([45, 55, 115]);
      else if (type === 'milestone') navigator.vibrate([30, 45, 70]);
      else navigator.vibrate(18);
    } catch {}
  }
}

function playTasbihBeadTone(type: 'bead' | 'milestone' | 'complete') {
  if (Capacitor.isNativePlatform()) {
    void NoorTasbihFeedback.playBeadClick({ kind: type }).catch(() => {});
    return;
  }
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    if (!sharedAudioCtx) sharedAudioCtx = new Ctx();
    if (sharedAudioCtx.state === 'suspended') {
      void sharedAudioCtx.resume();
    }
    const ctx = sharedAudioCtx;
    const now = ctx.currentTime;

    if (type === 'bead') {
      // صدای تق ظریف و چوبی/کهربایی دانه تسبیح
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(680, now);
      osc.frequency.exponentialRampToValueAtTime(210, now + 0.038);
      gain.gain.setValueAtTime(0.42, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'milestone') {
      // زنگ آرامش بخش در مضرب‌های ۳۳ و ۳۴
      [523.25, 659.25].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.30, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.24);
      });
    } else {
      // نوای ملایم اتمام کامل دور
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.075);
        gain.gain.setValueAtTime(0.32, now + idx * 0.075);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.075 + 0.36);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.075);
        osc.stop(now + idx * 0.075 + 0.38);
      });
    }
  } catch {}
}

export function TasbihCounter({ onNavigate }: { onNavigate?: (t: Tab) => void }) {
  const { theme } = useTheme();
  const { lang, dir, t, formatDigits } = useI18n();
  const { user } = useAuth();
  const { session, start, increment, decrement, reset } = useTasbih(user?.id ?? null);
  const dhikrItems = useMemo(() => getAllDhikr(), []);
  const activeDhikr = useMemo(
    () => dhikrItems.find((d) => d.id === session.dhikrId) ?? dhikrItems[0],
    [session.dhikrId, dhikrItems]
  );

  const [prefs, setPrefs] = useState<TasbihPrefs>(() => loadTasbihPrefs());
  const [tapPulse, setTapPulse] = useState(false);
  const [celebrateBanner, setCelebrateBanner] = useState(false);
  const [sanctuaryMode, setSanctuaryMode] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [ripples, setRipples] = useState<TapRipple[]>([]);
  const [activeFingersCount, setActiveFingersCount] = useState(0);
  const [multiBadge, setMultiBadge] = useState<string | null>(null);

  // رف‌های مدیریت دقیق چندانگشتی بدون تداخل با onClick و سوایپ
  const activePointersRef = useRef<Set<number>>(new Set());
  const lastPointerTapTsRef = useRef<number>(0);
  const lastSingleModeTapTsRef = useRef<number>(0);
  const burstCountRef = useRef<number>(0);
  const burstTimerRef = useRef<number | null>(null);
  const rippleIdRef = useRef<number>(1);
  const sessionRef = useRef(session);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    if (!session.dhikrId && activeDhikr) {
      start(activeDhikr.id, activeDhikr.count);
    }
  }, [session.dhikrId, activeDhikr, start]);

  useEffect(() => {
    if (!confirmReset) return;
    const t = window.setTimeout(() => setConfirmReset(false), 3200);
    return () => window.clearTimeout(t);
  }, [confirmReset]);

  const updatePrefs = useCallback((patch: Partial<TasbihPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      saveTasbihPrefs(next);
      return next;
    });
  }, []);

  const spawnRipple = useCallback((x: number, y: number, gold = false) => {
    const id = rippleIdRef.current++;
    setRipples((prev) => [...prev.slice(-9), { id, x, y, label: '+۱', gold }]);
    window.setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 520);
  }, []);

  const triggerSingleCount = useCallback(
    (localX?: number, localY?: number) => {
      const curSession = sessionRef.current;
      if (!curSession.dhikrId && activeDhikr) {
        start(activeDhikr.id, activeDhikr.count);
      }

      const target = curSession.target > 0 ? curSession.target : activeDhikr.count;
      const nextCount = curSession.count + 1;
      const willCompleteRound = target > 0 && nextCount >= target;
      const isMilestone =
        !willCompleteRound && (nextCount === 33 || nextCount === 34 || nextCount === 66 || nextCount === 67);

      increment();
      setConfirmReset(false);
      setTapPulse(true);
      window.setTimeout(() => setTapPulse(false), 75);

      if (typeof localX === 'number' && typeof localY === 'number') {
        spawnRipple(localX, localY, willCompleteRound || isMilestone);
      }

      if (prefs.soundEnabled) {
        playTasbihBeadTone(willCompleteRound ? 'complete' : isMilestone ? 'milestone' : 'bead');
      }

      if (prefs.hapticEnabled) {
        triggerNativeHaptic(willCompleteRound ? 'complete' : isMilestone ? 'milestone' : 'bead');
      }

      if (willCompleteRound) {
        setCelebrateBanner(true);
        window.setTimeout(() => setCelebrateBanner(false), 3400);
      }
    },
    [activeDhikr, increment, prefs.hapticEnabled, prefs.soundEnabled, spawnRipple, start]
  );

  // هندلر چندانگشتی واقعی (Pointer Events): پشتیبانی هم‌زمان از ۱، ۲، ۳، ۴ و ۵ انگشت
  const handlePadPointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      e.stopPropagation();

      activePointersRef.current.add(e.pointerId);
      const fingersNow = activePointersRef.current.size;
      setActiveFingersCount(fingersNow);
      lastPointerTapTsRef.current = performance.now();

      // در حالت تک‌شمارش (single)، ضربه هم‌زمان چند انگشت در بازه ۱۱۰ میلی‌ثانیه فقط ۱ ذکر حساب می‌شود
      if (prefs.multiFingerMode === 'single') {
        const now = performance.now();
        if (now - lastSingleModeTapTsRef.current < 110) {
          return;
        }
        lastSingleModeTapTsRef.current = now;
      }

      const rect = e.currentTarget.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const relY = e.clientY - rect.top;

      triggerSingleCount(relX, relY);

      // تشخیص ضربه چندانگشتی هم‌زمان برای نمایش بج ظریف (+۲ انگشت / +۳ انگشت)
      burstCountRef.current += 1;
      if (burstCountRef.current >= 2) {
        setMultiBadge('+' + formatDigits(burstCountRef.current) + ' ' + t('tasbih.multiBadgeSuffix'));
      }
      if (burstTimerRef.current) window.clearTimeout(burstTimerRef.current);
      burstTimerRef.current = window.setTimeout(() => {
        burstCountRef.current = 0;
        setMultiBadge(null);
      }, 420);
    },
    [prefs.multiFingerMode, triggerSingleCount]
  );

  const handlePadPointerRelease = useCallback((e: React.PointerEvent<HTMLElement>) => {
    activePointersRef.current.delete(e.pointerId);
    setActiveFingersCount(activePointersRef.current.size);
  }, []);

  // پشتیبانی کامل از کلیک کیبورد و تست‌های خودکار Playwright (بدون شمارش دوبل بعد از pointerdown)
  const handlePadClick = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (performance.now() - lastPointerTapTsRef.current < 450) {
        return;
      }
      const rect = e.currentTarget.getBoundingClientRect();
      triggerSingleCount(rect.width / 2, rect.height / 2);
    },
    [triggerSingleCount]
  );

  const handlePresetTarget = (newTarget: number) => {
    start(activeDhikr.id, newTarget);
    setConfirmReset(false);
  };

  const handleSafeReset = () => {
    if (session.count === 0) return;
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    reset();
    setConfirmReset(false);
  };

  const targetVal = session.target > 0 ? session.target : activeDhikr.count;
  const progress = targetVal > 0 ? Math.min(100, (session.count / targetVal) * 100) : 0;
  const totalInSession = session.completed * targetVal + session.count;
  const circumference = 2 * Math.PI * 120;
  const dashOffset = circumference - (progress / 100) * circumference;

  const stepHint = useMemo(() => {
    const mk = (step: number, arabic: string, cur: number, tot: number) =>
      lang === 'fa'
        ? 'مرحله ' + toFaDigits(step) + ': ' + arabic + ' (' + toFaDigits(cur) + ' از ' + toFaDigits(tot) + ')'
        : (lang === 'es' ? 'Paso ' : 'Step ') + step + ': ' + arabic + ' (' + cur + '/' + tot + ')';
    if (activeDhikr.id === 'farahzad_work_tasbih') {
      if (session.count < 33) return mk(1, 'سُبْحَانَ اللَّهِ', session.count + 1, 33);
      if (session.count < 66) return mk(2, 'الْحَمْدُ لِلَّهِ', session.count - 33 + 1, 33);
      return mk(3, 'اللَّهُ أَكْبَرُ', session.count - 66 + 1, 34);
    }
    if (activeDhikr.id.includes('zahra') || (targetVal === 100 && activeDhikr.arabic.includes('اللَّهُ أَكْبَرُ'))) {
      if (session.count < 34) return mk(1, 'اللَّهُ أَكْبَرُ', session.count + 1, 34);
      if (session.count < 67) return mk(2, 'الْحَمْدُ لِلَّهِ', session.count - 34 + 1, 33);
      return mk(3, 'سُبْحَانَ اللَّهِ', session.count - 67 + 1, 33);
    }
    return null;
  }, [activeDhikr.id, activeDhikr.arabic, session.count, targetVal, lang]);

  // محاسبه مختصات ۱۱ دانه تسبیح متحرک روی قوس بالایی
  const beadArcItems = useMemo(() => {
    const count = 11;
    const shift = (session.count % 11) / 11;
    return Array.from({ length: count }, (_, idx) => {
      const normalized = (idx + shift) / count; // 0 .. 1
      const angleDeg = 205 + normalized * 130; // قوس بالایی صفحه
      const rad = (angleDeg * Math.PI) / 180;
      const r = 132;
      const cx = 144 + Math.cos(rad) * r;
      const cy = 144 + Math.sin(rad) * r;
      const isCenterBead = Math.abs(angleDeg - 270) < 16;
      const distFromEdge = Math.min(normalized, 1 - normalized);
      const opacity = Math.min(1, distFromEdge * 6.5);
      return { idx, cx, cy, isCenterBead, opacity };
    });
  }, [session.count]);

  return (
    <div
      className="w-full max-w-xl mx-auto px-3.5 pt-3.5 pb-32 animate-fade-in min-h-screen"
      dir={dir}
      data-no-swipe="true"
    >
      <div className="max-w-md mx-auto space-y-3">
        {/* هدر خلوت + ابزارک‌های سریع (صدا، ویبره، حالت خلوت، تغییر ذکر) */}
        <header className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold" style={{ color: theme.accent }}>
              {t('tasbih.subtitle')}
            </p>
            <h1 className="text-2xl font-black text-app">{t('tasbih.title')}</h1>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                const next = !prefs.soundEnabled;
                updatePrefs({ soundEnabled: next });
                if (next) playTasbihBeadTone('bead');
              }}
              aria-label="تغییر صدای دانه تسبیح"
              title="صدای دانه تسبیح"
              className="w-9 h-9 rounded-xl border flex items-center justify-center transition-all active:scale-95"
              style={{
                background: prefs.soundEnabled ? 'color-mix(in srgb, ' + theme.primary + ' 16%, transparent)' : 'transparent',
                borderColor: prefs.soundEnabled ? 'color-mix(in srgb, ' + theme.primary + ' 45%, transparent)' : theme.border,
                color: prefs.soundEnabled ? theme.primary : theme.textMuted,
              }}
            >
              {prefs.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            <button
              type="button"
              onClick={() => {
                const next = !prefs.hapticEnabled;
                updatePrefs({ hapticEnabled: next });
                if (next) triggerNativeHaptic('bead');
              }}
              aria-label="تغییر لرزش لمسی"
              title="ویبره لمسی"
              className="w-9 h-9 rounded-xl border flex items-center justify-center transition-all active:scale-95"
              style={{
                background: prefs.hapticEnabled ? 'color-mix(in srgb, ' + theme.primary + ' 16%, transparent)' : 'transparent',
                borderColor: prefs.hapticEnabled ? 'color-mix(in srgb, ' + theme.primary + ' 45%, transparent)' : theme.border,
                color: prefs.hapticEnabled ? theme.primary : theme.textMuted,
              }}
            >
              <Vibrate size={16} />
            </button>

            <button
              type="button"
              onClick={() => setSanctuaryMode(true)}
              aria-label="حالت خلوت تمام‌صفحه"
              title="حالت خلوت تمام‌صفحه"
              className="px-2.5 h-9 rounded-xl border flex items-center gap-1 text-[11px] font-black transition-all active:scale-95"
              style={{
                background: 'color-mix(in srgb, ' + theme.accent + ' 14%, transparent)',
                borderColor: 'color-mix(in srgb, ' + theme.accent + ' 40%, transparent)',
                color: theme.accent,
              }}
            >
              <Moon size={14} />
              <span>{t('tasbih.sanctuaryBtn')}</span>
            </button>

            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('library')}
                className="px-2.5 h-9 rounded-xl text-[11px] font-black flex items-center gap-1 border"
                style={{
                  background: 'color-mix(in srgb, ' + theme.primary + ' 14%, transparent)',
                  borderColor: 'color-mix(in srgb, ' + theme.primary + ' 38%, ' + theme.border + ')',
                  color: theme.primary,
                }}
              >
                <BookOpen size={14} />
                <span>{t('tasbih.changeDhikr')}</span>
              </button>
            )}
          </div>
        </header>

        {/* بنر تبریک اتمام دور */}
        {celebrateBanner && (
          <div
            className="p-3 rounded-2xl border flex items-center justify-between gap-2 animate-fade-in shadow-lg"
            style={{
              background: 'color-mix(in srgb, ' + theme.primary + ' 22%, ' + theme.surface + ')',
              borderColor: theme.primary,
            }}
          >
            <div className="flex items-center gap-2">
              <Award size={19} color={theme.primary} />
              <span className="text-xs font-black text-app">
                {t('tasbih.celebratePrefix')} {formatDigits(session.completed)} {t('tasbih.celebrateSuffix')}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCelebrateBanner(false)}
              className="text-[11px] font-black text-primary"
            >
              الهی آمین
            </button>
          </div>
        )}

        {/* کارت اصلی ذکرشمار چندانگشتی */}
        <section
          data-no-swipe="true"
          className="rounded-[30px] p-4 text-center overflow-hidden relative border"
          style={{
            background:
              'radial-gradient(circle at 50% 0%, color-mix(in srgb, ' +
              theme.primary +
              ' 18%, transparent), ' +
              theme.surface +
              ')',
            borderColor: 'color-mix(in srgb, ' + theme.primary + ' 30%, ' + theme.border + ')',
            boxShadow: '0 16px 40px color-mix(in srgb, ' + theme.primary + ' 12%, transparent)',
          }}
        >
          {/* متن عربی و ترجمه ذکر */}
          <p className="text-app text-xl font-black leading-relaxed mt-0.5">{activeDhikr.arabic}</p>
          <p className="text-muted text-xs mt-1 leading-relaxed">{activeDhikr.translation}</p>

          {stepHint && (
            <div
              className="mt-2 inline-block px-3.5 py-1 rounded-xl text-xs font-black"
              style={{
                background: 'color-mix(in srgb, ' + theme.accent + ' 20%, transparent)',
                color: theme.accent,
              }}
            >
              {stepHint}
            </div>
          )}

          {/* انتخاب سریع هدف دور */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3">
            {TARGET_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handlePresetTarget(preset)}
                className="px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all"
                style={{
                  background:
                    targetVal === preset
                      ? theme.primary
                      : 'color-mix(in srgb, ' + theme.primary + ' 10%, transparent)',
                  color: targetVal === preset ? theme.bg : theme.textMuted,
                }}
              >
                {formatDigits(preset)}
              </button>
            ))}
          </div>

          {/* انتخاب حالت چندانگشتی (۱ تا ۵ انگشت هم‌زمان بدون سوایپ صفحه) */}
          <div className="flex items-center justify-center mt-2.5">
            <button
              type="button"
              onClick={() =>
                updatePrefs({
                  multiFingerMode: prefs.multiFingerMode === 'each' ? 'single' : 'each',
                })
              }
              className="px-3 py-1 rounded-full border text-[11px] font-bold flex items-center gap-1.5 transition-all active:scale-95"
              style={{
                background:
                  prefs.multiFingerMode === 'each'
                    ? 'color-mix(in srgb, ' + theme.accent + ' 14%, transparent)'
                    : 'rgba(255,255,255,0.04)',
                borderColor:
                  prefs.multiFingerMode === 'each'
                    ? 'color-mix(in srgb, ' + theme.accent + ' 45%, transparent)'
                    : theme.border,
                color: prefs.multiFingerMode === 'each' ? theme.accent : theme.textMuted,
              }}
            >
              <Hand size={13} />
              <span>
                {prefs.multiFingerMode === 'each'
                  ? t('tasbih.multiOn')
                  : t('tasbih.multiOff')}
              </span>
            </button>
          </div>

          {/* صفحه مرکزی تسبیح با قوس دانه‌های متحرک + موتور Multi-Touch */}
          <div className="flex justify-center my-4">
            <div
              className="relative flex items-center justify-center"
              style={{ width: 'min(82vw, 304px)', height: 'min(82vw, 304px)' }}
            >
              {/* حلقه پیشرفت + رشته دانه‌های متحرک تسبیح */}
              <svg
                className="absolute inset-0 pointer-events-none"
                width="100%"
                height="100%"
                viewBox="0 0 288 288"
                aria-hidden="true"
              >
                <defs>
                  <radialGradient id="noorBeadGrad" cx="35%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#FEF08A" />
                    <stop offset="55%" stopColor={theme.accent} />
                    <stop offset="100%" stopColor={theme.primary} />
                  </radialGradient>
                </defs>

                {/* قوس دانه‌های متحرک تسبیح */}
                {beadArcItems.map((b) => (
                  <circle
                    key={b.idx}
                    cx={b.cx}
                    cy={b.cy}
                    r={b.isCenterBead ? 6.2 : 4.2}
                    fill={b.isCenterBead ? 'url(#noorBeadGrad)' : theme.primary}
                    opacity={b.opacity * (b.isCenterBead ? 0.95 : 0.45)}
                  />
                ))}

                {/* حلقه پیشرفت دور فعلی */}
                <g transform="rotate(-90 144 144)">
                  <circle
                    cx="144"
                    cy="144"
                    r="120"
                    fill="none"
                    stroke={theme.border}
                    strokeWidth="9"
                    opacity="0.38"
                  />
                  <circle
                    cx="144"
                    cy="144"
                    r="120"
                    fill="none"
                    stroke={theme.primary}
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    style={{ transition: 'stroke-dashoffset 85ms ease-out' }}
                  />
                </g>
              </svg>

              {/* دکمه لمسی بزرگ چندانگشتی (touch-action: none برای مسدودسازی کامل سوایپ و زوم) */}
              <button
                type="button"
                data-no-swipe="true"
                onPointerDown={handlePadPointerDown}
                onPointerUp={handlePadPointerRelease}
                onPointerCancel={handlePadPointerRelease}
                onClick={handlePadClick}
                aria-label="افزودن یک شمارش ذکر"
                className={
                  'relative rounded-full flex flex-col items-center justify-center select-none overflow-hidden transition-transform duration-75 ' +
                  (tapPulse ? 'scale-[0.955]' : '')
                }
                style={{
                  width: 'min(67vw, 246px)',
                  height: 'min(67vw, 246px)',
                  background:
                    'radial-gradient(circle at 35% 24%, color-mix(in srgb, ' +
                    theme.primary +
                    ' 30%, ' +
                    theme.surface +
                    '), ' +
                    theme.bg +
                    ')',
                  border: '2px solid color-mix(in srgb, ' + theme.primary + ' 62%, transparent)',
                  boxShadow:
                    activeFingersCount >= 2
                      ? 'inset 0 6px 32px color-mix(in srgb, ' + theme.accent + ' 28%, transparent), 0 0 34px color-mix(in srgb, ' + theme.accent + ' 32%, transparent)'
                      : 'inset 0 4px 26px color-mix(in srgb, ' + theme.primary + ' 20%, transparent), 0 12px 32px color-mix(in srgb, ' + theme.primary + ' 18%, transparent)',
                  touchAction: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  WebkitUserSelect: 'none',
                }}
              >
                {/* امواج نوری چندنقطه‌ای دقیقاً زیر نوک هر انگشت */}
                {ripples.map((rp) => (
                  <span
                    key={rp.id}
                    className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full animate-ping"
                    style={{
                      left: rp.x,
                      top: rp.y,
                      width: 64,
                      height: 64,
                      background: rp.gold
                        ? 'radial-gradient(circle, rgba(251,191,36,0.55) 0%, transparent 70%)'
                        : 'radial-gradient(circle, color-mix(in srgb, ' + theme.primary + ' 55%, transparent) 0%, transparent 70%)',
                    }}
                  />
                ))}

                {/* نشانگر ضربه هم‌زمان چندانگشتی (+۲ / +۳) */}
                {multiBadge && (
                  <span
                    className="pointer-events-none absolute top-5 px-2.5 py-0.5 rounded-full text-[11px] font-black shadow-md"
                    style={{ background: theme.accent, color: '#041511' }}
                  >
                    {multiBadge}
                  </span>
                )}

                <span
                  className="text-6xl font-black tracking-tight text-primary tabular-nums relative z-10"
                  style={{ fontFamily: 'system-ui, sans-serif' }}
                >
                  {formatDigits(session.count)}
                </span>

                <span className="text-muted text-xs font-bold mt-1.5 relative z-10">
                  {t('tasbih.ofTimesPrefix')} {formatDigits(targetVal)} {t('tasbih.ofTimesSuffix')}
                </span>

                <span
                  className="mt-3 px-3 py-1 rounded-full text-[10.5px] font-bold relative z-10"
                  style={{
                    background: 'color-mix(in srgb, ' + theme.primary + ' 16%, transparent)',
                    color: theme.primary,
                  }}
                >
                  {session.count === 0 ? t('tasbih.tapHint') : formatDigits(Math.round(progress)) + t('tasbih.roundPctSuffix')}
                </span>
              </button>
            </div>
          </div>

          {/* نوار آمار یکپارچه و خلوت */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t" style={{ borderColor: theme.border }}>
            <div className="py-1">
              <div className="text-lg font-black text-primary tabular-nums">{formatDigits(session.completed)}</div>
              <div className="text-[10px] text-muted">{t('tasbih.statRounds')}</div>
            </div>
            <div className="py-1 border-x" style={{ borderColor: theme.border }}>
              <div className="text-lg font-black text-accent tabular-nums">{formatDigits(totalInSession)}</div>
              <div className="text-[10px] text-muted">{t('tasbih.statSessionTotal')}</div>
            </div>
            <div className="py-1">
              <div className="text-lg font-black text-app tabular-nums">
                {formatDigits(Math.max(0, targetVal - session.count))}
              </div>
              <div className="text-[10px] text-muted">{t('tasbih.statRemaining')}</div>
            </div>
          </div>
        </section>

        {/* ردیف کنترل‌های امن: برگشت -۱ و صفر کردن دو مرحله‌ای */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={decrement}
            disabled={session.count === 0}
            className="py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 border transition-all active:scale-95 disabled:opacity-40"
            style={{
              background: 'color-mix(in srgb, ' + theme.surface + ' 90%, transparent)',
              borderColor: theme.border,
              color: theme.text,
            }}
          >
            <Undo2 size={15} />
            <span>{t('tasbih.undo')}</span>
          </button>

          <button
            type="button"
            onClick={handleSafeReset}
            disabled={session.count === 0}
            className="py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 border transition-all active:scale-95 disabled:opacity-40"
            style={{
              background: confirmReset
                ? 'rgba(239, 68, 68, 0.18)'
                : 'color-mix(in srgb, ' + theme.primary + ' 12%, transparent)',
              borderColor: confirmReset ? 'rgba(239, 68, 68, 0.55)' : 'transparent',
              color: confirmReset ? '#FCA5A5' : theme.primary,
            }}
          >
            <RotateCcw size={15} />
            <span>{confirmReset ? t('tasbih.resetConfirm') : t('tasbih.reset')}</span>
          </button>
        </div>
      </div>

      {/* حالت خلوت تمام‌صفحه OLED: کل صفحه با ۱ تا ۵ انگشت می‌شمارد بدون نگاه کردن */}
      {sanctuaryMode &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            data-no-swipe="true"
            onPointerDown={handlePadPointerDown}
            onPointerUp={handlePadPointerRelease}
            onPointerCancel={handlePadPointerRelease}
            className="fixed inset-0 z-[10000] flex flex-col items-center justify-between p-6 select-none overflow-hidden"
            style={{
              background: 'radial-gradient(circle at 50% 45%, #071D18 0%, #020807 75%, #000000 100%)',
              touchAction: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
            dir={dir}
          >
            {/* امواج نوری روی کل بوم تاریک */}
            {ripples.map((rp) => (
              <span
                key={rp.id}
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full animate-ping"
                style={{
                  left: rp.x,
                  top: rp.y,
                  width: 96,
                  height: 96,
                  background: rp.gold
                    ? 'radial-gradient(circle, rgba(251,191,36,0.45) 0%, transparent 70%)'
                    : 'radial-gradient(circle, rgba(52,211,153,0.4) 0%, transparent 70%)',
                }}
              />
            ))}

            {/* نوار بالای حالت خلوت */}
            <div
              className="w-full max-w-md flex items-center justify-between z-20"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 text-emerald-200/80 text-xs font-bold">
                <Sparkles size={15} className="text-amber-300" />
                <span>{t('tasbih.sanctuaryHeader')}</span>
              </div>
              <button
                type="button"
                onClick={() => setSanctuaryMode(false)}
                className="px-3.5 py-2 rounded-full border border-white/15 bg-white/5 text-white text-xs font-black flex items-center gap-1.5"
              >
                <X size={14} />
                <span>{t('tasbih.exit')}</span>
              </button>
            </div>

            {/* عدد بزرگ مرکزی در تاریکی آرام */}
            <div className="text-center space-y-3 pointer-events-none z-10">
              <p className="text-amber-200/90 text-xl font-black px-4">{activeDhikr.arabic}</p>
              {stepHint && <p className="text-emerald-300 text-xs font-bold">{stepHint}</p>}
              <div
                className={'text-8xl font-black text-emerald-300 tabular-nums transition-transform duration-75 ' + (tapPulse ? 'scale-95' : '')}
                style={{ fontFamily: 'system-ui, sans-serif' }}
              >
                {formatDigits(session.count)}
              </div>
              <p className="text-emerald-100/55 text-sm font-bold">
                {t('tasbih.ofTimesPrefix')} {formatDigits(targetVal)} · {t('tasbih.roundLabel')} {formatDigits(session.completed + 1)}
              </p>
              {multiBadge && (
                <div className="inline-block px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-200 text-xs font-black">
                  {multiBadge}
                </div>
              )}
            </div>

            {/* راهنمای پایین صفحه خلوت */}
            <div className="text-center text-[11px] text-emerald-100/45 pointer-events-none z-10">
              {t('tasbih.sanctuaryHint')}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
