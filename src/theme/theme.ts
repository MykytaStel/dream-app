import { createTheme } from '@shopify/restyle';
import { palette, radius, spacing, typography, type ThemePalette } from './tokens';

export const APP_THEME_IDS = ['kaleidoscope', 'ember', 'moss'] as const;

export type AppThemeId = (typeof APP_THEME_IDS)[number];
export type AppThemeAppearance = 'dark' | 'light';

const sharedTheme = {
  spacing,
  borderRadii: radius,
  textVariants: typography as any,
} as const;

function createAppTheme(colors: ThemePalette) {
  return createTheme({
    colors: {
      background: colors.bg,
      surface: colors.surface,
      surfaceAlt: colors.surfaceAlt,
      surfaceElevated: colors.surfaceElevated,
      text: colors.text,
      textDim: colors.textDim,
      primary: colors.primary,
      primaryAlt: colors.primaryAlt,
      accent: colors.accent,
      auroraStart: colors.auroraStart,
      auroraMid: colors.auroraMid,
      auroraEnd: colors.auroraEnd,
      border: colors.border,
      danger: colors.danger,
      success: colors.success,
      tabIcon: colors.tabIcon,
      glow: colors.glow,
      ink: colors.ink,
      switchTrackOff: colors.switchTrackOff,
    },
    ...sharedTheme,
  });
}

export const DEFAULT_THEME_ID: AppThemeId = 'kaleidoscope';

export const themes = {
  kaleidoscope: createAppTheme(palette.kaleidoscope),
  ember: createAppTheme(palette.ember),
  moss: createAppTheme(palette.moss),
} as const;

export const appThemeMetadata: Record<
  AppThemeId,
  {
    appearance: AppThemeAppearance;
  }
> = {
  kaleidoscope: { appearance: 'dark' },
  ember: { appearance: 'dark' },
  moss: { appearance: 'dark' },
};

export const theme = themes[DEFAULT_THEME_ID];

export function isAppThemeId(value: unknown): value is AppThemeId {
  return typeof value === 'string' && APP_THEME_IDS.includes(value as AppThemeId);
}

export type Theme = typeof theme;
