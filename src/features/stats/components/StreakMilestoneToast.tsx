import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { Text } from '../../../components/ui/Text';
import { Theme } from '../../../theme/theme';

type Props = {
  title: string;
  subtitle: string;
  onDismiss: () => void;
};

export function StreakMilestoneToast({ title, subtitle, onDismiss }: Props) {
  const theme = useTheme<Theme>();

  // Auto-dismiss after 3.5 seconds
  React.useEffect(() => {
    const timer = setTimeout(onDismiss, 3500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <Animated.View
      entering={SlideInDown.duration(380).springify()}
      exiting={SlideOutDown.duration(280)}
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
      pointerEvents="box-none"
    >
      {/* Aurora gradient border accent (top edge) */}
      <View style={styles.auroraAccent}>
        <Animated.View
          entering={FadeIn.delay(200).duration(400)}
          style={[styles.auroraStart, { backgroundColor: theme.colors.auroraStart }]}
        />
        <Animated.View
          entering={FadeIn.delay(300).duration(400)}
          style={[styles.auroraMid, { backgroundColor: theme.colors.auroraMid }]}
        />
        <Animated.View
          entering={FadeIn.delay(400).duration(400)}
          style={[styles.auroraEnd, { backgroundColor: theme.colors.auroraEnd }]}
        />
      </View>

      <Pressable onPress={onDismiss} style={styles.content}>
        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textDim }]}>{subtitle}</Text>
        </View>
        <Animated.View
          entering={FadeIn.delay(250).duration(300)}
          style={[styles.dismissHint, { borderColor: theme.colors.border }]}
        >
          <Text style={[styles.dismissText, { color: theme.colors.textDim }]}>✕</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  auroraAccent: {
    flexDirection: 'row',
    height: 3,
  },
  auroraStart: {
    flex: 1,
    opacity: 0.9,
  },
  auroraMid: {
    flex: 1,
    opacity: 0.9,
  },
  auroraEnd: {
    flex: 1,
    opacity: 0.9,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  textBlock: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontFamily: 'Playfair Display',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 17,
  },
  dismissHint: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    fontSize: 11,
    lineHeight: 14,
  },
});
