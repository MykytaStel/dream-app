import React from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@shopify/restyle';
import { Card } from '../../../components/ui/Card';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { Text } from '../../../components/ui/Text';
import { ROOT_ROUTE_NAMES, type RootStackParamList } from '../../../app/navigation/routes';
import { getSettingsCopy } from '../../../constants/copy/settings';
import { useI18n } from '../../../i18n/I18nProvider';
import { Theme } from '../../../theme/theme';
import {
  getCloudSyncEvents,
  getCloudSyncSnapshot,
} from '../../../services/cloud/syncState';
import {
  buildCloudSyncEventItems,
  formatBackupTimestamp,
} from '../model/settingsPresentation';
import { SettingsActionRow } from '../components/SettingsActionRow';
import { SettingsSectionHeader } from '../components/SettingsSectionHeader';
import { createSettingsScreenStyles } from './SettingsScreen.styles';

export default function SyncDiagnosticsPreviewScreen() {
  const theme = useTheme<Theme>();
  const styles = createSettingsScreenStyles(theme);
  const { locale } = useI18n();
  const copy = React.useMemo(() => getSettingsCopy(locale), [locale]);
  const navigation =
    useNavigation<
      NativeStackNavigationProp<
        RootStackParamList,
        typeof ROOT_ROUTE_NAMES.SyncDiagnosticsPreview
      >
    >();
  const [snapshot, setSnapshot] = React.useState(() => getCloudSyncSnapshot());
  const [events, setEvents] = React.useState(() => getCloudSyncEvents());

  const refreshState = React.useCallback(() => {
    setSnapshot(getCloudSyncSnapshot());
    setEvents(getCloudSyncEvents());
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      refreshState();
    }, [refreshState]),
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: copy.devPreviewSyncDiagnostics,
    });
  }, [copy.devPreviewSyncDiagnostics, navigation]);

  const eventItems = React.useMemo(
    () => buildCloudSyncEventItems(copy, events, locale),
    [copy, events, locale],
  );

  const latestAttemptLabel =
    typeof snapshot.lastAttemptAt === 'number'
      ? formatBackupTimestamp(new Date(snapshot.lastAttemptAt).toISOString(), locale)
      : copy.cloudLastSyncNever;

  return (
    <ScreenContainer scroll withTopInset={false}>
      <Card style={styles.sectionCard}>
        <SettingsSectionHeader
          title={copy.devSyncSnapshotTitle}
          description={copy.devSyncSnapshotDescription}
        />
        <SettingsActionRow
          title={copy.devSyncSnapshotStatusTitle}
          value={
            snapshot.status === 'syncing'
              ? copy.cloudSyncStateSyncing
              : snapshot.status === 'success'
                ? copy.cloudSyncStateSuccess
                : snapshot.status === 'error'
                  ? copy.cloudSyncStateError
                  : copy.cloudSyncStateIdle
          }
          variant="inline"
        />
        <SettingsActionRow
          title={copy.devSyncSnapshotReasonTitle}
          value={
            snapshot.reason === 'launch'
              ? copy.devSyncReasonLaunch
              : snapshot.reason === 'manual'
                ? copy.devSyncReasonManual
                : copy.cloudLastSyncNever
          }
          meta={latestAttemptLabel}
          variant="inline"
        />
        <SettingsActionRow
          title={copy.devSyncSnapshotPendingTitle}
          value={String(snapshot.pendingCount)}
          variant="inline"
        />
        <SettingsActionRow
          title={copy.devSyncSnapshotUploadsTitle}
          value={String(snapshot.uploadedCount)}
          variant="inline"
        />
        <SettingsActionRow
          title={copy.devSyncSnapshotPullsTitle}
          value={String(snapshot.pulledCount)}
          variant="inline"
        />
        <SettingsActionRow
          title={copy.devSyncSnapshotConflictsTitle}
          value={String(snapshot.conflictsResolvedCount)}
          variant="inline"
        />
        <SettingsActionRow
          title={copy.devSyncSnapshotErrorsTitle}
          meta={snapshot.errorMessage ?? copy.devSyncHistoryEmptyDescription}
          value={String(snapshot.failedCount)}
          variant="inline"
        />
      </Card>

      <Card style={styles.sectionCard}>
        <SettingsSectionHeader
          title={copy.devSyncHistoryTitle}
          description={copy.devSyncHistoryDescription}
        />
        {eventItems.length ? (
          eventItems.map(item => (
            <SettingsActionRow
              key={item.key}
              title={item.title}
              meta={item.meta}
              value={item.value}
            />
          ))
        ) : (
          <Text style={styles.privacyFootnote}>
            {`${copy.devSyncHistoryEmptyTitle} ${copy.devSyncHistoryEmptyDescription}`}
          </Text>
        )}
      </Card>
    </ScreenContainer>
  );
}
