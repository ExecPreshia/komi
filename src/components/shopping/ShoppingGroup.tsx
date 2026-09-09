import { StyleSheet, Text, View } from 'react-native';

import { ShoppingRow } from '@/components/shopping/ShoppingRow';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import type { ShoppingListItem } from '@/types/recipe';

type ShoppingGroupProps = {
  title: string | null;
  items: ShoppingListItem[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
};

export function ShoppingGroup({ title, items, onToggle, onRemove }: ShoppingGroupProps) {
  if (items.length === 0) return null;

  return (
    <View style={styles.block}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View style={styles.card}>
        {items.map((item, index) => (
          <ShoppingRow
            key={item.id}
            item={item}
            showDivider={index > 0}
            onToggle={() => onToggle(item.id)}
            onRemove={() => onRemove(item.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: Spacing.two,
  },
  title: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 16,
    color: Colors.text,
    paddingHorizontal: Spacing.one,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    overflow: 'hidden',
  },
});
