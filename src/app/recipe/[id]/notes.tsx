import { type Href, Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAvoidingView, KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppKeyboardAwareScrollView } from '@/components/ui/AppKeyboardAwareScrollView';
import { CloseIcon } from '@/components/ui/form-icons';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useKomiStore } from '@/store/komi-store';

export default function RecipeNotesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const recipe = useKomiStore((state) => state.recipes.find((item) => item.id === id));
  const updateRecipe = useKomiStore((state) => state.updateRecipe);
  const [notes, setNotes] = useState(recipe?.notes ?? '');

  if (!recipe) {
    return (
      <View style={[styles.missing, { paddingTop: insets.top }]}>
        <Text style={styles.missingTitle}>Recette introuvable</Text>
        <Pressable onPress={() => router.replace('/' as Href)}>
          <Text style={styles.link}>Retour à l’accueil</Text>
        </Pressable>
      </View>
    );
  }

  const activeRecipe = recipe;

  function saveNotes() {
    const trimmed = notes.trim();
    updateRecipe(activeRecipe.id, { notes: trimmed.length > 0 ? trimmed : null });
    Alert.alert('Note enregistrée', `Note bien enregistrée pour ${activeRecipe.title}`, [
      {
        text: 'OK',
        onPress: () => router.replace('/' as Href),
      },
    ]);
  }

  return (
    <KeyboardAvoidingView style={[styles.root, { paddingTop: insets.top }]} behavior="padding">
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes notes</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fermer"
          onPress={() => router.replace('/' as Href)}
          style={styles.closeButton}>
          <CloseIcon />
        </Pressable>
      </View>

      <AppKeyboardAwareScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        bottomOffset={100}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.prompt}>
          Pour la prochaine fois : ce que je changerai dans {activeRecipe.title} ou toute autre
          observation.
        </Text>

        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Ex : mettre moins de sel, très bon avec une salade en accompagnement..."
          placeholderTextColor={Colors.textMuted}
          multiline
          textAlignVertical="top"
          style={styles.input}
        />
      </AppKeyboardAwareScrollView>

      <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.four) }]}>
          <Pressable style={styles.saveButton} onPress={saveNotes}>
            <Text style={styles.saveLabel}>Enregistrer mes notes</Text>
          </Pressable>
        </View>
      </KeyboardStickyView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.four,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.four,
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    backgroundColor: Colors.primary,
  },
  missingTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 20,
    color: Colors.text,
  },
  link: {
    fontFamily: Fonts.bodyMedium,
    color: Colors.accent,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
  },
  headerTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 28,
    color: Colors.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: Radii.pill,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prompt: {
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textMuted,
    marginBottom: Spacing.four,
  },
  input: {
    minHeight: 220,
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: Spacing.four,
    fontFamily: Fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: Colors.text,
  },
  footer: {
    paddingTop: Spacing.four,
    backgroundColor: Colors.primary,
  },
  saveButton: {
    minHeight: 54,
    borderRadius: Radii.lg,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 17,
    color: Colors.white,
  },
});
