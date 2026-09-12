import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { KeyboardAwareScrollViewRef } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryField } from '@/components/recipe-form/CategoryField';
import { TimerDurationInput } from '@/components/recipe-form/TimerDurationInput';
import {
  createEmptyIngredient,
  createEmptyStep,
  createEmptySubStep,
  reindexItems,
  renumberStepTitles,
  parseOptionalNumber,
  isQuantityInputText,
  formatQuantityInputValue,
  type RecipeFormValues,
  sanitizeFormValues,
  validateRecipeForm,
} from '@/components/recipe-form/form-model';
import {
  ReorderDragHandle,
  ReorderableList,
  useDragScrollMetrics,
} from '@/components/recipe-form/ReorderableList';
import { AppKeyboardAwareScrollView } from '@/components/ui/AppKeyboardAwareScrollView';
import { KomiActionSheet, KomiConfirmSheet } from '@/components/ui/KomiActionSheet';
import { TagChip } from '@/components/ui/TagChip';
import {
  CameraIcon,
  DifficultyDots,
  DragHandleIcon,
  PlusIcon,
  TrashIcon,
} from '@/components/ui/form-icons';
import { Colors, Fonts, Radii, Shadows, Spacing } from '@/constants/theme';
import { useTranslation } from '@/i18n/useTranslation';
import { useKomiStore } from '@/store/komi-store';
import type { CostLevel, Difficulty, Ingredient, Step } from '@/types/recipe';
import { formatCost, normalizeTag } from '@/utils/format';

type RecipeFormProps = {
  initialValues: RecipeFormValues;
  submitLabel?: string;
  onSubmit: (values: RecipeFormValues) => void;
};

const DIFFICULTIES: { value: Difficulty; dots: 1 | 2 | 3 }[] = [
  { value: 'facile', dots: 1 },
  { value: 'moyen', dots: 2 },
  { value: 'difficile', dots: 3 },
];

const COSTS: CostLevel[] = ['abordable', 'modere', 'festif'];

