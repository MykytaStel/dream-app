import RNFS from 'react-native-fs';
import {
  decryptDownloadedAudioFile,
  encryptAudioFileForUpload,
  ENCRYPTED_AUDIO_MIME_TYPE,
} from '../src/services/cloud/audioCipher';
import { AudioStreamError } from '../src/services/cloud/audioStreamCipher';
import {
  createVirtualFileSystem,
  expectSameBytes,
  recognisableAudio,
} from './helpers/virtualFileSystem';

/**
 * The upload and download ends of the recording path.
 *
 * The chunk format itself is covered by `audioStreamCipher.test.ts`; what
 * matters here is the file handling around it — where the sealed copy goes, and
 * what is left on disk when something fails.
 */

const KEY = Uint8Array.from({ length: 32 }, (_, index) => index + 7);
const OTHER_KEY = Uint8Array.from({ length: 32 }, (_, index) => index + 90);
const SOURCE = '/documents/note.m4a';

let vfs: ReturnType<typeof createVirtualFileSystem>;

describe('audio encryption', () => {
  beforeEach(() => {
    vfs = createVirtualFileSystem();
    vfs.install();
    (RNFS.moveFile as jest.Mock).mockImplementation(
      async (from: string, to: string) => {
        const file = vfs.get(from);
        if (!file) {
          throw new Error(`ENOENT: ${from}`);
        }
        vfs.put(to, file);
        vfs.files.delete(from);
      },
    );
  });

  test('the recording comes back byte for byte', async () => {
    const original = recognisableAudio(9000);
    vfs.put(SOURCE, original);

    const sealedPath = await encryptAudioFileForUpload(SOURCE, KEY);
    await decryptDownloadedAudioFile(sealedPath, KEY);

    // Decryption replaces the file in place, under the name the player uses.
    expectSameBytes(vfs.get(sealedPath), original);
  });

  test('the sealed copy goes to the cache, not next to the archive', async () => {
    vfs.put(SOURCE, recognisableAudio(1000));

    const sealedPath = await encryptAudioFileForUpload(SOURCE, KEY);

    // Caches can be reclaimed by the system; a stray copy of every recording in
    // the documents directory could not.
    expect(sealedPath).toContain('/caches/');
    expect(vfs.get(SOURCE)).toBeDefined();
  });

  test('what reaches storage is not the recording', async () => {
    const original = recognisableAudio(2048);
    vfs.put(SOURCE, original);

    const sealedPath = await encryptAudioFileForUpload(SOURCE, KEY);

    expect(vfs.get(sealedPath)).not.toEqual(original);
    expect(vfs.get(sealedPath)!.join(',')).not.toContain(
      original.slice(0, 64).join(','),
    );
  });

  test('a recording far past the old 16 MB limit now works', async () => {
    // The single-pass path refused anything over 16 MB. This is the change:
    // length stopped being a reason to fail.
    const original = recognisableAudio(17 * 1024 * 1024);
    vfs.put(SOURCE, original);

    const sealedPath = await encryptAudioFileForUpload(SOURCE, KEY);
    await decryptDownloadedAudioFile(sealedPath, KEY);

    expectSameBytes(vfs.get(sealedPath), original);
  });

  test('a failed decryption leaves nothing playable behind', async () => {
    vfs.put(SOURCE, recognisableAudio(4096));
    const sealedPath = await encryptAudioFileForUpload(SOURCE, KEY);

    await expect(
      decryptDownloadedAudioFile(sealedPath, OTHER_KEY),
    ).rejects.toThrow(AudioStreamError);

    // Neither the blob nor a half-decrypted fragment: handing the player either
    // one would read as the dream being lost rather than an error.
    expect(vfs.get(`${sealedPath}.restored`)).toBeUndefined();
  });

  test('the blob is not declared as audio', () => {
    // The bucket would reject it under the old audio/* list, and a client that
    // trusted the type would try to play a sealed file.
    expect(ENCRYPTED_AUDIO_MIME_TYPE).toBe('application/octet-stream');
  });
});
