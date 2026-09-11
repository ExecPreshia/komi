import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ShoppingGroup } from '@/components/shopping/ShoppingGroup';
import { AppKeyboardAwareScrollView } from '@/components/ui/AppKeyboardAwareScrollView';
import { KomiConfirmSheet } from '@/components/ui/KomiActionSheet';
import { CartIcon } from '@/components/ui/icons';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useTranslation } from '@/i18n/useTranslation';
import { useKomiStore } from '@/store/komi-store';
import type { ShoppingListItem } from '@/types/recipe';

type ShoppingSection = {
  key: string;
  title: string | null;
  items: ShoppingListItem[];
};

export default function ShoppingScreen() {
  const { t } = useTranslation();
  const shoppingList = useKomiStore((state) => state.shoppingList);
  const addManualShoppingItem = useKomiStore((state) => state.addManualShoppingItem);
  const toggleShoppingItem = useKomiStore((state) => state.toggleShoppingItem);
  const setShoppingItemsChecked = useKomiStore((state) => state.setShoppingItemsChecked);
  const removeShoppingItem = useKomiStore((state) => state.removeShoppingItem);
  const removeCheckedShoppingItems = useKomiStore((state) => state.removeCheckedShoppingItems);

  const [draft, setDraft] = useState('');
  const [clearOpen, setClearOpen] = useState(false);

  const sections = useMemo(
    () =>
      buildSections(shoppingList, {
        fallbackRecipe: t('shopping.fallbackRecipeGroup'),
        manualGroup: t('shopping.manualGroup'),
      }),
    [shoppingList, t],
  );
  const checkedCount = shoppingList.filter((item) => item.isChecked).length;

  function submitManualItem() {
    const value = draft.trim();
    if (!value) return;
    addManualShoppingItem(value);
    setDraft('');
  }

  function handleRemove(id: string) {
    const item = shoppingList.find((entry) => entry.id === id);
    if (!item) return;
    Alert.alert(
      t('shopping.removeAlertTitle'),
      t('shopping.removeAlertMessage', { name: item.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => removeShoppingItem(id),
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <View style={styles.header}>
          <Text style={styles.title}>{t('shopping.title')}</Text>
          {checkedCount > 0 ? (
            <Pressable onPress={() => setClearOpen(true)} hitSlop={8}>
              <Text style={styles.clearLabel}>
                {t('shopping.clearAction', { count: checkedCount })}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.addBlock}>
          <View style={styles.addField}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={t('shopping.addPlaceholder')}
              placeholderTextColor={Colors.textMuted}
              style={styles.addInput}
              returnKeyType="done"
              onSubmitEditing={submitManualItem}
              blurOnSubmit={false}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('shopping.addA11y')}
              onPress={submitManualItem}
              style={[styles.addButton, !draft.trim() && styles.addButtonDisabled]}
              disabled={!draft.trim()}>
              <Text style={styles.addButtonLabel}>＋</Text>
            </Pressable>
          </View>
        </View>

        {shoppingList.length === 0 ? (
          <View style={styles.empty}>
            <CartIcon color={Colors.accent} size={40} />
            <Text style={styles.emptyText}>{t('shopping.empty')}</Text>
          </View>
        ) : (
          <AppKeyboardAwareScrollView
            style={styles.flex}
            contentContainerStyle={styles.listContent}
            bottomOffset={24}
            showsVerticalScrollIndicator={false}>
            {sections.map((section) => (
              <ShoppingGroup
                key={section.key}
                title={section.title}
                items={section.items}
                onToggle={toggleShoppingItem}
                onRemove={handleRemove}
                onToggleGroup={setShoppingItemsChecked}
              />
            ))}
          </AppKeyboardAwareScrollView>
        )}
      </KeyboardAvoidingView>

      <KomiConfirmSheet
        visible={clearOpen}
        title={t('shopping.clearConfirmTitle')}
        message={t('shopping.clearConfirmMessage', { count: checkedCount })}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('shopping.clearConfirmAction')}
        destructive
        onClose={() => setClearOpen(false)}
        onConfirm={removeCheckedShoppingItems}
      />
    </SafeAreaView>
  );
}

function buildSections(
  items: ShoppingListItem[],
  labels: { fallbackRecipe: string; manualGroup: string },
): ShoppingSection[] {
  const ordered = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
  const recipeGroups = new Map<string, ShoppingSection>();
  const manual: ShoppingListItem[] = [];

  for (const item of ordered) {
    if (item.recipeId) {
      const existing = recipeGroups.get(item.recipeId);
      if (existing) {
        existing.items.push(item);
      } else {
        recipeGroups.set(item.recipeId, {
          key: item.recipeId,
          title: item.recipeTitle?.trim() || labels.fallbackRecipe,
          items: [item],
        });
      }
    } else {
      manual.push(item);
    }
  }

  const sections = Array.from(recipeGroups.values());
  if (manual.length > 0) {
    sections.push({
      key: 'manual',
      title: sections.length > 0 ? labels.manualGroup : null,
      items: manual,
    });
  }
  return sections;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
  },
  title: {
    fontFamily: Fonts.sansBold,
    fontSize: 28,
    color: Colors.text,
    flex: 1,
  },
  clearLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.accent,
  },
  addBlock: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
  addField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.line,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.one,
    minHeight: 48,
  },
  addInput: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: Spacing.two,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: Radii.pill,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    opacity: 0.4,
  },
  addButtonLabel: {
    color: Colors.white,
    fontSize: 22,
    fontFamily: Fonts.sansMedium,
    marginTop: -2,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    gap: Spacing.four,
  },
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.seven,
    gap: Spacing.four,
  },
});
