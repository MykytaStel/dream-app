import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Animated, {
  FadeIn,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { Text } from '../../../components/ui/Text';
import type { Theme } from '../../../theme/theme';

type DreamDraftRecoveryToastProps = {
  title: string;
  description: string;
  dismissLabel: string;
  onDismiss: () => void;
};

export function DreamDraftRecoveryToast({
  title,
  description,
  dismissLabel,
  onDismiss,
}: DreamDraftRecoveryToastProps) {
  const theme = useTheme<Theme>();

  React.useEffect(() => {
    const timer = setTimeout(onDismiss, 7000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <Animated.View
      entering={SlideInDown.duration(320).springify()}
      exiting={SlideOutDown.duration(240)}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          shadowColor: theme.colors.shadow,
        },
      ]}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.accentRow} pointerEvents="none">
        <View
          style={[
            styles.accentSegment,
            { backgroundColor: theme.colors.auroraStart },
          ]}
        />
        <View
          style={[
            styles.accentSegment,
            { backgroundColor: theme.colors.auroraMid },
          ]}
        />
        <View
          style={[
            styles.accentSegment,
            { backgroundColor: theme.colors.auroraEnd },
          ]}
        />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={dismissLabel}
        onPress={onDismiss}
        style={styles.content}
      >
        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {title}
          </Text>
          <Text style={[styles.description, { color: theme.colors.textDim }]}>
            {description}
          </Text>
        </View>
        <Animated.View
          entering={FadeIn.delay(180).duration(240)}
          style={[styles.dismiss, { borderColor: theme.colors.border }]}
        >
          <Text style={[styles.dismissText, { color: theme.colors.textDim }]}>
            ✕
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    zIndex: 20,
    elevation: 10,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
  },
  accentRow: {
    flexDirection: 'row',
    height: 3,
  },
  accentSegment: {
    flex: 1,
    opacity: 0.85,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  dismiss: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 14,
  },
  dismissText: {
    fontSize: 11,
    lineHeight: 14,
  },
});
