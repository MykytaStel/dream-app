import React from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { Button } from '../../../../components/ui/Button';
import { FormField } from '../../../../components/ui/FormField';
import { SectionHeader } from '../../../../components/ui/SectionHeader';
import { Text } from '../../../../components/ui/Text';
import { type DreamCopy } from '../../../../constants/copy/dreams';
import { getPracticeCopy } from '../../../../constants/copy/practice';
import { useI18n } from '../../../../i18n/I18nProvider';
import {
  DEFAULT_HOME_TIMELINE_FILTERS,
  type HomeArchiveFilter,
  type HomeDateRangeFilter,
  type HomeEntryTypeFilter,
  type HomeSpecialFilter,
  type HomeTimelineFilters,
  type HomeTranscriptFilter,
} from '../../model/homeTimeline';
import { createHomeScreenStyles } from '../../screens/HomeScreen.styles';
import { type HomeOption } from './homeTypes';

type HomeFilterSheetProps = {
  visible: boolean;
  copy: DreamCopy;
  styles: ReturnType<typeof createHomeScreenStyles>;
  timelineFilters: HomeTimelineFilters;
  homeFilters: Array<HomeOption<HomeArchiveFilter>>;
  moodFilters: Array<HomeOption<HomeTimelineFilters['mood']>>;
  specialFilters: Array<HomeOption<HomeSpecialFilter>>;
  typeFilters: Array<HomeOption<HomeEntryTypeFilter>>;
  transcriptFilters: Array<HomeOption<HomeTranscriptFilter>>;
  availableTags: string[];
  dateRangeFilters: Array<HomeOption<HomeDateRangeFilter>>;
  onClose: () => void;
  updateTimelineFilters: (updater: (current: HomeTimelineFilters) => HomeTimelineFilters) => void;
};

type FilterOption<K extends string> = HomeOption<K>;

type FilterGroupProps<K extends string> = {
  label: string;
  options: Array<FilterOption<K>>;
  value: K;
  onSelect: (value: K) => void;
  styles: ReturnType<typeof createHomeScreenStyles>;
};

