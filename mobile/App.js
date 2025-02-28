import * as React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LogBox } from 'react-native';
import AppNavigation from './AppNavigation';
import { registerRootComponent } from 'expo';
import { AppRegistry } from 'react-native';

// Ignore specific warnings
LogBox.ignoreLogs([
  'ViewPropTypes will be removed',
  'ColorPropType will be removed',
]);

const App = () => {
  return (
    <SafeAreaProvider>
      <AppNavigation />
    </SafeAreaProvider>
  );
};

// Fix #1: Use 'main' as the app name instead of 'poc-teller'
// AppRegistry.registerComponent('main', () => App);

// Fix #2: Use only one registration method (Expo's is preferred if using Expo)
// If you're using Expo, this is all you need:
registerRootComponent(App);

export default App; // Make sure App is exported