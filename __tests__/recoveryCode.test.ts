import {
  ARCHIVE_KEY_BYTES,
  InvalidRecoveryCodeError,
  RECOVERY_WORD_COUNT,
  decodeRecoveryCode,
  encodeRecoveryCode,
  isRecoveryCodeValid,
  normalizeRecoveryCode,
} from '../src/services/crypto/recoveryCode';

function key(fill: number): Uint8Array {
  return Uint8Array.from(
    { length: ARCHIVE_KEY_BYTES },
    (_, i) => (fill + i) % 256,
  );
}

describe('recovery code', () => {
  test('a key survives the round trip exactly', () => {
    const original = key(7);

    expect(decodeRecoveryCode(encodeRecoveryCode(original))).toEqual(original);
  });

  test('the code is the expected number of words', () => {
    expect(encodeRecoveryCode(key(1)).split(' ')).toHaveLength(
      RECOVERY_WORD_COUNT,
    );
  });

  test('different keys produce different codes', () => {
    expect(encodeRecoveryCode(key(1))).not.toBe(encodeRecoveryCode(key(2)));
  });

  // The realistic failure is a person transcribing from paper, so the cases
  // below are the mistakes they actually make.
  test('a mistyped word is rejected rather than silently accepted', () => {
    const words = encodeRecoveryCode(key(3)).split(' ');
    words[5] = 'zebra';

    expect(() => decodeRecoveryCode(words.join(' '))).toThrow(
      InvalidRecoveryCodeError,
    );
  });

  test('two swapped words are rejected', () => {
    const words = encodeRecoveryCode(key(4)).split(' ');
    [words[2], words[9]] = [words[9], words[2]];

    expect(isRecoveryCodeValid(words.join(' '))).toBe(false);
  });

  test('a missing word is rejected', () => {
    const words = encodeRecoveryCode(key(5)).split(' ');
    words.pop();

    expect(isRecoveryCodeValid(words.join(' '))).toBe(false);
  });

  test('a word that is not in the list is rejected', () => {
    expect(isRecoveryCodeValid('notaword '.repeat(24))).toBe(false);
  });

  // How a code actually arrives: pasted from a note, with whatever formatting
  // the note app applied.
  test('extra whitespace, line breaks and case do not matter', () => {
    const original = key(11);
    const code = encodeRecoveryCode(original);
    const messy = `  ${code.split(' ').join('\n  ').toUpperCase()}  `;

    expect(decodeRecoveryCode(messy)).toEqual(original);
  });

  test('normalizing collapses formatting to single spaces', () => {
    expect(normalizeRecoveryCode('  One\n\tTWO   three ')).toBe(
      'one two three',
    );
  });

  test('a key of the wrong size is refused', () => {
    expect(() => encodeRecoveryCode(new Uint8Array(16))).toThrow(
      InvalidRecoveryCodeError,
    );
  });
});
