import { type Href, Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppKeyboardAwareScrollView } from '@/components/ui/AppKeyboardAwareScrollView';
import { KomiConfirmSheet } from '@/components/ui/KomiActionSheet';
import { CloseIcon } from '@/components/ui/form-icons';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useTranslation } from '@/i18n/useTranslation';
import { useKomiStore } from '@/store/komi-store';

export default function RecipeNotesScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const recipe = useKomiStore((state) => state.recipes.find((item) => item.id === id));
  const updateRecipe = useKomiStore((state) => state.updateRecipe);
  const [notes, setNotes] = useState(recipe?.notes ?? '');
  const [savedOpen, setSavedOpen] = useState(false);

  if (!recipe) {
    return (
      <View style={[styles.missing, { paddingTop: insets.top }]}>
        <Text style={styles.missingTitle}>{t('common.recipeNotFound')}</Text>
        <Pressable onPress={() => router.replace('/' as Href)}>
          <Text style={styles.link}>{t('common.backHome')}</Text>
        </Pressable>
      </View>
    );
  }

  const activeRecipe = recipe;

  function saveNotes() {
    const trimmed = notes.trim();
    updateRecipe(activeRecipe.id, { notes: trimmed.length > 0 ? trimmed : null });
    setSavedOpen(true);
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('notes.title')}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          onPress={() => router.replace('/' as Href)}
          style={styles.closeButton}>
          <CloseIcon />
        </Pressable>
      </View>

      <AppKeyboardAwareScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}>
        <Text style={styles.prompt}>
          {t('notes.prompt', { title: activeRecipe.title })}
        </Text>

        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder={t('notes.placeholder')}
          placeholderTextColor={Colors.textMuted}
          multiline
          textAlignVertical="top"
          style={styles.input}
        />
      </AppKeyboardAwareScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.four) }]}>
        <Pressable style={styles.saveButton} onPress={saveNotes}>
          <Text style={styles.saveLabel}>{t('notes.save')}</Text>
        </Pressable>
      </View>

      <KomiConfirmSheet
        visible={savedOpen}
        title={t('notes.savedTitle')}
        message={t('notes.savedMessage', { title: activeRecipe.title })}
        confirmLabel={t('common.ok')}
        hideCancel
        onClose={() => setSavedOpen(false)}
        onConfirm={() => router.replace('/' as Href)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.four,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.four,
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    backgroundColor: Colors.primary,
  },
  missingTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 20,
    color: Colors.text,
  },
  link: {
    fontFamily: Fonts.bodyMedium,
    color: Colors.accent,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
  },
  headerTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 28,
    color: Colors.text,
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
  prompt: {
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textMuted,
    marginBottom: Spacing.four,
  },
  input: {
    minHeight: 220,
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: Spacing.four,
    fontFamily: Fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: Colors.text,
  },
  footer: {
    paddingTop: Spacing.four,
    backgroundColor: Colors.primary,
  },
  saveButton: {
    minHeight: 54,
    borderRadius: Radii.lg,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 17,
    color: Colors.white,
  },
});
