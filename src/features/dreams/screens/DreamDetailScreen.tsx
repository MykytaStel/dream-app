import React from 'react';
import { Alert, Pressable, View } from 'react-native';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@shopify/restyle';
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
import { ROOT_ROUTE_NAMES, type RootStackParamList } from '../../../app/navigation/routes';
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
  unstarDream,
  unarchiveDream,
} from '../repository/dreamsRepository';
import { generateDreamAnalysis } from '../../analysis/services/dreamAnalysisService';
import { play, stop } from '../services/audioService';
import {
  DreamTranscriptionProgress,
  transcribeDreamAudio,
} from '../services/dreamTranscriptionService';
import { createDreamDetailScreenStyles } from './DreamDetailScreen.styles';

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
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backLabel}>{copy.detailBack}</Text>
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
  const strongestSignal =
    relatedDreams[0]?.sharedSignals[0] ?? dream.tags[0] ?? dream.wakeEmotions?.[0] ?? null;

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
    if (archived) {
      unarchiveDream(dreamId);
    } else {
      archiveDream(dreamId);
    }
    navigation.goBack();
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
      setTranscriptDraft(getDream(dreamId)?.transcript ?? '');
    } catch (error) {
      setDream(getDream(dreamId));
      setTranscriptDraft(getDream(dreamId)?.transcript ?? '');
      const fallbackDescription = copy.detailTranscriptionErrorDescription;
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert(
        copy.detailTranscriptionErrorTitle,
        `${fallbackDescription}\n${message}`,
      );
    } finally {
      setIsTranscribingAudio(false);
      setTranscriptionProgress(null);
    }
  }

  function onStartTranscriptEdit() {
    setTranscriptDraft(dream?.transcript ?? '');
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

  return (
    <ScreenContainer scroll>
      <Card style={styles.heroCard}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backLabel}>{copy.detailBack}</Text>
        </Pressable>

        <View style={styles.heroHeader}>
          <Text style={styles.heroEyebrow}>{copy.detailMetaTitle}</Text>
          <View style={styles.heroTitleRow}>
            <Text style={styles.heroTitle}>{dream.title || copy.untitled}</Text>
            <View
              style={[
                styles.moodDot,
                { backgroundColor: moodColor(t, dream.mood) },
              ]}
            />
          </View>
          <Text style={styles.heroSubtitle}>
            {dream.sleepDate ? formatMetaDate(dream.sleepDate) : formatMetaDate(dream.createdAt)}
          </Text>
        </View>

        <View style={styles.chipsRow}>
          <View style={styles.metaChip}>
            <Text style={styles.metaChipLabel}>{copy.sleepDateLabel}</Text>
            <Text style={styles.metaChipValue}>
              {dream.sleepDate || new Date(dream.createdAt).toISOString().slice(0, 10)}
            </Text>
          </View>
          <View style={styles.metaChip}>
            <Text style={styles.metaChipLabel}>{copy.wordsUnit}</Text>
            <Text style={styles.metaChipValue}>{wordsCount}</Text>
          </View>
          {moodLabel ? (
            <View style={styles.metaChip}>
              <Text style={styles.metaChipLabel}>{copy.moodTitle}</Text>
              <Text style={styles.metaChipValue}>{moodLabel}</Text>
            </View>
          ) : null}
        </View>

        <Button
          title={copy.detailEdit}
          variant="ghost"
          icon="create-outline"
          size="sm"
          onPress={() =>
            navigation.navigate(ROOT_ROUTE_NAMES.DreamEditor, {
              dreamId,
            })
          }
        />
        <Button
          title={starred ? copy.detailUnstar : copy.detailStar}
          variant="ghost"
          icon={starred ? 'star' : 'star-outline'}
          size="sm"
          onPress={onToggleStarDream}
        />
        <Button
          title={archived ? copy.detailUnarchive : copy.detailArchive}
          variant="ghost"
          icon={archived ? 'archive' : 'archive-outline'}
          size="sm"
          onPress={onToggleArchiveDream}
        />
        <Button
          title={copy.detailDelete}
          variant="danger"
          icon="trash-outline"
          size="sm"
          onPress={onDeleteDream}
        />
      </Card>

      {showSavedHighlight ? (
        <Card style={styles.savedCard}>
          <View style={styles.savedHeader}>
            <View style={styles.savedCopy}>
              <Text style={styles.savedTitle}>{copy.detailSavedTitle}</Text>
              <Text style={styles.savedDescription}>{copy.detailSavedDescription}</Text>
            </View>
            <Pressable style={styles.savedDismiss} onPress={() => setShowSavedHighlight(false)}>
              <Text style={styles.savedDismissLabel}>{copy.clearErrorAction}</Text>
            </Pressable>
          </View>

          <View style={styles.savedStatsRow}>
            <View style={styles.savedStatTile}>
              <Text style={styles.savedStatLabel}>{copy.detailSavedPatternLabel}</Text>
              <Text style={styles.savedStatValue}>{strongestSignal ?? copy.homeSpotlightNoPattern}</Text>
            </View>
            <View style={styles.savedStatTile}>
              <Text style={styles.savedStatLabel}>{copy.detailSavedRelatedLabel}</Text>
              <Text style={styles.savedStatValue}>{relatedDreams.length}</Text>
            </View>
          </View>
        </Card>
      ) : null}

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{copy.detailTranscriptTitle}</Text>
        <Text style={dream.text ? styles.bodyText : styles.mutedText}>
          {dream.text || copy.detailTranscriptEmpty}
        </Text>
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{copy.detailEmotionTitle}</Text>
        {hasEmotions ? (
          <View style={styles.contextRows}>
            {dream.wakeEmotions?.length ? (
              <>
                <Text style={styles.sectionTitle}>{copy.detailWakeEmotionsLabel}</Text>
                <View style={styles.tagsRow}>
                  {dream.wakeEmotions.map(emotion => (
                    <TagChip
                      key={emotion}
                      label={wakeEmotionLabels[emotion]}
                    />
                  ))}
                </View>
              </>
            ) : null}
            {dream.sleepContext?.preSleepEmotions?.length ? (
              <>
                <Text style={styles.sectionTitle}>{copy.detailPreSleepEmotionsLabel}</Text>
                <View style={styles.tagsRow}>
                  {dream.sleepContext.preSleepEmotions.map(emotion => (
                    <TagChip
                      key={emotion}
                      label={preSleepEmotionLabels[emotion]}
                    />
                  ))}
                </View>
              </>
            ) : null}
          </View>
        ) : (
          <Text style={styles.mutedText}>{copy.detailEmotionEmpty}</Text>
        )}
      </Card>

      {dream.audioUri || dream.transcript || transcriptStatus === 'error' ? (
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{copy.detailGeneratedTranscriptTitle}</Text>

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
            <Text style={styles.statusErrorText}>{copy.detailGeneratedTranscriptReplaceError}</Text>
          ) : null}

          <Text style={styles.mutedText}>{copy.detailGeneratedTranscriptHint}</Text>

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
        </Card>
      ) : null}

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{copy.tagsTitle}</Text>
        <View style={styles.tagsRow}>
          {dream.tags.length ? (
            dream.tags.map(tag => <TagChip key={tag} label={tag} />)
          ) : (
            <Text style={styles.mutedText}>{copy.detailTagsEmpty}</Text>
          )}
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{copy.detailRelatedTitle}</Text>
        <Text style={styles.mutedText}>{copy.detailRelatedDescription}</Text>
        {relatedDreams.length ? (
          <View style={styles.relatedList}>
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
                      {item.dream.sleepDate || new Date(item.dream.createdAt).toISOString().slice(0, 10)}
                    </Text>
                  </View>
                </View>

                {item.sharedSignals.length ? (
                  <View style={styles.tagsRow}>
                    {item.sharedSignals.map(signal => (
                      <TagChip key={`${item.dream.id}-${signal}`} label={signal} />
                    ))}
                  </View>
                ) : null}

                <Text style={styles.relatedSharedLabel}>{copy.detailRelatedSharedLabel}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={styles.mutedText}>{copy.detailRelatedEmpty}</Text>
        )}
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{copy.detailAnalysisTitle}</Text>
        {dream.analysis?.summary ? (
          <>
            <Text style={styles.sectionTitle}>{copy.detailAnalysisSummaryLabel}</Text>
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
            <Text style={styles.sectionTitle}>{copy.detailAnalysisThemesLabel}</Text>
            <View style={styles.tagsRow}>
              {dream.analysis.themes.map(theme => <TagChip key={theme} label={theme} />)}
            </View>
          </>
        ) : null}

        {dream.analysis?.status === 'error' && dream.analysis.errorMessage ? (
          <Text style={styles.statusErrorText}>{dream.analysis.errorMessage}</Text>
        ) : null}

        {analysisSettings.enabled ? (
          <View style={styles.transcriptActions}>
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
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{copy.detailContextTitle}</Text>
        {!hasContext ? (
          <Text style={styles.mutedText}>{copy.detailContextEmpty}</Text>
        ) : (
          <View style={styles.contextRows}>
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
              <InfoRow
                label={copy.medicationsLabel}
                value={dream.sleepContext.medications}
              />
            ) : null}
            {dream.sleepContext?.importantEvents ? (
              <InfoRow
                label={copy.eventsLabel}
                value={dream.sleepContext.importantEvents}
              />
            ) : null}
            {dream.sleepContext?.healthNotes ? (
              <InfoRow
                label={copy.healthNotesLabel}
                value={dream.sleepContext.healthNotes}
              />
            ) : null}
          </View>
        )}
      </Card>

      {dream.audioUri ? (
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{copy.voiceTitle}</Text>
          <View style={styles.audioCard}>
            <Text>{copy.detailAudioDescription}</Text>
            <Text style={styles.mutedText}>{copy.detailAudioPlaybackHint}</Text>
            <InfoRow label={copy.detailAudioPathLabel} value={dream.audioUri} />
            <Button
              title={isPlayingAudio ? copy.detailAudioStop : copy.detailAudioPlay}
              variant={isPlayingAudio ? 'ghost' : 'primary'}
              onPress={onToggleAudioPlayback}
              icon={isPlayingAudio ? 'stop-circle-outline' : 'play-outline'}
              size="sm"
            />
          </View>
        </Card>
      ) : null}
    </ScreenContainer>
  );
}
