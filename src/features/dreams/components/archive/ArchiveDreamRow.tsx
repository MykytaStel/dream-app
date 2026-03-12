import React from 'react';
import { Pressable, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@shopify/restyle';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card } from '../../../../components/ui/Card';
import { Text } from '../../../../components/ui/Text';
import { type DreamCopy } from '../../../../constants/copy/dreams';
import {
  ROOT_ROUTE_NAMES,
  type RootStackParamList,
} from '../../../../app/navigation/routes';
import { Theme } from '../../../../theme/theme';
import { type AppLocale } from '../../../../i18n/types';
import { Dream, Mood } from '../../model/dream';
import { getDreamDate } from '../../model/dreamAnalytics';
import {
  formatArchivePreview,
  getArchiveMatchReasonLabels,
  getArchiveMoodLabel,
  getArchivePills,
  type ArchiveViewMode,
} from '../../model/archiveBrowser';
import { createArchiveScreenStyles } from '../../screens/ArchiveScreen.styles';

type ArchiveDreamRowProps = {
  dream: Dream;
  copy: DreamCopy;
  searchQuery: string;
  locale: AppLocale;
  moodLabels: Record<Mood, string>;
  navigation: NativeStackNavigationProp<RootStackParamList>;
  styles: ReturnType<typeof createArchiveScreenStyles>;
  viewMode: ArchiveViewMode;
};

export const ArchiveDreamRow = React.memo(function ArchiveDreamRow({
  dream,
  copy,
  searchQuery,
  locale,
  moodLabels,
  navigation,
  styles,
  viewMode,
}: ArchiveDreamRowProps) {
  const theme = useTheme<Theme>();
  const date = getDreamDate(dream);
  const localeKey = locale === 'uk' ? 'uk-UA' : 'en-US';
  const mood = getArchiveMoodLabel(dream.mood, moodLabels);
  const isCompact = viewMode === 'compact';
  const pills = getArchivePills(dream, copy, mood).slice(0, isCompact ? 2 : 3);
  const matchReasons = React.useMemo(
    () => getArchiveMatchReasonLabels(dream, searchQuery, copy).slice(0, isCompact ? 1 : 2),
    [copy, dream, isCompact, searchQuery],
  );
  const rowDateLabel = `${date.toLocaleDateString(localeKey, {
    month: 'short',
    day: 'numeric',
  })} · ${date.toLocaleDateString(localeKey, {
    weekday: 'short',
  })}`;
  const compactMonthLabel = date.toLocaleDateString(localeKey, { month: 'short' });
  const compactDayLabel = String(date.getDate());
  const compactMeta = [...matchReasons.slice(0, 1), ...pills.slice(0, 2)].join(' • ');
  const preview = formatArchivePreview(dream, copy);

  if (isCompact) {
    return (
      <Pressable
        onPress={() => navigation.navigate(ROOT_ROUTE_NAMES.DreamDetail, { dreamId: dream.id })}
        style={({ pressed }) => [
          styles.listRowPressable,
          pressed ? styles.listRowPressed : null,
        ]}
      >
        <Card style={[styles.listRowCard, styles.listRowCardCompact]}>
          <View style={styles.compactDateBlock}>
            <Text style={styles.compactDayLabel}>{compactDayLabel}</Text>
            <Text style={styles.compactMonthLabel}>{compactMonthLabel}</Text>
          </View>

          <View style={styles.compactContent}>
            <View style={styles.compactTitleRow}>
              <Text style={styles.rowTitleCompact} numberOfLines={1}>
                {dream.title || copy.untitled}
              </Text>
              <Ionicons name="chevron-forward" size={15} color={theme.colors.textDim} />
            </View>

            <Text style={styles.compactDateMeta}>{rowDateLabel}</Text>

            <Text style={styles.rowPreviewCompact} numberOfLines={1}>
              {preview}
            </Text>

            {compactMeta ? (
              <Text style={styles.compactStatusText} numberOfLines={1}>
                {compactMeta}
              </Text>
            ) : null}
          </View>
        </Card>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => navigation.navigate(ROOT_ROUTE_NAMES.DreamDetail, { dreamId: dream.id })}
      style={({ pressed }) => [
        styles.listRowPressable,
        pressed ? styles.listRowPressed : null,
      ]}
    >
      <Card style={styles.listRowCard}>
        <View style={styles.comfortableTop}>
          <View style={styles.comfortableDateWrap}>
            <View style={styles.rowDateChip}>
              <Text style={styles.rowDateChipText}>{rowDateLabel}</Text>
            </View>
            {matchReasons[0] ? (
              <View style={styles.matchReasonPill}>
                <Text style={styles.matchReasonPillText}>{matchReasons[0]}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.rowChevron}>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textDim} />
          </View>
        </View>

        <View style={styles.rowCopy}>
          <Text style={styles.rowTitle} numberOfLines={2}>
            {dream.title || copy.untitled}
          </Text>
          <View style={styles.rowPreviewPanel}>
            <Text style={styles.rowPreview} numberOfLines={3}>
              {preview}
            </Text>
          </View>
        </View>

        {pills.length ? (
          <View style={styles.pillsRow}>
            {pills.map(label => (
              <View key={`${dream.id}-${label}`} style={styles.pill}>
                <Text style={styles.pillText}>{label}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
});
