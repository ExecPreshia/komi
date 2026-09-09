import { Image } from 'expo-image';
import { type Href, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TagChip } from '@/components/ui/TagChip';
import { PinIcon } from '@/components/ui/PinIcon';
import {
  BackArrowIcon,
  CartGlyphIcon,
  ChefHatIcon,
  ClockIcon,
  CostIcon,
  DifficultyMetaDots,
  LightbulbIcon,
  MoreIcon,
} from '@/components/recipe/detail-icons';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useKomiStore } from '@/store/komi-store';
import type { Difficulty, Recipe } from '@/types/recipe';
import { COST_LABELS, DIFFICULTY_LABELS, normalizeCostLevel } from '@/utils/format';
import {
  formatCookingTimeLong,
  formatScaledQuantity,
  groupIngredients,
  scaleQuantity,
} from '@/utils/quantity';

type DetailTab = 'ingredients' | 'preparation';

function difficultyLevel(value: Difficulty): 1 | 2 | 3 {
  if (value === 'moyen') return 2;
  if (value === 'difficile') return 3;
  return 1;
}

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const recipe = useKomiStore((state) => state.recipes.find((item) => item.id === id));
  const togglePin = useKomiStore((state) => state.togglePin);
  const deleteRecipe = useKomiStore((state) => state.deleteRecipe);
  const addIngredientsToShoppingList = useKomiStore((state) => state.addIngredientsToShoppingList);

  const [tab, setTab] = useState<DetailTab>('ingredients');
  const [servings, setServings] = useState(2);

  useEffect(() => {
    if (recipe) setServings(recipe.baseServings || 2);
  }, [recipe?.id, recipe?.baseServings]);

  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setCheckedIds(new Set());
    setTab('ingredients');
  }, [recipe?.id]);

  const groups = useMemo(
    () => (recipe ? groupIngredients(recipe.ingredients) : []),
    [recipe],
  );

  const uncheckedIngredients = useMemo(() => {
    if (!recipe) return [];
    return recipe.ingredients.filter((item) => !checkedIds.has(item.id));
  }, [recipe, checkedIds]);

  if (!recipe) {
    return (
      <View style={[styles.missing, { paddingTop: insets.top }]}>
        <Text style={styles.missingTitle}>Recette introuvable</Text>
        <Pressable onPress={() => router.back()} style={styles.missingButton}>
          <Text style={styles.missingButtonLabel}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  const currentRecipe = recipe;

  function toggleChecked(ingredientId: string) {
    setCheckedIds((current) => {
      const next = new Set(current);
      if (next.has(ingredientId)) next.delete(ingredientId);
      else next.add(ingredientId);
      return next;
    });
  }

  function handleDelete() {
    setMenuOpen(false);
    Alert.alert(
      'Supprimer la recette',
      `Voulez-vous vraiment supprimer « ${currentRecipe.title} » ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            deleteRecipe(currentRecipe.id);
            router.replace('/' as Href);
          },
        },
      ],
    );
  }

  function handleAddToShopping() {
    const count = addIngredientsToShoppingList(currentRecipe, uncheckedIngredients, servings);
    if (count === 0) {
      Alert.alert('Liste de courses', 'Tous les ingrédients sont déjà cochés.');
      return;
    }
    Alert.alert('Liste de courses', `${count} ingrédient${count > 1 ? 's' : ''} ajouté${count > 1 ? 's' : ''}.`);
  }

  const footerPadding = Math.max(insets.bottom, Spacing.three);

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: tab === 'ingredients' ? 160 : 110 }}
        showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          {recipe.photoUri ? (
            <Image source={{ uri: recipe.photoUri }} style={styles.heroImage} contentFit="cover" />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]}>
              <Text style={styles.heroPlaceholderText}>Sans photo</Text>
            </View>
          )}

          <View style={[styles.heroActions, { top: insets.top + Spacing.two }]}>
            <RoundButton onPress={() => router.back()} accessibilityLabel="Retour">
              <BackArrowIcon />
            </RoundButton>
            <View style={styles.heroActionsRight}>
              <RoundButton
                onPress={() => togglePin(recipe.id)}
                accessibilityLabel={recipe.isPinned ? 'Retirer du menu' : 'Ajouter au menu'}>
                <PinIcon active={recipe.isPinned} />
              </RoundButton>
              <RoundButton onPress={() => setMenuOpen(true)} accessibilityLabel="Plus d'options">
                <MoreIcon />
              </RoundButton>
            </View>
          </View>
        </View>

        <View style={styles.sheet}>
          <Text style={styles.title}>{recipe.title}</Text>
          <View style={styles.tags}>
            {recipe.tags.map((tag) => (
              <TagChip key={tag} label={tag} />
            ))}
          </View>

          <View style={styles.metaRow}>
            <MetaItem
              icon={<ClockIcon />}
              label={formatCookingTimeLong(recipe.cookingTimeMinutes)}
            />
            <Text style={styles.metaDot}>•</Text>
            <MetaItem
              icon={<DifficultyMetaDots level={difficultyLevel(recipe.difficulty)} />}
              label={DIFFICULTY_LABELS[recipe.difficulty]}
            />
            <Text style={styles.metaDot}>•</Text>
            <MetaItem
              icon={<CostIcon />}
              label={COST_LABELS[normalizeCostLevel(recipe.costLevel)]}
            />
          </View>

          <View style={styles.tabs}>
            <Pressable style={styles.tab} onPress={() => setTab('ingredients')}>
              <Text style={[styles.tabLabel, tab === 'ingredients' && styles.tabLabelActive]}>
                Ingrédients
              </Text>
              {tab === 'ingredients' ? <View style={styles.tabUnderline} /> : null}
            </Pressable>
            <Pressable style={styles.tab} onPress={() => setTab('preparation')}>
              <Text style={[styles.tabLabel, tab === 'preparation' && styles.tabLabelActive]}>
                Préparation
              </Text>
              {tab === 'preparation' ? <View style={styles.tabUnderline} /> : null}
            </Pressable>
          </View>

          {tab === 'ingredients' ? (
            <IngredientsPanel
              recipe={recipe}
              servings={servings}
              setServings={setServings}
              groups={groups}
              checkedIds={checkedIds}
              onToggleChecked={toggleChecked}
            />
          ) : (
            <PreparationPanel recipe={recipe} />
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: footerPadding }]}>
        {tab === 'ingredients' ? (
          <Pressable style={styles.shoppingButton} onPress={handleAddToShopping}>
            <CartGlyphIcon />
            <Text style={styles.shoppingLabel}>
              Ajouter [{uncheckedIngredients.length}] à la liste de courses
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          style={styles.cookButton}
          onPress={() =>
            Alert.alert('Bientôt', 'Le mode Cuisiner arrive à la prochaine étape.')
          }>
          <ChefHatIcon />
          <Text style={styles.cookLabel}>Cuisiner</Text>
        </Pressable>
      </View>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)}>
          <View style={[styles.menuSheet, { paddingBottom: footerPadding }]}>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                router.push(`/recipe/${recipe.id}/edit` as Href);
              }}>
              <Text style={styles.menuItemLabel}>Modifier</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={handleDelete}>
              <Text style={[styles.menuItemLabel, styles.menuItemDanger]}>Supprimer</Text>
            </Pressable>
            <Pressable style={styles.menuCancel} onPress={() => setMenuOpen(false)}>
              <Text style={styles.menuCancelLabel}>Annuler</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function RoundButton({
  children,
  onPress,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={styles.roundButton}>
      {children}
    </Pressable>
  );
}

function MetaItem({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <View style={styles.metaItem}>
      {icon}
      <Text style={styles.metaLabel}>{label}</Text>
    </View>
  );
}

function IngredientsPanel({
  recipe,
  servings,
  setServings,
  groups,
  checkedIds,
  onToggleChecked,
}: {
  recipe: Recipe;
  servings: number;
  setServings: (value: number) => void;
  groups: ReturnType<typeof groupIngredients>;
  checkedIds: Set<string>;
  onToggleChecked: (id: string) => void;
}) {
  return (
    <View style={styles.panel}>
      <View style={styles.portionsBar}>
        <Text style={styles.portionsLabel}>Portions</Text>
        <View style={styles.portionsControls}>
          <Pressable
            style={styles.portionButton}
            onPress={() => setServings(Math.max(1, servings - 1))}>
            <Text style={styles.portionButtonLabel}>−</Text>
          </Pressable>
          <Text style={styles.portionsValue}>{servings}</Text>
          <Pressable style={styles.portionButton} onPress={() => setServings(servings + 1)}>
            <Text style={styles.portionButtonLabel}>+</Text>
          </Pressable>
        </View>
      </View>

      {groups.map((group) => (
        <View key={group.category ?? 'main'} style={styles.groupBlock}>
          {group.category ? <Text style={styles.groupTitle}>{group.category}</Text> : null}
          <View style={styles.ingredientCard}>
            {group.items.map((ingredient, index) => {
              const scaled = scaleQuantity(ingredient.quantity, recipe.baseServings, servings);
              const qtyLabel = formatScaledQuantity(scaled);
              const checked = checkedIds.has(ingredient.id);
              return (
                <View key={ingredient.id}>
                  {index > 0 ? <View style={styles.ingredientDivider} /> : null}
                  <Pressable style={styles.ingredientRow} onPress={() => onToggleChecked(ingredient.id)}>
                    <View style={styles.ingredientLeft}>
                      {qtyLabel ? <Text style={styles.ingredientQty}>{qtyLabel}</Text> : null}
                      {ingredient.unit ? (
                        <View style={styles.unitPill}>
                          <Text style={styles.unitPillLabel}>{ingredient.unit}</Text>
                        </View>
                      ) : null}
                      <Text style={[styles.ingredientName, checked && styles.ingredientChecked]}>
                        {ingredient.name}
                      </Text>
                    </View>
                    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                      {checked ? <Text style={styles.checkboxMark}>✓</Text> : null}
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

function PreparationPanel({ recipe }: { recipe: Recipe }) {
  const notes = recipe.notes?.trim();
  const noteLines = notes
    ? notes
        .split('\n')
        .map((line) => line.replace(/^•\s*/, '').trim())
        .filter(Boolean)
    : [];

  return (
    <View style={styles.panel}>
      {noteLines.length > 0 ? (
        <View style={styles.notesCard}>
          <View style={styles.notesHeader}>
            <LightbulbIcon />
            <Text style={styles.notesTitle}>Remarques</Text>
          </View>
          {noteLines.map((line) => (
            <Text key={line} style={styles.noteLine}>
              • {line}
            </Text>
          ))}
        </View>
      ) : null}

      <Text style={styles.stepsHeading}>Étapes</Text>
      {[...recipe.steps]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((step) => (
          <View key={step.id} style={styles.stepBlock}>
            <Text style={styles.stepTitle}>{step.title || 'Étape'}</Text>
            <View style={styles.stepCard}>
              {[...step.subSteps]
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((sub, index) => (
                  <Text key={sub.id} style={styles.stepBody}>
                    {index + 1}. {sub.body}
                  </Text>
                ))}
              {step.subSteps.length === 0 ? (
                <Text style={styles.stepBody}>Aucune sous-étape.</Text>
              ) : null}
            </View>
          </View>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  scroll: {
    flex: 1,
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
  missingButton: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  missingButtonLabel: {
    fontFamily: Fonts.bodyMedium,
    color: Colors.accent,
  },
  hero: {
    height: 320,
    backgroundColor: Colors.secondary,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPlaceholderText: {
    fontFamily: Fonts.body,
    color: Colors.textMuted,
  },
  heroActions: {
    position: 'absolute',
    left: Spacing.four,
    right: Spacing.four,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroActionsRight: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  roundButton: {
    width: 44,
    height: 44,
    borderRadius: Radii.pill,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    marginTop: -28,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    gap: Spacing.three,
  },
  title: {
    fontFamily: Fonts.sansBold,
    fontSize: 32,
    color: Colors.text,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
  },
  metaItem: {
    alignItems: 'center',
    gap: Spacing.one,
    flex: 1,
  },
  metaLabel: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text,
  },
  metaDot: {
    color: Colors.textMuted,
    marginBottom: Spacing.four,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.two,
  },
  tab: {
    alignItems: 'center',
    minWidth: 120,
    paddingBottom: Spacing.two,
  },
  tabLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 17,
    color: Colors.textMuted,
  },
  tabLabelActive: {
    color: Colors.text,
  },
  tabUnderline: {
    marginTop: Spacing.two,
    height: 3,
    width: 42,
    borderRadius: 2,
    backgroundColor: Colors.text,
  },
  panel: {
    gap: Spacing.three,
    paddingBottom: Spacing.four,
  },
  portionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.secondary,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  portionsLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 15,
    color: Colors.text,
  },
  portionsControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  portionButton: {
    width: 28,
    height: 28,
    borderRadius: Radii.pill,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portionButtonLabel: {
    fontFamily: Fonts.sansBold,
    fontSize: 18,
    color: Colors.text,
    marginTop: -1,
  },
  portionsValue: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 18,
    color: Colors.text,
    minWidth: 20,
    textAlign: 'center',
  },
  groupBlock: {
    gap: Spacing.two,
  },
  groupTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 16,
    color: Colors.text,
  },
  ingredientCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.three,
    shadowColor: Colors.text,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  ingredientDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.line,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  ingredientLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
    flex: 1,
  },
  ingredientQty: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 15,
    color: Colors.text,
    minWidth: 28,
  },
  unitPill: {
    backgroundColor: Colors.inputFill,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
  unitPillLabel: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textMuted,
  },
  ingredientName: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 15,
    color: Colors.text,
  },
  ingredientChecked: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: Radii.pill,
    borderWidth: 1.5,
    borderColor: Colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  checkboxMark: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: Fonts.bodyBold,
  },
  notesCard: {
    backgroundColor: Colors.secondary,
    borderRadius: Radii.lg,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  notesTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 16,
    color: Colors.text,
  },
  noteLine: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.accent,
  },
  stepsHeading: {
    fontFamily: Fonts.sansBold,
    fontSize: 18,
    color: Colors.text,
  },
  stepBlock: {
    gap: Spacing.two,
  },
  stepTitle: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  stepCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: Spacing.three,
    gap: Spacing.two,
    shadowColor: Colors.text,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  stepBody: {
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.text,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.line,
  },
  shoppingButton: {
    minHeight: 48,
    borderRadius: Radii.lg,
    backgroundColor: Colors.text,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  shoppingLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 15,
    color: Colors.white,
  },
  cookButton: {
    minHeight: 52,
    borderRadius: Radii.lg,
    backgroundColor: Colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  cookLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 17,
    color: Colors.white,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  menuSheet: {
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: Spacing.two,
    paddingHorizontal: Spacing.four,
    gap: Spacing.one,
  },
  menuItem: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    paddingVertical: Spacing.four,
    alignItems: 'center',
  },
  menuItemLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 17,
    color: Colors.text,
  },
  menuItemDanger: {
    color: Colors.accent,
  },
  menuCancel: {
    paddingVertical: Spacing.four,
    alignItems: 'center',
  },
  menuCancelLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 16,
    color: Colors.textMuted,
  },
});
