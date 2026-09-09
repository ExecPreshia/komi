import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TagChip } from '@/components/ui/TagChip';
import { PinIcon } from '@/components/ui/PinIcon';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import type { Recipe } from '@/types/recipe';
import { COST_LABELS, DIFFICULTY_LABELS, formatCookingTime, normalizeCostLevel } from '@/utils/format';

type RecipeListCardProps = {
  recipe: Recipe;
  onPress?: () => void;
  onPressPin: () => void;
};

export function RecipeListCard({ recipe, onPress, onPressPin }: RecipeListCardProps) {
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
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {recipe.title}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={recipe.isPinned ? 'Retirer du menu' : 'Ajouter au menu'}
            hitSlop={8}
            onPress={onPressPin}>
            <PinIcon active={recipe.isPinned} />
          </Pressable>
        </View>
        <View style={styles.tags}>
          {recipe.tags.slice(0, 4).map((tag) => (
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
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: 5,
    gap: Spacing.three,
    shadowColor: Colors.text,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  imageWrap: {
    width: 110,
    height: 110,
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
  content: {
    flex: 1,
    paddingVertical: Spacing.two,
    paddingRight: Spacing.two,
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
