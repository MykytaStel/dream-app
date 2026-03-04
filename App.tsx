import React from 'react';
import RootNavigator from './src/app/navigation/RootNavigator';
import { AppProviders } from './src/app/AppProvider';
import 'react-native-gesture-handler';
import 'react-native-reanimated';

export default function App() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
