/* eslint-disable no-bitwise -- the stand-in primitive below is defined in terms
   of bit operations, same as the real one it replaces. */
import {
  fromSealedDreamContent,
  openDreamSyncBundle,
  sealDreamSyncBundle,
  SealedPayloadVersionError,
  toSealedDreamContent,
  CLEARTEXT_ENTRY_COLUMNS,
  type SealedDreamContent,
} from '../src/services/api/contracts/dreamSyncCipher';
import {
  createDreamSyncBundle,
  hydrateDreamFromSyncBundle,
} from '../src/services/api/contracts/dreamSync';
import {
  createKeyCheck,
  decryptRecord,
  encryptRecord,
  isKeyCheckValid,
  ArchiveDecryptionError,
  CIPHER_VERSION,
  type AeadPrimitive,
} from '../src/services/crypto/archiveCipher';
import type { Dream } from '../src/features/dreams/model/dream';

/**
 * The promise this whole change exists to make true is that dream content does
 * not leave the device readable. These tests check the promise, not the
 * implementation: the last one takes the payload that would go over the wire
 * and searches it for the words the user typed.
 */

// A real AEAD is not available in Jest — libsodium is native. This stand-in is
// deliberately weak but has the two properties the framing depends on: output
// differs from input, and a wrong key fails loudly rather than returning junk.
function createFakeAead(): AeadPrimitive {
  let nonceCounter = 0;

  const xor = (bytes: Uint8Array, key: Uint8Array, nonce: Uint8Array) =>
    bytes.map(
      (byte, index) =>
        byte ^ key[index % key.length] ^ nonce[index % nonce.length],
    );

  return {
    randomBytes(length) {
      nonceCounter += 1;
      return Uint8Array.from({ length }, (_, index) =>
        index === 0 ? nonceCounter & 0xff : (index * 31 + nonceCounter) & 0xff,
      );
    },
    encrypt(plaintext, nonce, key) {
      const body = xor(plaintext, key, nonce);
      // A one-byte tag: enough to make a wrong key or a flipped byte fail.
      const tag = body.reduce((sum, byte) => (sum + byte) & 0xff, key[0]);
      const sealed = new Uint8Array(body.length + 1);
      sealed.set(body, 0);
      sealed[body.length] = tag;
      return sealed;
    },
    decrypt(ciphertext, nonce, key) {
      const body = ciphertext.slice(0, -1);
      const tag = ciphertext[ciphertext.length - 1];
      const expected = body.reduce((sum, byte) => (sum + byte) & 0xff, key[0]);
      if (tag !== expected) {
        throw new Error('authentication failed');
      }
      return xor(body, key, nonce);
    },
  };
}

const aead = createFakeAead();
const KEY = Uint8Array.from({ length: 32 }, (_, index) => index + 1);
const OTHER_KEY = Uint8Array.from({ length: 32 }, (_, index) => index + 100);

const seal = (key: Uint8Array) => (content: SealedDreamContent) =>
  encryptRecord(content, key, aead);
const open = (key: Uint8Array) => (ciphertext: string) =>
  decryptRecord(ciphertext, key, aead);

const SECRET_TITLE = 'Лабіринт із дзеркал';
const SECRET_TEXT = 'Я йшов коридором, і кожне дзеркало показувало інший рік.';
const SECRET_TRANSCRIPT = 'мене хтось кликав на імʼя';
const SECRET_TAG = 'дзеркала';
const SECRET_MEDICATION = 'мелатонін 3 мг';
const SECRET_HEALTH_NOTE = 'мігрень третій день';
const SECRET_SUMMARY = 'Повторюваний мотив пошуку себе.';

function buildDream(): Dream {
  return {
    id: 'dream-1',
    createdAt: Date.parse('2026-07-01T05:00:00.000Z'),
    updatedAt: Date.parse('2026-07-01T06:00:00.000Z'),
    archivedAt: Date.parse('2026-07-02T06:00:00.000Z'),
    starredAt: Date.parse('2026-07-03T06:00:00.000Z'),
    sleepDate: '2026-06-30',
    title: SECRET_TITLE,
    text: SECRET_TEXT,
    transcript: SECRET_TRANSCRIPT,
    transcriptStatus: 'ready',
    transcriptSource: 'generated',
    transcriptUpdatedAt: Date.parse('2026-07-01T05:30:00.000Z'),
    audioRemotePath: 'user-1/dream-1/recording.m4a',
    mood: 'negative',
    lucidity: 2,
    tags: [SECRET_TAG, 'коридор'],
    wakeEmotions: ['disoriented', 'curious'],
    sleepContext: {
      stressLevel: 2,
      alcoholTaken: false,
      caffeineLate: true,
      medications: SECRET_MEDICATION,
      importantEvents: 'співбесіда',
      healthNotes: SECRET_HEALTH_NOTE,
      preSleepEmotions: ['anxious', 'restless'],
    },
    analysis: {
      provider: 'manual',
      status: 'ready',
      summary: SECRET_SUMMARY,
      themes: ['пошук', 'відображення'],
      generatedAt: Date.parse('2026-07-01T07:00:00.000Z'),
    },
  } as Dream;
}

