import { TurboModuleRegistry } from 'react-native';

const RNWhisper = {
  installJSIBindings: jest.fn(),
  initContext: jest.fn(),
  transcribeFile: jest.fn(),
  abortTranscribe: jest.fn(),
};

jest
  .spyOn(TurboModuleRegistry, 'getEnforcing')
  .mockReturnValue(RNWhisper as never);

const { initWhisper } = require(
  '../src/features/dreams/services/whisperNative',
) as typeof import('../src/features/dreams/services/whisperNative');

describe('whisper native bridgeless adapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    RNWhisper.initContext.mockResolvedValue({ contextId: 17 });
    RNWhisper.transcribeFile.mockResolvedValue({
      result: 'Я йшов нічним містом',
      language: 'uk',
      segments: [],
      isAborted: false,
    });
    RNWhisper.abortTranscribe.mockResolvedValue(undefined);
  });

  test('uses the registered file TurboModule without installing legacy JSI bindings', async () => {
    const context = await initWhisper({
      filePath: 'file:///documents/whisper-models/ggml-small-q5_1.bin',
      useGpu: false,
      useCoreMLIos: false,
    });

    expect(RNWhisper.initContext).toHaveBeenCalledWith({
      filePath: '/documents/whisper-models/ggml-small-q5_1.bin',
      isBundleAsset: false,
      useGpu: false,
      useCoreMLIos: false,
    });
    expect(RNWhisper.installJSIBindings).not.toHaveBeenCalled();

    const transcription = context.transcribe('file:///audio/dream.m4a', {
      language: 'uk',
      translate: false,
      temperature: 0,
      temperatureInc: 0.2,
      beamSize: 5,
    });

    await expect(transcription.promise).resolves.toMatchObject({
      result: 'Я йшов нічним містом',
      language: 'uk',
    });
    expect(RNWhisper.transcribeFile).toHaveBeenCalledWith(
      17,
      expect.any(Number),
      '/audio/dream.m4a',
      {
        language: 'uk',
        translate: false,
        temperature: 0,
        temperatureInc: 0.2,
        beamSize: 5,
        onProgress: false,
        onNewSegments: false,
      },
    );
  });

  test('aborts the same native transcription job', async () => {
    const context = await initWhisper({ filePath: '/models/model.bin' });
    const transcription = context.transcribe('/audio/dream.m4a');
    const jobId = RNWhisper.transcribeFile.mock.calls[0][1];

    await transcription.stop();

    expect(RNWhisper.abortTranscribe).toHaveBeenCalledWith(17, jobId);
    await transcription.promise;
  });
});
