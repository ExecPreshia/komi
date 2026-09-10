import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RecipeForm } from '@/components/recipe-form/RecipeForm';
import { recipeToFormValues } from '@/components/recipe-form/form-model';
import { CloseIcon } from '@/components/ui/form-icons';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useKomiStore } from '@/store/komi-store';

export default function EditRecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const recipe = useKomiStore((state) => state.recipes.find((item) => item.id === id));
  const updateRecipe = useKomiStore((state) => state.updateRecipe);

  if (!recipe) {
    return (
      <View style={[styles.missing, { paddingTop: insets.top }]}>
        <Text style={styles.missingTitle}>Recette introuvable</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.missingLink}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />

      <View style={styles.header}>
        <Text style={styles.title}>Modifier</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fermer"
          onPress={() => router.back()}
          style={styles.closeButton}>
          <CloseIcon />
        </Pressable>
      </View>

      <RecipeForm
        initialValues={recipeToFormValues(recipe)}
        submitLabel="Enregistrer"
        onSubmit={(values) => {
          updateRecipe(recipe.id, {
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
          router.back();
        }}
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
  missingLink: {
    fontFamily: Fonts.bodyMedium,
    color: Colors.accent,
  },
});
