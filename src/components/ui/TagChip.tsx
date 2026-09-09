import { Pressable, StyleSheet, Text } from 'react-native';

import { Colors, Radii, Spacing, Typography } from '@/constants/theme';

type TagChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
};

export function TagChip({ label, selected = false, onPress, onRemove }: TagChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.chip, selected ? styles.selected : styles.idle]}>
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
      {onRemove ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Retirer ${label}`}
          hitSlop={8}
          onPress={onRemove}
          style={styles.remove}>
          <Text style={[styles.removeLabel, selected && styles.labelSelected]}>×</Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    gap: Spacing.one,
  },
  idle: {
    backgroundColor: Colors.tag,
  },
  selected: {
    backgroundColor: Colors.text,
  },
  label: {
    ...Typography.caption,
    color: Colors.text,
    textTransform: 'lowercase',
  },
  labelSelected: {
    color: Colors.white,
  },
  remove: {
    marginLeft: 2,
  },
  removeLabel: {
    fontSize: 14,
    lineHeight: 16,
    color: Colors.text,
  },
});
