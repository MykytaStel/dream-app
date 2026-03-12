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
} from '../../../app/navigation/routes';
import { getDreamCopy, getDreamMoodLabels } from '../../../constants/copy/dreams';
import { getStatsCopy } from '../../../constants/copy/stats';
import { useI18n } from '../../../i18n/I18nProvider';
import { Theme } from '../../../theme/theme';
import { Dream } from '../../dreams/model/dream';
import {
  getDreamsMeta,
  listDreams,
} from '../../dreams/repository/dreamsRepository';
import { getPatternDreamMatches } from '../model/patternMatches';
import { buildDreamThreadViewModel } from '../model/dreamThread';
import { createPatternDetailScreenStyles } from './PatternDetailScreen.styles';
import { getTabBarReservedSpace } from '../../../app/navigation/tabBarLayout';
import {
  isDreamThreadSaved,
  toggleSavedDreamThread,
} from '../services/dreamThreadShelfService';

const PatternMatchRow = React.memo(function PatternMatchRow({
  item,
  statsCopy,
  navigation,
  styles,
}: {
  item: ReturnType<typeof buildDreamThreadViewModel>['entries'][number];
  statsCopy: ReturnType<typeof getStatsCopy>;
  navigation: NativeStackNavigationProp<RootStackParamList>;
  styles: ReturnType<typeof createPatternDetailScreenStyles>;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.rowPressable,
        pressed ? styles.rowPressablePressed : null,
      ]}
      onPress={() =>
        navigation.navigate(ROOT_ROUTE_NAMES.DreamDetail, {
          dreamId: item.dreamId,
        })}
    >
      <Card style={styles.rowCard}>
        <View style={styles.rowHeader}>
          <View style={styles.rowCopy}>
            <Text style={styles.rowTitle}>{item.title}</Text>
            <Text style={styles.rowMeta}>{item.meta}</Text>
          </View>
          {item.markerLabel ? (
            <View style={styles.timelineMarkerChip}>
              <Text style={styles.timelineMarkerText}>{item.markerLabel}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.previewWrap}>
          <View style={styles.previewAccent} />
          <Text style={styles.preview}>{item.preview}</Text>
        </View>

        <View style={styles.sourcesRow}>
          <Text style={styles.sourceLabel}>{statsCopy.patternDetailMatchedIn}</Text>
          {item.sourceLabels.map(source => (
            <TagChip
              key={`${item.dreamId}-${source}`}
              label={source}
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
  const [isSavedThread, setIsSavedThread] = React.useState(() =>
    isDreamThreadSaved(signal, kind),
  );

  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      setLoadError(null);
      setLoading(getDreamsMeta().totalCount > 0);
      setIsSavedThread(isDreamThreadSaved(signal, kind));

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
    }, [kind, signal]),
  );

  const matches = React.useMemo(
    () => getPatternDreamMatches(dreams, signal, kind),
    [dreams, kind, signal],
  );
  const thread = React.useMemo(
    () =>
      buildDreamThreadViewModel({
        signal,
        kind,
        matches,
        statsCopy,
        dreamCopy,
        moodLabels,
      }),
    [dreamCopy, kind, matches, moodLabels, signal, statsCopy],
  );

  const listHeader = (
    <View style={styles.listHeader}>
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backLabel}>{dreamCopy.detailBack}</Text>
      </Pressable>

      <Card style={styles.heroCard}>
        <View pointerEvents="none" style={styles.heroGlow} />
        <Text style={styles.heroEyebrow}>{thread.eyebrow}</Text>
        <Text style={styles.heroTitle}>{thread.title}</Text>
        <Text style={styles.heroSubtitle}>{thread.subtitle}</Text>
        <View style={styles.summaryGrid}>
          {thread.summaryItems.map(item => (
            <View key={item.label} style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>{item.label}</Text>
              <Text style={styles.summaryValue}>{item.value}</Text>
            </View>
          ))}
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.saveThreadButton,
            pressed ? styles.saveThreadButtonPressed : null,
          ]}
          onPress={() => {
            setIsSavedThread(
              toggleSavedDreamThread(signal, kind).some(
                item => item.signal === signal && item.kind === kind,
              ),
            );
          }}
        >
          <Text style={styles.saveThreadButtonText}>
            {isSavedThread ? statsCopy.threadSavedAction : statsCopy.threadSaveAction}
          </Text>
        </Pressable>
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
        <Text style={styles.sectionTitle}>{thread.timelineTitle}</Text>
      )}
    </View>
  );

  const renderMatchItem = React.useCallback(
    ({ item }: { item: ReturnType<typeof buildDreamThreadViewModel>['entries'][number] }) => (
      <PatternMatchRow
        item={item}
        statsCopy={statsCopy}
        navigation={navigation}
        styles={styles}
      />
    ),
    [navigation, statsCopy, styles],
  );

  return (
    <ScreenContainer scroll={false} padded={false}>
      <FlatList
        data={thread.entries}
        keyExtractor={item => item.dreamId}
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
