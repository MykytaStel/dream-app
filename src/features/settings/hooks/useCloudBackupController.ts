import React from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  clearCloudRuntimeConfig,
  getCloudRuntimeConfigDraft,
  isCloudRuntimeConfigured,
  saveCloudRuntimeConfig,
} from '../../../config/cloud';
import { type AppLocale } from '../../../i18n/types';
import { getSettingsCopy } from '../../../constants/copy/settings';
import { resetSupabaseClient } from '../../../services/api/supabase/client';
import {
  requestCloudPasswordReset,
  signInToCloudAnonymously,
  signInToCloudWithPassword,
  signOutFromCloud,
  upgradeCloudAnonymousSession,
} from '../../../services/auth/cloudAuth';
import {
  clearCloudSession,
  getCloudSession,
  getCloudSyncEnabled,
  setCloudSyncEnabled,
} from '../../../services/auth/session';
import { getCloudSyncSnapshot, runCloudSync } from '../../../services/cloud/sync';
import { listDreams } from '../../dreams/repository/dreamsRepository';
import { getDerivedReviewStateSnapshot } from '../../stats/services/reviewShelfStateService';
import {
  listLocalDreamExportFiles,
  loadDreamImportPreview,
  type DreamImportPreview,
  type LocalDreamExportFile,
} from '../services/dataImportService';
import {
  buildBackupContentTrustItems,
  buildBackupTimelineItems,
  buildCloudHighlights,
  buildRestorePreviewItems,
  formatBackupTimestamp,
  formatCloudSyncMeta,
  getCloudSummaryState,
} from '../model/settingsPresentation';
import type { SavedReviewStateSnapshot } from '../../stats/services/reviewStateStorageService';

type SettingsCopy = ReturnType<typeof getSettingsCopy>;

type UseCloudBackupControllerArgs = {
  locale: AppLocale;
  copy: SettingsCopy;
  mode?: 'summary' | 'full';
};

type CloudActionFeedback =
  | null
  | {
      title: string;
      description: string;
    };

