import { en } from '@/i18n/locales/en';
import { fr, type FrTranslations } from '@/i18n/locales/fr';
import type { AppLocale, TranslateParams } from '@/i18n/types';

export type { AppLocale, TranslateParams };
export type TranslationKey = keyof FrTranslations;

const dictionaries: Record<AppLocale, Record<TranslationKey, string>> = {
  fr,
  en,
};

export const LOCALE_LABEL_KEYS: Record<AppLocale, TranslationKey> = {
  fr: 'settings.languageFr',
  en: 'settings.languageEn',
};

export function translate(
  locale: AppLocale,
  key: TranslationKey,
  params?: TranslateParams,
): string {
  const table = dictionaries[locale] ?? dictionaries.fr;
  let value = table[key] ?? dictionaries.fr[key] ?? key;

  if (params) {
    for (const [name, raw] of Object.entries(params)) {
      value = value.replaceAll(`{{${name}}}`, String(raw));
    }
  }

  // Convenience for French/English plural suffixes used in a few messages.
  if (params && 'count' in params && value.includes('{{plural}}')) {
    const count = Number(params.count);
    const plural = count > 1 ? 's' : '';
    value = value.replaceAll('{{plural}}', plural);
  }

  return value;
}
