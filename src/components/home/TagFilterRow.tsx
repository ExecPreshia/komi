import { ScrollView, StyleSheet, View } from 'react-native';

import { TagChip } from '@/components/ui/TagChip';
import { Spacing } from '@/constants/theme';

type TagFilterRowProps = {
  tags: string[];
  selectedTag: string | null;
  onSelect: (tag: string | null) => void;
};

export function TagFilterRow({ tags, selectedTag, onSelect }: TagFilterRowProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      <TagChip label="tous" selected={selectedTag == null} onPress={() => onSelect(null)} />
      {tags.map((tag) => (
        <TagChip
          key={tag}
          label={tag}
          selected={selectedTag === tag}
          onPress={() => onSelect(tag)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
});
