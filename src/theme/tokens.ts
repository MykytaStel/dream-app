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
  scrim: string;
  switchTrackOff: string;
  switchThumb: string;
  /**
   * What a shadow is cast in. Always near-black today, but a light theme casts
   * softer, warmer shadows than a dark one, and `#000` hardcoded in a stylesheet
   * cannot know that.
   */
  shadow: string;
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
    scrim: '#0B1220',
    switchTrackOff: '#444B5A',
    switchThumb: '#F2F4FB',
    shadow: '#000000',
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
    scrim: '#0E090A',
    switchTrackOff: '#5A4348',
    switchThumb: '#FAF2F3',
    shadow: '#000000',
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
    scrim: '#08110F',
    switchTrackOff: '#41534E',
    switchThumb: '#EEF8F4',
    shadow: '#000000',
  },
  /**
   * The one light theme.
   *
   * Not a lightened copy of kaleidoscope: the blues and purples that read on a
   * dark background wash out on a pale one, so every hue is darkened until it
   * earns its contrast rather than merely resembling the dark original.
   *
   * Every pair is measured in `__tests__/themeContrast.test.ts` — body text at
   * 4.5:1, interface elements at 3:1 — because a light theme is designed on a
   * bright desk and read on a dim one.
   *
   * `scrim` stays dark: it is the colour laid over content to dim it, and a pale
   * scrim would not dim anything.
   */
  daylight: {
    bg: '#F4F6FC',
    surface: '#FFFFFF',
    surfaceAlt: '#E9EDF7',
    surfaceElevated: '#FFFFFF',
    text: '#131828',
    textDim: '#585F7A',
    primary: '#2F63C7',
    primaryAlt: '#6A4BC4',
    accent: '#0F7392',
    auroraStart: '#0F7392',
    auroraMid: '#6A4BC4',
    auroraEnd: '#9B3FBF',
    border: '#D5DBEC',
    danger: '#C0304A',
    success: '#1B7D5C',
    tabIcon: '#666E8B',
    glow: '#2F63C7',
    scrim: '#0B1220',
    switchTrackOff: '#BFC6DA',
    // The knob, not the label. This used to read `text` at the call site,
    // which is near-white in the dark themes and near-black here — so the one
    // light theme drew a black pill on a pale track.
    switchThumb: '#FFFFFF',
    // Softer than black: a pure-black shadow on a pale surface reads as dirt.
    shadow: '#1B2138',
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
