/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('../src/app/navigation/RootNavigator', () => 'RootNavigator');
jest.mock('../src/app/AppProvider', () => ({
  AppProviders: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('../src/features/security/components/AppLockGate', () => ({
  AppLockGate: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('../src/features/settings/components/LocalDataRecoveryGate', () => ({
  LocalDataRecoveryGate: ({ children }: { children: React.ReactNode }) =>
    children,
}));
jest.mock('../src/services/storage/StorageMigrationGate', () => ({
  StorageMigrationGate: ({ children }: { children: React.ReactNode }) =>
    children,
}));
jest.mock('../src/features/dreams/components/AudioCleanupMaintenance', () => ({
  AudioCleanupMaintenance: () => null,
}));
jest.mock(
  '../src/features/settings/components/ArchiveHealthMaintenance',
  () => ({ ArchiveHealthMaintenance: () => null }),
);

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
