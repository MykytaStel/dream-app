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

export function MemoryDetailsToggle({
  expanded,
  copy,
  onPress,
}: {
  expanded: boolean;
  copy: MemoryDisclosureCopy;
  onPress: () => void;
}) {
  const theme = useTheme<Theme>();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.detailsButton,
        pressed ? styles.buttonPressed : null,
      ]}
    >
      <View style={styles.detailsCopy}>
        <Text style={styles.detailsTitle}>{copy.detailsTitle}</Text>
        <Text style={styles.detailsDescription}>{copy.detailsDescription}</Text>
      </View>
      <View style={styles.detailsAction}>
        <Text style={styles.detailsActionText}>
          {expanded ? copy.hideDetailsLabel : copy.showDetailsLabel}
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={theme.colors.text}
        />
      </View>
    </Pressable>
  );
}

function MemorySecondaryAction({
  title,
  description,
  icon,
  onPress,
}: {
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}) {
  const theme = useTheme<Theme>();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={description}
      onPress={onPress}
      style={({ pressed }) => [
        styles.secondaryAction,
        pressed ? styles.buttonPressed : null,
      ]}
    >
      <View style={styles.secondaryIcon}>
        <Ionicons name={icon} size={17} color={theme.colors.accent} />
      </View>
      <View style={styles.secondaryCopy}>
        <Text style={styles.secondaryTitle}>{title}</Text>
        <Text style={styles.secondaryDescription} numberOfLines={2}>
          {description}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={16}
        color={theme.colors.textDim}
      />
    </Pressable>
  );
}

export function MemorySecondaryActions({
  copy,
  onOpenPractice,
  onOpenProgress,
}: {
  copy: MemoryDisclosureCopy;
  onOpenPractice: () => void;
  onOpenProgress: () => void;
}) {
  const theme = useTheme<Theme>();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.secondaryActionsRow}>
      <MemorySecondaryAction
        title={copy.practiceTitle}
        description={copy.practiceDescription}
        icon="moon-outline"
        onPress={onOpenPractice}
      />
      <MemorySecondaryAction
        title={copy.progressTitle}
        description={copy.progressDescription}
        icon="flag-outline"
        onPress={onOpenProgress}
      />
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
    detailsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingVertical: 12,
      paddingHorizontal: 14,
    },
    buttonPressed: {
      opacity: 0.94,
    },
    detailsCopy: {
      flex: 1,
      minWidth: 0,
      gap: 3,
    },
    detailsTitle: {
      color: theme.colors.text,
      fontSize: 14,
      lineHeight: 18,
      fontWeight: '700',
    },
    detailsDescription: {
      color: theme.colors.textDim,
      fontSize: 11,
      lineHeight: 16,
    },
    detailsAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexShrink: 0,
    },
    detailsActionText: {
      color: theme.colors.text,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: '700',
    },
    secondaryActionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    secondaryAction: {
      flexGrow: 1,
      flexBasis: '48%',
      minWidth: 150,
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
