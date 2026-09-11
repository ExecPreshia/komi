export type CookingVoiceCommand = 'next' | 'prev' | 'instruction' | 'timer';

/** Strip accents and punctuation for reliable French command matching. */
export function normalizeVoiceText(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const COMMAND_PATTERNS: { command: CookingVoiceCommand; pattern: RegExp }[] = [
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

/**
 * Match a short French cooking-mode phrase to one of the four MVP commands.
 * Accepts slightly longer natural variants when they clearly map to one command.
 */
export function matchCookingVoiceCommand(transcript: string): CookingVoiceCommand | null {
  const text = normalizeVoiceText(transcript);
  if (!text) return null;

  for (const entry of COMMAND_PATTERNS) {
    if (entry.pattern.test(text)) return entry.command;
  }
  return null;
}
