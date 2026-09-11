import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useTranslation } from '@/i18n/useTranslation';

const DEFAULT_CATEGORIES = ['Sauce', 'Marinade', 'Garniture'] as const;

type CategoryFieldProps = {
  value: string;
  recipeCategories: string[];
  onChange: (value: string) => void;
};

export function CategoryField({ value, recipeCategories, onChange }: CategoryFieldProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const options = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const option of [...DEFAULT_CATEGORIES, ...recipeCategories]) {
      const trimmed = option.trim();
      if (!trimmed) continue;
      const key = trimmed.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      list.push(trimmed);
    }
    return list;
  }, [recipeCategories]);

  const hasOptions = options.length > 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.field}>
        <TextInput
          value={value}
          onChangeText={(text) => {
            onChange(text);
            setOpen(false);
          }}
          onFocus={() => {
            if (hasOptions) setOpen(true);
          }}
          placeholder={t('form.categoryPlaceholder')}
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />
        {hasOptions ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('form.categoryShowA11y')}
            hitSlop={8}
            onPress={() => setOpen((current) => !current)}
            style={styles.chevronButton}>
            <Text style={styles.chevron}>{open ? '▲' : '▼'}</Text>
          </Pressable>
        ) : null}
      </View>
      {open && hasOptions ? (
        <View style={styles.dropdown}>
          {options.map((option) => (
            <Pressable
              key={option}
              style={styles.option}
              onPress={() => {
                onChange(option);
                setOpen(false);
              }}>
              <Text style={styles.optionLabel}>{option}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.one,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderRadius: Radii.md,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.line,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.two,
  },
  input: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: Spacing.two,
  },
  chevronButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  dropdown: {
    backgroundColor: Colors.white,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.line,
    overflow: 'hidden',
  },
  option: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.line,
  },
  optionLabel: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text,
  },
});
