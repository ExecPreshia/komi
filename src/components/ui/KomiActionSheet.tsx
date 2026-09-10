import { type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';

export type KomiActionSheetItem = {
  label: string;
  onPress: () => void;
  destructive?: boolean;
};

type KomiActionSheetProps = {
  visible: boolean;
  title?: string;
  message?: string;
  items: KomiActionSheetItem[];
  cancelLabel?: string;
  onClose: () => void;
};

/**
 * Bottom sheet matching the recipe detail overflow menu visual language.
 */
export function KomiActionSheet({
  visible,
  title,
  message,
  items,
  cancelLabel = 'Annuler',
  onClose,
}: KomiActionSheetProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Spacing.three);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={[styles.sheet, { paddingBottom: bottomPad }]} onStartShouldSetResponder={() => true}>
          {title || message ? (
            <View style={styles.header}>
              {title ? <Text style={styles.title}>{title}</Text> : null}
              {message ? <Text style={styles.message}>{message}</Text> : null}
            </View>
          ) : null}

          {items.map((item) => (
            <Pressable
              key={item.label}
              style={styles.item}
              onPress={() => {
                onClose();
                item.onPress();
              }}>
              <Text style={[styles.itemLabel, item.destructive && styles.itemDestructive]}>
                {item.label}
              </Text>
            </Pressable>
          ))}

          <Pressable style={styles.cancel} onPress={onClose}>
            <Text style={styles.cancelLabel}>{cancelLabel}</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

type KomiConfirmSheetProps = {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  hideCancel?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  icon?: ReactNode;
};

/** Centered confirm dialog for cooking-mode quit and similar prompts. */
export function KomiConfirmSheet({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Continuer',
  destructive = false,
  hideCancel = false,
  onConfirm,
  onClose,
  icon,
}: KomiConfirmSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.confirmBackdrop} onPress={onClose}>
        <View style={styles.confirmCard} onStartShouldSetResponder={() => true}>
          {icon ? <View style={styles.confirmIcon}>{icon}</View> : null}
          <Text style={styles.confirmTitle}>{title}</Text>
          {message ? <Text style={styles.confirmMessage}>{message}</Text> : null}
          <View style={styles.confirmActions}>
            {hideCancel ? null : (
              <Pressable style={styles.confirmSecondary} onPress={onClose}>
                <Text style={styles.confirmSecondaryLabel}>{cancelLabel}</Text>
              </Pressable>
            )}
            <Pressable
              style={[
                styles.confirmPrimary,
                hideCancel && styles.confirmPrimaryFull,
                destructive && styles.confirmPrimaryDestructive,
              ]}
              onPress={() => {
                onClose();
                onConfirm();
              }}>
              <Text style={styles.confirmPrimaryLabel}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(44, 39, 35, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.primary,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    paddingTop: Spacing.two,
    paddingHorizontal: Spacing.four,
    gap: Spacing.one,
  },
  header: {
    paddingHorizontal: Spacing.two,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    gap: Spacing.one,
    alignItems: 'center',
  },
  title: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 18,
    color: Colors.text,
    textAlign: 'center',
  },
  message: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  item: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    paddingVertical: Spacing.four,
    alignItems: 'center',
  },
  itemLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 17,
    color: Colors.text,
  },
  itemDestructive: {
    color: Colors.accent,
  },
  cancel: {
    paddingVertical: Spacing.four,
    alignItems: 'center',
  },
  cancelLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 16,
    color: Colors.textMuted,
  },
  confirmBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(44, 39, 35, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
  },
  confirmCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.four,
    gap: Spacing.three,
    alignItems: 'center',
  },
  confirmIcon: {
    marginBottom: Spacing.one,
  },
  confirmTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 20,
    color: Colors.text,
    textAlign: 'center',
  },
  confirmMessage: {
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  confirmActions: {
    width: '100%',
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  confirmSecondary: {
    flex: 1,
    minHeight: 48,
    borderRadius: Radii.lg,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  confirmSecondaryLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 15,
    color: Colors.text,
  },
  confirmPrimary: {
    flex: 1,
    minHeight: 48,
    borderRadius: Radii.lg,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  confirmPrimaryFull: {
    flex: 1,
  },
  confirmPrimaryDestructive: {
    backgroundColor: Colors.accent,
  },
  confirmPrimaryLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
    color: Colors.white,
  },
});
