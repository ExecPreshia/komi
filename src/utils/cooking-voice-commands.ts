import type { AppLocale } from '@/i18n/types';

export type CookingVoiceCommand = 'next' | 'prev' | 'instruction' | 'timer';

/** Strip accents and punctuation for reliable command matching. */
export function normalizeVoiceText(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const FR_PATTERNS: { command: CookingVoiceCommand; pattern: RegExp }[] = [
  {
    command: 'instruction',
    pattern:
      /\b(instruction|instructions)\b|\b(lis|lire)\b[\w\s]{0,24}\binstruction|\blis\s+a\s+voix\s+haute\b/,
  },
  {
    command: 'timer',
    pattern: /\b(minuteur|timer)\b|\b(demarre|demarrer|lance|lancer)\b[\w\s]{0,12}\bminuteur\b/,
  },
  {
    command: 'prev',
    pattern: /\b(precedent|precedente|revenir)\b|\betape\s+precedente\b/,
  },
  {
    command: 'next',
    pattern: /\b(suivant|suivante)\b|\betape\s+suivante\b/,
  },
];

const EN_PATTERNS: { command: CookingVoiceCommand; pattern: RegExp }[] = [
  {
    command: 'instruction',
    pattern:
      /\b(instruction|instructions)\b|\b(read)\b[\w\s]{0,24}\b(instruction|instructions|aloud|out\s+loud)\b|\bread\s+(it\s+)?(aloud|out\s+loud)\b/,
  },
  {
    command: 'timer',
    pattern: /\b(timer|timers)\b|\b(start|begin)\b[\w\s]{0,12}\btimer\b/,
  },
  {
    command: 'prev',
    pattern: /\b(previous|prev|back)\b|\b(previous|last)\s+step\b|\bgo\s+back\b/,
  },
  {
    command: 'next',
    pattern: /\b(next|continue)\b|\bnext\s+step\b/,
  },
];

const PATTERNS_BY_LOCALE: Record<AppLocale, { command: CookingVoiceCommand; pattern: RegExp }[]> = {
  fr: FR_PATTERNS,
  en: EN_PATTERNS,
};

export const VOICE_SPEECH_LANG: Record<AppLocale, string> = {
  fr: 'fr-FR',
  en: 'en-US',
};

export const VOICE_CONTEXTUAL_STRINGS: Record<AppLocale, string[]> = {
  fr: [
    'Suivant',
    'Précédent',
    'Instruction',
    'Minuteur',
    'étape suivante',
    'étape précédente',
  ],
  en: ['Next', 'Previous', 'Instruction', 'Timer', 'next step', 'previous step'],
};

/**
 * Match a short cooking-mode phrase to one of the four MVP commands for the active locale.
 */
export function matchCookingVoiceCommand(
  transcript: string,
  locale: AppLocale = 'fr',
): CookingVoiceCommand | null {
  const text = normalizeVoiceText(transcript);
  if (!text) return null;

  for (const entry of PATTERNS_BY_LOCALE[locale] ?? PATTERNS_BY_LOCALE.fr) {
    if (entry.pattern.test(text)) return entry.command;
  }
  return null;
}
