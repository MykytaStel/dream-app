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
  signalKind?: 'word' | 'theme' | 'symbol';
  onPress?: () => void;
};

type PatternGroupCardProps = {
  title: string;
  description: string;
  items: PatternGroupCardItem[];
  emptyLabel: string;
  leadLabel: string;
  moreLabel: string;
};

export function PatternGroupCard({
  title,
  description,
  items,
  emptyLabel,
  leadLabel,
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
            <View style={styles.leadHeader}>
              <Text style={styles.leadEyebrow}>{leadLabel}</Text>
              {leadItem.sourceLabel ? (
                <View style={styles.sourceChip}>
                  <Text style={styles.sourceChipText}>{leadItem.sourceLabel}</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.leadLabel} numberOfLines={2}>
              {leadItem.label}
            </Text>

            <View style={styles.leadFooter}>
              <View style={styles.countChip}>
                <Text style={styles.countChipText}>{leadItem.countLabel}</Text>
              </View>
            </View>
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
                      styles.secondaryCard,
                      item.onPress ? styles.secondaryCardInteractive : null,
                      pressed && item.onPress ? styles.secondaryCardPressed : null,
                    ]}
                  >
                    <Text style={styles.secondaryCardLabel} numberOfLines={2}>
                      {item.label}
                    </Text>
                    <Text style={styles.secondaryCardMeta}>{item.countLabel}</Text>
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
    leadHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
      flexWrap: 'wrap',
    },
    leadEyebrow: {
      color: theme.colors.textDim,
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    leadLabel: {
      fontWeight: '700',
      fontSize: 18,
      lineHeight: 23,
      textTransform: 'capitalize',
    },
    leadFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
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
    secondaryCard: {
      ...createSoftTile(theme, {
        tone: 'alt',
        radius: 12,
        paddingVertical: 10,
        paddingHorizontal: 10,
      }),
      flexGrow: 1,
      flexBasis: '47%',
      minWidth: 124,
      gap: 4,
    },
    secondaryCardInteractive: {
      borderColor: theme.colors.accent,
    },
    secondaryCardPressed: {
      opacity: 0.96,
      transform: [{ scale: 0.992 }],
    },
    secondaryCardLabel: {
      color: theme.colors.text,
      fontSize: 12,
      fontWeight: '700',
      lineHeight: 17,
      textTransform: 'capitalize',
    },
    secondaryCardMeta: {
      color: theme.colors.textDim,
      fontSize: 11,
      lineHeight: 15,
    },
  });
}
