import { useMemo } from 'react';
import { useTheme } from '@shopify/restyle';
import type { Theme } from './theme';

const factoryCaches = new WeakMap<object, WeakMap<Theme, unknown>>();

/**
 * Turns a `create<Owner>Styles(theme)` factory into a memoised StyleSheet.
 *
 * Pass a module-level factory, never an inline arrow — an inline one is a new
 * function every render and defeats the cache. Results are keyed by factory and
 * theme, so components sharing a factory share one StyleSheet object; this
 * replaces the hand-rolled `useMemo(() => createX(theme), [theme])` and the
 * per-file WeakMap caches that predated it.
 */
export function useStyles<T>(factory: (theme: Theme) => T): T {
  const theme = useTheme<Theme>();

  return useMemo(() => {
    let byTheme = factoryCaches.get(factory);
    if (!byTheme) {
      byTheme = new WeakMap();
      factoryCaches.set(factory, byTheme);
    }

    let styles = byTheme.get(theme) as T | undefined;
    if (!styles) {
      styles = factory(theme);
      byTheme.set(theme, styles);
    }

    return styles;
  }, [factory, theme]);
}
