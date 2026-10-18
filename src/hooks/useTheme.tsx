import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { themes, getThemeById, type Theme } from '@/lib/themes';
import { useAuth } from '@/hooks/useAuth';

const GUEST_THEME_KEY = 'noor_theme_id';

type ThemeContextType = {
  theme: Theme;
  themeId: string;
  setThemeId: (id: string) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [themeId, setThemeIdState] = useState<string>(() => {
    try {
      return localStorage.getItem(GUEST_THEME_KEY) ?? 'emerald';
    } catch {
      return 'emerald';
    }
  });

  useEffect(() => {
    if (profile?.theme_id) {
      setThemeIdState(profile.theme_id);
    }
  }, [profile?.theme_id]);

  const setThemeId = useCallback((id: string) => {
    setThemeIdState(id);
    try {
      localStorage.setItem(GUEST_THEME_KEY, id);
    } catch {
      // localStorage unavailable
    }
  }, []);

  const theme = getThemeById(themeId);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--primary-glow', theme.primaryGlow);
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--bg', theme.bg);
    root.style.setProperty('--surface', theme.surface);
    root.style.setProperty('--surface-alt', theme.surfaceAlt);
    root.style.setProperty('--text', theme.text);
    root.style.setProperty('--text-muted', theme.textMuted);
    root.style.setProperty('--border', theme.border);
    document.body.style.background = theme.gradient;
    document.body.style.color = theme.text;
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, themeId, setThemeId }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export { themes };
