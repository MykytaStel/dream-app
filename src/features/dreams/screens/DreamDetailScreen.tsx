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
  getDreamStressLabels,
} from '../../../constants/copy/dreams';
import { ROOT_ROUTE_NAMES, type RootStackParamList } from '../../../app/navigation/routes';
import { useI18n } from '../../../i18n/I18nProvider';
import { Theme } from '../../../theme/theme';
import { getDreamAnalysisSettings } from '../../analysis/services/dreamAnalysisSettingsService';
import type { DreamAnalysisSettings } from '../../analysis/model/dreamAnalysis';
import { Dream } from '../model/dream';
import { countDreamWords } from '../model/dreamAnalytics';
import {
  archiveDream,
  clearDreamTranscript,
  deleteDream,
  getDream,
  saveDreamTranscriptEdit,
  unarchiveDream,
} from '../repository/dreamsRepository';
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

export default function DreamDetailScreen() {
  const t = useTheme<Theme>();
  const { locale } = useI18n();
  const copy = React.useMemo(() => getDreamCopy(locale), [locale]);
  const moodLabels = React.useMemo(() => getDreamMoodLabels(locale), [locale]);
  const stressLabels = React.useMemo(() => getDreamStressLabels(locale), [locale]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, typeof ROOT_ROUTE_NAMES.DreamDetail>>();
  const styles = createDreamDetailScreenStyles(t);
  const [dream, setDream] = React.useState(() => getDream(route.params.dreamId));
  const [isPlayingAudio, setIsPlayingAudio] = React.useState(false);
  const [isTranscribingAudio, setIsTranscribingAudio] = React.useState(false);
  const [isEditingTranscript, setIsEditingTranscript] = React.useState(false);
  const [transcriptDraft, setTranscriptDraft] = React.useState('');
  const [analysisSettings, setAnalysisSettings] = React.useState<DreamAnalysisSettings>(() =>
    getDreamAnalysisSettings(),
  );
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

      return () => {
        stop().catch(() => undefined);
      };
    }, [route.params.dreamId]),
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
  const moodLabel = dream.mood ? moodLabels[dream.mood] : undefined;
  const wordsCount = countDreamWords(dream.text);
  const hasContext = hasSleepContext(dream);
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
          onPress={() =>
            navigation.navigate(ROOT_ROUTE_NAMES.DreamEditor, {
              dreamId,
            })
          }
        />
        <Button
          title={archived ? copy.detailUnarchive : copy.detailArchive}
          variant="ghost"
          onPress={onToggleArchiveDream}
        />
        <Button
          title={copy.detailDelete}
          variant="danger"
          onPress={onDeleteDream}
        />
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{copy.detailTranscriptTitle}</Text>
        <Text style={dream.text ? styles.bodyText : styles.mutedText}>
          {dream.text || copy.detailTranscriptEmpty}
        </Text>
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
                />
                <Button
                  title={copy.detailGeneratedTranscriptCancel}
                  variant="ghost"
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
                      onPress={onStartTranscriptEdit}
                    />
                    <Button
                      title={copy.detailGeneratedTranscriptClear}
                      variant="danger"
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
        <Text style={styles.sectionTitle}>{copy.detailAnalysisTitle}</Text>
        {dream.analysis?.summary ? (
          <Text style={styles.bodyText}>{dream.analysis.summary}</Text>
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
            />
          </View>
        </Card>
      ) : null}
    </ScreenContainer>
  );
}
