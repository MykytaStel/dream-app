import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Text } from '../../../components/ui/Text';
import { Theme } from '../../../theme/theme';
import { createControlPill, createSoftTile } from '../../../theme/surfaces';

export type PatternGroupCardItem = {
  key: string;
  label: string;
  countLabel: string;
  countBadge: string;
  sourceLabel?: string;
  onPress?: () => void;
};

type PatternGroupCardProps = {
  title: string;
  description: string;
  items: PatternGroupCardItem[];
  emptyLabel: string;
  moreLabel: string;
};

export function PatternGroupCard({
  title,
  description,
  items,
  emptyLabel,
  moreLabel,
}: PatternGroupCardProps) {
  const theme = useTheme<Theme>();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const leadItem = items[0];
  const secondaryItems = items.slice(1, 5);

  return (
    <View style={styles.groupCard}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      {!leadItem ? (
        <Text style={styles.emptyText}>{emptyLabel}</Text>
      ) : (
        <>
          <Pressable
            disabled={!leadItem.onPress}
            onPress={leadItem.onPress}
            style={({ pressed }) => [
              styles.leadCard,
              leadItem.onPress ? styles.leadCardInteractive : null,
              pressed && leadItem.onPress ? styles.leadCardPressed : null,
            ]}
          >
            <View style={styles.leadTopRow}>
              <Text style={styles.leadLabel} numberOfLines={2}>
                {leadItem.label}
              </Text>
              <View style={styles.countChip}>
                <Text style={styles.countChipText}>{leadItem.countLabel}</Text>
              </View>
            </View>

            {leadItem.sourceLabel ? (
              <View style={styles.sourceRow}>
                <View style={styles.sourceChip}>
                  <Text style={styles.sourceChipText}>{leadItem.sourceLabel}</Text>
                </View>
              </View>
            ) : null}
          </Pressable>

          {secondaryItems.length ? (
            <View style={styles.secondaryBlock}>
              <Text style={styles.secondaryLabel}>{moreLabel}</Text>
              <View style={styles.secondaryWrap}>
                {secondaryItems.map(item => (
                  <Pressable
                    key={item.key}
                    disabled={!item.onPress}
                    onPress={item.onPress}
                    style={({ pressed }) => [
                      styles.secondaryChip,
                      item.onPress ? styles.secondaryChipInteractive : null,
                      pressed && item.onPress ? styles.secondaryChipPressed : null,
                    ]}
                  >
                    <Text style={styles.secondaryChipLabel} numberOfLines={1}>
                      {item.label}
                    </Text>
                    <View style={styles.secondaryCountChip}>
                      <Text style={styles.secondaryCountChipText}>{item.countBadge}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    groupCard: {
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
    leadCardInteractive: {
      borderColor: theme.colors.accent,
    },
    leadCardPressed: {
      opacity: 0.96,
      transform: [{ scale: 0.992 }],
    },
    leadTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
    },
    leadLabel: {
      flex: 1,
      fontWeight: '700',
      fontSize: 18,
      lineHeight: 23,
      textTransform: 'capitalize',
    },
    countChip: {
      ...createControlPill(theme, {
        tone: 'surface',
        paddingVertical: 5,
        paddingHorizontal: 8,
      }),
    },
    countChipText: {
      color: theme.colors.text,
      fontSize: 11,
      fontWeight: '700',
    },
    sourceRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    sourceChip: {
      ...createControlPill(theme, {
        tone: 'background',
        paddingVertical: 4,
        paddingHorizontal: 8,
      }),
    },
    sourceChipText: {
      color: theme.colors.textDim,
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    secondaryBlock: {
      gap: 8,
    },
    secondaryLabel: {
      color: theme.colors.textDim,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    secondaryWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    secondaryChip: {
      ...createControlPill(theme, {
        tone: 'surface',
        paddingVertical: 6,
        paddingHorizontal: 10,
      }),
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    secondaryChipInteractive: {
      borderColor: theme.colors.accent,
    },
    secondaryChipPressed: {
      opacity: 0.96,
      transform: [{ scale: 0.992 }],
    },
    secondaryChipLabel: {
      color: theme.colors.text,
      fontSize: 12,
      fontWeight: '700',
      maxWidth: 160,
      textTransform: 'capitalize',
    },
    secondaryCountChip: {
      ...createControlPill(theme, {
        tone: 'background',
        paddingVertical: 3,
        paddingHorizontal: 7,
      }),
    },
    secondaryCountChipText: {
      color: theme.colors.textDim,
      fontSize: 11,
      fontWeight: '700',
    },
  });
}
