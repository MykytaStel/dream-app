import React from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useI18n } from '../../../i18n/I18nProvider';
import { getArchiveHealthCopy } from '../../../constants/copy/archiveHealth';
import { logActionError } from '../../../app/errorReporting';
import {
  readArchiveHealth,
  repairArchiveHealth,
  type ArchiveHealthSnapshot,
} from '../services/archiveHealthService';
import { recordArchiveHealthSnapshot } from '../services/archiveHealthMaintenanceService';

function interpolate(
  template: string,
  values: Record<string, string | number>,
) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key)
      ? String(values[key])
      : `{${key}}`,
  );
}

export function useArchiveHealthController() {
  const { locale } = useI18n();
  const copy = React.useMemo(() => getArchiveHealthCopy(locale), [locale]);
  const [snapshot, setSnapshot] =
    React.useState<ArchiveHealthSnapshot | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRepairing, setIsRepairing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [backupPath, setBackupPath] = React.useState<string | null>(null);
  const mountedRef = React.useRef(true);

  React.useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const next = await readArchiveHealth();
      recordArchiveHealthSnapshot(next);
      if (mountedRef.current) {
        setSnapshot(next);
      }
    } catch (failure) {
      logActionError('useArchiveHealthController.refresh', failure);
      if (mountedRef.current) {
        setError(
          failure instanceof Error ? failure.message : copy.unknownError,
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
      refresh().catch(failure =>
        logActionError('useArchiveHealthController.focusRefresh', failure),
      );
    }, [refresh]),
  );

  const confirmRepair = React.useCallback(() => {
    if (!snapshot || snapshot.status === 'blocked' || !snapshot.repairActions.length) {
      return;
    }

    Alert.alert(copy.repairConfirmTitle, copy.repairConfirmDescription, [
      { text: copy.actionCancel, style: 'cancel' },
      {
        text: copy.repairConfirmAction,
        style: 'destructive',
        onPress: () => {
          setIsRepairing(true);
          repairArchiveHealth(snapshot)
            .then(result => {
              if (!mountedRef.current) return;

              if (result.status === 'completed') {
                recordArchiveHealthSnapshot(result.after);
                setSnapshot(result.after);
                setBackupPath(result.backupFilePath);
                Alert.alert(
                  copy.repairSuccessTitle,
                  interpolate(copy.repairSuccessDescription, {
                    actions: result.appliedActions.length,
                    audio: result.detachedAudioCount,
                    drafts: result.removedDraftCount,
                  }),
                );
                return;
              }

              if (result.status === 'blocked') {
                const message =
                  result.reason === 'archive-changed'
                    ? copy.repairBlockedArchiveChanged
                    : result.reason === 'duplicate-dream-id'
                      ? copy.repairBlockedDuplicate
                      : copy.repairBlockedUnreadable;
                Alert.alert(copy.repairBlockedTitle, message);
                refresh().catch(() => undefined);
                return;
              }

              Alert.alert(
                copy.repairBlockedTitle,
                result.reason === 'backup-failed'
                  ? copy.repairFailedBackup
                  : copy.repairFailedGeneric,
              );
            })
            .catch(failure => {
              logActionError('useArchiveHealthController.repair', failure);
              Alert.alert(
                copy.repairBlockedTitle,
                failure instanceof Error
                  ? failure.message
                  : copy.repairFailedGeneric,
              );
            })
            .finally(() => {
              if (mountedRef.current) {
                setIsRepairing(false);
              }
            });
        },
      },
    ]);
  }, [copy, refresh, snapshot]);

  return {
    locale,
    copy,
    snapshot,
    isLoading,
    isRepairing,
    error,
    backupPath,
    refresh,
    confirmRepair,
  };
}
