export const FLUENCY_OPTIONS = [
  'Beginner',
  'Conversational',
  'Advanced',
  'Proficient',
  'Native speaker',
] as const;

export type FluencyLevel = (typeof FLUENCY_OPTIONS)[number];

const FLUENCY_ALIASES: Record<string, FluencyLevel> = {
  basic: 'Beginner',
  elementary: 'Beginner',
  a1: 'Beginner',
  a2: 'Beginner',
  intermediate: 'Conversational',
  b1: 'Conversational',
  b2: 'Advanced',
  'upper-intermediate': 'Advanced',
  fluent: 'Proficient',
  c1: 'Proficient',
  c2: 'Proficient',
  native: 'Native speaker',
  'native speaker': 'Native speaker',
  'mother tongue': 'Native speaker',
};

export const normalizeFluency = (raw: string): FluencyLevel => {
  const lower = raw.trim().toLowerCase();

  // exact match (case-insensitive)
  const exact = FLUENCY_OPTIONS.find((o) => o.toLowerCase() === lower);
  if (exact) return exact;

  // alias lookup
  return FLUENCY_ALIASES[lower] ?? 'Beginner';
};
