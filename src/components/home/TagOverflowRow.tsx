import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { TagChip } from '@/components/ui/TagChip';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';

const GAP = Spacing.one;

type TagOverflowRowProps = {
  tags: string[];
};

/**
 * Single-line tags with a trailing +N when they do not all fit.
 * +N is non-interactive; the parent card handles press.
 *
 * Available width is measured on the outer wrap (not the inner nowrap row),
 * so flex list cards ("Mes recettes") get a correct +N like pinned cards.
 */
export function TagOverflowRow({ tags }: TagOverflowRowProps) {
  const [availableWidth, setAvailableWidth] = useState(0);
  const [tagWidths, setTagWidths] = useState<Record<number, number>>({});
  const tagsKey = tags.join('\u0001');

  useEffect(() => {
    setTagWidths({});
  }, [tagsKey]);

  const measuredAll =
    tags.length === 0 || tags.every((_, index) => typeof tagWidths[index] === 'number');

  const { visibleCount, overflowCount } = useMemo(() => {
    if (tags.length === 0) return { visibleCount: 0, overflowCount: 0 };

    // Keep tags visible until we can compute overflow — an empty row collapses
    // and prevents measure layouts from completing on list cards.
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
      const plusWidth = estimatePlusWidth(overflow);
      const tagsWidth =
        count === 0
          ? 0
          : widths.slice(0, count).reduce((sum, width) => sum + width, 0) +
            GAP * Math.max(0, count - 1);
      const gapsBeforePlus = count > 0 ? GAP : 0;
      if (tagsWidth + gapsBeforePlus + plusWidth <= availableWidth) {
        return { visibleCount: count, overflowCount: overflow };
      }
    }

    return { visibleCount: 0, overflowCount: tags.length };
  }, [availableWidth, measuredAll, tagWidths, tags]);

  return (
    <View
      style={styles.wrap}
      onLayout={(event) => {
        const width = event.nativeEvent.layout.width;
        if (width > 0) setAvailableWidth(width);
      }}>
      <View
        pointerEvents="none"
        collapsable={false}
        style={styles.measureRow}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants">
        {tags.map((tag, index) => (
          <View
            key={`measure-${tag}-${index}`}
            collapsable={false}
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
    overflow: 'hidden',
  },
  measureRow: {
    position: 'absolute',
    opacity: 0,
    flexDirection: 'row',
    left: 0,
    top: 0,
    zIndex: -1,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: GAP,
    overflow: 'hidden',
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
