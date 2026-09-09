import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import type { ShoppingListItem } from '@/types/recipe';
import { formatScaledQuantity } from '@/utils/quantity';

type ShoppingRowProps = {
  item: ShoppingListItem;
  onToggle: () => void;
  onRemove: () => void;
  showDivider?: boolean;
};

export function ShoppingRow({ item, onToggle, onRemove, showDivider = false }: ShoppingRowProps) {
  const qty = formatScaledQuantity(item.quantity);
  const unit = item.unit?.trim() ?? '';

  return (
    <View>
      {showDivider ? <View style={styles.divider} /> : null}
      <Pressable style={styles.row} onPress={onToggle} onLongPress={onRemove}>
        <View style={styles.left}>
          {qty ? <Text style={[styles.qty, item.isChecked && styles.checkedText]}>{qty}</Text> : null}
          {unit ? (
            <View style={styles.unitPill}>
              <Text style={[styles.unitLabel, item.isChecked && styles.checkedText]}>{unit}</Text>
            </View>
          ) : null}
          <Text style={[styles.name, item.isChecked && styles.checkedText]} numberOfLines={2}>
            {item.name}
          </Text>
        </View>
        <View style={[styles.checkbox, item.isChecked && styles.checkboxChecked]}>
          {item.isChecked ? <Text style={styles.checkboxMark}>✓</Text> : null}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.line,
    marginLeft: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    minHeight: 52,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  qty: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.text,
  },
  unitPill: {
    backgroundColor: Colors.inputFill,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
  unitLabel: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text,
  },
  name: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 16,
    color: Colors.text,
    flexShrink: 1,
  },
  checkedText: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: Radii.pill,
    borderWidth: 1.5,
    borderColor: Colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  checkboxMark: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: Fonts.sansBold,
    marginTop: -1,
  },
});
