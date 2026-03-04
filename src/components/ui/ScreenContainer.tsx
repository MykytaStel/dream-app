import React from 'react';
import { ScrollView, ScrollViewProps, View, ViewProps } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../../theme/theme';
import { createScreenContainerStyles } from './ScreenContainer.styles';

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
  const styles = createScreenContainerStyles(t);

  if (props.scroll) {
    const { contentContainerStyle, style, padded = true, ...rest } = props;
    return (
      <ScrollView
        style={[styles.base, style]}
        contentContainerStyle={[padded ? styles.content : undefined, contentContainerStyle]}
        {...rest}
      />
    );
  }

  const { style, padded = true, ...rest } = props;
  return (
    <View
      style={[styles.base, padded ? styles.content : undefined, style]}
      {...rest}
    />
  );
}
