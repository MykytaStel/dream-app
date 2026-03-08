import React from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@shopify/restyle';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { FormField } from '../../../components/ui/FormField';
import { InfoRow } from '../../../components/ui/InfoRow';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { TagChip } from '../../../components/ui/TagChip';
import { Text } from '../../../components/ui/Text';
import {
  getDreamCopy,
  getDreamMoodLabels,
  getDreamPreSleepEmotionLabels,
  getDreamStressLabels,
  getDreamWakeEmotionLabels,
} from '../../../constants/copy/dreams';
import {
  ROOT_ROUTE_NAMES,
  TAB_ROUTE_NAMES,
  type RootStackParamList,
} from '../../../app/navigation/routes';
import { useI18n } from '../../../i18n/I18nProvider';
import { Theme } from '../../../theme/theme';
import { getDreamAnalysisSettings } from '../../analysis/services/dreamAnalysisSettingsService';
import type { DreamAnalysisSettings } from '../../analysis/model/dreamAnalysis';
import { Dream } from '../model/dream';
import { countDreamWords } from '../model/dreamAnalytics';
import { getRelatedDreams } from '../model/relatedDreams';
import {
  archiveDream,
  clearDreamAnalysis,
  clearDreamTranscript,
  deleteDream,
  getDream,
  listDreams,
  saveDreamTranscriptEdit,
  starDream,
  unarchiveDream,
  unstarDream,
} from '../repository/dreamsRepository';
import { generateDreamAnalysis } from '../../analysis/services/dreamAnalysisService';
import { play, stop } from '../services/audioService';
import {
  DreamTranscriptionProgress,
  transcribeDreamAudio,
} from '../services/dreamTranscriptionService';
import { createDreamDetailScreenStyles } from './DreamDetailScreen.styles';
import { DreamDetailActionTile } from '../components/DreamDetailActionTile';
import { DreamDetailSectionCard } from '../components/DreamDetailSectionCard';

function moodColor(theme: Theme, mood?: Dream['mood']) {
  if (mood === 'positive') {
    return theme.colors.accent;
  }

  if (mood === 'negative') {
    return theme.colors.primaryAlt;
  }

  return theme.colors.primary;
}

