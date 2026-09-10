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
  duplicateRecipe: (id: string) => Recipe | null;
  setShoppingList: (items: ShoppingListItem[]) => void;
  addIngredientsToShoppingList: (
    recipe: Recipe,
    ingredients: Ingredient[],
    servings: number,
  ) => number;
  addManualShoppingItem: (name: string) => void;
  toggleShoppingItem: (id: string) => void;
  setShoppingItemsChecked: (ids: string[], isChecked: boolean) => void;
  removeShoppingItem: (id: string) => void;
  removeCheckedShoppingItems: () => void;
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
      duplicateRecipe: (id) => {
        const source = get().recipes.find((recipe) => recipe.id === id);
        if (!source) return null;

        const ingredientIdMap = new Map<string, string>();
        const ingredients = [...source.ingredients]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((ingredient, index) => {
            const nextId = createId('ing');
            ingredientIdMap.set(ingredient.id, nextId);
            return {
              ...ingredient,
              id: nextId,
              sortOrder: index,
            };
          });

        const steps = [...source.steps]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((step, index) => ({
            ...step,
            id: createId('step'),
            sortOrder: index,
            ingredientIds: step.ingredientIds
              .map((ingredientId) => ingredientIdMap.get(ingredientId))
              .filter((ingredientId): ingredientId is string => Boolean(ingredientId)),
            subSteps: [...step.subSteps]
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((subStep, subIndex) => ({
                ...subStep,
                id: createId('sub'),
                sortOrder: subIndex,
              })),
          }));

        const now = new Date().toISOString();
        const copy: Recipe = {
          ...source,
          id: createId('recipe'),
          isPinned: false,
          ingredients,
          steps,
          tags: [...source.tags],
          notes: source.notes,
          createdAt: now,
          updatedAt: now,
        };
        set({ recipes: [copy, ...get().recipes] });
        return copy;
      },
      setShoppingList: (shoppingList) => set({ shoppingList }),
      addIngredientsToShoppingList: (recipe, ingredients, servings) => {
        if (ingredients.length === 0) return 0;
        const list = get().shoppingList;
        const existingIngredientIds = new Set(
          list
            .filter((item) => item.recipeId === recipe.id && item.ingredientId)
            .map((item) => item.ingredientId as string),
        );
        const missing = ingredients.filter((ingredient) => !existingIngredientIds.has(ingredient.id));
        if (missing.length === 0) return 0;

        const startOrder = list.length;
        const additions: ShoppingListItem[] = missing.map((ingredient, index) => ({
          id: createId('shop'),
          name: ingredient.name,
          quantity: scaleQuantity(ingredient.quantity, recipe.baseServings, servings),
          unit: ingredient.unit,
          recipeId: recipe.id,
          recipeTitle: recipe.title,
          ingredientId: ingredient.id,
          isChecked: false,
          createdAt: new Date().toISOString(),
          sortOrder: startOrder + index,
        }));
        set({ shoppingList: [...list, ...additions] });
        return additions.length;
      },
      addManualShoppingItem: (name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        const list = get().shoppingList;
        const item: ShoppingListItem = {
          id: createId('shop'),
          name: trimmed,
          quantity: null,
          unit: null,
          recipeId: null,
          recipeTitle: null,
          ingredientId: null,
          isChecked: false,
          createdAt: new Date().toISOString(),
          sortOrder: list.length,
        };
        set({ shoppingList: [...list, item] });
      },
      toggleShoppingItem: (id) => {
        set({
          shoppingList: get().shoppingList.map((item) =>
            item.id === id ? { ...item, isChecked: !item.isChecked } : item,
          ),
        });
      },
      setShoppingItemsChecked: (ids, isChecked) => {
        if (ids.length === 0) return;
        const idSet = new Set(ids);
        set({
          shoppingList: get().shoppingList.map((item) =>
            idSet.has(item.id) ? { ...item, isChecked } : item,
          ),
        });
      },
      removeShoppingItem: (id) => {
        set({
          shoppingList: get().shoppingList.filter((item) => item.id !== id),
        });
      },
      removeCheckedShoppingItems: () => {
        set({
          shoppingList: get().shoppingList.filter((item) => !item.isChecked),
        });
      },
    }),
    {
      name: 'komi-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      migrate: (persisted) => {
        const state = persisted as { recipes?: Recipe[]; shoppingList?: ShoppingListItem[] };
        return {
          recipes: (state.recipes ?? []).map((recipe) => ({
            ...recipe,
            costLevel: normalizeCostLevel(String(recipe.costLevel)),
          })),
          shoppingList: (state.shoppingList ?? []).map((item) => ({
            ...item,
            ingredientId: item.ingredientId ?? null,
          })),
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
