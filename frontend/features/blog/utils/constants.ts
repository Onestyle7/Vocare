export const ARTICLES_FOLDER = 'features/blog/articles/';

/**
 * Category hubs served at `/blog/<slug>`.
 *
 * Slugs are lowercase Polish and must match the `category` frontmatter value
 * exactly - URL paths are case-sensitive, and the slug is what the route,
 * the sitemap and every internal link use. The capitalised forms used before
 * 2026-09-22 (CV, Job, Kariera) are 301'd in `next.config.ts`.
 */
export const BLOG_CATEGORIES = {
  cv: {
    label: 'CV',
    heading: 'CV i dokumenty aplikacyjne',
    description:
      'Jak napisać CV, które przejdzie przez ATS i trafi do rekrutera. Wzory, przykłady i poradniki dla różnych stanowisk i branż.',
  },
  praca: {
    label: 'Praca',
    heading: 'Szukanie pracy i rekrutacja',
    description:
      'Gdzie szukać pracy, jak przygotować się do rozmowy kwalifikacyjnej i co mówi prawo pracy. Praktyczne poradniki krok po kroku.',
  },
  kariera: {
    label: 'Kariera',
    heading: 'Rozwój kariery',
    description:
      'Zmiana branży, awans, wypalenie zawodowe i budowanie ścieżki kariery. Poradniki dla osób planujących kolejny krok zawodowy.',
  },
  'rynek-pracy': {
    label: 'Rynek pracy',
    heading: 'Rynek pracy w Polsce',
    description:
      'Trendy, zarobki i zapotrzebowanie na pracowników w poszczególnych branżach. Analizy polskiego rynku pracy.',
  },
} as const;

export type BlogCategorySlug = keyof typeof BLOG_CATEGORIES;

export const isBlogCategorySlug = (value: string): value is BlogCategorySlug =>
  Object.prototype.hasOwnProperty.call(BLOG_CATEGORIES, value);

export const FUSE_OPTIONS = {
  // isCaseSensitive: false,
  // includeScore: false,
  // ignoreDiacritics: false,
  // shouldSort: true,
  // includeMatches: false,
  // findAllMatches: false,
  minMatchCharLength: 2,
  // location: 0,
  threshold: 0.8,
  limit: 100,
  // distance: 100,
  // useExtendedSearch: false,
  // ignoreLocation: false,
  // ignoreFieldNorm: false,
  // fieldNormWeight: 1,
  keys: ['title', 'description', 'estimatedReadTime', 'date', 'category', 'tags'],
};
