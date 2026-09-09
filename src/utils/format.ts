import type { CostLevel, Difficulty } from '@/types/recipe';

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  facile: 'Facile',
  moyen: 'Moyen',
  difficile: 'Difficile',
};

export const COST_LABELS: Record<CostLevel, string> = {
  abordable: 'Abordable',
  modere: 'Modéré',
  festif: 'Festif',
};

export function normalizeCostLevel(value: string): CostLevel {
  if (value === 'eleve') return 'festif';
  if (value === 'abordable' || value === 'modere' || value === 'festif') return value;
  return 'abordable';
}

export function formatCookingTime(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return '—';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) return `${hours}h`;
  return `${hours}h${rest}`;
}

export function formatIngredientLine(
  quantity: number | null,
  unit: string | null,
  name: string,
): string {
  const qty =
    quantity == null
      ? ''
      : Number.isInteger(quantity)
        ? String(quantity)
        : String(Math.round(quantity * 100) / 100);
  const unitPart = unit?.trim() ? ` ${unit.trim()}` : '';
  const prefix = qty ? `${qty}${unitPart} ` : '';
  return `${prefix}${name}`.trim();
}

export function normalizeTag(value: string): string {
  return value.trim().toLowerCase();
}
