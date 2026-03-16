import React from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Text } from './Text';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Theme } from '../../theme/theme';
import { createButtonStyles } from './Button.styles';

export const Button = ({
  title,
  onPress,
  style,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  disabled = false,
}: {
  title: string;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
}) => {
  const t = useTheme<Theme>();
  const [pressed, setPressed] = React.useState(false);
  const styles = React.useMemo(() => createButtonStyles(t, variant, size, disabled), [t, variant, size, disabled]);
  const anim = useAnimatedStyle(() => ({
    transform: [
      { scale: withTiming(pressed && !disabled ? 0.985 : 1, { duration: 120 }) },
      { translateY: withTiming(pressed && !disabled ? 1 : 0, { duration: 120 }) },
    ],
  }));
  const iconColor = styles.label.color;
  const iconSize = size === 'sm' ? 15 : size === 'lg' ? 19 : 17;

  return (
    <Animated.View style={[styles.container, anim, style]}>
      <Pressable
        disabled={disabled}
        onPressIn={() => setPressed(!disabled)}
        onPressOut={() => setPressed(false)}
        onPress={onPress}
        style={styles.pressable}
      >
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' ? (
            <Ionicons name={icon} size={iconSize} color={iconColor} />
          ) : null}
          <Text style={styles.label}>{title}</Text>
          {icon && iconPosition === 'right' ? (
            <Ionicons name={icon} size={iconSize} color={iconColor} />
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
};
