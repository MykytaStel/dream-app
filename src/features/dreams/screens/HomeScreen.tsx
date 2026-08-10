import React from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@shopify/restyle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../../components/ui/Card';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { SkeletonBlock } from '../../../components/ui/SkeletonBlock';
import { Text } from '../../../components/ui/Text';
import { getTabBarReservedSpace } from '../../../app/navigation/tabBarLayout';
import {
  ROOT_ROUTE_NAMES,
  TAB_ROUTE_NAMES,
  type RootStackParamList,
} from '../../../app/navigation/routes';
import {
  openBackupScreen,
  openNewDreamTab,
  openWakeEntry,
} from '../../../app/navigation/navigationRef';
import { useI18n } from '../../../i18n/I18nProvider';
import { Theme } from '../../../theme/theme';
import { ScreenStateCard } from '../components/ScreenStateCard';
import {
  getDreamCopy,
  getDreamMoodLabels,
} from '../../../constants/copy/dreams';
import { getDreamLayout } from '../constants/layout';
import { HomeDreamRow } from '../components/home/HomeDreamRow';
import { HomeHero } from '../components/home/HomeHero';
import { HomeDraftPrompt } from '../components/home/HomeDraftPrompt';
import { HomeListHeader } from '../components/home/HomeListHeader';
import { isWakeCaptureWindow } from '../model/homeOverview';
import { getDreamDraftResumeDescription } from '../model/dreamDraftPresentation';
import { getHomeFeedCopy, getHomeFeedState } from '../model/homeFeed';
import { getDreamDraftSnapshot } from '../services/dreamDraftService';
import { createHomeScreenStyles } from './HomeScreen.styles';
import { useHomeScreenData } from '../hooks/useHomeScreenData';
import { useHomeSwipeActions } from '../hooks/useHomeSwipeActions';
import { useHomeTimelineState } from '../hooks/useHomeTimelineState';
import { type Dream } from '../model/dream';
import { type DreamListItem } from '../repository/dreamsRepository';
import { BackupOnboardingModal } from '../../settings/components/BackupOnboardingModal';
import { shouldShowBackupOnboarding } from '../../settings/model/backupOnboarding';
import {
  hasSeenBackupOnboarding,
  markBackupOnboardingSeen,
} from '../../settings/services/backupOnboardingService';
import { ReminderOnboardingModal } from '../../reminders/components/ReminderOnboardingModal';
import { shouldShowReminderOnboarding } from '../../reminders/model/reminderOnboarding';
import {
  hasSeenReminderOnboarding,
  markReminderOnboardingSeen,
} from '../../reminders/services/reminderOnboardingService';
import { BiometricOnboardingModal } from '../../security/components/BiometricOnboardingModal';
import { shouldShowBiometricOnboarding } from '../../security/model/biometricOnboarding';
import {
  hasSeenBiometricOnboarding,
  markBiometricOnboardingSeen,
} from '../../security/services/biometricOnboardingService';
import { checkBiometricAvailability } from '../../../services/security/biometricService';
import {
  pickActiveOnboardingModal,
  type HomeOnboardingModalKind,
} from '../model/homeOnboardingPriority';

function formatPreview(
  dream: DreamListItem,
  copy: ReturnType<typeof getDreamCopy>,
) {
  const text = dream.textPreview?.trim();
  if (text) {
    return text;
  }

  const transcript = dream.transcriptPreview?.trim();
  if (transcript) {
    return transcript;
  }

  if (dream.hasAudio) {
    return copy.audioOnlyPreview;
  }

  return copy.noDetailsPreview;
}

