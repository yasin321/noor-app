import { useState } from 'react';
import {
  Phone,
  Lock,
  User,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import {
  normalizeIranPhone,
  isValidIranPhone,
  formatIranPhoneDisplay,
  evaluatePasswordStrength,
} from '@/lib/authService';
import { isSupabaseConfigured } from '@/lib/supabase';

export function AuthScreen({ onBack }: { onBack?: () => void }) {
  const { theme } = useTheme();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [phoneInput, setPhoneInput] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotHint, setShowForgotHint] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const normalizedPhone = normalizeIranPhone(phoneInput);
  const phoneReady = isValidIranPhone(normalizedPhone);
  const strength = evaluatePasswordStrength(password);

  const handlePhoneChange = (val: string) => {
    const clean = normalizeIranPhone(val);
    setPhoneInput(formatIranPhoneDisplay(clean));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phoneReady) {
      setError('لطفاً شماره موبایل معتبر ۱۱ رقمی وارد کنید (مثال: 09123456789)');
      return;
    }

    if (password.length < 6) {
      setError('رمز عبور باید حداقل ۶ کاراکتر باشد');
      return;
    }

    if (mode === 'signup') {
      if (!displayName.trim()) {
        setError('لطفاً نام نمایشی خود را وارد کنید');
        return;
      }
      if (password !== confirmPassword) {
        setError('رمز عبور و تکرار آن یکسان نیستند');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error: err } = await signUp(normalizedPhone, password, displayName.trim());
        if (err) {
          setError(translateError(err));
        } else {
          onBack?.();
        }
      } else {
        const { error: err } = await signIn(normalizedPhone, password);
        if (err) {
          setError(translateError(err));
        } else {
          onBack?.();
        }
      }
    } catch {
      setError('ارتباط برقرار نشد. لطفاً دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-8 animate-fade-in relative overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at 50% 0%, color-mix(in srgb, ' +
          theme.primary +
          ' 22%, ' +
          theme.bg +
          ') 0%, ' +
          theme.bg +
          ' 62%)',
      }}
      dir="rtl"
    >
      <div className="w-full max-w-sm relative z-10">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted mb-5 px-3 py-1.5 rounded-full border transition-opacity hover:opacity-90"
            style={{ borderColor: theme.border, background: 'rgba(255,255,255,0.03)' }}
          >
            <ArrowRight size={15} />
            <span>بازگشت به برنامه</span>
          </button>
        )}

        <div className="flex flex-col items-center mb-6">
          <div
            className="w-20 h-20 rounded-[26px] flex items-center justify-center mb-3.5 border shadow-2xl relative"
            style={{
              background:
                'radial-gradient(circle at 50% 30%, color-mix(in srgb, ' +
                theme.accent +
                ' 28%, ' +
                theme.surface +
                '), ' +
                theme.surface +
                ')',
              borderColor: 'color-mix(in srgb, ' + theme.accent + ' 50%, ' + theme.border + ')',
              boxShadow: '0 12px 32px color-mix(in srgb, ' + theme.primary + ' 24%, transparent)',
            }}
          >
            <svg width="46" height="46" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <path
                d="M11 39V22C11 13.5 17 8.5 24 6C31 8.5 37 13.5 37 22V39"
                stroke={theme.accent}
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <path
                d="M16.5 39V23.5C16.5 17.8 19.8 14 24 12.2C28.2 14 31.5 17.8 31.5 23.5V39"
                stroke={theme.primary}
                strokeWidth="1.8"
                strokeLinecap="round"
                opacity="0.85"
              />
              <circle cx="24" cy="24" r="4.2" fill={theme.accent} />
              <path d="M9 39H39" stroke={theme.accent} strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>

          <h1 className="text-2xl font-black text-app tracking-tight">حساب همراه معنوی نور</h1>
          <p className="text-muted text-xs mt-1 text-center">
            {mode === 'signin'
              ? 'با شماره موبایل و رمز عبور وارد حساب خود شوید'
              : 'ساخت حساب سریع برای ذخیره و همگام‌سازی اذکار و تنظیمات'}
          </p>
        </div>

        <div
          className="rounded-[28px] p-5 border shadow-2xl space-y-4"
          style={{
            background: 'color-mix(in srgb, ' + theme.surface + ' 92%, transparent)',
            borderColor: theme.border,
          }}
        >
          <div
            className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl border"
            style={{ background: theme.bg, borderColor: theme.border }}
          >
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
                setShowForgotHint(false);
              }}
              className="py-2.5 rounded-xl text-xs font-black transition-all"
              style={{
                background: mode === 'signin' ? theme.primary : 'transparent',
                color: mode === 'signin' ? theme.bg : theme.textMuted,
              }}
            >
              ورود با موبایل
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
                setShowForgotHint(false);
              }}
              className="py-2.5 rounded-xl text-xs font-black transition-all"
              style={{
                background: mode === 'signup' ? theme.primary : 'transparent',
                color: mode === 'signup' ? theme.bg : theme.textMuted,
              }}
            >
              ایجاد حساب جدید
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <div>
                <label className="block text-[11px] font-bold text-muted mb-1 pr-1">نام نمایشی</label>
                <div className="relative">
                  <User
                    size={16}
                    color={theme.textMuted}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  />
                  <input
                    type="text"
                    placeholder="مثلاً: یاسین"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pr-10 pl-3.5 py-3 rounded-2xl text-sm text-app border outline-none transition-colors"
                    style={{ borderColor: theme.border, background: theme.bg }}
                  />
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1 px-1">
                <label className="text-[11px] font-bold text-muted">شماره موبایل</label>
                {phoneReady && (
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={12} /> معتبر
                  </span>
                )}
              </div>
              <div className="relative">
                <Phone
                  size={16}
                  color={phoneReady ? '#34d399' : theme.textMuted}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                />
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  dir="ltr"
                  placeholder="0912 345 6789"
                  value={phoneInput}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  required
                  className="w-full pr-10 pl-14 py-3 rounded-2xl text-sm font-bold tracking-wider text-app border outline-none transition-colors text-left"
                  style={{
                    borderColor: phoneReady ? '#34d399' : theme.border,
                    background: theme.bg,
                  }}
                />
                <span
                  dir="ltr"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-black px-1.5 py-0.5 rounded-lg"
                  style={{
                    background: 'color-mix(in srgb, ' + theme.primary + ' 14%, transparent)',
                    color: theme.primary,
                  }}
                >
                  IR
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1 px-1">
                <label className="text-[11px] font-bold text-muted">رمز عبور</label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => setShowForgotHint((v) => !v)}
                    className="text-[10.5px] font-bold text-primary"
                  >
                    فراموشی رمز؟
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock
                  size={16}
                  color={theme.textMuted}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  placeholder="حداقل ۶ کاراکتر"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pr-10 pl-11 py-3 rounded-2xl text-sm text-app border outline-none transition-colors"
                  style={{ borderColor: theme.border, background: theme.bg }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'مخفی کردن رمز عبور' : 'نمایش رمز عبور'}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted p-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {mode === 'signup' && password.length > 0 && (
                <div className="mt-2 px-1 space-y-1">
                  <div className="grid grid-cols-3 gap-1">
                    {[1, 2, 3].map((lvl) => (
                      <div
                        key={lvl}
                        className="h-1 rounded-full transition-all"
                        style={{
                          background: strength.score >= lvl ? strength.color : 'rgba(255,255,255,0.1)',
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] font-bold" style={{ color: strength.color }}>
                    {strength.label}
                  </p>
                </div>
              )}
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-[11px] font-bold text-muted mb-1 pr-1">تکرار رمز عبور</label>
                <div className="relative">
                  <ShieldCheck
                    size={16}
                    color={
                      confirmPassword && confirmPassword === password ? '#34d399' : theme.textMuted
                    }
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="رمز عبور را دوباره وارد کنید"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pr-10 pl-4 py-3 rounded-2xl text-sm text-app border outline-none transition-colors"
                    style={{
                      borderColor:
                        confirmPassword && confirmPassword === password ? '#34d399' : theme.border,
                      background: theme.bg,
                    }}
                  />
                </div>
              </div>
            )}

            {showForgotHint && (
              <div
                className="p-3 rounded-2xl border text-[11px] leading-relaxed"
                style={{
                  background: 'color-mix(in srgb, ' + theme.accent + ' 10%, ' + theme.bg + ')',
                  borderColor: 'color-mix(in srgb, ' + theme.accent + ' 40%, ' + theme.border + ')',
                  color: theme.text,
                }}
              >
                بازیابی پیامکی (کد تایید OTP) در فاز اتصال به سرور ابری فعال می‌شود. تا آن زمان می‌توانید حساب جدید بسازید یا بدون حساب ادامه دهید.
              </div>
            )}

            {error && (
              <div
                className="flex items-start gap-2 p-3 rounded-2xl border"
                style={{
                  background: 'rgba(239,68,68,0.12)',
                  borderColor: 'rgba(239,68,68,0.35)',
                }}
              >
                <AlertCircle size={16} color="#fca5a5" className="shrink-0 mt-0.5" />
                <p className="text-xs font-bold leading-relaxed" style={{ color: '#fecaca' }}>
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl text-sm font-black transition-all active:scale-[0.99] disabled:opacity-50 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, ' + theme.primary + ', ' + theme.accent + ')',
                color: theme.bg,
              }}
            >
              {loading
                ? 'در حال بررسی...'
                : mode === 'signin'
                ? 'ورود به حساب نور'
                : 'ساخت حساب کاربری'}
            </button>
          </form>

          <div
            className="pt-2 border-t flex items-center justify-center gap-1.5 text-[10.5px] text-muted"
            style={{ borderColor: theme.border }}
          >
            <Sparkles size={12} color={theme.accent} />
            <span>
              {isSupabaseConfigured
                ? 'اطلاعات شما با رمزنگاری امن همگام‌سازی می‌شود'
                : 'ذخیره امن محلی · آماده انتقال به دیتابیس ابری در فاز بعدی'}
            </span>
          </div>
        </div>

        {/* نمایش شفاف مزایای واقعی ورود برای کاربر */}
        <div
          className="mt-3.5 rounded-3xl p-4 border space-y-2"
          style={{
            background: 'color-mix(in srgb, ' + theme.surface + ' 75%, transparent)',
            borderColor: theme.border,
          }}
        >
          <p className="text-[11.5px] font-black text-primary">چرا حساب کاربری نور؟</p>
          <div className="grid grid-cols-1 gap-1.5 text-[11px] text-muted leading-relaxed">
            <p>• <strong className="text-app">پشتیبان‌گیری همیشگی:</strong> با تعویض گوشی، آمار ذکرها، قضا و نشانک‌های قرآن حفظ می‌شود.</p>
            <p>• <strong className="text-app">همگام‌سازی چنددستگاهی:</strong> آماده اتصال بین اندروید، آیفون (وب) و اکستنشن کروم.</p>
            <p>• <strong className="text-app">حفظ تنظیمات شخصی:</strong> شهر، مؤذن، پوسته حرم و تعقیبات خودکار بازیابی می‌شود.</p>
            <p>• <strong className="text-app">حریم خصوصی واقعی:</strong> یادداشت‌های «محاسبه نفس» فقط روی حافظه گوشی شما می‌ماند.</p>
          </div>
        </div>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="w-full mt-3.5 py-2.5 rounded-2xl text-xs font-bold text-muted hover:text-app transition-colors"
          >
            ادامه بدون حساب کاربری (حالت مهمان)
          </button>
        )}
      </div>
    </div>
  );
}

function translateError(err: string): string {
  if (err.includes('Invalid login credentials')) return 'شماره موبایل یا رمز عبور اشتباه است';
  if (err.includes('User already registered')) return 'این شماره موبایل قبلاً ثبت شده است';
  if (err.includes('Password should be at least')) return 'رمز عبور باید حداقل ۶ کاراکتر باشد';
  return err;
}
