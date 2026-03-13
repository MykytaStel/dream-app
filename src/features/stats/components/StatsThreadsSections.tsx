import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Animated from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card } from '../../../components/ui/Card';
import { SegmentedControl } from '../../../components/ui/SegmentedControl';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { TagChip } from '../../../components/ui/TagChip';
import { Text } from '../../../components/ui/Text';
import type { DreamCopy } from '../../../constants/copy/dreams';
import { Theme } from '../../../theme/theme';
import { type PatternDreamMatch, type PatternMatchSource } from '../model/patternMatches';
import { PatternGroupCard, type PatternGroupCardItem } from './PatternGroupCard';
import {
  statsLayoutTransition,
  type StatsCopy,
  type StatsStyles,
} from './StatsScreenSection.shared';

function formatThreadPreview(match: PatternDreamMatch, dreamCopy: DreamCopy) {
  const text = match.dream.text?.trim();
  if (text) {
    return text.length > 120 ? `${text.slice(0, 117)}...` : text;
  }

  const transcript = match.dream.transcript?.trim();
  if (transcript) {
    const prefix =
      match.dream.transcriptSource === 'edited'
        ? `${dreamCopy.editedTranscriptPreviewPrefix}: `
        : `${dreamCopy.transcriptPreviewPrefix}: `;
    const visible = transcript.length > 96 ? `${transcript.slice(0, 93)}...` : transcript;
    return `${prefix}${visible}`;
  }

  if (match.dream.audioUri) {
    return dreamCopy.audioOnlyPreview;
  }

  return dreamCopy.noDetailsPreview;
}

function getSourceLabel(source: PatternMatchSource, copy: StatsCopy) {
  switch (source) {
    case 'tag':
      return copy.patternDetailSourceTag;
    case 'title':
      return copy.patternDetailSourceTitle;
    case 'text':
      return copy.patternDetailSourceText;
    case 'transcript':
      return copy.patternDetailSourceTranscript;
  }
}

function getPatternMatchCountLabel(count: number, copy: StatsCopy) {
  return `${count} ${count === 1 ? copy.patternDetailMatchesSingle : copy.patternDetailMatchesPlural}`;
}

