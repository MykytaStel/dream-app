import { createTheme } from '@shopify/restyle';
import { palette, spacing, radius, typography } from './tokens';

export const theme = createTheme({
  colors: {
    background: palette.light.bg,
    surface: palette.light.surface,
    surfaceAlt: palette.light.surfaceAlt,
    text: palette.light.text,
    textDim: palette.light.textDim,
    primary: palette.light.primary,
    primaryAlt: palette.light.primaryAlt,
    accent: palette.light.accent,
    border: palette.light.border,
    danger: palette.light.danger,
  },
  spacing,
  borderRadii: radius,
  textVariants: typography as any,
});
export type Theme = typeof theme;