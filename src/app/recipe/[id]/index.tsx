import { Image } from 'expo-image';
import { type Href, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInput as TextInputType,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppKeyboardAwareScrollView } from '@/components/ui/AppKeyboardAwareScrollView';
import { KomiConfirmSheet } from '@/components/ui/KomiActionSheet';
import { showKomiToast, ToastBottomAnchor } from '@/components/ui/KomiToast';
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
import { Colors, Fonts, Radii, Shadows, Spacing } from '@/constants/theme';
import { useTranslation } from '@/i18n/useTranslation';
import { useKomiStore } from '@/store/komi-store';
import type { Difficulty, Recipe } from '@/types/recipe';
import { formatCost, formatDifficulty, normalizeCostLevel } from '@/utils/format';
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
  const { t, locale } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const recipe = useKomiStore((state) => state.recipes.find((item) => item.id === id));
  const togglePin = useKomiStore((state) => state.togglePin);
  const deleteRecipe = useKomiStore((state) => state.deleteRecipe);
  const duplicateRecipe = useKomiStore((state) => state.duplicateRecipe);
  const addIngredientsToShoppingList = useKomiStore((state) => state.addIngredientsToShoppingList);
  const shoppingList = useKomiStore((state) => state.shoppingList);

  const [tab, setTab] = useState<DetailTab>('ingredients');
  const [servings, setServings] = useState(2);

  useEffect(() => {
    if (recipe) setServings(recipe.baseServings || 2);
  }, [recipe?.id, recipe?.baseServings]);

  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [shoppingFeedback, setShoppingFeedback] = useState<{
    title: string;
    message?: string;
  } | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const updateRecipe = useKomiStore((state) => state.updateRecipe);

  useEffect(() => {
    setCheckedIds(new Set());
    setTab('ingredients');
    setEditingNotes(false);
    setNotesDraft('');
  }, [recipe?.id]);

  const groups = useMemo(
    () => (recipe ? groupIngredients(recipe.ingredients) : []),
    [recipe],
  );

  const activeShoppingIngredientIds = useMemo(() => {
    if (!recipe) return new Set<string>();
    return new Set(
      shoppingList
        .filter((item) => item.recipeId === recipe.id && item.ingredientId && !item.isChecked)
        .map((item) => item.ingredientId as string),
    );
  }, [recipe, shoppingList]);

  const missingShoppingIngredients = useMemo(() => {
    if (!recipe) return [];
    return recipe.ingredients.filter(
      (item) => !checkedIds.has(item.id) && !activeShoppingIngredientIds.has(item.id),
    );
  }, [recipe, checkedIds, activeShoppingIngredientIds]);

  const goToIngredients = useCallback(() => setTab('ingredients'), []);
  const goToPreparation = useCallback(() => setTab('preparation'), []);

  const tabSwipe = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-24, 24])
        .failOffsetY([-20, 20])
        .onEnd((event) => {
          if (event.translationX < -48) {
            runOnJS(goToPreparation)();
          } else if (event.translationX > 48) {
            runOnJS(goToIngredients)();
          }
        }),
    [goToIngredients, goToPreparation],
  );

  if (!recipe) {
    return (
      <View style={[styles.missing, { paddingTop: insets.top }]}>
        <Text style={styles.missingTitle}>{t('common.recipeNotFound')}</Text>
        <Pressable onPress={() => router.back()} style={styles.missingButton}>
          <Text style={styles.missingButtonLabel}>{t('common.back')}</Text>
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
    setDeleteConfirmOpen(true);
  }

  function confirmDelete() {
    deleteRecipe(currentRecipe.id);
    showKomiToast(t('detail.toastDeleted'));
    router.replace('/' as Href);
  }

  function handleDuplicate() {
    setMenuOpen(false);
    const copy = duplicateRecipe(currentRecipe.id);
    if (!copy) return;
    showKomiToast(t('detail.toastDuplicated'));
  }

  function handleAddToShopping() {
    if (missingShoppingIngredients.length === 0) return;
    const count = addIngredientsToShoppingList(currentRecipe, missingShoppingIngredients, servings);
    if (count === 0) {
      setShoppingFeedback({ title: t('detail.shoppingAlreadyAdded') });
      return;
    }
    setShoppingFeedback({
      title: t('detail.shoppingAddedTitle'),
      message: t('detail.shoppingAddedMessage', { count }),
    });
  }

  function openNotesEditor() {
    setMenuOpen(false);
    setTab('preparation');
    setNotesDraft(currentRecipe.notes ?? '');
    setEditingNotes(true);
  }

  function saveNotes() {
    const trimmed = notesDraft.trim();
    updateRecipe(currentRecipe.id, { notes: trimmed.length > 0 ? trimmed : null });
    setEditingNotes(false);
  }

  const footerPadding = Math.max(insets.bottom, Spacing.three);
  const cookFooterClearance = footerPadding + 52 + Spacing.four;
  const missingShoppingCount = missingShoppingIngredients.length;
  const shoppingDisabled = missingShoppingCount === 0;

  return (
    <View style={styles.root}>
      <AppKeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: cookFooterClearance }}
        bottomOffset={cookFooterClearance}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          {recipe.photoUri ? (
            <Image source={{ uri: recipe.photoUri }} style={styles.heroImage} contentFit="cover" />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]}>
              <Text style={styles.heroPlaceholderText}>{t('common.noPhoto')}</Text>
            </View>
          )}
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
              label={formatDifficulty(recipe.difficulty, locale)}
            />
            <Text style={styles.metaDot}>•</Text>
            <MetaItem
              icon={<CostIcon />}
              label={formatCost(normalizeCostLevel(recipe.costLevel), locale)}
            />
          </View>

          <View style={styles.tabs}>
            <View style={styles.tabsRow}>
              <Pressable style={styles.tab} onPress={() => setTab('ingredients')}>
                <Text style={[styles.tabLabel, tab === 'ingredients' && styles.tabLabelActive]}>
                  {t('detail.tabIngredients')}
                </Text>
                {tab === 'ingredients' ? <View style={styles.tabUnderline} /> : null}
              </Pressable>
              <Pressable style={styles.tab} onPress={() => setTab('preparation')}>
                <Text style={[styles.tabLabel, tab === 'preparation' && styles.tabLabelActive]}>
                  {t('detail.tabPreparation')}
                </Text>
                {tab === 'preparation' ? <View style={styles.tabUnderline} /> : null}
              </Pressable>
            </View>
            <View style={styles.tabsBottomLine} />
          </View>

          <GestureDetector gesture={tabSwipe}>
            <View>
              {tab === 'ingredients' ? (
                <IngredientsPanel
                  recipe={recipe}
                  servings={servings}
                  setServings={setServings}
                  groups={groups}
                  checkedIds={checkedIds}
                  shoppingIngredientIds={activeShoppingIngredientIds}
                  onToggleChecked={toggleChecked}
                  missingShoppingCount={missingShoppingCount}
                  shoppingDisabled={shoppingDisabled}
                  onAddToShopping={handleAddToShopping}
                />
              ) : (
                <PreparationPanel
                  recipe={recipe}
                  editingNotes={editingNotes}
                  notesDraft={notesDraft}
                  onChangeNotes={setNotesDraft}
                  onSaveNotes={saveNotes}
                  onCancelNotes={() => setEditingNotes(false)}
                />
              )}
            </View>
          </GestureDetector>
        </View>
      </AppKeyboardAwareScrollView>

      <View style={[styles.stickyActions, { top: insets.top + Spacing.two }]} pointerEvents="box-none">
        <RoundButton onPress={() => router.back()} accessibilityLabel={t('detail.backA11y')}>
          <BackArrowIcon />
        </RoundButton>
        <View style={styles.heroActionsRight}>
          <RoundButton
            onPress={() => togglePin(recipe.id)}
            accessibilityLabel={
              recipe.isPinned ? t('home.pinRemoveA11y') : t('home.pinAddA11y')
            }>
            <PinIcon active={recipe.isPinned} size={16} />
          </RoundButton>
          <RoundButton
            onPress={() => setMenuOpen(true)}
            accessibilityLabel={t('detail.moreOptionsA11y')}>
            <MoreIcon />
          </RoundButton>
        </View>
      </View>

      <ToastBottomAnchor id="recipe-detail-footer" style={[styles.footer, { paddingBottom: footerPadding }]}>
        <Pressable
          style={styles.cookButton}
          onPress={() => {
            if (recipe.steps.length === 0) {
              Alert.alert(t('detail.noStepsTitle'), t('detail.noStepsMessage'));
              return;
            }
            router.push(`/recipe/${recipe.id}/cook?servings=${servings}` as Href);
          }}>
          <ChefHatIcon />
          <Text style={styles.cookLabel}>{t('detail.cook')}</Text>
        </Pressable>
      </ToastBottomAnchor>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)}>
          <View style={[styles.menuSheet, { paddingBottom: footerPadding }]}>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                router.push(`/recipe/${recipe.id}/edit` as Href);
              }}>
              <Text style={styles.menuItemLabel}>{t('detail.menuEdit')}</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={openNotesEditor}>
              <Text style={styles.menuItemLabel}>{t('detail.menuAddNote')}</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={handleDuplicate}>
              <Text style={styles.menuItemLabel}>{t('detail.menuDuplicate')}</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={handleDelete}>
              <Text style={[styles.menuItemLabel, styles.menuItemDanger]}>
                {t('detail.menuDelete')}
              </Text>
            </Pressable>
            <Pressable style={styles.menuCancel} onPress={() => setMenuOpen(false)}>
              <Text style={styles.menuCancelLabel}>{t('common.cancel')}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <KomiConfirmSheet
        visible={shoppingFeedback != null}
        title={shoppingFeedback?.title ?? ''}
        message={shoppingFeedback?.message}
        confirmLabel={t('common.ok')}
        hideCancel
        onClose={() => setShoppingFeedback(null)}
        onConfirm={() => setShoppingFeedback(null)}
      />

      <KomiConfirmSheet
        visible={deleteConfirmOpen}
        title={t('detail.deleteTitle')}
        message={t('detail.deleteMessage', { title: currentRecipe.title })}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('common.delete')}
        destructive
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
      />
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
      <View style={styles.metaIcon}>{icon}</View>
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
  shoppingIngredientIds,
  onToggleChecked,
  missingShoppingCount,
  shoppingDisabled,
  onAddToShopping,
}: {
  recipe: Recipe;
  servings: number;
  setServings: (value: number) => void;
  groups: ReturnType<typeof groupIngredients>;
  checkedIds: Set<string>;
  shoppingIngredientIds: Set<string>;
  onToggleChecked: (id: string) => void;
  missingShoppingCount: number;
  shoppingDisabled: boolean;
  onAddToShopping: () => void;
}) {
  const { t } = useTranslation();

  return (
    <View style={styles.ingredientsPanel}>
      <View style={styles.ingredientsStack}>
        <View style={styles.portionsBar}>
          <Text style={styles.portionsLabel}>{t('detail.portions')}</Text>
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
                const onShoppingList = shoppingIngredientIds.has(ingredient.id);
                return (
                  <View key={ingredient.id}>
                    {index > 0 ? <View style={styles.ingredientDivider} /> : null}
                    <Pressable
                      style={styles.ingredientRow}
                      disabled={onShoppingList}
                      onPress={() => {
                        if (onShoppingList) return;
                        onToggleChecked(ingredient.id);
                      }}>
                      <View style={styles.ingredientLeft}>
                        {qtyLabel ? <Text style={styles.ingredientQty}>{qtyLabel}</Text> : null}
                        {ingredient.unit ? (
                          <View style={styles.unitPill}>
                            <Text style={styles.unitPillLabel}>{ingredient.unit}</Text>
                          </View>
                        ) : null}
                        <Text
                          style={[
                            styles.ingredientName,
                            !onShoppingList && checked && styles.ingredientChecked,
                          ]}>
                          {ingredient.name}
                        </Text>
                      </View>
                      {onShoppingList ? (
                        <CartGlyphIcon color={Colors.textMuted} size={16} />
                      ) : (
                        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                          {checked ? <Text style={styles.checkboxMark}>✓</Text> : null}
                        </View>
                      )}
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </View>

      <Pressable
        style={[
          styles.shoppingButton,
          styles.shoppingListCta,
          shoppingDisabled && styles.shoppingButtonDisabled,
        ]}
        disabled={shoppingDisabled}
        onPress={onAddToShopping}>
        <CartGlyphIcon />
        <Text style={[styles.shoppingLabel, shoppingDisabled && styles.shoppingLabelDisabled]}>
          {t(missingShoppingCount === 1 ? 'detail.addToShoppingOne' : 'detail.addToShopping', {
            count: missingShoppingCount,
          })}
        </Text>
      </Pressable>
    </View>
  );
}

function PreparationPanel({
  recipe,
  editingNotes,
  notesDraft,
  onChangeNotes,
  onSaveNotes,
  onCancelNotes,
}: {
  recipe: Recipe;
  editingNotes: boolean;
  notesDraft: string;
  onChangeNotes: (value: string) => void;
  onSaveNotes: () => void;
  onCancelNotes: () => void;
}) {
  const { t } = useTranslation();
  const notesInputRef = useRef<TextInputType>(null);
  const notes = recipe.notes?.trim();
  const noteLines = notes
    ? notes
        .split('\n')
        .map((line) => line.replace(/^•\s*/, '').trim())
        .filter(Boolean)
    : [];
  const showNotesCard = editingNotes || noteLines.length > 0;

  useEffect(() => {
    if (!editingNotes) return;
    const frame = requestAnimationFrame(() => {
      notesInputRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [editingNotes]);

  return (
    <View style={styles.panel}>
      {showNotesCard ? (
        <View style={styles.notesSection}>
          <View style={styles.notesHeader}>
            <LightbulbIcon size={20} />
            <Text style={styles.notesTitle}>{t('detail.notesTitle')}</Text>
          </View>
          <View style={styles.notesTrack}>
            {editingNotes ? (
              <>
                <TextInput
                  ref={notesInputRef}
                  value={notesDraft}
                  onChangeText={onChangeNotes}
                  placeholder={t('detail.notesPlaceholder')}
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  textAlignVertical="top"
                  style={styles.notesInput}
                  autoFocus
                />
                <View style={styles.notesActions}>
                  <Pressable onPress={onCancelNotes} hitSlop={8}>
                    <Text style={styles.notesCancel}>{t('detail.notesCancel')}</Text>
                  </Pressable>
                  <Pressable onPress={onSaveNotes} style={styles.notesSave}>
                    <Text style={styles.notesSaveLabel}>{t('detail.notesSave')}</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              noteLines.map((line) => (
                <Text key={line} style={styles.noteLine}>
                  • {line}
                </Text>
              ))
            )}
          </View>
        </View>
      ) : null}

      <Text style={styles.stepsHeading}>{t('detail.stepsHeading')}</Text>
      {[...recipe.steps]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((step, stepIndex) => (
          <View key={step.id} style={styles.stepBlock}>
            <Text style={styles.stepTitle}>
              {step.title || t('form.stepTitleDefault', { n: stepIndex + 1 })}
            </Text>
            <View style={styles.stepCard}>
              {[...step.subSteps]
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((sub, index) => (
                  <Text key={sub.id} style={styles.stepBody}>
                    {index + 1}. {sub.body}
                  </Text>
                ))}
              {step.subSteps.length === 0 ? (
                <Text style={styles.stepBody}>{t('detail.noSubSteps')}</Text>
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
  stickyActions: {
    position: 'absolute',
    left: Spacing.four,
    right: Spacing.four,
    zIndex: 20,
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(44, 39, 35, 0.14)',
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
  metaIcon: {
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: Colors.white,
    marginHorizontal: -Spacing.four,
    marginTop: Spacing.two,
    ...Shadows.card,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.three,
  },
  tab: {
    alignItems: 'center',
    minWidth: 120,
    // Reserve space under the label so the absolute indicator does not
    // shift selected vs unselected text baselines.
    paddingBottom: Spacing.two + 3,
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
    position: 'absolute',
    bottom: 0,
    height: 3,
    width: 42,
    borderRadius: 2,
    backgroundColor: Colors.text,
  },
  tabsBottomLine: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.line,
  },
  panel: {
    gap: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
  },
  ingredientsPanel: {
    paddingTop: Spacing.three,
  },
  ingredientsStack: {
    gap: Spacing.three,
  },
  shoppingListCta: {
    marginTop: Spacing.five,
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
    paddingHorizontal: Spacing.four,
    ...Shadows.card,
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
  notesSection: {
    gap: Spacing.three,
    marginHorizontal: -Spacing.four,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  notesTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 18,
    color: Colors.text,
  },
  notesTrack: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.two,
  },
  noteLine: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.accent,
  },
  notesInput: {
    minHeight: 96,
    borderRadius: Radii.md,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.line,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text,
  },
  notesActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  notesCancel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.textMuted,
  },
  notesSave: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
  notesSaveLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.white,
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
    padding: Spacing.four,
    gap: Spacing.two,
    ...Shadows.card,
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
  shoppingButtonDisabled: {
    backgroundColor: Colors.line,
  },
  shoppingLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 15,
    color: Colors.white,
  },
  shoppingLabelDisabled: {
    color: Colors.white,
    opacity: 0.85,
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
