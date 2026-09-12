import { translate, type AppLocale, type TranslationKey } from '@/i18n';
import type { CostLevel, Difficulty, Ingredient, Recipe, Step, SubStep } from '@/types/recipe';
import { normalizeCostLevel } from '@/utils/format';
import { createId } from '@/utils/id';

export type RecipeFormValues = {
  title: string;
  photoUri: string | null;
  cookingTimeMinutes: number;
  difficulty: Difficulty;
  costLevel: CostLevel;
  baseServings: number;
  tags: string[];
  isPinned: boolean;
  ingredients: Ingredient[];
  steps: Step[];
};

export function createEmptyIngredient(sortOrder: number): Ingredient {
  return {
    id: createId('ing'),
    name: '',
    quantity: null,
    unit: null,
    category: null,
    sortOrder,
  };
}

export function createEmptySubStep(sortOrder: number): SubStep {
  return {
    id: createId('sub'),
    body: '',
    sortOrder,
  };
}

export function createEmptyStep(sortOrder: number): Step {
  return {
    id: createId('step'),
    title: '',
    sortOrder,
    timerSeconds: null,
    ingredientIds: [],
    subSteps: [createEmptySubStep(0)],
  };
}

export function createEmptyFormValues(locale: AppLocale): RecipeFormValues {
  return {
    title: '',
    photoUri: null,
    cookingTimeMinutes: 0,
    difficulty: 'facile',
    costLevel: 'abordable',
    baseServings: 0,
    tags: [],
    isPinned: false,
    ingredients: [createEmptyIngredient(0)],
    steps: [
      {
        ...createEmptyStep(0),
        title: translate(locale, 'form.stepTitleDefault', { n: 1 }),
      },
    ],
  };
}

export function recipeToFormValues(recipe: Recipe): RecipeFormValues {
  return {
    title: recipe.title,
    photoUri: recipe.photoUri,
    cookingTimeMinutes: recipe.cookingTimeMinutes,
    difficulty: recipe.difficulty,
    costLevel: normalizeCostLevel(recipe.costLevel),
    baseServings: recipe.baseServings,
    tags: [...recipe.tags],
    isPinned: recipe.isPinned,
    ingredients: recipe.ingredients.map((item) => ({ ...item })),
    steps: recipe.steps.map((step) => ({
      ...step,
      ingredientIds: [...step.ingredientIds],
      subSteps: step.subSteps.map((sub) => ({ ...sub })),
    })),
  };
}

function reindex<T extends { sortOrder: number }>(items: T[]): T[] {
  return items.map((item, index) => ({ ...item, sortOrder: index }));
}

export function reindexItems<T extends { sortOrder: number }>(items: T[]): T[] {
  return reindex(items);
}

export function moveItem<T extends { sortOrder: number }>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  const tmp = next[index];
  next[index] = next[target];
  next[target] = tmp;
  return reindex(next);
}

/** True when the title is an auto-generated "Étape N" / "Step N" label. */
export function isAutoStepTitle(title: string): boolean {
  return /^(étape|step)\s*\d+$/i.test(title.trim());
}

/** Updates auto step titles after drag reorder; keeps custom step names. */
export function renumberStepTitles(steps: Step[], locale: AppLocale): Step[] {
  return reindex(steps).map((step, index) => {
    const trimmed = step.title.trim();
    if (!trimmed || isAutoStepTitle(trimmed)) {
      return {
        ...step,
        title: translate(locale, 'form.stepTitleDefault', { n: index + 1 }),
      };
    }
    return step;
  });
}

export function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim().replace(/,/g, '.');
  if (!trimmed || trimmed === '.') return null;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : null;
}

/** Digits with at most one decimal separator (`,` or `.`). */
export function isQuantityInputText(value: string): boolean {
  return value === '' || /^\d*[.,]?\d*$/.test(value);
}

export function formatQuantityInputValue(quantity: number | null): string {
  if (quantity == null) return '';
  return String(quantity);
}

export function validateRecipeForm(values: RecipeFormValues): TranslationKey | null {
  if (!values.title.trim()) return 'form.errorTitleRequired';
  if (values.baseServings < 1) return 'form.errorServingsMin';
  const namedIngredients = values.ingredients.filter((item) => item.name.trim());
  if (namedIngredients.length === 0) return 'form.errorIngredientRequired';
  const titledSteps = values.steps.filter((step) => step.title.trim());
  if (titledSteps.length === 0) return 'form.errorStepRequired';
  for (const step of titledSteps) {
    const hasDescription = step.subSteps.some((sub) => sub.body.trim().length > 0);
    if (!hasDescription) {
      return 'form.errorStepDescription';
    }
  }
  return null;
}

export function sanitizeFormValues(values: RecipeFormValues): RecipeFormValues {
  const ingredients = reindex(
    values.ingredients
      .filter((item) => item.name.trim())
      .map((item) => ({
        ...item,
        name: item.name.trim(),
        unit: item.unit?.trim() || null,
        category: item.category?.trim() || null,
      })),
  );

  const ingredientIds = new Set(ingredients.map((item) => item.id));

  const steps = reindex(
    values.steps
      .filter((step) => step.title.trim())
      .map((step) => ({
        ...step,
        title: step.title.trim(),
        ingredientIds: step.ingredientIds.filter((id) => ingredientIds.has(id)),
        subSteps: reindex(
          step.subSteps
            .filter((sub) => sub.body.trim())
            .map((sub) => ({ ...sub, body: sub.body.trim() })),
        ),
      })),
  );

  return {
    ...values,
    title: values.title.trim(),
    tags: values.tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean),
    ingredients,
    steps,
  };
}