function formatMetaDate(value: number | string) {
  const date = typeof value === 'string' ? new Date(`${value}T00:00:00`) : new Date(value);
  return date.toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatMetaTimestamp(value: number) {
  return new Date(value).toLocaleString([], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatMetaTime(value: number) {
  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function hasSleepContext(dream: Dream) {
  const context = dream.sleepContext;
  if (!context) {
    return false;
  }

  return (
    typeof context.stressLevel === 'number' ||
    typeof context.alcoholTaken === 'boolean' ||
    typeof context.caffeineLate === 'boolean' ||
    Boolean(context.medications) ||
    Boolean(context.importantEvents) ||
    Boolean(context.healthNotes)
  );
}

function hasEmotionSnapshot(dream: Dream) {
  return Boolean(dream.wakeEmotions?.length || dream.sleepContext?.preSleepEmotions?.length);
}

type DetailSectionsState = {
  written: boolean;
  emotions: boolean;
  transcript: boolean;
  tags: boolean;
  related: boolean;
  analysis: boolean;
  context: boolean;
  audio: boolean;
};

function createDefaultExpandedSections(dream: Dream): DetailSectionsState {
  const hasTranscriptSurface = Boolean(
    dream.audioUri || dream.transcript || dream.transcriptStatus === 'error',
  );

  return {
    written: true,
    emotions: false,
    transcript: hasTranscriptSurface && !dream.text?.trim(),
    tags: false,
    related: false,
    analysis: false,
    context: false,
    audio: false,
  };
}

function getHeroPreview(dream: Dream, copy: ReturnType<typeof getDreamCopy>) {
  const text = dream.text?.trim();
  if (text) {
    return text.length > 160 ? `${text.slice(0, 157)}...` : text;
  }

  const transcript = dream.transcript?.trim();
  if (transcript) {
    const visible = transcript.length > 136 ? `${transcript.slice(0, 133)}...` : transcript;
    return `${copy.transcriptPreviewPrefix}: ${visible}`;
  }

  if (dream.audioUri) {
    return copy.audioOnlyPreview;
  }

  return null;
}

type DreamCopy = ReturnType<typeof getDreamCopy>;

function getCaptureModeLabel(dream: Dream, copy: DreamCopy) {
  if (dream.audioUri && dream.text?.trim()) {
    return copy.detailCaptureModeMixed;
  }

  if (dream.audioUri) {
    return copy.detailCaptureModeVoice;
  }

  return copy.detailCaptureModeText;
}

function getTranscriptSummaryLabel(
  dream: Dream,
  isTranscribingAudio: boolean,
  copy: DreamCopy,
) {
  if (isTranscribingAudio || dream.transcriptStatus === 'processing') {
    return copy.detailTranscriptSummaryProcessing;
  }

  if (dream.transcriptStatus === 'error') {
    return copy.detailTranscriptSummaryError;
  }

  if (dream.transcriptSource === 'edited') {
    return copy.detailTranscriptSummaryEdited;
  }

  if (dream.transcript) {
    return copy.detailTranscriptSummaryReady;
  }

  return copy.detailTranscriptSummaryIdle;
}

function getAnalysisSummaryLabel(
  dream: Dream,
  analysisSettings: DreamAnalysisSettings,
  copy: DreamCopy,
) {
  if (!analysisSettings.enabled) {
    return copy.detailAnalysisSummaryDisabled;
  }

  if (analysisSettings.provider === 'openai' && !dream.analysis) {
    return copy.detailAnalysisSummaryPlanned;
  }

  if (dream.analysis?.status === 'ready') {
    return copy.detailAnalysisSummaryReady;
  }

  if (dream.analysis?.status === 'error') {
    return copy.detailAnalysisStatusError;
  }

  return copy.detailAnalysisSummaryIdle;
}

function getRelatedMatchesLabel(count: number, copy: DreamCopy) {
  if (!count) {
    return copy.detailRelatedSummaryEmpty;
  }

  return String(count);
}

function countSleepSignals(dream: Dream) {
  let count = 0;

  count += dream.wakeEmotions?.length ?? 0;
  count += dream.sleepContext?.preSleepEmotions?.length ?? 0;

  if (typeof dream.sleepContext?.stressLevel === 'number') {
    count += 1;
  }

  if (typeof dream.sleepContext?.alcoholTaken === 'boolean') {
    count += 1;
  }

  if (typeof dream.sleepContext?.caffeineLate === 'boolean') {
    count += 1;
  }

  if (dream.sleepContext?.medications) {
    count += 1;
  }

  if (dream.sleepContext?.importantEvents) {
    count += 1;
  }

  if (dream.sleepContext?.healthNotes) {
    count += 1;
  }

  return count;
}

const detailLayoutTransition = LinearTransition.springify()
  .damping(18)
  .stiffness(180);

export default function DreamDetailScreen() {
  const t = useTheme<Theme>();
  const { locale } = useI18n();
  const copy = React.useMemo(() => getDreamCopy(locale), [locale]);
  const moodLabels = React.useMemo(() => getDreamMoodLabels(locale), [locale]);
  const stressLabels = React.useMemo(() => getDreamStressLabels(locale), [locale]);
  const wakeEmotionLabels = React.useMemo(() => getDreamWakeEmotionLabels(locale), [locale]);
  const preSleepEmotionLabels = React.useMemo(
    () => getDreamPreSleepEmotionLabels(locale),
    [locale],
  );
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, typeof ROOT_ROUTE_NAMES.DreamDetail>>();
  const styles = createDreamDetailScreenStyles(t);
  const [dream, setDream] = React.useState(() => getDream(route.params.dreamId));
  const [showSavedHighlight, setShowSavedHighlight] = React.useState(Boolean(route.params.justSaved));
  const [isPlayingAudio, setIsPlayingAudio] = React.useState(false);
  const [isTranscribingAudio, setIsTranscribingAudio] = React.useState(false);
  const [isEditingTranscript, setIsEditingTranscript] = React.useState(false);
  const [transcriptDraft, setTranscriptDraft] = React.useState('');
  const [expandedSections, setExpandedSections] = React.useState<DetailSectionsState | null>(
    () => (dream ? createDefaultExpandedSections(dream) : null),
  );
  const [analysisSettings, setAnalysisSettings] = React.useState<DreamAnalysisSettings>(() =>
    getDreamAnalysisSettings(),
  );
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = React.useState(false);
  const [transcriptionProgress, setTranscriptionProgress] =
    React.useState<DreamTranscriptionProgress | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      const nextDream = getDream(route.params.dreamId);
      setDream(nextDream);
      setExpandedSections(nextDream ? createDefaultExpandedSections(nextDream) : null);
      setAnalysisSettings(getDreamAnalysisSettings());
      setTranscriptDraft(nextDream?.transcript ?? '');
      setIsPlayingAudio(false);
      setIsTranscribingAudio(false);
      setIsEditingTranscript(false);
      setTranscriptionProgress(null);
      setShowSavedHighlight(Boolean(route.params.justSaved));

      if (route.params.justSaved) {
        navigation.setParams({
          justSaved: false,
        });
      }

      return () => {
        stop().catch(() => undefined);
      };
    }, [navigation, route.params.dreamId, route.params.justSaved]),
  );

  const relatedDreams = React.useMemo(
    () => (dream ? getRelatedDreams(dream, listDreams()) : []),
    [dream],
  );

  if (!dream) {
    return (
      <ScreenContainer scroll>
        <Card style={styles.heroCard}>
          <View pointerEvents="none" style={styles.heroGlowLarge} />
          <View pointerEvents="none" style={styles.heroGlowSmall} />
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel={copy.detailBack}
          >
            <Ionicons name="chevron-back" size={18} color={t.colors.text} />
          </Pressable>
          <SectionHeader
            title={copy.detailMissingTitle}
            subtitle={copy.detailMissingDescription}
            large
          />
        </Card>
      </ScreenContainer>
    );
  }

  const dreamId = dream.id;
  const archived = typeof dream.archivedAt === 'number';
  const starred = typeof dream.starredAt === 'number';
  const moodLabel = dream.mood ? moodLabels[dream.mood] : undefined;
  const wordsCount = countDreamWords(dream.text);
  const hasContext = hasSleepContext(dream);
  const hasEmotions = hasEmotionSnapshot(dream);
  const transcriptStatus = dream.transcriptStatus ?? (dream.transcript ? 'ready' : 'idle');
  const transcriptSourceLabel =
    dream.transcriptSource === 'edited'
      ? copy.detailGeneratedTranscriptSourceEdited
      : copy.detailGeneratedTranscriptSourceGenerated;
  const analysisProviderLabel =
    dream.analysis?.provider === 'openai'
      ? copy.detailAnalysisProviderOpenAi
      : copy.detailAnalysisProviderManual;
  const analysisStatusLabel =
    dream.analysis?.status === 'ready'
      ? copy.detailAnalysisStatusReady
      : dream.analysis?.status === 'error'
        ? copy.detailAnalysisStatusError
        : copy.detailAnalysisStatusIdle;
  const analysisStateText = !analysisSettings.enabled
    ? copy.detailAnalysisStateDisabled
    : analysisSettings.provider === 'openai'
      ? copy.detailAnalysisStateOpenAiPlanned
      : dream.analysis?.status === 'ready'
        ? copy.detailAnalysisStateLocalReady
        : copy.detailAnalysisStateManual;
  const strongestSignal =
    relatedDreams[0]?.sharedSignals[0] ?? dream.tags[0] ?? dream.wakeEmotions?.[0] ?? null;
  const heroPreview = getHeroPreview(dream, copy);
  const sections = expandedSections ?? createDefaultExpandedSections(dream);
  const heroSubtitle = `${dream.sleepDate ? formatMetaDate(dream.sleepDate) : formatMetaDate(dream.createdAt)} · ${formatMetaTime(dream.createdAt)}`;
  const glanceCards = [
    {
      key: 'capture',
      icon: dream.audioUri && dream.text?.trim() ? 'layers-outline' : dream.audioUri ? 'mic-outline' : 'document-text-outline',
      label: copy.detailGlanceCaptureLabel,
      value: getCaptureModeLabel(dream, copy),
    },
    {
      key: 'transcript',
      icon: dream.transcript ? 'chatbubble-ellipses-outline' : 'sparkles-outline',
      label: copy.detailGlanceTranscriptLabel,
      value: getTranscriptSummaryLabel(dream, isTranscribingAudio, copy),
    },
    {
      key: 'analysis',
      icon: 'sparkles-outline',
      label: copy.detailGlanceAnalysisLabel,
      value: getAnalysisSummaryLabel(dream, analysisSettings, copy),
    },
    {
      key: 'related',
      icon: 'git-compare-outline',
      label: copy.detailGlanceRelatedLabel,
      value: getRelatedMatchesLabel(relatedDreams.length, copy),
    },
  ];
  const stateSignalsCount = countSleepSignals(dream);
  const tagCountLabel = dream.tags.length ? String(dream.tags.length) : undefined;
  const notesMetaLabel = wordsCount ? String(wordsCount) : undefined;
  const transcriptMetaLabel =
    dream.audioUri || dream.transcript || transcriptStatus === 'error'
      ? getTranscriptSummaryLabel(dream, isTranscribingAudio, copy)
      : undefined;
  const relatedMetaLabel = relatedDreams.length ? String(relatedDreams.length) : undefined;
  const analysisMetaLabel =
    dream.analysis?.status === 'ready'
      ? copy.detailAnalysisStatusReady
      : dream.analysis?.status === 'error'
        ? copy.detailAnalysisStatusError
        : !analysisSettings.enabled
          ? copy.detailAnalysisSummaryDisabled
          : analysisSettings.provider === 'openai'
            ? copy.detailAnalysisSummaryPlanned
            : undefined;
  const stateMetaLabel = stateSignalsCount ? String(stateSignalsCount) : undefined;

  function toggleSection(section: keyof DetailSectionsState) {
    setExpandedSections(current => ({
      ...(current ?? sections),
      [section]: !(current ?? sections)[section],
    }));
  }

  function formatTranscriptionProgress(progress: DreamTranscriptionProgress | null) {
    if (!progress) {
      return null;
    }

    const baseLabel =
      progress.phase === 'preparing-model'
        ? copy.detailTranscribePreparingModel
        : copy.detailTranscribeInProgress;

    if (typeof progress.progress !== 'number') {
      return baseLabel;
    }

    return `${baseLabel} ${progress.progress}%`;
  }

  function onToggleArchiveDream() {
    const nextDream = archived ? unarchiveDream(dreamId) : archiveDream(dreamId);
    if (nextDream) {
      setDream(nextDream);
    }
  }

  function onToggleStarDream() {
    const nextDream = starred ? unstarDream(dreamId) : starDream(dreamId);
    setDream(nextDream);
  }

  function onDeleteDream() {
    Alert.alert(
      copy.detailDeleteTitle,
      copy.detailDeleteDescription,
      [
        {
          text: copy.detailDeleteCancel,
          style: 'cancel',
        },
        {
          text: copy.detailDeleteConfirm,
          style: 'destructive',
          onPress: () => {
            deleteDream(dreamId);
            navigation.goBack();
          },
        },
      ],
    );
  }

  async function onToggleAudioPlayback() {
    const audioUri = dream?.audioUri;
    if (!audioUri) {
      return;
    }

    try {
      if (isPlayingAudio) {
        await stop();
        setIsPlayingAudio(false);
        return;
      }

      await play(audioUri);
      setIsPlayingAudio(true);
    } catch (error) {
      setIsPlayingAudio(false);
      Alert.alert(
        copy.detailAudioPlaybackErrorTitle,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  async function onTranscribeAudio() {
    const currentDream = dream;
    if (!currentDream?.audioUri || isTranscribingAudio) {
      return;
    }

    setIsTranscribingAudio(true);
    setTranscriptionProgress({
      phase: 'preparing-model',
      progress: 0,
    });

    try {
      const pendingTranscription = transcribeDreamAudio(dreamId, nextProgress => {
        setTranscriptionProgress(nextProgress);
      });
      setDream(getDream(dreamId));
      await pendingTranscription;
      setDream(getDream(dreamId));
      setExpandedSections(current => ({
        ...(current ?? sections),
        transcript: true,
      }));
      setTranscriptDraft(getDream(dreamId)?.transcript ?? '');
    } catch (error) {
      setDream(getDream(dreamId));
      setTranscriptDraft(getDream(dreamId)?.transcript ?? '');
      const fallbackDescription = copy.detailTranscriptionErrorDescription;
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert(copy.detailTranscriptionErrorTitle, `${fallbackDescription}\n${message}`);
    } finally {
      setIsTranscribingAudio(false);
      setTranscriptionProgress(null);
    }
  }

  function onStartTranscriptEdit() {
    setTranscriptDraft(dream?.transcript ?? '');
    setExpandedSections(current => ({
      ...(current ?? sections),
      transcript: true,
    }));
    setIsEditingTranscript(true);
  }

  function onCancelTranscriptEdit() {
    setTranscriptDraft(dream?.transcript ?? '');
    setIsEditingTranscript(false);
  }

  function onSaveTranscriptEdit() {
    const nextTranscript = transcriptDraft.trim();
    if (!nextTranscript) {
      Alert.alert(
        copy.detailGeneratedTranscriptEmptyErrorTitle,
        copy.detailGeneratedTranscriptEmptyErrorDescription,
      );
      return;
    }

    const nextDream = saveDreamTranscriptEdit(dreamId, nextTranscript);
    setDream(nextDream);
    setTranscriptDraft(nextDream.transcript ?? '');
    setIsEditingTranscript(false);
    Alert.alert(
      copy.detailGeneratedTranscriptSaveSuccessTitle,
      copy.detailGeneratedTranscriptSaveSuccessDescription,
    );
  }

  function onClearTranscript() {
    Alert.alert(
      copy.detailGeneratedTranscriptClearTitle,
      copy.detailGeneratedTranscriptClearDescription,
      [
        {
          text: copy.detailDeleteCancel,
          style: 'cancel',
        },
        {
          text: copy.detailGeneratedTranscriptClear,
          style: 'destructive',
          onPress: () => {
            const nextDream = clearDreamTranscript(dreamId);
            setDream(nextDream);
            setTranscriptDraft('');
            setIsEditingTranscript(false);
          },
        },
      ],
    );
  }

  async function onGenerateAnalysis() {
    if (isGeneratingAnalysis || !analysisSettings.enabled) {
      return;
    }

    if (analysisSettings.provider === 'openai') {
      Alert.alert(copy.detailAnalysisErrorTitle, copy.detailAnalysisOpenAiUnavailable);
      return;
    }

    setExpandedSections(current => ({
      ...(current ?? sections),
      analysis: true,
    }));
    setIsGeneratingAnalysis(true);

    try {
      await generateDreamAnalysis(dreamId);
      setDream(getDream(dreamId));
    } catch (error) {
      setDream(getDream(dreamId));
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert(
        copy.detailAnalysisErrorTitle,
        `${copy.detailAnalysisGenerateErrorDescription}\n${message}`,
      );
    } finally {
      setIsGeneratingAnalysis(false);
    }
  }

  function onClearAnalysis() {
    const nextDream = clearDreamAnalysis(dreamId);
    setDream(nextDream);
  }

  function onOpenSettingsForAnalysis() {
    navigation.navigate(ROOT_ROUTE_NAMES.Tabs, {
      screen: TAB_ROUTE_NAMES.Settings,
    });
  }

  return (
    <ScreenContainer scroll>
      <Animated.View entering={FadeInDown.duration(240)} layout={detailLayoutTransition}>
        <Card style={styles.heroCard}>
          <View pointerEvents="none" style={styles.heroGlowLarge} />
          <View pointerEvents="none" style={styles.heroGlowSmall} />

          <View style={styles.heroTopBar}>
            <Pressable
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              accessibilityLabel={copy.detailBack}
            >
              <Ionicons name="chevron-back" size={18} color={t.colors.text} />
            </Pressable>

            <View style={styles.heroStatusRow}>
              {moodLabel ? (
                <View style={styles.statusChip}>
                  <View style={[styles.statusDot, { backgroundColor: moodColor(t, dream.mood) }]} />
                  <Text style={styles.statusChipLabel}>{moodLabel}</Text>
                </View>
              ) : null}
              <Pressable
                onPress={onToggleStarDream}
                style={({ pressed }) => [
                  styles.statusChip,
                  styles.statusChipInteractive,
                  starred ? styles.statusChipActive : null,
                  pressed ? styles.statusChipPressed : null,
                ]}
                accessibilityRole="button"
                accessibilityLabel={starred ? copy.detailUnstar : copy.detailStar}
              >
                <Ionicons
                  name={starred ? 'star' : 'star-outline'}
                  size={12}
                  color={starred ? t.colors.background : t.colors.primary}
                />
                <Text style={[styles.statusChipLabel, starred ? styles.statusChipLabelActive : null]}>
                  {copy.starredTag}
                </Text>
              </Pressable>
              <Pressable
                onPress={onToggleArchiveDream}
                style={({ pressed }) => [
                  styles.statusChip,
                  styles.statusChipInteractive,
                  archived ? styles.statusChipActive : null,
                  pressed ? styles.statusChipPressed : null,
                ]}
                accessibilityRole="button"
                accessibilityLabel={archived ? copy.detailUnarchive : copy.detailArchive}
              >
                <Ionicons
                  name={archived ? 'refresh-outline' : 'archive-outline'}
                  size={12}
                  color={archived ? t.colors.background : t.colors.textDim}
                />
                <Text style={[styles.statusChipLabel, archived ? styles.statusChipLabelActive : null]}>
                  {archived ? copy.detailActionRestore : copy.archivedTag}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.heroHeader}>
            <View style={styles.heroTitleRow}>
              <Text style={styles.heroTitle}>{dream.title || copy.untitled}</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.titleEditButton,
                  pressed ? styles.titleEditButtonPressed : null,
                ]}
                onPress={() =>
                  navigation.navigate(ROOT_ROUTE_NAMES.DreamEditor, {
                    dreamId,
                  })
                }
                accessibilityRole="button"
                accessibilityLabel={copy.detailEdit}
              >
                <Ionicons name="create-outline" size={16} color={t.colors.text} />
              </Pressable>
            </View>
            <Text style={styles.heroSubtitle}>{heroSubtitle}</Text>
          </View>

          {heroPreview ? (
            <Text numberOfLines={3} style={styles.heroPreviewText}>
              {heroPreview}
            </Text>
          ) : null}
        </Card>
      </Animated.View>

      {showSavedHighlight ? (
        <Animated.View entering={FadeInDown.delay(40).duration(220)} layout={detailLayoutTransition}>
          <Card style={styles.savedCard}>
            <View style={styles.savedHeader}>
              <View style={styles.savedCopy}>
                <Text style={styles.savedTitle}>{copy.detailSavedTitle}</Text>
                <Text style={styles.savedDescription}>{copy.detailSavedDescription}</Text>
              </View>
              <Pressable
                style={styles.savedDismiss}
                onPress={() => setShowSavedHighlight(false)}
                accessibilityLabel={copy.clearErrorAction}
              >
                <Ionicons name="close" size={16} color={t.colors.textDim} />
              </Pressable>
            </View>

            <View style={styles.savedStatsRow}>
              <View style={styles.savedStatTile}>
                <Text style={styles.savedStatLabel}>{copy.detailSavedPatternLabel}</Text>
                <Text style={styles.savedStatValue}>
                  {strongestSignal ?? copy.homeSpotlightNoPattern}
                </Text>
              </View>
              <View style={styles.savedStatTile}>
                <Text style={styles.savedStatLabel}>{copy.detailSavedRelatedLabel}</Text>
                <Text style={styles.savedStatValue}>{relatedDreams.length}</Text>
              </View>
            </View>
          </Card>
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.delay(55).duration(220)} layout={detailLayoutTransition}>
        <Card style={styles.summaryCard}>
          <View style={styles.glanceGrid}>
            {glanceCards.map(item => (
              <View key={item.key} style={styles.glanceCard}>
                <View style={styles.glanceHeader}>
                  <View style={styles.glanceIconShell}>
                    <Ionicons name={item.icon} size={14} color={t.colors.textDim} />
                  </View>
                  <Text style={styles.glanceLabel}>{item.label}</Text>
                </View>
                <Text style={styles.glanceValue}>{item.value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.heroActionsRow}>
            <DreamDetailActionTile
              icon="create-outline"
              label={copy.detailActionEdit}
              onPress={() =>
                navigation.navigate(ROOT_ROUTE_NAMES.DreamEditor, {
                  dreamId,
                })
              }
            />
            <DreamDetailActionTile
              icon="trash-outline"
              label={copy.detailActionDelete}
              onPress={onDeleteDream}
              danger
            />
          </View>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(70).duration(220)} layout={detailLayoutTransition}>
        <DreamDetailSectionCard
          title={copy.detailTranscriptTitle}
          meta={notesMetaLabel}
          expanded={sections.written}
          onToggle={() => toggleSection('written')}
        >
          <Text style={dream.text ? styles.bodyText : styles.mutedText}>
            {dream.text || copy.detailTranscriptEmpty}
          </Text>
        </DreamDetailSectionCard>
      </Animated.View>

      {dream.audioUri || dream.transcript || transcriptStatus === 'error' ? (
        <Animated.View entering={FadeInDown.delay(90).duration(220)} layout={detailLayoutTransition}>
          <DreamDetailSectionCard
            title={copy.detailGeneratedTranscriptTitle}
            meta={transcriptMetaLabel}
            expanded={sections.transcript}
            onToggle={() => toggleSection('transcript')}
          >

            {transcriptionProgress ? (
              <View style={styles.progressBadge}>
                <Text style={styles.progressBadgeLabel}>
                  {formatTranscriptionProgress(transcriptionProgress)}
                </Text>
              </View>
            ) : null}

            {isEditingTranscript ? (
              <FormField
                value={transcriptDraft}
                onChangeText={setTranscriptDraft}
                multiline
                inputStyle={styles.transcriptEditorInput}
                helperText={`${transcriptDraft.trim() ? transcriptDraft.trim().split(/\s+/).length : 0} ${copy.wordsUnit}`}
              />
            ) : dream.transcript ? (
              <Text style={styles.bodyText}>{dream.transcript}</Text>
            ) : transcriptStatus === 'processing' || isTranscribingAudio ? (
              <Text style={styles.statusText}>{copy.detailGeneratedTranscriptProcessing}</Text>
            ) : transcriptStatus === 'error' ? (
              <Text style={styles.statusErrorText}>{copy.detailGeneratedTranscriptError}</Text>
            ) : (
              <Text style={styles.mutedText}>{copy.detailGeneratedTranscriptEmpty}</Text>
            )}

            {dream.transcript ? (
              <View style={styles.transcriptMetaCard}>
                <InfoRow
                  label={copy.detailGeneratedTranscriptSourceLabel}
                  value={transcriptSourceLabel}
                />
                {dream.transcriptUpdatedAt ? (
                  <InfoRow
                    label={copy.detailGeneratedTranscriptUpdatedLabel}
                    value={formatMetaTimestamp(dream.transcriptUpdatedAt)}
                  />
                ) : null}
              </View>
            ) : null}

            {transcriptStatus === 'processing' && dream.transcript ? (
              <Text style={styles.statusText}>{copy.detailGeneratedTranscriptProcessing}</Text>
            ) : null}

            {transcriptStatus === 'error' && dream.transcript ? (
              <Text style={styles.statusErrorText}>
                {copy.detailGeneratedTranscriptReplaceError}
              </Text>
            ) : null}

            <View style={styles.transcriptActions}>
              {isEditingTranscript ? (
                <>
                  <Button
                    title={copy.detailGeneratedTranscriptSave}
                    onPress={onSaveTranscriptEdit}
                    icon="save-outline"
                    size="sm"
                  />
                  <Button
                    title={copy.detailGeneratedTranscriptCancel}
                    variant="ghost"
                    icon="close-outline"
                    size="sm"
                    onPress={onCancelTranscriptEdit}
                  />
                </>
              ) : (
                <>
                  {dream.transcript ? (
                    <>
                      <Button
                        title={copy.detailGeneratedTranscriptEdit}
                        variant="ghost"
                        icon="create-outline"
                        size="sm"
                        onPress={onStartTranscriptEdit}
                      />
                      <Button
                        title={copy.detailGeneratedTranscriptClear}
                        variant="danger"
                        icon="close-circle-outline"
                        size="sm"
                        onPress={onClearTranscript}
                      />
                    </>
                  ) : null}

                  {dream.audioUri ? (
                    <Button
                      title={
                        isTranscribingAudio
                          ? formatTranscriptionProgress(transcriptionProgress) ??
                            copy.detailTranscribeInProgress
                          : dream.transcript
                            ? copy.detailGeneratedTranscriptReplace
                            : transcriptStatus === 'error'
                              ? copy.detailTranscribeRetry
                              : copy.detailTranscribeAudio
                      }
                      variant={
                        dream.transcript || transcriptStatus === 'error' ? 'ghost' : 'primary'
                      }
                      onPress={onTranscribeAudio}
                      disabled={isTranscribingAudio}
                      icon={dream.transcript ? 'refresh-outline' : 'sparkles-outline'}
                    />
                  ) : null}
                </>
              )}
            </View>
          </DreamDetailSectionCard>
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.delay(110).duration(220)} layout={detailLayoutTransition}>
        <DreamDetailSectionCard
          title={copy.detailRelatedTitle}
          meta={relatedMetaLabel}
          expanded={sections.related}
          onToggle={() => toggleSection('related')}
        >
          {relatedDreams.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.relatedCarousel}
              contentContainerStyle={styles.relatedCarouselContent}
            >
              {relatedDreams.map(item => (
                <Pressable
                  key={item.dream.id}
                  style={({ pressed }) => [
                    styles.relatedCard,
                    pressed ? styles.relatedCardPressed : null,
                  ]}
                  onPress={() =>
                    navigation.push(ROOT_ROUTE_NAMES.DreamDetail, {
                      dreamId: item.dream.id,
                    })
                  }
                >
                  <View style={styles.relatedHeader}>
                    <View style={styles.relatedCopy}>
                      <Text style={styles.relatedTitle}>{item.dream.title || copy.untitled}</Text>
                      <Text style={styles.relatedMeta}>
                        {item.dream.sleepDate ||
                          new Date(item.dream.createdAt).toISOString().slice(0, 10)}
                      </Text>
                    </View>
                    <Ionicons name="arrow-forward-outline" size={18} color={t.colors.textDim} />
                  </View>

                  {item.sharedSignals.length ? (
                    <View style={styles.tagsRow}>
                      {item.sharedSignals.slice(0, 3).map(signal => (
                        <TagChip key={`${item.dream.id}-${signal}`} label={signal} />
                      ))}
                    </View>
                  ) : null}

                  <Text style={styles.relatedSharedLabel}>{copy.detailRelatedSharedLabel}</Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.mutedText}>{copy.detailRelatedEmpty}</Text>
          )}
        </DreamDetailSectionCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(130).duration(220)} layout={detailLayoutTransition}>
        <DreamDetailSectionCard
          title={copy.detailAnalysisTitle}
          meta={analysisMetaLabel}
          expanded={sections.analysis}
          onToggle={() => toggleSection('analysis')}
        >
          <View style={styles.analysisStateCard}>
            <Text style={styles.analysisStateLabel}>{copy.detailAnalysisStateLabel}</Text>
            <Text style={styles.analysisStateText}>{analysisStateText}</Text>
            {!analysisSettings.enabled || analysisSettings.provider === 'openai' ? (
              <Button
                title={copy.detailAnalysisOpenSettings}
                variant="ghost"
                size="sm"
                icon="settings-outline"
                onPress={onOpenSettingsForAnalysis}
              />
            ) : null}
          </View>

          {dream.analysis?.summary ? (
            <>
              <Text style={styles.subsectionLabel}>{copy.detailAnalysisSummaryLabel}</Text>
              <Text style={styles.bodyText}>{dream.analysis.summary}</Text>
            </>
          ) : (
            <Text style={styles.mutedText}>
              {analysisSettings.enabled ? copy.detailAnalysisEmpty : copy.detailAnalysisDisabled}
            </Text>
          )}

          <View style={styles.transcriptMetaCard}>
            <InfoRow label={copy.detailAnalysisStatusLabel} value={analysisStatusLabel} />
            <InfoRow label={copy.detailAnalysisProviderLabel} value={analysisProviderLabel} />
            {dream.analysis?.generatedAt ? (
              <InfoRow
                label={copy.detailAnalysisUpdatedLabel}
                value={formatMetaTimestamp(dream.analysis.generatedAt)}
              />
            ) : null}
          </View>

          {dream.analysis?.themes?.length ? (
            <>
              <Text style={styles.subsectionLabel}>{copy.detailAnalysisThemesLabel}</Text>
              <View style={styles.tagsRow}>
                {dream.analysis.themes.map(theme => <TagChip key={theme} label={theme} />)}
              </View>
            </>
          ) : null}

          {dream.analysis?.status === 'error' && dream.analysis.errorMessage ? (
            <Text style={styles.statusErrorText}>{dream.analysis.errorMessage}</Text>
          ) : null}

          {analysisSettings.enabled ? (
            <View style={styles.analysisActionsRow}>
              <Button
                title={
                  isGeneratingAnalysis
                    ? copy.detailAnalysisGenerating
                    : dream.analysis?.status === 'ready'
                      ? copy.detailAnalysisRegenerate
                      : copy.detailAnalysisGenerate
                }
                variant={dream.analysis?.status === 'ready' ? 'ghost' : 'primary'}
                onPress={onGenerateAnalysis}
                disabled={isGeneratingAnalysis}
                icon={dream.analysis?.status === 'ready' ? 'refresh-outline' : 'sparkles-outline'}
              />
              {dream.analysis ? (
                <Button
                  title={copy.detailAnalysisClear}
                  variant="danger"
                  onPress={onClearAnalysis}
                  disabled={isGeneratingAnalysis}
                  icon="trash-outline"
                  size="sm"
                />
              ) : null}
            </View>
          ) : null}
        </DreamDetailSectionCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(150).duration(220)} layout={detailLayoutTransition}>
        <DreamDetailSectionCard
          title={copy.tagsTitle}
          meta={tagCountLabel}
          expanded={sections.tags}
          onToggle={() => toggleSection('tags')}
        >
          <View style={styles.tagsRow}>
            {dream.tags.length ? (
              dream.tags.map(tag => <TagChip key={tag} label={tag} />)
            ) : (
              <Text style={styles.mutedText}>{copy.detailTagsEmpty}</Text>
            )}
          </View>
        </DreamDetailSectionCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(170).duration(220)} layout={detailLayoutTransition}>
        <DreamDetailSectionCard
          title={copy.detailStateTitle}
          meta={stateMetaLabel}
          expanded={sections.context || sections.emotions}
          onToggle={() => {
            const nextValue = !(sections.context || sections.emotions);
            setExpandedSections(current => ({
              ...(current ?? sections),
              context: nextValue,
              emotions: nextValue,
            }));
          }}
        >
          {!hasContext && !hasEmotions ? (
            <Text style={styles.mutedText}>{copy.detailStateEmpty}</Text>
          ) : (
            <View style={styles.contextRows}>
              {dream.wakeEmotions?.length ? (
                <>
                  <Text style={styles.subsectionLabel}>{copy.detailWakeEmotionsLabel}</Text>
                  <View style={styles.tagsRow}>
                    {dream.wakeEmotions.map(emotion => (
                      <TagChip key={emotion} label={wakeEmotionLabels[emotion]} />
                    ))}
                  </View>
                </>
              ) : null}
              {dream.sleepContext?.preSleepEmotions?.length ? (
                <>
                  <Text style={styles.subsectionLabel}>{copy.detailPreSleepEmotionsLabel}</Text>
                  <View style={styles.tagsRow}>
                    {dream.sleepContext.preSleepEmotions.map(emotion => (
                      <TagChip key={emotion} label={preSleepEmotionLabels[emotion]} />
                    ))}
                  </View>
                </>
              ) : null}
              {typeof dream.sleepContext?.stressLevel === 'number' ? (
                <InfoRow
                  label={copy.stressLabel}
                  value={stressLabels[dream.sleepContext.stressLevel]}
                />
              ) : null}
              {typeof dream.sleepContext?.alcoholTaken === 'boolean' ? (
                <InfoRow
                  label={copy.alcoholLabel}
                  value={dream.sleepContext.alcoholTaken ? copy.boolYes : copy.boolNo}
                />
              ) : null}
              {typeof dream.sleepContext?.caffeineLate === 'boolean' ? (
                <InfoRow
                  label={copy.caffeineLabel}
                  value={dream.sleepContext.caffeineLate ? copy.boolYes : copy.boolNo}
                />
              ) : null}
              {dream.sleepContext?.medications ? (
                <InfoRow label={copy.medicationsLabel} value={dream.sleepContext.medications} />
              ) : null}
              {dream.sleepContext?.importantEvents ? (
                <InfoRow
                  label={copy.eventsLabel}
                  value={dream.sleepContext.importantEvents}
                />
              ) : null}
              {dream.sleepContext?.healthNotes ? (
                <InfoRow label={copy.healthNotesLabel} value={dream.sleepContext.healthNotes} />
              ) : null}
            </View>
          )}
        </DreamDetailSectionCard>
      </Animated.View>

      {dream.audioUri ? (
        <Animated.View entering={FadeInDown.delay(190).duration(220)} layout={detailLayoutTransition}>
          <DreamDetailSectionCard
            title={copy.voiceTitle}
            meta={copy.detailAudioAttachedMeta}
            expanded={sections.audio}
            onToggle={() => toggleSection('audio')}
          >
            <View style={styles.audioCard}>
              <Text>{copy.detailAudioDescription}</Text>
              <InfoRow label={copy.detailAudioPathLabel} value={dream.audioUri} />
              <Button
                title={isPlayingAudio ? copy.detailAudioStop : copy.detailAudioPlay}
                variant={isPlayingAudio ? 'ghost' : 'primary'}
                onPress={onToggleAudioPlayback}
                icon={isPlayingAudio ? 'stop-circle-outline' : 'play-outline'}
                size="sm"
              />
            </View>
          </DreamDetailSectionCard>
        </Animated.View>
      ) : null}
    </ScreenContainer>
  );
}