describe('sealed dream content', () => {
  const bundle = createDreamSyncBundle(buildDream(), 'user-1');

  test('round-trips through seal and open unchanged', () => {
    const row = sealDreamSyncBundle(bundle, seal(KEY), CIPHER_VERSION);
    const reopened = openDreamSyncBundle(row, open(KEY));

    expect(reopened).toEqual(bundle);
  });

  test('survives the trip all the way back to a Dream', () => {
    const row = sealDreamSyncBundle(bundle, seal(KEY), CIPHER_VERSION);
    const dream = hydrateDreamFromSyncBundle(
      openDreamSyncBundle(row, open(KEY)),
    );

    expect(dream.title).toBe(SECRET_TITLE);
    expect(dream.text).toBe(SECRET_TEXT);
    expect(dream.tags).toEqual([SECRET_TAG, 'коридор']);
    expect(dream.wakeEmotions).toEqual(['disoriented', 'curious']);
    expect(dream.sleepContext?.medications).toBe(SECRET_MEDICATION);
    expect(dream.sleepContext?.healthNotes).toBe(SECRET_HEALTH_NOTE);
    expect(dream.sleepContext?.preSleepEmotions).toEqual([
      'anxious',
      'restless',
    ]);
    expect(dream.analysis?.summary).toBe(SECRET_SUMMARY);
  });

  test('the uploaded row contains none of the content, anywhere in it', () => {
    const row = sealDreamSyncBundle(bundle, seal(KEY), CIPHER_VERSION);
    const wire = JSON.stringify(row);

    for (const secret of [
      SECRET_TITLE,
      SECRET_TEXT,
      SECRET_TRANSCRIPT,
      SECRET_TAG,
      SECRET_MEDICATION,
      SECRET_HEALTH_NOTE,
      SECRET_SUMMARY,
      'співбесіда',
      // Structural leaks: a mood or an emotion name in the clear still
      // describes the dream.
      'disoriented',
      'negative',
      '2026-06-30',
    ]) {
      expect(wire).not.toContain(secret);
    }
  });

  test('the row carries only the columns the server is allowed to read', () => {
    const row = sealDreamSyncBundle(bundle, seal(KEY), CIPHER_VERSION);

    expect(Object.keys(row).sort()).toEqual(
      [
        ...Object.keys(CLEARTEXT_ENTRY_COLUMNS),
        'ciphertext',
        'cipher_version',
      ].sort(),
    );
  });

  test('a different key cannot open it', () => {
    const row = sealDreamSyncBundle(bundle, seal(KEY), CIPHER_VERSION);

    expect(() => openDreamSyncBundle(row, open(OTHER_KEY))).toThrow(
      ArchiveDecryptionError,
    );
  });

  test('a single flipped byte is detected rather than decoded', () => {
    const row = sealDreamSyncBundle(bundle, seal(KEY), CIPHER_VERSION);
    const characters = row.ciphertext.split('');
    const index = characters.length - 4;
    characters[index] = characters[index] === 'A' ? 'B' : 'A';

    expect(() =>
      openDreamSyncBundle(
        { ...row, ciphertext: characters.join('') },
        open(KEY),
      ),
    ).toThrow(ArchiveDecryptionError);
  });

  test('the same dream sealed twice produces different ciphertext', () => {
    const first = sealDreamSyncBundle(bundle, seal(KEY), CIPHER_VERSION);
    const second = sealDreamSyncBundle(bundle, seal(KEY), CIPHER_VERSION);

    expect(first.ciphertext).not.toBe(second.ciphertext);
    // ...and both still open to the same thing.
    expect(openDreamSyncBundle(first, open(KEY))).toEqual(
      openDreamSyncBundle(second, open(KEY)),
    );
  });

  test('an unknown payload version is refused, not guessed at', () => {
    const content = {
      ...toSealedDreamContent(bundle),
      payloadVersion: 99,
    } as unknown as SealedDreamContent;

    expect(() =>
      fromSealedDreamContent(content, {
        id: 'dream-1',
        user_id: 'user-1',
        updated_at: '2026-07-01T06:00:00.000Z',
        audio_storage_path: null,
      }),
    ).toThrow(SealedPayloadVersionError);
  });

  test('tag and emotion order survives without a position column', () => {
    const many = createDreamSyncBundle(
      { ...buildDream(), tags: ['зет', 'альфа', 'бета'] } as Dream,
      'user-1',
    );
    const row = sealDreamSyncBundle(many, seal(KEY), CIPHER_VERSION);

    expect(
      openDreamSyncBundle(row, open(KEY)).tags.map(tag => tag.tag),
    ).toEqual(['зет', 'альфа', 'бета']);
  });
});

describe('archive key check', () => {
  test('the right key opens it', () => {
    expect(isKeyCheckValid(createKeyCheck(KEY, aead), KEY, aead)).toBe(true);
  });

  test('a different key does not, so a split archive is caught first', () => {
    expect(isKeyCheckValid(createKeyCheck(KEY, aead), OTHER_KEY, aead)).toBe(
      false,
    );
  });

  test('garbage is rejected rather than thrown out of', () => {
    expect(isKeyCheckValid('not-a-real-check', KEY, aead)).toBe(false);
  });
});
