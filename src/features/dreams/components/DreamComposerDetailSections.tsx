import React from 'react';
import { View } from 'react-native';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { FormField } from '../../../components/ui/FormField';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { TagChip } from '../../../components/ui/TagChip';
import { Text } from '../../../components/ui/Text';
import {
  DreamIntensity,
  LucidControlArea,
  LucidPracticeTechnique,
  LucidStabilizationAction,
  NightmareAftereffect,
  NightmareGroundingAction,
  NightmareRescriptStatus,
  PreSleepEmotion,
  StressLevel,
  WakeEmotion,
} from '../model/dream';
import { DreamComposerChoiceChip } from './DreamComposerChoiceChip';
import { ComposerBooleanField } from './composer/ComposerBooleanField';
import { ComposerScaleField } from './composer/ComposerScaleField';
import {
  DreamComposerCopy,
  DreamComposerIntensityOption,
  DreamComposerLucidityOption,
  DreamComposerMoodOption,
  DreamComposerPreSleepEmotionOption,
  DreamComposerStressOption,
  DreamComposerStyles,
  DreamComposerWakeEmotionOption,
} from './DreamComposer.types';

type MoodCardProps = {
  styles: DreamComposerStyles;
  copy: DreamComposerCopy;
  moods: DreamComposerMoodOption[];
  mood?: DreamComposerMoodOption['value'];
  onToggleMood: (value: DreamComposerMoodOption['value']) => void;
  intensityOptions: DreamComposerIntensityOption[];
  dreamIntensity?: DreamIntensity;
  onToggleDreamIntensity: (value: DreamIntensity) => void;
  lucidityOptions: DreamComposerLucidityOption[];
  lucidity?: 0 | 1 | 2 | 3;
  onToggleLucidity: (value: 0 | 1 | 2 | 3) => void;
  wakeEmotionOptions: DreamComposerWakeEmotionOption[];
  wakeEmotions: WakeEmotion[];
  onToggleWakeEmotion: (value: WakeEmotion) => void;
};

export function DreamComposerMoodCard({
  styles,
  copy,
  moods,
  mood,
  onToggleMood,
  intensityOptions,
  dreamIntensity,
  onToggleDreamIntensity,
  lucidityOptions,
  lucidity,
  onToggleLucidity,
  wakeEmotionOptions,
  wakeEmotions,
  onToggleWakeEmotion,
}: MoodCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.sectionAccentRow}>
        <View style={styles.sectionAccentPrimary} />
        <View
          style={[styles.sectionAccentSecondary, styles.sectionAccentAlt]}
        />
      </View>
      <SectionHeader title={copy.moodTitle} subtitle={copy.moodDescription} />

      <View style={styles.moodGrid}>
        {moods.map(option => (
          <DreamComposerChoiceChip
            key={option.value}
            variant="mood"
            label={option.label}
            selected={mood === option.value}
            onPress={() => onToggleMood(option.value)}
            styles={styles}
          />
        ))}
      </View>

      <View style={styles.contextBlock}>
        <Text style={styles.contextFieldLabel}>{copy.moodIntensityLabel}</Text>
        <Text style={styles.contextHint}>{copy.moodIntensityHint}</Text>
        <View style={styles.intensityRow}>
          {intensityOptions.map(option => (
            <DreamComposerChoiceChip
              key={option.value}
              variant="intensity"
              label={option.label}
              selected={dreamIntensity === option.value}
              onPress={() => onToggleDreamIntensity(option.value)}
              styles={styles}
            />
          ))}
        </View>
      </View>

      <View style={styles.contextBlock}>
        <Text style={styles.contextFieldLabel}>{copy.lucidityLabel}</Text>
        <Text style={styles.contextHint}>{copy.lucidityHint}</Text>
        <View style={styles.contextOptionsRow}>
          {lucidityOptions.map(option => (
            <DreamComposerChoiceChip
              key={option.value}
              variant="context"
              label={option.label}
              selected={lucidity === option.value}
              onPress={() => onToggleLucidity(option.value)}
              styles={styles}
            />
          ))}
        </View>
      </View>

      <View style={styles.contextBlock}>
        <Text style={styles.contextFieldLabel}>{copy.wakeEmotionsTitle}</Text>
        <Text style={styles.contextHint}>{copy.wakeEmotionsDescription}</Text>
        <View style={styles.tagsWrap}>
          {wakeEmotionOptions.map(option => (
            <TagChip
              key={option.value}
              label={option.label}
              selected={wakeEmotions.includes(option.value)}
              onPress={() => onToggleWakeEmotion(option.value)}
            />
          ))}
        </View>
      </View>
    </Card>
  );
}

