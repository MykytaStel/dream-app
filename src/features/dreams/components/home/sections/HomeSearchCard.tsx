import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../../../../../components/ui/Text';
import { Card } from '../../../../../components/ui/Card';
import { FormField } from '../../../../../components/ui/FormField';
import type { DreamCopy } from '../../../../../constants/copy/dreams';
import type { createHomeScreenStyles } from '../../../screens/HomeScreen.styles';
import type { HomeTimelineFilters } from '../../../model/homeTimeline';
import { ScrollView } from 'react-native';
import { HomeSearchPresetChip } from '../HomeSearchPresetChip';
import type { HomeSearchPreset } from '../../../services/homeSearchPresetService';

/**
 * The search box and the searches worth keeping.
 *
 * Out of `HomeListHeader` with the three sections above it. The preset
 * ordering — active one first, then newest — is derived here, because it is a
 * function of the presets this card is already handed.
 */

type HomeSearchCardProps = {
  copy: DreamCopy;
  styles: ReturnType<typeof createHomeScreenStyles>;
  timelineFilters: HomeTimelineFilters;
  isSearchPending: boolean;
  hasSearchQuery: boolean;
  isFilterMutationPending: boolean;
  savedSearchPresets: HomeSearchPreset[];
  activeSearchPresetId: string | null;
  canSaveSearchPreset: boolean;
  onClearSearch: () => void;
  onSaveSearchPreset: () => void;
  onApplySearchPreset: (preset: HomeSearchPreset) => void;
  onDeleteSearchPreset: (preset: HomeSearchPreset) => void;
  updateTimelineFilters: (
    updater: (current: HomeTimelineFilters) => HomeTimelineFilters,
  ) => void;
};

export function HomeSearchCard({
  copy,
  styles,
  timelineFilters,
  isSearchPending,
  hasSearchQuery,
  isFilterMutationPending,
  savedSearchPresets,
  activeSearchPresetId,
  canSaveSearchPreset,
  onClearSearch,
  onSaveSearchPreset,
  onApplySearchPreset,
  onDeleteSearchPreset,
  updateTimelineFilters,
}: HomeSearchCardProps) {
  /** Active preset first, then newest. */
  const orderedSearchPresets = React.useMemo(() => {
    if (!activeSearchPresetId) {
      return savedSearchPresets;
    }

    return [...savedSearchPresets].sort((a, b) => {
      if (a.id === activeSearchPresetId) {
        return -1;
      }

      if (b.id === activeSearchPresetId) {
        return 1;
      }

      return b.createdAt - a.createdAt;
    });
  }, [activeSearchPresetId, savedSearchPresets]);

  const hasSavedSearchSection = Boolean(
    savedSearchPresets.length || canSaveSearchPreset,
  );

  return (
    <Card style={styles.searchCard}>
      <View style={styles.searchCardHeaderRow}>
        <Text style={styles.searchPresetLabel}>{copy.homeSearchLabel}</Text>
        {hasSearchQuery ? (
          <Pressable
            accessibilityRole="button"
            style={styles.inlineActionButton}
            onPress={onClearSearch}
          >
            <Text style={styles.inlineActionButtonText}>
              {copy.homeClearSearch}
            </Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.searchBarRow}>
        <FormField
          placeholder={copy.homeSearchPlaceholder}
          value={timelineFilters.searchQuery}
          onChangeText={value =>
            updateTimelineFilters(current => ({
              ...current,
              searchQuery: value,
            }))
          }
          autoCapitalize="none"
          autoCorrect={false}
          helperText={
            isSearchPending || isFilterMutationPending
              ? copy.timelineLoadingDescription
              : undefined
          }
          containerStyle={styles.searchFieldContainer}
          inputStyle={styles.searchFieldInput}
        />
      </View>

      {hasSavedSearchSection ? (
        <>
          <View style={styles.searchPresetHeaderRow}>
            <Text style={styles.searchPresetLabel}>
              {copy.homeSavedSearchesLabel}
            </Text>
            {canSaveSearchPreset ? (
              <Pressable
                accessibilityRole="button"
                style={styles.searchPresetSaveButton}
                onPress={onSaveSearchPreset}
              >
                <Text style={styles.searchPresetSaveButtonText}>
                  {copy.homeSaveSearchPreset}
                </Text>
              </Pressable>
            ) : null}
          </View>
          {orderedSearchPresets.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.searchPresetRow}
            >
              {orderedSearchPresets.map(preset => (
                <HomeSearchPresetChip
                  key={preset.id}
                  label={preset.label}
                  active={activeSearchPresetId === preset.id}
                  removeLabel={copy.homeSearchPresetRemove}
                  onPress={() => onApplySearchPreset(preset)}
                  onRemove={() => onDeleteSearchPreset(preset)}
                />
              ))}
            </ScrollView>
          ) : null}
        </>
      ) : null}
    </Card>
  );
}
