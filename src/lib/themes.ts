export type Theme = {
  id: string;
  name: string;
  nameFa: string;
  primary: string;
  primaryGlow: string;
  accent: string;
  bg: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  border: string;
  gradient: string;
};

export const themes: Theme[] = [
  {
    id: 'emerald',
    name: 'Emerald Night',
    nameFa: ' زمردی شب',
    primary: '#10b981',
    primaryGlow: 'rgba(16, 185, 129, 0.3)',
    accent: '#34d399',
    bg: '#0a1f1a',
    surface: '#0f2922',
    surfaceAlt: '#143a30',
    text: '#e8f5f0',
    textMuted: '#7a9b91',
    border: 'rgba(16, 185, 129, 0.15)',
    gradient: 'linear-gradient(135deg, #0a1f1a 0%, #0f2922 50%, #143a30 100%)',
  },
  {
    id: 'sapphire',
    name: 'Sapphire Dawn',
    nameFa: 'یاقوتی سپیده',
    primary: '#3b82f6',
    primaryGlow: 'rgba(59, 130, 246, 0.3)',
    accent: '#60a5fa',
    bg: '#0a1428',
    surface: '#0f1e3a',
    surfaceAlt: '#142848',
    text: '#e8eef5',
    textMuted: '#7a8ba0',
    border: 'rgba(59, 130, 246, 0.15)',
    gradient: 'linear-gradient(135deg, #0a1428 0%, #0f1e3a 50%, #142848 100%)',
  },
  {
    id: 'rose',
    name: 'Rose Dusk',
    nameFa: 'گلی غروب',
    primary: '#f43f5e',
    primaryGlow: 'rgba(244, 63, 94, 0.3)',
    accent: '#fb7185',
    bg: '#1f0a15',
    surface: '#2a0f1e',
    surfaceAlt: '#3a1428',
    text: '#f5e8ee',
    textMuted: '#a07a8a',
    border: 'rgba(244, 63, 94, 0.15)',
    gradient: 'linear-gradient(135deg, #1f0a15 0%, #2a0f1e 50%, #3a1428 100%)',
  },
  {
    id: 'amber',
    name: 'Amber Light',
    nameFa: 'کهربایی نور',
    primary: '#f59e0b',
    primaryGlow: 'rgba(245, 158, 11, 0.3)',
    accent: '#fbbf24',
    bg: '#1f160a',
    surface: '#2a2010',
    surfaceAlt: '#3a2a18',
    text: '#f5eee2',
    textMuted: '#a09080',
    border: 'rgba(245, 158, 11, 0.15)',
    gradient: 'linear-gradient(135deg, #1f160a 0%, #2a2010 50%, #3a2a18 100%)',
  },
  {
    id: 'violet',
    name: 'Violet Hour',
    nameFa: 'بنفش شب',
    primary: '#8b5cf6',
    primaryGlow: 'rgba(139, 92, 246, 0.3)',
    accent: '#a78bfa',
    bg: '#150a1f',
    surface: '#1f0f2a',
    surfaceAlt: '#2a143a',
    text: '#eee8f5',
    textMuted: '#8a7aa0',
    border: 'rgba(139, 92, 246, 0.15)',
    gradient: 'linear-gradient(135deg, #150a1f 0%, #1f0f2a 50%, #2a143a 100%)',
  },
  {
    id: 'mono',
    name: 'Pure Mono',
    nameFa: 'تک‌رنگ ساده',
    primary: '#e4e4e7',
    primaryGlow: 'rgba(228, 228, 231, 0.2)',
    accent: '#a1a1aa',
    bg: '#0a0a0a',
    surface: '#161616',
    surfaceAlt: '#222222',
    text: '#e4e4e7',
    textMuted: '#71717a',
    border: 'rgba(228, 228, 231, 0.1)',
    gradient: 'linear-gradient(135deg, #0a0a0a 0%, #161616 50%, #222222 100%)',
  },
];

export function getThemeById(id: string | null | undefined): Theme {
  const t = themes.find((t) => t.id === id);
  return t ?? themes[0];
}
