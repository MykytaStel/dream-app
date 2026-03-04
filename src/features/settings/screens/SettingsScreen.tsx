import React from 'react';
import { useTheme } from '@shopify/restyle';
import { Card } from '../../../components/ui/Card';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Text } from '../../../components/ui/Text';
import { SETTINGS_COPY } from '../../../constants/copy/settings';
import { Theme } from '../../../theme/theme';
import { createSettingsScreenStyles } from './SettingsScreen.styles';

export default function SettingsScreen() {
  const t = useTheme<Theme>();
  const styles = createSettingsScreenStyles(t);

  return (
    <ScreenContainer scroll={false}>
      <SectionHeader title={SETTINGS_COPY.title} />
      <Card>
        <Text style={styles.title}>{SETTINGS_COPY.plannedTitle}</Text>
        <Text style={styles.description}>
          {SETTINGS_COPY.plannedDescription}
        </Text>
      </Card>
    </ScreenContainer>
  );
}
