import React from 'react';
import { View, TextInput, Alert } from 'react-native';
import { Button } from '../components/ui/Button';
import { Text } from '../components/ui/Text';
import { startRecording, stopRecording } from '../services/audio';
import { saveDream } from '../storage/dreams';
import { Dream } from '../types/dream';
import { nanoid } from '../services/id';

export default function NewDreamScreen() {
  const [title, setTitle] = React.useState('');
  const [recording, setRecording] = React.useState(false);
  const [audioUri, setAudioUri] = React.useState<string | undefined>();

  async function onToggleRecord() {
    try {
      if (!recording) {
        await startRecording();
        setRecording(true);
      } else {
        const uri = await stopRecording();
        setAudioUri(uri);
        setRecording(false);
      }
    } catch (e) {
      Alert.alert('Audio error', String(e));
    }
  }

  function onSave() {
    const dream: Dream = {
      id: nanoid(),
      createdAt: Date.now(),
      title: title.trim(),
      audioUri,
      tags: [],
    };
    saveDream(dream);
    setTitle('');
    setAudioUri(undefined);
    Alert.alert('Saved', 'Your dream was saved locally.');
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>New dream</Text>
      <TextInput placeholder="Title (optional)" placeholderTextColor="#777" value={title} onChangeText={setTitle} style={{ borderWidth: 1, borderColor: '#2A2A33', borderRadius: 12, padding: 12, color: 'white' }} />
      <Button title={recording ? 'Stop recording' : 'Start recording'} onPress={onToggleRecord} />
      <Button variant="ghost" title="Save" onPress={onSave} />
      {/* TODO: add tags, mood, text input */}
    </View>
  );
}