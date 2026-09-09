import { Stack, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RecipeForm } from '@/components/recipe-form/RecipeForm';
import { createEmptyFormValues } from '@/components/recipe-form/form-model';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useKomiStore } from '@/store/komi-store';

export default function NewRecipeScreen() {
  const insets = useSafeAreaInsets();
  const addRecipe = useKomiStore((state) => state.addRecipe);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Stack.Screen
        options={{
          title: 'Saisie manuelle',
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
      <RecipeForm
        initialValues={createEmptyFormValues()}
        submitLabel="Enregistrer la recette"
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
  close: {
    ...Typography.label,
    color: Colors.accent,
    paddingHorizontal: Spacing.two,
  },
});
