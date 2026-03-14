import { StyleSheet } from 'react-native';
import { Theme } from '../../theme/theme';
import { fontFamilies } from '../../theme/fonts';

const cache = new WeakMap<Theme, ReturnType<typeof build>>();

function build(theme: Theme) {
  return StyleSheet.create({
    base: {
      color: theme.colors.text,
      fontFamily: fontFamilies.sans,
      fontSize: 16,
      lineHeight: 23,
      includeFontPadding: false,
    },
  });
}

export function getTextStyles(theme: Theme) {
  let styles = cache.get(theme);
  if (!styles) {
    styles = build(theme);
    cache.set(theme, styles);
  }
  return styles;
}
