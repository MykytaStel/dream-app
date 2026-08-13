import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, {
  FadeInDown,
  LinearTransition,
} from 'react-native-reanimated';
import { Card } from '../../../../components/ui/Card';
import { FormField } from '../../../../components/ui/FormField';
import { Text } from '../../../../components/ui/Text';
import { type DreamCopy } from '../../../../constants/copy/dreams';
import { Theme } from '../../../../theme/theme';
import { type ArchiveSurfaceMode } from '../../model/archiveSurface';
import { createArchiveScreenStyles } from '../../screens/ArchiveScreen.styles';
import { ArchiveSegmentedControl } from './ArchiveSegmentedControl';

const archiveControlsLayoutTransition = LinearTransition.springify()
  .damping(18)
  .stiffness(180);

const localStyles = StyleSheet.create({
  filterTrigger: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});

type ArchiveControlsPanelProps = {
  copy: DreamCopy;
  styles: ReturnType<typeof createArchiveScreenStyles>;
  searchPlaceholder: string;
  searchQuery: string;
  onChangeSearch: (value: string) => void;
  isSearchPending: boolean;
  surfaceModes: ReadonlyArray<{
    key: ArchiveSurfaceMode;
    label: string;
  }>;
  surfaceMode: ArchiveSurfaceMode;
  onChangeSurfaceMode: (mode: ArchiveSurfaceMode) => void;
  filtersLabel: string;
  activeFilterCount: number;
  onOpenFilters: () => void;
  visibleEntriesLabel: string;
};

export function ArchiveControlsPanel({
  copy,
  styles,
  searchPlaceholder,
  searchQuery,
  onChangeSearch,
  isSearchPending,
  surfaceModes,
  surfaceMode,
  onChangeSurfaceMode,
  filtersLabel,
  activeFilterCount,
  onOpenFilters,
  visibleEntriesLabel,
}: ArchiveControlsPanelProps) {
  const theme = useTheme<Theme>();

  return (
    <>
      <Animated.View
        entering={FadeInDown.delay(60).duration(220)}
        layout={archiveControlsLayoutTransition}
      >
        <Card style={styles.controlsCard}>
          <View style={styles.searchRow}>
            <View style={styles.searchIconWrap}>
              <Ionicons
                name="search-outline"
                size={16}
                color={theme.colors.textDim}
              />
            </View>
            <FormField
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChangeText={onChangeSearch}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
              containerStyle={styles.searchFieldContainer}
              inputStyle={styles.searchInput}
            />
          </View>

          <View style={styles.browseModeRow}>
            <Text style={styles.browseModeLabel}>
              {copy.archiveBrowseLabel}
            </Text>
            <ArchiveSegmentedControl
              options={surfaceModes}
              value={surfaceMode}
              styles={styles}
              onChange={onChangeSurfaceMode}
            />
          </View>

          <View style={styles.controlsFooterRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={filtersLabel}
              style={[styles.controlsActionChip, localStyles.filterTrigger]}
              onPress={onOpenFilters}
            >
              <Ionicons
                name="options-outline"
                size={15}
                color={theme.colors.text}
              />
              <Text style={styles.controlsActionChipText}>{filtersLabel}</Text>
              {activeFilterCount > 0 ? (
                <View style={styles.controlsMetaChip}>
                  <Text style={styles.controlsMetaChipText}>
                    {activeFilterCount}
                  </Text>
                </View>
              ) : null}
            </Pressable>

            {isSearchPending ? (
              <View style={styles.controlsMetaChip}>
                <Text style={styles.controlsMetaChipText}>
                  {copy.timelineLoadingTitle}
                </Text>
              </View>
            ) : null}
          </View>
        </Card>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(72).duration(220)}
        layout={archiveControlsLayoutTransition}
        style={styles.resultsToolbar}
      >
        <View style={styles.resultsToolbarMeta}>
          <Text style={styles.resultsToolbarText}>{visibleEntriesLabel}</Text>
        </View>
      </Animated.View>
    </>
  );
}
