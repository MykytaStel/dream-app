import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Text } from '../../../components/ui/Text';
import { ScreenStateCard } from './ScreenStateCard';
import { logActionError } from '../../../app/errorReporting';
import {
  getDreamCopy,
  getDreamIntensityLevels,
  getDreamLucidityLevels,
  getDreamMoods,
  getDreamPreSleepEmotions,
  getDreamStressLevels,
  getDreamWakeEmotions,
} from '../../../constants/copy/dreams';
import {
  getLucidControlAreaLabels,
  getLucidStabilizationLabels,
  getLucidTechniqueLabels,
  getNightmareAftereffectLabels,
  getNightmareGroundingLabels,
  getNightmareRescriptStatusLabels,
  getPracticeCopy,
} from '../../../constants/copy/practice';
import { useI18n } from '../../../i18n/I18nProvider';
import { Theme } from '../../../theme/theme';
import { createNewDreamScreenStyles } from '../screens/NewDreamScreen.styles';
import { getDreamDraftSummaryLabels } from '../model/dreamDraftPresentation';
import {
  DreamComposerCoreCard,
  DreamComposerHeroCard,
  DreamComposerRefineCard,
  DreamComposerWakeCaptureCard,
  DreamComposerVoiceCard,
  DreamComposerWakeMetaCard,
} from './DreamComposerBasicSections';
import {
  DreamComposerContextCard,
  DreamComposerLucidPracticeCard,
  DreamComposerMoodCard,
  DreamComposerNightmareCard,
  DreamComposerTagsCard,
  type ChoiceOption,
} from './DreamComposerDetailSections';
import { DreamComposerProps } from './DreamComposer.types';
import { useDreamComposerForm } from './useDreamComposerForm';
import { formatLocalAssetName } from './composer/composerHelpers';
import { getDreamDraftSnapshot } from '../services/dreamDraftService';
import { DreamComposerQuickCaptureCard } from './DreamComposerQuickCaptureCard';

// Object.entries widens keys to string, which loses the union the option props
// require. The record's own key type is the accurate one, so it is restored here
// once instead of being cast away at every call site.
function toChoiceOptions<K extends string>(
  labels: Record<K, string>,
): Array<ChoiceOption<K>> {
  return (Object.entries(labels) as Array<[K, string]>).map(
    ([value, label]) => ({ value, label }),
  );
}

