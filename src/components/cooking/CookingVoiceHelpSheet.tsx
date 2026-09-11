import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { CloseIcon } from '@/components/ui/form-icons';
import { Colors, Fonts, Radii, Shadows, Spacing } from '@/constants/theme';

const HELP_LINES = [
  { command: '« Suivant »', meaning: "passer à l'étape suivante" },
  { command: '« Précédent »', meaning: "revenir à l'étape précédente" },
  { command: '« Instruction »', meaning: "lire l'instruction à voix haute" },
  { command: '« Minuteur »', meaning: 'lancer le minuteur' },
] as const;

type Props = {
  visible: boolean;
  onClose: () => void;
};

/** Lightweight dismissible panel listing Cooking Mode voice commands. */
export function CookingVoiceHelpSheet({ visible, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.card} onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <Text style={styles.title}>Commandes vocales</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fermer"
              onPress={onClose}
              style={styles.closeButton}>
              <CloseIcon />
            </Pressable>
          </View>
          <View style={styles.list}>
            {HELP_LINES.map((line) => (
              <View key={line.command} style={styles.row}>
                <Text style={styles.command}>{line.command}</Text>
                <Text style={styles.meaning}>{line.meaning}</Text>
              </View>
            ))}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(44, 39, 35, 0.35)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.four,
    gap: Spacing.four,
    ...Shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  title: {
    flex: 1,
    fontFamily: Fonts.sansSemiBold,
    fontSize: 18,
    color: Colors.text,
  },
  list: {
    gap: Spacing.three,
  },
  row: {
    gap: Spacing.one,
  },
  command: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
    color: Colors.accent,
  },
  meaning: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textMuted,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: Radii.pill,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
