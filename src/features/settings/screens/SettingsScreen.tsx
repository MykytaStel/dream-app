/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { View } from 'react-native';
import { Card } from '../../../components/ui/Card';
import { Text } from '../../../components/ui/Text';

export default function SettingsScreen() {
  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>Settings</Text>
      <Card>
        <Text style={{ fontWeight: '700' }}>Planned controls</Text>
        <Text style={{ marginTop: 6, color: '#B6B6C2' }}>
          Notifications, privacy, export, AI preferences, and Health integrations
          should live here.
        </Text>
      </Card>
    </View>
  );
}