export function DreamComposer({
  mode,
  entryMode = 'default',
  initialDream,
  onSaved,
  autoStartRecordingKey,
}: DreamComposerProps) {
  const theme = useTheme<Theme>();
  const { locale } = useI18n();
  const copy = React.useMemo(() => getDreamCopy(locale), [locale]);
  const moods = React.useMemo(() => getDreamMoods(locale), [locale]);
  const intensityOptions = React.useMemo(
    () => getDreamIntensityLevels(locale),
    [locale],
  );
  const lucidityOptions = React.useMemo(
    () => getDreamLucidityLevels(locale),
    [locale],
  );
  const stressLevels = React.useMemo(
    () => getDreamStressLevels(locale),
    [locale],
  );
  const wakeEmotionOptions = React.useMemo(
    () => getDreamWakeEmotions(locale),
    [locale],
  );
  const preSleepEmotionOptions = React.useMemo(
    () => getDreamPreSleepEmotions(locale),
    [locale],
  );
  const styles = React.useMemo(
    () => createNewDreamScreenStyles(theme),
    [theme],
  );
  const practiceCopy = React.useMemo(() => getPracticeCopy(locale), [locale]);
  const lucidTechniqueLabels = React.useMemo(
    () => getLucidTechniqueLabels(locale),
    [locale],
  );
  const lucidControlLabels = React.useMemo(
    () => getLucidControlAreaLabels(locale),
    [locale],
  );
  const lucidStabilizationLabels = React.useMemo(
    () => getLucidStabilizationLabels(locale),
    [locale],
  );
  const nightmareAftereffectLabels = React.useMemo(
    () => getNightmareAftereffectLabels(locale),
    [locale],
  );
  const nightmareGroundingLabels = React.useMemo(
    () => getNightmareGroundingLabels(locale),
    [locale],
  );
  const nightmareRescriptLabels = React.useMemo(
    () => getNightmareRescriptStatusLabels(locale),
    [locale],
  );
  const isCreateMode = mode === 'create';
  const [showCreateMeta, setShowCreateMeta] = React.useState(false);
  const hasInitializedCreateMeta = React.useRef(false);
  const handleSaved = React.useCallback<
    NonNullable<DreamComposerProps['onSaved']>
  >(
    dream => {
      setShowCreateMeta(false);
      onSaved?.(dream);
    },
    [onSaved],
  );

  const form = useDreamComposerForm({
    mode,
    entryMode,
    initialDream,
    onSaved: onSaved ? handleSaved : undefined,
    autoStartRecordingKey,
    copy,
  });

  const audioFileLabel = React.useMemo(
    () => formatLocalAssetName(form.audioUri),
    [form.audioUri],
  );
  const restoredDraftSnapshot = React.useMemo(
    () => getDreamDraftSnapshot(form.initialDraft),
    [form.initialDraft],
  );
  const restoredDraftLabels = React.useMemo(
    () => getDreamDraftSummaryLabels(restoredDraftSnapshot, copy),
    [copy, restoredDraftSnapshot],
  );
  const [showRestoredDraftCard, setShowRestoredDraftCard] = React.useState(
    form.hasRestoredDraft,
  );
  const isCreateVoiceFlow = isCreateMode && entryMode === 'voice';
  const isCreateTextFlow = isCreateMode && entryMode === 'default';

  React.useEffect(() => {
    if (hasInitializedCreateMeta.current || !isCreateMode || form.isWakeMode) {
      return;
    }

    hasInitializedCreateMeta.current = true;
    setShowCreateMeta(form.hasEditedMeta);
  }, [form.hasEditedMeta, form.isWakeMode, isCreateMode]);

  const lucidTechniqueOptions = React.useMemo(
    () => toChoiceOptions(lucidTechniqueLabels),
    [lucidTechniqueLabels],
  );
  const lucidControlOptions = React.useMemo(
    () => toChoiceOptions(lucidControlLabels),
    [lucidControlLabels],
  );
  const lucidStabilizationOptions = React.useMemo(
    () => toChoiceOptions(lucidStabilizationLabels),
    [lucidStabilizationLabels],
  );
  const nightmareAftereffectOptions = React.useMemo(
    () => toChoiceOptions(nightmareAftereffectLabels),
    [nightmareAftereffectLabels],
  );
  const nightmareGroundingOptions = React.useMemo(
    () => toChoiceOptions(nightmareGroundingLabels),
    [nightmareGroundingLabels],
  );
  const nightmareRescriptOptions = React.useMemo(
    () => toChoiceOptions(nightmareRescriptLabels),
    [nightmareRescriptLabels],
  );
  const recallOptions = React.useMemo(
    () =>
      [1, 2, 3, 4, 5].map(value => ({
        value: value as 1 | 2 | 3 | 4 | 5,
        label: String(value),
      })),
    [],
  );
  const refineActions = React.useMemo(
    () => [
      ...(!form.isWakeMode
        ? [
            {
              key: 'mood',
              label: form.showMoodSection
                ? copy.refineHideAction
                : copy.refineMoodAction,
              active: form.showMoodSection,
              onPress: () => form.setShowMoodSection(current => !current),
            },
          ]
        : [
            {
              key: 'meta',
              label: form.showMetaSection
                ? copy.refineHideAction
                : copy.wakeRefineMetaAction,
              active: form.showMetaSection,
              onPress: () => form.setShowMetaSection(current => !current),
            },
          ]),
      {
        key: 'context',
        label: form.showContextSection
          ? copy.refineHideAction
          : copy.refineContextAction,
        active: form.showContextSection,
        onPress: () => form.setShowContextSection(current => !current),
      },
      {
        key: 'tags',
        label: form.showTagsSection
          ? copy.refineHideAction
          : copy.refineTagsAction,
        active: form.showTagsSection,
        onPress: () => form.setShowTagsSection(current => !current),
      },
      {
        key: 'lucid',
        label: form.showLucidPracticeSection
          ? copy.refineHideAction
          : practiceCopy.openLucid,
        active: form.showLucidPracticeSection,
        onPress: () => form.setShowLucidPracticeSection(current => !current),
      },
      {
        key: 'nightmare',
        label: form.showNightmareSection
          ? copy.refineHideAction
          : practiceCopy.openNightmares,
        active: form.showNightmareSection,
        onPress: () => form.setShowNightmareSection(current => !current),
      },
    ],
    [copy, form, practiceCopy],
  );

  const voiceCard = (
    <DreamComposerVoiceCard
      styles={styles}
      copy={copy}
      isWakeMode={form.isWakeMode}
      recording={form.recording}
      recordingDuration={form.recordingDuration}
      audioUri={form.audioUri}
      audioFileLabel={audioFileLabel}
      isBusy={form.isBusy}
      onToggleRecord={() => {
        form
          .onToggleRecord()
          .catch(e => logActionError('DreamComposer.onToggleRecord', e));
      }}
      onRemoveAudio={() => form.setAudioUri(undefined)}
    />
  );

  const coreCard = (
    <DreamComposerCoreCard
      styles={styles}
      copy={copy}
      isWakeMode={form.isWakeMode}
      isEntryEmpty={form.isEntryEmpty}
      hasRestoredDraft={form.hasRestoredDraft}
      title={form.title}
      onChangeTitle={form.setTitle}
      sleepDate={form.sleepDate}
      onChangeSleepDate={form.setSleepDate}
      text={form.text}
      onChangeText={form.setText}
      hasInvalidSleepDate={form.hasInvalidSleepDate}
      hasTriedSave={form.hasTriedSave}
      hasMissingContent={form.hasMissingContent}
      textWordCount={form.textWordCount}
    />
  );

  const quickCaptureCard =
    isCreateMode && !form.isWakeMode ? (
      <DreamComposerQuickCaptureCard
        styles={styles}
        copy={copy}
        text={form.text}
        onChangeText={form.setText}
        title={form.title}
        onChangeTitle={form.setTitle}
        sleepDate={form.sleepDate}
        onChangeSleepDate={form.setSleepDate}
        hasInvalidSleepDate={form.hasInvalidSleepDate}
        hasTriedSave={form.hasTriedSave}
        hasMissingContent={form.hasMissingContent}
        textWordCount={form.textWordCount}
        showMeta={showCreateMeta}
        onToggleMeta={() => setShowCreateMeta(current => !current)}
        autoFocus={isCreateTextFlow && !form.hasRestoredDraft}
      />
    ) : null;

  const inlineSaveButton = isCreateMode ? (
    <Button
      title={copy.saveDream}
      onPress={form.onSave}
      disabled={form.saveDisabled}
    />
  ) : null;

  return (
    <ScreenContainer scroll keyboardShouldPersistTaps="handled">
      <DreamComposerHeroCard
        styles={styles}
        copy={copy}
        isEdit={form.isEdit}
        isWakeMode={form.isWakeMode}
        sleepDate={form.sleepDate}
        hasAudio={Boolean(form.audioUri)}
        hasRestoredDraft={form.hasRestoredDraft}
      />

      {showRestoredDraftCard ? (
        <Card style={styles.card}>
          <View style={styles.sectionAccentRow}>
            <View style={styles.sectionAccentPrimary} />
            <View style={styles.sectionAccentSecondary} />
          </View>
          <SectionHeader
            title={copy.recordDraftRestoredTitle}
            subtitle={copy.recordDraftRestoredDescription}
          />
          {restoredDraftLabels.length ? (
            <View style={styles.helperChipsRow}>
              {restoredDraftLabels.map(label => (
                <View key={label} style={styles.helperChip}>
                  <Text style={styles.helperChipLabel}>{label}</Text>
                </View>
              ))}
            </View>
          ) : null}
          <Button
            title={copy.recordDraftStartFreshAction}
            onPress={() => {
              form.discardDraftAndReset();
              setShowCreateMeta(false);
              setShowRestoredDraftCard(false);
            }}
            variant="ghost"
            size="sm"
          />
        </Card>
      ) : null}

      {form.isBusy ? (
        <ScreenStateCard
          variant="loading"
          title={copy.recordLoadingTitle}
          subtitle={copy.recordLoadingDescription}
        />
      ) : null}

      {!form.isBusy && form.lastActionError ? (
        <ScreenStateCard
          variant="error"
          title={copy.recordErrorTitle}
          subtitle={form.lastActionError}
          actionLabel={copy.clearErrorAction}
          onAction={() => form.setLastActionError(null)}
        />
      ) : null}

      {form.isWakeMode ? (
        <>
          <DreamComposerWakeCaptureCard
            styles={styles}
            copy={copy}
            recording={form.recording}
            recordingDuration={form.recordingDuration}
            audioUri={form.audioUri}
            audioFileLabel={audioFileLabel}
            isBusy={form.isBusy}
            onToggleRecord={() => {
              form
                .onToggleRecord()
                .catch(e => logActionError('DreamComposer.onToggleRecord', e));
            }}
            onRemoveAudio={() => form.setAudioUri(undefined)}
            text={form.text}
            onChangeText={form.setText}
            hasTriedSave={form.hasTriedSave}
            hasMissingContent={form.hasMissingContent}
            textWordCount={form.textWordCount}
          />
          {inlineSaveButton}
        </>
      ) : isCreateVoiceFlow ? (
        <>
          {voiceCard}
          {inlineSaveButton}
          {quickCaptureCard}
        </>
      ) : isCreateTextFlow ? (
        <>
          {quickCaptureCard}
          {inlineSaveButton}
          {voiceCard}
        </>
      ) : (
        <>
          {voiceCard}
          {coreCard}
        </>
      )}

      {/*
        Quick Capture keeps the raw memory on the path to Save. Title and date
        are optional disclosure inside the create-only card, while mood,
        context, tags and practice fields stay in the editor after the dream is
        safe. Editing keeps the full refine surface because adding detail is the
        reason that screen was opened.
      */}
      {form.isEdit ? (
        <DreamComposerRefineCard
          styles={styles}
          copy={copy}
          isWakeMode={form.isWakeMode}
          actions={refineActions}
        />
      ) : null}

      {form.showMetaSection && form.isWakeMode ? (
        <DreamComposerWakeMetaCard
          styles={styles}
          copy={copy}
          title={form.title}
          onChangeTitle={form.setTitle}
          sleepDate={form.sleepDate}
          onChangeSleepDate={form.setSleepDate}
          hasInvalidSleepDate={form.hasInvalidSleepDate}
        />
      ) : null}

      {form.showMoodCard ? (
        <DreamComposerMoodCard
          styles={styles}
          copy={copy}
          moods={moods}
          mood={form.mood}
          onToggleMood={value =>
            form.setMood(current => (current === value ? undefined : value))
          }
          intensityOptions={intensityOptions}
          dreamIntensity={form.dreamIntensity}
          onToggleDreamIntensity={value =>
            form.setDreamIntensity(current =>
              current === value ? undefined : value,
            )
          }
          lucidityOptions={lucidityOptions}
          lucidity={form.lucidity}
          onToggleLucidity={value =>
            form.setLucidity(current => (current === value ? undefined : value))
          }
          wakeEmotionOptions={wakeEmotionOptions}
          wakeEmotions={form.wakeEmotions}
          onToggleWakeEmotion={form.toggleWakeEmotion}
        />
      ) : null}

      {form.showContextSection ? (
        <DreamComposerContextCard
          styles={styles}
          copy={copy}
          preSleepEmotionOptions={preSleepEmotionOptions}
          preSleepEmotions={form.preSleepEmotions}
          onTogglePreSleepEmotion={form.togglePreSleepEmotion}
          stressLevels={stressLevels}
          stressLevel={form.stressLevel}
          onToggleStressLevel={value =>
            form.setStressLevel(current =>
              current === value ? undefined : value,
            )
          }
          alcoholTaken={form.alcoholTaken}
          onToggleAlcoholTaken={value =>
            form.setAlcoholTaken(current =>
              current === value ? undefined : value,
            )
          }
          caffeineLate={form.caffeineLate}
          onToggleCaffeineLate={value =>
            form.setCaffeineLate(current =>
              current === value ? undefined : value,
            )
          }
          medications={form.medications}
          onChangeMedications={form.setMedications}
          importantEvents={form.importantEvents}
          onChangeImportantEvents={form.setImportantEvents}
          healthNotes={form.healthNotes}
          onChangeHealthNotes={form.setHealthNotes}
        />
      ) : null}

      {form.showLucidPracticeSection ? (
        <DreamComposerLucidPracticeCard
          styles={styles}
          title={practiceCopy.openLucid}
          subtitle={practiceCopy.lucidHeroDescription}
          dreamSignsLabel={practiceCopy.lucidDreamSignsLabel}
          dreamSignsPlaceholder={practiceCopy.lucidDreamSignsPlaceholder}
          triggerLabel={practiceCopy.lucidTriggerLabel}
          triggerPlaceholder={practiceCopy.lucidTriggerPlaceholder}
          techniqueLabel={practiceCopy.lucidStatsTopTechnique}
          recallLabel={practiceCopy.lucidRecallQuestion}
          recallLowLabel={practiceCopy.lucidRecallLow}
          recallHighLabel={practiceCopy.lucidRecallHigh}
          lucidity={form.lucidity}
          controlLabel={practiceCopy.filterControl}
          stabilizationLabel={practiceCopy.lucidStabilizationLabel}
          dreamSignsInput={form.dreamSignsInput}
          onChangeDreamSignsInput={form.setDreamSignsInput}
          trigger={form.lucidTrigger}
          onChangeTrigger={form.setLucidTrigger}
          technique={form.lucidTechnique}
          onToggleTechnique={value =>
            form.setLucidTechnique(current =>
              current === value ? undefined : value,
            )
          }
          recallScore={form.recallScore}
          onToggleRecallScore={value =>
            form.setRecallScore(current =>
              current === value ? undefined : value,
            )
          }
          controlAreas={form.controlAreas}
          onToggleControlArea={form.toggleControlArea}
          stabilizationActions={form.stabilizationActions}
          onToggleStabilizationAction={form.toggleStabilizationAction}
          techniqueOptions={lucidTechniqueOptions}
          recallOptions={recallOptions}
          controlOptions={lucidControlOptions}
          stabilizationOptions={lucidStabilizationOptions}
        />
      ) : null}

      {form.showNightmareSection ? (
        <DreamComposerNightmareCard
          styles={styles}
          title={practiceCopy.openNightmares}
          subtitle={practiceCopy.nightmareHeroDescription}
          explicitLabel={practiceCopy.nightmareExplicitQuestion}
          distressLabel={practiceCopy.nightmareDistressQuestion}
          distressLowLabel={practiceCopy.nightmareDistressLow}
          distressHighLabel={practiceCopy.nightmareDistressHigh}
          recurringLabel={practiceCopy.nightmareRecurringQuestion}
          recurringPlaceholder={practiceCopy.nightmareRecurringPlaceholder}
          wokeLabel={practiceCopy.nightmareWokeQuestion}
          aftereffectsLabel={practiceCopy.nightmareAftereffectsLabel}
          groundingLabel={practiceCopy.nightmareGroundingLabel}
          rewriteLabel={practiceCopy.quickNightmareRewrite}
          rewritePlaceholder={practiceCopy.nightmareRewritePrompt}
          rewriteStatusLabel={practiceCopy.nightmareRewriteStatusLabel}
          explicit={form.nightmareExplicit}
          onToggleExplicit={value =>
            form.setNightmareExplicit(current =>
              current === value ? undefined : value,
            )
          }
          distress={form.nightmareDistress}
          onToggleDistress={value =>
            form.setNightmareDistress(current =>
              current === value ? undefined : value,
            )
          }
          recurring={form.nightmareRecurring}
          onToggleRecurring={value =>
            form.setNightmareRecurring(current =>
              current === value ? undefined : value,
            )
          }
          recurringKey={form.nightmareRecurringKey}
          onChangeRecurringKey={form.setNightmareRecurringKey}
          wokeFromDream={form.nightmareWokeFromDream}
          onToggleWokeFromDream={value =>
            form.setNightmareWokeFromDream(current =>
              current === value ? undefined : value,
            )
          }
          aftereffects={form.nightmareAftereffects}
          onToggleAftereffect={form.toggleNightmareAftereffect}
          groundingUsed={form.nightmareGroundingUsed}
          onToggleGroundingUsed={form.toggleNightmareGrounding}
          rewrittenEnding={form.nightmareRewrittenEnding}
          onChangeRewrittenEnding={form.setNightmareRewrittenEnding}
          rescriptStatus={form.nightmareRescriptStatus}
          onToggleRescriptStatus={value =>
            form.setNightmareRescriptStatus(current =>
              current === value ? undefined : value,
            )
          }
          distressOptions={recallOptions}
          aftereffectOptions={nightmareAftereffectOptions}
          groundingOptions={nightmareGroundingOptions}
          rewriteStatusOptions={nightmareRescriptOptions}
        />
      ) : null}

      {form.showTagsSection ? (
        <DreamComposerTagsCard
          styles={styles}
          copy={copy}
          tagInput={form.tagInput}
          onChangeTagInput={form.setTagInput}
          onSubmitTag={form.addTag}
          tags={form.tags}
          onRemoveTag={form.removeTag}
        />
      ) : null}

      {!isCreateMode ? (
        <Button
          title={form.isEdit ? copy.updateDream : copy.saveDream}
          onPress={form.onSave}
          disabled={form.saveDisabled}
        />
      ) : null}
    </ScreenContainer>
  );
}
