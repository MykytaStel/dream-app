import React from 'react';
import { ViewStyle } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Theme } from '../../theme/theme';

export function SkeletonBlock({
  width = '100%',
  height = 12,
  radius,
  style,
}: {
  width?: ViewStyle['width'];
  height?: number;
  radius?: number;
  style?: ViewStyle;
}) {
  const t = useTheme<Theme>();
  const opacity = useSharedValue(0.55);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius ?? Math.max(8, Math.floor(height / 2)),
          backgroundColor: t.colors.surfaceAlt,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}
