import { translate, type AppLocale, type TranslationKey } from '@/i18n';
import type { CostLevel, Difficulty } from '@/types/recipe';

const DIFFICULTY_KEYS: Record<Difficulty, TranslationKey> = {
  facile: 'difficulty.facile',
  moyen: 'difficulty.moyen',
  difficile: 'difficulty.difficile',
};

const COST_KEYS: Record<CostLevel, TranslationKey> = {
  abordable: 'cost.abordable',
  modere: 'cost.modere',
  festif: 'cost.festif',
};

export function formatDifficulty(value: Difficulty, locale: AppLocale): string {
  return translate(locale, DIFFICULTY_KEYS[value]);
}

export function formatCost(value: CostLevel | string, locale: AppLocale): string {
  return translate(locale, COST_KEYS[normalizeCostLevel(value)]);
}

export function normalizeCostLevel(value: string): CostLevel {
  if (value === 'eleve') return 'festif';
  if (value === 'abordable' || value === 'modere' || value === 'festif') return value;
  return 'abordable';
}

export function formatCookingTime(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return '-';
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
