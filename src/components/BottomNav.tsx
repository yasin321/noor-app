import { Home, BookOpen, Bell, Settings, Heart } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export type Tab = 'home' | 'tasbih' | 'library' | 'reminders' | 'settings';

const tabs: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'خانه', icon: Home },
  { id: 'tasbih', label: 'ذکرشمار', icon: Heart },
  { id: 'library', label: 'ذکرها', icon: BookOpen },
  { id: 'reminders', label: 'یادآوری', icon: Bell },
  { id: 'settings', label: 'تنظیمات', icon: Settings },
];

export function BottomNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const { theme } = useTheme();
  return (
    <nav
      className="fixed bottom-0 z-50 grid grid-cols-5 gap-0 overflow-x-clip px-1 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] backdrop-blur-lg"
      style={{
        left: 0,
        right: 0,
        width: "100%",
        maxWidth: "100vw",
        boxSizing: "border-box",
        background: `color-mix(in srgb, ${theme.surface} 85%, transparent)`,
        borderTop: `1px solid ${theme.border}`,
      }}
    >
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className="box-border flex w-full min-w-0 flex-col items-center justify-center gap-1 overflow-hidden px-0 py-1.5 rounded-xl transition-all"
            style={{
              background: isActive ? `color-mix(in srgb, ${theme.primary} 15%, transparent)` : 'transparent',
            }}
          >
            <Icon size={22} color={isActive ? theme.primary : theme.textMuted} />
            <span
              className="max-w-full truncate text-[10px] font-medium leading-tight"
              style={{ color: isActive ? theme.primary : theme.textMuted }}
            >
              {t.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
