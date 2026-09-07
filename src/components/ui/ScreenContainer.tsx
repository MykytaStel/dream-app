import React from 'react';
import { ScrollView, ScrollViewProps, View, ViewProps } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTabBarReservedSpace } from '../../app/navigation/tabBarLayout';
import { Theme } from '../../theme/theme';
import { createScreenContainerStyles } from './ScreenContainer.styles';

type BaseProps = {
  padded?: boolean;
  withTopInset?: boolean;
  withBottomInset?: boolean;
};

type ScrollContainerProps = BaseProps &
  ScrollViewProps & {
    scroll?: true;
  };

type StaticContainerProps = BaseProps &
  ViewProps & {
    scroll?: false;
  };

export function ScreenContainer(
  props: ScrollContainerProps | StaticContainerProps,
) {
  const t = useTheme<Theme>();
  const insets = useSafeAreaInsets();
  const styles = React.useMemo(() => createScreenContainerStyles(t), [t]);
  const { padded = true, withTopInset = true, withBottomInset = true } = props;
  const insetStyle = {
    paddingTop: padded && withTopInset ? insets.top + t.spacing.xs : undefined,
    paddingBottom:
      padded && withBottomInset
        ? getTabBarReservedSpace(insets.bottom) + t.spacing.xs
        : undefined,
  };

  // A screen that owns its top area (no native header) scrolls its own content —
  // a ScrollView here, or a FlatList/SectionList passed as the child of a
  // `scroll={false} padded={false}` container — up past the system status bar
  // with nothing to hide it, so the title and body collide with the clock. A
  // solid strip in the background colour behaves like a nav bar would: content
  // just ends at the status-bar line. Screens with `withTopInset={false}` have a
  // native header already doing this, so they are left alone.
  const showStatusBarMask = withTopInset && insets.top > 0;
  const statusBarMaskSize = {
    height: insets.top,
    backgroundColor: t.colors.background,
  };
  const statusBarMask = showStatusBarMask ? (
    <View style={[styles.statusBarMask, statusBarMaskSize]} />
  ) : null;

  if (props.scroll) {
    const { contentContainerStyle, style, ...rest } = props;
    return (
      <View style={styles.base}>
        <ScrollView
          style={[styles.base, style]}
          contentContainerStyle={[
            padded ? styles.content : undefined,
            padded ? insetStyle : undefined,
            contentContainerStyle,
          ]}
          {...rest}
        />
        {statusBarMask}
      </View>
    );
  }

  const { style, ...rest } = props;
  return (
    <View style={styles.base}>
      <View
        style={[
          styles.base,
          padded ? styles.content : undefined,
          padded ? insetStyle : undefined,
          style,
        ]}
        {...rest}
      />
      {statusBarMask}
    </View>
  );
}
