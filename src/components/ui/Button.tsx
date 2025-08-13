import React from 'react';
import { Pressable, ViewStyle } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Text } from './Text';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

export const Button = ({
  title,
  onPress,
  style,
  variant = 'primary',
}: { title: string; onPress?: () => void; style?: ViewStyle; variant?: 'primary' | 'ghost' }) => {
  const t = useTheme<any>();
  const [pressed, setPressed] = React.useState(false);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(pressed ? 0.98 : 1, { duration: 100 }) }],
  }));
  const bg = variant === 'primary' ? t.colors.primary : t.colors.surfaceAlt;
  const fg = variant === 'primary' ? '#0B0B0D' : t.colors.text;

  return (
    <Animated.View style={[{ borderRadius: t.borderRadii.xl }, anim, style]}>
      <Pressable
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        onPress={onPress}
        style={{ backgroundColor: bg, paddingVertical: 14, paddingHorizontal: 18, borderRadius: t.borderRadii.xl, borderWidth: 1, borderColor: t.colors.border }}
      >
        <Text style={{ textAlign: 'center', color: fg, fontWeight: '700' }}>{title}</Text>
      </Pressable>
    </Animated.View>
  );
};