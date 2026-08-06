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
import { getArchiveHealthCopy } from '../../../constants/copy/archiveHealth';
import { Theme } from '../../../theme/theme';
import {
  formatStorageBytes,
  formatStorageUpdatedAt,
} from '../model/storageDiagnosticsPresentation';
import { useStorageDiagnosticsController } from '../hooks/useStorageDiagnosticsController';
import { createSettingsStorageScreenStyles } from './SettingsStorageScreen.styles';

type MetricProps = {
  label: string;
  value: string;
};

function StorageMetric({ label, value }: MetricProps) {
  const theme = useTheme<Theme>();
  const styles = React.useMemo(
    () => createSettingsStorageScreenStyles(theme),
    [theme],
  );

  return (
    <View style={styles.metricTile}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

export default function SettingsStorageScreen() {
  const theme = useTheme<Theme>();
  const styles = React.useMemo(
    () => createSettingsStorageScreenStyles(theme),
    [theme],
  );
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const controller = useStorageDiagnosticsController();
  const { copy, locale, snapshot } = controller;
  const healthCopy = React.useMemo(
    () => getArchiveHealthCopy(locale),
    [locale],
  );
  const displayBytes = React.useCallback(
    (value: number | null | undefined) =>
      formatStorageBytes(value, locale) ?? copy.unavailableValue,
    [copy.unavailableValue, locale],
  );

  return (
    <ScreenContainer scroll withTopInset={false}>
      <View style={styles.content}>
        <SectionHeader title={copy.title} subtitle={copy.subtitle} />

        {controller.isLoading && !snapshot ? (
          <Card style={styles.loadingCard}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={styles.loadingTitle}>{copy.loadingTitle}</Text>
            <Text style={styles.loadingDescription}>
              {copy.loadingDescription}
            </Text>
          </Card>
        ) : null}

        {controller.loadError ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorTitle}>{copy.loadErrorTitle}</Text>
            <Text style={styles.description}>{controller.loadError}</Text>
            <Button
              title={copy.retryAction}
              onPress={() => controller.refresh().catch(() => undefined)}
              variant="ghost"
              disabled={controller.isLoading}
            />
          </Card>
        ) : null}

        {snapshot ? (
          <>
            <Card style={styles.summaryCard}>
              <SectionHeader
                title={copy.totalKnownTitle}
                subtitle={copy.totalKnownDescription}
              />
              <Text style={styles.summaryValue}>
                {displayBytes(snapshot.totalKnownBytes)}
              </Text>
              {!snapshot.isComplete ? (
                <Text style={styles.warning}>{copy.incompleteTotalNote}</Text>
              ) : null}
              <Text style={styles.updated}>
                {copy.refreshedLabel}:{' '}
                {formatStorageUpdatedAt(snapshot.refreshedAt, locale)}
              </Text>
              <Button
                title={copy.refreshAction}
                onPress={() => controller.refresh().catch(() => undefined)}
                variant="ghost"
                disabled={
                  controller.isLoading || controller.activeAction !== null
                }
              />
            </Card>

            <Card style={styles.card}>
              <SectionHeader
                title={healthCopy.storageEntryTitle}
                subtitle={healthCopy.storageEntryDescription}
              />
              <Button
                title={healthCopy.storageEntryTitle}
                onPress={() =>
                  navigation.navigate(ROOT_ROUTE_NAMES.ArchiveHealth)
                }
                disabled={controller.activeAction !== null}
              />
            </Card>

            <Card style={styles.card}>
              <SectionHeader
                title={copy.audioTitle}
                subtitle={copy.audioDescription}
              />
              <View style={styles.metricGrid}>
                <StorageMetric
                  label={copy.filesLabel}
                  value={
                    snapshot.audio.fileCount === null
                      ? copy.unavailableValue
                      : String(snapshot.audio.fileCount)
                  }
                />
                <StorageMetric
                  label={copy.sizeLabel}
                  value={displayBytes(snapshot.audio.sizeBytes)}
                />
                <StorageMetric
                  label={copy.audioProtectedLabel}
                  value={
                    snapshot.audio.protectedFileCount === null
                      ? copy.unavailableValue
                      : `${snapshot.audio.protectedFileCount} · ${displayBytes(
                          snapshot.audio.protectedSizeBytes,
                        )}`
                  }
                />
                <StorageMetric
                  label={copy.audioUnlinkedLabel}
                  value={
                    snapshot.audio.unlinkedFileCount === null
                      ? copy.unavailableValue
                      : `${snapshot.audio.unlinkedFileCount} · ${displayBytes(
                          snapshot.audio.unlinkedSizeBytes,
                        )}`
                  }
                />
                <StorageMetric
                  label={copy.audioMaintenanceEligibleLabel}
                  value={
                    snapshot.audio.maintenanceEligibleFileCount === null
                      ? copy.unavailableValue
                      : `${snapshot.audio.maintenanceEligibleFileCount} · ${displayBytes(
                          snapshot.audio.maintenanceEligibleSizeBytes,
                        )}`
                  }
                />
              </View>
              {!snapshot.audio.ownershipComplete ? (
                <Text style={styles.warning}>
                  {copy.audioOwnershipIncomplete}
                </Text>
              ) : null}
              <Button
                title={copy.audioCleanupAction}
                onPress={controller.confirmAudioCleanup}
                variant="danger"
                disabled={
                  !snapshot.audio.ownershipComplete ||
                  !snapshot.audio.unlinkedFileCount ||
                  controller.activeAction !== null
                }
              />
            </Card>

            <Card style={styles.card}>
              <SectionHeader
                title={copy.transcriptionTitle}
                subtitle={copy.transcriptionDescription}
              />
              <View style={styles.metricGrid}>
                <StorageMetric
                  label={copy.sizeLabel}
                  value={
                    snapshot.transcriptionModel.installed
                      ? displayBytes(snapshot.transcriptionModel.sizeBytes)
                      : copy.notInstalledValue
                  }
                />
              </View>
              <Button
                title={copy.transcriptionDeleteAction}
                onPress={controller.confirmDeleteModel}
                variant="danger"
                disabled={
                  !snapshot.transcriptionModel.installed ||
                  controller.activeAction !== null
                }
              />
            </Card>

            <Card style={styles.card}>
              <SectionHeader
                title={copy.exportsTitle}
                subtitle={copy.exportsDescription}
              />
              <View style={styles.metricGrid}>
                <StorageMetric
                  label={copy.filesLabel}
                  value={
                    snapshot.exports.fileCount === null
                      ? copy.unavailableValue
                      : String(snapshot.exports.fileCount)
                  }
                />
                <StorageMetric
                  label={copy.sizeLabel}
                  value={displayBytes(snapshot.exports.sizeBytes)}
                />
              </View>
              <Button
                title={copy.exportsDeleteAction}
                onPress={controller.confirmDeleteExports}
                variant="danger"
                disabled={
                  !snapshot.exports.fileCount ||
                  controller.activeAction !== null
                }
              />
            </Card>

            <Card style={styles.card}>
              <SectionHeader
                title={copy.localDataTitle}
                subtitle={copy.localDataDescription}
              />
              <View style={styles.metricGrid}>
                <StorageMetric
                  label={copy.localDataKeysLabel}
                  value={
                    snapshot.localData.keyCount === null
                      ? copy.unavailableValue
                      : String(snapshot.localData.keyCount)
                  }
                />
                <StorageMetric
                  label={copy.sizeLabel}
                  value={displayBytes(snapshot.localData.estimatedSizeBytes)}
                />
              </View>
              <View style={styles.noteCard}>
                <Text style={styles.noteText}>{copy.noDeleteNote}</Text>
              </View>
            </Card>
          </>
        ) : null}
      </View>
    </ScreenContainer>
  );
}
