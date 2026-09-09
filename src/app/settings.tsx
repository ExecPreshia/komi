import { Stack, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing, Typography } from '@/constants/theme';

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Paramètres',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button">
              <Text style={styles.close}>Fermer</Text>
            </Pressable>
          ),
        }}
      />
      <Text style={styles.message}>Paramètres à venir</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: Spacing.four,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    ...Typography.section,
    color: Colors.textMuted,
  },
  close: {
    ...Typography.label,
    color: Colors.accent,
    paddingHorizontal: Spacing.two,
  },
});
