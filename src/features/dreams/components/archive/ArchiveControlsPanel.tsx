import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { Card } from '../../../../components/ui/Card';
import { FormField } from '../../../../components/ui/FormField';
import { Text } from '../../../../components/ui/Text';
import { type DreamCopy } from '../../../../constants/copy/dreams';
import { Theme } from '../../../../theme/theme';
import {
  type ArchiveFilter,
  type ArchiveRevisitCue,
  type ArchiveViewMode,
} from '../../model/archiveBrowser';
import { createArchiveScreenStyles } from '../../screens/ArchiveScreen.styles';

const archiveControlsLayoutTransition = LinearTransition.springify()
  .damping(18)
  .stiffness(180);

type ArchiveControlsPanelProps = {
  copy: DreamCopy;
  styles: ReturnType<typeof createArchiveScreenStyles>;
  searchQuery: string;
  onChangeSearch: (value: string) => void;
  isSearchPending: boolean;
  archiveFilters: ReadonlyArray<{ key: ArchiveFilter; label: string }>;
  filter: ArchiveFilter;
  onSelectFilter: (filter: ArchiveFilter) => void;
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
  searchQuery,
  onChangeSearch,
  isSearchPending,
  archiveFilters,
  filter,
  onSelectFilter,
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
      <Animated.View entering={FadeInDown.delay(60).duration(220)} layout={archiveControlsLayoutTransition}>
        <Card style={styles.controlsCard}>
          <View style={styles.searchRow}>
            <View style={styles.searchIconWrap}>
              <Ionicons name="search-outline" size={16} color={theme.colors.textDim} />
            </View>
            <FormField
              placeholder={copy.archiveSearchPlaceholder}
              value={searchQuery}
              onChangeText={onChangeSearch}
              autoCapitalize="none"
              autoCorrect={false}
              containerStyle={styles.searchFieldContainer}
              inputStyle={styles.searchInput}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersRail}
          >
            {archiveFilters.map(option => {
              const active = filter === option.key;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => onSelectFilter(option.key)}
                  style={[styles.filterChip, active ? styles.filterChipActive : null]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      active ? styles.filterChipTextActive : null,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {hasHardReset || isSearchPending ? (
            <View style={styles.controlsFooterRow}>
              {hasHardReset ? (
                <Pressable style={styles.controlsActionChip} onPress={onReset}>
                  <Text style={styles.controlsActionChipText}>{copy.archiveResetView}</Text>
                </Pressable>
              ) : null}

              {isSearchPending ? (
                <View style={styles.controlsMetaChip}>
                  <Text style={styles.controlsMetaChipText}>{copy.timelineLoadingTitle}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
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
            style={({ pressed }) => [
              styles.revisitInlineCard,
              pressed ? styles.revisitCardPressed : null,
            ]}
            onPress={() => onOpenRevisitDream(revisitCue.dreamId)}
          >
            <View style={styles.revisitInlineMain}>
              <Text style={styles.revisitInlineLabel}>{copy.archiveRevisitLabel}</Text>
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
                <Text style={styles.revisitBadgeText}>{revisitCue.contextLabel}</Text>
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
