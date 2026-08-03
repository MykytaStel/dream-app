import React from 'react';
import { View } from 'react-native';
import { type PatternDetailKind } from '../../../../app/navigation/routes';
import { Card } from '../../../../components/ui/Card';
import { SectionHeader } from '../../../../components/ui/SectionHeader';
import { Text } from '../../../../components/ui/Text';
import { type DreamCopy } from '../../../../constants/copy/dreams';
import { type HomeRevisitCue } from '../../model/homeOverview';
import { selectHomeReturnReason } from '../../model/homeReturnReason';
import { createHomeScreenStyles } from '../../screens/HomeScreen.styles';
import { HomeShortcutSection } from './sections/HomeShortcutSection';
import { HomeSpotlightSection } from './sections/HomeSpotlightSection';

/**
 * Home is the way back into the journal, not a second archive.
 *
 * It presents at most one contextual reason to return before the recent-dream
 * timeline. Search, filters, sorting, weekly browsing and practice navigation
 * belong to their dedicated surfaces instead of being duplicated here.
 */
type HomeListHeaderProps = {
  copy: DreamCopy;
  styles: ReturnType<typeof createHomeScreenStyles>;
  visibleDreamCount: number;
  archiveScopedCount: number;
  lastViewedDreamTitle?: string | null;
  lastViewedDreamMeta?: string | null;
  onOpenLastDream?: (() => void) | null;
  spotlightPattern: string;
  spotlightPatternKind: PatternDetailKind | null;
  spotlightCountLabel: string;
  revisitCue: HomeRevisitCue | null;
  attentionValue: string;
  attentionHint: string;
  onOpenRevisitDream: (dreamId: string) => void;
  onOpenPatternDetail: (signal: string, kind: PatternDetailKind) => void;
};

export const HomeListHeader = React.memo(function HomeListHeader({
  copy,
  styles,
  visibleDreamCount,
  archiveScopedCount,
  lastViewedDreamTitle,
  lastViewedDreamMeta,
  onOpenLastDream,
  spotlightPattern,
  spotlightPatternKind,
  spotlightCountLabel,
  revisitCue,
  attentionValue,
  attentionHint,
  onOpenRevisitDream,
  onOpenPatternDetail,
}: HomeListHeaderProps) {
  const hasAttentionCue = attentionValue !== copy.homeSpotlightAttentionClear;
  const returnReason = selectHomeReturnReason({
    hasSpotlightPattern: Boolean(spotlightPatternKind),
    hasRevisitCue: Boolean(revisitCue),
    hasAttentionCue,
    hasLastViewedDream: Boolean(lastViewedDreamTitle),
    canOpenLastViewedDream: Boolean(onOpenLastDream),
  });
  const showSpotlightCard = returnReason === 'spotlight';
  const showLastViewedShortcut = returnReason === 'lastViewed';

  return (
    <View style={styles.listHeaderContent}>
      <HomeSpotlightSection
        copy={copy}
        styles={styles}
        showSpotlightCard={showSpotlightCard}
        spotlightPattern={spotlightPattern}
        spotlightPatternKind={spotlightPatternKind}
        spotlightCountLabel={spotlightCountLabel}
        hasAttentionCue={hasAttentionCue}
        attentionValue={attentionValue}
        attentionHint={attentionHint}
        revisitCue={revisitCue}
        onOpenPatternDetail={onOpenPatternDetail}
        onOpenRevisitDream={onOpenRevisitDream}
      />

      <HomeShortcutSection
        copy={copy}
        styles={styles}
        showLastViewedShortcut={showLastViewedShortcut}
        lastViewedDreamTitle={lastViewedDreamTitle}
        lastViewedDreamMeta={lastViewedDreamMeta}
        onOpenLastDream={onOpenLastDream}
      />

      <View style={styles.timelineHeaderRow}>
        <View style={styles.timelineHeaderCopy}>
          <Text style={styles.sectionLabel}>{copy.homeSectionLabel}</Text>
        </View>
        {visibleDreamCount > 0 ? (
          <View style={styles.timelineCountPill}>
            <Text style={styles.timelineCountLabel}>{visibleDreamCount}</Text>
          </View>
        ) : null}
      </View>

      {!archiveScopedCount ? (
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
