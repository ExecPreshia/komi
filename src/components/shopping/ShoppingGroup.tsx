import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ShoppingRow } from '@/components/shopping/ShoppingRow';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useTranslation } from '@/i18n/useTranslation';
import type { ShoppingListItem } from '@/types/recipe';

type ShoppingGroupProps = {
  title: string | null;
  items: ShoppingListItem[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onToggleGroup: (ids: string[], isChecked: boolean) => void;
};

export function ShoppingGroup({
  title,
  items,
  onToggle,
  onRemove,
  onToggleGroup,
}: ShoppingGroupProps) {
  const { t } = useTranslation();

  if (items.length === 0) return null;

  const allChecked = items.every((item) => item.isChecked);
  const selectLabel = allChecked ? t('shopping.deselectAll') : t('shopping.selectAll');

  return (
    <View style={styles.block}>
      <View style={styles.header}>
        {title ? <Text style={styles.title}>{title}</Text> : <View style={styles.titleSpacer} />}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={selectLabel}
          hitSlop={8}
          onPress={() => onToggleGroup(
            items.map((item) => item.id),
            !allChecked,
          )}>
          <Text style={styles.selectAll}>{selectLabel}</Text>
        </Pressable>
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingHorizontal: Spacing.one,
    minHeight: 22,
  },
  title: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  titleSpacer: {
    flex: 1,
  },
  selectAll: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.accent,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    overflow: 'hidden',
  },
});
