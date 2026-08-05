import React from 'react';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Text } from '../../../../components/ui/Text';
import { createHomeScreenStyles } from '../../screens/HomeScreen.styles';

type HomeHeroProps = {
  styles: ReturnType<typeof createHomeScreenStyles>;
  insetTop: number;
  greeting: string;
  dateLabel: string;
  /**
   * Kept temporarily while HomeScreen and its timeline model are migrated in
   * separate small slices. Home no longer renders streak pressure.
   */
  streak?: number;
  streakLabel?: string;
};

export const HomeHero = React.memo(function HomeHero({
  styles,
  insetTop,
  greeting,
  dateLabel,
}: HomeHeroProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={[styles.heroCard, { paddingTop: insetTop }]}
    >
      {/*
        Offset by the safe area, not by the card. The card starts at the top of
        the screen, so a glow measured from its edge sits under the clock. It
        belongs beside the greeting.
      */}
      <View
        pointerEvents="none"
        style={[styles.heroGlowLarge, { top: insetTop + 8 }]}
      />
      <View style={styles.heroFrame}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>{greeting}</Text>
            <View style={styles.heroDateRow}>
              <View style={styles.heroDateChip}>
                <Text style={styles.heroDateChipLabel}>{dateLabel}</Text>
              </View>
            </View>
          </View>
          <View style={styles.heroVisualShell}>
            <View style={[styles.heroFacet, styles.heroFacetPrimary]} />
            <View style={[styles.heroFacet, styles.heroFacetAccent]} />
            <View style={[styles.heroFacet, styles.heroFacetAlt]} />
          </View>
        </View>
      </View>
    </Animated.View>
  );
});
