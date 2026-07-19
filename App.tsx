import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { initDatabase } from '@/database/db';
import { useThemeStore } from '@/store/useThemeStore';
import { useUserStore } from '@/store/useUserStore';
import { AppNavigator } from '@/navigation/AppNavigator';
import { Text } from '@/components/Text';

// Keep splash visible while bootstrapping
SplashScreen.preventAutoHideAsync();

function AppBootstrap() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { loadTheme, colors, isDark } = useThemeStore();
  const { loadUser } = useUserStore();

  useEffect(() => {
    async function bootstrap() {
      try {
        // 1. Init SQLite (creates tables + seeds categories)
        await initDatabase();
        // 2. Load persisted theme preference
        await loadTheme();
        // 3. Load user profile from DB
        loadUser();
      } catch (e: any) {
        setError(e?.message ?? 'Startup failed');
      } finally {
        setReady(true);
        await SplashScreen.hideAsync();
      }
    }
    bootstrap();
  }, []);

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: '#0A0A0F' }]}>
        <Text style={{ color: '#EF4444', textAlign: 'center', padding: 24 }}>
          {`Failed to start Pocket:\n${error}`}
        </Text>
      </View>
    );
  }

  if (!ready) return null;

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
        translucent={false}
      />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AppBootstrap />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1 },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
