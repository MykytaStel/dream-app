import React from 'react';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DreamDetailScreen from '../../features/dreams/screens/DreamDetailScreen';
import Tabs from './tabs';
import { useTheme } from '@shopify/restyle';
import { ROOT_ROUTE_NAMES, type RootStackParamList } from './routes';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const t = useTheme<any>();
  return (
    <NavigationContainer
      theme={{
        ...DarkTheme,
        dark: true,
        colors: {
          ...DarkTheme.colors,
          primary: t.colors.primary,
          background: t.colors.background,
          card: t.colors.surface,
          text: t.colors.text,
          border: t.colors.border,
          notification: t.colors.accent,
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name={ROOT_ROUTE_NAMES.Tabs} component={Tabs} />
        <Stack.Screen
          name={ROOT_ROUTE_NAMES.DreamDetail}
          component={DreamDetailScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
