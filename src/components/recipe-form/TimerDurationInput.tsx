import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput } from 'react-native';

import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';

type TimerDurationInputProps = {
  timerSeconds: number | null;
  onChange: (timerSeconds: number | null) => void;
};

function partsFromSeconds(total: number | null): { minutes: string; seconds: string } {
  if (total == null || total <= 0) return { minutes: '', seconds: '' };
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return {
    minutes: String(mins),
    seconds: secs.toString().padStart(2, '0'),
  };
}

function digitsOnly(value: string, maxLength: number): string {
  return value.replace(/[^0-9]/g, '').slice(0, maxLength);
}

function toTimerSeconds(minutesText: string, secondsText: string): number | null {
  if (!minutesText && !secondsText) return null;
  const minutes = Number(minutesText) || 0;
  const seconds = Number(secondsText) || 0;
  const total = minutes * 60 + seconds;
  return total > 0 ? total : null;
}

/**
 * MM:SS duration entry with separate minute/second fields so typing and
 * backspace behave naturally (no forced jump after the first minute digit).
 */
export function TimerDurationInput({ timerSeconds, onChange }: TimerDurationInputProps) {
  const minutesRef = useRef<TextInput>(null);
  const secondsRef = useRef<TextInput>(null);
  const [minutesText, setMinutesText] = useState(() => partsFromSeconds(timerSeconds).minutes);
  const [secondsText, setSecondsText] = useState(() => partsFromSeconds(timerSeconds).seconds);
  const editingRef = useRef(false);

  useEffect(() => {
    if (editingRef.current) return;
    const parts = partsFromSeconds(timerSeconds);
    setMinutesText(parts.minutes);
    setSecondsText(parts.seconds);
  }, [timerSeconds]);

  function commit(nextMinutes: string, nextSeconds: string) {
    onChange(toTimerSeconds(nextMinutes, nextSeconds));
  }

  function handleMinutesChange(text: string) {
    const next = digitsOnly(text, 2);
    setMinutesText(next);
    commit(next, secondsText);
    if (next.length === 2) {
      secondsRef.current?.focus();
    }
  }

  function handleSecondsChange(text: string) {
    const next = digitsOnly(text, 2);
    setSecondsText(next);
    commit(minutesText, next);
  }

  const isEmpty = !minutesText && !secondsText;

  return (
    <Pressable
      style={styles.row}
      onPress={() => {
        if (isEmpty) minutesRef.current?.focus();
      }}>
      <TextInput
        ref={minutesRef}
        value={minutesText}
        onChangeText={handleMinutesChange}
        onFocus={() => {
          editingRef.current = true;
        }}
        onBlur={() => {
          editingRef.current = false;
          const parts = partsFromSeconds(toTimerSeconds(minutesText, secondsText));
          setMinutesText(parts.minutes);
          setSecondsText(parts.seconds);
        }}
        placeholder="0"
        placeholderTextColor={Colors.textMuted}
        keyboardType="number-pad"
        maxLength={2}
        selectTextOnFocus
        style={[styles.field, styles.minutesField]}
      />
      <Text style={styles.colon}>:</Text>
      <TextInput
        ref={secondsRef}
        value={secondsText}
        onChangeText={handleSecondsChange}
        onKeyPress={({ nativeEvent }) => {
          if (nativeEvent.key === 'Backspace' && secondsText.length === 0) {
            minutesRef.current?.focus();
          }
        }}
        onFocus={() => {
          if (isEmpty) {
            minutesRef.current?.focus();
            return;
          }
          editingRef.current = true;
        }}
        onBlur={() => {
          editingRef.current = false;
          const parts = partsFromSeconds(toTimerSeconds(minutesText, secondsText));
          setMinutesText(parts.minutes);
          setSecondsText(parts.seconds);
        }}
        placeholder="00"
        placeholderTextColor={Colors.textMuted}
        keyboardType="number-pad"
        maxLength={2}
        selectTextOnFocus
        style={[styles.field, styles.secondsField]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    minHeight: 48,
    borderRadius: Radii.md,
    backgroundColor: Colors.inputFill,
    paddingHorizontal: Spacing.three,
    gap: 2,
  },
  field: {
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: Spacing.two,
    textAlign: 'center',
  },
  minutesField: {
    minWidth: 28,
  },
  secondsField: {
    minWidth: 32,
  },
  colon: {
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.text,
    marginHorizontal: 1,
  },
});
