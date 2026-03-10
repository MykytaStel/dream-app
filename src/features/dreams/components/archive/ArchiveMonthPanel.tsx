import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from 'react-native-reanimated';
import { Card } from '../../../../components/ui/Card';
import { Text } from '../../../../components/ui/Text';
import { type DreamCopy } from '../../../../constants/copy/dreams';
import { Theme } from '../../../../theme/theme';
import {
  formatSelectedDate,
  getMonthChipLabel,
  getMonthLabel,
  type ArchiveCalendarCell,
} from '../../model/archiveBrowser';
import { createArchiveScreenStyles } from '../../screens/ArchiveScreen.styles';

const archiveMonthLayoutTransition = LinearTransition.springify()
  .damping(18)
  .stiffness(180);

type ArchiveMonthPanelProps = {
  copy: DreamCopy;
  localeKey: string;
  styles: ReturnType<typeof createArchiveScreenStyles>;
  selectedMonthKey: string;
  monthMetaText: string;
  canGoOlder: boolean;
  canGoNewer: boolean;
  onMoveMonth: (direction: 'older' | 'newer') => void;
  quickJumpMonthKeys: string[];
  selectedDate: string | null;
  onSelectMonth: (monthKey: string) => void;
  onClearDate: () => void;
  onToggleCalendar: () => void;
  isCalendarExpanded: boolean;
  weekdayLabels: string[];
  calendarRows: ArchiveCalendarCell[][];
  onSelectCalendarDate: (date: string | null) => void;
};

export function ArchiveMonthPanel({
  copy,
  localeKey,
  styles,
  selectedMonthKey,
  monthMetaText,
  canGoOlder,
  canGoNewer,
  onMoveMonth,
  quickJumpMonthKeys,
  selectedDate,
  onSelectMonth,
  onClearDate,
  onToggleCalendar,
  isCalendarExpanded,
  weekdayLabels,
  calendarRows,
  onSelectCalendarDate,
}: ArchiveMonthPanelProps) {
  const theme = useTheme<Theme>();

  return (
    <Animated.View entering={FadeInDown.delay(40).duration(260)} layout={archiveMonthLayoutTransition}>
      <Card style={styles.toolbarCard}>
        <View pointerEvents="none" style={styles.toolbarGlowLarge} />
        <View pointerEvents="none" style={styles.toolbarGlowSmall} />
        <View pointerEvents="none" style={styles.toolbarVisualShell}>
          <View style={[styles.toolbarFacet, styles.toolbarFacetPrimary]} />
          <View style={[styles.toolbarFacet, styles.toolbarFacetAccent]} />
          <View style={[styles.toolbarFacet, styles.toolbarFacetAlt]} />
        </View>

        <View style={styles.monthToolbar}>
          <Pressable
            style={[styles.monthPagerButton, !canGoOlder ? styles.monthPagerButtonDisabled : null]}
            disabled={!canGoOlder}
            onPress={() => onMoveMonth('older')}
            accessibilityRole="button"
            accessibilityLabel={copy.archivePreviousMonth}
          >
            <Ionicons
              name="chevron-back"
              size={16}
              color={canGoOlder ? theme.colors.text : theme.colors.textDim}
            />
          </Pressable>
          <Animated.View
            key={`archive-month-${selectedMonthKey}`}
            entering={FadeInDown.duration(180)}
            layout={archiveMonthLayoutTransition}
            style={styles.monthLabelBlock}
          >
            <Text style={styles.monthLabel}>{getMonthLabel(selectedMonthKey, localeKey)}</Text>
            <Text style={styles.monthMetaText}>{monthMetaText}</Text>
          </Animated.View>
          <Pressable
            style={[styles.monthPagerButton, !canGoNewer ? styles.monthPagerButtonDisabled : null]}
            disabled={!canGoNewer}
            onPress={() => onMoveMonth('newer')}
            accessibilityRole="button"
            accessibilityLabel={copy.archiveNextMonth}
          >
            <Ionicons
              name="chevron-forward"
              size={16}
              color={canGoNewer ? theme.colors.text : theme.colors.textDim}
            />
          </Pressable>
        </View>

        {quickJumpMonthKeys.length > 1 ? (
          <Animated.View
            key={`archive-jumps-${selectedMonthKey}`}
            entering={FadeInDown.delay(20).duration(180)}
            layout={archiveMonthLayoutTransition}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickJumpRow}
            >
              {quickJumpMonthKeys.map(monthKey => {
                const active = monthKey === selectedMonthKey;

                return (
                  <Pressable
                    key={monthKey}
                    style={[styles.quickJumpChip, active ? styles.quickJumpChipActive : null]}
                    onPress={() => onSelectMonth(monthKey)}
                  >
                    <Text
                      style={[
                        styles.quickJumpChipText,
                        active ? styles.quickJumpChipTextActive : null,
                      ]}
                    >
                      {getMonthChipLabel(monthKey, selectedMonthKey, localeKey)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>
        ) : null}

        <View style={styles.selectedDateRow}>
          {selectedDate ? (
            <View style={styles.selectedDateChip}>
              <Text style={styles.selectedDateText}>
                {formatSelectedDate(selectedDate, localeKey)}
              </Text>
            </View>
          ) : null}

          {selectedDate ? (
            <Pressable style={styles.clearDateChip} onPress={onClearDate}>
              <Text style={styles.clearDateChipText}>{copy.archiveAllDates}</Text>
            </Pressable>
          ) : null}

          <Pressable style={styles.controlsActionChip} onPress={onToggleCalendar}>
            <Text style={styles.controlsActionChipText}>
              {isCalendarExpanded ? copy.archiveCalendarHideGrid : copy.archiveCalendarShowGrid}
            </Text>
          </Pressable>
        </View>

        {isCalendarExpanded ? (
          <Animated.View
            entering={FadeInDown.duration(220)}
            exiting={FadeOutUp.duration(180)}
            layout={archiveMonthLayoutTransition}
            style={styles.calendarDaysWrap}
          >
            <View style={styles.weekdayRow}>
              {weekdayLabels.map(label => (
                <Text key={label} style={styles.weekdayLabel}>
                  {label}
                </Text>
              ))}
            </View>

            <View style={styles.calendarRows}>
              {calendarRows.map((row, rowIndex) => (
                <View key={`calendar-row-${rowIndex}`} style={styles.calendarWeekRow}>
                  {row.map(cell => {
                    const isSelected = cell.date === selectedDate;
                    const isInteractive = Boolean(cell.date && cell.count > 0);

                    return (
                      <Pressable
                        key={cell.key}
                        style={[
                          styles.calendarCell,
                          !cell.date ? styles.calendarCellPlaceholder : null,
                          isSelected ? styles.calendarCellSelected : null,
                          isInteractive ? styles.calendarCellActive : null,
                        ]}
                        disabled={!isInteractive}
                        onPress={() => onSelectCalendarDate(cell.date)}
                      >
                        {cell.dayNumber ? (
                          <>
                            <Text
                              style={[
                                styles.calendarCellDay,
                                isSelected ? styles.calendarCellDaySelected : null,
                                cell.count === 0 ? styles.calendarCellDayMuted : null,
                              ]}
                            >
                              {cell.dayNumber}
                            </Text>
                            {cell.count > 0 ? (
                              <Text
                                style={[
                                  styles.calendarCellCount,
                                  isSelected ? styles.calendarCellCountSelected : null,
                                ]}
                              >
                                {cell.count}
                              </Text>
                            ) : null}
                          </>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </Animated.View>
        ) : null}
      </Card>
    </Animated.View>
  );
}
