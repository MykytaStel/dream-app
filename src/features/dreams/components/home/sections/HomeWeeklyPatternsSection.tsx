import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../../../../../components/ui/Text';
import type { DreamCopy } from '../../../../../constants/copy/dreams';
import type { createHomeScreenStyles } from '../../../screens/HomeScreen.styles';
import type { WeeklyPatternCard } from '../../../../stats/model/weeklyPatternCards';
import type { PatternDetailKind } from '../../../../../app/navigation/routes';

/**
 * A calm read of the last seven days.
 *
 * The smallest of the three, and the only one whose dependency array was
 * already short enough to read as a prop list without being rewritten.
 */

type HomeWeeklyPatternsSectionProps = {
  copy: DreamCopy;
  styles: ReturnType<typeof createHomeScreenStyles>;
  weeklyPatternCards: WeeklyPatternCard[];
  onOpenPatternDetail: (signal: string, kind: PatternDetailKind) => void;
};

export function HomeWeeklyPatternsSection({
  copy,
  styles,
  weeklyPatternCards,
  onOpenPatternDetail,
}: HomeWeeklyPatternsSectionProps) {
  if (!weeklyPatternCards.length) {
    return null;
  }

  return (
    <View style={styles.weeklyPatternsSection}>
      <View style={styles.weeklyPatternsHeader}>
        <Text style={styles.sectionLabel}>{copy.homeWeeklyPatternsTitle}</Text>
        <Text style={styles.weeklyPatternsSubtitle}>
          {copy.homeWeeklyPatternsSubtitle}
        </Text>
      </View>

      <View style={styles.weeklyPatternsRow}>
        {weeklyPatternCards.map(card => {
          const content = (
            <>
              <Text style={styles.weeklyPatternLabel}>{card.label}</Text>
              <Text style={styles.weeklyPatternTitle}>{card.title}</Text>
              <Text style={styles.weeklyPatternHint}>{card.hint}</Text>
            </>
          );

          if (card.signal && card.signalKind) {
            const signal = card.signal;
            const signalKind = card.signalKind;

            return (
              <Pressable
                accessibilityRole="button"
                key={card.key}
                style={({ pressed }) => [
                  styles.weeklyPatternCard,
                  card.accent ? styles.weeklyPatternCardAccent : null,
                  pressed ? styles.spotlightTilePressed : null,
                ]}
                onPress={() => onOpenPatternDetail(signal, signalKind)}
              >
                {content}
              </Pressable>
            );
          }

          return (
            <View
              key={card.key}
              style={[
                styles.weeklyPatternCard,
                card.accent ? styles.weeklyPatternCardAccent : null,
              ]}
            >
              {content}
            </View>
          );
        })}
      </View>
    </View>
  );
}
