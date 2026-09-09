import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Ingredient, Recipe, ShoppingListItem } from '@/types/recipe';
import { normalizeCostLevel } from '@/utils/format';
import { createId } from '@/utils/id';
import { scaleQuantity } from '@/utils/quantity';

type KomiState = {
  recipes: Recipe[];
  shoppingList: ShoppingListItem[];
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'notes'> & { notes?: string | null }) => Recipe;
  updateRecipe: (id: string, patch: Partial<Recipe>) => void;
  togglePin: (id: string) => void;
  deleteRecipe: (id: string) => void;
  setShoppingList: (items: ShoppingListItem[]) => void;
  addIngredientsToShoppingList: (
    recipe: Recipe,
    ingredients: Ingredient[],
    servings: number,
  ) => number;
};

export const useKomiStore = create<KomiState>()(
  persist(
    (set, get) => ({
      recipes: [],
      shoppingList: [],
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      addRecipe: (input) => {
        const now = new Date().toISOString();
        const recipe: Recipe = {
          ...input,
          id: createId('recipe'),
          notes: input.notes ?? null,
          createdAt: now,
          updatedAt: now,
        };
        set({ recipes: [recipe, ...get().recipes] });
        return recipe;
      },
      updateRecipe: (id, patch) => {
        set({
          recipes: get().recipes.map((recipe) =>
            recipe.id === id
              ? { ...recipe, ...patch, id: recipe.id, updatedAt: new Date().toISOString() }
              : recipe,
          ),
        });
      },
      togglePin: (id) => {
        set({
          recipes: get().recipes.map((recipe) =>
            recipe.id === id
              ? { ...recipe, isPinned: !recipe.isPinned, updatedAt: new Date().toISOString() }
              : recipe,
          ),
        });
      },
      deleteRecipe: (id) => {
        set({
          recipes: get().recipes.filter((recipe) => recipe.id !== id),
          shoppingList: get().shoppingList.map((item) =>
            item.recipeId === id ? { ...item, recipeId: null } : item,
          ),
        });
      },
      setShoppingList: (shoppingList) => set({ shoppingList }),
      addIngredientsToShoppingList: (recipe, ingredients, servings) => {
        if (ingredients.length === 0) return 0;
        const startOrder = get().shoppingList.length;
        const additions: ShoppingListItem[] = ingredients.map((ingredient, index) => ({
          id: createId('shop'),
          name: ingredient.name,
          quantity: scaleQuantity(ingredient.quantity, recipe.baseServings, servings),
          unit: ingredient.unit,
          recipeId: recipe.id,
          recipeTitle: recipe.title,
          isChecked: false,
          createdAt: new Date().toISOString(),
          sortOrder: startOrder + index,
        }));
        set({ shoppingList: [...get().shoppingList, ...additions] });
        return additions.length;
      },
    }),
    {
      name: 'komi-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      migrate: (persisted) => {
        const state = persisted as { recipes?: Recipe[]; shoppingList?: ShoppingListItem[] };
        return {
          recipes: (state.recipes ?? []).map((recipe) => ({
            ...recipe,
            costLevel: normalizeCostLevel(String(recipe.costLevel)),
          })),
          shoppingList: state.shoppingList ?? [],
        };
      },
      partialize: (state) => ({
        recipes: state.recipes,
        shoppingList: state.shoppingList,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
