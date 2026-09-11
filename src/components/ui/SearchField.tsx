import { StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Colors, Spacing, Typography } from '@/constants/theme';
import { useTranslation } from '@/i18n/useTranslation';

type SearchFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
};

export function SearchField({ value, onChangeText, placeholder }: SearchFieldProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <SearchIcon />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder ?? t('home.searchPlaceholder')}
          placeholderTextColor={Colors.textMuted}
          style={styles.input}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>
      <View style={styles.underline} />
    </View>
  );
}

function SearchIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={11} r={6.5} stroke={Colors.textMuted} strokeWidth={1.8} />
      <Path d="M16.5 16.5L21 21" stroke={Colors.textMuted} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  input: {
    flex: 1,
    ...Typography.body,
    paddingVertical: Spacing.one,
  },
  underline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.line,
    marginHorizontal: Spacing.three,
  },
});
