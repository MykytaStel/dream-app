import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card } from '../../../components/ui/Card';
import { Text } from '../../../components/ui/Text';
import type { Theme } from '../../../theme/theme';
import type {
  MemoryDisclosureCopy,
  MemoryDisclosureState,
} from '../model/memoryDisclosure';

export function MemoryDisclosureCard({
  state,
  copy,
}: {
  state: MemoryDisclosureState;
  copy: MemoryDisclosureCopy;
}) {
  const theme = useTheme<Theme>();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <Card style={styles.stageCard}>
      <View style={styles.stageIcon}>
        <Ionicons
          name={state.stage === 'deep' ? 'sparkles-outline' : 'layers-outline'}
          size={18}
          color={theme.colors.accent}
        />
      </View>
      <View style={styles.stageCopy}>
        <Text style={styles.stageTitle}>{copy.title}</Text>
        <Text style={styles.stageDescription}>{copy.description}</Text>
        {copy.progressLabel ? (
          <View style={styles.progressPill}>
            <Text style={styles.progressText}>{copy.progressLabel}</Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

export type MemoryLinkRow = {
  key: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
};

function MemoryLinkRowItem({ row }: { row: MemoryLinkRow }) {
  const theme = useTheme<Theme>();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={row.title}
      accessibilityHint={row.description}
      onPress={row.onPress}
      style={({ pressed }) => [
        styles.secondaryAction,
        pressed ? styles.buttonPressed : null,
      ]}
    >
      <View style={styles.secondaryIcon}>
        <Ionicons name={row.icon} size={17} color={theme.colors.accent} />
      </View>
      <View style={styles.secondaryCopy}>
        <Text style={styles.secondaryTitle}>{row.title}</Text>
        <Text style={styles.secondaryDescription} numberOfLines={2}>
          {row.description}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.colors.textDim} />
    </Pressable>
  );
}

// The weekly-goal / achievements ("Progress") card was removed from here, and
// its screen and route deleted: PRODUCT.md is explicit that this is not a habit
// tracker. What remains is a plain list of destinations the Memory tab links to.
export function MemoryLinkRows({ rows }: { rows: MemoryLinkRow[] }) {
  const theme = useTheme<Theme>();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  if (!rows.length) {
    return null;
  }

  return (
    <View style={styles.linkRowsColumn}>
      {rows.map(row => (
        <MemoryLinkRowItem key={row.key} row={row} />
      ))}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    stageCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      padding: 14,
      borderColor: `${theme.colors.accent}55`,
      backgroundColor: theme.colors.surfaceElevated,
    },
    stageIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: `${theme.colors.accent}55`,
      backgroundColor: theme.colors.background,
    },
    stageCopy: {
      flex: 1,
      minWidth: 0,
      gap: 5,
    },
    stageTitle: {
      color: theme.colors.text,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '700',
    },
    stageDescription: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 18,
    },
    progressPill: {
      alignSelf: 'flex-start',
      marginTop: 3,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      paddingVertical: 5,
      paddingHorizontal: 9,
    },
    progressText: {
      color: theme.colors.textDim,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: '700',
    },
    buttonPressed: {
      opacity: 0.94,
    },
    linkRowsColumn: {
      gap: 10,
    },
    secondaryAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingVertical: 11,
      paddingHorizontal: 12,
    },
    secondaryIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: `${theme.colors.accent}44`,
      backgroundColor: theme.colors.background,
    },
    secondaryCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    secondaryTitle: {
      color: theme.colors.text,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '800',
    },
    secondaryDescription: {
      color: theme.colors.textDim,
      fontSize: 10,
      lineHeight: 14,
    },
  });
}
