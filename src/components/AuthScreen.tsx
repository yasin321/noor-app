import { useEffect, useState } from 'react';
import {
  Phone,
  Lock,
  User,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  KeyRound,
  MessageSquare,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n';
import {
  normalizeGlobalPhone,
  isValidGlobalPhone,
  formatGlobalPhoneDisplay,
  evaluatePasswordStrength,
  requestPasswordResetOtp,
  verifyOtpAndResetPassword,
  toEnglishDigits,
} from '@/lib/authService';
import { isSupabaseConfigured } from '@/lib/supabase';

export function AuthScreen({ onBack }: { onBack?: () => void }) {
  const { theme } = useTheme();
  const { signIn, signUp } = useAuth();
  const { lang, dir, isRtl, t, formatDigits } = useI18n();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [phoneInput, setPhoneInput] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [forgotStep, setForgotStep] = useState<'phone' | 'verify'>('phone');
  const [otpCode, setOtpCode] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const normalizedPhone = normalizeGlobalPhone(phoneInput);
  const phoneReady = isValidGlobalPhone(normalizedPhone);
  const strength = evaluatePasswordStrength(password);

  const strengthLabel =
    strength.score === 1
      ? t('auth.strengthWeak')
      : strength.score === 2
      ? t('auth.strengthMedium')
      : strength.score === 3
      ? t('auth.strengthStrong')
      : '';

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setTimeout(() => setResendSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  const handlePhoneChange = (val: string) => {
    const trimmed = toEnglishDigits(val);
    if (trimmed === '+') {
      setPhoneInput('+');
      return;
    }
    const clean = normalizeGlobalPhone(trimmed);
    setPhoneInput(formatGlobalPhoneDisplay(clean));
    if (error) setError(null);
  };

  const translateErr = (err: string): string => {
    if (err.includes('Invalid login credentials')) return t('auth.errCredentials');
    if (err.includes('User already registered')) return t('auth.errExists');
    if (err.includes('Password should be at least')) return t('auth.errPassLen');
    return err;
  };

  const handleSendResetOtp = async () => {
    setError(null);
    setSuccessMsg(null);
    if (!phoneReady) {
      setError(t('auth.errPhone'));
      return;
    }
    setLoading(true);
    try {
      const res = await requestPasswordResetOtp(normalizedPhone);
      if (!res.ok) {
        setError(res.error || t('auth.errGeneric'));
      } else {
        setForgotStep('verify');
        setResendSeconds(res.cooldownSec || 120);
        setSuccessMsg(formatGlobalPhoneDisplay(normalizedPhone));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (mode === 'forgot') {
      if (forgotStep === 'phone') {
        await handleSendResetOtp();
        return;
      }
      if (password.length < 6) {
        setError(t('auth.errPassLen'));
        return;
      }
      if (password !== confirmPassword) {
        setError(t('auth.errMismatch'));
        return;
      }
      setLoading(true);
      try {
        const res = await verifyOtpAndResetPassword(normalizedPhone, otpCode, password);
        if (!res.ok) {
          setError(res.error || t('auth.errGeneric'));
        } else {
          setSuccessMsg(t('auth.okReset'));
          setMode('signin');
          setForgotStep('phone');
          setOtpCode('');
          setConfirmPassword('');
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!phoneReady) {
      setError(t('auth.errPhone'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.errPassLen'));
      return;
    }

    if (mode === 'signup') {
      if (!displayName.trim()) {
        setError(t('auth.errName'));
        return;
      }
      if (password !== confirmPassword) {
        setError(t('auth.errMismatch'));
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error: err } = await signUp(normalizedPhone, password, displayName.trim());
        if (err) setError(translateErr(err));
        else onBack?.();
      } else {
        const { error: err } = await signIn(normalizedPhone, password);
        if (err) setError(translateErr(err));
        else onBack?.();
      }
    } catch {
      setError(t('auth.errGeneric'));
    } finally {
      setLoading(false);
    }
  };

  const phonePlaceholder =
    lang === 'fa' ? '0912 345 6789' : lang === 'es' ? '+34 612 345 678' : '+1 212 555 0199';

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
      dir={dir}
    >
      <div className="w-full max-w-sm relative z-10">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted mb-5 px-3 py-1.5 rounded-full border transition-opacity hover:opacity-90"
            style={{ borderColor: theme.border, background: 'rgba(255,255,255,0.03)' }}
          >
            {isRtl ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
            <span>{t('auth.backToApp')}</span>
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

          <h1 className="text-2xl font-black text-app tracking-tight">{t('auth.title')}</h1>
          <p className="text-muted text-xs mt-1 text-center">
            {mode === 'forgot'
              ? t('auth.subForgot')
              : mode === 'signin'
              ? t('auth.subSignin')
              : t('auth.subSignup')}
          </p>
        </div>

        <div
          className="rounded-[28px] p-5 border shadow-2xl space-y-4"
          style={{
            background: 'color-mix(in srgb, ' + theme.surface + ' 92%, transparent)',
            borderColor: theme.border,
          }}
        >
          {mode !== 'forgot' ? (
            <div
              className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl border"
              style={{ background: theme.bg, borderColor: theme.border }}
            >
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="py-2.5 rounded-xl text-xs font-black transition-all"
                style={{
                  background: mode === 'signin' ? theme.primary : 'transparent',
                  color: mode === 'signin' ? theme.bg : theme.textMuted,
                }}
              >
                {t('auth.tabSignin')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="py-2.5 rounded-xl text-xs font-black transition-all"
                style={{
                  background: mode === 'signup' ? theme.primary : 'transparent',
                  color: mode === 'signup' ? theme.bg : theme.textMuted,
                }}
              >
                {t('auth.tabSignup')}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: theme.border }}>
              <div className="flex items-center gap-2">
                <KeyRound size={16} color={theme.accent} />
                <span className="text-xs font-black text-app">{t('auth.forgotHeader')}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setForgotStep('phone');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="text-[11px] font-bold text-primary"
              >
                {t('auth.backToSignin')}
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <div>
                <label className="block text-[11px] font-bold text-muted mb-1 px-1">
                  {t('auth.displayName')}
                </label>
                <div className="relative">
                  <User
                    size={16}
                    color={theme.textMuted}
                    className={'absolute top-1/2 -translate-y-1/2 pointer-events-none ' + (isRtl ? 'right-3.5' : 'left-3.5')}
                  />
                  <input
                    type="text"
                    placeholder={t('auth.displayNamePh')}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className={'w-full py-3 rounded-2xl text-sm text-app border outline-none transition-colors ' + (isRtl ? 'pr-10 pl-3.5' : 'pl-10 pr-3.5')}
                    style={{ borderColor: theme.border, background: theme.bg }}
                  />
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1 px-1">
                <label className="text-[11px] font-bold text-muted">{t('auth.phoneLabel')}</label>
                {phoneReady && (
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={12} /> {t('auth.phoneValid')}
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
                  placeholder={phonePlaceholder}
                  value={phoneInput}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  disabled={mode === 'forgot' && forgotStep === 'verify'}
                  required
                  className="w-full pr-10 pl-14 py-3 rounded-2xl text-sm font-bold tracking-wider text-app border outline-none transition-colors text-left disabled:opacity-65"
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
                  {normalizedPhone.startsWith('+') ? '🌍' : lang === 'fa' ? 'IR' : '🌍'}
                </span>
              </div>
            </div>

            {mode === 'forgot' && forgotStep === 'verify' && (
              <div>
                <div className="flex items-center justify-between mb-1 px-1">
                  <label className="text-[11px] font-bold text-muted">{t('auth.otpLabel')}</label>
                  {resendSeconds > 0 ? (
                    <span className="text-[10px] text-muted">
                      {t('auth.otpResendIn')} {formatDigits(resendSeconds)} {t('auth.seconds')}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleSendResetOtp()}
                      className="text-[10.5px] font-bold text-accent"
                    >
                      {t('auth.otpResendNow')}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <MessageSquare
                    size={16}
                    color={theme.accent}
                    className={'absolute top-1/2 -translate-y-1/2 pointer-events-none ' + (isRtl ? 'right-3.5' : 'left-3.5')}
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    dir="ltr"
                    maxLength={6}
                    placeholder="-----"
                    value={otpCode}
                    onChange={(e) =>
                      setOtpCode(toEnglishDigits(e.target.value).replace(/[^0-9]/g, '').slice(0, 6))
                    }
                    required
                    className="w-full px-10 py-3 rounded-2xl text-base font-black tracking-[0.35em] text-center text-app border outline-none"
                    style={{ borderColor: theme.accent, background: theme.bg }}
                  />
                </div>
              </div>
            )}

            {(mode !== 'forgot' || forgotStep === 'verify') && (
              <div>
                <div className="flex items-center justify-between mb-1 px-1">
                  <label className="text-[11px] font-bold text-muted">
                    {mode === 'forgot' ? t('auth.newPasswordLabel') : t('auth.passwordLabel')}
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setForgotStep('phone');
                        setError(null);
                        setSuccessMsg(null);
                        setPassword('');
                        setConfirmPassword('');
                      }}
                      className="text-[10.5px] font-bold text-primary"
                    >
                      {t('auth.forgotBtn')}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock
                    size={16}
                    color={theme.textMuted}
                    className={'absolute top-1/2 -translate-y-1/2 pointer-events-none ' + (isRtl ? 'right-3.5' : 'left-3.5')}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    placeholder={t('auth.passwordPh')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className={'w-full py-3 rounded-2xl text-sm text-app border outline-none transition-colors ' + (isRtl ? 'pr-10 pl-11' : 'pl-10 pr-11')}
                    style={{ borderColor: theme.border, background: theme.bg }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className={'absolute top-1/2 -translate-y-1/2 text-muted p-1 ' + (isRtl ? 'left-3' : 'right-3')}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {(mode === 'signup' || mode === 'forgot') && password.length > 0 && (
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
                      {strengthLabel}
                    </p>
                  </div>
                )}
              </div>
            )}

            {(mode === 'signup' || (mode === 'forgot' && forgotStep === 'verify')) && (
              <div>
                <label className="block text-[11px] font-bold text-muted mb-1 px-1">
                  {mode === 'forgot' ? t('auth.confirmNewLabel') : t('auth.confirmLabel')}
                </label>
                <div className="relative">
                  <ShieldCheck
                    size={16}
                    color={
                      confirmPassword && confirmPassword === password ? '#34d399' : theme.textMuted
                    }
                    className={'absolute top-1/2 -translate-y-1/2 pointer-events-none ' + (isRtl ? 'right-3.5' : 'left-3.5')}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder={t('auth.confirmPh')}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className={'w-full py-3 rounded-2xl text-sm text-app border outline-none transition-colors ' + (isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4')}
                    style={{
                      borderColor:
                        confirmPassword && confirmPassword === password ? '#34d399' : theme.border,
                      background: theme.bg,
                    }}
                  />
                </div>
              </div>
            )}

            {successMsg && (
              <div
                className="flex items-start gap-2 p-3 rounded-2xl border"
                style={{
                  background: 'rgba(16,185,129,0.14)',
                  borderColor: 'rgba(52,211,153,0.45)',
                }}
              >
                <CheckCircle2 size={16} color="#34d399" className="shrink-0 mt-0.5" />
                <p className="text-xs font-bold leading-relaxed text-emerald-200">{successMsg}</p>
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
                ? t('auth.submitChecking')
                : mode === 'forgot'
                ? forgotStep === 'phone'
                  ? t('auth.submitSendOtp')
                  : t('auth.submitReset')
                : mode === 'signin'
                ? t('auth.submitSignin')
                : t('auth.submitSignup')}
            </button>
          </form>

          <div
            className="pt-2 border-t flex items-center justify-center gap-1.5 text-[10.5px] text-muted"
            style={{ borderColor: theme.border }}
          >
            <Sparkles size={12} color={theme.accent} />
            <span>{isSupabaseConfigured ? t('auth.cloudReady') : t('auth.localReady')}</span>
          </div>
        </div>

        <div
          className="mt-3.5 rounded-3xl p-4 border space-y-2"
          style={{
            background: 'color-mix(in srgb, ' + theme.surface + ' 75%, transparent)',
            borderColor: theme.border,
          }}
        >
          <p className="text-[11.5px] font-black text-primary">{t('auth.whyTitle')}</p>
          <div className="grid grid-cols-1 gap-1.5 text-[11px] text-muted leading-relaxed">
            <p>• <strong className="text-app">{t('auth.why1Head')}</strong> {t('auth.why1Body')}</p>
            <p>• <strong className="text-app">{t('auth.why2Head')}</strong> {t('auth.why2Body')}</p>
            <p>• <strong className="text-app">{t('auth.why3Head')}</strong> {t('auth.why3Body')}</p>
            <p>• <strong className="text-app">{t('auth.why4Head')}</strong> {t('auth.why4Body')}</p>
          </div>
        </div>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="w-full mt-3.5 py-2.5 rounded-2xl text-xs font-bold text-muted hover:text-app transition-colors"
          >
            {t('auth.continueGuest')}
          </button>
        )}
      </div>
    </div>
  );
}
