import {
  installGlobalErrorReporting,
  reportActionError,
} from '../src/services/observability/errorReporting';
import { setObservabilityProvider } from '../src/services/observability';
import { ObservabilityService } from '../src/services/observability/types';

type GlobalWithDev = typeof globalThis & {
  __DEV__?: boolean;
  ErrorUtils?: {
    getGlobalHandler?: () => (error: Error, isFatal?: boolean) => void;
    setGlobalHandler?: (handler: (error: Error, isFatal?: boolean) => void) => void;
  };
};

describe('error reporting', () => {
  const globalWithDev = globalThis as GlobalWithDev;
  const originalDev = globalWithDev.__DEV__;
  const originalErrorUtils = globalWithDev.ErrorUtils;

  const createProvider = (): jest.Mocked<ObservabilityService> => ({
    captureError: jest.fn(),
    captureMessage: jest.fn(),
    trackEvent: jest.fn(),
  });

  afterEach(() => {
    setObservabilityProvider(null);
    globalWithDev.__DEV__ = originalDev;
    globalWithDev.ErrorUtils = originalErrorUtils;
    jest.restoreAllMocks();
  });

  test('reports action errors through observability and keeps console fallback in dev', () => {
    globalWithDev.__DEV__ = true;

    const provider = createProvider();
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    setObservabilityProvider(provider);

    const error = new Error('export failed');
    reportActionError('BackupScreen.onExportData', error);

    expect(provider.captureError).toHaveBeenCalledWith(error, {
      action: 'BackupScreen.onExportData',
      error_source: 'action',
    });
    expect(consoleError).toHaveBeenCalledWith(
      '[obs:error]',
      'Error: export failed',
      {
        action: 'BackupScreen.onExportData',
        error_source: 'action',
      },
    );
  });

  test('reports global JS errors through the same observability path', () => {
    globalWithDev.__DEV__ = true;

    const provider = createProvider();
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const previousHandler = jest.fn();
    let installedHandler: ((error: Error, isFatal?: boolean) => void) | undefined;

    globalWithDev.ErrorUtils = {
      getGlobalHandler: () => previousHandler,
      setGlobalHandler: handler => {
        installedHandler = handler;
      },
    };

    setObservabilityProvider(provider);

    const cleanup = installGlobalErrorReporting();
    const error = new Error('global failure');

    installedHandler?.(error, true);

    expect(provider.captureError).toHaveBeenCalledWith(error, {
      error_source: 'global',
      event: 'global_js_error',
      isFatal: true,
    });
    expect(consoleError).toHaveBeenCalled();
    expect(previousHandler).toHaveBeenCalledWith(error, true);

    cleanup();

    expect(installedHandler).toBe(previousHandler);
  });
});
