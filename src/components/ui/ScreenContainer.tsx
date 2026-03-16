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

export function ScreenContainer(props: ScrollContainerProps | StaticContainerProps) {
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

  if (props.scroll) {
    const { contentContainerStyle, style, ...rest } = props;
    return (
      <ScrollView
        style={[styles.base, style]}
        contentContainerStyle={[
          padded ? styles.content : undefined,
          padded ? insetStyle : undefined,
          contentContainerStyle,
        ]}
        {...rest}
      />
    );
  }

  const { style, ...rest } = props;
  return (
    <View
      style={[
        styles.base,
        padded ? styles.content : undefined,
        padded ? insetStyle : undefined,
        style,
      ]}
      {...rest}
    />
  );
}
