import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Text } from '../../../components/ui/Text';
import { Theme } from '../../../theme/theme';

type WidgetPinToastProps = {
  canPinNatively: boolean;
  onAddWidget: () => void;
  onDismiss: () => void;
  title: string;
  subtitle: string;
  actionLabel: string;
  dismissLabel: string;
};

export function WidgetPinToast({
  canPinNatively,
  onAddWidget,
  onDismiss,
  title,
  subtitle,
  actionLabel,
  dismissLabel,
}: WidgetPinToastProps) {
  const theme = useTheme<Theme>();

  return (
    <Animated.View
      entering={SlideInDown.duration(400).springify()}
      exiting={SlideOutDown.duration(280)}
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
    >
      <View style={styles.auroraAccent}>
        <Animated.View
          entering={FadeIn.delay(200).duration(400)}
          style={[styles.auroraSegment, { backgroundColor: theme.colors.auroraStart }]}
        />
        <Animated.View
          entering={FadeIn.delay(300).duration(400)}
          style={[styles.auroraSegment, { backgroundColor: theme.colors.auroraMid }]}
        />
        <Animated.View
          entering={FadeIn.delay(400).duration(400)}
          style={[styles.auroraSegment, { backgroundColor: theme.colors.auroraEnd }]}
        />
      </View>

      <View style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: `${theme.colors.primary}1F` }]}>
          <Ionicons name="grid-outline" size={20} color={theme.colors.primary} />
        </View>

        <View style={styles.body}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textDim }]}>{subtitle}</Text>

          <View style={styles.actions}>
            {(Platform.OS === 'android' && canPinNatively) || Platform.OS === 'ios' ? (
              <Pressable
                onPress={Platform.OS === 'android' ? onAddWidget : onDismiss}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  { backgroundColor: theme.colors.primary },
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
              >
                <Text style={[styles.primaryBtnLabel, { color: theme.colors.ink }]}>
                  {actionLabel}
                </Text>
              </Pressable>
            ) : null}

            <Pressable
              onPress={onDismiss}
              style={({ pressed }) => [styles.dismissBtn, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={[styles.dismissLabel, { color: theme.colors.textDim }]}>
                {dismissLabel}
              </Text>
            </Pressable>
          </View>
        </View>

        <Pressable
          onPress={onDismiss}
          style={({ pressed }) => [
            styles.closeBtn,
            { borderColor: theme.colors.border },
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
        >
          <Text style={[styles.closeLabel, { color: theme.colors.textDim }]}>✕</Text>
        </Pressable>
      </View>
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
  auroraSegment: {
    flex: 1,
    opacity: 0.9,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 10,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  body: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  primaryBtn: {
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  primaryBtnLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  dismissBtn: {
    paddingVertical: 7,
    paddingHorizontal: 4,
  },
  dismissLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  closeLabel: {
    fontSize: 10,
    lineHeight: 13,
  },
  pressed: {
    opacity: 0.7,
  },
});
