import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import Tabs from './tabs';
import { useTheme } from '@shopify/restyle';

export default function RootNavigator() {
  const t = useTheme<any>();
  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: t.colors.primary,
          background: t.colors.background,
          card: t.colors.surface,
          text: t.colors.text,
          border: t.colors.border,
          notification: t.colors.accent,
        },
      }}
    >
      <Tabs />
    </NavigationContainer>
  );
}