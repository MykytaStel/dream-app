import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@shopify/restyle';
import {
  ROOT_ROUTE_NAMES,
  type RootStackParamList,
} from '../../../app/navigation/routes';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Text } from '../../../components/ui/Text';
import type { Theme } from '../../../theme/theme';
import { useArchiveHealthController } from '../hooks/useArchiveHealthController';
import { formatStorageUpdatedAt } from '../model/storageDiagnosticsPresentation';
import type {
  ArchiveHealthSeverity,
  ArchiveHealthStatus,
} from '../services/archiveHealthService';
import { createArchiveHealthScreenStyles } from './ArchiveHealthScreen.styles';

function metricValue(value: number | null) {
  return value === null ? '—' : String(value);
}

export default function ArchiveHealthScreen() {
  const theme = useTheme<Theme>();
  const styles = React.useMemo(
    () => createArchiveHealthScreenStyles(theme),
    [theme],
  );
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const controller = useArchiveHealthController();
  const { copy, snapshot } = controller;

  const statusStyle = React.useCallback(
    (status: ArchiveHealthStatus) =>
      status === 'critical'
        ? styles.criticalText
        : status === 'attention'
          ? styles.warningText
          : styles.successText,
    [styles],
  );
  const severityStyle = React.useCallback(
    (severity: ArchiveHealthSeverity) =>
      severity === 'critical'
        ? styles.criticalText
        : severity === 'warning'
          ? styles.warningText
          : styles.issueMeta,
    [styles],
  );

  const checkpointName = controller.checkpointFilePath
    ? (controller.checkpointFilePath.split('/').filter(Boolean).pop() ??
      controller.checkpointFilePath)
    : null;

  return (
    <ScreenContainer scroll withTopInset={false}>
      <View style={styles.content}>
        <SectionHeader title={copy.title} subtitle={copy.subtitle} />

        {controller.activeAction === 'scan' && !snapshot ? (
          <Card style={styles.loadingCard}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={styles.statusValue}>{copy.loadingTitle}</Text>
            <Text style={styles.description}>{copy.loadingDescription}</Text>
          </Card>
        ) : null}

        {controller.loadError ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorTitle}>{copy.repairFailedTitle}</Text>
            <Text style={styles.description}>{controller.loadError}</Text>
            <Button
              title={copy.retryAction}
              onPress={() => controller.refresh(true).catch(() => undefined)}
              variant="ghost"
              disabled={controller.activeAction !== null}
            />
          </Card>
        ) : null}

        {snapshot ? (
          <>
            <Card style={styles.statusCard}>
              <SectionHeader title={copy.statusTitle} />
              <View style={styles.statusRow}>
                <Text
                  style={[styles.statusValue, statusStyle(snapshot.status)]}
                >
                  {copy.status[snapshot.status]}
                </Text>
                <Text style={[styles.issueMeta, statusStyle(snapshot.status)]}>
                  {formatStorageUpdatedAt(
                    snapshot.scannedAt,
                    controller.locale,
                  )}
                </Text>
              </View>
              <Text style={styles.description}>
                {copy.statusDescription[snapshot.status]}
              </Text>

              <View style={styles.metricGrid}>
                {[
                  [copy.dreamsLabel, metricValue(snapshot.dreamCount)],
                  [copy.draftsLabel, metricValue(snapshot.draftCount)],
                  [copy.editDraftsLabel, metricValue(snapshot.editDraftCount)],
                  [copy.tombstonesLabel, metricValue(snapshot.tombstoneCount)],
                  [copy.issuesLabel, String(snapshot.issueCount)],
                  [copy.repairableLabel, String(snapshot.repairableIssueCount)],
                ].map(([label, value]) => (
                  <View key={label} style={styles.metric}>
                    <Text style={styles.metricLabel}>{label}</Text>
                    <Text style={styles.metricValue}>{value}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.actionStack}>
                <Button
                  title={
                    controller.activeAction === 'scan'
                      ? copy.scanningAction
                      : copy.scanAction
                  }
                  onPress={() =>
                    controller.refresh(true).catch(() => undefined)
                  }
                  variant="ghost"
                  disabled={controller.activeAction !== null}
                />
                <Button
                  title={
                    controller.activeAction === 'repair'
                      ? copy.repairingAction
                      : copy.repairAction
                  }
                  onPress={controller.confirmRepair}
                  variant="danger"
                  disabled={
                    controller.activeAction !== null ||
                    snapshot.criticalCount > 0 ||
                    snapshot.repairableIssueCount === 0
                  }
                />
              </View>
            </Card>

            {snapshot.status === 'critical' ? (
              <Card style={styles.errorCard}>
                <SectionHeader
                  title={copy.repairBlockedTitle}
                  subtitle={copy.openBackupDescription}
                />
                <Button
                  title={copy.openBackupAction}
                  onPress={() => navigation.navigate(ROOT_ROUTE_NAMES.Backup)}
                  disabled={controller.activeAction !== null}
                />
              </Card>
            ) : null}

            {checkpointName ? (
              <Card style={styles.checkpoint}>
                <SectionHeader
                  title={copy.checkpointTitle}
                  subtitle={copy.checkpointDescription}
                />
                <Text style={styles.checkpointName}>{checkpointName}</Text>
                <Button
                  title={copy.checkpointShareAction}
                  onPress={() =>
                    controller.shareCheckpoint().catch(() => undefined)
                  }
                  variant="ghost"
                  disabled={controller.activeAction !== null}
                />
              </Card>
            ) : null}

            <Card style={styles.card}>
              <SectionHeader title={copy.issuesTitle} />
              {snapshot.issues.length ? (
                <View style={styles.issueList}>
                  {snapshot.issues.map(issue => {
                    const issueCopy = copy.issue[issue.code];
                    return (
                      <View key={issue.code} style={styles.issue}>
                        <View style={styles.issueHeader}>
                          <Text style={styles.issueTitle}>
                            {issueCopy.title}
                          </Text>
                          <Text style={styles.issueCount}>×{issue.count}</Text>
                        </View>
                        <Text
                          style={[
                            styles.issueMeta,
                            severityStyle(issue.severity),
                          ]}
                        >
                          {copy.severity[issue.severity]} ·{' '}
                          {copy.repairMode[issue.repair]}
                        </Text>
                        <Text style={styles.issueDescription}>
                          {issueCopy.description}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.issue}>
                  <Text style={[styles.issueTitle, styles.successText]}>
                    {copy.issuesEmptyTitle}
                  </Text>
                  <Text style={styles.issueDescription}>
                    {copy.issuesEmptyDescription}
                  </Text>
                </View>
              )}
            </Card>

            <Card style={styles.card}>
              <SectionHeader title={copy.historyTitle} />
              {controller.history.length ? (
                <View style={styles.historyList}>
                  {controller.history.slice(0, 8).map(entry => (
                    <View key={entry.id} style={styles.historyRow}>
                      <View>
                        <Text style={styles.historyTitle}>
                          {entry.kind === 'scan'
                            ? copy.historyScan
                            : copy.historyRepair}
                        </Text>
                        <Text style={styles.issueMeta}>
                          {formatStorageUpdatedAt(entry.at, controller.locale)}
                        </Text>
                      </View>
                      <Text style={styles.historyMeta}>
                        {entry.issueCount} {copy.historyIssues}
                        {entry.kind === 'repair'
                          ? ` · ${entry.repairedIssueCount} ${copy.historyRepaired}`
                          : ''}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.description}>{copy.historyEmpty}</Text>
              )}
            </Card>
          </>
        ) : null}
      </View>
    </ScreenContainer>
  );
}
