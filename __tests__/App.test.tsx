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

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
