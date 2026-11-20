import { Component, type ErrorInfo, type ReactNode } from 'react';
import { reportCloudError } from '@/lib/errorTelemetry';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    void reportCloudError({
      level: 'fatal',
      scope: 'ReactErrorBoundary',
      message: error?.message || 'React render crash',
      stack: (error?.stack || '') + '\n' + (info?.componentStack || ''),
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="min-h-screen flex items-center justify-center p-6 text-center"
          style={{ background: '#071a16', color: '#ecfdf5' }}
        >
          <div
            className="max-w-sm w-full rounded-3xl p-6 border space-y-4 shadow-2xl"
            style={{ background: '#0d2e26', borderColor: 'rgba(52, 211, 153, 0.35)' }}
          >
            <h1 className="text-lg font-black text-amber-300">خطای موقت در نمایش صفحه</h1>
            <p className="text-xs leading-relaxed text-emerald-100/80">
              گزارش این خطا به‌صورت خودکار برای تیم پشتیبانی نور ارسال شد. با لمس دکمه زیر برنامه دوباره آماده می‌شود.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full py-3 rounded-2xl text-xs font-black"
              style={{ background: '#34d399', color: '#041511' }}
            >
              بارگذاری مجدد همراه معنوی نور
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
