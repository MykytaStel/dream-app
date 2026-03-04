import React from 'react';
import { Pressable, ViewStyle } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Text } from './Text';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Theme } from '../../theme/theme';
import { createButtonStyles } from './Button.styles';

export const Button = ({
  title,
  onPress,
  style,
  variant = 'primary',
}: { title: string; onPress?: () => void; style?: ViewStyle; variant?: 'primary' | 'ghost' }) => {
  const t = useTheme<Theme>();
  const [pressed, setPressed] = React.useState(false);
  const isPrimary = variant === 'primary';
  const styles = createButtonStyles(t, isPrimary);
  const anim = useAnimatedStyle(() => ({
    transform: [
      { scale: withTiming(pressed ? 0.985 : 1, { duration: 120 }) },
      { translateY: withTiming(pressed ? 1 : 0, { duration: 120 }) },
    ],
  }));

  return (
    <Animated.View style={[styles.container, anim, style]}>
      <Pressable
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        onPress={onPress}
        style={styles.pressable}
      >
        <Text style={styles.label}>
          {title}
        </Text>
      </Pressable>
    </Animated.View>
  );
};
