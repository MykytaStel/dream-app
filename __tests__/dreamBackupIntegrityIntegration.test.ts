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

describe('verifiable backup integrity integration', () => {
  test('signs version nine restore files before the JSON write', () => {
    const exportService = source(
      'src/features/settings/services/dataExportService.ts',
    );

    expect(exportService).toContain('export const DREAM_EXPORT_VERSION = 9;');
    expectBefore(
      exportService,
      'const payload = attachDreamBackupIntegrity(',
      'await RNFS.writeFile(filePath, JSON.stringify(payload, null, 2)',
    );
    expect(exportService).not.toContain('digest: fileName');
    expect(exportService).not.toContain('payload.integrity.digest');
  });

  test('uses the same signed exporter for transaction checkpoints', () => {
    const transaction = source(
      'src/features/settings/services/localDataTransactionService.ts',
    );

    expect(transaction).toContain(
      "import { exportDreamDataSnapshot } from './dataExportService';",
    );
    expectBefore(
      transaction,
      'const result = await exportDreamDataSnapshot();',
      'const value = await operation();',
    );
  });

  test('verifies the raw logical payload before structural import parsing', () => {
    const importService = source(
      'src/features/settings/services/dataImportService.ts',
    );

    expectBefore(
      importService,
      'const integrityStatus = verifyDreamBackupIntegrity(value,',
      'if (!isAppLocale(value.locale))',
    );
    expect(importService).toContain(
      'const sourceDigest = computeDreamBackupDigest(value);',
    );
    expect(importService).toContain(
      'required: value.version >= DREAM_EXPORT_VERSION',
    );
  });

  test('builds preview from one read and rechecks the fingerprint in the queue', () => {
    const facade = source(
      'src/features/settings/services/transactionalDreamImportService.ts',
    );
    const previewStart = facade.indexOf(
      'export async function loadValidatedDreamImportPreview(',
    );
    const restoreStart = facade.indexOf(
      'export async function restoreDreamImportTransactionally(',
    );
    const previewBody = facade.slice(previewStart, restoreStart);
    const restoreBody = facade.slice(restoreStart);

    expect(previewBody.match(/readDreamImportPayload\(/g)).toHaveLength(1);
    expect(previewBody).toContain('previewSourceDigests.set(');
    expect(previewBody).not.toContain('loadDreamImportPreview(');

    expectBefore(
      restoreBody,
      'const preflightPayload = await readDreamImportPayload(filePath);',
      'const transaction = await runLocalDataTransaction(',
    );
    expect(restoreBody.match(/readDreamImportPayload\(/g)).toHaveLength(2);
    expectBefore(
      restoreBody,
      'assertSourceDigest(payload.sourceDigest, expectedSourceDigest);',
      'const preview = await restoreDreamImportPayload(',
    );
  });

  test('does not expose digest values through presentation or observability', () => {
    const facade = source(
      'src/features/settings/services/transactionalDreamImportService.ts',
    );
    const presentation = source(
      'src/features/settings/model/dreamImportHealthPresentation.ts',
    );
    const eventCalls = [
      ...facade.matchAll(/observability\.trackEvent\([\s\S]*?\n {2}\}\);/g),
    ].map(match => match[0]);

    expect(eventCalls.length).toBeGreaterThan(0);
    for (const eventCall of eventCalls) {
      expect(eventCall).not.toContain('sourceDigest');
      expect(eventCall).not.toContain('integrity.digest');
    }
    expect(presentation).not.toContain('sourceDigest');
    expect(presentation).not.toContain('integrity.digest');
  });
});
