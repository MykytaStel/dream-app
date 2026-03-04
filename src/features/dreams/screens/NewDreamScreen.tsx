import React from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Pulse } from '../../../components/animation/Pulse';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { FormField } from '../../../components/ui/FormField';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { TagChip } from '../../../components/ui/TagChip';
import { Text } from '../../../components/ui/Text';
import { Theme } from '../../../theme/theme';
import { Dream, Mood } from '../model/dream';
import { saveDream } from '../repository/dreamsRepository';
import { startRecording, stopRecording } from '../services/audioService';
import { createDreamId } from '../utils/createDreamId';
import { DREAM_COPY, DREAM_MOODS } from '../../../constants/copy/dreams';
import { createNewDreamScreenStyles } from './NewDreamScreen.styles';

function getTodayDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function normalizeTag(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '-');
}

export default function NewDreamScreen() {
  const t = useTheme<Theme>();
  const [title, setTitle] = React.useState('');
  const [text, setText] = React.useState('');
  const [sleepDate, setSleepDate] = React.useState(getTodayDate());
  const [recording, setRecording] = React.useState(false);
  const [audioUri, setAudioUri] = React.useState<string | undefined>();
  const [mood, setMood] = React.useState<Mood | undefined>();
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState('');
  const baseStyles = createNewDreamScreenStyles(t, false);

  async function onToggleRecord() {
    try {
      if (!recording) {
        await startRecording();
        setRecording(true);
        return;
      }

      const uri = await stopRecording();
      setAudioUri(uri || undefined);
      setRecording(false);
    } catch (e) {
      setRecording(false);
      Alert.alert(DREAM_COPY.audioErrorTitle, String(e));
    }
  }

  function addTag() {
    const next = normalizeTag(tagInput);
    if (!next) {
      return;
    }

    if (tags.includes(next)) {
      setTagInput('');
      return;
    }

    setTags(current => [...current, next]);
    setTagInput('');
  }

  function removeTag(tag: string) {
    setTags(current => current.filter(value => value !== tag));
  }

  function resetForm() {
    setTitle('');
    setText('');
    setSleepDate(getTodayDate());
    setAudioUri(undefined);
    setMood(undefined);
    setTags([]);
    setTagInput('');
    setRecording(false);
  }

  function onSave() {
    const cleanTitle = title.trim();
    const cleanText = text.trim();

    if (!cleanText && !audioUri && !cleanTitle) {
      Alert.alert(DREAM_COPY.saveErrorTitle, DREAM_COPY.saveErrorDescription);
      return;
    }

    const dream: Dream = {
      id: createDreamId(),
      createdAt: Date.now(),
      sleepDate: sleepDate.trim() || getTodayDate(),
      title: cleanTitle || undefined,
      text: cleanText || undefined,
      audioUri,
      tags,
      mood,
    };

    saveDream(dream);
    resetForm();
    Alert.alert(DREAM_COPY.saveSuccessTitle, DREAM_COPY.saveSuccessDescription);
  }

  return (
    <ScreenContainer scroll keyboardShouldPersistTaps="handled">
      <Card style={baseStyles.heroCard}>
        <View style={baseStyles.heroTopRow}>
          <View style={baseStyles.heroCopy}>
            <Text style={baseStyles.heroEyebrow}>{DREAM_COPY.createTitle}</Text>
            <SectionHeader
              title={DREAM_COPY.createHeroTitle}
              subtitle={DREAM_COPY.createSubtitle}
              large
            />
            <Text style={baseStyles.heroDescription}>{DREAM_COPY.createHeroDescription}</Text>
          </View>
          <View style={baseStyles.pulseShell}>
            <Pulse size={44} active={recording} />
          </View>
        </View>

        <View style={baseStyles.helperChipsRow}>
          <View style={baseStyles.helperChip}>
            <Text style={baseStyles.helperChipLabel}>{sleepDate}</Text>
          </View>
          <View style={baseStyles.helperChip}>
            <Text style={baseStyles.helperChipLabel}>
              {audioUri ? DREAM_COPY.attachedAudioTitle : DREAM_COPY.voiceIdleHint}
            </Text>
          </View>
        </View>
      </Card>

      <Card style={baseStyles.card}>
        <SectionHeader
          title={DREAM_COPY.coreTitle}
          subtitle={DREAM_COPY.coreDescription}
        />
        <FormField
          label={DREAM_COPY.titleLabel}
          placeholder={DREAM_COPY.titlePlaceholder}
          value={title}
          onChangeText={setTitle}
        />
        <FormField
          label={DREAM_COPY.sleepDateLabel}
          placeholder={DREAM_COPY.sleepDatePlaceholder}
          value={sleepDate}
          onChangeText={setSleepDate}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <FormField
          label={DREAM_COPY.textLabel}
          placeholder={DREAM_COPY.textPlaceholder}
          value={text}
          onChangeText={setText}
          multiline
          inputStyle={baseStyles.textInput}
          helperText={
            text.trim()
              ? `${text.trim().split(/\s+/).length} ${DREAM_COPY.wordsUnit}`
              : `0 ${DREAM_COPY.wordsUnit}`
          }
        />
      </Card>

      <Card style={baseStyles.card}>
        <SectionHeader
          title={DREAM_COPY.moodTitle}
          subtitle={DREAM_COPY.moodDescription}
        />

        <View style={baseStyles.moodRow}>
          {DREAM_MOODS.map(option => {
            const selected = mood === option.value;
            const styles = createNewDreamScreenStyles(t, selected);
            return (
              <Pressable
                key={option.value}
                onPress={() =>
                  setMood(current =>
                    current === option.value ? undefined : option.value,
                  )
                }
                style={styles.moodOption}
              >
                <Text style={styles.moodLabel}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card style={baseStyles.card}>
        <SectionHeader
          title={DREAM_COPY.tagsTitle}
          subtitle={DREAM_COPY.tagsDescription}
        />

        <View style={baseStyles.tagsInputRow}>
          <FormField
            label=""
            placeholder={DREAM_COPY.tagsPlaceholder}
            value={tagInput}
            onChangeText={setTagInput}
            onSubmitEditing={addTag}
            inputStyle={baseStyles.tagInput}
          />
          <Button title={DREAM_COPY.addTag} onPress={addTag} style={baseStyles.tagButton} />
        </View>

        <View style={baseStyles.tagsWrap}>
          {tags.length ? (
            tags.map(tag => (
              <TagChip key={tag} label={`${tag} x`} onPress={() => removeTag(tag)} />
            ))
          ) : (
            <Text style={baseStyles.emptyTags}>{DREAM_COPY.tagsEmpty}</Text>
          )}
        </View>
      </Card>

      <Card style={baseStyles.card}>
        <SectionHeader
          title={DREAM_COPY.voiceTitle}
          subtitle={DREAM_COPY.voiceDescription}
        />

        <Button
          title={recording ? DREAM_COPY.stopRecording : DREAM_COPY.startRecording}
          onPress={onToggleRecord}
        />

        {recording ? (
          <Text style={baseStyles.recordingHint}>{DREAM_COPY.recordingHint}</Text>
        ) : null}

        {audioUri ? (
          <View style={baseStyles.attachedAudioCard}>
            <Text style={baseStyles.attachedAudioTitle}>{DREAM_COPY.attachedAudioTitle}</Text>
            <Text style={baseStyles.attachedAudioUri}>{audioUri}</Text>
            <Button
              title={DREAM_COPY.removeAudio}
              variant="ghost"
              onPress={() => setAudioUri(undefined)}
            />
          </View>
        ) : null}
      </Card>

      <Button title={DREAM_COPY.saveDream} onPress={onSave} />
    </ScreenContainer>
  );
}
