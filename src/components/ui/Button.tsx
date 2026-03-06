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
  disabled = false,
}: {
  title: string;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
}) => {
  const t = useTheme<Theme>();
  const [pressed, setPressed] = React.useState(false);
  const styles = createButtonStyles(t, variant, disabled);
  const anim = useAnimatedStyle(() => ({
    transform: [
      { scale: withTiming(pressed && !disabled ? 0.985 : 1, { duration: 120 }) },
      { translateY: withTiming(pressed && !disabled ? 1 : 0, { duration: 120 }) },
    ],
  }));

  return (
    <Animated.View style={[styles.container, anim, style]}>
      <Pressable
        disabled={disabled}
        onPressIn={() => setPressed(!disabled)}
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
