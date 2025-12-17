'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Language = 'pl' | 'en';

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('pl');

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem('vocare-language');

    if (storedLanguage === 'pl' || storedLanguage === 'en') {
      setLanguageState(storedLanguage);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem('vocare-language', language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (value: Language) => {
    setLanguageState(value);
  };

  const toggleLanguage = () => {
    setLanguageState((prevLanguage) => (prevLanguage === 'pl' ? 'en' : 'pl'));
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }

  return context;
};
