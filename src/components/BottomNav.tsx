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
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 py-2 backdrop-blur-lg"
      style={{
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
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all"
            style={{
              background: isActive ? `color-mix(in srgb, ${theme.primary} 15%, transparent)` : 'transparent',
            }}
          >
            <Icon size={22} color={isActive ? theme.primary : theme.textMuted} />
            <span
              className="text-[10px] font-medium"
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
