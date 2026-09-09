/**
 * Komi design tokens from Figma Color system.
 * Primary = cream page background (not the CTA). Accent = coral CTAs / active states.
 */

export const Colors = {
  primary: '#F7F4F0',
  secondary: '#E8DDD6',
  text: '#2C2723',
  line: '#C9C2BA',
  tag: '#D5E0D3',
  accent: '#DA6664',
  white: '#FFFFFF',
  textMuted: '#6B6560',
} as const;

export type ThemeColor = keyof typeof Colors;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 24,
  six: 32,
  seven: 40,
} as const;

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
  fab: 30,
} as const;

export const Typography = {
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  section: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: Colors.text,
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: Colors.textMuted,
  },
  tab: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
} as const;

/** Approximate bottom tab bar height excluding safe-area inset. */
export const TabBarHeight = 70;
