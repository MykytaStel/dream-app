import React from 'react';
import Animated, { useSharedValue, withRepeat, withTiming, useAnimatedStyle, Easing } from 'react-native-reanimated';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../../theme/theme';
import { createPulseStyles } from './Pulse.styles';

export const Pulse = ({ size = 64, active }: { size?: number; active: boolean }) => {
  const t = useTheme<Theme>();
  const styles = React.useMemo(() => createPulseStyles(t, size), [t, size]);
  const scale = useSharedValue(1);

  React.useEffect(() => {
    if (active) {
      scale.value = withRepeat(withTiming(1.08, { duration: 600, easing: Easing.inOut(Easing.quad) }), -1, true);
    } else {
      scale.value = withTiming(1, { duration: 150 });
    }
  }, [scale, active]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View
      style={[styles.pulse, style]}
    />
  );
};
