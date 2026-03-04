import { createTheme } from '@shopify/restyle';
import { palette, spacing, radius, typography } from './tokens';

export const theme = createTheme({
  colors: {
    background: palette.light.bg,
    surface: palette.light.surface,
    surfaceAlt: palette.light.surfaceAlt,
    surfaceElevated: palette.light.surfaceElevated,
    text: palette.light.text,
    textDim: palette.light.textDim,
    primary: palette.light.primary,
    primaryAlt: palette.light.primaryAlt,
    accent: palette.light.accent,
    auroraStart: palette.light.auroraStart,
    auroraMid: palette.light.auroraMid,
    auroraEnd: palette.light.auroraEnd,
    border: palette.light.border,
    danger: palette.light.danger,
    success: palette.light.success,
    tabIcon: palette.light.tabIcon,
    glow: palette.light.glow,
  },
  spacing,
  borderRadii: radius,
  textVariants: typography as any,
});
export type Theme = typeof theme;
