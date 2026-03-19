import React from 'react';
import { ThemeProvider } from '@shopify/restyle';
import {
  appThemeMetadata,
  themes,
  type AppThemeAppearance,
  type AppThemeId,
  type Theme,
} from './theme';
import { getStoredThemeId, saveThemeId } from './themePreferences';

type AppThemeContextValue = {
  appearance: AppThemeAppearance;
  theme: Theme;
  themeId: AppThemeId;
  setThemeId: (themeId: AppThemeId) => void;
};

const AppThemeContext = React.createContext<AppThemeContextValue | null>(null);

export const AppThemeProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [themeId, setThemeIdState] = React.useState<AppThemeId>(() =>
    getStoredThemeId(),
  );
  const [, startTransition] = React.useTransition();
  const themeIdRef = React.useRef(themeId);

  const setThemeId = React.useCallback(
    (nextThemeId: AppThemeId) => {
      if (themeIdRef.current === nextThemeId) {
        return;
      }

      themeIdRef.current = nextThemeId;
      saveThemeId(nextThemeId);
      startTransition(() => {
        setThemeIdState(nextThemeId);
      });
    },
    [startTransition],
  );

  const theme = themes[themeId];
  const appearance = appThemeMetadata[themeId].appearance;

  const value = React.useMemo<AppThemeContextValue>(
    () => ({
      appearance,
      theme,
      themeId,
      setThemeId,
    }),
    [appearance, theme, themeId, setThemeId],
  );

  return (
    <AppThemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </AppThemeContext.Provider>
  );
};

export function useAppTheme() {
  const context = React.useContext(AppThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within AppThemeProvider');
  }

  return context;
}