type ContextCardProps = {
  styles: DreamComposerStyles;
  copy: DreamComposerCopy;
  preSleepEmotionOptions: DreamComposerPreSleepEmotionOption[];
  preSleepEmotions: PreSleepEmotion[];
  onTogglePreSleepEmotion: (value: PreSleepEmotion) => void;
  stressLevels: DreamComposerStressOption[];
  stressLevel?: StressLevel;
  onToggleStressLevel: (value: StressLevel) => void;
  alcoholTaken?: boolean;
  onToggleAlcoholTaken: (value: boolean) => void;
  caffeineLate?: boolean;
  onToggleCaffeineLate: (value: boolean) => void;
  medications: string;
  onChangeMedications: (value: string) => void;
  importantEvents: string;
  onChangeImportantEvents: (value: string) => void;
  healthNotes: string;
  onChangeHealthNotes: (value: string) => void;
};

export function DreamComposerContextCard({
  styles,
  copy,
  preSleepEmotionOptions,
  preSleepEmotions,
  onTogglePreSleepEmotion,
  stressLevels,
  stressLevel,
  onToggleStressLevel,
  alcoholTaken,
  onToggleAlcoholTaken,
  caffeineLate,
  onToggleCaffeineLate,
  medications,
  onChangeMedications,
  importantEvents,
  onChangeImportantEvents,
  healthNotes,
  onChangeHealthNotes,
}: ContextCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.sectionAccentRow}>
        <View style={styles.sectionAccentPrimary} />
        <View
          style={[styles.sectionAccentSecondary, styles.sectionAccentMuted]}
        />
      </View>
      <SectionHeader
        title={copy.sleepContextTitle}
        subtitle={copy.sleepContextDescription}
      />

      <View style={styles.contextBlock}>
        <Text style={styles.contextFieldLabel}>
          {copy.preSleepEmotionsLabel}
        </Text>
        <View style={styles.tagsWrap}>
          {preSleepEmotionOptions.map(option => (
            <TagChip
              key={option.value}
              label={option.label}
              selected={preSleepEmotions.includes(option.value)}
              onPress={() => onTogglePreSleepEmotion(option.value)}
            />
          ))}
        </View>
      </View>

      <View style={styles.contextBlock}>
        <Text style={styles.contextFieldLabel}>{copy.stressLabel}</Text>
        <View style={styles.contextOptionsRow}>
          {stressLevels.map(option => (
            <DreamComposerChoiceChip
              key={option.value}
              variant="context"
              label={option.label}
              selected={stressLevel === option.value}
              onPress={() => onToggleStressLevel(option.value)}
              styles={styles}
            />
          ))}
        </View>
      </View>

      <ComposerBooleanField
        label={copy.alcoholLabel}
        value={alcoholTaken}
        onChange={onToggleAlcoholTaken}
        styles={styles}
      />

      <ComposerBooleanField
        label={copy.caffeineLabel}
        value={caffeineLate}
        onChange={onToggleCaffeineLate}
        styles={styles}
      />

      <FormField
        label={copy.medicationsLabel}
        placeholder={copy.medicationsPlaceholder}
        value={medications}
        onChangeText={onChangeMedications}
        multiline
        inputStyle={styles.contextTextInput}
      />

      <FormField
        label={copy.eventsLabel}
        placeholder={copy.eventsPlaceholder}
        value={importantEvents}
        onChangeText={onChangeImportantEvents}
        multiline
        inputStyle={styles.contextTextInput}
      />

      <FormField
        label={copy.healthNotesLabel}
        placeholder={copy.healthNotesPlaceholder}
        value={healthNotes}
        onChangeText={onChangeHealthNotes}
        multiline
        inputStyle={styles.contextTextInput}
      />
    </Card>
  );
}

