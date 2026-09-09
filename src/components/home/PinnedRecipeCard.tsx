import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TagChip } from '@/components/ui/TagChip';
import { PinIcon } from '@/components/ui/PinIcon';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import type { Recipe } from '@/types/recipe';
import { COST_LABELS, DIFFICULTY_LABELS, formatCookingTime, normalizeCostLevel } from '@/utils/format';

type PinnedRecipeCardProps = {
  recipe: Recipe;
  onPress?: () => void;
  onPressPin: () => void;
};

export function PinnedRecipeCard({ recipe, onPress, onPressPin }: PinnedRecipeCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.imageWrap}>
        {recipe.photoUri ? (
          <Image source={{ uri: recipe.photoUri }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.placeholderText}>Sans photo</Text>
          </View>
        )}
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {recipe.title}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retirer du menu"
            hitSlop={8}
            onPress={onPressPin}>
            <PinIcon active />
          </Pressable>
        </View>
        <View style={styles.tags}>
          {recipe.tags.slice(0, 3).map((tag) => (
            <TagChip key={tag} label={tag} />
          ))}
        </View>
        <Text style={styles.meta}>
          {formatCookingTime(recipe.cookingTimeMinutes)} · {DIFFICULTY_LABELS[recipe.difficulty]} ·{' '}
          {COST_LABELS[normalizeCostLevel(recipe.costLevel)]}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 207,
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: 5,
    shadowColor: Colors.text,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  imageWrap: {
    height: 147,
    borderRadius: Radii.md,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  body: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  title: {
    ...Typography.section,
    fontSize: 17,
    flex: 1,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  meta: {
    ...Typography.caption,
  },
});
