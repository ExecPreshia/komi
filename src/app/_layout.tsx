import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useKomiStore } from '@/store/komi-store';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const hasHydrated = useKomiStore((state) => state.hasHydrated);

  useEffect(() => {
    if (useKomiStore.persist.hasHydrated()) {
      useKomiStore.getState().setHasHydrated(true);
    }

    const unsubscribe = useKomiStore.persist.onFinishHydration(() => {
      useKomiStore.getState().setHasHydrated(true);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (hasHydrated) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [hasHydrated]);

  if (!hasHydrated) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.primary } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="recipe/new" options={{ presentation: 'modal', headerShown: true, title: 'Saisie manuelle' }} />
      <Stack.Screen name="settings" options={{ presentation: 'modal', headerShown: true, title: 'Paramètres' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
});
