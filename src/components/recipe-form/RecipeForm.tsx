import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  createEmptyIngredient,
  createEmptyStep,
  createEmptySubStep,
  moveItem,
  parseOptionalNumber,
  type RecipeFormValues,
  sanitizeFormValues,
  validateRecipeForm,
} from '@/components/recipe-form/form-model';
import { TagChip } from '@/components/ui/TagChip';
import {
  CameraIcon,
  DifficultyDots,
  DragHandleIcon,
  PlusIcon,
  TrashIcon,
} from '@/components/ui/form-icons';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import type { CostLevel, Difficulty, Ingredient, Step } from '@/types/recipe';
import { COST_LABELS, normalizeTag } from '@/utils/format';

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
  submitLabel = 'Enregistrer',
  onSubmit,
}: RecipeFormProps) {
  const insets = useSafeAreaInsets();
  const [values, setValues] = useState<RecipeFormValues>(initialValues);
  const [tagDraft, setTagDraft] = useState('');
  const [timeDraft, setTimeDraft] = useState(
    initialValues.cookingTimeMinutes > 0 ? String(initialValues.cookingTimeMinutes) : '',
  );
  const [servingsDraft, setServingsDraft] = useState(
    initialValues.baseServings > 0 ? String(initialValues.baseServings) : '',
  );

  const namedIngredients = useMemo(
    () => values.ingredients.filter((item) => item.name.trim()),
    [values.ingredients],
  );

  function update<K extends keyof RecipeFormValues>(key: K, value: RecipeFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission requise', "Autorisez l'accès à la photothèque pour ajouter une photo.");
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

  function addTag() {
    const tag = normalizeTag(tagDraft);
    if (!tag) return;
    if (!values.tags.includes(tag)) {
      update('tags', [...values.tags, tag]);
    }
    setTagDraft('');
  }

  function updateIngredient(id: string, patch: Partial<Ingredient>) {
    update(
      'ingredients',
      values.ingredients.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function updateStep(id: string, patch: Partial<Step>) {
    update(
      'steps',
      values.steps.map((step) => (step.id === id ? { ...step, ...patch } : step)),
    );
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
      cookingTimeMinutes: Math.max(1, Number(timeDraft.replace(/[^0-9]/g, '')) || 0),
      baseServings: Math.max(1, Number(servingsDraft.replace(/[^0-9]/g, '')) || 0),
    };
    const error = validateRecipeForm(nextValues);
    if (error) {
      Alert.alert('Recette incomplète', error);
      return;
    }
    onSubmit(sanitizeFormValues(nextValues));
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <FieldLabel text="Titre *" />
        <TextInput
          value={values.title}
          onChangeText={(title) => update('title', title)}
          placeholder="Ex : Spaghetti bolognaise"
          placeholderTextColor={Colors.textMuted}
          style={styles.input}
        />

        <FieldLabel text="Photo" />
        <Pressable style={styles.photoTap} onPress={pickPhoto}>
          {values.photoUri ? (
            <>
              <Image source={{ uri: values.photoUri }} style={styles.photoImage} contentFit="cover" />
              <Pressable
                style={styles.photoClear}
                onPress={() => update('photoUri', null)}
                hitSlop={8}>
                <Text style={styles.photoClearText}>Retirer</Text>
              </Pressable>
            </>
          ) : (
            <View style={styles.photoPlaceholder}>
              <CameraIcon />
              <Text style={styles.photoHint}>Appuyer pour ajouter une photo</Text>
            </View>
          )}
        </Pressable>

        <View style={styles.metaRow}>
          <View style={styles.metaField}>
            <FieldLabel text="Temps (min)" />
            <TextInput
              value={timeDraft}
              onChangeText={setTimeDraft}
              placeholder="Ex : 30"
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
              style={styles.input}
            />
          </View>
          <View style={styles.metaField}>
            <FieldLabel text="Portions" />
            <TextInput
              value={servingsDraft}
              onChangeText={setServingsDraft}
              placeholder="Ex : 2"
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
              style={styles.input}
            />
          </View>
        </View>

        <FieldLabel text="Difficulté" />
        <View style={styles.choiceRow}>
          {DIFFICULTIES.map((item) => {
            const selected = values.difficulty === item.value;
            return (
              <Pressable
                key={item.value}
                onPress={() => update('difficulty', item.value)}
                style={[styles.difficultyBox, selected && styles.difficultyBoxSelected]}>
                <DifficultyDots level={item.dots} />
              </Pressable>
            );
          })}
        </View>

        <FieldLabel text="Coût" />
        <View style={styles.choiceRow}>
          {COSTS.map((level) => {
            const selected = values.costLevel === level;
            return (
              <Pressable
                key={level}
                onPress={() => update('costLevel', level)}
                style={[styles.costChip, selected && styles.costChipSelected]}>
                <Text style={[styles.costLabel, selected && styles.costLabelSelected]}>
                  {COST_LABELS[level]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <FieldLabel text="Tags" />
        <View style={styles.tagRow}>
          <TextInput
            value={tagDraft}
            onChangeText={setTagDraft}
            placeholder="Ex : rapide, chaud, riz"
            placeholderTextColor={Colors.textMuted}
            style={[styles.input, styles.tagInput]}
            onSubmitEditing={addTag}
            returnKeyType="done"
          />
          <Pressable accessibilityLabel="Ajouter un tag" style={styles.tagAdd} onPress={addTag}>
            <PlusIcon color={Colors.white} size={18} />
          </Pressable>
        </View>
        {values.tags.length > 0 ? (
          <View style={styles.wrapChips}>
            {values.tags.map((tag) => (
              <TagChip
                key={tag}
                label={tag}
                onRemove={() => update('tags', values.tags.filter((item) => item !== tag))}
              />
            ))}
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Ingrédients</Text>
        {values.ingredients.map((ingredient, index) => (
          <View key={ingredient.id} style={styles.ingredientRow}>
            <View style={styles.reorderCol}>
              <Pressable
                disabled={index === 0}
                onPress={() => update('ingredients', moveItem(values.ingredients, index, -1))}
                hitSlop={6}>
                <DragHandleIcon color={index === 0 ? Colors.line : Colors.accent} />
              </Pressable>
              <Pressable
                disabled={index === values.ingredients.length - 1}
                onPress={() => update('ingredients', moveItem(values.ingredients, index, 1))}
                hitSlop={6}
                style={styles.reorderDown}>
                <Text
                  style={[
                    styles.reorderHint,
                    index === values.ingredients.length - 1 && styles.reorderHintDisabled,
                  ]}>
                  ↓
                </Text>
              </Pressable>
            </View>
            <View style={styles.ingredientFields}>
              <FieldLabel text="Ingrédient *" />
              <TextInput
                value={ingredient.name}
                onChangeText={(name) => updateIngredient(ingredient.id, { name })}
                placeholder="Ex : Carottes"
                placeholderTextColor={Colors.textMuted}
                style={styles.input}
              />
              <View style={styles.qtyRow}>
                <View style={styles.qtyField}>
                  <FieldLabel text="Qté" />
                  <TextInput
                    value={ingredient.quantity == null ? '' : String(ingredient.quantity)}
                    onChangeText={(text) =>
                      updateIngredient(ingredient.id, { quantity: parseOptionalNumber(text) })
                    }
                    keyboardType="decimal-pad"
                    placeholder="—"
                    placeholderTextColor={Colors.textMuted}
                    style={styles.input}
                  />
                </View>
                <View style={styles.qtyField}>
                  <FieldLabel text="Unité" />
                  <TextInput
                    value={ingredient.unit ?? ''}
                    onChangeText={(unit) => updateIngredient(ingredient.id, { unit })}
                    placeholder="g"
                    placeholderTextColor={Colors.textMuted}
                    style={styles.input}
                  />
                </View>
              </View>
            </View>
            <Pressable
              accessibilityLabel="Supprimer l'ingrédient"
              onPress={() =>
                update(
                  'ingredients',
                  values.ingredients.filter((item) => item.id !== ingredient.id),
                )
              }
              style={styles.trashBtn}>
              <TrashIcon />
            </Pressable>
          </View>
        ))}
        <Pressable
          style={styles.dashedAdd}
          onPress={() =>
            update('ingredients', [
              ...values.ingredients,
              createEmptyIngredient(values.ingredients.length),
            ])
          }>
          <Text style={styles.dashedAddLabel}>+ Ajouter un ingrédient</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Étapes</Text>
        {values.steps.map((step, index) => {
          const primaryBody = step.subSteps[0]?.body ?? '';
          const extraSubSteps = step.subSteps.slice(1);
          return (
            <View key={step.id} style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <View style={styles.reorderCol}>
                  <Pressable
                    disabled={index === 0}
                    onPress={() => update('steps', moveItem(values.steps, index, -1))}
                    hitSlop={6}>
                    <DragHandleIcon color={index === 0 ? Colors.line : Colors.accent} />
                  </Pressable>
                  <Pressable
                    disabled={index === values.steps.length - 1}
                    onPress={() => update('steps', moveItem(values.steps, index, 1))}
                    hitSlop={6}>
                    <Text
                      style={[
                        styles.reorderHint,
                        index === values.steps.length - 1 && styles.reorderHintDisabled,
                      ]}>
                      ↓
                    </Text>
                  </Pressable>
                </View>
                <TextInput
                  value={step.title}
                  onChangeText={(title) => updateStep(step.id, { title })}
                  placeholder={`Étape ${index + 1}`}
                  placeholderTextColor={Colors.textMuted}
                  style={[styles.input, styles.stepTitleInput]}
                />
                <Pressable
                  accessibilityLabel="Supprimer l'étape"
                  onPress={() =>
                    update(
                      'steps',
                      values.steps.filter((item) => item.id !== step.id),
                    )
                  }
                  style={styles.trashBtn}>
                  <TrashIcon />
                </Pressable>
              </View>

              <TextInput
                value={primaryBody}
                onChangeText={(body) => setStepPrimaryBody(step, body)}
                placeholder="Décrivez cette étape... *"
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
                      updateStep(step.id, {
                        subSteps: step.subSteps.map((item) =>
                          item.id === sub.id ? { ...item, body } : item,
                        ),
                      })
                    }
                    placeholder={`Sous-étape ${subIndex + 2}`}
                    placeholderTextColor={Colors.textMuted}
                    style={[styles.input, styles.flex]}
                  />
                  <Pressable
                    onPress={() =>
                      updateStep(step.id, {
                        subSteps: step.subSteps.filter((item) => item.id !== sub.id),
                      })
                    }>
                    <TrashIcon size={16} />
                  </Pressable>
                </View>
              ))}
              <Pressable
                onPress={() =>
                  updateStep(step.id, {
                    subSteps:
                      step.subSteps.length === 0
                        ? [createEmptySubStep(0), createEmptySubStep(1)]
                        : [...step.subSteps, createEmptySubStep(step.subSteps.length)],
                  })
                }>
                <Text style={styles.addSubStep}>+ Ajouter une sous-étape</Text>
              </Pressable>

              <FieldLabel text="Ingrédients de l'étape" />
              {namedIngredients.length === 0 ? (
                <Text style={styles.helper}>
                  Ajoutez d’abord des ingrédients pour les lier.
                </Text>
              ) : (
                <View style={styles.wrapChips}>
                  {namedIngredients.map((ingredient) => {
                    const selected = step.ingredientIds.includes(ingredient.id);
                    return (
                      <TagChip
                        key={ingredient.id}
                        label={ingredient.name}
                        selected={selected}
                        onPress={() =>
                          updateStep(step.id, {
                            ingredientIds: selected
                              ? step.ingredientIds.filter((id) => id !== ingredient.id)
                              : [...step.ingredientIds, ingredient.id],
                          })
                        }
                      />
                    );
                  })}
                </View>
              )}

              <FieldLabel text="Minuteur (optionnel)" />
              <TextInput
                value={formatTimerInput(step.timerSeconds)}
                onChangeText={(text) => updateStep(step.id, { timerSeconds: parseTimerInput(text) })}
                placeholder="0:00"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numbers-and-punctuation"
                style={[styles.input, styles.timerInput]}
              />
            </View>
          );
        })}
        <Pressable
          style={styles.dashedAdd}
          onPress={() =>
            update('steps', [
              ...values.steps,
              {
                ...createEmptyStep(values.steps.length),
                title: `Étape ${values.steps.length + 1}`,
              },
            ])
          }>
          <Text style={styles.dashedAddLabel}>+ Ajouter une étape</Text>
        </Pressable>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.three) }]}>
        <Pressable style={styles.saveButton} onPress={handleSubmit}>
          <Text style={styles.saveLabel}>{submitLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function FieldLabel({ text }: { text: string }) {
  return <Text style={styles.fieldLabel}>{text}</Text>;
}

function formatTimerInput(seconds: number | null): string {
  if (seconds == null || seconds <= 0) return '';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function parseTimerInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.includes(':')) {
    const [m, s] = trimmed.split(':');
    const minutes = Number(m.replace(/[^0-9]/g, '')) || 0;
    const seconds = Number((s ?? '').replace(/[^0-9]/g, '')) || 0;
    const total = minutes * 60 + seconds;
    return total > 0 ? total : null;
  }
  const minutes = Number(trimmed.replace(/[^0-9]/g, ''));
  return Number.isFinite(minutes) && minutes > 0 ? minutes * 60 : null;
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
    borderColor: Colors.accent,
    backgroundColor: '#FBF1F0',
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
    padding: Spacing.three,
    marginBottom: Spacing.two,
  },
  reorderCol: {
    alignItems: 'center',
    gap: 2,
    paddingTop: Spacing.five,
  },
  reorderDown: {
    marginTop: 2,
  },
  reorderHint: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.accent,
  },
  reorderHintDisabled: {
    color: Colors.line,
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
    padding: Spacing.three,
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
    alignItems: 'center',
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
  timerInput: {
    width: 96,
    textAlign: 'center',
    backgroundColor: Colors.inputFill,
    borderColor: Colors.inputFill,
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
