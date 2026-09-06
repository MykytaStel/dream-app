import React from 'react';
import Animated from 'react-native-reanimated';
import { Card } from '../../../components/ui/Card';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import {
  statsLayoutTransition,
  type StatsCopy,
  type StatsStyles,
} from './StatsScreenSection.shared';

export function StatsHeroSection({
  copy,
  styles,
}: {
  copy: StatsCopy;
  styles: StatsStyles;
}) {
  return (
    <Animated.View layout={statsLayoutTransition}>
      <Card style={styles.heroCard}>
        <SectionHeader title={copy.title} subtitle={copy.subtitle} large />
      </Card>
    </Animated.View>
  );
}
