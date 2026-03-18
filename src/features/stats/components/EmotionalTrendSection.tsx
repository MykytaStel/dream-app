import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card } from '../../../components/ui/Card';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Text } from '../../../components/ui/Text';
import { Theme } from '../../../theme/theme';
import {
  TREND_VALENCE_COLOR,
  type EmotionalTrendEntry,
} from '../model/emotionalTrends';

type Props = {
  series: EmotionalTrendEntry[];
  insight: string;
  title: string;
  description: string;
  emptyLabel: string;
};

const MAX_BAR_HEIGHT = 48;
const MIN_BAR_HEIGHT = 4;

export function EmotionalTrendSection({ series, insight, title, description, emptyLabel }: Props) {
  const theme = useTheme<Theme>();

  const maxCount = React.useMemo(
    () => Math.max(...series.map(e => e.entryCount), 1),
    [series],
  );

  if (series.length === 0) {
    return (
      <Animated.View entering={FadeInDown.duration(280).springify()}>
        <Card style={styles.card}>
          <SectionHeader title={title} subtitle={description} />
          <Text style={[styles.emptyLabel, { color: theme.colors.textDim }]}>{emptyLabel}</Text>
        </Card>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInDown.duration(280).springify()}>
      <Card style={styles.card}>
        <SectionHeader title={title} subtitle={description} />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.barsContainer}
        >
          {series.map(entry => {
            const barColor = entry.valence
              ? TREND_VALENCE_COLOR[entry.valence]
              : theme.colors.border;
            const barHeight = Math.max(
              MIN_BAR_HEIGHT,
              Math.round((entry.entryCount / maxCount) * MAX_BAR_HEIGHT),
            );

            return (
              <View key={entry.periodKey} style={styles.barColumn}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: barHeight,
                        backgroundColor: barColor,
                        opacity: entry.valence ? 0.85 : 0.3,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[styles.barLabel, { color: theme.colors.textDim }]}
                  numberOfLines={1}
                >
                  {entry.periodLabel}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        <View style={[styles.legendRow, { borderTopColor: theme.colors.border }]}>
          {(['positive', 'neutral', 'negative'] as const).map(valence => (
            <View key={valence} style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: TREND_VALENCE_COLOR[valence] },
                ]}
              />
            </View>
          ))}
        </View>

        {insight ? (
          <Text style={[styles.insightText, { color: theme.colors.textDim }]}>{insight}</Text>
        ) : null}
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    gap: 12,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingBottom: 2,
    minHeight: MAX_BAR_HEIGHT + 20,
  },
  barColumn: {
    alignItems: 'center',
    gap: 4,
    minWidth: 32,
  },
  barTrack: {
    height: MAX_BAR_HEIGHT,
    justifyContent: 'flex-end',
  },
  bar: {
    width: 20,
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.85,
  },
  emptyLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  insightText: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
});
