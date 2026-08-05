import { collectProtectedAudioUris } from '../src/features/dreams/services/audioOwnershipService';

describe('audio ownership index', () => {
  test('collects every URI that can still belong to user data', () => {
    expect(
      collectProtectedAudioUris({
        dreams: [
          { audioUri: 'file:///audio/saved-1.m4a' },
          { audioUri: 'file:///audio/saved-2.m4a' },
        ],
        createDraft: { audioUri: 'file:///audio/create-draft.m4a' },
        editDrafts: [{ audioUri: 'file:///audio/edit-draft.m4a' }, undefined],
        activeAudioUri: 'file:///audio/active.m4a',
        pendingAudioUri: 'file:///audio/pending.m4a',
      }),
    ).toEqual([
      'file:///audio/saved-1.m4a',
      'file:///audio/saved-2.m4a',
      'file:///audio/create-draft.m4a',
      'file:///audio/edit-draft.m4a',
      'file:///audio/active.m4a',
      'file:///audio/pending.m4a',
    ]);
  });

  test('deduplicates a file referenced by more than one owner', () => {
    const sharedUri = 'file:///audio/shared.m4a';

    expect(
      collectProtectedAudioUris({
        dreams: [{ audioUri: sharedUri }],
        createDraft: { audioUri: sharedUri },
        editDrafts: [{ audioUri: sharedUri }],
        activeAudioUri: sharedUri,
        pendingAudioUri: sharedUri,
      }),
    ).toEqual([sharedUri]);
  });

  test('ignores absent and blank URI values', () => {
    expect(
      collectProtectedAudioUris({
        dreams: [{}, { audioUri: undefined }, { audioUri: '   ' }],
        createDraft: null,
        editDrafts: [null, undefined, { audioUri: '' }],
        activeAudioUri: null,
      }),
    ).toEqual([]);
  });

  test('preserves the exact stored URI for the native bridge', () => {
    const storedUri = 'file:///audio/Dream%20recording.m4a';

    expect(
      collectProtectedAudioUris({
        dreams: [{ audioUri: storedUri }],
      }),
    ).toEqual([storedUri]);
  });

  test('keeps deterministic owner priority when duplicate URIs are present', () => {
    expect(
      collectProtectedAudioUris({
        dreams: [
          { audioUri: 'file:///audio/saved.m4a' },
          { audioUri: 'file:///audio/shared.m4a' },
        ],
        createDraft: { audioUri: 'file:///audio/shared.m4a' },
        editDrafts: [{ audioUri: 'file:///audio/edit.m4a' }],
        pendingAudioUri: 'file:///audio/pending.m4a',
      }),
    ).toEqual([
      'file:///audio/saved.m4a',
      'file:///audio/shared.m4a',
      'file:///audio/edit.m4a',
      'file:///audio/pending.m4a',
    ]);
  });
});
