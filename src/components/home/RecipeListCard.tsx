import { useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TagOverflowRow } from '@/components/home/TagOverflowRow';
import { PinIcon } from '@/components/ui/PinIcon';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import type { Recipe } from '@/types/recipe';
import { COST_LABELS, DIFFICULTY_LABELS, formatCookingTime, normalizeCostLevel } from '@/utils/format';

type RecipeListCardProps = {
  recipe: Recipe;
  onPress?: () => void;
  onPressPin: () => void;
};

export function RecipeListCard({ recipe, onPress, onPressPin }: RecipeListCardProps) {
  const [contentWidth, setContentWidth] = useState(0);

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
      <View
        style={styles.content}
        onLayout={(event) => {
          // Content onLayout includes paddingRight; tags use the inner width.
          const width = Math.max(0, event.nativeEvent.layout.width - Spacing.two);
          if (width > 0) setContentWidth(width);
        }}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {recipe.title}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={recipe.isPinned ? 'Retirer du menu' : 'Ajouter au menu'}
            hitSlop={8}
            onPress={onPressPin}>
            <PinIcon active={recipe.isPinned} size={16} />
          </Pressable>
        </View>
        <TagOverflowRow tags={recipe.tags} containerWidth={contentWidth} />
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
    ...Shadows.card,
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
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    overflow: 'hidden',
    paddingVertical: Spacing.two,
    paddingRight: Spacing.two,
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    minWidth: 0,
  },
  title: {
    ...Typography.section,
    fontSize: 17,
    flex: 1,
    minWidth: 0,
  },
  meta: {
    ...Typography.caption,
  },
});
