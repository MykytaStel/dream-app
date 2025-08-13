export const palette = {
  light: {
    bg: '#0B0B0D', // app is dark-first; reverse if you want
    surface: '#121216',
    surfaceAlt: '#1A1A1F',
    text: '#EAEAF0',
    textDim: '#B6B6C2',
    primary: '#8A7CFF',
    primaryAlt: '#5E54D3',
    accent: '#58E6D9',
    border: '#2A2A33',
    danger: '#FF6B6B',
  },
  dark: {}
} as const;

export const radius = { sm: 8, md: 12, lg: 20, xl: 28 } as const;
export const spacing = { xs: 6, sm: 10, md: 14, lg: 18, xl: 24, xxl: 32 } as const;
export const typography = {
  h1: { fontSize: 28, fontWeight: '700', letterSpacing: 0.2 },
  h2: { fontSize: 22, fontWeight: '700' },
  h3: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 16 },
  small: { fontSize: 13, opacity: 0.85 },
} as const;