function SavedThreadPreviewList({
  copy,
  styles,
  savedThreadItems,
  onOpenThreadDetail,
}: {
  copy: StatsCopy;
  styles: StatsStyles;
  savedThreadItems: ReadonlyArray<{
    signal: string;
    kind: string;
    kindLabel: string;
    matchesLabel: string;
  }>;
  onOpenThreadDetail: (signal: string, kind: string) => void;
}) {
  const t = useTheme<Theme>();

  if (!savedThreadItems.length) {
    return null;
  }

  return (
    <View style={styles.savedThreadsBlock}>
      <View style={styles.savedThreadsHeaderRow}>
        <Text style={styles.savedThreadsLabel}>{copy.savedThreadsTitle}</Text>
        <View style={styles.savedThreadsCountChip}>
          <Text style={styles.savedThreadsCountText}>{savedThreadItems.length}</Text>
        </View>
      </View>
      <View style={styles.savedThreadsList}>
        {savedThreadItems.slice(0, 2).map(item => (
          <Pressable
            key={`${item.kind}-${item.signal}`}
            style={({ pressed }) => [
              styles.savedThreadRow,
              pressed ? styles.insightCardPressed : null,
            ]}
            onPress={() => onOpenThreadDetail(item.signal, item.kind)}
          >
            <View style={styles.savedThreadCopy}>
              <Text style={styles.savedThreadTitle}>{item.signal}</Text>
              <Text style={styles.savedThreadMeta}>{`${item.kindLabel} • ${item.matchesLabel}`}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={t.colors.text} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function ThreadMatchPreviewList({
  copy,
  styles,
  matches,
  dreamCopy,
  onOpenThreadDream,
}: {
  copy: StatsCopy;
  styles: StatsStyles;
  matches: ReadonlyArray<PatternDreamMatch>;
  dreamCopy: DreamCopy;
  onOpenThreadDream: (dreamId: string) => void;
}) {
  const t = useTheme<Theme>();

  if (!matches.length) {
    return <Text style={styles.mutedText}>{copy.patternDetailEmptyDescription}</Text>;
  }

  return (
    <View style={styles.threadMatchList}>
      {matches.slice(0, 4).map(match => (
        <Pressable
          key={match.dream.id}
          onPress={() => onOpenThreadDream(match.dream.id)}
          style={({ pressed }) => [
            styles.threadMatchCard,
            pressed ? styles.insightCardPressed : null,
          ]}
        >
          <View style={styles.threadMatchHeader}>
            <View style={styles.threadMatchCopy}>
              <Text style={styles.threadMatchTitle}>
                {match.dream.title?.trim() || dreamCopy.untitled}
              </Text>
              <Text style={styles.threadMatchMeta}>
                {match.dream.sleepDate ?? new Date(match.dream.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={t.colors.text} />
          </View>

          <Text style={styles.threadMatchPreview}>{formatThreadPreview(match, dreamCopy)}</Text>

          <View style={styles.threadMatchSourcesRow}>
            {match.sources.map(source => (
              <TagChip key={`${match.dream.id}-${source}`} label={getSourceLabel(source, copy)} />
            ))}
          </View>
        </Pressable>
      ))}
    </View>
  );
}

export function StatsThreadsSections({
  copy,
  styles,
  patternGroups,
  activePatternGroup,
  selectedPatternGroup,
  onSelectPatternGroup,
  activeThread,
  activeThreadLabel,
  activeThreadDescription,
  activeThreadMatches,
  savedThreadItems,
  dreamCopy,
  onOpenThreadDream,
  onOpenThreadDetail,
  onClearThread,
}: {
  copy: StatsCopy;
  styles: StatsStyles;
  patternGroups: ReadonlyArray<{
    key: string;
    label: string;
    description: string;
    values: PatternGroupCardItem[];
    empty: string;
  }>;
  activePatternGroup: {
    key: string;
    label: string;
    description: string;
    values: PatternGroupCardItem[];
    empty: string;
  } | undefined;
  selectedPatternGroup: string;
  onSelectPatternGroup: (key: any) => void;
  activeThread: { signal: string; kind: string } | null;
  activeThreadLabel: string | null;
  activeThreadDescription: string | null;
  activeThreadMatches: ReadonlyArray<PatternDreamMatch>;
  savedThreadItems: ReadonlyArray<{
    signal: string;
    kind: string;
    kindLabel: string;
    matchesLabel: string;
  }>;
  dreamCopy: DreamCopy;
  onOpenThreadDream: (dreamId: string) => void;
  onOpenThreadDetail: (signal: string, kind: string) => void;
  onClearThread: () => void;
}) {
  return (
    <>
      <Animated.View layout={statsLayoutTransition}>
        <Card style={styles.sectionCard}>
          <SavedThreadPreviewList
            copy={copy}
            styles={styles}
            savedThreadItems={savedThreadItems}
            onOpenThreadDetail={onOpenThreadDetail}
          />

          <SectionHeader
            title={copy.patternsTitle}
            subtitle={activePatternGroup?.description ?? copy.patternsDescription}
          />
          <SegmentedControl
            options={patternGroups.map(group => ({
              value: group.key,
              label: group.label,
            }))}
            selectedValue={selectedPatternGroup}
            onChange={onSelectPatternGroup}
            minWidth={72}
          />

          <View style={styles.patternGroupList}>
            {activePatternGroup ? (
              <PatternGroupCard
                key={activePatternGroup.key}
                items={activePatternGroup.values}
                emptyLabel={activePatternGroup.empty}
                leadLabel={copy.patternsTopLabel}
                moreLabel={copy.patternsMoreLabel}
              />
            ) : null}
          </View>
        </Card>
      </Animated.View>

      {activeThread ? (
        <Animated.View layout={statsLayoutTransition}>
          <Card style={styles.sectionCard}>
            <View style={styles.threadHeaderRow}>
              <View style={styles.threadHeaderCopy}>
                <SectionHeader title={copy.memoryThreadTitle} subtitle={copy.memoryThreadDescription} />
              </View>
              <Pressable style={styles.toggleButton} onPress={onClearThread}>
                <Text style={styles.toggleButtonText}>{copy.memoryThreadClearAction}</Text>
              </Pressable>
            </View>

            <View style={styles.threadLeadCard}>
              <View style={styles.threadLeadHeader}>
                <View style={styles.threadLeadCopy}>
                  <Text style={styles.threadLeadLabel}>{activeThread.signal}</Text>
                  <Text style={styles.threadLeadDescription}>
                    {activeThreadDescription ?? copy.patternsDescription}
                  </Text>
                </View>
                <View style={styles.threadMetaWrap}>
                  {activeThreadLabel ? (
                    <View style={styles.threadMetaChip}>
                      <Text style={styles.threadMetaChipText}>{activeThreadLabel}</Text>
                    </View>
                  ) : null}
                  <View style={styles.threadMetaChip}>
                    <Text style={styles.threadMetaChipText}>
                      {getPatternMatchCountLabel(activeThreadMatches.length, copy)}
                    </Text>
                  </View>
                </View>
              </View>
              <Pressable
                style={styles.threadOpenAction}
                onPress={() => onOpenThreadDetail(activeThread.signal, activeThread.kind)}
              >
                <Text style={styles.threadOpenActionText}>{copy.memoryThreadOpenAction}</Text>
              </Pressable>
            </View>

            <ThreadMatchPreviewList
              copy={copy}
              styles={styles}
              matches={activeThreadMatches}
              dreamCopy={dreamCopy}
              onOpenThreadDream={onOpenThreadDream}
            />
          </Card>
        </Animated.View>
      ) : null}
    </>
  );
}
