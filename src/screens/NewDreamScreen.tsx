/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Text } from '../components/ui/Text';
import { startRecording, stopRecording } from '../services/audio';
import { saveDream } from '../storage/dreams';
import { nanoid } from '../services/id';
import { Dream, Mood } from '../types/dream';
import { Theme } from '../theme/theme';

const MOODS: Array<{ label: string; value: Mood }> = [
  { label: 'Calm', value: 'neutral' },
  { label: 'Bright', value: 'positive' },
  { label: 'Heavy', value: 'negative' },
];

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
      Alert.alert('Audio error', String(e));
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
      Alert.alert(
        'Nothing to save',
        'Add a title, write what you remember, or attach a voice note first.',
      );
      return;
    }

    const dream: Dream = {
      id: nanoid(),
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
    Alert.alert('Saved', 'Your dream was saved locally.');
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.colors.background }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 28, fontWeight: '700' }}>Capture a dream</Text>
        <Text style={{ color: t.colors.textDim }}>
          Save the memory fast, keep the original voice note, and add just enough
          structure for future stats.
        </Text>
      </View>

      <Card style={{ gap: 12 }}>
        <View style={{ gap: 6 }}>
          <Text style={{ fontWeight: '700' }}>Core details</Text>
          <Text style={{ color: t.colors.textDim }}>
            Title is optional. A written note or a voice note is enough.
          </Text>
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ color: t.colors.textDim }}>Dream title</Text>
          <TextInput
            placeholder="Flying over old rooftops"
            placeholderTextColor="#777"
            value={title}
            onChangeText={setTitle}
            style={{
              borderWidth: 1,
              borderColor: t.colors.border,
              borderRadius: 12,
              padding: 12,
              color: t.colors.text,
              backgroundColor: t.colors.surfaceAlt,
            }}
          />
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ color: t.colors.textDim }}>Sleep date</Text>
          <TextInput
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#777"
            value={sleepDate}
            onChangeText={setSleepDate}
            autoCapitalize="none"
            autoCorrect={false}
            style={{
              borderWidth: 1,
              borderColor: t.colors.border,
              borderRadius: 12,
              padding: 12,
              color: t.colors.text,
              backgroundColor: t.colors.surfaceAlt,
            }}
          />
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ color: t.colors.textDim }}>What do you remember?</Text>
          <TextInput
            placeholder="Write the dream while it is still fresh..."
            placeholderTextColor="#777"
            value={text}
            onChangeText={setText}
            multiline
            textAlignVertical="top"
            style={{
              minHeight: 150,
              borderWidth: 1,
              borderColor: t.colors.border,
              borderRadius: 12,
              padding: 12,
              color: t.colors.text,
              backgroundColor: t.colors.surfaceAlt,
            }}
          />
          <Text style={{ color: t.colors.textDim }}>
            {text.trim() ? `${text.trim().split(/\s+/).length} words` : '0 words'}
          </Text>
        </View>
      </Card>

      <Card style={{ gap: 12 }}>
        <View style={{ gap: 6 }}>
          <Text style={{ fontWeight: '700' }}>Mood after waking</Text>
          <Text style={{ color: t.colors.textDim }}>
            Optional now, useful later for trends and monthly reports.
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          {MOODS.map(option => {
            const selected = mood === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() =>
                  setMood(current =>
                    current === option.value ? undefined : option.value,
                  )
                }
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 10,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: selected ? t.colors.primary : t.colors.border,
                  backgroundColor: selected ? t.colors.primary : t.colors.surfaceAlt,
                }}
              >
                <Text
                  style={{
                    textAlign: 'center',
                    fontWeight: '700',
                    color: selected ? t.colors.background : t.colors.text,
                  }}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card style={{ gap: 12 }}>
        <View style={{ gap: 6 }}>
          <Text style={{ fontWeight: '700' }}>Tags</Text>
          <Text style={{ color: t.colors.textDim }}>
            Add symbols, people, places, or recurring themes.
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            placeholder="ocean"
            placeholderTextColor="#777"
            value={tagInput}
            onChangeText={setTagInput}
            onSubmitEditing={addTag}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: t.colors.border,
              borderRadius: 12,
              padding: 12,
              color: t.colors.text,
              backgroundColor: t.colors.surfaceAlt,
            }}
          />
          <Button title="Add" onPress={addTag} style={{ minWidth: 92 }} />
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {tags.length ? (
            tags.map(tag => (
              <Pressable
                key={tag}
                onPress={() => removeTag(tag)}
                style={{
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: t.colors.border,
                  backgroundColor: t.colors.surfaceAlt,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                }}
              >
                <Text style={{ fontWeight: '600' }}>{tag} x</Text>
              </Pressable>
            ))
          ) : (
            <Text style={{ color: t.colors.textDim }}>
              No tags yet. Tap add to save your first one.
            </Text>
          )}
        </View>
      </Card>

      <Card style={{ gap: 12 }}>
        <View style={{ gap: 6 }}>
          <Text style={{ fontWeight: '700' }}>Voice note</Text>
          <Text style={{ color: t.colors.textDim }}>
            Keep the raw memory, then use transcription later.
          </Text>
        </View>

        <Button
          title={recording ? 'Stop recording' : 'Start recording'}
          onPress={onToggleRecord}
        />

        {recording ? (
          <Text style={{ color: t.colors.accent }}>
            Recording in progress. Stop when you are done.
          </Text>
        ) : null}

        {audioUri ? (
          <View
            style={{
              gap: 8,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: t.colors.border,
              backgroundColor: t.colors.surfaceAlt,
              padding: 12,
            }}
          >
            <Text style={{ fontWeight: '700' }}>Voice note attached</Text>
            <Text style={{ color: t.colors.textDim }}>{audioUri}</Text>
            <Button
              title="Remove voice note"
              variant="ghost"
              onPress={() => setAudioUri(undefined)}
            />
          </View>
        ) : null}
      </Card>

      <Button title="Save dream" onPress={onSave} />
    </ScrollView>
  );
}
