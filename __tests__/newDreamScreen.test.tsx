import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { useNavigation, useRoute } from '@react-navigation/native';
import NewDreamScreen from '../src/features/dreams/screens/NewDreamScreen';
import {
  trackCaptureStarted,
  trackDraftResumed,
} from '../src/services/observability/events';

jest.mock('@react-navigation/native', () => ({
  useRoute: jest.fn(),
  useNavigation: jest.fn(),
}));

jest.mock('../src/i18n/I18nProvider', () => ({
  useI18n: jest.fn(() => ({
    locale: 'en',
    setLocale: jest.fn(),
  })),
}));

jest.mock('../src/features/dreams/components/DreamComposer', () => ({
  DreamComposer: jest.fn((_props: Record<string, unknown>) => null),
}));

jest.mock('../src/features/dreams/components/CaptureSavedSheet', () => ({
  CaptureSavedSheet: jest.fn(() => null),
}));

jest.mock('../src/features/dreams/services/dreamDraftService', () => ({
  getDreamDraft: jest.fn(),
  getDreamDraftSnapshot: jest.fn(),
}));

jest.mock('../src/services/observability/events', () => ({
  trackCaptureStarted: jest.fn(),
  trackDraftResumed: jest.fn(),
}));

const mockedUseRoute = useRoute as jest.Mock;
const mockedUseNavigation = useNavigation as jest.Mock;
const mockedDreamComposer = jest.requireMock(
  '../src/features/dreams/components/DreamComposer',
).DreamComposer as jest.Mock;
const mockedDraftService = jest.requireMock(
  '../src/features/dreams/services/dreamDraftService',
) as {
  getDreamDraft: jest.Mock;
  getDreamDraftSnapshot: jest.Mock;
};

describe('NewDreamScreen', () => {
  beforeEach(() => {
    mockedDreamComposer.mockClear();
    mockedDraftService.getDreamDraft.mockReturnValue(null);
    mockedDraftService.getDreamDraftSnapshot.mockReturnValue(null);
    (trackCaptureStarted as jest.Mock).mockClear();
    (trackDraftResumed as jest.Mock).mockClear();
    mockedUseNavigation.mockReturnValue({
      navigate: jest.fn(),
    });
  });

  test('passes autoStartRecordingKey when opened in voice mode', async () => {
    mockedUseRoute.mockReturnValue({
      key: 'new',
      name: 'New',
      params: {
        entryMode: 'voice',
        autoStartRecording: true,
        launchKey: 123,
      },
    });

    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<NewDreamScreen />);
    });

    expect(mockedDreamComposer).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'create',
        autoStartRecordingKey: 123,
      }),
      undefined,
    );
    expect(trackCaptureStarted).toHaveBeenCalledWith({
      entryMode: 'voice',
      autoStartedRecording: true,
      source: 'manual',
    });
    expect(trackDraftResumed).not.toHaveBeenCalled();
  });

  test('does not auto-start when a voice draft is reopened manually', async () => {
    mockedUseRoute.mockReturnValue({
      key: 'new',
      name: 'New',
      params: {
        entryMode: 'voice',
        autoStartRecording: false,
      },
    });

    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<NewDreamScreen />);
    });

    expect(mockedDreamComposer).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'create',
        autoStartRecordingKey: undefined,
      }),
      undefined,
    );
  });

  test('keeps default create flow without auto-start params', async () => {
    mockedUseRoute.mockReturnValue({
      key: 'new',
      name: 'New',
      params: undefined,
    });

    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<NewDreamScreen />);
    });

    expect(mockedDreamComposer).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'create',
        autoStartRecordingKey: undefined,
      }),
      undefined,
    );
    expect(trackCaptureStarted).toHaveBeenCalledWith({
      entryMode: 'default',
      autoStartedRecording: false,
      source: 'manual',
    });
    expect(trackDraftResumed).not.toHaveBeenCalled();
  });

  test('tracks draft resume without logging draft content', async () => {
    mockedUseRoute.mockReturnValue({
      key: 'new',
      name: 'New',
      params: {
        entryMode: 'wake',
        source: 'reminder',
      },
    });
    mockedDraftService.getDreamDraft.mockReturnValue({ id: 'draft' });
    mockedDraftService.getDreamDraftSnapshot.mockReturnValue({
      resumeMode: 'voice',
      hasAudio: true,
      hasText: false,
      wordCount: 0,
      hasWakeSignals: false,
      hasContext: false,
      hasTags: false,
    });

    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<NewDreamScreen />);
    });

    expect(trackCaptureStarted).toHaveBeenCalledWith({
      entryMode: 'wake',
      autoStartedRecording: false,
      source: 'reminder',
    });
    expect(trackDraftResumed).toHaveBeenCalledWith({
      resumeMode: 'voice',
      hasAudio: true,
      hasText: false,
      source: 'reminder',
    });
  });
});
