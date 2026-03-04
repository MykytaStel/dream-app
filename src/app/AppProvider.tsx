import React from 'react';
import { ThemeProvider } from '@shopify/restyle';
import { theme } from '../theme/theme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ensurePreviewDream } from '../features/dreams/repository/dreamsRepository';

const qc = new QueryClient();
export const AppProviders: React.FC<React.PropsWithChildren> = ({ children }) => {
  React.useEffect(() => {
    ensurePreviewDream();
  }, []);

  return (
    <QueryClientProvider client={qc}>
      <SafeAreaProvider>
        <ThemeProvider theme={theme}>{children}</ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
};
