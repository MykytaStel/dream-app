import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
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
import { BACKUP_ONBOARDING_DREAM_THRESHOLD } from '../model/backupOnboarding';

type BackupOnboardingModalProps = {
  visible: boolean;
  dreamCount: number;
  onClose: () => void;
  onOpenBackup: () => void;
};

export function BackupOnboardingModal({
  visible,
  dreamCount,
  onClose,
  onOpenBackup,
}: BackupOnboardingModalProps) {
  const { locale } = useI18n();
  const copy = React.useMemo(() => getSettingsCopy(locale), [locale]);
  const theme = useTheme<Theme>();
  const insets = useSafeAreaInsets();
  const styles = React.useMemo(
    () => createStyles(theme, insets.bottom),
    [insets.bottom, theme],
  );

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Animated.View entering={FadeInDown.duration(220)} style={styles.sheetWrap}>
          <Card style={styles.card}>
            <View pointerEvents="none" style={styles.glowLarge} />
            <View pointerEvents="none" style={styles.glowSmall} />
            <View style={styles.handle} />

            <View style={styles.heroRow}>
              <View style={styles.heroIconWrap}>
                <Ionicons name="cloud-upload-outline" size={22} color={theme.colors.ink} />
              </View>
              <View style={styles.heroCopy}>
                <Text style={styles.eyebrow}>{copy.backupOnboardingEyebrow}</Text>
                <Text style={styles.title}>{copy.backupOnboardingTitle}</Text>
                <Text style={styles.description}>{copy.backupOnboardingDescription}</Text>
              </View>
            </View>

            <View style={styles.statRow}>
              <View style={styles.statChip}>
                <Text style={styles.statValue}>{dreamCount}</Text>
                <Text style={styles.statLabel}>{copy.backupOnboardingDreamsLabel}</Text>
              </View>
              <View style={styles.statChip}>
                <Text style={styles.statValue}>{BACKUP_ONBOARDING_DREAM_THRESHOLD}</Text>
                <Text style={styles.statLabel}>{copy.backupOnboardingThresholdLabel}</Text>
              </View>
            </View>

            <View style={styles.valueCard}>
              <View style={styles.valueHeader}>
                <Ionicons name="sparkles-outline" size={16} color={theme.colors.accent} />
                <Text style={styles.valueTitle}>{copy.backupOnboardingValueTitle}</Text>
              </View>
              <Text style={styles.valueDescription}>
                {copy.backupOnboardingValueDescription}
              </Text>
            </View>

            <View style={styles.actions}>
              <Button
                title={copy.backupOnboardingPrimaryAction}
                onPress={onOpenBackup}
                icon="cloud-upload-outline"
                size="md"
              />
              <Button
                title={copy.backupOnboardingLaterAction}
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
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(6, 10, 26, 0.58)',
    },
    sheetWrap: {
      paddingHorizontal: theme.spacing.md,
      paddingBottom: bottomInset + theme.spacing.sm,
    },
    card: {
      gap: 14,
      paddingTop: theme.spacing.sm,
      overflow: 'hidden',
      position: 'relative',
    },
    glowLarge: {
      position: 'absolute',
      width: 184,
      height: 184,
      borderRadius: 999,
      backgroundColor: theme.colors.auroraMid,
      opacity: 0.1,
      top: -72,
      right: -32,
    },
    glowSmall: {
      position: 'absolute',
      width: 132,
      height: 132,
      borderRadius: 999,
      backgroundColor: theme.colors.accent,
      opacity: 0.08,
      bottom: -24,
      left: -18,
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
      borderColor: 'rgba(255,255,255,0.12)',
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
    statRow: {
      flexDirection: 'row',
      gap: 10,
    },
    statChip: {
      flex: 1,
      gap: 2,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
      backgroundColor: theme.colors.surfaceAlt,
    },
    statValue: {
      fontFamily: fontFamilies.display,
      fontSize: 24,
      lineHeight: 28,
    },
    statLabel: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 16,
    },
    valueCard: {
      gap: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 14,
      backgroundColor: theme.colors.surfaceAlt,
    },
    valueHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    valueTitle: {
      fontWeight: '700',
    },
    valueDescription: {
      color: theme.colors.textDim,
      fontSize: 13,
      lineHeight: 19,
    },
    actions: {
      gap: 10,
    },
  });
}