export default function HomeScreen() {
  const theme = useTheme<Theme>();
  const layout = React.useMemo(() => getDreamLayout(theme), [theme]);
  const insets = useSafeAreaInsets();
  const { locale } = useI18n();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const copy = React.useMemo(() => getDreamCopy(locale), [locale]);
  const homeFeedCopy = React.useMemo(() => getHomeFeedCopy(locale), [locale]);
  const moodLabels = React.useMemo(() => getDreamMoodLabels(locale), [locale]);
  const styles = React.useMemo(() => createHomeScreenStyles(theme), [theme]);
  const listContentStyle = React.useMemo(
    () => [
      styles.listContent,
      {
        paddingBottom: getTabBarReservedSpace(insets.bottom) + theme.spacing.xs,
      },
    ],
    [insets.bottom, styles.listContent, theme.spacing.xs],
  );
  const {
    dreamListItems,
    dreams,
    draft,
    detailsReady,
    loading,
    refreshing,
    loadError,
    refreshDreams,
  } = useHomeScreenData();
  const lightweightFeed = React.useMemo(
    () => getHomeFeedState(dreamListItems),
    [dreamListItems],
  );
  const dreamIds = React.useMemo(() => dreams.map(dream => dream.id), [dreams]);
  const showWakeCapturePrompt = isWakeCaptureWindow();
  const [hasSeenBackupOnboardingState, setHasSeenBackupOnboardingState] =
    React.useState(() => hasSeenBackupOnboarding());
  const [hasSeenReminderOnboardingState, setHasSeenReminderOnboardingState] =
    React.useState(() => hasSeenReminderOnboarding());
  const [hasSeenBiometricOnboardingState, setHasSeenBiometricOnboardingState] =
    React.useState(() => hasSeenBiometricOnboarding());
  const [biometricAvailable, setBiometricAvailable] = React.useState<
    boolean | null
  >(null);
  // The onboarding modal actually mounted right now, as opposed to whichever
  // one the raw eligibility data says should be active (computed below as
  // `rawOnboardingCandidate`). Kept as separate state so a higher-priority
  // candidate becoming eligible mid-display (e.g. biometrics just got
  // enrolled while the reminder modal is up) can't stack a second <Modal> on
  // top of one that's still visible or still animating out — the handoff to
  // a new modal only happens once `onboardingHandoffReady` says the
  // previous one has actually finished dismissing.
  const [visibleOnboardingModal, setVisibleOnboardingModal] =
    React.useState<HomeOnboardingModalKind | null>(null);
  const [onboardingHandoffReady, setOnboardingHandoffReady] =
    React.useState(true);
  const draftSnapshot = React.useMemo(
    () => getDreamDraftSnapshot(draft),
    [draft],
  );
  const draftResumeDescription = React.useMemo(
    () => getDreamDraftResumeDescription(draftSnapshot, copy),
    [copy, draftSnapshot],
  );
  const swipeActions = useHomeSwipeActions({
    copy,
    navigation,
    refreshDreams,
    dreamIds,
  });
  const {
    closeActiveSwipe,
    closePreviousSwipe,
    closeSwipe,
    bindSwipeMethods,
    onSwipeClosed,
    onSwipeOpened,
    openDreamDetail,
    openDreamEditor,
    openDreamQuickActions,
    toggleArchiveFromList,
    removeDreamFromList,
  } = swipeActions;
  const timeline = useHomeTimelineState({
    dreams,
    copy,
    locale,
  });
  const openDefaultCapture = React.useCallback(() => {
    openNewDreamTab({
      entryMode: 'default',
      launchKey: Date.now(),
    });
  }, []);
  const openDraftCapture = React.useCallback(() => {
    if (!draftSnapshot) {
      openDefaultCapture();
      return;
    }

    openNewDreamTab({
      entryMode: draftSnapshot.resumeMode,
      autoStartRecording: false,
    });
  }, [draftSnapshot, openDefaultCapture]);
  const openWakeCapture = React.useCallback(() => {
    openWakeEntry({ source: 'manual' });
  }, []);
  const openRecommendedCapture = React.useCallback(() => {
    if (draft) {
      openDraftCapture();
      return;
    }

    if (showWakeCapturePrompt) {
      openWakeCapture();
      return;
    }

    openDefaultCapture();
  }, [
    draft,
    openDefaultCapture,
    openDraftCapture,
    openWakeCapture,
    showWakeCapturePrompt,
  ]);
  const openArchive = React.useCallback(() => {
    navigation.navigate(ROOT_ROUTE_NAMES.Tabs, {
      screen: TAB_ROUTE_NAMES.Archive,
    });
  }, [navigation]);
  const refreshOnboardingState = React.useCallback(() => {
    setHasSeenBackupOnboardingState(hasSeenBackupOnboarding());
    setHasSeenReminderOnboardingState(hasSeenReminderOnboarding());
    setHasSeenBiometricOnboardingState(hasSeenBiometricOnboarding());
    checkBiometricAvailability()
      .then(availability => setBiometricAvailable(availability.available))
      .catch(() => setBiometricAvailable(false));
  }, []);
  useFocusEffect(
    React.useCallback(() => {
      refreshOnboardingState();
    }, [refreshOnboardingState]),
  );
  const rawOnboardingCandidate = React.useMemo<HomeOnboardingModalKind | null>(
    () =>
      loading || biometricAvailable === null
        ? null
        : pickActiveOnboardingModal({
            biometric:
              biometricAvailable &&
              shouldShowBiometricOnboarding({
                dreamCount: dreams.length,
                hasSeen: hasSeenBiometricOnboardingState,
              }),
            reminder: shouldShowReminderOnboarding({
              dreamCount: dreams.length,
              hasSeen: hasSeenReminderOnboardingState,
            }),
            backup: shouldShowBackupOnboarding({
              dreamCount: dreams.length,
              hasSeen: hasSeenBackupOnboardingState,
            }),
          }),
    [
      biometricAvailable,
      dreams.length,
      hasSeenBackupOnboardingState,
      hasSeenBiometricOnboardingState,
      hasSeenReminderOnboardingState,
      loading,
    ],
  );
  // The only place that ever promotes a new candidate into
  // `visibleOnboardingModal`. Runs after every render where the candidate and
  // the currently-mounted modal disagree; does nothing until
  // `onboardingHandoffReady` is true, so it naturally waits out an in-flight
  // dismiss animation before showing whatever should be active next.
  React.useEffect(() => {
    if (rawOnboardingCandidate === visibleOnboardingModal) {
      return;
    }
    if (rawOnboardingCandidate !== null && onboardingHandoffReady) {
      setVisibleOnboardingModal(rawOnboardingCandidate);
      setOnboardingHandoffReady(false);
    }
  }, [onboardingHandoffReady, rawOnboardingCandidate, visibleOnboardingModal]);
  const isBiometricOnboardingVisible = visibleOnboardingModal === 'biometric';
  const isReminderOnboardingVisible = visibleOnboardingModal === 'reminder';
  const isBackupOnboardingVisible = visibleOnboardingModal === 'backup';
  const heroPrompt = React.useMemo(
    () =>
      draft
        ? {
            description: draftResumeDescription,
            primaryActionLabel: copy.homeContinueDraft,
            primaryActionIcon:
              draftSnapshot?.resumeMode === 'voice'
                ? 'mic-outline'
                : 'document-text-outline',
            onPrimaryAction: openDraftCapture,
            secondaryActionLabel: showWakeCapturePrompt
              ? copy.quickAddWakeAction
              : undefined,
            secondaryActionIcon: showWakeCapturePrompt
              ? 'sunny-outline'
              : undefined,
            onSecondaryAction: showWakeCapturePrompt
              ? openWakeCapture
              : undefined,
          }
        : null,
    [
      copy.homeContinueDraft,
      copy.quickAddWakeAction,
      draft,
      draftResumeDescription,
      draftSnapshot?.resumeMode,
      openDraftCapture,
      openWakeCapture,
      showWakeCapturePrompt,
    ],
  );
  const closeBiometricOnboarding = React.useCallback(() => {
    markBiometricOnboardingSeen();
    setHasSeenBiometricOnboardingState(true);
    setVisibleOnboardingModal(null);
    if (Platform.OS === 'android') {
      // Android's Modal never fires `onDismiss`, and there's no risk of two
      // <Modal>s overlapping there, so unblock the next modal's handoff
      // right away.
      setOnboardingHandoffReady(true);
    }
  }, []);
  // Fires once a modal's dismiss animation actually completes (iOS), or
  // immediately on Android via the `close*` handlers above, so the next
  // onboarding modal is safe to mount afterward. Shared across every modal
  // that has a successor waiting in priority order.
  const handleOnboardingDismissed = React.useCallback(() => {
    setOnboardingHandoffReady(true);
  }, []);
  const closeBackupOnboarding = React.useCallback(() => {
    markBackupOnboardingSeen();
    setHasSeenBackupOnboardingState(true);
    setVisibleOnboardingModal(null);
    setOnboardingHandoffReady(true);
  }, []);
  const closeReminderOnboarding = React.useCallback(() => {
    markReminderOnboardingSeen();
    setHasSeenReminderOnboardingState(true);
    setVisibleOnboardingModal(null);
    if (Platform.OS === 'android') {
      setOnboardingHandoffReady(true);
    }
  }, []);
  const openBackupFromOnboarding = React.useCallback(() => {
    closeBackupOnboarding();
    openBackupScreen();
  }, [closeBackupOnboarding]);
  const listHeader = React.useMemo(
    () => (
      <>
        <HomeHero
          styles={styles}
          insetTop={insets.top + theme.spacing.sm}
          greeting={timeline.heroGreeting}
          dateLabel={timeline.heroDateLabel}
          streak={timeline.streak}
          streakLabel={
            timeline.streak >= 2
              ? `${timeline.streak} ${copy.homeDaysUnit}`
              : undefined
          }
        />

        <HomeDraftPrompt styles={styles} prompt={heroPrompt} />

        <HomeListHeader
          copy={copy}
          styles={styles}
          recentDreamCount={timeline.displayedDreams.length}
          activeDreamCount={timeline.activeDreamCount}
          archiveActionLabel={homeFeedCopy.openArchiveAction}
          revisitCue={timeline.revisitCue}
          onOpenRevisitDream={openDreamDetail}
          onOpenArchive={openArchive}
        />

        <BiometricOnboardingModal
          visible={isBiometricOnboardingVisible}
          onClose={closeBiometricOnboarding}
          onDismiss={handleOnboardingDismissed}
        />
        <ReminderOnboardingModal
          visible={isReminderOnboardingVisible}
          onClose={closeReminderOnboarding}
          onDismiss={handleOnboardingDismissed}
        />
        <BackupOnboardingModal
          visible={isBackupOnboardingVisible}
          dreamCount={dreams.length}
          onClose={closeBackupOnboarding}
          onOpenBackup={openBackupFromOnboarding}
        />
      </>
    ),
    [
      closeBackupOnboarding,
      closeBiometricOnboarding,
      closeReminderOnboarding,
      copy,
      dreams.length,
      handleOnboardingDismissed,
      homeFeedCopy.openArchiveAction,
      isBackupOnboardingVisible,
      isBiometricOnboardingVisible,
      isReminderOnboardingVisible,
      openArchive,
      openBackupFromOnboarding,
      openDreamDetail,
      heroPrompt,
      insets.top,
      styles,
      theme.spacing.sm,
      timeline,
    ],
  );
  const onPullToRefresh = React.useCallback(() => {
    closeActiveSwipe();
    refreshDreams('refresh');
  }, [closeActiveSwipe, refreshDreams]);
  const renderListItem = React.useCallback(
    ({ item: dream }: { item: DreamListItem }) => (
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          navigation.navigate(ROOT_ROUTE_NAMES.DreamDetail, {
            dreamId: dream.id,
          })
        }
        style={({ pressed }) => [
          styles.dreamPressable,
          pressed ? styles.dreamPressablePressed : null,
        ]}
      >
        <Card style={styles.dreamCard}>
          <View style={styles.dreamHeaderCopy}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={1}>
                {dream.title || copy.untitled}
              </Text>
            </View>
            <View style={styles.timestampRow}>
              <Text style={styles.timestamp}>
                {dream.sleepDate ||
                  new Date(dream.createdAt).toISOString().slice(0, 10)}
              </Text>
              {dream.mood ? (
                <View style={styles.moodPill}>
                  <Text style={styles.moodPillText}>
                    {moodLabels[dream.mood]}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.previewPanel}>
            <View style={[styles.previewAccent, styles.previewAccentPrimary]} />
            <Text style={styles.preview} numberOfLines={4}>
              {formatPreview(dream, copy)}
            </Text>
          </View>
        </Card>
      </Pressable>
    ),
    [copy, moodLabels, navigation, styles],
  );
  const renderDream = React.useCallback(
    ({ item: dream, index }: { item: Dream; index: number }) => (
      <HomeDreamRow
        dream={dream}
        index={index}
        copy={copy}
        searchQuery=""
        moodLabels={moodLabels}
        theme={theme}
        styles={styles}
        layout={layout}
        closeActiveSwipe={closeActiveSwipe}
        closePreviousSwipe={closePreviousSwipe}
        closeSwipe={closeSwipe}
        bindSwipeMethods={bindSwipeMethods}
        onSwipeClosed={onSwipeClosed}
        onSwipeOpened={onSwipeOpened}
        openDreamDetail={openDreamDetail}
        openDreamEditor={openDreamEditor}
        openDreamQuickActions={openDreamQuickActions}
        toggleArchiveFromList={toggleArchiveFromList}
        removeDreamFromList={removeDreamFromList}
      />
    ),
    [
      bindSwipeMethods,
      closeActiveSwipe,
      closePreviousSwipe,
      closeSwipe,
      copy,
      layout,
      moodLabels,
      onSwipeClosed,
      onSwipeOpened,
      openDreamDetail,
      openDreamEditor,
      openDreamQuickActions,
      removeDreamFromList,
      styles,
      theme,
      toggleArchiveFromList,
    ],
  );

  if (loadError) {
    return (
      <ScreenContainer scroll={false} style={styles.emptyContainer}>
        <ScreenStateCard
          variant="error"
          title={copy.timelineErrorTitle}
          subtitle={copy.timelineErrorDescription}
          actionLabel={copy.actionRetry}
          onAction={() => refreshDreams('silent')}
        />
      </ScreenContainer>
    );
  }

  if (loading) {
    return (
      <ScreenContainer scroll={false}>
        <Card style={styles.heroCard}>
          <SkeletonBlock width="22%" height={12} />
          <SkeletonBlock width="42%" height={28} />
          <SkeletonBlock width="72%" height={16} />
          <SkeletonBlock width="100%" height={44} />
        </Card>
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={`home-loading-${index}`} style={styles.skeletonCard}>
            <View style={styles.skeletonHeaderRow}>
              <SkeletonBlock style={styles.skeletonDateBadge} />
              <View style={styles.skeletonHeaderCopy}>
                <SkeletonBlock width="70%" height={16} />
                <SkeletonBlock width="46%" height={12} />
              </View>
            </View>
            <View style={styles.skeletonPreviewBlock}>
              <SkeletonBlock width="94%" height={12} />
              <SkeletonBlock width="82%" height={12} />
              <SkeletonBlock width="68%" height={12} />
            </View>
          </Card>
        ))}
      </ScreenContainer>
    );
  }

  if (!dreamListItems.length && !draft) {
    return (
      <ScreenContainer scroll={false} style={styles.emptyContainer}>
        <ScreenStateCard
          variant="empty"
          title={copy.emptyTitle}
          subtitle={copy.emptyDescription}
          actionLabel={
            showWakeCapturePrompt ? copy.quickAddWakeAction : copy.createTitle
          }
          onAction={openRecommendedCapture}
        />
      </ScreenContainer>
    );
  }

  if (!detailsReady) {
    return (
      <ScreenContainer scroll={false} padded={false}>
        <FlatList
          data={lightweightFeed.recentItems}
          keyExtractor={item => item.id}
          ListHeaderComponent={
            <>
              <HomeHero
                styles={styles}
                insetTop={insets.top + theme.spacing.sm}
                greeting={timeline.heroGreeting}
                dateLabel={timeline.heroDateLabel}
                streak={timeline.streak}
                streakLabel={
                  timeline.streak >= 2
                    ? `${timeline.streak} ${copy.homeDaysUnit}`
                    : undefined
                }
              />
              <HomeDraftPrompt styles={styles} prompt={heroPrompt} />
              <HomeListHeader
                copy={copy}
                styles={styles}
                recentDreamCount={lightweightFeed.recentItems.length}
                activeDreamCount={lightweightFeed.activeCount}
                archiveActionLabel={homeFeedCopy.openArchiveAction}
                revisitCue={null}
                onOpenRevisitDream={openDreamDetail}
                onOpenArchive={openArchive}
              />
            </>
          }
          showsVerticalScrollIndicator={false}
          initialNumToRender={3}
          maxToRenderPerBatch={3}
          windowSize={5}
          removeClippedSubviews
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onPullToRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary, theme.colors.accent]}
              progressBackgroundColor={theme.colors.surface}
            />
          }
          contentContainerStyle={[
            styles.listContent,
            {
              paddingBottom:
                getTabBarReservedSpace(insets.bottom) + theme.spacing.xs,
            },
          ]}
          renderItem={renderListItem}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll={false} padded={false}>
      <FlatList
        data={timeline.displayedDreams}
        keyExtractor={item => item.id}
        ListHeaderComponent={listHeader}
        showsVerticalScrollIndicator={false}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
        removeClippedSubviews
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onPullToRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary, theme.colors.accent]}
            progressBackgroundColor={theme.colors.surface}
          />
        }
        contentContainerStyle={listContentStyle}
        renderItem={renderDream}
      />
    </ScreenContainer>
  );
}
