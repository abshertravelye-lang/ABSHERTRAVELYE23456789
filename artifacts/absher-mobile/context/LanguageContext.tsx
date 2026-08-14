import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { t as translate, type Language, type TranslationKey } from '@/constants/i18n';

type LanguageContextValue = {
  lang: Language;
  /** Text writing direction for the active language (does NOT force I18nManager). */
  writingDirection: 'rtl' | 'ltr';
  isRTL: boolean;
  setLang: (lang: Language) => void;
  toggle: () => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'ar',
  writingDirection: 'rtl',
  isRTL: true,
  setLang: () => {},
  toggle: () => {},
  t: (key) => translate('ar', key),
});

const STORAGE_KEY = '@absher_lang';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('ar');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val === 'ar' || val === 'en') setLangState(val);
    });
  }, []);

  const setLang = useCallback(async (next: Language) => {
    setLangState(next);
    await AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  const toggle = useCallback(() => {
    setLangState((prev) => {
      const next: Language = prev === 'ar' ? 'en' : 'ar';
      AsyncStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      writingDirection: lang === 'ar' ? 'rtl' : 'ltr',
      isRTL: lang === 'ar',
      setLang,
      toggle,
      t: (key: TranslationKey) => translate(lang, key),
    }),
    [lang, setLang, toggle],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}

/** Convenience hook returning just the translate function. */
export function useT() {
  return useContext(LanguageContext).t;
}
