import { Home, Heart, BookOpen, Bell, Settings } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export type Tab = 'home' | 'tasbih' | 'library' | 'reminders' | 'settings';

interface Props {
  active: Tab;
  onChange: (t: Tab) => void;
}

const NAV_ITEMS: { id: Tab; label: string; icon: typeof Home; isCenter?: boolean }[] = [
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
      aria-label="ناوبری اصلی"
      className="fixed bottom-0 inset-x-0 z-40 px-3 pb-2.5 pt-1 pointer-events-none"
      dir="rtl"
    >
      <div
        className="max-w-lg mx-auto rounded-[28px] px-2 py-1.5 border shadow-2xl grid grid-cols-5 items-end pointer-events-auto"
        style={{
          background: 'rgba(6, 26, 20, 0.94)',
          borderColor: theme.border,
          backdropFilter: 'blur(16px)',
          boxShadow: '0 -6px 28px rgba(0, 0, 0, 0.45)',
        }}
      >
        {NAV_ITEMS.map(({ id, label, icon: Icon, isCenter }) => {
          const isActive = active === id;

          if (isCenter) {
            return (
              <button
                key={id}
                type="button"
                aria-label={label}
                onClick={() => onChange(id)}
                className="flex flex-col items-center justify-center -mt-5 focus:outline-none group"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-transform shadow-xl"
                  style={{
                    background: isActive
                      ? 'linear-gradient(135deg, #A3E635 0%, #34D399 100%)'
                      : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    borderColor: '#ECFDF5',
                    color: '#041511',
                    boxShadow: isActive
                      ? '0 6px 20px rgba(52, 211, 153, 0.55)'
                      : '0 4px 14px rgba(0, 0, 0, 0.35)',
                  }}
                >
                  <Icon size={25} strokeWidth={2.5} aria-hidden="true" />
                </div>
                <span
                  className="text-[11px] font-black mt-1"
                  style={{ color: isActive ? '#FBBF24' : '#ECFDF5' }}
                >
                  {label}
                </span>
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="w-4 h-1 rounded-full mt-0.5"
                    style={{ background: '#FBBF24' }}
                  />
                )}
              </button>
            );
          }

          return (
            <button
              key={id}
              type="button"
              aria-label={label}
              onClick={() => onChange(id)}
              className="py-1.5 flex flex-col items-center justify-center gap-1 rounded-2xl transition-colors focus:outline-none"
              style={{
                color: isActive ? theme.primary : theme.textMuted,
              }}
            >
              <Icon size={20} strokeWidth={isActive ? 2.4 : 1.9} aria-hidden="true" />
              <span className="text-[11px] font-bold">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
