import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { TagChip } from '@/components/ui/TagChip';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';

const GAP = Spacing.one;

type TagOverflowRowProps = {
  tags: string[];
  /**
   * Optional bounded width from the parent card content box.
   * Required for flex list cards ("Mes recettes") where measuring the tag
   * row itself can report intrinsic content width and skip +N.
   */
  containerWidth?: number;
};

/**
 * Single-line tags with a trailing +N when they do not all fit.
 * +N is non-interactive; the parent card handles press.
 *
 * Shared by PinnedRecipeCard and RecipeListCard — do not fork this logic.
 */
export function TagOverflowRow({ tags, containerWidth }: TagOverflowRowProps) {
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const [plusWidth, setPlusWidth] = useState(0);
  const [tagWidths, setTagWidths] = useState<Record<number, number>>({});
  const tagsKey = tags.join('\u0001');

  const availableWidth =
    typeof containerWidth === 'number' && containerWidth > 0 ? containerWidth : measuredWidth;

  useEffect(() => {
    setTagWidths({});
    setMeasuredWidth(0);
    setPlusWidth(0);
  }, [tagsKey]);

  const measuredAll =
    tags.length === 0 || tags.every((_, index) => typeof tagWidths[index] === 'number');

  const { visibleCount, overflowCount } = useMemo(() => {
    if (tags.length === 0) return { visibleCount: 0, overflowCount: 0 };

    if (availableWidth <= 0 || !measuredAll) {
      return { visibleCount: tags.length, overflowCount: 0 };
    }

    const widths = tags.map((_, index) => tagWidths[index] ?? 0);
    const totalTagsWidth =
      widths.reduce((sum, width) => sum + width, 0) + GAP * Math.max(0, tags.length - 1);

    if (totalTagsWidth <= availableWidth) {
      return { visibleCount: tags.length, overflowCount: 0 };
    }

    for (let count = tags.length - 1; count >= 0; count -= 1) {
      const overflow = tags.length - count;
      const reservedPlus = plusWidth > 0 ? plusWidth : estimatePlusWidth(overflow);
      const tagsWidth =
        count === 0
          ? 0
          : widths.slice(0, count).reduce((sum, width) => sum + width, 0) +
            GAP * Math.max(0, count - 1);
      const gapsBeforePlus = count > 0 ? GAP : 0;
      if (tagsWidth + gapsBeforePlus + reservedPlus <= availableWidth) {
        return { visibleCount: count, overflowCount: overflow };
      }
    }

    return { visibleCount: 0, overflowCount: tags.length };
  }, [availableWidth, measuredAll, tagWidths, tags, plusWidth]);

  return (
    <View
      style={styles.wrap}
      onLayout={(event) => {
        const width = event.nativeEvent.layout.width;
        if (typeof containerWidth === 'number' && containerWidth > 0) return;
        if (width > 0) setMeasuredWidth(width);
      }}>
      {/*
        Unconstrained measure lane: parent overflow/width must not compress
        chips or onLayout widths stay too small and +N never appears.
      */}
      <View
        pointerEvents="none"
        collapsable={false}
        style={styles.measureLane}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants">
        {tags.map((tag, index) => (
          <View
            key={`measure-${tag}-${index}`}
            collapsable={false}
            style={styles.measureItem}
            onLayout={(event) => {
              const width = event.nativeEvent.layout.width;
              if (width <= 0) return;
              setTagWidths((current) => {
                if (current[index] === width) return current;
                return { ...current, [index]: width };
              });
            }}>
            <TagChip label={tag} />
          </View>
        ))}
        <View
          collapsable={false}
          style={styles.measureItem}
          onLayout={(event) => {
            const width = event.nativeEvent.layout.width;
            if (width <= 0) return;
            setPlusWidth((current) => (current === width ? current : width));
          }}>
          <View style={styles.plusChip}>
            <Text style={styles.plusLabel}>+9</Text>
          </View>
        </View>
      </View>

      <View style={styles.row}>
        {tags.slice(0, visibleCount).map((tag, index) => (
          <TagChip key={`${tag}-${index}`} label={tag} />
        ))}
        {overflowCount > 0 ? (
          <View style={styles.plusChip}>
            <Text style={styles.plusLabel}>+{overflowCount}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function estimatePlusWidth(count: number): number {
  const digits = String(count).length;
  return Spacing.three * 2 + 8 + digits * 7;
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignSelf: 'stretch',
    minWidth: 0,
    overflow: 'hidden',
  },
  measureLane: {
    position: 'absolute',
    opacity: 0,
    left: 0,
    top: 0,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    // Wider than any card so chips keep their natural widths while measuring.
    width: 4000,
  },
  measureItem: {
    flexShrink: 0,
    marginRight: GAP,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: GAP,
    overflow: 'hidden',
    minWidth: 0,
  },
  plusChip: {
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    backgroundColor: Colors.tag,
    flexShrink: 0,
  },
  plusLabel: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text,
  },
});
