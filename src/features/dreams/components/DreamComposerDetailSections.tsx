import React from 'react';
import { View } from 'react-native';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { FormField } from '../../../components/ui/FormField';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { TagChip } from '../../../components/ui/TagChip';
import { Text } from '../../../components/ui/Text';
import { PreSleepEmotion, StressLevel, WakeEmotion } from '../model/dream';
import { DreamComposerChoiceChip } from './DreamComposerChoiceChip';
import {
  DreamComposerCopy,
  DreamComposerMoodOption,
  DreamComposerPreSleepEmotionOption,
  DreamComposerStressOption,
  DreamComposerStyles,
  DreamComposerWakeEmotionOption,
} from './DreamComposer.types';

type MoodCardProps = {
  styles: DreamComposerStyles;
  activeStyles: DreamComposerStyles;
  copy: DreamComposerCopy;
  moods: DreamComposerMoodOption[];
  mood?: DreamComposerMoodOption['value'];
  onToggleMood: (value: DreamComposerMoodOption['value']) => void;
  wakeEmotionOptions: DreamComposerWakeEmotionOption[];
  wakeEmotions: WakeEmotion[];
  onToggleWakeEmotion: (value: WakeEmotion) => void;
};

export function DreamComposerMoodCard({
  styles,
  activeStyles,
  copy,
  moods,
  mood,
  onToggleMood,
  wakeEmotionOptions,
  wakeEmotions,
  onToggleWakeEmotion,
}: MoodCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.sectionAccentRow}>
        <View style={styles.sectionAccentPrimary} />
        <View style={[styles.sectionAccentSecondary, styles.sectionAccentAlt]} />
      </View>
      <SectionHeader title={copy.moodTitle} subtitle={copy.moodDescription} />

      <View style={styles.moodRow}>
        {moods.map(option => (
          <DreamComposerChoiceChip
            key={option.value}
            variant="mood"
            label={option.label}
            selected={mood === option.value}
            onPress={() => onToggleMood(option.value)}
            baseStyles={styles}
            activeStyles={activeStyles}
          />
        ))}
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
  activeStyles: DreamComposerStyles;
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
  activeStyles,
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
  const yesNoOptions = [
    { label: copy.boolNo, value: false },
    { label: copy.boolYes, value: true },
  ];

  return (
    <Card style={styles.card}>
      <View style={styles.sectionAccentRow}>
        <View style={styles.sectionAccentPrimary} />
        <View style={[styles.sectionAccentSecondary, styles.sectionAccentMuted]} />
      </View>
      <SectionHeader title={copy.sleepContextTitle} subtitle={copy.sleepContextDescription} />

      <View style={styles.contextBlock}>
        <Text style={styles.contextFieldLabel}>{copy.preSleepEmotionsLabel}</Text>
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
              baseStyles={styles}
              activeStyles={activeStyles}
            />
          ))}
        </View>
      </View>

      <View style={styles.contextBlock}>
        <Text style={styles.contextFieldLabel}>{copy.alcoholLabel}</Text>
        <View style={styles.contextOptionsRow}>
          {yesNoOptions.map(option => (
            <DreamComposerChoiceChip
              key={`alcohol-${option.label}`}
              variant="context"
              label={option.label}
              selected={alcoholTaken === option.value}
              onPress={() => onToggleAlcoholTaken(option.value)}
              baseStyles={styles}
              activeStyles={activeStyles}
            />
          ))}
        </View>
      </View>

      <View style={styles.contextBlock}>
        <Text style={styles.contextFieldLabel}>{copy.caffeineLabel}</Text>
        <View style={styles.contextOptionsRow}>
          {yesNoOptions.map(option => (
            <DreamComposerChoiceChip
              key={`caffeine-${option.label}`}
              variant="context"
              label={option.label}
              selected={caffeineLate === option.value}
              onPress={() => onToggleCaffeineLate(option.value)}
              baseStyles={styles}
              activeStyles={activeStyles}
            />
          ))}
        </View>
      </View>

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
        <Button title={copy.addTag} size="sm" onPress={onSubmitTag} style={styles.tagButton} />
      </View>

      <View style={styles.tagsWrap}>
        {tags.length ? (
          tags.map(tag => (
            <TagChip key={tag} label={tag} removable onPress={() => onRemoveTag(tag)} />
          ))
        ) : (
          <Text style={styles.emptyTags}>{copy.tagsEmpty}</Text>
        )}
      </View>
    </Card>
  );
}
