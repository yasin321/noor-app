import { useState } from 'react';
import { Moon, Mail, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';

export function AuthScreen({ onBack }: { onBack?: () => void }) {
  const { theme } = useTheme();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!displayName.trim()) {
          setError('نام نمایشی را وارد کنید');
          return;
        }
        const { error: err } = await signUp(email, password, displayName.trim());
        if (err) setError(translateError(err));
      } else {
        const { error: err } = await signIn(email, password);
        if (err) setError(translateError(err));
      }
    } catch {
      setError('ارتباط برقرار نشد. اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 animate-fade-in">
      <div className="w-full max-w-sm">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-muted mb-5"
          >
            <ArrowRight size={18} /> بازگشت به برنامه
          </button>
        )}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4"
            style={{ background: `color-mix(in srgb, ${theme.primary} 15%, transparent)` }}
          >
            <Moon size={40} color={theme.primary} />
          </div>
          <h1 className="text-3xl font-bold text-app">نور</h1>
          <p className="text-muted text-sm mt-1">همراه معنوی شما</p>
        </div>

        <div className="flex gap-2 mb-5 p-1 rounded-2xl" style={{ background: `color-mix(in srgb, ${theme.primary} 8%, transparent)` }}>
          <button
            onClick={() => { setMode('signin'); setError(null); }}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: mode === 'signin' ? theme.primary : 'transparent',
              color: mode === 'signin' ? theme.bg : theme.textMuted,
            }}
          >
            ورود
          </button>
          <button
            onClick={() => { setMode('signup'); setError(null); }}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: mode === 'signup' ? theme.primary : 'transparent',
              color: mode === 'signup' ? theme.bg : theme.textMuted,
            }}
          >
            ثبت‌نام
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <div className="relative">
              <User size={18} color={theme.textMuted} className="absolute right-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="نام نمایشی"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full pr-11 pl-4 py-3.5 rounded-2xl text-sm text-app bg-transparent border outline-none transition-colors"
                style={{ borderColor: theme.border, background: `color-mix(in srgb, ${theme.surface} 50%, transparent)` }}
              />
            </div>
          )}
          <div className="relative">
            <Mail size={18} color={theme.textMuted} className="absolute right-4 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              placeholder="ایمیل"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pr-11 pl-4 py-3.5 rounded-2xl text-sm text-app bg-transparent border outline-none transition-colors"
              style={{ borderColor: theme.border, background: `color-mix(in srgb, ${theme.surface} 50%, transparent)` }}
            />
          </div>
          <div className="relative">
            <Lock size={18} color={theme.textMuted} className="absolute right-4 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              placeholder="رمز عبور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full pr-11 pl-4 py-3.5 rounded-2xl text-sm text-app bg-transparent border outline-none transition-colors"
              style={{ borderColor: theme.border, background: `color-mix(in srgb, ${theme.surface} 50%, transparent)` }}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)' }}>
              <AlertCircle size={16} color="#fca5a5" className="flex-shrink-0 mt-0.5" />
              <p className="text-xs" style={{ color: '#fca5a5' }}>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl text-sm font-bold transition-all disabled:opacity-50"
            style={{ background: theme.primary, color: theme.bg }}
          >
            {loading ? '...' : mode === 'signin' ? 'ورود' : 'ثبت‌نام'}
          </button>
        </form>
      </div>
    </div>
  );
}

function translateError(err: string): string {
  if (err.includes('Invalid login credentials')) return 'ایمیل یا رمز عبور اشتباه است';
  if (err.includes('User already registered')) return 'این ایمیل قبلاً ثبت شده است';
  if (err.includes('Password should be at least')) return 'رمز عبور باید حداقل ۶ کاراکتر باشد';
  if (err.includes('Unable to validate email')) return 'ایمیل نامعتبر است';
  return err;
}
