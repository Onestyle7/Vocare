export const ARTICLES_FOLDER = 'features/blog/articles/';

/**
 * Category hubs served at `/blog/<slug>`.
 *
 * Slugs are lowercase Polish and must match the `category` frontmatter value
 * exactly - URL paths are case-sensitive, and the slug is what the route,
 * the sitemap and every internal link use. The capitalised forms used before
 * 2026-09-22 (CV, Job, Kariera) are redirected (308) in `proxy.ts`.
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

/**
 * Product page each category hands the reader on to once the article ends.
 * Only public landing pages belong here, so the link is crawlable and works
 * for a logged-out reader.
 */
export const CATEGORY_TOOL_CTA: Record<
  BlogCategorySlug,
  { heading: string; description: string; label: string; href: string }
> = {
  cv: {
    heading: 'Zamień te wskazówki w gotowe CV',
    description:
      'Kreator CV Vocare prowadzi Cię sekcja po sekcji i sprawdza dokument pod kątem systemów ATS.',
    label: 'Otwórz kreator CV',
    href: '/resume-creator',
  },
  praca: {
    heading: 'Przygotuj CV pod konkretną ofertę',
    description:
      'Kreator CV Vocare pomaga dopasować dokument do ogłoszenia i sprawdza go pod kątem systemów ATS.',
    label: 'Otwórz kreator CV',
    href: '/resume-creator',
  },
  kariera: {
    heading: 'Zaplanuj kolejny krok w karierze',
    description:
      'Doradca kariery Vocare analizuje Twój profil i wskazuje ścieżki zawodowe dopasowane do Twoich umiejętności.',
    label: 'Poznaj doradcę kariery',
    href: '/assistant',
  },
  'rynek-pracy': {
    heading: 'Sprawdź, ile jest warta Twoja praca',
    description:
      'Analiza rynku Vocare pokazuje zarobki, popyt na specjalistów i brakujące umiejętności dla wybranej ścieżki.',
    label: 'Zobacz analizę rynku',
    href: '/market-analysis',
  },
};

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
