export const palette = {
  light: {
    bg: '#141826',
    surface: '#181D2D',
    surfaceAlt: '#202638',
    surfaceElevated: '#262D42',
    text: '#F2F4FB',
    textDim: '#9CA5BF',
    primary: '#78B8FF',
    primaryAlt: '#9F7CFF',
    accent: '#63D9FF',
    auroraStart: '#63D9FF',
    auroraMid: '#8D7CFF',
    auroraEnd: '#C57EFF',
    border: '#31384F',
    danger: '#F36B7F',
    success: '#74D6B0',
    tabIcon: '#8D94AD',
    glow: '#78B8FF',
  },
  dark: {}
} as const;

export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 } as const;
export const spacing = { xs: 6, sm: 10, md: 14, lg: 18, xl: 24, xxl: 32, xxxl: 40 } as const;
export const typography = {
  h1: { fontSize: 30, lineHeight: 36, fontWeight: '700', letterSpacing: -0.3 },
  h2: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  h3: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 22 },
  small: { fontSize: 13, lineHeight: 18, opacity: 0.85 },
} as const;
