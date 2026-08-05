import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@shopify/restyle';
import { Card } from '../../../../components/ui/Card';
import { SectionHeader } from '../../../../components/ui/SectionHeader';
import { Text } from '../../../../components/ui/Text';
import { type DreamCopy } from '../../../../constants/copy/dreams';
import { type Theme } from '../../../../theme/theme';
import { type HomeRevisitCue } from '../../model/homeOverview';
import { createHomeScreenStyles } from '../../screens/HomeScreen.styles';
import { HomeSpotlightSection } from './sections/HomeSpotlightSection';

type HomeListHeaderProps = {
  copy: DreamCopy;
  styles: ReturnType<typeof createHomeScreenStyles>;
  recentDreamCount: number;
  activeDreamCount: number;
  archiveActionLabel: string;
  revisitCue: HomeRevisitCue | null;
  onOpenRevisitDream: (dreamId: string) => void;
  onOpenArchive: () => void;
};

export const HomeListHeader = React.memo(function HomeListHeader({
  copy,
  styles,
  recentDreamCount,
  activeDreamCount,
  archiveActionLabel,
  revisitCue,
  onOpenRevisitDream,
  onOpenArchive,
}: HomeListHeaderProps) {
  const theme = useTheme<Theme>();
  const localStyles = React.useMemo(() => createLocalStyles(theme), [theme]);
  const isHomeTruncated = activeDreamCount > recentDreamCount;

  return (
    <View style={styles.listHeaderContent}>
      <HomeSpotlightSection
        copy={copy}
        styles={styles}
        revisitCue={revisitCue}
        onOpenRevisitDream={onOpenRevisitDream}
      />

      <View style={styles.timelineHeaderRow}>
        <View style={styles.timelineHeaderCopy}>
          <Text style={styles.sectionLabel}>{copy.homeSectionLabel}</Text>
          {isHomeTruncated ? (
            <Text style={localStyles.limitHint}>{copy.homeRecentLimitHint}</Text>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={archiveActionLabel}
          onPress={onOpenArchive}
          style={({ pressed }) => [
            localStyles.archiveAction,
            pressed ? localStyles.archiveActionPressed : null,
          ]}
        >
          <Text style={localStyles.archiveActionText}>
            {archiveActionLabel}
          </Text>
          <Ionicons
            name="arrow-forward-outline"
            size={14}
            color={theme.colors.accent}
          />
        </Pressable>
      </View>

      {!activeDreamCount ? (
        <Card style={styles.emptyCard}>
          <SectionHeader
            title={copy.emptyActiveTitle}
            subtitle={copy.emptyActiveDescription}
          />
        </Card>
      ) : null}
    </View>
  );
});

function createLocalStyles(theme: Theme) {
  return StyleSheet.create({
    limitHint: {
      maxWidth: 260,
      color: theme.colors.textDim,
      fontSize: 10,
      lineHeight: 15,
    },
    archiveAction: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      maxWidth: 170,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: `${theme.colors.accent}55`,
      backgroundColor: theme.colors.surface,
      paddingVertical: 7,
      paddingHorizontal: 10,
    },
    archiveActionPressed: {
      opacity: 0.9,
    },
    archiveActionText: {
      flexShrink: 1,
      color: theme.colors.accent,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: '800',
      textAlign: 'center',
    },
  });
}
