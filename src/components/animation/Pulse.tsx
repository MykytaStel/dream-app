import React from 'react';
import Animated, { useSharedValue, withRepeat, withTiming, useAnimatedStyle, Easing } from 'react-native-reanimated';

export const Pulse = ({ size = 64, active }: { size?: number; active: boolean }) => {
  const scale = useSharedValue(1);
  React.useEffect(() => {
    if (active) {
      scale.value = withRepeat(withTiming(1.08, { duration: 600, easing: Easing.inOut(Easing.quad) }), -1, true);
    } else {
      scale.value = withTiming(1, { duration: 150 });
    }
  }, [active]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <Animated.View style={[{ width: size, height: size, borderRadius: size/2, backgroundColor: '#8A7CFF' }, style]} />;
};