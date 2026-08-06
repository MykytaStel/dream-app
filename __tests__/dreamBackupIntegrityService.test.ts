import {
  attachDreamBackupIntegrity,
  canonicalizeDreamBackup,
  computeDreamBackupDigest,
  sha256Hex,
  verifyDreamBackupIntegrity,
} from '../src/features/settings/services/dreamBackupIntegrityService';

describe('dream backup integrity service', () => {
  test.each([
    ['', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'],
    ['abc', 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'],
    [
      'Калейдоскоп снів',
      '637ba9a21c2459f59656336930c0f8a43848acbcef97dc132ce02f2cbc7e355e',
    ],
  ])('matches the SHA-256 vector for %p', (value, digest) => {
    expect(sha256Hex(value)).toBe(digest);
  });

  test('canonicalizes object keys without changing array order', () => {
    const left = {
      version: 9,
      dreams: [
        { title: 'First', id: 'one' },
        { id: 'two', title: 'Second' },
      ],
      summary: { dreamCount: 2, draftIncluded: false },
    };
    const reordered = {
      summary: { draftIncluded: false, dreamCount: 2 },
      dreams: [
        { id: 'one', title: 'First' },
        { title: 'Second', id: 'two' },
      ],
      version: 9,
    };

    expect(canonicalizeDreamBackup(left)).toBe(
      canonicalizeDreamBackup(reordered),
    );
    expect(computeDreamBackupDigest(left)).toBe(
      computeDreamBackupDigest(reordered),
    );

    expect(
      computeDreamBackupDigest({
        ...reordered,
        dreams: [...reordered.dreams].reverse(),
      }),
    ).not.toBe(computeDreamBackupDigest(reordered));
  });

  test('omits undefined object values and preserves JSON array semantics', () => {
    expect(
      canonicalizeDreamBackup({
        omitted: undefined,
        array: [1, undefined, 3],
      }),
    ).toBe('{"array":[1,null,3]}');
  });

  test('attaches and verifies a manifest without mutating the payload', () => {
    const payload = {
      version: 9,
      exportedAt: '2026-08-06T10:00:00.000Z',
      dreams: [{ id: 'dream-1', text: 'A bridge' }],
    };

    const signed = attachDreamBackupIntegrity(payload);

    expect(payload).not.toHaveProperty('integrity');
    expect(signed.integrity).toEqual({
      algorithm: 'sha256',
      digest: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
    expect(verifyDreamBackupIntegrity(signed, { required: true })).toBe(
      'verified',
    );
  });

  test('detects a semantic payload change', () => {
    const signed = attachDreamBackupIntegrity({
      version: 9,
      summary: { dreamCount: 1 },
      dreams: [{ id: 'dream-1', text: 'Original' }],
    });
    const changed = {
      ...signed,
      dreams: [{ id: 'dream-1', text: 'Changed' }],
    };

    expect(() =>
      verifyDreamBackupIntegrity(changed, { required: true }),
    ).toThrow('integrity-mismatch');
  });

  test('keeps legacy files readable but requires a manifest for current files', () => {
    expect(
      verifyDreamBackupIntegrity(
        { version: 8, dreams: [] },
        { required: false },
      ),
    ).toBe('legacy-unverified');

    expect(() =>
      verifyDreamBackupIntegrity(
        { version: 9, dreams: [] },
        { required: true },
      ),
    ).toThrow('integrity-missing');
  });

  test.each([
    [null, 'integrity-invalid'],
    [
      { algorithm: 'md5', digest: '0'.repeat(64) },
      'integrity-algorithm-unsupported',
    ],
    [{ algorithm: 'sha256', digest: 'not-a-digest' }, 'integrity-invalid'],
  ] as const)('rejects invalid manifest %p', (integrity, code) => {
    expect(() =>
      verifyDreamBackupIntegrity(
        { version: 9, dreams: [], integrity },
        { required: true },
      ),
    ).toThrow(code);
  });
});
