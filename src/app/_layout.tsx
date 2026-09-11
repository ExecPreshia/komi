import {
  AlanSans_400Regular,
  AlanSans_500Medium,
  AlanSans_600SemiBold,
  AlanSans_700Bold,
} from '@expo-google-fonts/alan-sans';
import {
  Karla_400Regular,
  Karla_500Medium,
  Karla_700Bold,
} from '@expo-google-fonts/karla';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { Colors } from '@/constants/theme';
import { KomiToastHost } from '@/components/ui/KomiToast';
import { useKomiStore } from '@/store/komi-store';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const hasHydrated = useKomiStore((state) => state.hasHydrated);
  const [fontsLoaded] = useFonts({
    AlanSans_400Regular,
    AlanSans_500Medium,
    AlanSans_600SemiBold,
    AlanSans_700Bold,
    Karla_400Regular,
    Karla_500Medium,
    Karla_700Bold,
  });

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
    if (hasHydrated && fontsLoaded) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [hasHydrated, fontsLoaded]);

  if (!hasHydrated || !fontsLoaded) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <KeyboardProvider>
        <View style={styles.root}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.primary } }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="recipe/new" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="recipe/[id]/index" options={{ headerShown: false }} />
            <Stack.Screen name="recipe/[id]/edit" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="recipe/[id]/cook" options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen name="recipe/[id]/complete" options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen name="recipe/[id]/notes" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="settings" options={{ presentation: 'modal', headerShown: true, title: 'Paramètres' }} />
          </Stack>
          <KomiToastHost />
        </View>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
});