export type ChoiceOption<T extends string | number | boolean> = {
  label: string;
  value: T;
};

type LucidPracticeCardProps = {
  styles: DreamComposerStyles;
  title: string;
  subtitle: string;
  dreamSignsLabel: string;
  dreamSignsPlaceholder: string;
  triggerLabel: string;
  triggerPlaceholder: string;
  techniqueLabel: string;
  recallLabel: string;
  recallLowLabel: string;
  recallHighLabel: string;
  /**
   * How aware the dreamer was, from the mood card above.
   *
   * Trigger, technique, control and stabilisation are all things that only
   * happen once someone knows they are dreaming. Asking them of a dream
   * recorded as "not lucid" is asking about something that did not occur.
   */
  lucidity?: 0 | 1 | 2 | 3;
  controlLabel: string;
  stabilizationLabel: string;
  dreamSignsInput: string;
  onChangeDreamSignsInput: (value: string) => void;
  trigger: string;
  onChangeTrigger: (value: string) => void;
  technique?: LucidPracticeTechnique;
  onToggleTechnique: (value: LucidPracticeTechnique) => void;
  recallScore?: 1 | 2 | 3 | 4 | 5;
  onToggleRecallScore: (value: 1 | 2 | 3 | 4 | 5) => void;
  controlAreas: LucidControlArea[];
  onToggleControlArea: (value: LucidControlArea) => void;
  stabilizationActions: LucidStabilizationAction[];
  onToggleStabilizationAction: (value: LucidStabilizationAction) => void;
  techniqueOptions: Array<ChoiceOption<LucidPracticeTechnique>>;
  recallOptions: Array<ChoiceOption<1 | 2 | 3 | 4 | 5>>;
  controlOptions: Array<ChoiceOption<LucidControlArea>>;
  stabilizationOptions: Array<ChoiceOption<LucidStabilizationAction>>;
};

export function DreamComposerLucidPracticeCard({
  styles,
  title,
  subtitle,
  dreamSignsLabel,
  dreamSignsPlaceholder,
  triggerLabel,
  triggerPlaceholder,
  techniqueLabel,
  recallLabel,
  recallLowLabel,
  recallHighLabel,
  lucidity,
  controlLabel,
  stabilizationLabel,
  dreamSignsInput,
  onChangeDreamSignsInput,
  trigger,
  onChangeTrigger,
  technique,
  onToggleTechnique,
  recallScore,
  onToggleRecallScore,
  controlAreas,
  onToggleControlArea,
  stabilizationActions,
  onToggleStabilizationAction,
  techniqueOptions,
  recallOptions,
  controlOptions,
  stabilizationOptions,
}: LucidPracticeCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.sectionAccentRow}>
        <View style={styles.sectionAccentPrimary} />
        <View
          style={[styles.sectionAccentSecondary, styles.sectionAccentAlt]}
        />
      </View>
      <SectionHeader title={title} subtitle={subtitle} />

      <FormField
        label={dreamSignsLabel}
        placeholder={dreamSignsPlaceholder}
        value={dreamSignsInput}
        onChangeText={onChangeDreamSignsInput}
        inputStyle={styles.contextTextInput}
      />

      <ComposerScaleField
        label={recallLabel}
        lowLabel={recallLowLabel}
        highLabel={recallHighLabel}
        options={recallOptions}
        value={recallScore}
        onSelect={onToggleRecallScore}
        styles={styles}
      />

      {/*
        Recall and dream signs are worth asking about any dream. What follows
        only exists once the dreamer knew they were dreaming, so it waits for
        the lucidity answer given on the mood card above.
      */}
      {typeof lucidity === 'number' && lucidity >= 1 ? (
        <>
          <FormField
            label={triggerLabel}
            placeholder={triggerPlaceholder}
            value={trigger}
            onChangeText={onChangeTrigger}
            inputStyle={styles.contextTextInput}
          />

          <View style={styles.contextBlock}>
            <Text style={styles.contextFieldLabel}>{techniqueLabel}</Text>
            <View style={styles.contextOptionsRow}>
              {techniqueOptions.map(option => (
                <DreamComposerChoiceChip
                  key={option.value}
                  variant="context"
                  label={option.label}
                  selected={technique === option.value}
                  onPress={() => onToggleTechnique(option.value)}
                  styles={styles}
                />
              ))}
            </View>
          </View>

          <View style={styles.contextBlock}>
            <Text style={styles.contextFieldLabel}>{controlLabel}</Text>
            <View style={styles.tagsWrap}>
              {controlOptions.map(option => (
                <TagChip
                  key={option.value}
                  label={option.label}
                  selected={controlAreas.includes(option.value)}
                  onPress={() => onToggleControlArea(option.value)}
                />
              ))}
            </View>
          </View>

          <View style={styles.contextBlock}>
            <Text style={styles.contextFieldLabel}>{stabilizationLabel}</Text>
            <View style={styles.tagsWrap}>
              {stabilizationOptions.map(option => (
                <TagChip
                  key={option.value}
                  label={option.label}
                  selected={stabilizationActions.includes(option.value)}
                  onPress={() => onToggleStabilizationAction(option.value)}
                />
              ))}
            </View>
          </View>
        </>
      ) : null}
    </Card>
  );
}

