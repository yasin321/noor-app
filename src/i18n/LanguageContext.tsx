import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { translations, type AppLang, type TranslationKey } from '@/i18n/translations';
import { toFaDigits, toJalaliShort } from '@/lib/jalali';

export const APP_LANG_STORAGE_KEY = 'noor_app_lang_v1';
export const APP_LANG_CHANGED_EVENT = 'noor-app-lang-changed';

export function getSavedAppLang(): AppLang {
  try {
    const raw = localStorage.getItem(APP_LANG_STORAGE_KEY);
    if (raw === 'fa' || raw === 'en' || raw === 'es') return raw;
  } catch {}
  return 'fa';
}

export function getDirectionForLang(lang: AppLang): 'rtl' | 'ltr' {
  return lang === 'fa' ? 'rtl' : 'ltr';
}

export function formatDigitsForLang(value: string | number, lang: AppLang): string {
  const s = String(value);
  return lang === 'fa' ? toFaDigits(s) : s;
}

export function formatDateForLang(date: Date, lang: AppLang): string {
  if (lang === 'fa') return toJalaliShort(date);
  try {
    const locale = lang === 'es' ? 'es-ES' : 'en-US';
    return new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export function getPrayerLabelForLang(
  key: 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'midnight',
  lang: AppLang
): string {
  const k = ('prayer.' + key) as TranslationKey;
  return translations[lang][k] ?? translations.fa[k];
}

export function translateKey(lang: AppLang, key: TranslationKey): string {
  return translations[lang][key] ?? translations.fa[key] ?? key;
}

const PERSIAN_FONT_MAP: Record<string, string> = {
  Vazirmatn: "'Vazirmatn', system-ui, sans-serif",
  BNazanin: "'BNazaninWeb', 'Parastoo', 'Vazirmatn', serif",
  Nastaliq: "'Gulzar', 'Mirza', 'Parastoo', serif",
  Parastoo: "'Parastoo', 'Vazirmatn', serif",
  Samim: "'Samim', 'Vazirmatn', sans-serif",
  AmiriQuran: "'Amiri', 'Amiri Quran', 'Parastoo', serif",
};

const LATIN_FONT_STACK = "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif";

function applyDocumentLanguage(lang: AppLang): void {
  if (typeof document === 'undefined') return;
  const dir = getDirectionForLang(lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = dir;
  document.body.dir = dir;

  if (lang === 'fa') {
    let savedFont = 'Vazirmatn';
    try {
      savedFont = localStorage.getItem('noor_font_family') || 'Vazirmatn';
    } catch {}
    const stack = PERSIAN_FONT_MAP[savedFont] || PERSIAN_FONT_MAP.Vazirmatn;
    document.documentElement.style.setProperty('--app-font', stack);
    document.body.style.fontFamily = stack;
  } else {
    document.documentElement.style.setProperty('--app-font', LATIN_FONT_STACK);
    document.body.style.fontFamily = LATIN_FONT_STACK;
  }
}

interface I18nContextValue {
  lang: AppLang;
  dir: 'rtl' | 'ltr';
  isRtl: boolean;
  setLang: (next: AppLang) => void;
  t: (key: TranslationKey) => string;
  formatDigits: (value: string | number) => string;
  formatDate: (date: Date) => string;
  prayerName: (key: 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'midnight') => string;
}

const LanguageContext = createContext<I18nContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<AppLang>(() => getSavedAppLang());

  useEffect(() => {
    applyDocumentLanguage(lang);
  }, [lang]);

  useEffect(() => {
    const onExternalChange = () => setLangState(getSavedAppLang());
    window.addEventListener(APP_LANG_CHANGED_EVENT, onExternalChange);
    return () => window.removeEventListener(APP_LANG_CHANGED_EVENT, onExternalChange);
  }, []);

  const setLang = useCallback((next: AppLang) => {
    setLangState(next);
    try {
      localStorage.setItem(APP_LANG_STORAGE_KEY, next);
    } catch {}
    applyDocumentLanguage(next);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(APP_LANG_CHANGED_EVENT, { detail: { lang: next } }));
    }
  }, []);

  const dir = getDirectionForLang(lang);
  const t = useCallback((key: TranslationKey) => translateKey(lang, key), [lang]);
  const formatDigits = useCallback((v: string | number) => formatDigitsForLang(v, lang), [lang]);
  const formatDate = useCallback((d: Date) => formatDateForLang(d, lang), [lang]);
  const prayerName = useCallback(
    (k: 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'midnight') =>
      getPrayerLabelForLang(k, lang),
    [lang]
  );

  return (
    <LanguageContext.Provider
      value={{
        lang,
        dir,
        isRtl: dir === 'rtl',
        setLang,
        t,
        formatDigits,
        formatDate,
        prayerName,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    const fallbackLang = getSavedAppLang();
    const dir = getDirectionForLang(fallbackLang);
    return {
      lang: fallbackLang,
      dir,
      isRtl: dir === 'rtl',
      setLang: () => {},
      t: (k) => translateKey(fallbackLang, k),
      formatDigits: (v) => formatDigitsForLang(v, fallbackLang),
      formatDate: (d) => formatDateForLang(d, fallbackLang),
      prayerName: (k) => getPrayerLabelForLang(k, fallbackLang),
    };
  }
  return ctx;
}
