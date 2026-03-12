import React from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@shopify/restyle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../../components/ui/Card';
import { ListItemSeparator } from '../../../components/ui/ListItemSeparator';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { ScreenStateCard } from '../../dreams/components/ScreenStateCard';
import { TagChip } from '../../../components/ui/TagChip';
import { Text } from '../../../components/ui/Text';
import {
  ROOT_ROUTE_NAMES,
  type RootStackParamList,
  type PatternDetailKind,
} from '../../../app/navigation/routes';
import { getDreamCopy, getDreamMoodLabels, type DreamCopy } from '../../../constants/copy/dreams';
import { getStatsCopy } from '../../../constants/copy/stats';
import { useI18n } from '../../../i18n/I18nProvider';
import { Theme } from '../../../theme/theme';
import { Dream, Mood } from '../../dreams/model/dream';
import { getDreamDate } from '../../dreams/model/dreamAnalytics';
import {
  getDreamsMeta,
  listDreams,
} from '../../dreams/repository/dreamsRepository';
import {
  getPatternDreamMatches,
  type PatternMatchSource,
} from '../model/patternMatches';
import { createPatternDetailScreenStyles } from './PatternDetailScreen.styles';
import { getTabBarReservedSpace } from '../../../app/navigation/tabBarLayout';

function formatPreview(dream: Dream, copy: DreamCopy) {
  const text = dream.text?.trim();
  if (text) {
    return text.length > 120 ? `${text.slice(0, 117)}...` : text;
  }

  const transcript = dream.transcript?.trim();
  if (transcript) {
    const prefix =
      dream.transcriptSource === 'edited'
        ? `${copy.editedTranscriptPreviewPrefix}: `
        : `${copy.transcriptPreviewPrefix}: `;
    const visible = transcript.length > 96 ? `${transcript.slice(0, 93)}...` : transcript;
    return `${prefix}${visible}`;
  }

  if (dream.audioUri) {
    return copy.audioOnlyPreview;
  }

  return copy.noDetailsPreview;
}

function formatDateParts(dream: Dream) {
  const date = getDreamDate(dream);
  return {
    weekday: date.toLocaleDateString([], { weekday: 'short' }),
    day: date.getDate(),
    month: date.toLocaleDateString([], { month: 'short' }),
  };
}

function moodLabel(mood: Dream['mood'] | undefined, moodLabels: Record<Mood, string>) {
  return mood ? moodLabels[mood] : undefined;
}

function getPatternKindLabel(kind: PatternDetailKind, copy: ReturnType<typeof getStatsCopy>) {
  switch (kind) {
    case 'word':
      return copy.patternDetailWordLabel;
    case 'theme':
      return copy.patternDetailThemeLabel;
    case 'symbol':
      return copy.patternDetailSymbolLabel;
  }
}

function getPatternKindSubtitle(kind: PatternDetailKind, copy: ReturnType<typeof getStatsCopy>) {
  switch (kind) {
    case 'word':
      return copy.patternDetailWordDescription;
    case 'theme':
      return copy.patternDetailThemeDescription;
    case 'symbol':
      return copy.patternDetailSymbolDescription;
  }
}

function getSourceLabel(source: PatternMatchSource, copy: ReturnType<typeof getStatsCopy>) {
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

function formatRowMeta(dream: Dream, moodText?: string) {
  const dateLabel = dream.sleepDate ?? new Date(dream.createdAt).toLocaleDateString();
  return moodText ? `${moodText} · ${dateLabel}` : dateLabel;
}

const PatternMatchRow = React.memo(function PatternMatchRow({
  match,
  dreamCopy,
  statsCopy,
  moodLabels,
  navigation,
  styles,
}: {
  match: ReturnType<typeof getPatternDreamMatches>[number];
  dreamCopy: DreamCopy;
  statsCopy: ReturnType<typeof getStatsCopy>;
  moodLabels: Record<Mood, string>;
  navigation: NativeStackNavigationProp<RootStackParamList>;
  styles: ReturnType<typeof createPatternDetailScreenStyles>;
}) {
  const dateParts = formatDateParts(match.dream);
  const mood = moodLabel(match.dream.mood, moodLabels);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.rowPressable,
        pressed ? styles.rowPressablePressed : null,
      ]}
      onPress={() =>
        navigation.navigate(ROOT_ROUTE_NAMES.DreamDetail, {
          dreamId: match.dream.id,
        })}
    >
      <Card style={styles.rowCard}>
        <View style={styles.rowHeader}>
          <View style={styles.dateBadge}>
            <Text style={styles.weekday}>{dateParts.weekday}</Text>
            <Text style={styles.dayNumber}>{dateParts.day}</Text>
            <Text style={styles.month}>{dateParts.month}</Text>
          </View>

          <View style={styles.rowCopy}>
            <Text style={styles.rowTitle}>
              {match.dream.title?.trim() || dreamCopy.untitled}
            </Text>
            <Text style={styles.rowMeta}>
              {formatRowMeta(match.dream, mood)}
            </Text>
          </View>
        </View>

        <View style={styles.previewWrap}>
          <View style={styles.previewAccent} />
          <Text style={styles.preview}>{formatPreview(match.dream, dreamCopy)}</Text>
        </View>

        <View style={styles.sourcesRow}>
          <Text style={styles.sourceLabel}>{statsCopy.patternDetailMatchedIn}</Text>
          {match.sources.map(source => (
            <TagChip
              key={`${match.dream.id}-${source}`}
              label={getSourceLabel(source, statsCopy)}
            />
          ))}
        </View>
      </Card>
    </Pressable>
  );
});

