import { Pressable, StyleSheet, Text } from 'react-native';

import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';

const TAG_UNSELECTED_BG = '#F7F4EF';
const TAG_SELECTED_BG = '#2C2723';
const TAG_UNSELECTED_TEXT = '#2C2723';
const TAG_SELECTED_TEXT = '#FFFFFF';

type TagChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export function TagChip({ label, selected = false, onPress }: TagChipProps) {
  const selectable = typeof onPress === 'function';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={!selectable}
      style={[
        styles.chip,
        selected ? styles.selected : selectable ? styles.unselected : styles.display,
      ]}>
      <Text
        style={[
          styles.label,
          selected ? styles.labelSelected : selectable ? styles.labelUnselected : styles.labelDisplay,
        ]}>
        {label}
      </Text>
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
  },
  display: {
    backgroundColor: Colors.tag,
  },
  unselected: {
    backgroundColor: TAG_UNSELECTED_BG,
  },
  selected: {
    backgroundColor: TAG_SELECTED_BG,
  },
  label: {
    fontFamily: Fonts.body,
    fontSize: 12,
    textTransform: 'lowercase',
  },
  labelDisplay: {
    color: Colors.text,
  },
  labelUnselected: {
    color: TAG_UNSELECTED_TEXT,
  },
  labelSelected: {
    color: TAG_SELECTED_TEXT,
  },
});
