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
import {
  type ArchiveRevisitCue,
  type ArchiveViewMode,
} from '../../model/archiveBrowser';
import { type ArchiveSurfaceMode } from '../../model/archiveSurface';
import { createArchiveScreenStyles } from '../../screens/ArchiveScreen.styles';

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
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
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
  hasHardReset: boolean;
  onReset: () => void;
  visibleEntriesLabel: string;
  revisitCue: ArchiveRevisitCue | null;
  browseModes: ReadonlyArray<{ key: ArchiveViewMode; label: string }>;
  viewMode: ArchiveViewMode;
  onChangeViewMode: (mode: ArchiveViewMode) => void;
  onOpenRevisitDream: (dreamId: string) => void;
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
  hasHardReset,
  onReset,
  visibleEntriesLabel,
  revisitCue,
  browseModes,
  viewMode,
  onChangeViewMode,
  onOpenRevisitDream,
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
              containerStyle={styles.searchFieldContainer}
              inputStyle={styles.searchInput}
            />
          </View>

          <View style={styles.browseModeRow}>
            <Text style={styles.browseModeLabel}>
              {copy.archiveBrowseLabel}
            </Text>
            <View style={styles.browseModeChips}>
              {surfaceModes.map(option => {
                const active = surfaceMode === option.key;

                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    key={option.key}
                    style={[
                      styles.modeChip,
                      active ? styles.modeChipActive : null,
                    ]}
                    onPress={() => onChangeSurfaceMode(option.key)}
                  >
                    <Text
                      style={[
                        styles.modeChipText,
                        active ? styles.modeChipTextActive : null,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
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

            <View style={localStyles.footerActions}>
              {hasHardReset ? (
                <Pressable
                  accessibilityRole="button"
                  style={styles.controlsActionChip}
                  onPress={onReset}
                >
                  <Text style={styles.controlsActionChipText}>
                    {copy.archiveResetView}
                  </Text>
                </Pressable>
              ) : null}

              {isSearchPending ? (
                <View style={styles.controlsMetaChip}>
                  <Text style={styles.controlsMetaChipText}>
                    {copy.timelineLoadingTitle}
                  </Text>
                </View>
              ) : null}
            </View>
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
        <View style={styles.browseModeChips}>
          {browseModes.map(option => {
            const active = viewMode === option.key;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                key={option.key}
                style={[styles.modeChip, active ? styles.modeChipActive : null]}
                onPress={() => onChangeViewMode(option.key)}
              >
                <Text
                  style={[
                    styles.modeChipText,
                    active ? styles.modeChipTextActive : null,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

      {revisitCue ? (
        <Animated.View
          entering={FadeInDown.delay(86).duration(220)}
          layout={archiveControlsLayoutTransition}
        >
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.revisitInlineCard,
              pressed ? styles.revisitCardPressed : null,
            ]}
            onPress={() => onOpenRevisitDream(revisitCue.dreamId)}
          >
            <View style={styles.revisitInlineMain}>
              <Text style={styles.revisitInlineLabel}>
                {copy.archiveRevisitLabel}
              </Text>
              <Text style={styles.revisitInlineTitle} numberOfLines={1}>
                {revisitCue.title}
              </Text>
            </View>

            <View style={styles.revisitInlineMeta}>
              <View style={styles.revisitBadge}>
                <Ionicons
                  name={revisitCue.icon}
                  size={12}
                  color={theme.colors.accent}
                />
                <Text style={styles.revisitBadgeText}>
                  {revisitCue.contextLabel}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={theme.colors.textDim}
              />
            </View>
          </Pressable>
        </Animated.View>
      ) : null}
    </>
  );
}
