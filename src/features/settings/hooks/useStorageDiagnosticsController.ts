import React from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getStorageDiagnosticsCopy } from '../../../constants/copy/storageDiagnostics';
import { useI18n } from '../../../i18n/I18nProvider';
import { logActionError } from '../../../app/errorReporting';
import {
  cleanupUnlinkedAudioNow,
  deleteGeneratedExports,
  deleteStoredTranscriptionModel,
  readStorageDiagnostics,
  type StorageDiagnosticsSnapshot,
} from '../services/storageDiagnosticsService';
import { interpolateStorageCopy } from '../model/storageDiagnosticsPresentation';

type StorageAction = 'audio' | 'exports' | 'model';

export function useStorageDiagnosticsController() {
  const { locale } = useI18n();
  const copy = React.useMemo(() => getStorageDiagnosticsCopy(locale), [locale]);
  const [snapshot, setSnapshot] =
    React.useState<StorageDiagnosticsSnapshot | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [activeAction, setActiveAction] = React.useState<StorageAction | null>(
    null,
  );
  const mountedRef = React.useRef(true);

  React.useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const next = await readStorageDiagnostics();
      if (mountedRef.current) {
        setSnapshot(next);
      }
    } catch (error) {
      logActionError('useStorageDiagnosticsController.refresh', error);
      if (mountedRef.current) {
        setLoadError(
          error instanceof Error ? error.message : copy.unknownError,
        );
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [copy.unknownError]);

  useFocusEffect(
    React.useCallback(() => {
      refresh().catch(error =>
        logActionError('useStorageDiagnosticsController.focusRefresh', error),
      );
    }, [refresh]),
  );

  const runAction = React.useCallback(
    async (action: StorageAction, operation: () => Promise<void>) => {
      setActiveAction(action);
      try {
        await operation();
      } finally {
        if (mountedRef.current) {
          setActiveAction(null);
        }
      }
    },
    [],
  );

  const confirmAudioCleanup = React.useCallback(() => {
    Alert.alert(
      copy.audioCleanupConfirmTitle,
      copy.audioCleanupConfirmDescription,
      [
        { text: copy.actionCancel, style: 'cancel' },
        {
          text: copy.actionRemove,
          style: 'destructive',
          onPress: () => {
            runAction('audio', async () => {
              const result = await cleanupUnlinkedAudioNow();

              if (result.status === 'completed') {
                Alert.alert(
                  copy.audioCleanupSuccessTitle,
                  result.deletedCount > 0
                    ? interpolateStorageCopy(
                        copy.audioCleanupSuccessDescription,
                        { count: result.deletedCount },
                      )
                    : copy.audioCleanupNothingDescription,
                );
              } else if (
                result.status === 'deferred' ||
                (result.status === 'skipped' &&
                  result.reason === 'recording-active')
              ) {
                Alert.alert(
                  copy.audioCleanupSuccessTitle,
                  copy.audioCleanupDeferredDescription,
                );
              } else if (
                result.status === 'skipped' &&
                result.reason === 'ownership-incomplete'
              ) {
                Alert.alert(
                  copy.audioCleanupSuccessTitle,
                  copy.audioCleanupBlockedDescription,
                );
              } else {
                Alert.alert(
                  copy.loadErrorTitle,
                  copy.audioCleanupErrorDescription,
                );
              }

              await refresh();
            }).catch(error => {
              logActionError(
                'useStorageDiagnosticsController.cleanupAudio',
                error,
              );
              Alert.alert(
                copy.loadErrorTitle,
                error instanceof Error
                  ? error.message
                  : copy.audioCleanupErrorDescription,
              );
            });
          },
        },
      ],
    );
  }, [copy, refresh, runAction]);

  const confirmDeleteExports = React.useCallback(() => {
    Alert.alert(
      copy.exportsDeleteConfirmTitle,
      copy.exportsDeleteConfirmDescription,
      [
        { text: copy.actionCancel, style: 'cancel' },
        {
          text: copy.actionDelete,
          style: 'destructive',
          onPress: () => {
            runAction('exports', async () => {
              const result = await deleteGeneratedExports();
              const description =
                result.failedCount > 0
                  ? interpolateStorageCopy(
                      copy.exportsDeletePartialDescription,
                      {
                        count: result.deletedCount,
                        failed: result.failedCount,
                      },
                    )
                  : result.deletedCount > 0
                    ? interpolateStorageCopy(
                        copy.exportsDeleteSuccessDescription,
                        { count: result.deletedCount },
                      )
                    : copy.exportsDeleteNothingDescription;

              Alert.alert(copy.exportsDeleteSuccessTitle, description);
              await refresh();
            }).catch(error => {
              logActionError(
                'useStorageDiagnosticsController.deleteExports',
                error,
              );
              Alert.alert(
                copy.loadErrorTitle,
                error instanceof Error ? error.message : copy.unknownError,
              );
            });
          },
        },
      ],
    );
  }, [copy, refresh, runAction]);

  const confirmDeleteModel = React.useCallback(() => {
    Alert.alert(
      copy.transcriptionDeleteConfirmTitle,
      copy.transcriptionDeleteConfirmDescription,
      [
        { text: copy.actionCancel, style: 'cancel' },
        {
          text: copy.actionDelete,
          style: 'destructive',
          onPress: () => {
            runAction('model', async () => {
              await deleteStoredTranscriptionModel();
              Alert.alert(
                copy.transcriptionDeleteSuccessTitle,
                copy.transcriptionDeleteSuccessDescription,
              );
              await refresh();
            }).catch(error => {
              logActionError(
                'useStorageDiagnosticsController.deleteModel',
                error,
              );
              Alert.alert(
                copy.loadErrorTitle,
                error instanceof Error ? error.message : copy.unknownError,
              );
            });
          },
        },
      ],
    );
  }, [copy, refresh, runAction]);

  return {
    locale,
    copy,
    snapshot,
    isLoading,
    loadError,
    activeAction,
    refresh,
    confirmAudioCleanup,
    confirmDeleteExports,
    confirmDeleteModel,
  };
}
