import React from 'react';
import { Alert, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { hexToRgba } from '../../../theme/color';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Text } from '../../../components/ui/Text';
import { getSettingsCopy } from '../../../constants/copy/settings';
import { useI18n } from '../../../i18n/I18nProvider';
import { Theme } from '../../../theme/theme';
import { fontFamilies } from '../../../theme/fonts';
import {
  applyDreamReminderSettings,
  DEFAULT_REMINDER_SETTINGS,
  requestReminderPermission,
} from '../services/dreamReminderService';
import { trackReminderToggled } from '../../../services/observability/events';

type ReminderOnboardingModalProps = {
  visible: boolean;
  onClose: () => void;
};

/**
 * Owns its own enable flow end to end — request permission, apply the default
 * schedule, track it — so `HomeScreen.tsx` only has to pass `visible`/`onClose`,
 * the same shape every other onboarding modal in this codebase uses.
 */
export function ReminderOnboardingModal({
  visible,
  onClose,
}: ReminderOnboardingModalProps) {
  const { locale } = useI18n();
  const copy = React.useMemo(() => getSettingsCopy(locale), [locale]);
  const theme = useTheme<Theme>();
  const insets = useSafeAreaInsets();
  const styles = React.useMemo(
    () => createStyles(theme, insets.bottom),
    [insets.bottom, theme],
  );

  const onEnable = React.useCallback(async () => {
    const allowed = await requestReminderPermission();
    if (!allowed) {
      // Leave the modal open — the user dismisses it themselves via "Not
      // now". Auto-closing here would stack a modal-dismiss animation under
      // the OS alert the user hasn't dismissed yet.
      Alert.alert(
        copy.reminderPermissionDeniedTitle,
        copy.reminderPermissionDeniedDescription,
      );
      return;
    }

    await applyDreamReminderSettings({
      ...DEFAULT_REMINDER_SETTINGS,
      enabled: true,
    });
    trackReminderToggled({ enabled: true });
    onClose();
  }, [copy, onClose]);

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        {/* The backdrop is a dismiss target, and without a label a screen
            reader announces an unnamed button covering the whole screen. */}
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={copy.reminderOnboardingLaterAction}
        />
        <Animated.View
          entering={FadeInDown.duration(220)}
          style={styles.sheetWrap}
        >
          <Card style={styles.card}>
            <View style={styles.handle} />

            <View style={styles.heroRow}>
              <View style={styles.heroIconWrap}>
                <Ionicons
                  name="notifications-outline"
                  size={22}
                  color={theme.colors.onPrimary}
                />
              </View>
              <View style={styles.heroCopy}>
                <Text style={styles.eyebrow}>
                  {copy.reminderOnboardingEyebrow}
                </Text>
                <Text style={styles.title}>
                  {copy.reminderOnboardingTitle}
                </Text>
                <Text style={styles.description}>
                  {copy.reminderOnboardingDescription}
                </Text>
              </View>
            </View>

            <View style={styles.actions}>
              <Button
                title={copy.reminderOnboardingPrimaryAction}
                onPress={() => {
                  onEnable().catch(() => undefined);
                }}
                icon="notifications-outline"
                size="md"
              />
              <Button
                title={copy.reminderOnboardingLaterAction}
                onPress={onClose}
                variant="ghost"
                size="md"
              />
            </View>
          </Card>
        </Animated.View>
      </View>
    </Modal>
  );
}

function createStyles(theme: Theme, bottomInset: number) {
  return StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: hexToRgba(theme.colors.scrim, 0.58),
    },
    sheetWrap: {
      paddingHorizontal: theme.spacing.md,
      paddingBottom: bottomInset + theme.spacing.sm,
    },
    card: {
      gap: 14,
      paddingTop: theme.spacing.sm,
    },
    handle: {
      width: 44,
      height: 4,
      alignSelf: 'center',
      borderRadius: 999,
      backgroundColor: theme.colors.border,
      opacity: 0.9,
    },
    heroRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    heroIconWrap: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      borderWidth: 1,
      borderColor: hexToRgba(theme.colors.text, 0.12),
      shadowColor: theme.colors.glow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.2,
      shadowRadius: 14,
      elevation: 5,
    },
    heroCopy: {
      flex: 1,
      gap: 4,
    },
    eyebrow: {
      color: theme.colors.accent,
      fontFamily: fontFamilies.sans,
      fontSize: 12,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    title: {
      fontFamily: fontFamilies.display,
      fontSize: 28,
      lineHeight: 32,
    },
    description: {
      color: theme.colors.textDim,
      fontSize: 14,
      lineHeight: 20,
    },
    actions: {
      gap: 10,
    },
  });
}
