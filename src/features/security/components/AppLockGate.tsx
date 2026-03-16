import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { palette } from '../../../theme/tokens';
import { useAppLockGate } from '../hooks/useAppLockGate';

type AppLockGateProps = {
  children: React.ReactNode;
  promptMessage: string;
  unlockLabel: string;
  subtitle: string;
  appName: string;
};

export function AppLockGate({
  children,
  promptMessage,
  unlockLabel,
  subtitle,
  appName,
}: AppLockGateProps) {
  const { locked, triggerAuth } = useAppLockGate(promptMessage);

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
                color={palette.light.primaryAlt}
              />
            </View>
            <View style={styles.textBlock}>
              <AppLockText style={styles.title}>{appName}</AppLockText>
              <AppLockText style={styles.subtitle}>{subtitle}</AppLockText>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.unlockButton,
              pressed ? styles.unlockButtonPressed : null,
            ]}
            onPress={triggerAuth}
          >
            <Ionicons
              name="finger-print"
              size={18}
              color={palette.light.primary}
            />
            <AppLockText style={styles.unlockLabel}>{unlockLabel}</AppLockText>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

// Minimal text component that avoids Restyle dependency outside ThemeProvider
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
  container: {
    flex: 1,
    backgroundColor: palette.light.bg,
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
    backgroundColor: palette.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.light.border,
  },
  textBlock: {
    alignItems: 'center',
    gap: 8,
  },
  baseText: {
    color: palette.light.text,
    fontWeight: '400',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: palette.light.textDim,
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
    borderColor: palette.light.border,
    backgroundColor: palette.light.surface,
  },
  unlockButtonPressed: {
    opacity: 0.75,
  },
  unlockLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.light.primary,
  },
});
