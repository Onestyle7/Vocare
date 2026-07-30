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
  początkujący: 'Beginner',
  poczatkujacy: 'Beginner',
  podstawowy: 'Beginner',
  intermediate: 'Conversational',
  b1: 'Conversational',
  'średnio zaawansowany': 'Conversational',
  'srednio zaawansowany': 'Conversational',
  komunikatywny: 'Conversational',
  b2: 'Advanced',
  'upper-intermediate': 'Advanced',
  zaawansowany: 'Advanced',
  fluent: 'Proficient',
  c1: 'Proficient',
  c2: 'Proficient',
  biegły: 'Proficient',
  biegly: 'Proficient',
  native: 'Native speaker',
  'native speaker': 'Native speaker',
  'mother tongue': 'Native speaker',
  ojczysty: 'Native speaker',
  'język ojczysty': 'Native speaker',
  'jezyk ojczysty': 'Native speaker',
};

export const normalizeFluency = (raw: string): FluencyLevel => {
  const lower = raw.trim().toLowerCase();

  // exact match (case-insensitive)
  const exact = FLUENCY_OPTIONS.find((o) => o.toLowerCase() === lower);
  if (exact) return exact;

  // alias lookup
  return FLUENCY_ALIASES[lower] ?? 'Beginner';
};

export const fluencyLevelLabels: Record<FluencyLevel, string> = {
  Beginner: 'Początkujący',
  Conversational: 'Średnio zaawansowany',
  Advanced: 'Zaawansowany',
  Proficient: 'Biegły',
  'Native speaker': 'Język ojczysty',
};

export const fluencyLevelLabelsEn: Record<FluencyLevel, string> = {
  Beginner: 'Beginner',
  Conversational: 'Conversational',
  Advanced: 'Advanced',
  Proficient: 'Proficient',
  'Native speaker': 'Native speaker',
};

export const getFluencyLabel = (
  level?: string,
  language: 'pl' | 'en' = 'pl'
): string => {
  if (!level) return '';
  const normalized = normalizeFluency(level);
  const labels = language === 'pl' ? fluencyLevelLabels : fluencyLevelLabelsEn;
  return labels[normalized] ?? level;
};
