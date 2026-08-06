jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/documents',
  ExternalDirectoryPath: '/external',
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
}));

import RNFS from 'react-native-fs';
import { kv } from '../src/services/storage/mmkv';
import {
  DREAM_EXPORT_VERSION,
  exportDreamDataSnapshot,
} from '../src/features/settings/services/dataExportService';
import { verifyDreamBackupIntegrity } from '../src/features/settings/services/dreamBackupIntegrityService';

describe('dream backup export integrity', () => {
  beforeEach(() => {
    kv.clearAll();
    jest.clearAllMocks();
  });

  test('persists a version nine restore file with a verifiable manifest', async () => {
    const result = await exportDreamDataSnapshot();

    expect(result.payload).toMatchObject({
      version: DREAM_EXPORT_VERSION,
      integrity: {
        algorithm: 'sha256',
        digest: expect.stringMatching(/^[a-f0-9]{64}$/),
      },
    });
    expect(verifyDreamBackupIntegrity(result.payload, { required: true })).toBe(
      'verified',
    );

    const written = JSON.parse(
      (RNFS.writeFile as jest.Mock).mock.calls[0][1],
    ) as Record<string, unknown>;
    expect(written).toEqual(result.payload);
    expect(verifyDreamBackupIntegrity(written, { required: true })).toBe(
      'verified',
    );
  });

  test('does not put dream content or digest values into the file name', async () => {
    const result = await exportDreamDataSnapshot();
    const digest = result.payload.integrity?.digest;

    expect(digest).toMatch(/^[a-f0-9]{64}$/);
    expect(result.filePath).toMatch(
      /^\/documents\/exports\/kaleidoskop-export-.*\.json$/,
    );
    expect(result.filePath).not.toContain(digest as string);
  });
});
