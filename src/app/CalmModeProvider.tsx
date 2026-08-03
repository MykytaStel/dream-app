import React from 'react';
import { APP_CALM_MODE_KEY } from '../services/storage/keys';
import { kv } from '../services/storage/mmkv';

/**
 * Calm mode: the app stops explaining itself.
 *
 * Nearly every card here carries a heading, a line under the heading saying
 * what the heading means, a label on each control and a hint under the label.
 * That is four levels of prose around one switch. It is useful exactly once —
 * the first time someone meets a screen — and it is in the way every time
 * after that.
 *
 * Rather than a hundred conditionals, this is read by the four shared
 * primitives that render secondary prose: SectionHeader's subtitle,
 * FormField's helper, SettingsSectionHeader's description and
 * SettingsActionRow's meta line. Turning it on empties those everywhere at
 * once, and nothing that carries information — a value, an error, a count —
 * goes with them.
 */
type CalmModeContextValue = {
  calmMode: boolean;
  setCalmMode: (value: boolean) => void;
};

const CalmModeContext = React.createContext<CalmModeContextValue | null>(null);

export function getStoredCalmMode(): boolean {
  return kv.getBoolean(APP_CALM_MODE_KEY) ?? false;
}

export const CalmModeProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [calmMode, setCalmModeState] = React.useState<boolean>(() =>
    getStoredCalmMode(),
  );

  const setCalmMode = React.useCallback((value: boolean) => {
    kv.set(APP_CALM_MODE_KEY, value);
    setCalmModeState(value);
  }, []);

  const value = React.useMemo<CalmModeContextValue>(
    () => ({ calmMode, setCalmMode }),
    [calmMode, setCalmMode],
  );

  return (
    <CalmModeContext.Provider value={value}>
      {children}
    </CalmModeContext.Provider>
  );
};

/**
 * Defaults to "not calm" outside the provider so a component rendered in a
 * test or a preview keeps its prose rather than silently losing it.
 */
export function useCalmMode(): CalmModeContextValue {
  return (
    React.useContext(CalmModeContext) ?? {
      calmMode: false,
      setCalmMode: () => undefined,
    }
  );
}
