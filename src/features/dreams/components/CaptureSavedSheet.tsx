import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Text } from '../../../components/ui/Text';
import { getDreamCopy } from '../../../constants/copy/dreams';
import { useI18n } from '../../../i18n/I18nProvider';
import { createControlPill } from '../../../theme/surfaces';
import { Theme } from '../../../theme/theme';
import { Dream } from '../model/dream';

type CaptureSavedSheetProps = {
  visible: boolean;
  dream: Dream | null;
  prefersVoiceCapture: boolean;
  onClose: () => void;
  onCaptureAnother: () => void;
  onOpenDetail: () => void;
  onReturnHome: () => void;
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
  onReturnHome,
}: CaptureSavedSheetProps) {
  const { locale } = useI18n();
  const copy = React.useMemo(() => getDreamCopy(locale), [locale]);
  const t = useTheme<Theme>();
  const insets = useSafeAreaInsets();
  const styles = React.useMemo(() => createStyles(t, insets.bottom), [insets.bottom, t]);
  const localeKey = locale === 'uk' ? 'uk-UA' : 'en-US';
  const title = formatSavedDreamTitle(dream, copy.untitled);
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
            <View style={styles.handle} />

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

            <View style={styles.actions}>
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
              <Button
                title={copy.postSaveOpenDetail}
                onPress={onOpenDetail}
                variant="ghost"
                icon="arrow-forward-outline"
                iconPosition="right"
                size="md"
              />
              <Button
                title={copy.postSaveReturnHome}
                onPress={onReturnHome}
                variant="ghost"
                icon="home-outline"
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
      backgroundColor: 'rgba(6, 10, 26, 0.56)',
    },
    sheetWrap: {
      paddingHorizontal: theme.spacing.md,
      paddingBottom: bottomInset + theme.spacing.sm,
    },
    card: {
      gap: 12,
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
    eyebrow: {
      color: theme.colors.accent,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.7,
      textTransform: 'uppercase',
    },
    title: {
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
    actions: {
      gap: 8,
    },
  });
}
