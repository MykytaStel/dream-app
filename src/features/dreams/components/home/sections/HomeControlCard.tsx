import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../../../../../components/ui/Text';
import { Card } from '../../../../../components/ui/Card';
import { SegmentedControl } from '../../../../../components/ui/SegmentedControl';
import type { DreamCopy } from '../../../../../constants/copy/dreams';
import type { createHomeScreenStyles } from '../../../screens/HomeScreen.styles';
import type { HomeTimelineFilters } from '../../../model/homeTimeline';
import { TagChip } from '../../../../../components/ui/TagChip';
import type { HomeFilterChip, HomeOption } from '../homeTypes';
import type { HomeSortOrder } from '../../../model/homeTimeline';

/**
 * Quick filters, sort order, and whatever refinements are currently on.
 *
 * The last block out of `HomeListHeader`. The sort options arrive as one shape
 * and the segmented control wants another, so the mapping happens here rather
 * than in a parent that never looked at either.
 */

type HomeControlCardProps = {
  copy: DreamCopy;
  styles: ReturnType<typeof createHomeScreenStyles>;
  timelineFilters: HomeTimelineFilters;
  activeFilterChips: HomeFilterChip[];
  sortOptions: Array<HomeOption<HomeSortOrder>>;
  lucidQuickFilterLabel?: string;
  nightmareQuickFilterLabel?: string;
  onOpenFilterSheet: () => void;
  onClearFilters: () => void;
  updateTimelineFilters: (
    updater: (current: HomeTimelineFilters) => HomeTimelineFilters,
  ) => void;
};

export function HomeControlCard({
  copy,
  styles,
  timelineFilters,
  activeFilterChips,
  sortOptions,
  lucidQuickFilterLabel,
  nightmareQuickFilterLabel,
  onOpenFilterSheet,
  onClearFilters,
  updateTimelineFilters,
}: HomeControlCardProps) {
  const sortControlOptions = React.useMemo(
    () =>
      sortOptions.map(option => ({ value: option.key, label: option.label })),
    [sortOptions],
  );

  const tagsShortcutLabel = timelineFilters.tags.length
    ? `${copy.homeTagFilterLabel} (${timelineFilters.tags.length})`
    : copy.homeTagFilterLabel;

  return (
    <Card style={styles.controlCard}>
      <View style={styles.controlSectionHeader}>
        <Text style={styles.searchPresetLabel}>
          {copy.homeQuickFiltersLabel}
        </Text>
        <Pressable
          accessibilityRole="button"
          style={styles.inlineActionButton}
          onPress={onOpenFilterSheet}
        >
          <Text style={styles.inlineActionButtonText}>
            {copy.homeAllFilters}
          </Text>
        </Pressable>
      </View>
      <View style={styles.primaryActionsRow}>
        <Pressable
          accessibilityRole="button"
          style={[
            styles.inlineActionButton,
            timelineFilters.special === 'lucid'
              ? styles.inlineActionButtonActive
              : null,
          ]}
          onPress={() =>
            updateTimelineFilters(current => ({
              ...current,
              special: current.special === 'lucid' ? 'all' : 'lucid',
            }))
          }
        >
          <Text
            style={[
              styles.inlineActionButtonText,
              timelineFilters.special === 'lucid'
                ? styles.inlineActionButtonTextActive
                : null,
            ]}
          >
            {lucidQuickFilterLabel ?? 'Lucid'}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          style={[
            styles.inlineActionButton,
            timelineFilters.special === 'nightmare'
              ? styles.inlineActionButtonActive
              : null,
          ]}
          onPress={() =>
            updateTimelineFilters(current => ({
              ...current,
              special: current.special === 'nightmare' ? 'all' : 'nightmare',
            }))
          }
        >
          <Text
            style={[
              styles.inlineActionButtonText,
              timelineFilters.special === 'nightmare'
                ? styles.inlineActionButtonTextActive
                : null,
            ]}
          >
            {nightmareQuickFilterLabel ?? 'Nightmare'}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          style={[
            styles.inlineActionButton,
            timelineFilters.starredOnly
              ? styles.inlineActionButtonActive
              : null,
          ]}
          onPress={() =>
            updateTimelineFilters(current => ({
              ...current,
              starredOnly: !current.starredOnly,
            }))
          }
        >
          <Text
            style={[
              styles.inlineActionButtonText,
              timelineFilters.starredOnly
                ? styles.inlineActionButtonTextActive
                : null,
            ]}
          >
            {copy.homeFilterStarred}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          style={[
            styles.inlineActionButton,
            timelineFilters.entryType === 'audio'
              ? styles.inlineActionButtonActive
              : null,
          ]}
          onPress={() =>
            updateTimelineFilters(current => ({
              ...current,
              entryType: current.entryType === 'audio' ? 'all' : 'audio',
            }))
          }
        >
          <Text
            style={[
              styles.inlineActionButtonText,
              timelineFilters.entryType === 'audio'
                ? styles.inlineActionButtonTextActive
                : null,
            ]}
          >
            {copy.homeTypeFilterAudio}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          style={[
            styles.inlineActionButton,
            timelineFilters.tags.length
              ? styles.inlineActionButtonActive
              : null,
          ]}
          onPress={onOpenFilterSheet}
        >
          <Text
            style={[
              styles.inlineActionButtonText,
              timelineFilters.tags.length
                ? styles.inlineActionButtonTextActive
                : null,
            ]}
          >
            {tagsShortcutLabel}
          </Text>
        </Pressable>
      </View>

      <View style={styles.controlSectionDivider} />

      <View style={styles.sortControlBlock}>
        <Text style={styles.searchPresetLabel}>{copy.homeSortFilterLabel}</Text>
      </View>
      <SegmentedControl
        options={sortControlOptions}
        selectedValue={timelineFilters.sortOrder}
        onChange={(value: HomeSortOrder) =>
          updateTimelineFilters(current => ({
            ...current,
            sortOrder: value,
          }))
        }
        columns={2}
        minWidth={120}
      />

      {activeFilterChips.length ? (
        <>
          <View style={styles.controlSectionDivider} />
          <View style={styles.activeFiltersRow}>
            {activeFilterChips.map(chip => (
              <TagChip key={chip.key} label={chip.label} />
            ))}
            <Pressable
              accessibilityRole="button"
              style={styles.clearFiltersButton}
              onPress={onClearFilters}
            >
              <Text style={styles.clearFiltersButtonText}>
                {copy.homeClearFilters}
              </Text>
            </Pressable>
          </View>
        </>
      ) : null}
    </Card>
  );
}