export default function PatternDetailScreen() {
  const t = useTheme<Theme>();
  const insets = useSafeAreaInsets();
  const { locale } = useI18n();
  const dreamCopy = React.useMemo(() => getDreamCopy(locale), [locale]);
  const statsCopy = React.useMemo(() => getStatsCopy(locale), [locale]);
  const moodLabels = React.useMemo(() => getDreamMoodLabels(locale), [locale]);
  const styles = createPatternDetailScreenStyles(t);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route =
    useRoute<RouteProp<RootStackParamList, typeof ROOT_ROUTE_NAMES.PatternDetail>>();
  const { signal, kind } = route.params;
  const [dreams, setDreams] = React.useState<Dream[]>([]);
  const [loading, setLoading] = React.useState(() => getDreamsMeta().totalCount > 0);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      setLoadError(null);
      setLoading(getDreamsMeta().totalCount > 0);

      const runHydration = () => {
        try {
          const nextDreams = listDreams();
          React.startTransition(() => {
            if (cancelled) {
              return;
            }
            setDreams(nextDreams);
            setLoading(false);
          });
        } catch (error) {
          if (cancelled) {
            return;
          }
          setLoading(false);
          setLoadError(String(error));
        }
      };

      const scheduler = globalThis as typeof globalThis & {
        requestIdleCallback?: (callback: () => void) => number;
        cancelIdleCallback?: (handle: number) => void;
      };

      if (typeof scheduler.requestIdleCallback === 'function') {
        const idleHandle = scheduler.requestIdleCallback(runHydration);
        return () => {
          cancelled = true;
          scheduler.cancelIdleCallback?.(idleHandle);
        };
      }

      const timeoutId = setTimeout(runHydration, 0);
      return () => {
        cancelled = true;
        clearTimeout(timeoutId);
      };
    }, []),
  );

  const matches = React.useMemo(
    () => getPatternDreamMatches(dreams, signal, kind),
    [dreams, kind, signal],
  );

  const listHeader = (
    <View style={styles.listHeader}>
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backLabel}>{dreamCopy.detailBack}</Text>
      </Pressable>

      <Card style={styles.heroCard}>
        <View pointerEvents="none" style={styles.heroGlow} />
        <Text style={styles.heroEyebrow}>{statsCopy.patternDetailEyebrow}</Text>
        <Text style={styles.heroTitle}>{signal}</Text>
        <Text style={styles.heroSubtitle}>{getPatternKindSubtitle(kind, statsCopy)}</Text>
        <View style={styles.metaRow}>
          <View style={[styles.metaPill, styles.metaPillAccent]}>
            <Text style={styles.metaText}>{getPatternKindLabel(kind, statsCopy)}</Text>
          </View>
          <View style={styles.metaPill}>
            <Text style={styles.metaText}>
              {matches.length} {matches.length === 1
                ? statsCopy.patternDetailMatchesSingle
                : statsCopy.patternDetailMatchesPlural}
            </Text>
          </View>
        </View>
      </Card>

      {!matches.length ? (
        <View style={styles.emptyWrap}>
          {loading ? (
            <ScreenStateCard
              variant="loading"
              title={dreamCopy.timelineLoadingTitle}
              subtitle={dreamCopy.timelineLoadingDescription}
            />
          ) : loadError ? (
            <ScreenStateCard
              variant="error"
              title={dreamCopy.timelineErrorTitle}
              subtitle={dreamCopy.timelineErrorDescription}
            />
          ) : (
            <ScreenStateCard
              variant="empty"
              title={statsCopy.patternDetailEmptyTitle}
              subtitle={statsCopy.patternDetailEmptyDescription}
            />
          )}
        </View>
      ) : (
        <Text style={styles.sectionTitle}>{statsCopy.patternDetailMatchesTitle}</Text>
      )}
    </View>
  );

  const renderMatchItem = React.useCallback(
    ({ item }: { item: ReturnType<typeof getPatternDreamMatches>[number] }) => (
      <PatternMatchRow
        match={item}
        dreamCopy={dreamCopy}
        statsCopy={statsCopy}
        moodLabels={moodLabels}
        navigation={navigation}
        styles={styles}
      />
    ),
    [dreamCopy, moodLabels, navigation, statsCopy, styles],
  );

  return (
    <ScreenContainer scroll={false} padded={false}>
      <FlatList
        data={matches}
        keyExtractor={item => item.dream.id}
        renderItem={renderMatchItem}
        ListHeaderComponent={listHeader}
        ItemSeparatorComponent={ListItemSeparator}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={40}
        windowSize={8}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: insets.top + t.spacing.xs,
            paddingBottom: getTabBarReservedSpace(insets.bottom) + t.spacing.xs,
          },
        ]}
      />
    </ScreenContainer>
  );
}
