/**
 * How long a recording is, asked before playing it.
 *
 * The player used to learn the length only from playback progress events, so a
 * saved voice note read `--:--` until it had been played all the way through
 * once — and pressing play again reset it to `--:--` for a quarter of a second
 * before the first event arrived. Both platforms can read it from the file's
 * own metadata, so now they do.
 *
 * What is covered here is the contract the screens depend on: zero means
 * unknown, and asking never throws. A label is not worth failing a screen over,
 * and the alternative — a rejected promise inside a render effect — is an
 * unhandled rejection in a component that was only trying to draw a number.
 */

const mockGetDuration = jest.fn();

jest.mock('../src/specs/NativeAudioRecorder', () => ({
  __esModule: true,
  default: {
    getDuration: (path: string) => mockGetDuration(path),
  },
}));

jest.mock('../src/features/dreams/services/audioPermissions', () => ({
  ensureRecordAudioPermission: async () => 'granted',
}));

const { getDuration } = require('../src/features/dreams/services/audioService');

describe('audio duration', () => {
  beforeEach(() => {
    mockGetDuration.mockReset();
  });

  test('passes the uri through and returns what the platform reports', async () => {
    mockGetDuration.mockResolvedValue(38_000);

    await expect(getDuration('file:///audio/dream.m4a')).resolves.toBe(38_000);
    expect(mockGetDuration).toHaveBeenCalledWith('file:///audio/dream.m4a');
  });

  test('a file that cannot be read is zero, not an error', async () => {
    // The native side already answers 0 for a missing file. This is the case
    // where the call itself fails — a module that did not register, say.
    mockGetDuration.mockRejectedValue(new Error('nope'));

    await expect(getDuration('file:///gone.m4a')).resolves.toBe(0);
  });

  test('zero survives as zero rather than becoming a wrong number', async () => {
    // A container that never wrote its duration. The screens read zero as
    // `--:--`, which is true, where any fallback guess would not be.
    mockGetDuration.mockResolvedValue(0);

    await expect(getDuration('file:///silent.m4a')).resolves.toBe(0);
  });
});