export function useCloudBackupController({
  locale,
  copy,
  mode = 'full',
}: UseCloudBackupControllerArgs) {
  const isFullMode = mode === 'full';
  const [cloudConfigDraft, setCloudConfigDraft] = React.useState(() =>
    getCloudRuntimeConfigDraft(),
  );
  const [cloudSession, setCloudSession] = React.useState(() =>
    getCloudSession(),
  );
  const [cloudIdentityEmail, setCloudIdentityEmail] = React.useState('');
  const [cloudIdentityPassword, setCloudIdentityPassword] =
    React.useState('');
  const [cloudSyncEnabled, setCloudSyncEnabledState] = React.useState(() =>
    getCloudSyncEnabled(),
  );
  const [cloudDreams, setCloudDreams] = React.useState(() =>
    isFullMode ? listDreams() : [],
  );
  const [reviewState, setReviewState] = React.useState<SavedReviewStateSnapshot>(
    () =>
      isFullMode
        ? getDerivedReviewStateSnapshot()
        : {
            updatedAt: 0,
            savedMonths: [],
            savedThreads: [],
            syncStatus: 'synced',
          },
  );
  const [cloudSyncSnapshot, setCloudSyncSnapshot] = React.useState(() =>
    getCloudSyncSnapshot(),
  );
  const [latestLocalBackupFile, setLatestLocalBackupFile] =
    React.useState<LocalDreamExportFile | null>(null);
  const [latestLocalBackupPreview, setLatestLocalBackupPreview] =
    React.useState<DreamImportPreview | null>(null);
  const [latestLocalBackupPreviewError, setLatestLocalBackupPreviewError] =
    React.useState<string | null>(null);
  const [isLoadingLatestLocalBackupPreview, setIsLoadingLatestLocalBackupPreview] =
    React.useState(isFullMode);
  const [isConnectingCloud, setIsConnectingCloud] = React.useState(false);
  const [isSigningInCloudAccount, setIsSigningInCloudAccount] =
    React.useState(false);
  const [isRequestingCloudPasswordReset, setIsRequestingCloudPasswordReset] =
    React.useState(false);
  const [isUpgradingCloudAccount, setIsUpgradingCloudAccount] =
    React.useState(false);
  const [isDisconnectingCloud, setIsDisconnectingCloud] = React.useState(false);
  const [isSyncingCloud, setIsSyncingCloud] = React.useState(false);
  const [cloudActionFeedback, setCloudActionFeedback] =
    React.useState<CloudActionFeedback>(null);
  const cloudConfigured = isCloudRuntimeConfigured();
  const cloudSessionIsAnonymous = Boolean(
    cloudSession.status === 'signed-in' && cloudSession.isAnonymous,
  );

  const cloudHighlights = React.useMemo(
    () =>
      buildCloudHighlights(
        copy,
        cloudSession,
        cloudSyncEnabled,
        cloudDreams,
        cloudConfigured,
        __DEV__,
      ),
    [cloudConfigured, cloudDreams, cloudSession, cloudSyncEnabled, copy],
  );
  const cloudSummary = React.useMemo(
    () => getCloudSummaryState(copy, cloudSession, cloudSyncEnabled),
    [cloudSession, cloudSyncEnabled, copy],
  );
  const cloudSyncMeta = React.useMemo(
    () => formatCloudSyncMeta(copy, cloudSyncSnapshot, locale, __DEV__),
    [cloudSyncSnapshot, copy, locale],
  );
  const backupTimelineItems = React.useMemo(
    () =>
      isFullMode
        ? buildBackupTimelineItems({
            copy,
            locale,
            snapshot: cloudSyncSnapshot,
            dreams: cloudDreams,
            session: cloudSession,
            latestBackupFile: latestLocalBackupFile,
            latestBackupPreview: latestLocalBackupPreview,
            reviewState,
          })
        : [],
    [
      cloudDreams,
      cloudSession,
      cloudSyncSnapshot,
      copy,
      latestLocalBackupFile,
      latestLocalBackupPreview,
      locale,
      reviewState,
      isFullMode,
    ],
  );
  const backupContentTrustItems = React.useMemo(
    () =>
      isFullMode
        ? buildBackupContentTrustItems({
            copy,
            dreams: cloudDreams,
            session: cloudSession,
            reviewState,
          })
        : [],
    [cloudDreams, cloudSession, copy, isFullMode, reviewState],
  );
  const latestLocalBackupPreviewMeta = React.useMemo(
    () =>
      latestLocalBackupPreview
        ? `${copy.restoreDreamCountLabel} ${
            latestLocalBackupPreview.summary.dreamCount
          } • ${formatBackupTimestamp(latestLocalBackupPreview.exportedAt, locale)}`
        : null,
    [copy.restoreDreamCountLabel, latestLocalBackupPreview, locale],
  );
  const latestLocalBackupPreviewItems = React.useMemo(
    () =>
      latestLocalBackupPreview
        ? buildRestorePreviewItems(copy, latestLocalBackupPreview, locale, {
            compact: true,
          })
        : [],
    [copy, latestLocalBackupPreview, locale],
  );
  const latestLocalBackupSignature = React.useMemo(
    () =>
      latestLocalBackupFile
        ? `${latestLocalBackupFile.filePath}:${latestLocalBackupFile.modifiedAt}`
        : null,
    [latestLocalBackupFile],
  );
  const refreshCloudShellState = React.useCallback(() => {
    setCloudConfigDraft(getCloudRuntimeConfigDraft());
    setCloudSession(getCloudSession());
    setCloudSyncEnabledState(getCloudSyncEnabled());
    setCloudSyncSnapshot(getCloudSyncSnapshot());
  }, []);

  const refreshCloudContentState = React.useCallback(() => {
    if (!isFullMode) {
      return;
    }

    setCloudDreams(listDreams());
    setReviewState(getDerivedReviewStateSnapshot());
  }, [isFullMode]);

  const refreshCloudState = React.useCallback(() => {
    refreshCloudShellState();
    refreshCloudContentState();
  }, [refreshCloudContentState, refreshCloudShellState]);

  const refreshLatestLocalBackupPreview = React.useCallback(async () => {
    if (!isFullMode) {
      setIsLoadingLatestLocalBackupPreview(false);
      return;
    }

    setIsLoadingLatestLocalBackupPreview(true);

    try {
      const files = await listLocalDreamExportFiles();
      const latestFile = files[0] ?? null;
      const nextSignature = latestFile
        ? `${latestFile.filePath}:${latestFile.modifiedAt}`
        : null;

      if (!latestFile) {
        setLatestLocalBackupFile(null);
        setLatestLocalBackupPreviewError(null);
        setLatestLocalBackupPreview(null);
        return;
      }

      if (
        nextSignature === latestLocalBackupSignature &&
        latestLocalBackupPreview &&
        !latestLocalBackupPreviewError
      ) {
        return;
      }

      setLatestLocalBackupFile(latestFile);
      setLatestLocalBackupPreviewError(null);

      const preview = await loadDreamImportPreview(latestFile.filePath, 'replace');
      setLatestLocalBackupPreview(preview);
    } catch (error) {
      setLatestLocalBackupPreview(null);
      setLatestLocalBackupPreviewError(
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setIsLoadingLatestLocalBackupPreview(false);
    }
  }, [
    isFullMode,
    latestLocalBackupSignature,
    latestLocalBackupPreview,
    latestLocalBackupPreviewError,
  ]);

  useFocusEffect(
    React.useCallback(() => {
      refreshCloudState();
      if (isFullMode) {
        refreshLatestLocalBackupPreview().catch(() => undefined);
      }
    }, [isFullMode, refreshCloudState, refreshLatestLocalBackupPreview]),
  );

  const getCloudCredentials = React.useCallback(() => {
    const email = cloudIdentityEmail.trim();
    const password = cloudIdentityPassword;

    if (!email || !password) {
      Alert.alert(
        copy.cloudCredentialsMissingTitle,
        copy.cloudCredentialsMissingDescription,
      );
      return null;
    }

    return { email, password };
  }, [
    cloudIdentityEmail,
    cloudIdentityPassword,
    copy.cloudCredentialsMissingDescription,
    copy.cloudCredentialsMissingTitle,
  ]);

  const getCloudIdentityEmail = React.useCallback(() => {
    const email = cloudIdentityEmail.trim();

    if (!email) {
      Alert.alert(copy.cloudEmailMissingTitle, copy.cloudEmailMissingDescription);
      return null;
    }

    return email;
  }, [
    cloudIdentityEmail,
    copy.cloudEmailMissingDescription,
    copy.cloudEmailMissingTitle,
  ]);

  const saveAndRefreshCloudConfig = React.useCallback(() => {
    const savedConfig = saveCloudRuntimeConfig(cloudConfigDraft);
    resetSupabaseClient();
    refreshCloudShellState();
    return savedConfig;
  }, [cloudConfigDraft, refreshCloudShellState]);

  const clearCloudActionFeedback = React.useCallback(() => {
    setCloudActionFeedback(null);
  }, []);

  const onToggleCloudSync = React.useCallback(() => {
    if (cloudSession.status !== 'signed-in') {
      return;
    }

    const nextValue = setCloudSyncEnabled(!cloudSyncEnabled);
    setCloudSyncEnabledState(nextValue);
  }, [cloudSession.status, cloudSyncEnabled]);

  const onSaveCloudConfig = React.useCallback(() => {
    const savedConfig = saveAndRefreshCloudConfig();

    if (!savedConfig) {
      Alert.alert(
        copy.cloudConfigErrorTitle,
        copy.cloudConfigMissingDescription,
      );
    }
  }, [
    copy.cloudConfigErrorTitle,
    copy.cloudConfigMissingDescription,
    saveAndRefreshCloudConfig,
  ]);

  const onClearCloudConfig = React.useCallback(() => {
    clearCloudRuntimeConfig();
    resetSupabaseClient();
    clearCloudSession();
    refreshCloudShellState();
  }, [refreshCloudShellState]);

  const onConnectCloud = React.useCallback(async () => {
    const savedConfig = saveAndRefreshCloudConfig();

    if (!savedConfig) {
      Alert.alert(
        copy.cloudConfigMissingTitle,
        copy.cloudConfigMissingDescription,
      );
      return;
    }

    setIsConnectingCloud(true);
    setCloudActionFeedback(null);

    try {
      await signInToCloudAnonymously();
      refreshCloudShellState();
      setCloudActionFeedback({
        title: copy.cloudConnectedSuccessTitle,
        description: copy.cloudConnectedSuccessDescription,
      });
    } catch (error) {
      Alert.alert(
        copy.cloudConnectErrorTitle,
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setIsConnectingCloud(false);
    }
  }, [
    copy.cloudConfigMissingDescription,
    copy.cloudConfigMissingTitle,
    copy.cloudConnectedSuccessDescription,
    copy.cloudConnectedSuccessTitle,
    copy.cloudConnectErrorTitle,
    refreshCloudShellState,
    saveAndRefreshCloudConfig,
  ]);

  const onSignInCloudAccount = React.useCallback(async () => {
    const savedConfig = saveAndRefreshCloudConfig();

    if (!savedConfig) {
      Alert.alert(
        copy.cloudConfigMissingTitle,
        copy.cloudConfigMissingDescription,
      );
      return;
    }

    const credentials = getCloudCredentials();
    if (!credentials) {
      return;
    }

    setIsSigningInCloudAccount(true);
    setCloudActionFeedback(null);

    try {
      await signInToCloudWithPassword(credentials);
      setCloudIdentityPassword('');
      refreshCloudShellState();
      setCloudActionFeedback({
        title: copy.cloudSignedInSuccessTitle,
        description: copy.cloudSignedInSuccessDescription,
      });
    } catch (error) {
      Alert.alert(
        copy.cloudAccountSignInErrorTitle,
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setIsSigningInCloudAccount(false);
    }
  }, [
    copy.cloudAccountSignInErrorTitle,
    copy.cloudConfigMissingDescription,
    copy.cloudConfigMissingTitle,
    copy.cloudSignedInSuccessDescription,
    copy.cloudSignedInSuccessTitle,
    getCloudCredentials,
    refreshCloudShellState,
    saveAndRefreshCloudConfig,
  ]);

  const onUpgradeCloudAccount = React.useCallback(async () => {
    const credentials = getCloudCredentials();
    if (!credentials) {
      return;
    }

    setIsUpgradingCloudAccount(true);
    setCloudActionFeedback(null);

    try {
      await upgradeCloudAnonymousSession(credentials);
      setCloudIdentityPassword('');
      refreshCloudShellState();
      setCloudActionFeedback({
        title: copy.cloudUpgradedSuccessTitle,
        description: copy.cloudUpgradedSuccessDescription,
      });
    } catch (error) {
      Alert.alert(
        copy.cloudAccountUpgradeErrorTitle,
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setIsUpgradingCloudAccount(false);
    }
  }, [
    copy.cloudAccountUpgradeErrorTitle,
    copy.cloudUpgradedSuccessDescription,
    copy.cloudUpgradedSuccessTitle,
    getCloudCredentials,
    refreshCloudShellState,
  ]);

  const onRequestCloudPasswordReset = React.useCallback(async () => {
    const savedConfig = saveAndRefreshCloudConfig();

    if (!savedConfig) {
      Alert.alert(
        copy.cloudConfigMissingTitle,
        copy.cloudConfigMissingDescription,
      );
      return;
    }

    const email = getCloudIdentityEmail();
    if (!email) {
      return;
    }

    setIsRequestingCloudPasswordReset(true);
    setCloudActionFeedback(null);

    try {
      await requestCloudPasswordReset(email);
      setCloudActionFeedback({
        title: copy.cloudResetSuccessTitle,
        description: copy.cloudResetSuccessDescription,
      });
      Alert.alert(
        copy.cloudPasswordResetSuccessTitle,
        copy.cloudPasswordResetSuccessDescription,
      );
    } catch (error) {
      Alert.alert(
        copy.cloudPasswordResetErrorTitle,
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setIsRequestingCloudPasswordReset(false);
    }
  }, [
    copy.cloudConfigMissingDescription,
    copy.cloudConfigMissingTitle,
    copy.cloudPasswordResetErrorTitle,
    copy.cloudResetSuccessDescription,
    copy.cloudResetSuccessTitle,
    copy.cloudPasswordResetSuccessDescription,
    copy.cloudPasswordResetSuccessTitle,
    getCloudIdentityEmail,
    saveAndRefreshCloudConfig,
  ]);

  const onDisconnectCloud = React.useCallback(async () => {
    setIsDisconnectingCloud(true);
    setCloudActionFeedback(null);

    try {
      await signOutFromCloud();
      refreshCloudShellState();
    } catch (error) {
      Alert.alert(
        copy.cloudDisconnectErrorTitle,
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setIsDisconnectingCloud(false);
    }
  }, [copy.cloudDisconnectErrorTitle, refreshCloudShellState]);

  const onRunCloudSync = React.useCallback(async () => {
    if (cloudSession.status !== 'signed-in') {
      return;
    }

    setIsSyncingCloud(true);

    try {
      const result = await runCloudSync({ reason: 'manual' });
      refreshCloudState();
      if (result.status === 'error' && result.errorMessage) {
        Alert.alert(copy.cloudSyncManualErrorTitle, result.errorMessage);
      }
    } catch (error) {
      refreshCloudState();
      Alert.alert(
        copy.cloudSyncManualErrorTitle,
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setIsSyncingCloud(false);
    }
  }, [cloudSession.status, copy.cloudSyncManualErrorTitle, refreshCloudState]);

  return {
    cloudConfigDraft,
    cloudConfigured,
    cloudSession,
    cloudSessionIsAnonymous,
    cloudIdentityEmail,
    cloudIdentityPassword,
    cloudSyncEnabled,
    cloudSyncSnapshot,
    cloudActionFeedback,
    isConnectingCloud,
    isSigningInCloudAccount,
    isRequestingCloudPasswordReset,
    isUpgradingCloudAccount,
    isDisconnectingCloud,
    isSyncingCloud,
    onSaveCloudConfig,
    onClearCloudConfig,
    onConnectCloud,
    onSignInCloudAccount,
    onRequestCloudPasswordReset,
    onUpgradeCloudAccount,
    onDisconnectCloud,
    onRunCloudSync,
    onToggleCloudSync,
    clearCloudActionFeedback,
    cloudHighlights,
    cloudSummaryStatusValue: cloudSummary.statusValue,
    cloudSummaryAccountValue: cloudSummary.accountValue,
    backupTimelineItems,
    backupContentTrustItems,
    latestLocalBackupFile,
    latestLocalBackupPreview,
    latestLocalBackupPreviewError,
    isLoadingLatestLocalBackupPreview,
    latestLocalBackupPreviewMeta,
    latestLocalBackupPreviewItems,
    refreshCloudShellState,
    refreshCloudContentState,
    refreshCloudState,
    refreshLatestLocalBackupPreview,
    cloudSyncMetaTitle: cloudSyncMeta.title,
    cloudSyncMetaDescription: cloudSyncMeta.meta,
    cloudSyncEnabledDisabled:
      cloudSession.status !== 'signed-in' ||
      isConnectingCloud ||
      isSigningInCloudAccount ||
      isRequestingCloudPasswordReset ||
      isUpgradingCloudAccount ||
      isDisconnectingCloud,
    onChangeCloudConfigUrl: (value: string) =>
      setCloudConfigDraft(current => ({ ...current, url: value })),
    onChangeCloudConfigAnonKey: (value: string) =>
      setCloudConfigDraft(current => ({ ...current, anonKey: value })),
    onChangeCloudIdentityEmail: (value: string) => setCloudIdentityEmail(value),
    onChangeCloudIdentityPassword: (value: string) =>
      setCloudIdentityPassword(value),
  };
}
