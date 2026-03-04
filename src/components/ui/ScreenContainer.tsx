import React from 'react';
import { ScrollView, ScrollViewProps, View, ViewProps } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../../theme/theme';

type BaseProps = {
  padded?: boolean;
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
  const baseStyle = {
    flex: 1,
    backgroundColor: t.colors.background,
  };
  const contentStyle = {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  };

  if (props.scroll) {
    const { contentContainerStyle, style, padded = true, ...rest } = props;
    return (
      <ScrollView
        style={[baseStyle, style]}
        contentContainerStyle={[padded ? contentStyle : undefined, contentContainerStyle]}
        {...rest}
      />
    );
  }

  const { style, padded = true, ...rest } = props;
  return (
    <View
      style={[baseStyle, padded ? contentStyle : undefined, style]}
      {...rest}
    />
  );
}
