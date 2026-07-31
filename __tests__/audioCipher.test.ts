import RNFS from 'react-native-fs';
import {
  decryptDownloadedAudioFile,
  encryptAudioFileForUpload,
  AudioTooLargeToEncryptError,
  MAX_ENCRYPTABLE_AUDIO_BYTES,
} from '../src/services/cloud/audioCipher';
import { createArchiveSealer } from '../src/services/crypto/archiveKeyService';
import { ArchiveDecryptionError } from '../src/services/crypto/archiveCipher';

/**
 * A voice note is the dream, narrated. Encrypting the text and shipping the
 * recording in the clear would leave the promise broken while looking kept, so
 * these check the recording specifically — including that what reaches storage
 * is not the audio.
 */

const KEY = Uint8Array.from({ length: 32 }, (_, index) => index + 7);
const OTHER_KEY = Uint8Array.from({ length: 32 }, (_, index) => index + 90);

const sealer = createArchiveSealer(KEY);
const otherSealer = createArchiveSealer(OTHER_KEY);

// A stand-in for the m4a header plus some payload: recognisable bytes that must
// not survive into what gets uploaded.
const RECORDING_BASE64 = 'AAAAHGZ0eXBNNEEgAAAAAE00QSBtcDQyaXNvbQ==';

const mockedStat = RNFS.stat as jest.Mock;
const mockedReadFile = RNFS.readFile as jest.Mock;
const mockedWriteFile = RNFS.writeFile as jest.Mock;

function fileOnDisk(base64: string, sizeBytes = 1024) {
  mockedStat.mockResolvedValue({ size: String(sizeBytes) });
  mockedReadFile.mockResolvedValue(base64);
}

/** What the last writeFile call put on disk, as base64. */
function lastWrittenBase64(): string {
  const calls = mockedWriteFile.mock.calls;
  return calls[calls.length - 1][1] as string;
}

describe('audio encryption', () => {
  beforeEach(() => {
    mockedStat.mockReset();
    mockedReadFile.mockReset();
    mockedWriteFile.mockReset().mockResolvedValue(undefined);
  });

  test('the recording comes back byte for byte', async () => {
    fileOnDisk(RECORDING_BASE64);

    await encryptAudioFileForUpload('/documents/note.m4a', sealer.sealBytes);
    const uploaded = lastWrittenBase64();

    fileOnDisk(uploaded);
    await decryptDownloadedAudioFile('/documents/note.m4a', sealer.openBytes);

    expect(lastWrittenBase64()).toBe(RECORDING_BASE64);
  });

  test('what reaches storage is not the recording', async () => {
    fileOnDisk(RECORDING_BASE64);

    await encryptAudioFileForUpload('/documents/note.m4a', sealer.sealBytes);

    expect(lastWrittenBase64()).not.toBe(RECORDING_BASE64);
    // 'ftypM4A' — the container marker — must not survive into the blob.
    expect(lastWrittenBase64()).not.toContain('ZnR5cE00QSA');
  });

  test('sealing the same recording twice gives different blobs', async () => {
    fileOnDisk(RECORDING_BASE64);
    await encryptAudioFileForUpload('/documents/note.m4a', sealer.sealBytes);
    const first = lastWrittenBase64();

    fileOnDisk(RECORDING_BASE64);
    await encryptAudioFileForUpload('/documents/note.m4a', sealer.sealBytes);

    expect(lastWrittenBase64()).not.toBe(first);
  });

  test('another key cannot open it', async () => {
    fileOnDisk(RECORDING_BASE64);
    await encryptAudioFileForUpload('/documents/note.m4a', sealer.sealBytes);

    fileOnDisk(lastWrittenBase64());

    await expect(
      decryptDownloadedAudioFile('/documents/note.m4a', otherSealer.openBytes),
    ).rejects.toThrow(ArchiveDecryptionError);
  });

  test('a truncated download is refused rather than written back as audio', async () => {
    fileOnDisk('AAAA');

    await expect(
      decryptDownloadedAudioFile('/documents/note.m4a', sealer.openBytes),
    ).rejects.toThrow(ArchiveDecryptionError);
    expect(mockedWriteFile).not.toHaveBeenCalled();
  });

  /**
   * The single-pass path holds roughly four copies of the file at once. Above
   * the bound it must fail with something the caller can report, not by running
   * the device out of memory — and above all not by falling back to an
   * unencrypted upload.
   */
  test('an oversized recording fails loudly instead of being uploaded in the clear', async () => {
    fileOnDisk(RECORDING_BASE64, MAX_ENCRYPTABLE_AUDIO_BYTES + 1);

    await expect(
      encryptAudioFileForUpload('/documents/long.m4a', sealer.sealBytes),
    ).rejects.toThrow(AudioTooLargeToEncryptError);
    expect(mockedWriteFile).not.toHaveBeenCalled();
  });

  test('a recording exactly at the bound is still accepted', async () => {
    fileOnDisk(RECORDING_BASE64, MAX_ENCRYPTABLE_AUDIO_BYTES);

    await expect(
      encryptAudioFileForUpload('/documents/edge.m4a', sealer.sealBytes),
    ).resolves.toEqual(expect.stringContaining('/caches/'));
  });
});
