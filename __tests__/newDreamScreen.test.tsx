import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { useRoute } from '@react-navigation/native';
import NewDreamScreen from '../src/features/dreams/screens/NewDreamScreen';

jest.mock('@react-navigation/native', () => ({
  useRoute: jest.fn(),
}));

jest.mock('../src/features/dreams/components/DreamComposer', () => ({
  DreamComposer: jest.fn((_props: Record<string, unknown>) => null),
}));

const mockedUseRoute = useRoute as jest.Mock;
const mockedDreamComposer = jest.requireMock(
  '../src/features/dreams/components/DreamComposer',
).DreamComposer as jest.Mock;

describe('NewDreamScreen', () => {
  beforeEach(() => {
    mockedDreamComposer.mockClear();
  });

  test('passes autoStartRecordingKey when opened in voice mode', async () => {
    mockedUseRoute.mockReturnValue({
      key: 'new',
      name: 'New',
      params: {
        entryMode: 'voice',
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
  });
});
