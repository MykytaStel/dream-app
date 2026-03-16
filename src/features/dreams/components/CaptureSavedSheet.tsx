import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Pulse } from '../../../components/animation/Pulse';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Text } from '../../../components/ui/Text';
import { getDreamCopy } from '../../../constants/copy/dreams';
import { useI18n } from '../../../i18n/I18nProvider';
import { createControlPill } from '../../../theme/surfaces';
import { Theme } from '../../../theme/theme';
import { fontFamilies } from '../../../theme/fonts';
import { Dream } from '../model/dream';
import { type DreamDetailFocusSection } from '../../../app/navigation/routes';
import { getPostSaveFollowUps } from '../model/postSaveFollowUp';

type CaptureSavedSheetProps = {
  visible: boolean;
  dream: Dream | null;
  prefersVoiceCapture: boolean;
  onClose: () => void;
  onCaptureAnother: () => void;
  onOpenDetail: (focusSection?: DreamDetailFocusSection) => void;
};

function formatSavedDreamTitle(dream: Dream | null, fallback: string) {
  if (!dream) {
    return fallback;
  }

  return dream.title?.trim() || fallback;
}

export function CaptureSavedSheet({
  visible,
  dream,
  prefersVoiceCapture,
  onClose,
  onCaptureAnother,
  onOpenDetail,
}: CaptureSavedSheetProps) {
  const { locale } = useI18n();
  const copy = React.useMemo(() => getDreamCopy(locale), [locale]);
  const t = useTheme<Theme>();
  const insets = useSafeAreaInsets();
  const styles = React.useMemo(() => createStyles(t, insets.bottom), [insets.bottom, t]);
  const localeKey = locale === 'uk' ? 'uk-UA' : 'en-US';
  const title = formatSavedDreamTitle(dream, copy.untitled);
  const followUps = React.useMemo(() => getPostSaveFollowUps(dream, copy), [copy, dream]);
  const primaryFollowUp = followUps[0];
  const secondaryFollowUp = followUps[1] ?? null;
  const savedDate = dream?.sleepDate
    ? new Date(`${dream.sleepDate}T00:00:00`).toLocaleDateString(localeKey, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Animated.View entering={FadeInDown.duration(220)} style={styles.sheetWrap}>
          <Card style={styles.card}>
            <View pointerEvents="none" style={styles.glowLarge} />
            <View pointerEvents="none" style={styles.glowSmall} />
            <View style={styles.handle} />

            <View style={styles.successHero}>
              <View style={styles.successPulseWrap}>
                <Pulse size={52} active={visible} />
                <View style={styles.successOrb}>
                  <Ionicons name="checkmark" size={22} color={t.colors.ink} />
                </View>
              </View>
            </View>

            <Text style={styles.eyebrow}>{copy.saveSuccessTitle}</Text>
            <Text style={styles.title}>{copy.postSaveTitle}</Text>
            <Text style={styles.description}>{copy.postSaveDescription}</Text>

            <View style={styles.metaRow}>
              <View style={styles.metaChip}>
                <Text style={styles.metaChipLabel}>{copy.postSaveSavedLabel}</Text>
              </View>
              {savedDate ? (
                <View style={styles.metaChip}>
                  <Text style={styles.metaChipLabel}>{savedDate}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.savedSurface}>
              <Text style={styles.savedTitle} numberOfLines={2}>
                {title}
              </Text>
              {dream?.audioUri ? (
                <Text style={styles.savedHint}>{copy.attachedAudioTitle}</Text>
              ) : dream?.text ? (
                <Text style={styles.savedHint} numberOfLines={2}>
                  {dream.text}
                </Text>
              ) : null}
            </View>

            <View style={styles.followUpCard}>
              <View style={styles.followUpHeader}>
                <View style={styles.followUpIconWrap}>
                  <Ionicons name={primaryFollowUp.icon} size={16} color={t.colors.accent} />
                </View>
                <View style={styles.followUpCopy}>
                  <Text style={styles.followUpLabel}>{copy.postSaveNextStepLabel}</Text>
                  <Text style={styles.followUpTitle}>{primaryFollowUp.title}</Text>
                </View>
              </View>
              <Text style={styles.followUpDescription}>{primaryFollowUp.description}</Text>
            </View>

            <View style={styles.actions}>
              <Button
                title={primaryFollowUp.actionLabel}
                onPress={() => onOpenDetail(primaryFollowUp.focusSection)}
                variant="ghost"
                icon="arrow-forward-outline"
                iconPosition="right"
                size="md"
              />
              {secondaryFollowUp ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onOpenDetail(secondaryFollowUp.focusSection)}
                  style={({ pressed }) => [
                    styles.secondaryFollowUpRow,
                    pressed ? styles.secondaryFollowUpRowPressed : null,
                  ]}
                >
                  <View style={styles.secondaryFollowUpCopy}>
                    <Text style={styles.secondaryFollowUpLabel}>{copy.postSaveThenLabel}</Text>
                    <Text style={styles.secondaryFollowUpTitle}>
                      {secondaryFollowUp.title}
                    </Text>
                  </View>
                  <Text style={styles.secondaryFollowUpAction}>
                    {secondaryFollowUp.actionLabel}
                  </Text>
                </Pressable>
              ) : null}
              <Button
                title={
                  prefersVoiceCapture
                    ? copy.postSaveRecordAnother
                    : copy.postSaveCaptureAnother
                }
                onPress={onCaptureAnother}
                icon={prefersVoiceCapture ? 'mic-outline' : 'add-outline'}
                size="md"
              />
            </View>

            <View style={styles.footerActions}>
              <Pressable
                accessibilityRole="button"
                onPress={onClose}
                style={({ pressed }) => [
                  styles.footerAction,
                  pressed ? styles.footerActionPressed : null,
                ]}
              >
                <Text style={styles.footerActionLabel}>{copy.postSaveContinueLater}</Text>
              </Pressable>
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
      backgroundColor: `${theme.colors.ink}8F`,
    },
    sheetWrap: {
      paddingHorizontal: theme.spacing.md,
      paddingBottom: bottomInset + theme.spacing.sm,
    },
    card: {
      gap: 12,
      paddingTop: theme.spacing.sm,
      overflow: 'hidden',
      position: 'relative',
    },
    glowLarge: {
      position: 'absolute',
      width: 160,
      height: 160,
      borderRadius: 999,
      backgroundColor: theme.colors.auroraMid,
      opacity: 0.08,
      top: -58,
      right: -36,
    },
    glowSmall: {
      position: 'absolute',
      width: 110,
      height: 110,
      borderRadius: 999,
      backgroundColor: theme.colors.accent,
      opacity: 0.08,
      bottom: -26,
      left: -24,
    },
    handle: {
      width: 44,
      height: 4,
      alignSelf: 'center',
      borderRadius: 999,
      backgroundColor: theme.colors.border,
      opacity: 0.9,
    },
    successHero: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
      marginBottom: 2,
    },
    successPulseWrap: {
      width: 62,
      height: 62,
      alignItems: 'center',
      justifyContent: 'center',
    },
    successOrb: {
      position: 'absolute',
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      borderWidth: 1,
      borderColor: `${theme.colors.text}1F`,
      shadowColor: theme.colors.glow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.2,
      shadowRadius: 14,
      elevation: 5,
    },
    eyebrow: {
      color: theme.colors.accent,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.7,
      textTransform: 'uppercase',
    },
    title: {
      fontFamily: fontFamilies.display,
      fontSize: 24,
      lineHeight: 28,
      fontWeight: '700',
    },
    description: {
      color: theme.colors.textDim,
      fontSize: 14,
      lineHeight: 20,
    },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    metaChip: {
      ...createControlPill(theme, {
        tone: 'background',
        paddingVertical: 5,
        paddingHorizontal: 9,
      }),
    },
    metaChipLabel: {
      color: theme.colors.textDim,
      fontSize: 11,
      fontWeight: '700',
    },
    savedSurface: {
      borderRadius: theme.borderRadii.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      paddingVertical: 12,
      paddingHorizontal: 14,
      gap: 4,
    },
    savedTitle: {
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '700',
    },
    savedHint: {
      color: theme.colors.textDim,
      fontSize: 13,
      lineHeight: 18,
    },
    followUpCard: {
      gap: 8,
      borderRadius: theme.borderRadii.xl,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}29`,
      backgroundColor: `${theme.colors.primary}14`,
      paddingVertical: 12,
      paddingHorizontal: 14,
    },
    followUpHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    followUpIconWrap: {
      width: 30,
      height: 30,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: `${theme.colors.primary}1F`,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}2E`,
    },
    followUpCopy: {
      flex: 1,
      gap: 2,
    },
    followUpLabel: {
      color: theme.colors.accent,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    followUpTitle: {
      color: theme.colors.text,
      fontSize: 14,
      lineHeight: 18,
      fontWeight: '700',
    },
    followUpDescription: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    actions: {
      gap: 8,
    },
    secondaryFollowUpRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      borderRadius: theme.borderRadii.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      paddingVertical: 11,
      paddingHorizontal: 14,
    },
    secondaryFollowUpRowPressed: {
      opacity: 0.84,
    },
    secondaryFollowUpCopy: {
      flex: 1,
      gap: 2,
    },
    secondaryFollowUpLabel: {
      color: theme.colors.textDim,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    secondaryFollowUpTitle: {
      color: theme.colors.text,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '700',
    },
    secondaryFollowUpAction: {
      color: theme.colors.primary,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '700',
      textAlign: 'right',
    },
    footerActions: {
      alignItems: 'center',
    },
    footerAction: {
      borderRadius: 999,
      paddingVertical: 4,
      paddingHorizontal: 10,
    },
    footerActionPressed: {
      opacity: 0.7,
    },
    footerActionLabel: {
      color: theme.colors.textDim,
      fontSize: 13,
      fontWeight: '700',
    },
  });
}
