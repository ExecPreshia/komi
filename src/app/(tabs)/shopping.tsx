import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ShoppingGroup } from '@/components/shopping/ShoppingGroup';
import { CartIcon } from '@/components/ui/icons';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useKomiStore } from '@/store/komi-store';
import type { ShoppingListItem } from '@/types/recipe';

type ShoppingSection = {
  key: string;
  title: string | null;
  items: ShoppingListItem[];
};

export default function ShoppingScreen() {
  const shoppingList = useKomiStore((state) => state.shoppingList);
  const addManualShoppingItem = useKomiStore((state) => state.addManualShoppingItem);
  const toggleShoppingItem = useKomiStore((state) => state.toggleShoppingItem);
  const removeShoppingItem = useKomiStore((state) => state.removeShoppingItem);
  const removeCheckedShoppingItems = useKomiStore((state) => state.removeCheckedShoppingItems);

  const [draft, setDraft] = useState('');

  const sections = useMemo(() => buildSections(shoppingList), [shoppingList]);
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
    Alert.alert('Supprimer', `Retirer « ${item.name} » de la liste ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => removeShoppingItem(id),
      },
    ]);
  }

  function handleClearChecked() {
    Alert.alert(
      'Nettoyer la liste',
      `Supprimer ${checkedCount} article${checkedCount > 1 ? 's' : ''} coché${checkedCount > 1 ? 's' : ''} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Nettoyer',
          style: 'destructive',
          onPress: removeCheckedShoppingItems,
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text style={styles.title}>Liste de courses</Text>
          {checkedCount > 0 ? (
            <Pressable onPress={handleClearChecked} hitSlop={8}>
              <Text style={styles.clearLabel}>Nettoyer ({checkedCount})</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.addBlock}>
          <View style={styles.addField}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Ajouter un ingrédient…"
              placeholderTextColor={Colors.textMuted}
              style={styles.addInput}
              returnKeyType="done"
              onSubmitEditing={submitManualItem}
              blurOnSubmit={false}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ajouter à la liste"
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
            <Text style={styles.emptyText}>
              Votre liste est vide. Ajoutez les ingrédients manquants depuis une recette ou
              ajoutez-les manuellement ici.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {sections.map((section) => (
              <ShoppingGroup
                key={section.key}
                title={section.title}
                items={section.items}
                onToggle={toggleShoppingItem}
                onRemove={handleRemove}
              />
            ))}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function buildSections(items: ShoppingListItem[]): ShoppingSection[] {
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
          title: item.recipeTitle?.trim() || 'Recette',
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
      title: sections.length > 0 ? 'Ajouts manuels' : null,
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
