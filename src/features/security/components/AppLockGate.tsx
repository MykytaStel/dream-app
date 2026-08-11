import React from 'react';
import { Alert, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../../../theme/AppThemeProvider';
import { Theme } from '../../../theme/theme';
import { useAppLockGate } from '../hooks/useAppLockGate';

type AppLockGateProps = {
  children: React.ReactNode;
  promptMessage: string;
  unlockLabel: string;
  subtitle: string;
  appName: string;
  lockDisabledTitle: string;
  lockDisabledDescription: string;
};

export function AppLockGate({
  children,
  promptMessage,
  unlockLabel,
  subtitle,
  appName,
  lockDisabledTitle,
  lockDisabledDescription,
}: AppLockGateProps) {
  const { locked, triggerAuth, autoDisabled, dismissAutoDisabledNotice } =
    useAppLockGate(promptMessage);
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  // Guards against showing the notice twice when both the iOS `onDismiss`
  // trigger and its fallback timer below end up firing for the same
  // auto-disable event.
  const noticeShownRef = React.useRef(false);

  const showAutoDisabledNotice = React.useCallback(() => {
    if (noticeShownRef.current) {
      return;
    }
    noticeShownRef.current = true;
    Alert.alert(lockDisabledTitle, lockDisabledDescription, [
      {
        text: 'OK',
        onPress: () => {
          noticeShownRef.current = false;
          dismissAutoDisabledNotice();
        },
      },
    ]);
  }, [dismissAutoDisabledNotice, lockDisabledDescription, lockDisabledTitle]);

  React.useEffect(() => {
    if (!autoDisabled) {
      return;
    }

    if (Platform.OS === 'android') {
      // Android's Modal never fires `onDismiss` (RN implements it iOS
      // only), and there's no known equivalent presentation race there, so
      // show the notice as soon as the lock disables itself.
      showAutoDisabledNotice();
      return;
    }

    // iOS: `onDismiss` (below, on the Modal) is the preferred trigger — it
    // fires only once the lock screen's own dismiss animation genuinely
    // completes, avoiding a drop from presenting an Alert while that Modal
    // is still animating out. But it cannot be relied on exclusively: if
    // `locked` flips to `false` while the Modal is still mid-*presentation*
    // (plausible here, since auto-disable can resolve within tens of
    // milliseconds of mount), UIKit can silently swallow the dismiss call
    // entirely, and `onDismiss` then never fires at all. This fallback
    // guarantees the notice — a security-relevant state change — is never
    // silently lost; `showAutoDisabledNotice`'s guard above makes it safe
    // to also fire from `onDismiss` if that happens to land first.
    const fallbackTimer = setTimeout(showAutoDisabledNotice, 600);
    return () => clearTimeout(fallbackTimer);
  }, [autoDisabled, showAutoDisabledNotice]);

  const handleLockModalDismiss = React.useCallback(() => {
    if (autoDisabled) {
      showAutoDisabledNotice();
    }
  }, [autoDisabled, showAutoDisabledNotice]);

  return (
    <>
      {children}
      <Modal
        visible={locked}
        animationType="fade"
        transparent={false}
        statusBarTranslucent
        onDismiss={handleLockModalDismiss}
      >
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconWrap}>
              <Ionicons
                name="lock-closed"
                size={40}
                color={theme.colors.primaryAlt}
              />
            </View>
            <View style={styles.textBlock}>
              <AppLockText style={styles.title}>{appName}</AppLockText>
              <AppLockText style={styles.subtitle}>{subtitle}</AppLockText>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.unlockButton,
              pressed ? styles.unlockButtonPressed : null,
            ]}
            onPress={triggerAuth}
          >
            <Ionicons
              name="finger-print"
              size={18}
              color={theme.colors.primary}
            />
            <AppLockText style={styles.unlockLabel}>{unlockLabel}</AppLockText>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

// This stays on plain React Native text so the lock gate does not depend on
// Restyle primitives.
function AppLockText({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) {
  const { Text } = require('react-native');
  return <Text style={[styles.baseText, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  baseText: {
    fontWeight: '400',
  },
});

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
      gap: 48,
    },
    content: {
      alignItems: 'center',
      gap: 20,
    },
    iconWrap: {
      width: 72,
      height: 72,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    textBlock: {
      alignItems: 'center',
      gap: 8,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      letterSpacing: -0.3,
      textAlign: 'center',
      color: theme.colors.text,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.textDim,
      textAlign: 'center',
      lineHeight: 20,
    },
    unlockButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    unlockButtonPressed: {
      opacity: 0.75,
    },
    unlockLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.primary,
    },
  });
}
