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
import { Theme } from '../../../theme/theme';
import { fontFamilies } from '../../../theme/fonts';
import { Dream } from '../model/dream';
import { getDreamDisplayTitle } from '../model/dreamTitle';
import { type DreamDetailFocusSection } from '../../../app/navigation/routes';

type CaptureSavedSheetProps = {
  visible: boolean;
  dream: Dream | null;
  prefersVoiceCapture: boolean;
  onClose: () => void;
  onCaptureAnother: () => void;
  onOpenDetail: (focusSection?: DreamDetailFocusSection) => void;
};

function formatSavedDreamTitle(dream: Dream | null, fallback: string) {
  return dream ? getDreamDisplayTitle(dream, fallback) : fallback;
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
  const styles = React.useMemo(
    () => createStyles(t, insets.bottom),
    [insets.bottom, t],
  );
  const localeKey = locale === 'uk' ? 'uk-UA' : 'en-US';
  const title = formatSavedDreamTitle(dream, copy.untitled);
  const savedAt = dream?.createdAt
    ? new Date(dream.createdAt).toLocaleString(localeKey, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          style={styles.backdrop}
          onPress={onClose}
        />
        <Animated.View
          entering={FadeInDown.duration(220)}
          style={styles.sheetWrap}
        >
          <Card style={styles.card}>
            <View style={styles.handle} />

            <View style={styles.successHero}>
              <View style={styles.successPulseWrap}>
                <Pulse size={52} active={visible} />
                <View style={styles.successOrb}>
                  <Ionicons
                    name="checkmark"
                    size={22}
                    color={t.colors.background}
                  />
                </View>
              </View>
            </View>

            <Text style={styles.title}>{copy.saveSuccessTitle}</Text>
            <Text style={styles.savedPreview} numberOfLines={1}>
              {title}
            </Text>
            {savedAt ? <Text style={styles.savedMeta}>{savedAt}</Text> : null}

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
                onPress={() => onOpenDetail()}
                variant="ghost"
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
                <Text style={styles.footerActionLabel}>
                  {copy.postSaveContinueLater}
                </Text>
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
      ...StyleSheet.absoluteFill,
      backgroundColor: `${theme.colors.scrim}8F`,
    },
    sheetWrap: {
      paddingHorizontal: theme.spacing.md,
      paddingBottom: bottomInset + theme.spacing.sm,
    },
    card: {
      gap: 10,
      paddingTop: theme.spacing.sm,
      overflow: 'hidden',
      position: 'relative',
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
      marginTop: 4,
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
    title: {
      fontFamily: fontFamilies.display,
      fontSize: 24,
      lineHeight: 28,
      fontWeight: '700',
      textAlign: 'center',
    },
    savedPreview: {
      color: theme.colors.text,
      fontSize: 14,
      lineHeight: 19,
      textAlign: 'center',
    },
    savedMeta: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 16,
      textAlign: 'center',
    },
    actions: {
      gap: 8,
      marginTop: 6,
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