export function RecipeForm({
  initialValues,
  submitLabel,
  onSubmit,
}: RecipeFormProps) {
  const { t, locale } = useTranslation();
  const resolvedSubmitLabel = submitLabel ?? t('form.submit');
  const insets = useSafeAreaInsets();
  const recipes = useKomiStore((state) => state.recipes);
  const [values, setValues] = useState<RecipeFormValues>(initialValues);
  const [tagDraft, setTagDraft] = useState('');
  const [timeDraft, setTimeDraft] = useState(
    initialValues.cookingTimeMinutes > 0 ? String(initialValues.cookingTimeMinutes) : '',
  );
  const [servingsDraft, setServingsDraft] = useState(
    initialValues.baseServings > 0 ? String(initialValues.baseServings) : '',
  );
  const [quantityDrafts, setQuantityDrafts] = useState<Record<string, string>>(() => {
    const drafts: Record<string, string> = {};
    for (const item of initialValues.ingredients) {
      drafts[item.id] = formatQuantityInputValue(item.quantity);
    }
    return drafts;
  });
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);
  const [incompleteOpen, setIncompleteOpen] = useState(false);
  const [incompleteMessage, setIncompleteMessage] = useState('');
  const scrollRef = useRef<KeyboardAwareScrollViewRef>(null);
  const { scrollController, onScroll, onLayout, onContentSizeChange } =
    useDragScrollMetrics(scrollRef);

  const namedIngredients = useMemo(
    () => values.ingredients.filter((item) => item.name.trim()),
    [values.ingredients],
  );

  const recipeCategories = useMemo(() => {
    const list: string[] = [];
    const seen = new Set<string>();
    for (const item of values.ingredients) {
      const category = item.category?.trim();
      if (!category) continue;
      const key = category.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      list.push(category);
    }
    return list;
  }, [values.ingredients]);

  const suggestedTags = useMemo(() => {
    const byKey = new Map<string, string>();
    for (const recipe of recipes) {
      for (const tag of recipe.tags) {
        const key = normalizeTag(tag);
        if (!key || byKey.has(key)) continue;
        byKey.set(key, tag.trim());
      }
    }
    const selected = new Set(values.tags.map((tag) => normalizeTag(tag)));
    return Array.from(byKey.entries())
      .filter(([key]) => !selected.has(key))
      .map(([, label]) => label)
      .sort((a, b) => a.localeCompare(b, 'fr'));
  }, [recipes, values.tags]);

  function update<K extends keyof RecipeFormValues>(key: K, value: RecipeFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function pickFromLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('form.permissionTitle'), t('form.permissionLibrary'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      update('photoUri', result.assets[0].uri);
    }
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('form.permissionTitle'), t('form.permissionCamera'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      update('photoUri', result.assets[0].uri);
    }
  }

  function pickPhoto() {
    setPhotoSheetOpen(true);
  }

  function addTag(raw?: string) {
    const tag = normalizeTag(raw ?? tagDraft);
    if (!tag) return;
    const existing = values.tags.find((item) => normalizeTag(item) === tag);
    if (!existing) {
      update('tags', [...values.tags, tag]);
    }
    setTagDraft('');
  }

  function updateIngredient(id: string, patch: Partial<Ingredient>) {
    setValues((current) => ({
      ...current,
      ingredients: current.ingredients.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    }));
  }

  function setIngredientQuantityText(id: string, text: string) {
    if (!isQuantityInputText(text)) return;
    setQuantityDrafts((current) => ({ ...current, [id]: text }));
    updateIngredient(id, { quantity: parseOptionalNumber(text) });
  }

  function updateStep(id: string, patch: Partial<Step>) {
    setValues((current) => ({
      ...current,
      steps: current.steps.map((step) => (step.id === id ? { ...step, ...patch } : step)),
    }));
  }

  function setStepPrimaryBody(step: Step, body: string) {
    const subSteps =
      step.subSteps.length === 0
        ? [createEmptySubStep(0)]
        : step.subSteps.map((sub, index) => (index === 0 ? { ...sub, body } : sub));
    updateStep(step.id, { subSteps });
  }

  function handleSubmit() {
    const nextValues: RecipeFormValues = {
      ...values,
      cookingTimeMinutes: Number(timeDraft.replace(/[^0-9]/g, '')) || 0,
      baseServings: Math.max(1, Number(servingsDraft.replace(/[^0-9]/g, '')) || 0),
    };
    const error = validateRecipeForm(nextValues);
    if (error) {
      setIncompleteMessage(t(error));
      setIncompleteOpen(true);
      return;
    }
    onSubmit(sanitizeFormValues(nextValues));
  }

  function renderIngredient({ item, isActive }: { item: Ingredient; index: number; isActive: boolean }) {
    return (
      <View style={[styles.ingredientRow, isActive && styles.draggingCard]}>
        <ReorderDragHandle>
          <View
            hitSlop={8}
            style={styles.dragHandle}
            accessibilityLabel={t('form.reorderIngredientA11y')}>
            <DragHandleIcon color={Colors.accent} />
          </View>
        </ReorderDragHandle>
        <View style={styles.ingredientFields}>
          <FieldLabel text={t('form.ingredientLabel')} />
          <TextInput
            value={item.name}
            onChangeText={(name) => updateIngredient(item.id, { name })}
            placeholder={t('form.ingredientPlaceholder')}
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="sentences"
            style={styles.input}
          />
          <View style={styles.qtyRow}>
            <View style={styles.qtyField}>
              <FieldLabel text={t('form.qtyLabel')} />
              <TextInput
                value={quantityDrafts[item.id] ?? formatQuantityInputValue(item.quantity)}
                onChangeText={(text) => setIngredientQuantityText(item.id, text)}
                keyboardType="decimal-pad"
                placeholder={t('form.qtyPlaceholder')}
                placeholderTextColor={Colors.textMuted}
                style={styles.input}
              />
            </View>
            <View style={styles.qtyField}>
              <FieldLabel text={t('form.unitLabel')} />
              <TextInput
                value={item.unit ?? ''}
                onChangeText={(unit) => updateIngredient(item.id, { unit })}
                placeholder={t('form.unitPlaceholder')}
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>
          </View>
          <FieldLabel text={t('form.categoryLabel')} />
          <CategoryField
            value={item.category ?? ''}
            recipeCategories={recipeCategories}
            onChange={(category) =>
              updateIngredient(item.id, { category: category.trim() ? category : null })
            }
          />
        </View>
        <Pressable
          accessibilityLabel={t('form.deleteIngredientA11y')}
          onPress={() => {
            setQuantityDrafts((current) => {
              const next = { ...current };
              delete next[item.id];
              return next;
            });
            setValues((current) => ({
              ...current,
              ingredients: reindexItems(
                current.ingredients.filter((entry) => entry.id !== item.id),
              ),
            }));
          }}
          style={styles.trashBtn}>
          <TrashIcon />
        </Pressable>
      </View>
    );
  }

  function renderStep({ item, index, isActive }: { item: Step; index: number; isActive: boolean }) {
    const primaryBody = item.subSteps[0]?.body ?? '';
    const extraSubSteps = item.subSteps.slice(1);

    return (
      <View style={[styles.stepCard, isActive && styles.draggingCard]}>
        <View style={styles.stepHeader}>
          <ReorderDragHandle>
            <View
              hitSlop={8}
              style={styles.dragHandle}
              accessibilityLabel={t('form.reorderStepA11y')}>
              <DragHandleIcon color={Colors.accent} />
            </View>
          </ReorderDragHandle>
          <TextInput
            value={item.title}
            onChangeText={(title) => updateStep(item.id, { title })}
            placeholder={t('form.stepTitleDefault', { n: index + 1 })}
            placeholderTextColor={Colors.textMuted}
            style={[styles.input, styles.stepTitleInput]}
          />
          <Pressable
            accessibilityLabel={t('form.deleteStepA11y')}
            onPress={() =>
              setValues((current) => ({
                ...current,
                steps: renumberStepTitles(
                  current.steps.filter((entry) => entry.id !== item.id),
                  locale,
                ),
              }))
            }
            style={styles.trashBtn}>
            <TrashIcon />
          </Pressable>
        </View>

        <TextInput
          value={primaryBody}
          onChangeText={(body) => setStepPrimaryBody(item, body)}
          placeholder={t('form.stepBodyPlaceholder')}
          placeholderTextColor={Colors.textMuted}
          multiline
          textAlignVertical="top"
          style={[styles.input, styles.stepBody]}
        />

        {extraSubSteps.map((sub, subIndex) => (
          <View key={sub.id} style={styles.extraSubStep}>
            <TextInput
              value={sub.body}
              onChangeText={(body) =>
                updateStep(item.id, {
                  subSteps: item.subSteps.map((entry) =>
                    entry.id === sub.id ? { ...entry, body } : entry,
                  ),
                })
              }
              placeholder={t('form.subStepPlaceholder', { n: subIndex + 2 })}
              placeholderTextColor={Colors.textMuted}
              multiline
              textAlignVertical="top"
              style={[styles.input, styles.stepBody, styles.flex]}
            />
            <Pressable
              onPress={() =>
                updateStep(item.id, {
                  subSteps: item.subSteps.filter((entry) => entry.id !== sub.id),
                })
              }
              style={styles.trashBtn}>
              <TrashIcon />
            </Pressable>
          </View>
        ))}
        <Pressable
          onPress={() =>
            updateStep(item.id, {
              subSteps:
                item.subSteps.length === 0
                  ? [createEmptySubStep(0), createEmptySubStep(1)]
                  : [...item.subSteps, createEmptySubStep(item.subSteps.length)],
            })
          }>
          <Text style={styles.addSubStep}>{t('form.addSubStep')}</Text>
        </Pressable>

        <FieldLabel text={t('form.stepIngredientsLabel')} />
        {namedIngredients.length === 0 ? (
          <Text style={styles.helper}>{t('form.stepIngredientsHelper')}</Text>
        ) : (
          <View style={styles.wrapChips}>
            {namedIngredients.map((ingredient) => {
              const selected = item.ingredientIds.includes(ingredient.id);
              return (
                <TagChip
                  key={ingredient.id}
                  label={ingredient.name}
                  selected={selected}
                  onPress={() =>
                    updateStep(item.id, {
                      ingredientIds: selected
                        ? item.ingredientIds.filter((id) => id !== ingredient.id)
                        : [...item.ingredientIds, ingredient.id],
                    })
                  }
                />
              );
            })}
          </View>
        )}

        <FieldLabel text={t('form.timerLabel')} />
        <TimerDurationInput
          key={item.id}
          timerSeconds={item.timerSeconds}
          onChange={(timerSeconds) => updateStep(item.id, { timerSeconds })}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <AppKeyboardAwareScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        scrollEnabled={scrollEnabled}
        scrollEventThrottle={16}
        onScroll={(event) => onScroll(event.nativeEvent.contentOffset.y)}
        onLayout={(event) => onLayout(event.nativeEvent.layout.height)}
        onContentSizeChange={onContentSizeChange}
        showsVerticalScrollIndicator={false}>
        <FieldLabel text={t('form.titleLabel')} />
        <TextInput
          value={values.title}
          onChangeText={(title) => update('title', title)}
          placeholder={t('form.titlePlaceholder')}
          placeholderTextColor={Colors.textMuted}
          style={styles.input}
        />

        <FieldLabel text={t('form.photoLabel')} />
        <Pressable style={styles.photoTap} onPress={pickPhoto}>
          {values.photoUri ? (
            <>
              <Image source={{ uri: values.photoUri }} style={styles.photoImage} contentFit="cover" />
              <Pressable
                style={styles.photoClear}
                onPress={() => update('photoUri', null)}
                hitSlop={8}>
                <Text style={styles.photoClearText}>{t('form.photoRemove')}</Text>
              </Pressable>
            </>
          ) : (
            <View style={styles.photoPlaceholder}>
              <CameraIcon />
              <Text style={styles.photoHint}>{t('form.photoHint')}</Text>
            </View>
          )}
        </Pressable>

        <View style={styles.metaRow}>
          <View style={styles.metaField}>
            <FieldLabel text={t('form.timeLabel')} />
            <TextInput
              value={timeDraft}
              onChangeText={setTimeDraft}
              placeholder={t('form.timePlaceholder')}
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
              style={styles.input}
            />
          </View>
          <View style={styles.metaField}>
            <FieldLabel text={t('form.servingsLabel')} />
            <TextInput
              value={servingsDraft}
              onChangeText={setServingsDraft}
              placeholder={t('form.servingsPlaceholder')}
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
              style={styles.input}
            />
          </View>
        </View>

        <FieldLabel text={t('form.difficultyLabel')} />
        <View style={styles.choiceRow}>
          {DIFFICULTIES.map((item) => {
            const selected = values.difficulty === item.value;
            return (
              <Pressable
                key={item.value}
                onPress={() => update('difficulty', item.value)}
                style={[styles.difficultyBox, selected && styles.difficultyBoxSelected]}>
                <DifficultyDots level={item.dots} selected={selected} />
              </Pressable>
            );
          })}
        </View>

        <FieldLabel text={t('form.costLabel')} />
        <View style={styles.choiceRow}>
          {COSTS.map((level) => {
            const selected = values.costLevel === level;
            return (
              <Pressable
                key={level}
                onPress={() => update('costLevel', level)}
                style={[styles.costChip, selected && styles.costChipSelected]}>
                <Text style={[styles.costLabel, selected && styles.costLabelSelected]}>
                  {formatCost(level, locale)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <FieldLabel text={t('form.tagsLabel')} />
        <View style={styles.tagRow}>
          <TextInput
            value={tagDraft}
            onChangeText={setTagDraft}
            placeholder={t('form.tagsPlaceholder')}
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.input, styles.tagInput]}
            onSubmitEditing={() => addTag()}
            returnKeyType="done"
          />
          <Pressable
            accessibilityLabel={t('form.addTagA11y')}
            style={styles.tagAdd}
            onPress={() => addTag()}>
            <PlusIcon color={Colors.white} size={18} />
          </Pressable>
        </View>
        {values.tags.length > 0 ? (
          <View style={styles.wrapChips}>
            {values.tags.map((tag) => (
              <TagChip
                key={tag}
                label={tag}
                selected
                onPress={() => update('tags', values.tags.filter((item) => item !== tag))}
              />
            ))}
          </View>
        ) : null}
        {suggestedTags.length > 0 ? (
          <View style={styles.wrapChips}>
            {suggestedTags.map((tag) => (
              <TagChip key={tag} label={tag} onPress={() => addTag(tag)} />
            ))}
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>{t('form.ingredientsSection')}</Text>
        <ReorderableList
          data={values.ingredients}
          onReorder={(data) => update('ingredients', reindexItems(data))}
          onDragStateChange={(dragging) => setScrollEnabled(!dragging)}
          scrollController={scrollController}
          renderItem={renderIngredient}
        />
        <Pressable
          style={styles.dashedAdd}
          onPress={() => {
            const ingredient = createEmptyIngredient(values.ingredients.length);
            setQuantityDrafts((current) => ({ ...current, [ingredient.id]: '' }));
            update('ingredients', [...values.ingredients, ingredient]);
          }}>
          <Text style={styles.dashedAddLabel}>{t('form.addIngredient')}</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>{t('form.stepsSection')}</Text>
        <ReorderableList
          data={values.steps}
          onReorder={(data) => update('steps', renumberStepTitles(data, locale))}
          onDragStateChange={(dragging) => setScrollEnabled(!dragging)}
          scrollController={scrollController}
          renderItem={renderStep}
        />
        <Pressable
          style={styles.dashedAdd}
          onPress={() =>
            update('steps', [
              ...values.steps,
              {
                ...createEmptyStep(values.steps.length),
                title: t('form.stepTitleDefault', { n: values.steps.length + 1 }),
              },
            ])
          }>
          <Text style={styles.dashedAddLabel}>{t('form.addStep')}</Text>
        </Pressable>
      </AppKeyboardAwareScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.three) }]}>
        <Pressable style={styles.saveButton} onPress={handleSubmit}>
          <Text style={styles.saveLabel}>{resolvedSubmitLabel}</Text>
        </Pressable>
      </View>

      <KomiActionSheet
        visible={photoSheetOpen}
        title={t('form.photoSheetTitle')}
        items={[
          { label: t('form.photoGallery'), onPress: () => void pickFromLibrary() },
          { label: t('form.photoCamera'), onPress: () => void takePhoto() },
        ]}
        cancelLabel={t('common.cancel')}
        onClose={() => setPhotoSheetOpen(false)}
      />

      <KomiConfirmSheet
        visible={incompleteOpen}
        title={t('form.incompleteTitle')}
        message={incompleteMessage}
        confirmLabel={t('common.ok')}
        hideCancel
        onClose={() => setIncompleteOpen(false)}
        onConfirm={() => setIncompleteOpen(false)}
      />
    </View>
  );
}

function FieldLabel({ text }: { text: string }) {
  return <Text style={styles.fieldLabel}>{text}</Text>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
    gap: Spacing.two,
  },
  fieldLabel: {
    marginTop: Spacing.two,
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  input: {
    minHeight: 48,
    borderRadius: Radii.md,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.line,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.text,
  },
  photoTap: {
    minHeight: 160,
    borderRadius: Radii.lg,
    overflow: 'hidden',
    backgroundColor: Colors.inputFill,
  },
  photoImage: {
    width: '100%',
    height: 180,
  },
  photoPlaceholder: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  photoHint: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textMuted,
  },
  photoClear: {
    position: 'absolute',
    right: Spacing.three,
    bottom: Spacing.three,
    backgroundColor: Colors.white,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  photoClearText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  metaField: {
    flex: 1,
    gap: Spacing.two,
  },
  choiceRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  difficultyBox: {
    flex: 1,
    minHeight: 52,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  difficultyBoxSelected: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  costChip: {
    flex: 1,
    minHeight: 44,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.one,
  },
  costChipSelected: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  costLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.text,
  },
  costLabelSelected: {
    color: Colors.white,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  tagInput: {
    flex: 1,
  },
  tagAdd: {
    width: 44,
    height: 44,
    borderRadius: Radii.pill,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  sectionTitle: {
    marginTop: Spacing.five,
    marginBottom: Spacing.two,
    fontFamily: Fonts.sansBold,
    fontSize: 22,
    color: Colors.text,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: Spacing.four,
    marginBottom: Spacing.two,
  },
  draggingCard: {
    ...Shadows.card,
  },
  dragHandle: {
    paddingTop: Spacing.five,
    paddingHorizontal: Spacing.one,
  },
  ingredientFields: {
    flex: 1,
    gap: Spacing.one,
  },
  qtyRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  qtyField: {
    flex: 1,
    gap: Spacing.one,
  },
  trashBtn: {
    paddingTop: Spacing.five,
    paddingHorizontal: Spacing.one,
  },
  dashedAdd: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.line,
    borderRadius: Radii.lg,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
    marginBottom: Spacing.two,
    backgroundColor: Colors.white,
  },
  dashedAddLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 15,
    color: Colors.text,
  },
  stepCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.line,
    padding: Spacing.four,
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  stepTitleInput: {
    flex: 1,
  },
  stepBody: {
    minHeight: 96,
    backgroundColor: Colors.inputFill,
    borderColor: Colors.inputFill,
  },
  extraSubStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
  addSubStep: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.accent,
    marginBottom: Spacing.one,
  },
  helper: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textMuted,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.line,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
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
