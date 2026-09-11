import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RecipeForm } from '@/components/recipe-form/RecipeForm';
import { createEmptyFormValues } from '@/components/recipe-form/form-model';
import { KomiConfirmSheet } from '@/components/ui/KomiActionSheet';
import { showKomiToast } from '@/components/ui/KomiToast';
import { CloseIcon } from '@/components/ui/form-icons';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useKomiStore } from '@/store/komi-store';

export default function NewRecipeScreen() {
  const insets = useSafeAreaInsets();
  const addRecipe = useKomiStore((state) => state.addRecipe);
  const [quitOpen, setQuitOpen] = useState(false);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />

      <View style={styles.header}>
        <Text style={styles.title}>Nouvelle recette</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fermer"
          onPress={() => setQuitOpen(true)}
          style={styles.closeButton}>
          <CloseIcon />
        </Pressable>
      </View>

      <RecipeForm
        initialValues={createEmptyFormValues()}
        submitLabel="Enregistrer"
        onSubmit={(values) => {
          addRecipe({
            title: values.title,
            photoUri: values.photoUri,
            cookingTimeMinutes: values.cookingTimeMinutes,
            difficulty: values.difficulty,
            costLevel: values.costLevel,
            baseServings: values.baseServings,
            tags: values.tags,
            isPinned: values.isPinned,
            ingredients: values.ingredients,
            steps: values.steps,
          });
          showKomiToast('Recette enregistrée');
          router.back();
        }}
      />

      <KomiConfirmSheet
        visible={quitOpen}
        title="Êtes-vous sûr de quitter ?"
        message="Les modifications ne seront pas sauvegardées."
        cancelLabel="Annuler"
        confirmLabel="Quitter"
        destructive
        onClose={() => setQuitOpen(false)}
        onConfirm={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  title: {
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
});
