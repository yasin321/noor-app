export type DisplayFontScale = 'compact' | 'normal' | 'large' | 'senior';

const SCALE_STORAGE_KEY = 'noor_font_scale';

// مقیاس خودکار متناسب با عرض صفحه (روی گوشی‌های باریک/زوم‌شده سامسونگ کوچک‌تر و روی استاندارد متعادل)
export const DISPLAY_SCALE_CSS_MAP: Record<DisplayFontScale, string> = {
  compact: 'clamp(12px, 3.4vw, 14px)',
  normal: 'clamp(13.2px, 3.8vw, 15.6px)',
  large: 'clamp(14.5px, 4.15vw, 17px)',
  senior: 'clamp(15.6px, 4.5vw, 18.8px)',
};

export function normalizeDisplayScale(raw?: string | null): DisplayFontScale {
  if (raw === 'compact' || raw === 'normal' || raw === 'large' || raw === 'senior') {
    return raw;
  }
  return 'normal';
}

export function getSavedDisplayScale(): DisplayFontScale {
  try {
    return normalizeDisplayScale(localStorage.getItem(SCALE_STORAGE_KEY));
  } catch {
    return 'normal';
  }
}

export function applyDisplayScale(scale?: string | null): DisplayFontScale {
  const safe = normalizeDisplayScale(scale);
  if (typeof document !== 'undefined') {
    document.documentElement.style.fontSize = DISPLAY_SCALE_CSS_MAP[safe];
    document.documentElement.dataset.fontScale = safe;
  }
  try {
    localStorage.setItem(SCALE_STORAGE_KEY, safe);
  } catch {}
  return safe;
}

export function applySavedDisplayScale(): DisplayFontScale {
  const saved = getSavedDisplayScale();
  if (typeof document !== 'undefined') {
    document.documentElement.style.fontSize = DISPLAY_SCALE_CSS_MAP[saved];
    document.documentElement.dataset.fontScale = saved;
  }
  return saved;
}
