export type Difficulty = 'facile' | 'moyen' | 'difficile';
export type CostLevel = 'abordable' | 'modere' | 'festif';

export type Ingredient = {
  id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  category: string | null;
  sortOrder: number;
};

export type SubStep = {
  id: string;
  body: string;
  sortOrder: number;
};

export type Step = {
  id: string;
  title: string;
  sortOrder: number;
  timerSeconds: number | null;
  /** Links to `Recipe.ingredients[].id` for Cooking Mode pills. */
  ingredientIds: string[];
  subSteps: SubStep[];
};

export type Recipe = {
  id: string;
  title: string;
  photoUri: string | null;
  cookingTimeMinutes: number;
  difficulty: Difficulty;
  costLevel: CostLevel;
  baseServings: number;
  tags: string[];
  isPinned: boolean;
  notes: string | null;
  ingredients: Ingredient[];
  steps: Step[];
  createdAt: string;
  updatedAt: string;
};

export type ShoppingListItem = {
  id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  recipeId: string | null;
  recipeTitle: string | null;
  isChecked: boolean;
  createdAt: string;
  sortOrder: number;
};

export type AppData = {
  recipes: Recipe[];
  shoppingList: ShoppingListItem[];
};
