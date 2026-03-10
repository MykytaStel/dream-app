import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Text } from '../../../components/ui/Text';
import { Theme } from '../../../theme/theme';
import { createControlPill, createSoftTile } from '../../../theme/surfaces';

export type DreamFingerprintFacet = {
  key: string;
  label: string;
  value: string;
  meta: string;
  onPress?: () => void;
};

type DreamFingerprintCardProps = {
  title: string;
  description: string;
  leadLabel: string;
  leadSignals: string[];
  emptyLabel: string;
  facets: DreamFingerprintFacet[];
};

export function DreamFingerprintCard({
  title,
  description,
  leadLabel,
  leadSignals,
  emptyLabel,
  facets,
}: DreamFingerprintCardProps) {
  const theme = useTheme<Theme>();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      {!facets.length ? (
        <Text style={styles.emptyText}>{emptyLabel}</Text>
      ) : (
        <>
          <View style={styles.leadCard}>
            <Text style={styles.leadLabel}>{leadLabel}</Text>
            <View style={styles.leadSignalsWrap}>
              {leadSignals.length ? (
                leadSignals.map(signal => (
                  <View key={signal} style={styles.leadChip}>
                    <Text style={styles.leadChipText}>{signal}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>{emptyLabel}</Text>
              )}
            </View>
          </View>

          <View style={styles.grid}>
            {facets.map(facet => (
              <Pressable
                key={facet.key}
                disabled={!facet.onPress}
                onPress={facet.onPress}
                style={({ pressed }) => [
                  styles.facetCard,
                  facet.onPress ? styles.facetCardInteractive : null,
                  pressed && facet.onPress ? styles.facetCardPressed : null,
                ]}
              >
                <Text style={styles.facetLabel}>{facet.label}</Text>
                <Text style={styles.facetValue} numberOfLines={2}>
                  {facet.value}
                </Text>
                <Text style={styles.facetMeta}>{facet.meta}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    card: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 16,
        paddingVertical: 12,
        paddingHorizontal: 12,
      }),
      gap: 10,
    },
    header: {
      gap: 3,
    },
    title: {
      fontWeight: '700',
      fontSize: 17,
      lineHeight: 22,
    },
    description: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    emptyText: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    leadCard: {
      ...createSoftTile(theme, {
        tone: 'alt',
        radius: 14,
        paddingVertical: 11,
        paddingHorizontal: 11,
      }),
      gap: 8,
    },
    leadLabel: {
      color: theme.colors.textDim,
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    leadSignalsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    leadChip: {
      ...createControlPill(theme, {
        tone: 'background',
        paddingVertical: 5,
        paddingHorizontal: 9,
      }),
    },
    leadChipText: {
      color: theme.colors.text,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'capitalize',
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    facetCard: {
      ...createSoftTile(theme, {
        tone: 'alt',
        radius: 14,
        paddingVertical: 11,
        paddingHorizontal: 11,
      }),
      flexGrow: 1,
      flexBasis: '47%',
      minWidth: 140,
      gap: 4,
      minHeight: 98,
      justifyContent: 'space-between',
    },
    facetCardInteractive: {
      borderColor: theme.colors.accent,
    },
    facetCardPressed: {
      opacity: 0.96,
      transform: [{ scale: 0.992 }],
    },
    facetLabel: {
      color: theme.colors.textDim,
      fontSize: 10,
      lineHeight: 13,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    facetValue: {
      color: theme.colors.text,
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '700',
      textTransform: 'capitalize',
    },
    facetMeta: {
      color: theme.colors.textDim,
      fontSize: 11,
      lineHeight: 15,
    },
  });
}
