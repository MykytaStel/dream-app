import React from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { logActionError } from '../../../app/errorReporting';
import { getArchiveHealthCopy } from '../../../constants/copy/archiveHealth';
import { useI18n } from '../../../i18n/I18nProvider';
import {
  getArchiveHealthHistory,
  repairArchiveHealth,
  scanArchiveHealth,
  type ArchiveHealthSnapshot,
} from '../services/archiveHealthService';
import { shareLocalBackupFile } from '../services/backupFileActions';
import { interpolateStorageCopy } from '../model/storageDiagnosticsPresentation';

type ActiveAction = 'scan' | 'repair' | 'share-checkpoint' | null;

export function useArchiveHealthController() {
  const { locale } = useI18n();
  const copy = React.useMemo(() => getArchiveHealthCopy(locale), [locale]);
  const [snapshot, setSnapshot] = React.useState<ArchiveHealthSnapshot | null>(
    null,
  );
  const [history, setHistory] = React.useState(() => getArchiveHealthHistory());
  const [activeAction, setActiveAction] = React.useState<ActiveAction>('scan');
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [checkpointFilePath, setCheckpointFilePath] = React.useState<
    string | null
  >(null);
  const mountedRef = React.useRef(true);

  React.useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = React.useCallback(
    async (record = false) => {
      setActiveAction('scan');
      setLoadError(null);
      try {
        const next = await scanArchiveHealth({ record });
        if (mountedRef.current) {
          setSnapshot(next);
          setHistory(getArchiveHealthHistory());
        }
        return next;
      } catch (error) {
        logActionError('useArchiveHealthController.scan', error);
        if (mountedRef.current) {
          setLoadError(
            error instanceof Error ? error.message : copy.unknownError,
          );
        }
        return null;
      } finally {
        if (mountedRef.current) {
          setActiveAction(null);
        }
      }
    },
    [copy.unknownError],
  );

  useFocusEffect(
    React.useCallback(() => {
      refresh(false).catch(error =>
        logActionError('useArchiveHealthController.focusScan', error),
      );
    }, [refresh]),
  );

  const confirmRepair = React.useCallback(() => {
    Alert.alert(copy.repairConfirmTitle, copy.repairConfirmDescription, [
      { text: locale === 'uk' ? 'Скасувати' : 'Cancel', style: 'cancel' },
      {
        text: copy.repairAction,
        style: 'destructive',
        onPress: () => {
          setActiveAction('repair');
          repairArchiveHealth()
            .then(result => {
              if (!mountedRef.current) {
                return;
              }
              setSnapshot(result.snapshot);
              setHistory(getArchiveHealthHistory());
              if (result.checkpointFilePath) {
                setCheckpointFilePath(result.checkpointFilePath);
              }

              if (result.status === 'completed') {
                Alert.alert(
                  copy.repairCompletedTitle,
                  interpolateStorageCopy(copy.repairCompletedDescription, {
                    count: result.repairedIssueCount,
                  }),
                );
                return;
              }

              if (result.status === 'blocked') {
                Alert.alert(
                  result.reason === 'critical-issues'
                    ? copy.repairBlockedTitle
                    : copy.repairNothingTitle,
                  result.reason === 'critical-issues'
                    ? copy.repairBlockedDescription
                    : copy.repairNothingDescription,
                );
                return;
              }

              Alert.alert(copy.repairFailedTitle, copy.repairFailedDescription);
            })
            .catch(error => {
              logActionError('useArchiveHealthController.repair', error);
              Alert.alert(
                copy.repairFailedTitle,
                error instanceof Error
                  ? error.message
                  : copy.repairFailedDescription,
              );
            })
            .finally(() => {
              if (mountedRef.current) {
                setActiveAction(null);
              }
            });
        },
      },
    ]);
  }, [copy, locale]);

  const shareCheckpoint = React.useCallback(async () => {
    if (!checkpointFilePath) {
      return;
    }

    setActiveAction('share-checkpoint');
    try {
      const fileName =
        checkpointFilePath.split('/').filter(Boolean).pop() ??
        checkpointFilePath;
      await shareLocalBackupFile(
        checkpointFilePath,
        'application/json',
        fileName,
      );
    } catch (error) {
      logActionError('useArchiveHealthController.shareCheckpoint', error);
      Alert.alert(
        copy.repairFailedTitle,
        error instanceof Error ? error.message : copy.unknownError,
      );
    } finally {
      if (mountedRef.current) {
        setActiveAction(null);
      }
    }
  }, [checkpointFilePath, copy.repairFailedTitle, copy.unknownError]);

  return {
    locale,
    copy,
    snapshot,
    history,
    loadError,
    activeAction,
    checkpointFilePath,
    refresh,
    confirmRepair,
    shareCheckpoint,
  };
}