type NightmareCardProps = {
  styles: DreamComposerStyles;
  title: string;
  subtitle: string;
  explicitLabel: string;
  distressLabel: string;
  distressLowLabel: string;
  distressHighLabel: string;
  recurringLabel: string;
  recurringPlaceholder: string;
  wokeLabel: string;
  aftereffectsLabel: string;
  groundingLabel: string;
  rewriteLabel: string;
  rewritePlaceholder: string;
  rewriteStatusLabel: string;
  explicit?: boolean;
  onToggleExplicit: (value: boolean) => void;
  distress?: 1 | 2 | 3 | 4 | 5;
  onToggleDistress: (value: 1 | 2 | 3 | 4 | 5) => void;
  recurring?: boolean;
  onToggleRecurring: (value: boolean) => void;
  recurringKey: string;
  onChangeRecurringKey: (value: string) => void;
  wokeFromDream?: boolean;
  onToggleWokeFromDream: (value: boolean) => void;
  aftereffects: NightmareAftereffect[];
  onToggleAftereffect: (value: NightmareAftereffect) => void;
  groundingUsed: NightmareGroundingAction[];
  onToggleGroundingUsed: (value: NightmareGroundingAction) => void;
  rewrittenEnding: string;
  onChangeRewrittenEnding: (value: string) => void;
  rescriptStatus?: NightmareRescriptStatus;
  onToggleRescriptStatus: (value: NightmareRescriptStatus) => void;
  distressOptions: Array<ChoiceOption<1 | 2 | 3 | 4 | 5>>;
  aftereffectOptions: Array<ChoiceOption<NightmareAftereffect>>;
  groundingOptions: Array<ChoiceOption<NightmareGroundingAction>>;
  rewriteStatusOptions: Array<ChoiceOption<NightmareRescriptStatus>>;
};

