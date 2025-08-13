import React from 'react';
import { View } from 'react-native';
import { Card } from '../components/ui/Card';
import { Text } from '../components/ui/Text';
import { listDreams } from '../storage/dreams';

export default function HomeScreen() {
  const [dreams, setDreams] = React.useState(() => listDreams());
  // TODO: add pull-to-refresh, subscribe to storage changes
  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      {dreams.map(d => (
        <Card key={d.id}>
          <Text style={{ fontWeight: '700' }}>{d.title || 'Untitled dream'}</Text>
          <Text style={{ marginTop: 6, color: '#B6B6C2' }}>{new Date(d.createdAt).toLocaleString()}</Text>
        </Card>
      ))}
    </View>
  );
}