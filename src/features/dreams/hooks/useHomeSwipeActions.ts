import React from 'react';
import { ActionSheetIOS, Alert, Platform } from 'react-native';
import { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { type DreamCopy } from '../../../constants/copy/dreams';
import {
  ROOT_ROUTE_NAMES,
  type PatternDetailKind,
  type RootStackParamList,
} from '../../../app/navigation/routes';
import { Dream } from '../model/dream';
import { isDreamArchived, isDreamStarred } from '../model/homeTimeline';
import {
  archiveDream,
  deleteDream,
  starDream,
  unarchiveDream,
  unstarDream,
} from '../repository/dreamsRepository';
import { type HomeRefreshMode } from './useHomeScreenData';

type UseHomeSwipeActionsArgs = {
  copy: DreamCopy;
  navigation: NativeStackNavigationProp<RootStackParamList>;
  refreshDreams: (mode?: HomeRefreshMode) => void;
  dreamIds: string[];
};

export function useHomeSwipeActions({
  copy,
  navigation,
  refreshDreams,
  dreamIds,
}: UseHomeSwipeActionsArgs) {
  const swipeMethods = React.useRef<Record<string, SwipeableMethods>>({});
  const activeSwipeId = React.useRef<string | null>(null);

  const closeActiveSwipe = React.useCallback(() => {
    const activeId = activeSwipeId.current;
    if (!activeId) {
      return;
    }

    swipeMethods.current[activeId]?.close();
    activeSwipeId.current = null;
  }, []);

  const closeSwipe = React.useCallback((dreamId: string) => {
    swipeMethods.current[dreamId]?.close();
    if (activeSwipeId.current === dreamId) {
      activeSwipeId.current = null;
    }
  }, []);

  const closePreviousSwipe = React.useCallback((dreamId: string) => {
    if (activeSwipeId.current && activeSwipeId.current !== dreamId) {
      swipeMethods.current[activeSwipeId.current]?.close();
    }

    activeSwipeId.current = dreamId;
  }, []);

  const bindSwipeMethods = React.useCallback((dreamId: string, methods: SwipeableMethods) => {
    swipeMethods.current[dreamId] = methods;
  }, []);

  const onSwipeOpened = React.useCallback((dreamId: string) => {
    activeSwipeId.current = dreamId;
  }, []);

  const onSwipeClosed = React.useCallback((dreamId: string) => {
    if (activeSwipeId.current === dreamId) {
      activeSwipeId.current = null;
    }
  }, []);

  React.useEffect(() => {
    const ids = new Set(dreamIds);

    Object.keys(swipeMethods.current).forEach(dreamId => {
      if (ids.has(dreamId)) {
        return;
      }

      delete swipeMethods.current[dreamId];
      if (activeSwipeId.current === dreamId) {
        activeSwipeId.current = null;
      }
    });
  }, [dreamIds]);

  const openDreamEditor = React.useCallback(
    (dreamId: string) => {
      navigation.navigate(ROOT_ROUTE_NAMES.DreamEditor, {
        dreamId,
      });
    },
    [navigation],
  );

  const openDreamDetail = React.useCallback(
    (dreamId: string) => {
      navigation.navigate(ROOT_ROUTE_NAMES.DreamDetail, {
        dreamId,
      });
    },
    [navigation],
  );

  const toggleArchiveFromList = React.useCallback(
    (dream: Dream) => {
      if (isDreamArchived(dream)) {
        unarchiveDream(dream.id);
      } else {
        archiveDream(dream.id);
      }

      refreshDreams('silent');
    },
    [refreshDreams],
  );

  const toggleStarFromList = React.useCallback(
    (dream: Dream) => {
      if (isDreamStarred(dream)) {
        unstarDream(dream.id);
      } else {
        starDream(dream.id);
      }

      refreshDreams('silent');
    },
    [refreshDreams],
  );

  const removeDreamFromList = React.useCallback(
    (dreamId: string) => {
      Alert.alert(copy.detailDeleteTitle, copy.detailDeleteDescription, [
        {
          text: copy.detailDeleteCancel,
          style: 'cancel',
        },
        {
          text: copy.detailDeleteConfirm,
          style: 'destructive',
          onPress: () => {
            deleteDream(dreamId);
            refreshDreams('silent');
          },
        },
      ]);
    },
    [copy, refreshDreams],
  );

  const openDreamQuickActions = React.useCallback(
    (dream: Dream) => {
      closeActiveSwipe();

      const archiveLabel = isDreamArchived(dream) ? copy.swipeUnarchive : copy.swipeArchive;
      const starLabel = isDreamStarred(dream) ? copy.detailUnstar : copy.detailStar;

      if (Platform.OS === 'ios') {
        const options = [
          copy.homeQuickOpen,
          copy.swipeEdit,
          starLabel,
          archiveLabel,
          copy.swipeDelete,
          copy.detailDeleteCancel,
        ];

        ActionSheetIOS.showActionSheetWithOptions(
          {
            title: dream.title || copy.untitled,
            message: dream.sleepDate || new Date(dream.createdAt).toISOString().slice(0, 10),
            options,
            cancelButtonIndex: 5,
            destructiveButtonIndex: 4,
          },
          buttonIndex => {
            if (buttonIndex === 0) {
              openDreamDetail(dream.id);
              return;
            }

            if (buttonIndex === 1) {
              openDreamEditor(dream.id);
              return;
            }

            if (buttonIndex === 2) {
              toggleStarFromList(dream);
              return;
            }

            if (buttonIndex === 3) {
              toggleArchiveFromList(dream);
              return;
            }

            if (buttonIndex === 4) {
              removeDreamFromList(dream.id);
            }
          },
        );
        return;
      }

      Alert.alert(dream.title || copy.untitled, undefined, [
        {
          text: copy.homeQuickOpen,
          onPress: () => openDreamDetail(dream.id),
        },
        {
          text: starLabel,
          onPress: () => toggleStarFromList(dream),
        },
        {
          text: archiveLabel,
          onPress: () => toggleArchiveFromList(dream),
        },
      ]);
    },
    [
      closeActiveSwipe,
      copy,
      openDreamDetail,
      openDreamEditor,
      removeDreamFromList,
      toggleArchiveFromList,
      toggleStarFromList,
    ],
  );

  const openPatternDetail = React.useCallback(
    (signal: string, kind: PatternDetailKind) => {
      closeActiveSwipe();
      navigation.navigate(ROOT_ROUTE_NAMES.PatternDetail, {
        signal,
        kind,
      });
    },
    [closeActiveSwipe, navigation],
  );

  return {
    closeActiveSwipe,
    closeSwipe,
    closePreviousSwipe,
    bindSwipeMethods,
    onSwipeOpened,
    onSwipeClosed,
    openDreamEditor,
    openDreamDetail,
    toggleArchiveFromList,
    toggleStarFromList,
    removeDreamFromList,
    openDreamQuickActions,
    openPatternDetail,
  };
}
