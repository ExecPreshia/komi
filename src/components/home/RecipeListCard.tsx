import { useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TagOverflowRow } from '@/components/home/TagOverflowRow';
import { PinIcon } from '@/components/ui/PinIcon';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTranslation } from '@/i18n/useTranslation';
import type { Recipe } from '@/types/recipe';
import { formatCookingTime, formatCost, formatDifficulty, normalizeCostLevel } from '@/utils/format';
import { resolveRecipePhotoUri } from '@/utils/recipe-photo';

type RecipeListCardProps = {
  recipe: Recipe;
  onPress?: () => void;
  onPressPin: () => void;
};

export function RecipeListCard({ recipe, onPress, onPressPin }: RecipeListCardProps) {
  const { t, locale } = useTranslation();
  const [contentWidth, setContentWidth] = useState(0);

  const photoUri = resolveRecipePhotoUri(recipe.photoUri);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.imageWrap}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.placeholderText}>{t('common.noPhoto')}</Text>
          </View>
        )}
      </View>
      <View
        style={styles.content}
        onLayout={(event) => {
          // Content onLayout includes paddingRight; tags use the inner width.
          const width = Math.max(0, event.nativeEvent.layout.width - Spacing.two);
          if (width <= 0) return;
          setContentWidth((current) => (Math.abs(current - width) < 0.5 ? current : width));
        }}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {recipe.title}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              recipe.isPinned ? t('home.pinRemoveA11y') : t('home.pinAddA11y')
            }
            hitSlop={8}
            onPress={onPressPin}>
            <PinIcon active={recipe.isPinned} size={16} />
          </Pressable>
        </View>
        <TagOverflowRow
          key={contentWidth > 0 ? `w-${Math.round(contentWidth)}` : 'pending'}
          tags={recipe.tags}
          containerWidth={contentWidth}
        />
        <Text style={styles.meta}>
          {formatCookingTime(recipe.cookingTimeMinutes)} ·{' '}
          {formatDifficulty(recipe.difficulty, locale)} ·{' '}
          {formatCost(normalizeCostLevel(recipe.costLevel), locale)}
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
