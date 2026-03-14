import React from 'react';
import { getStoredLocale, saveLocale } from './localeStore';
import { AppLocale } from './types';

type I18nContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
};

const I18nContext = React.createContext<I18nContextValue | null>(null);

export const I18nProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [locale, setLocaleState] = React.useState<AppLocale>(() => getStoredLocale());
  const [, startTransition] = React.useTransition();
  const localeRef = React.useRef(locale);

  const setLocale = React.useCallback(
    (nextLocale: AppLocale) => {
      if (localeRef.current === nextLocale) {
        return;
      }
      localeRef.current = nextLocale;
      saveLocale(nextLocale);
      startTransition(() => {
        setLocaleState(nextLocale);
      });
    },
    [startTransition],
  );

  const value = React.useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n() {
  const context = React.useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }

  return context;
}
