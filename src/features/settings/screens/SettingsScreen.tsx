/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { Card } from '../../../components/ui/Card';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Text } from '../../../components/ui/Text';
import { SETTINGS_COPY } from '../../../constants/copy/settings';

export default function SettingsScreen() {
  return (
    <ScreenContainer scroll={false}>
      <SectionHeader title={SETTINGS_COPY.title} />
      <Card>
        <Text style={{ fontWeight: '700' }}>{SETTINGS_COPY.plannedTitle}</Text>
        <Text style={{ marginTop: 6, color: '#B6B6C2' }}>
          {SETTINGS_COPY.plannedDescription}
        </Text>
      </Card>
    </ScreenContainer>
  );
}
