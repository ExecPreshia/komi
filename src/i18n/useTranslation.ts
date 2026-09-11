import { useCallback } from 'react';

import { LOCALE_LABEL_KEYS, translate, type AppLocale, type TranslationKey } from '@/i18n';
import type { TranslateParams } from '@/i18n/types';
import { useKomiStore } from '@/store/komi-store';

export function useTranslation() {
  const locale = useKomiStore((state) => state.locale);
  const setLocale = useKomiStore((state) => state.setLocale);

  const t = useCallback(
    (key: TranslationKey, params?: TranslateParams) => translate(locale, key, params),
    [locale],
  );

  const localeLabel = translate(locale, LOCALE_LABEL_KEYS[locale]);

  return { t, locale, setLocale, localeLabel };
}

export type { AppLocale, TranslationKey };
