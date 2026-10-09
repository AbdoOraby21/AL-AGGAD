import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Locale } from '../lib/types';

interface LangCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  dir: 'rtl' | 'ltr';
}

const Ctx = createContext<LangCtx>({ locale: 'ar', setLocale: () => {}, dir: 'rtl' });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    try { return (localStorage.getItem('aggad-locale') as Locale) || 'ar'; } catch { return 'ar'; }
  });
  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try { localStorage.setItem('aggad-locale', l); } catch { /* noop */ }
  }, []);
  const dir: 'rtl' | 'ltr' = locale === 'ar' ? 'rtl' : 'ltr';
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);
  const value = useMemo(() => ({ locale, setLocale, dir }), [locale, setLocale, dir]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);
