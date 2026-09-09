import { type Href, router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useKomiStore } from '@/store/komi-store';

export default function RecipeCompleteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const recipe = useKomiStore((state) => state.recipes.find((item) => item.id === id));

  if (!recipe) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Text style={styles.title}>Recette introuvable</Text>
        <Pressable onPress={() => router.replace('/' as Href)}>
          <Text style={styles.link}>Retour à l’accueil</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + Spacing.six }]}>
      <View style={styles.content}>
        <Text style={styles.emoji}>✦</Text>
        <Text style={styles.title}>Félicitations ! Bonne dégustation.</Text>
        <Text style={styles.subtitle}>{recipe.title} — recette terminée</Text>
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.four) }]}>
        <Pressable
          style={styles.primaryButton}
          onPress={() => router.replace('/' as Href)}>
          <Text style={styles.primaryLabel}>Terminer & quitter</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.push(`/recipe/${recipe.id}/notes` as Href)}>
          <Text style={styles.secondaryLabel}>Ajouter une note pour la prochaine fois</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.four,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  emoji: {
    fontSize: 36,
    color: Colors.accent,
    marginBottom: Spacing.two,
  },
  title: {
    fontFamily: Fonts.sansBold,
    fontSize: 28,
    textAlign: 'center',
    color: Colors.text,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 16,
    textAlign: 'center',
    color: Colors.textMuted,
  },
  link: {
    fontFamily: Fonts.bodyMedium,
    color: Colors.accent,
    marginTop: Spacing.three,
  },
  footer: {
    gap: Spacing.three,
    paddingBottom: Spacing.four,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: Radii.lg,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 17,
    color: Colors.white,
  },
  secondaryButton: {
    minHeight: 54,
    borderRadius: Radii.lg,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  secondaryLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 15,
    color: Colors.text,
    textAlign: 'center',
  },
});
