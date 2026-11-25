import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext(null);
const STORAGE_KEY = 'civicsathi_lang';

function initialLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'hi') return saved;
  } catch {
    /* storage may be blocked */
  }
  return 'en';
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(initialLanguage);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  // t('key', { name: 'Asha' }) -> replaces {name}. Falls back to English, then to the key.
  const t = useCallback(
    (key, params) => {
      let text = translations[lang]?.[key] ?? translations.en[key] ?? key;
      if (params) {
        text = text.replace(/\{(\w+)\}/g, (_, name) => (params[name] ?? ''));
      }
      return text;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
}
