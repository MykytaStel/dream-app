import fs from 'node:fs';
import path from 'node:path';

function source(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

function expectBefore(content: string, first: string, second: string) {
  const firstIndex = content.indexOf(first);
  const secondIndex = content.indexOf(second);
  expect(firstIndex).toBeGreaterThanOrEqual(0);
  expect(secondIndex).toBeGreaterThan(firstIndex);
}

describe('transactional storage migration integration', () => {
  test('runs recovery, then migration, then providers and application work', () => {
    const app = source('App.tsx');

    expectBefore(app, '<LocalDataRecoveryGate>', '<StorageMigrationGate>');
    expectBefore(app, '<StorageMigrationGate>', '<AppProviders>');
    expectBefore(app, '<AppProviders>', '<AudioCleanupMaintenance />');
    expectBefore(app, '<AppProviders>', '<ArchiveHealthMaintenance />');
    expectBefore(app, '<AppProviders>', '<RootNavigator />');
  });

  test('removes fire-and-forget migrations from AppProvider', () => {
    const provider = source('src/app/AppProvider.tsx');

    expect(provider).not.toContain("from '../services/storage/migrations'");
    expect(provider).not.toContain('runStorageMigrations();');
    expect(provider).toContain(
      'Storage recovery and migrations are completed by the startup gates',
    );
  });

  test('runs the legacy migration engine only inside the durable transaction', () => {
    const service = source('src/services/storage/storageMigrationService.ts');

    expectBefore(
      service,
      'await runLocalDataTransaction(',
      'const migratedVersion = runStorageMigrations();',
    );
    expect(service).toContain("checkpointPolicy: 'none'");
    expect(service).toContain(
      'label: `storage-migration-v${fromVersion}-v${CURRENT_STORAGE_SCHEMA_VERSION}`',
    );
    expect(service).toContain(
      "throw new StorageMigrationContractError('migration-incomplete')",
    );
  });

  test('blocks providers for invalid, newer, unreadable, or failed migration states', () => {
    const gate = source('src/services/storage/StorageMigrationGate.tsx');

    expect(gate).toContain("result.reason === 'invalid-schema-marker'");
    expect(gate).toContain("result.reason === 'newer-schema'");
    expect(gate).toContain('copy.unreadableArchive');
    expect(gate).toContain('copy.failedNeedsRestart');
    expect(gate).not.toContain('Continue without migration');
    expect(gate).not.toContain('RootNavigator');
    expect(gate).not.toContain('AppProviders');
  });

  test('does not change the signed journal or exact snapshot schema', () => {
    const snapshot = source(
      'src/features/settings/services/localDataSnapshotService.ts',
    );
    const journal = source(
      'src/features/settings/services/localDataTransactionJournalService.ts',
    );

    expect(snapshot).not.toContain('STORAGE_MIGRATION_HISTORY_STORAGE_KEY');
    expect(journal).toContain('LOCAL_DATA_TRANSACTION_JOURNAL_VERSION = 1');
    expect(journal).not.toContain('storage-migration-history');
  });

  test('keeps migration events free of archive and journal content', () => {
    const service = source('src/services/storage/storageMigrationService.ts');
    const eventCalls = [
      ...service.matchAll(/observability\.trackEvent\([\s\S]*?\n {4}\}\);/g),
    ].map(match => match[0]);

    expect(eventCalls.length).toBeGreaterThan(0);
    for (const call of eventCalls) {
      expect(call).not.toContain('DREAMS_STORAGE_KEY');
      expect(call).not.toContain('snapshot');
      expect(call).not.toContain('journal');
      expect(call).not.toContain('checkpointFilePath');
    }
  });
});
