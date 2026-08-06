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

describe('crash-safe local transaction integration', () => {
  test('runs recovery before providers, migrations, maintenance, or navigation mount', () => {
    const app = source('App.tsx');
    const providers = source('src/app/AppProvider.tsx');

    expectBefore(app, '<LocalDataRecoveryGate>', '<StorageMigrationGate>');
    expectBefore(app, '<StorageMigrationGate>', '<AppProviders>');
    expectBefore(app, '<AppProviders>', '<AudioCleanupMaintenance />');
    expectBefore(app, '<AppProviders>', '<ArchiveHealthMaintenance />');
    expectBefore(app, '<AppProviders>', '<RootNavigator />');
    expect(providers).not.toContain('runStorageMigrations();');
  });

  test('captures after checkpoint and brackets mutation with journal phases', () => {
    const transaction = source(
      'src/features/settings/services/localDataTransactionService.ts',
    );

    expectBefore(
      transaction,
      'const checkpointFilePath = await createCheckpoint(',
      'const snapshot = captureLocalDataSnapshot();',
    );
    expectBefore(
      transaction,
      'const snapshot = captureLocalDataSnapshot();',
      'const journal = beginLocalDataTransactionJournal({',
    );
    expectBefore(
      transaction,
      'const journal = beginLocalDataTransactionJournal({',
      'value = await operation();',
    );
    expectBefore(
      transaction,
      'value = await operation();',
      'markLocalDataTransactionCommitted(journal.transactionId);',
    );
    expectBefore(
      transaction,
      'markLocalDataTransactionCommitted(journal.transactionId);',
      'clearLocalDataTransactionJournal(journal.transactionId);',
    );
  });

  test('keeps snapshot contents out of observability payloads', () => {
    const transaction = source(
      'src/features/settings/services/localDataTransactionService.ts',
    );
    const journal = source(
      'src/features/settings/services/localDataTransactionJournalService.ts',
    );
    const eventCalls = [
      ...transaction.matchAll(
        /observability\.trackEvent\([\s\S]*?\n {2}\}\);/g,
      ),
      ...journal.matchAll(/observability\.trackEvent\([\s\S]*?\n {2}\}\);/g),
    ].map(match => match[0]);

    expect(eventCalls.length).toBeGreaterThan(0);
    for (const eventCall of eventCalls) {
      expect(eventCall).not.toContain('snapshot');
      expect(eventCall).not.toContain('fixedValues');
      expect(eventCall).not.toContain('journalRaw');
      expect(eventCall).not.toContain('checkpointFilePath');
    }
  });

  test('allows only exact fixed keys and app-owned edit draft keys during restore', () => {
    const snapshot = source(
      'src/features/settings/services/localDataSnapshotService.ts',
    );

    expect(snapshot).toContain('FIXED_TRANSACTION_KEY_SET.has(key)');
    expect(snapshot).toContain(
      'key.startsWith(DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX)',
    );
    expect(snapshot).toContain(
      "throw new Error('Local data snapshot does not cover every fixed key.')",
    );
  });

  test('preserves a blocked raw record before bypassing automatic rollback', () => {
    const journal = source(
      'src/features/settings/services/localDataTransactionJournalService.ts',
    );
    const gate = source(
      'src/features/settings/components/LocalDataRecoveryGate.tsx',
    );
    const quarantineStart = journal.indexOf(
      'export function quarantineInterruptedLocalDataTransaction()',
    );
    const quarantineEnd = journal.indexOf(
      'export function discardQuarantinedLocalDataTransaction()',
    );
    const quarantineBody = journal.slice(quarantineStart, quarantineEnd);

    expectBefore(
      quarantineBody,
      'journalRaw: state.raw',
      'removeJournalValue(LOCAL_DATA_TRANSACTION_JOURNAL_STORAGE_KEY);',
    );
    expect(gate).toContain('quarantineInterruptedLocalDataTransaction();');
    expect(gate).toContain('Continue without automatic rollback');
    expect(gate).not.toContain('RootNavigator');
    expect(gate).not.toContain('runStorageMigrations');
  });
});
