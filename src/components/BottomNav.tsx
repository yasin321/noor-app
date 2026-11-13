import { Home, Heart, BookOpen, Bell, Settings } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export type Tab = 'home' | 'tasbih' | 'library' | 'reminders' | 'settings';

interface Props {
  active: Tab;
  onChange: (t: Tab) => void;
}

// ترتیب دقیق از راست به چپ (در چیدمان RTL):
// ۱. ذکرشمار (اول از راست) | ۲. ذکرها | ۳. خانه (دقیقاً وسط) | ۴. یادآوری | ۵. تنظیمات (آخر از چپ)
const tabs: { id: Tab; label: string; icon: typeof Home; isCenter?: boolean }[] = [
  { id: 'tasbih', label: 'ذکرشمار', icon: Heart },
  { id: 'library', label: 'ذکرها', icon: BookOpen },
  { id: 'home', label: 'خانه', icon: Home, isCenter: true },
  { id: 'reminders', label: 'یادآوری', icon: Bell },
  { id: 'settings', label: 'تنظیمات', icon: Settings },
];

export function BottomNav({ active, onChange }: Props) {
  const { theme } = useTheme();

  return (
    <nav
      aria-label="منوی اصلی پایین صفحه"
      className="fixed bottom-0 inset-x-0 z-50 px-2 pb-2 pt-1 pointer-events-none"
      dir="rtl"
    >
      <div
        className="max-w-lg mx-auto rounded-3xl px-2 py-1.5 border shadow-2xl pointer-events-auto backdrop-blur-2xl"
        style={{
          background: `color-mix(in srgb, ${theme.surface} 92%, #000000)`,
          borderColor: theme.border,
          boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.45)',
        }}
      >
        <div className="grid grid-cols-5 items-center gap-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = active === t.id;

            if (t.isCenter) {
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onChange(t.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className="relative -mt-5 flex flex-col items-center justify-center transition-all duration-300 active:scale-95"
                >
                  <div
                    className="w-13 h-13 p-3 rounded-2xl flex items-center justify-center border-2 shadow-xl transition-all duration-300"
                    style={{
                      background: isActive
                        ? `linear-gradient(135deg, ${theme.primary} 0%, ${theme.accent} 100%)`
                        : theme.surfaceAlt,
                      borderColor: isActive ? '#FFFFFF' : theme.primary,
                      color: isActive ? theme.bg : theme.primary,
                      boxShadow: isActive ? `0 8px 24px ${theme.primaryGlow}` : '0 4px 12px rgba(0,0,0,0.35)',
                      transform: isActive ? 'scale(1.08)' : 'scale(1)',
                    }}
                  >
                    <Icon size={22} strokeWidth={isActive ? 2.6 : 2} />
                  </div>
                  <span
                    className="text-[11px] mt-1 font-black tracking-tight"
                    style={{ color: isActive ? theme.accent : theme.text }}
                  >
                    {t.label}
                  </span>
                  {isActive && (
                    <span
                      className="w-4 h-1 rounded-full mt-0.5"
                      style={{ background: theme.accent }}
                    />
                  )}
                </button>
              );
            }

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onChange(t.id)}
                aria-current={isActive ? 'page' : undefined}
                className="relative py-2 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95"
                style={{
                  background: isActive
                    ? `color-mix(in srgb, ${theme.primary} 18%, transparent)`
                    : 'transparent',
                  border: isActive ? `1px solid ${theme.border}` : '1px solid transparent',
                }}
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  style={{
                    color: isActive ? theme.primary : theme.textMuted,
                    filter: isActive ? `drop-shadow(0 0 8px ${theme.primaryGlow})` : 'none',
                  }}
                />
                <span
                  className={`text-[10px] ${isActive ? 'font-black' : 'font-semibold'}`}
                  style={{ color: isActive ? theme.text : theme.textMuted }}
                >
                  {t.label}
                </span>
                {isActive && (
                  <span
                    className="w-3.5 h-1 rounded-full"
                    style={{ background: theme.primary }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
