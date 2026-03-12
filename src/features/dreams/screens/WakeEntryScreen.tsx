import React from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@shopify/restyle';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../../components/ui/Text';
import { getDreamCopy } from '../../../constants/copy/dreams';
import { useI18n } from '../../../i18n/I18nProvider';
import { Theme } from '../../../theme/theme';
import {
  ROOT_ROUTE_NAMES,
  type RootStackParamList,
} from '../../../app/navigation/routes';
import { openNewDreamTab } from '../../../app/navigation/navigationRef';
import {
  getDreamDraft,
  getDreamDraftSnapshot,
  type DreamDraftSnapshot,
} from '../services/dreamDraftService';
import {
  getDreamDraftResumeDescription,
  getDreamDraftSummaryLabels,
} from '../model/dreamDraftPresentation';
import { createWakeEntryScreenStyles } from './WakeEntryScreen.styles';

type IdleCallbackHandle = number;
type IdleSchedulerShape = {
  requestIdleCallback?: (callback: () => void) => IdleCallbackHandle;
};

export default function WakeEntryScreen() {
  const t = useTheme<Theme>();
  const styles = React.useMemo(() => createWakeEntryScreenStyles(t), [t]);
  const insets = useSafeAreaInsets();
  const { locale } = useI18n();
  const copy = React.useMemo(() => getDreamCopy(locale), [locale]);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, typeof ROOT_ROUTE_NAMES.WakeEntry>>();
  const [draftSnapshot, setDraftSnapshot] = React.useState<DreamDraftSnapshot | null>(null);
  const draftSummary = React.useMemo(
    () => getDreamDraftSummaryLabels(draftSnapshot, copy),
    [copy, draftSnapshot],
  );
  const draftHint = React.useMemo(
    () => getDreamDraftResumeDescription(draftSnapshot, copy),
    [copy, draftSnapshot],
  );

  React.useEffect(() => {
    setDraftSnapshot(getDreamDraftSnapshot(getDreamDraft()));
  }, []);

  const handoffToComposer = React.useCallback(
    (entryMode: 'default' | 'voice' | 'wake', autoStartRecording = false) => {
      navigation.goBack();
      const scheduler = globalThis as typeof globalThis & IdleSchedulerShape;
      const openComposer = () => {
        openNewDreamTab(
          entryMode === 'voice'
            ? {
                entryMode,
                autoStartRecording,
                launchKey: autoStartRecording ? Date.now() : undefined,
              }
            : { entryMode },
        );
      };

      if (typeof scheduler.requestIdleCallback === 'function') {
        scheduler.requestIdleCallback(openComposer);
        return;
      }

      setTimeout(openComposer, 0);
    },
    [navigation],
  );

  const draftPrimaryIcon =
    draftSnapshot?.resumeMode === 'voice'
      ? 'mic-outline'
      : draftSnapshot?.resumeMode === 'wake'
        ? 'sunny-outline'
        : 'create-outline';

  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={styles.glowTop} />
      <View pointerEvents="none" style={styles.glowLeft} />
      <View pointerEvents="none" style={styles.glowBottom} />

      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + t.spacing.md,
            paddingBottom: insets.bottom + t.spacing.lg,
          },
        ]}
      >
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel={copy.clearErrorAction}
            accessibilityRole="button"
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [
              styles.closeButton,
              pressed ? styles.closeButtonPressed : null,
            ]}
          >
            <Ionicons name="close" size={20} color={t.colors.text} />
          </Pressable>
        </View>

        <View style={styles.main}>
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>{copy.wakeEntryKicker}</Text>
            <Text style={styles.title}>{copy.wakeEntryTitle}</Text>
            <Text style={styles.description}>{copy.wakeEntryDescription}</Text>
          </View>

          <View style={styles.actionDeck}>
            {draftSnapshot ? (
              <Pressable
                accessibilityHint={draftHint}
                accessibilityLabel={copy.wakeEntryDraftAction}
                accessibilityRole="button"
                onPress={() => handoffToComposer(draftSnapshot.resumeMode)}
                style={({ pressed }) => [
                  styles.primaryActionCard,
                  pressed ? styles.primaryActionCardPressed : null,
                ]}
              >
                <View style={styles.primaryActionHeader}>
                  <View style={styles.primaryActionIconWrap}>
                    <Ionicons name={draftPrimaryIcon} size={20} color={t.colors.ink} />
                  </View>
                  <View style={styles.primaryActionCopy}>
                    <Text style={styles.primaryActionTitle}>{copy.wakeEntryDraftAction}</Text>
                    <Text style={styles.primaryActionHint}>{draftHint}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={t.colors.ink} />
                </View>
                {draftSummary.length ? (
                  <View style={styles.primaryActionMetaRow}>
                    {draftSummary.map(label => (
                      <View key={label} style={styles.primaryActionMetaChip}>
                        <Text style={styles.primaryActionMetaLabel}>{label}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </Pressable>
            ) : (
              <Pressable
                accessibilityHint={copy.wakeEntryOrbHint}
                accessibilityLabel={copy.wakeEntryWriteAction}
                accessibilityRole="button"
                onPress={() => handoffToComposer('wake')}
                style={({ pressed }) => [
                  styles.primaryActionCard,
                  pressed ? styles.primaryActionCardPressed : null,
                ]}
              >
                <View style={styles.primaryActionHeader}>
                  <View style={styles.primaryActionIconWrap}>
                    <Ionicons name="create-outline" size={20} color={t.colors.ink} />
                  </View>
                  <View style={styles.primaryActionCopy}>
                    <Text style={styles.primaryActionTitle}>{copy.wakeEntryWriteAction}</Text>
                    <Text style={styles.primaryActionHint}>{copy.wakeEntryOrbHint}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={t.colors.ink} />
                </View>
                <View style={styles.primaryActionMetaRow}>
                  <View style={styles.primaryActionMetaChip}>
                    <Text style={styles.primaryActionMetaLabel}>{copy.wakeModeChip}</Text>
                  </View>
                </View>
              </Pressable>
            )}

            <View style={styles.secondaryActions}>
              {draftSnapshot ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => handoffToComposer('wake')}
                  style={({ pressed }) => [
                    styles.actionCard,
                    pressed ? styles.actionCardPressed : null,
                  ]}
                >
                  <View style={styles.actionCardIconWrap}>
                    <Ionicons name="create-outline" size={18} color={t.colors.primary} />
                  </View>
                  <View style={styles.actionCardCopy}>
                    <Text style={styles.actionCardTitle}>{copy.wakeEntryWriteAction}</Text>
                    <Text style={styles.actionCardHint}>{copy.wakeEntryOrbHint}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={t.colors.textDim} />
                </Pressable>
              ) : null}
            <Pressable
              accessibilityRole="button"
              onPress={() => handoffToComposer('voice', true)}
              style={({ pressed }) => [
                styles.actionCard,
                pressed ? styles.actionCardPressed : null,
              ]}
            >
              <View style={styles.actionCardIconWrap}>
                <Ionicons name="mic-outline" size={18} color={t.colors.primary} />
              </View>
                <View style={styles.actionCardCopy}>
                  <Text style={styles.actionCardTitle}>{copy.wakeEntrySpeakAction}</Text>
                  <Text style={styles.actionCardHint}>{copy.wakeEntrySpeakHint}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={t.colors.textDim} />
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
