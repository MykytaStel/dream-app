import { kv } from '../src/services/storage/mmkv';
import {
  signInToCloudAnonymously,
  signInToCloudWithPassword,
  signOutFromCloud,
  startCloudAuthSessionSync,
  syncCloudSessionFromAuth,
  upgradeCloudAnonymousSession,
} from '../src/services/auth/cloudAuth';
import { getCloudSession } from '../src/services/auth/session';
import { getSupabaseClient } from '../src/services/api/supabase/client';

jest.mock('../src/services/api/supabase/client', () => ({
  getSupabaseClient: jest.fn(),
}));

type MockSession = {
  user: {
    id: string;
    email?: string;
    is_anonymous?: boolean;
  };
};

function flushPromises() {
  return new Promise<void>(resolve => {
    setImmediate(() => {
      resolve();
    });
  });
}

describe('cloud auth service', () => {
  const mockedGetSupabaseClient = getSupabaseClient as jest.MockedFunction<
    typeof getSupabaseClient
  >;

  beforeEach(() => {
    kv.clearAll();
    mockedGetSupabaseClient.mockReset();
  });

  test('hydrates the mirrored cloud session from Supabase auth', async () => {
    const session: MockSession = {
      user: {
        id: 'user-1',
        email: 'dreamer@example.com',
        is_anonymous: true,
      },
    };

    mockedGetSupabaseClient.mockReturnValue({
      auth: {
        getSession: jest.fn(async () => ({
          data: { session },
          error: null,
        })),
      },
    } as never);

    await expect(syncCloudSessionFromAuth()).resolves.toEqual({
      status: 'signed-in',
      provider: 'supabase',
      userId: 'user-1',
      email: 'dreamer@example.com',
      isAnonymous: true,
    });

    expect(getCloudSession()).toEqual({
      status: 'signed-in',
      provider: 'supabase',
      userId: 'user-1',
      email: 'dreamer@example.com',
      isAnonymous: true,
    });
  });

  test('signs in and out through the active Supabase client', async () => {
    const session: MockSession = {
      user: {
        id: 'user-2',
        is_anonymous: true,
      },
    };

    mockedGetSupabaseClient.mockReturnValue({
      auth: {
        signInAnonymously: jest.fn(async () => ({
          data: { session },
          error: null,
        })),
        signOut: jest.fn(async () => ({
          error: null,
        })),
      },
    } as never);

    await expect(signInToCloudAnonymously()).resolves.toEqual({
      status: 'signed-in',
      provider: 'supabase',
      userId: 'user-2',
      email: undefined,
      isAnonymous: true,
    });

    await expect(signOutFromCloud()).resolves.toEqual({
      status: 'signed-out',
    });
  });

  test('signs in with email and password through the active Supabase client', async () => {
    const session: MockSession = {
      user: {
        id: 'user-4',
        email: 'dreamer@example.com',
        is_anonymous: false,
      },
    };
    const signInWithPassword = jest.fn(async () => ({
      data: { session },
      error: null,
    }));

    mockedGetSupabaseClient.mockReturnValue({
      auth: {
        signInWithPassword,
      },
    } as never);

    await expect(
      signInToCloudWithPassword({
        email: ' Dreamer@Example.com ',
        password: 'secret-pass',
      }),
    ).resolves.toEqual({
      status: 'signed-in',
      provider: 'supabase',
      userId: 'user-4',
      email: 'dreamer@example.com',
      isAnonymous: false,
    });

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'dreamer@example.com',
      password: 'secret-pass',
    });
  });

  test('upgrades an anonymous cloud session to an email account', async () => {
    const updateUser = jest.fn(async () => ({
      data: { user: { id: 'user-5' } },
      error: null,
    }));

    mockedGetSupabaseClient.mockReturnValue({
      auth: {
        getSession: jest
          .fn()
          .mockResolvedValueOnce({
            data: {
              session: {
                user: {
                  id: 'user-5',
                  is_anonymous: true,
                },
              },
            },
            error: null,
          })
          .mockResolvedValueOnce({
            data: {
              session: {
                user: {
                  id: 'user-5',
                  email: 'saved@example.com',
                  is_anonymous: false,
                },
              },
            },
            error: null,
          }),
        updateUser,
      },
    } as never);

    await expect(
      upgradeCloudAnonymousSession({
        email: ' SAVED@example.com ',
        password: 'secret-pass',
      }),
    ).resolves.toEqual({
      status: 'signed-in',
      provider: 'supabase',
      userId: 'user-5',
      email: 'saved@example.com',
      isAnonymous: false,
    });

    expect(updateUser).toHaveBeenCalledWith({
      email: 'saved@example.com',
      password: 'secret-pass',
    });
  });

  test('subscribes to auth state changes and cleans up the listener', async () => {
    const initialSession: MockSession = {
      user: {
        id: 'user-3',
        is_anonymous: true,
      },
    };
    const unsubscribe = jest.fn();
    const onSessionChange = jest.fn();
    let handleAuthChange:
      | ((event: string, session: MockSession | null) => void)
      | undefined;

    mockedGetSupabaseClient.mockReturnValue({
      auth: {
        getSession: jest.fn(async () => ({
          data: { session: initialSession },
          error: null,
        })),
        onAuthStateChange: jest.fn(callback => {
          handleAuthChange = callback;
          return {
            data: {
              subscription: {
                unsubscribe,
              },
            },
          };
        }),
      },
    } as never);

    const stop = startCloudAuthSessionSync({ onSessionChange });
    await flushPromises();

    expect(onSessionChange).toHaveBeenCalledWith({
      status: 'signed-in',
      provider: 'supabase',
      userId: 'user-3',
      email: undefined,
      isAnonymous: true,
    });

    handleAuthChange?.('SIGNED_OUT', null);
    expect(getCloudSession()).toEqual({ status: 'signed-out' });

    stop();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
