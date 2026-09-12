import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Radii, Shadows, Spacing } from '@/constants/theme';
import { useTranslation } from '@/i18n/useTranslation';

const HELP_LINE_KEYS = [
  { command: 'cook.voiceCmd.next', meaning: 'cook.voiceCmd.nextMeaning' },
  { command: 'cook.voiceCmd.prev', meaning: 'cook.voiceCmd.prevMeaning' },
  { command: 'cook.voiceCmd.instruction', meaning: 'cook.voiceCmd.instructionMeaning' },
  { command: 'cook.voiceCmd.timer', meaning: 'cook.voiceCmd.timerMeaning' },
] as const;

type Props = {
  visible: boolean;
  top: number;
  /** Horizontal center of the `?` button, used to place the speech-bubble caret. */
  anchorX: number;
  onClose: () => void;
};

/** Compact speech bubble listing Cooking Mode voice commands under the mic/? controls. */
export function CookingVoiceHelpBubble({ visible, top, anchorX, onClose }: Props) {
  const { t } = useTranslation();

  if (!visible) return null;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.close')}
        onPress={onClose}
        style={styles.dismissLayer}
      />
      <View
        pointerEvents="box-none"
        style={[styles.anchor, { top }]}
        onStartShouldSetResponder={() => true}>
        <View style={styles.bubble}>
          <View
            pointerEvents="none"
            style={[
              styles.caret,
              { left: Math.max(Spacing.four, anchorX - Spacing.four - 7) },
            ]}
          />
          <Text style={styles.title}>{t('cook.voiceHelpTitle')}</Text>
          <View style={styles.list}>
            {HELP_LINE_KEYS.map((line) => (
              <View key={line.command} style={styles.row}>
                <Text style={styles.command}>{t(line.command)}</Text>
                <Text style={styles.meaning}>{t(line.meaning)}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  dismissLayer: {
    ...StyleSheet.absoluteFill,
    zIndex: 20,
  },
  anchor: {
    position: 'absolute',
    left: Spacing.four,
    right: Spacing.four,
    zIndex: 21,
  },
  bubble: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.line,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
    ...Shadows.card,
  },
  caret: {
    position: 'absolute',
    top: -7,
    width: 14,
    height: 14,
    backgroundColor: Colors.white,
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: Colors.line,
    transform: [{ rotate: '45deg' }],
  },
  title: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
    color: Colors.text,
  },
  list: {
    gap: Spacing.two,
  },
  row: {
    gap: 1,
  },
  command: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    color: Colors.accent,
  },
  meaning: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textMuted,
  },
});
