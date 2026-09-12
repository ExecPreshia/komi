import type { Ingredient } from '@/types/recipe';

export function scaleQuantity(
  quantity: number | null,
  baseServings: number,
  currentServings: number,
): number | null {
  if (quantity == null) return null;
  if (!baseServings || baseServings <= 0) return quantity;
  return quantity * (currentServings / baseServings);
}

const KNOWN_FRACTIONS: Array<[number, string]> = [
  [0.25, '1/4'],
  [1 / 3, '1/3'],
  [0.5, '1/2'],
  [2 / 3, '2/3'],
  [0.75, '3/4'],
];

export function formatScaledQuantity(quantity: number | null): string {
  if (quantity == null) return '';
  const value = Math.round(quantity * 1000) / 1000;
  const whole = Math.floor(value);
  const fraction = value - whole;

  if (fraction < 0.01) return String(whole || 0);

  for (const [target, label] of KNOWN_FRACTIONS) {
    if (Math.abs(fraction - target) < 0.03) {
      return whole > 0 ? `${whole} ${label}` : label;
    }
  }

  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

/**
 * Decimal quantity label for Detail View (no fractions).
 * Uses `,` for French and `.` for English.
 */
export function formatQuantityDecimal(
  quantity: number | null,
  locale: 'fr' | 'en' = 'fr',
): string {
  if (quantity == null) return '';
  if (!Number.isFinite(quantity)) return '';

  const value = Math.round(quantity * 1000) / 1000;
  if (Number.isInteger(value)) return String(value);

  let text = value
    .toFixed(3)
    .replace(/(\.\d*?[1-9])0+$/, '$1')
    .replace(/\.0+$/, '');

  if (locale === 'fr') {
    text = text.replace('.', ',');
  }
  return text;
}

export type IngredientGroup = {
  category: string | null;
  items: Ingredient[];
};

export function groupIngredients(ingredients: Ingredient[]): IngredientGroup[] {
  const ordered = [...ingredients].sort((a, b) => a.sortOrder - b.sortOrder);
  const groups: IngredientGroup[] = [];
  const indexByCategory = new Map<string, number>();

  for (const item of ordered) {
    const key = item.category?.trim() || '';
    if (!key) {
      const uncategorized = groups.find((group) => group.category == null);
      if (uncategorized) {
        uncategorized.items.push(item);
      } else {
        groups.unshift({ category: null, items: [item] });
      }
      continue;
    }

    const existingIndex = indexByCategory.get(key);
    if (existingIndex != null) {
      groups[existingIndex].items.push(item);
    } else {
      indexByCategory.set(key, groups.length);
      groups.push({ category: key, items: [item] });
    }
  }

  return groups;
}

export function formatCookingTimeLong(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return '-';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) return hours === 1 ? '1 heure' : `${hours} heures`;
  return `${hours}h${rest}`;
}
