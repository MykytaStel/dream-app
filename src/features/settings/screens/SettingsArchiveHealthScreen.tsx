import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Text } from '../../../components/ui/Text';
import type { Theme } from '../../../theme/theme';
import { getArchiveHealthCopy } from '../../../constants/copy/archiveHealth';
import type {
  ArchiveHealthIssue,
  ArchiveHealthIssueCode,
} from '../services/archiveHealthService';
import { useArchiveHealthController } from '../hooks/useArchiveHealthController';
import { createArchiveHealthStyles } from './SettingsArchiveHealthScreen.styles';

type ArchiveHealthCopy = ReturnType<typeof getArchiveHealthCopy>;

function issueCopy(code: ArchiveHealthIssueCode, copy: ArchiveHealthCopy) {
  switch (code) {
    case 'archive-unreadable':
      return [copy.issueArchiveUnreadableTitle, copy.issueArchiveUnreadableBody];
    case 'duplicate-dream-id':
      return [copy.issueDuplicateDreamIdTitle, copy.issueDuplicateDreamIdBody];
    case 'missing-audio-file':
      return [copy.issueMissingAudioTitle, copy.issueMissingAudioBody];
    case 'stale-transcript-state':
      return [copy.issueStaleTranscriptTitle, copy.issueStaleTranscriptBody];
    case 'derived-index-missing':
      return [copy.issueDerivedIndexMissingTitle, copy.issueDerivedIndexMissingBody];
    case 'derived-index-invalid':
      return [copy.issueDerivedIndexInvalidTitle, copy.issueDerivedIndexInvalidBody];
    case 'derived-meta-missing':
      return [copy.issueDerivedMetaMissingTitle, copy.issueDerivedMetaMissingBody];
    case 'derived-meta-invalid':
      return [copy.issueDerivedMetaInvalidTitle, copy.issueDerivedMetaInvalidBody];
    case 'orphan-edit-draft':
      return [copy.issueOrphanEditDraftTitle, copy.issueOrphanEditDraftBody];
    case 'unreadable-edit-draft':
      return [copy.issueUnreadableEditDraftTitle, copy.issueUnreadableEditDraftBody];
  }
}

function countIssues(issues: readonly ArchiveHealthIssue[]) {
  return issues.reduce((total, issue) => total + issue.count, 0);
}

export default function SettingsArchiveHealthScreen() {
  const theme = useTheme<Theme>();
  const styles = React.useMemo(() => createArchiveHealthStyles(theme), [theme]);
  const controller = useArchiveHealthController();
  const { copy, snapshot } = controller;

  const statusTitle = snapshot
    ? snapshot.status === 'healthy'
      ? copy.statusHealthy
      : snapshot.status === 'attention'
        ? copy.statusAttention
        : copy.statusBlocked
    : '';
  const statusDescription = snapshot
    ? snapshot.status === 'healthy'
      ? copy.statusDescriptionHealthy
      : snapshot.status === 'attention'
        ? copy.statusDescriptionAttention
        : copy.statusDescriptionBlocked
    : '';

  return (
    <ScreenContainer scroll withTopInset={false}>
      <View style={styles.content}>
        <SectionHeader title={copy.title} subtitle={copy.subtitle} />

        {controller.isLoading && !snapshot ? (
          <Card style={styles.loading}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={styles.statusTitle}>{copy.loadingTitle}</Text>
            <Text style={styles.body}>{copy.loadingDescription}</Text>
          </Card>
        ) : controller.error && !snapshot ? (
          <Card style={[styles.card, styles.blockedCard]}>
            <Text style={styles.error}>{controller.error}</Text>
            <Button title={copy.runCheckAction} onPress={controller.refresh} />
          </Card>
        ) : snapshot ? (
          <>
            <Card
              style={[
                styles.statusCard,
                snapshot.status === 'blocked' && styles.blockedCard,
              ]}
            >
              <Text style={styles.statusTitle}>{statusTitle}</Text>
              <Text style={styles.body}>{statusDescription}</Text>

              <View style={styles.metricRow}>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>{copy.dreamsLabel}</Text>
                  <Text style={styles.metricValue}>{snapshot.dreamCount}</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>{copy.audioLabel}</Text>
                  <Text style={styles.metricValue}>
                    {snapshot.audioReferenceCount}
                  </Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>{copy.issuesLabel}</Text>
                  <Text style={styles.metricValue}>
                    {countIssues(snapshot.issues)}
                  </Text>
                </View>
              </View>

              <Text style={styles.body}>
                {copy.checkedLabel}:{' '}
                {new Date(snapshot.checkedAt).toLocaleString(
                  controller.locale === 'uk' ? 'uk-UA' : 'en-US',
                )}
              </Text>
            </Card>

            <Card style={styles.card}>
              <Text style={styles.issueTitle}>{copy.issueSectionTitle}</Text>
              {snapshot.issues.length ? (
                <View style={styles.issueList}>
                  {snapshot.issues.map(issue => {
                    const [title, body] = issueCopy(issue.code, copy);
                    return (
                      <View
                        key={issue.code}
                        style={[
                          styles.issue,
                          issue.severity === 'critical' && styles.issueCritical,
                        ]}
                      >
                        <View style={styles.issueTitleRow}>
                          <Text style={styles.issueTitle}>{title}</Text>
                          <Text style={styles.issueCount}>
                            {copy.countTemplate.replace(
                              '{count}',
                              String(issue.count),
                            )}
                          </Text>
                        </View>
                        <Text style={styles.issueBody}>{body}</Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.issue}>
                  <Text style={styles.issueTitle}>{copy.noIssuesTitle}</Text>
                  <Text style={styles.issueBody}>{copy.noIssuesBody}</Text>
                </View>
              )}
            </Card>

            <View style={styles.actionRow}>
              <Button
                title={copy.runCheckAction}
                variant="ghost"
                disabled={controller.isLoading || controller.isRepairing}
                onPress={controller.refresh}
                style={styles.action}
              />
              <Button
                title={
                  controller.isRepairing
                    ? copy.repairingAction
                    : copy.repairAction
                }
                variant="danger"
                disabled={
                  controller.isRepairing ||
                  snapshot.status === 'blocked' ||
                  snapshot.repairActions.length === 0
                }
                onPress={controller.confirmRepair}
                style={styles.action}
              />
            </View>

            {controller.backupPath ? (
              <Card style={styles.card}>
                <Text style={styles.issueTitle}>{copy.repairBackupLabel}</Text>
                <Text selectable style={styles.backupPath}>
                  {controller.backupPath}
                </Text>
              </Card>
            ) : null}

            <View style={styles.note}>
              <Text style={styles.body}>{copy.privacyNote}</Text>
            </View>
          </>
        ) : null}
      </View>
    </ScreenContainer>
  );
}
