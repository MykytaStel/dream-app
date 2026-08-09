import { act, renderHook } from '@testing-library/react-native';

const mockGetArchiveKey = jest.fn();
const mockGetArchiveRecoveryCode = jest.fn();
const mockImportArchiveKeyFromRecoveryCode = jest.fn();
const mockGetKeySyncAvailability = jest.fn();
const mockHasSeen = jest.fn();
const mockMarkSeen = jest.fn();

jest.mock('../src/services/crypto/archiveKeyService', () => ({
  ARCHIVE_KEY_REQUIRED: 'archive-key-required',
  getArchiveKey: (...args: unknown[]) => mockGetArchiveKey(...args),
  getArchiveRecoveryCode: (...args: unknown[]) =>
    mockGetArchiveRecoveryCode(...args),
  importArchiveKeyFromRecoveryCode: (...args: unknown[]) =>
    mockImportArchiveKeyFromRecoveryCode(...args),
}));

jest.mock('../src/services/security/archiveKeyStorage', () => ({
  getKeySyncAvailability: (...args: unknown[]) =>
    mockGetKeySyncAvailability(...args),
}));

jest.mock(
  '../src/features/settings/services/archiveKeyStrandedDisclosureService',
  () => ({
    hasSeenArchiveKeyStrandedDisclosure: () => mockHasSeen(),
    markArchiveKeyStrandedDisclosureSeen: () => mockMarkSeen(),
  }),
);

const {
  useArchiveKeyController,
} = require('../src/features/settings/hooks/useArchiveKeyController');

beforeEach(() => {
  mockGetArchiveKey.mockReset().mockResolvedValue(new Uint8Array([1]));
  mockGetArchiveRecoveryCode.mockReset();
  mockImportArchiveKeyFromRecoveryCode.mockReset();
  mockGetKeySyncAvailability
    .mockReset()
    .mockResolvedValue({ status: 'unavailable', reason: 'device-backup-off' });
  mockHasSeen.mockReset().mockReturnValue(false);
  mockMarkSeen.mockReset();
});

describe('useArchiveKeyController stranded disclosure', () => {
  test('shows once when the key is stranded and unseen', async () => {
    const { result } = await renderHook(() => useArchiveKeyController());

    await act(async () => {});

    expect(result.current.presentation.tone).toBe('attention');
    expect(result.current.showStrandedDisclosure).toBe(true);
  });

  test('dismissing marks it seen and hides it immediately', async () => {
    const { result } = await renderHook(() => useArchiveKeyController());

    await act(async () => {});
    expect(result.current.showStrandedDisclosure).toBe(true);

    await act(async () => {
      result.current.onDismissStrandedDisclosure();
    });

    expect(mockMarkSeen).toHaveBeenCalledTimes(1);
    expect(result.current.showStrandedDisclosure).toBe(false);
  });

  test('never shows when already seen', async () => {
    mockHasSeen.mockReturnValue(true);

    const { result } = await renderHook(() => useArchiveKeyController());

    await act(async () => {});

    expect(result.current.presentation.tone).toBe('attention');
    expect(result.current.showStrandedDisclosure).toBe(false);
  });
});
