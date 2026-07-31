import { fontFamilies } from './fonts';

export type ThemePalette = {
  bg: string;
  surface: string;
  surfaceAlt: string;
  surfaceElevated: string;
  text: string;
  textDim: string;
  primary: string;
  primaryAlt: string;
  accent: string;
  auroraStart: string;
  auroraMid: string;
  auroraEnd: string;
  border: string;
  danger: string;
  success: string;
  tabIcon: string;
  glow: string;
  ink: string;
  switchTrackOff: string;
  /**
   * What a shadow is cast in. Always near-black today, but a light theme casts
   * softer, warmer shadows than a dark one, and `#000` hardcoded in a stylesheet
   * cannot know that.
   */
  shadow: string;
  /**
   * Text and icons drawn on top of an accent or primary fill.
   *
   * Was `#FFFFFF` in a dozen places. White on a dark theme's accent is right;
   * white on a light theme's accent is unreadable, and that is the whole reason
   * this token exists rather than the literal.
   */
  onAccent: string;
};

export const palette = {
  kaleidoscope: {
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
    ink: '#0B1220',
    switchTrackOff: '#444B5A',
    shadow: '#000000',
    onAccent: '#FFFFFF',
  },
  ember: {
    bg: '#1A1214',
    surface: '#24181C',
    surfaceAlt: '#2D1F24',
    surfaceElevated: '#38272E',
    text: '#FAF2F3',
    textDim: '#C1A3A8',
    primary: '#FF9A7A',
    primaryAlt: '#FF6B8E',
    accent: '#FFC27A',
    auroraStart: '#FFC27A',
    auroraMid: '#FF8C69',
    auroraEnd: '#FF6B8E',
    border: '#4A3139',
    danger: '#FF8091',
    success: '#7ED9B3',
    tabIcon: '#B48893',
    glow: '#FF9A7A',
    ink: '#0E090A',
    switchTrackOff: '#5A4348',
    shadow: '#000000',
    onAccent: '#FFFFFF',
  },
  moss: {
    bg: '#101A18',
    surface: '#14211F',
    surfaceAlt: '#1B2A27',
    surfaceElevated: '#233530',
    text: '#EEF8F4',
    textDim: '#9EB9B0',
    primary: '#7DE3C0',
    primaryAlt: '#55C2D6',
    accent: '#A8F08E',
    auroraStart: '#7DE3C0',
    auroraMid: '#55C2D6',
    auroraEnd: '#A8F08E',
    border: '#314641',
    danger: '#F08C9D',
    success: '#7DE3C0',
    tabIcon: '#89A89F',
    glow: '#7DE3C0',
    ink: '#08110F',
    switchTrackOff: '#41534E',
    shadow: '#000000',
    onAccent: '#FFFFFF',
  },
} as const;

export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 } as const;
export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;
export const typography = {
  h1: {
    fontFamily: fontFamilies.display,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  h2: {
    fontFamily: fontFamilies.display,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  },
  h3: {
    fontFamily: fontFamilies.sans,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
  },
  body: { fontFamily: fontFamilies.sans, fontSize: 16, lineHeight: 22 },
  small: {
    fontFamily: fontFamilies.sans,
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.85,
  },
} as const;
