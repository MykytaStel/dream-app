import React from 'react';
import { ThemeProvider } from '@shopify/restyle';
import { theme } from '../theme/theme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const qc = new QueryClient();
export const AppProviders: React.FC<React.PropsWithChildren> = ({ children }) => (
  <QueryClientProvider client={qc}>
    <SafeAreaProvider>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </SafeAreaProvider>
  </QueryClientProvider>
);
