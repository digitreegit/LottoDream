import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/hooks/useAuth';
import { EntitlementProvider } from './src/hooks/useEntitlement';
import { GameProvider } from './src/hooks/useGame';
import { AppNavigator } from './src/navigation/AppNavigator';
import { Platform } from 'react-native';

// Initialize web-specific styles (Rubik font, etc.)
if (Platform.OS === 'web') {
  require('./src/web-init.ts');
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <EntitlementProvider>
          <GameProvider>
            <StatusBar style="light" />
            <AppNavigator />
          </GameProvider>
        </EntitlementProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
