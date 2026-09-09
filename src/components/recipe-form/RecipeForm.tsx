import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useMemo, useState, type ReactNode } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

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
import { Button } from '@/components/ui/Button';
import { TagChip } from '@/components/ui/TagChip';
import { TextField } from '@/components/ui/TextField';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import type { CostLevel, Difficulty, Ingredient, Step } from '@/types/recipe';
import { COST_LABELS, DIFFICULTY_LABELS, normalizeTag } from '@/utils/format';

type RecipeFormProps = {
  initialValues: RecipeFormValues;
  submitLabel: string;
  onSubmit: (values: RecipeFormValues) => void;
};

const DIFFICULTIES: Difficulty[] = ['facile', 'moyen', 'difficile'];
const COSTS: CostLevel[] = ['abordable', 'modere', 'eleve'];

export function RecipeForm({ initialValues, submitLabel, onSubmit }: RecipeFormProps) {
  const [values, setValues] = useState<RecipeFormValues>(initialValues);
  const [tagDraft, setTagDraft] = useState('');

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
    if (values.tags.includes(tag)) {
      setTagDraft('');
      return;
    }
    update('tags', [...values.tags, tag]);
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

  function handleSubmit() {
    const error = validateRecipeForm(values);
    if (error) {
      Alert.alert('Recette incomplète', error);
      return;
    }
    onSubmit(sanitizeFormValues(values));
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <Section title="Informations">
        <TextField
          label="Titre"
          value={values.title}
          onChangeText={(title) => update('title', title)}
          placeholder="Ex : Japchae"
        />

        <View style={styles.photoBlock}>
          <Text style={styles.label}>Photo</Text>
          {values.photoUri ? (
            <Image source={{ uri: values.photoUri }} style={styles.photo} contentFit="cover" />
          ) : (
            <View style={[styles.photo, styles.photoPlaceholder]}>
              <Text style={styles.muted}>Aucune photo</Text>
            </View>
          )}
          <View style={styles.row}>
            <Button label="Choisir une photo" variant="ghost" onPress={pickPhoto} style={styles.flex} />
            {values.photoUri ? (
              <Button
                label="Retirer"
                variant="ghost"
                onPress={() => update('photoUri', null)}
                style={styles.flex}
              />
            ) : null}
          </View>
        </View>

        <TextField
          label="Temps (minutes)"
          value={String(values.cookingTimeMinutes)}
          onChangeText={(text) => update('cookingTimeMinutes', Math.max(1, Number(text.replace(/[^0-9]/g, '')) || 1))}
          keyboardType="number-pad"
        />

        <Text style={styles.label}>Difficulté</Text>
        <View style={styles.choiceRow}>
          {DIFFICULTIES.map((level) => (
            <ChoiceChip
              key={level}
              label={DIFFICULTY_LABELS[level]}
              selected={values.difficulty === level}
              onPress={() => update('difficulty', level)}
            />
          ))}
        </View>

        <Text style={styles.label}>Coût</Text>
        <View style={styles.choiceRow}>
          {COSTS.map((level) => (
            <ChoiceChip
              key={level}
              label={COST_LABELS[level]}
              selected={values.costLevel === level}
              onPress={() => update('costLevel', level)}
            />
          ))}
        </View>

        <TextField
          label="Portions"
          value={String(values.baseServings)}
          onChangeText={(text) => update('baseServings', Math.max(1, Number(text.replace(/[^0-9]/g, '')) || 1))}
          keyboardType="number-pad"
        />

        <View style={styles.switchRow}>
          <Text style={styles.label}>Ajouter à « Au menu »</Text>
          <Switch
            value={values.isPinned}
            onValueChange={(isPinned) => update('isPinned', isPinned)}
            trackColor={{ false: Colors.line, true: Colors.accent }}
            thumbColor={Colors.white}
          />
        </View>
      </Section>

      <Section title="Tags">
        <View style={styles.row}>
          <TextField
            value={tagDraft}
            onChangeText={setTagDraft}
            placeholder="chaud, dessert…"
            containerStyle={styles.flex}
            onSubmitEditing={addTag}
            returnKeyType="done"
          />
          <Button label="Ajouter" variant="ghost" onPress={addTag} />
        </View>
        <View style={styles.wrapChips}>
          {values.tags.map((tag) => (
            <TagChip
              key={tag}
              label={tag}
              onRemove={() => update('tags', values.tags.filter((item) => item !== tag))}
            />
          ))}
        </View>
      </Section>

      <Section title="Ingrédients">
        {values.ingredients.map((ingredient, index) => (
          <View key={ingredient.id} style={styles.editorCard}>
            <TextField
              label="Nom"
              value={ingredient.name}
              onChangeText={(name) => updateIngredient(ingredient.id, { name })}
              placeholder="Carottes"
            />
            <View style={styles.row}>
              <TextField
                label="Quantité"
                value={ingredient.quantity == null ? '' : String(ingredient.quantity)}
                onChangeText={(text) =>
                  updateIngredient(ingredient.id, { quantity: parseOptionalNumber(text) })
                }
                keyboardType="decimal-pad"
                containerStyle={styles.flex}
              />
              <TextField
                label="Unité"
                value={ingredient.unit ?? ''}
                onChangeText={(unit) => updateIngredient(ingredient.id, { unit })}
                placeholder="g, càs…"
                containerStyle={styles.flex}
              />
            </View>
            <TextField
              label="Catégorie (optionnel)"
              value={ingredient.category ?? ''}
              onChangeText={(category) => updateIngredient(ingredient.id, { category })}
              placeholder="Sauce"
            />
            <View style={styles.row}>
              <Button
                label="↑"
                variant="ghost"
                disabled={index === 0}
                onPress={() => update('ingredients', moveItem(values.ingredients, index, -1))}
              />
              <Button
                label="↓"
                variant="ghost"
                disabled={index === values.ingredients.length - 1}
                onPress={() => update('ingredients', moveItem(values.ingredients, index, 1))}
              />
              <Button
                label="Supprimer"
                variant="ghost"
                onPress={() =>
                  update(
                    'ingredients',
                    values.ingredients.filter((item) => item.id !== ingredient.id),
                  )
                }
              />
            </View>
          </View>
        ))}
        <Button
          label="Ajouter un ingrédient"
          variant="ghost"
          onPress={() =>
            update('ingredients', [
              ...values.ingredients,
              createEmptyIngredient(values.ingredients.length),
            ])
          }
        />
      </Section>

      <Section title="Préparation">
        {values.steps.map((step, index) => (
          <View key={step.id} style={styles.editorCard}>
            <TextField
              label="Titre de l'étape"
              value={step.title}
              onChangeText={(title) => updateStep(step.id, { title })}
              placeholder="CUISSON PÂTES"
            />
            <TextField
              label="Minuteur (minutes, optionnel)"
              value={step.timerSeconds == null ? '' : String(Math.round(step.timerSeconds / 60))}
              onChangeText={(text) => {
                const minutes = parseOptionalNumber(text);
                updateStep(step.id, {
                  timerSeconds: minutes == null ? null : Math.max(1, Math.round(minutes)) * 60,
                });
              }}
              keyboardType="number-pad"
            />

            <Text style={styles.label}>Sous-étapes</Text>
            {step.subSteps.map((sub, subIndex) => (
              <View key={sub.id} style={styles.subStepRow}>
                <TextField
                  value={sub.body}
                  onChangeText={(body) =>
                    updateStep(step.id, {
                      subSteps: step.subSteps.map((item) =>
                        item.id === sub.id ? { ...item, body } : item,
                      ),
                    })
                  }
                  placeholder={`Sous-étape ${subIndex + 1}`}
                  containerStyle={styles.flex}
                />
                <Button
                  label="×"
                  variant="ghost"
                  onPress={() =>
                    updateStep(step.id, {
                      subSteps: step.subSteps.filter((item) => item.id !== sub.id),
                    })
                  }
                />
              </View>
            ))}
            <Button
              label="Ajouter une sous-étape"
              variant="ghost"
              onPress={() =>
                updateStep(step.id, {
                  subSteps: [...step.subSteps, createEmptySubStep(step.subSteps.length)],
                })
              }
            />

            <Text style={styles.label}>Ingrédients liés (Cooking Mode)</Text>
            {namedIngredients.length === 0 ? (
              <Text style={styles.muted}>Ajoutez d’abord des ingrédients nommés.</Text>
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

            <View style={styles.row}>
              <Button
                label="↑"
                variant="ghost"
                disabled={index === 0}
                onPress={() => update('steps', moveItem(values.steps, index, -1))}
              />
              <Button
                label="↓"
                variant="ghost"
                disabled={index === values.steps.length - 1}
                onPress={() => update('steps', moveItem(values.steps, index, 1))}
              />
              <Button
                label="Supprimer"
                variant="ghost"
                onPress={() =>
                  update(
                    'steps',
                    values.steps.filter((item) => item.id !== step.id),
                  )
                }
              />
            </View>
          </View>
        ))}
        <Button
          label="Ajouter une étape"
          variant="ghost"
          onPress={() => update('steps', [...values.steps, createEmptyStep(values.steps.length)])}
        />
      </Section>

      <Button label={submitLabel} onPress={handleSubmit} />
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function ChoiceChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.choiceChip, selected && styles.choiceChipSelected]}>
      <Text style={[styles.choiceLabel, selected && styles.choiceLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.five,
    paddingBottom: Spacing.seven,
  },
  section: {
    gap: Spacing.three,
  },
  sectionTitle: {
    ...Typography.section,
  },
  label: {
    ...Typography.label,
  },
  muted: {
    ...Typography.caption,
  },
  photoBlock: {
    gap: Spacing.two,
  },
  photo: {
    width: '100%',
    height: 180,
    borderRadius: Radii.lg,
  },
  photoPlaceholder: {
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
  choiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  choiceChip: {
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.line,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: Colors.white,
  },
  choiceChipSelected: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  choiceLabel: {
    ...Typography.caption,
    color: Colors.text,
  },
  choiceLabelSelected: {
    color: Colors.white,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  wrapChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  editorCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: Spacing.three,
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  subStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
});
