import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Recipe, ShoppingListItem } from '@/types/recipe';
import { createId } from '@/utils/id';

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
    }),
    {
      name: 'komi-storage',
      storage: createJSONStorage(() => AsyncStorage),
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
