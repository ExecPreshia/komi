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
 */
export function TagOverflowRow({ tags }: TagOverflowRowProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [tagWidths, setTagWidths] = useState<number[]>([]);
  const tagsKey = tags.join('\u0001');

  useEffect(() => {
    setTagWidths([]);
  }, [tagsKey]);

  const { visibleCount, overflowCount } = useMemo(() => {
    if (tags.length === 0) return { visibleCount: 0, overflowCount: 0 };
    if (containerWidth <= 0 || tagWidths.length < tags.length) {
      return { visibleCount: tags.length, overflowCount: 0 };
    }

    const totalTagsWidth =
      tagWidths.reduce((sum, width) => sum + width, 0) + GAP * Math.max(0, tags.length - 1);
    if (totalTagsWidth <= containerWidth) {
      return { visibleCount: tags.length, overflowCount: 0 };
    }

    for (let count = tags.length - 1; count >= 0; count -= 1) {
      const overflow = tags.length - count;
      const plusWidth = estimatePlusWidth(overflow);
      const tagsWidth =
        count === 0
          ? 0
          : tagWidths.slice(0, count).reduce((sum, width) => sum + width, 0) +
            GAP * Math.max(0, count - 1);
      const gapsBeforePlus = count > 0 ? GAP : 0;
      if (tagsWidth + gapsBeforePlus + plusWidth <= containerWidth) {
        return { visibleCount: count, overflowCount: overflow };
      }
    }

    return { visibleCount: 0, overflowCount: tags.length };
  }, [containerWidth, tagWidths, tags.length]);

  return (
    <View style={styles.wrap}>
      <View
        pointerEvents="none"
        style={styles.measureRow}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants">
        {tags.map((tag, index) => (
          <View
            key={`measure-${tag}`}
            onLayout={(event) => {
              const width = event.nativeEvent.layout.width;
              setTagWidths((current) => {
                if (current[index] === width) return current;
                const next = current.slice();
                next[index] = width;
                return next;
              });
            }}>
            <TagChip label={tag} />
          </View>
        ))}
      </View>

      <View
        style={styles.row}
        onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}>
        {tags.slice(0, visibleCount).map((tag) => (
          <TagChip key={tag} label={tag} />
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
  // paddingHorizontal * 2 + approximate glyph width for "+N"
  return Spacing.three * 2 + 8 + digits * 7;
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  measureRow: {
    position: 'absolute',
    opacity: 0,
    flexDirection: 'row',
    left: 0,
    top: 0,
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
  },
  plusLabel: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text,
  },
});
