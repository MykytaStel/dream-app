import React from 'react';
import {
  Alert,
  InteractionManager,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
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

  React.useEffect(() => {
    if (!autoDisabled) {
      return;
    }
    // Deferred past the lock screen's own dismiss animation — presenting an
    // Alert onto a Modal that's still animating out is a known way for iOS
    // to drop it, which would leave this security-relevant change (the lock
    // just turned itself off) with no visible notice at all.
    const task = InteractionManager.runAfterInteractions(() => {
      Alert.alert(lockDisabledTitle, lockDisabledDescription, [
        { text: 'OK', onPress: dismissAutoDisabledNotice },
      ]);
    });
    return () => task.cancel();
  }, [
    autoDisabled,
    dismissAutoDisabledNotice,
    lockDisabledDescription,
    lockDisabledTitle,
  ]);

  return (
    <>
      {children}
      <Modal
        visible={locked}
        animationType="fade"
        transparent={false}
        statusBarTranslucent
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
