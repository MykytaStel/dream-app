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

describe('archive health and recovery integration', () => {
  test('registers one typed route and links it from storage diagnostics', () => {
    const routes = source('src/app/navigation/routes.ts');
    const navigator = source('src/app/navigation/RootNavigator.tsx');
    const storageScreen = source(
      'src/features/settings/screens/SettingsStorageScreen.tsx',
    );

    expect(routes).toContain("ArchiveHealth: 'ArchiveHealth'");
    expect(routes).toContain('[ROOT_ROUTE_NAMES.ArchiveHealth]: undefined');
    expect(navigator).toContain(
      "import ArchiveHealthScreen from '../../features/settings/screens/ArchiveHealthScreen';",
    );
    expect(navigator).toContain('name={ROOT_ROUTE_NAMES.ArchiveHealth}');
    expect(storageScreen).toContain(
      'navigation.navigate(ROOT_ROUTE_NAMES.ArchiveHealth)',
    );
  });

  test('keeps destructive archive writes out of the screen and controller', () => {
    const screen = source(
      'src/features/settings/screens/ArchiveHealthScreen.tsx',
    );
    const controller = source(
      'src/features/settings/hooks/useArchiveHealthController.ts',
    );

    for (const content of [screen, controller]) {
      expect(content).not.toContain('kv.set(');
      expect(content).not.toContain('kv.remove(');
      expect(content).not.toContain('RNFS.unlink(');
      expect(content).not.toContain('replaceAllDreams(');
      expect(content).not.toContain('clearDreamEditDraft(');
    }
    expect(controller).toContain('repairArchiveHealth()');
  });

  test('routes preview and restore through the validated transaction facade', () => {
    const controller = source(
      'src/features/settings/hooks/useBackupScreenController.ts',
    );
    const facade = source(
      'src/features/settings/services/transactionalDreamImportService.ts',
    );
    const importService = source(
      'src/features/settings/services/dataImportService.ts',
    );

    expect(controller).toContain('loadValidatedDreamImportPreview(');
    expect(controller).toContain('restoreDreamImportTransactionally(');
    expect(controller).toContain('buildValidatedRestorePreviewItems(');
    expect(controller).not.toContain('restoreDreamImportFromFile(');
    expect(facade).toContain('prepareDreamImport(parsed.dreams)');
    expectBefore(
      facade,
      'await readImportHealth(filePath);',
      'runLocalDataTransaction(',
    );
    const transactionStart = facade.indexOf('runLocalDataTransaction(');
    expect(
      facade.indexOf('const payload = await readDreamImportPayload(filePath);'),
    ).toBeGreaterThan(transactionStart);
    expect(facade.indexOf('restoreDreamImportPayload(')).toBeGreaterThan(
      transactionStart,
    );
    expect(importService).toContain(
      'export async function restoreDreamImportPayload(',
    );
    expectBefore(
      importService,
      'export async function restoreDreamImportPayload(',
      'export async function restoreDreamImportFromFile(',
    );
  });

  test('creates a checkpoint before archive repair writes begin', () => {
    const transaction = source(
      'src/features/settings/services/localDataTransactionService.ts',
    );
    const repair = source(
      'src/features/settings/services/archiveHealthService.ts',
    );

    expectBefore(
      transaction,
      'const checkpointFilePath = await createCheckpoint(',
      'const value = await operation();',
    );
    expect(repair).toContain("checkpointPolicy: 'required'");
    expect(repair).toContain("status: 'blocked'");
  });

  test('stores aggregate history without ids, audio paths, or dream content', () => {
    const service = source(
      'src/features/settings/services/archiveHealthService.ts',
    );
    const historyType = service.slice(
      service.indexOf('export type ArchiveHealthHistoryEntry'),
      service.indexOf('export type ArchiveRepairResult'),
    );

    expect(historyType).not.toContain('dreamId');
    expect(historyType).not.toContain('audioUri');
    expect(historyType).not.toContain('filePath');
    expect(historyType).not.toContain('text:');
  });
});