export function DreamComposerNightmareCard({
  styles,
  title,
  subtitle,
  explicitLabel,
  distressLabel,
  distressLowLabel,
  distressHighLabel,
  recurringLabel,
  recurringPlaceholder,
  wokeLabel,
  aftereffectsLabel,
  groundingLabel,
  rewriteLabel,
  rewritePlaceholder,
  rewriteStatusLabel,
  explicit,
  onToggleExplicit,
  distress,
  onToggleDistress,
  recurring,
  onToggleRecurring,
  recurringKey,
  onChangeRecurringKey,
  wokeFromDream,
  onToggleWokeFromDream,
  aftereffects,
  onToggleAftereffect,
  groundingUsed,
  onToggleGroundingUsed,
  rewrittenEnding,
  onChangeRewrittenEnding,
  rescriptStatus,
  onToggleRescriptStatus,
  distressOptions,
  aftereffectOptions,
  groundingOptions,
  rewriteStatusOptions,
}: NightmareCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.sectionAccentRow}>
        <View style={styles.sectionAccentPrimary} />
        <View
          style={[styles.sectionAccentSecondary, styles.sectionAccentMuted]}
        />
      </View>
      <SectionHeader title={title} subtitle={subtitle} />

      <ComposerBooleanField
        label={explicitLabel}
        value={explicit}
        onChange={onToggleExplicit}
        styles={styles}
      />

      {/*
        Everything below describes a nightmare. Asking all of it of someone
        who did not have one — twelve controls, at whatever hour they opened
        this — was the card's real problem; the tiles it drew them with were
        only the visible half.
      */}
      {explicit === true ? (
        <>
          <ComposerScaleField
            label={distressLabel}
            lowLabel={distressLowLabel}
            highLabel={distressHighLabel}
            options={distressOptions}
            value={distress}
            onSelect={onToggleDistress}
            styles={styles}
          />

          <ComposerBooleanField
            label={recurringLabel}
            value={recurring}
            onChange={onToggleRecurring}
            styles={styles}
          />

          {recurring === true ? (
            <FormField
              label=""
              placeholder={recurringPlaceholder}
              value={recurringKey}
              onChangeText={onChangeRecurringKey}
              inputStyle={styles.contextTextInput}
            />
          ) : null}

          <ComposerBooleanField
            label={wokeLabel}
            value={wokeFromDream}
            onChange={onToggleWokeFromDream}
            styles={styles}
          />

          <View style={styles.contextBlock}>
            <Text style={styles.contextFieldLabel}>{aftereffectsLabel}</Text>
            <View style={styles.tagsWrap}>
              {aftereffectOptions.map(option => (
                <TagChip
                  key={option.value}
                  label={option.label}
                  selected={aftereffects.includes(option.value)}
                  onPress={() => onToggleAftereffect(option.value)}
                />
              ))}
            </View>
          </View>

          <View style={styles.contextBlock}>
            <Text style={styles.contextFieldLabel}>{groundingLabel}</Text>
            <View style={styles.tagsWrap}>
              {groundingOptions.map(option => (
                <TagChip
                  key={option.value}
                  label={option.label}
                  selected={groundingUsed.includes(option.value)}
                  onPress={() => onToggleGroundingUsed(option.value)}
                />
              ))}
            </View>
          </View>

          <FormField
            label={rewriteLabel}
            placeholder={rewritePlaceholder}
            value={rewrittenEnding}
            onChangeText={onChangeRewrittenEnding}
            multiline
            inputStyle={styles.contextTextInput}
          />

          <View style={styles.contextBlock}>
            <Text style={styles.contextFieldLabel}>{rewriteStatusLabel}</Text>
            <View style={styles.contextOptionsRow}>
              {rewriteStatusOptions.map(option => (
                <DreamComposerChoiceChip
                  key={option.value}
                  variant="context"
                  label={option.label}
                  selected={rescriptStatus === option.value}
                  onPress={() => onToggleRescriptStatus(option.value)}
                  styles={styles}
                />
              ))}
            </View>
          </View>
        </>
      ) : null}
    </Card>
  );
}

type TagsCardProps = {
  styles: DreamComposerStyles;
  copy: DreamComposerCopy;
  tagInput: string;
  onChangeTagInput: (value: string) => void;
  onSubmitTag: () => void;
  tags: string[];
  onRemoveTag: (tag: string) => void;
};

export function DreamComposerTagsCard({
  styles,
  copy,
  tagInput,
  onChangeTagInput,
  onSubmitTag,
  tags,
  onRemoveTag,
}: TagsCardProps) {
  return (
    <Card style={styles.card}>
      <SectionHeader title={copy.tagsTitle} subtitle={copy.tagsDescription} />

      <View style={styles.tagsInputRow}>
        <FormField
          label=""
          placeholder={copy.tagsPlaceholder}
          value={tagInput}
          onChangeText={onChangeTagInput}
          onSubmitEditing={onSubmitTag}
          containerStyle={styles.tagField}
          inputStyle={styles.tagInput}
        />
        <Button
          title={copy.addTag}
          size="sm"
          onPress={onSubmitTag}
          style={styles.tagButton}
        />
      </View>

      <View style={styles.tagsWrap}>
        {tags.length ? (
          tags.map(tag => (
            <TagChip
              key={tag}
              label={tag}
              removable
              onPress={() => onRemoveTag(tag)}
            />
          ))
        ) : (
          <Text style={styles.emptyTags}>{copy.tagsEmpty}</Text>
        )}
      </View>
    </Card>
  );
}
