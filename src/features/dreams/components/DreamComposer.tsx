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
  getDreamMoods,
  getDreamPreSleepEmotions,
  getDreamStressLevels,
  getDreamWakeEmotions,
} from '../../../constants/copy/dreams';
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
  DreamComposerMoodCard,
  DreamComposerTagsCard,
} from './DreamComposerDetailSections';
import { DreamComposerProps } from './DreamComposer.types';
import {
  formatLocalAssetName,
  useDreamComposerForm,
} from './useDreamComposerForm';
import { getDreamDraftSnapshot } from '../services/dreamDraftService';
import { DreamComposerTemplateRow } from './DreamComposerTemplateRow';
import { type DreamTemplate } from '../model/dreamTemplates';

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
  const intensityOptions = React.useMemo(() => getDreamIntensityLevels(locale), [locale]);
  const stressLevels = React.useMemo(() => getDreamStressLevels(locale), [locale]);
  const wakeEmotionOptions = React.useMemo(() => getDreamWakeEmotions(locale), [locale]);
  const preSleepEmotionOptions = React.useMemo(
    () => getDreamPreSleepEmotions(locale),
    [locale],
  );
  const styles = React.useMemo(() => createNewDreamScreenStyles(theme), [theme]);

  const form = useDreamComposerForm({
    mode,
    entryMode,
    initialDream,
    onSaved,
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
  const [showRestoredDraftCard, setShowRestoredDraftCard] = React.useState(form.hasRestoredDraft);
  const isCreateMode = mode === 'create';
  const isCreateVoiceFlow = isCreateMode && entryMode === 'voice';
  const isCreateTextFlow = isCreateMode && entryMode === 'default';

  const showTemplateRow =
    mode === 'create' &&
    !form.isWakeMode &&
    form.isEntryEmpty &&
    !form.hasRestoredDraft;

  const handleApplyTemplate = React.useCallback(
    (template: DreamTemplate) => {
      form.setTags(template.tags);
      if (template.mood !== undefined) {
        form.setMood(template.mood);
      }
      if (template.wakeEmotions && template.wakeEmotions.length > 0) {
        form.setWakeEmotions(template.wakeEmotions);
      }
      if (template.opensMoodSection) {
        form.setShowMoodSection(true);
      }
      form.setShowTagsSection(true);
    },
    [form],
  );

  const refineActions = React.useMemo(() => [
    ...(!form.isWakeMode
      ? [
          {
            key: 'mood',
            label: form.showMoodSection ? copy.refineHideAction : copy.refineMoodAction,
            active: form.showMoodSection,
            onPress: () => form.setShowMoodSection(current => !current),
          },
        ]
      : [
          {
            key: 'meta',
            label: form.showMetaSection ? copy.refineHideAction : copy.wakeRefineMetaAction,
            active: form.showMetaSection,
            onPress: () => form.setShowMetaSection(current => !current),
          },
        ]),
    {
      key: 'context',
      label: form.showContextSection ? copy.refineHideAction : copy.refineContextAction,
      active: form.showContextSection,
      onPress: () => form.setShowContextSection(current => !current),
    },
    {
      key: 'tags',
      label: form.showTagsSection ? copy.refineHideAction : copy.refineTagsAction,
      active: form.showTagsSection,
      onPress: () => form.setShowTagsSection(current => !current),
    },
  ], [copy, form]);

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
        form.onToggleRecord().catch(e =>
          logActionError('DreamComposer.onToggleRecord', e),
        );
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

      {showTemplateRow ? (
        <DreamComposerTemplateRow
          copy={copy}
          onApplyTemplate={handleApplyTemplate}
        />
      ) : null}

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
              form.onToggleRecord().catch(e =>
                logActionError('DreamComposer.onToggleRecord', e),
              );
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
      ) : (
        isCreateVoiceFlow ? (
          <>
            {voiceCard}
            {inlineSaveButton}
            {coreCard}
          </>
        ) : isCreateTextFlow ? (
          <>
            {coreCard}
            {inlineSaveButton}
            {voiceCard}
          </>
        ) : (
          <>
            {voiceCard}
            {coreCard}
          </>
        )
      )}

      <DreamComposerRefineCard
        styles={styles}
        copy={copy}
        isWakeMode={form.isWakeMode}
        actions={refineActions}
      />

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
            form.setDreamIntensity(current => (current === value ? undefined : value))
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
            form.setStressLevel(current => (current === value ? undefined : value))
          }
          alcoholTaken={form.alcoholTaken}
          onToggleAlcoholTaken={value =>
            form.setAlcoholTaken(current => (current === value ? undefined : value))
          }
          caffeineLate={form.caffeineLate}
          onToggleCaffeineLate={value =>
            form.setCaffeineLate(current => (current === value ? undefined : value))
          }
          medications={form.medications}
          onChangeMedications={form.setMedications}
          importantEvents={form.importantEvents}
          onChangeImportantEvents={form.setImportantEvents}
          healthNotes={form.healthNotes}
          onChangeHealthNotes={form.setHealthNotes}
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