function FilterGroup<K extends string>({
  label,
  options,
  value,
  onSelect,
  styles,
}: FilterGroupProps<K>) {
  return (
    <View style={styles.filterGroup}>
      <Text style={styles.filterGroupLabel}>{label}</Text>
      <View style={styles.filterRow}>
        {options.map(option => {
          const active = value === option.key;

          return (
            <Pressable
              key={option.key}
              style={[styles.filterButton, active ? styles.filterButtonActive : null]}
              onPress={() => onSelect(option.key)}
            >
              <Text
                style={[styles.filterButtonLabel, active ? styles.filterButtonLabelActive : null]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function HomeFilterSheet({
  visible,
  copy,
  styles,
  timelineFilters,
  homeFilters,
  moodFilters,
  specialFilters,
  typeFilters,
  transcriptFilters,
  availableTags,
  dateRangeFilters,
  onClose,
  updateTimelineFilters,
}: HomeFilterSheetProps) {
  const { locale } = useI18n();
  const practiceCopy = React.useMemo(() => getPracticeCopy(locale), [locale]);
  const [tagQuery, setTagQuery] = React.useState('');
  const [showAllTags, setShowAllTags] = React.useState(false);
  const hasAdvancedFilters =
    timelineFilters.entryType !== 'all' ||
    timelineFilters.transcript !== 'all' ||
    timelineFilters.dateRange !== 'all';
  const hasAnyFilters =
    timelineFilters.archive !== DEFAULT_HOME_TIMELINE_FILTERS.archive ||
    timelineFilters.starredOnly !== DEFAULT_HOME_TIMELINE_FILTERS.starredOnly ||
    timelineFilters.mood !== DEFAULT_HOME_TIMELINE_FILTERS.mood ||
    timelineFilters.tags.length > 0 ||
    timelineFilters.entryType !== DEFAULT_HOME_TIMELINE_FILTERS.entryType ||
    hasAdvancedFilters;
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(hasAdvancedFilters);

  React.useEffect(() => {
    if (!visible) {
      setTagQuery('');
      setShowAllTags(false);
      setShowAdvancedFilters(hasAdvancedFilters);
    }
  }, [hasAdvancedFilters, visible]);

  const normalizedTagQuery = tagQuery.trim().toLowerCase();
  const filteredTags = React.useMemo(
    () =>
      availableTags.filter(tag =>
        normalizedTagQuery ? tag.toLowerCase().includes(normalizedTagQuery) : true,
      ),
    [availableTags, normalizedTagQuery],
  );
  const selectedTags = React.useMemo(
    () => filteredTags.filter(tag => timelineFilters.tags.includes(tag)),
    [filteredTags, timelineFilters.tags],
  );
  const unselectedTags = React.useMemo(
    () => filteredTags.filter(tag => !timelineFilters.tags.includes(tag)),
    [filteredTags, timelineFilters.tags],
  );
  const visibleUnselectedTags = React.useMemo(
    () => (showAllTags || normalizedTagQuery ? unselectedTags : unselectedTags.slice(0, 12)),
    [normalizedTagQuery, showAllTags, unselectedTags],
  );
  const hiddenTagCount = Math.max(0, unselectedTags.length - visibleUnselectedTags.length);

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={styles.filterSheetRoot}>
        <Pressable style={styles.filterSheetBackdrop} onPress={onClose} />
        <View style={styles.filterSheetCard}>
          <View style={styles.filterSheetHeader}>
            <View style={styles.filterSheetHandle} />
            <SectionHeader title={copy.homeRefineLabel} />
            <View style={styles.filterSheetHeaderActions}>
              {hasAnyFilters ? (
                <Button
                  title={copy.homeClearFilters}
                  variant="ghost"
                  size="sm"
                  onPress={() =>
                    updateTimelineFilters(current => ({
                      ...DEFAULT_HOME_TIMELINE_FILTERS,
                      searchQuery: current.searchQuery,
                      sortOrder: current.sortOrder,
                    }))
                  }
                />
              ) : null}
              <Button title={copy.homeHideFilters} variant="ghost" size="sm" onPress={onClose} />
            </View>
          </View>

          <ScrollView
            style={styles.filterSheetScroll}
            contentContainerStyle={styles.filterSheetBody}
            showsVerticalScrollIndicator={false}
          >
            <FilterGroup
              label={copy.homeArchiveFilterLabel}
              options={homeFilters}
              value={timelineFilters.archive === 'archived' ? 'all' : timelineFilters.archive}
              styles={styles}
              onSelect={value =>
                updateTimelineFilters(current => ({
                  ...current,
                  archive: value,
                }))
              }
            />

            <FilterGroup
              label={copy.homeMoodFilterLabel}
              options={moodFilters}
              value={timelineFilters.mood}
              styles={styles}
              onSelect={value =>
                updateTimelineFilters(current => ({
                  ...current,
                  mood: value,
                }))
              }
            />

            <FilterGroup
              label={practiceCopy.archiveSpecialFiltersLabel}
              options={specialFilters}
              value={timelineFilters.special}
              styles={styles}
              onSelect={value =>
                updateTimelineFilters(current => ({
                  ...current,
                  special: value,
                }))
              }
            />

            {availableTags.length > 0 ? (
              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupLabel}>{copy.homeTagFilterLabel}</Text>
                <FormField
                  placeholder={copy.homeTagSearchPlaceholder}
                  value={tagQuery}
                  onChangeText={setTagQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                  containerStyle={styles.searchFieldContainer}
                  inputStyle={styles.searchFieldInput}
                />
                {selectedTags.length > 0 ? (
                  <View style={styles.filterSelectionBlock}>
                    <Text style={styles.filterGroupMetaLabel}>{copy.homeTagSelectedLabel}</Text>
                    <View style={styles.filterRow}>
                      {selectedTags.map(tag => (
                        <Pressable
                          key={`selected-${tag}`}
                          style={[styles.filterButton, styles.filterButtonActive]}
                          onPress={() =>
                            updateTimelineFilters(current => ({
                              ...current,
                              tags: current.tags.filter(value => value !== tag),
                            }))
                          }
                        >
                          <Text
                            style={[styles.filterButtonLabel, styles.filterButtonLabelActive]}
                          >
                            {tag}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ) : null}
                <View style={styles.filterRow}>
                  {visibleUnselectedTags.map(tag => {
                    const active = timelineFilters.tags.includes(tag);

                    return (
                      <Pressable
                        key={tag}
                        style={[styles.filterButton, active ? styles.filterButtonActive : null]}
                        onPress={() =>
                          updateTimelineFilters(current => ({
                            ...current,
                            tags: current.tags.includes(tag)
                              ? current.tags.filter(value => value !== tag)
                              : [...current.tags, tag],
                          }))
                        }
                      >
                        <Text
                          style={[
                            styles.filterButtonLabel,
                            active ? styles.filterButtonLabelActive : null,
                          ]}
                        >
                          {tag}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {!selectedTags.length && !visibleUnselectedTags.length ? (
                  <Text style={styles.filterEmptyText}>{copy.homeTagsEmpty}</Text>
                ) : null}
                {hiddenTagCount > 0 && !normalizedTagQuery ? (
                  <Pressable
                    style={styles.filterMoreButton}
                    onPress={() => setShowAllTags(true)}
                  >
                    <Text style={styles.filterMoreButtonText}>
                      {`${copy.homeTagsShowMore} (${hiddenTagCount})`}
                    </Text>
                  </Pressable>
                ) : null}
                {showAllTags && unselectedTags.length > 12 && !normalizedTagQuery ? (
                  <Pressable
                    style={styles.filterMoreButton}
                    onPress={() => setShowAllTags(false)}
                  >
                    <Text style={styles.filterMoreButtonText}>{copy.homeTagsShowLess}</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.searchDetailsToggleButton,
                pressed ? styles.spotlightTilePressed : null,
              ]}
              onPress={() => setShowAdvancedFilters(current => !current)}
            >
              <Text style={styles.inlineActionButtonText}>
                {showAdvancedFilters ? copy.homeLessFilters : copy.homeMoreFilters}
              </Text>
            </Pressable>

            {showAdvancedFilters ? (
              <>
                <FilterGroup
                  label={copy.homeTypeFilterLabel}
                  options={typeFilters}
                  value={timelineFilters.entryType}
                  styles={styles}
                  onSelect={value =>
                    updateTimelineFilters(current => ({
                      ...current,
                      entryType: value,
                    }))
                  }
                />

                <FilterGroup
                  label={copy.homeTranscriptFilterLabel}
                  options={transcriptFilters}
                  value={timelineFilters.transcript}
                  styles={styles}
                  onSelect={value =>
                    updateTimelineFilters(current => ({
                      ...current,
                      transcript: value,
                    }))
                  }
                />

                <FilterGroup
                  label={copy.homeDateRangeFilterLabel}
                  options={dateRangeFilters}
                  value={timelineFilters.dateRange}
                  styles={styles}
                  onSelect={value =>
                    updateTimelineFilters(current => ({
                      ...current,
                      dateRange: value,
                    }))
                  }
                />
              </>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
