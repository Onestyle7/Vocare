import { toAbsoluteUrl } from '@/features/blog/utils/blogUtils';

import { SERVICE_PROVIDER } from '../constants/legal';
import { SITE_LOGO, SITE_NAME, SOCIAL_PROFILE_URLS } from '../constants/seo';

/**
 * Stable identifiers of the site's entities. Every JSON-LD block points at them with `{ '@id' }`
 * instead of repeating the organisation inline, so Google reads one Vocare, not a new one per page.
 */
export const SCHEMA_IDS = {
  organization: () => toAbsoluteUrl('/#organization'),
  website: () => toAbsoluteUrl('/#website'),
  blog: () => toAbsoluteUrl('/blog#blog'),
} as const;

/** Same address as the canonical and og:url of the home page (no trailing slash). */
const homeUrl = () => toAbsoluteUrl('/').replace(/\/$/, '');

/**
 * The organisation as an author/publisher. Google resolves `@id` only within one page, so pages
 * that do not carry the full Organization block (posts, /blog) get name, url and logo inline,
 * under the same `@id`.
 */
export const organizationRef = () => ({
  '@type': 'Organization',
  '@id': SCHEMA_IDS.organization(),
  name: SITE_NAME,
  url: homeUrl(),
  logo: {
    '@type': 'ImageObject',
    url: toAbsoluteUrl(SITE_LOGO.path),
    width: SITE_LOGO.width,
    height: SITE_LOGO.height,
  },
});

/**
 * Organization: Google bierze z niej logo i powiązania z profilami (`sameAs`).
 * Bez `legalName` – Usługodawca prowadzi działalność nierejestrowaną jako osoba fizyczna.
 * `disambiguatingDescription` odróżnia Vocare od innych podmiotów o tej nazwie (m.in. brytyjskiej
 * firmy z sektora ochrony zdrowia), wskazując kraj, domenę i branżę – bez wymieniania ich z nazwy.
 * Pole nie jest wyświetlane w wynikach Google, służy do rozpoznania encji.
 */
export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': SCHEMA_IDS.organization(),
    name: SITE_NAME,
    alternateName: 'Vocare.pl',
    url: homeUrl(),
    description:
      'Vocare to polska platforma kariery z AI: dopasowana ścieżka zawodowa, analiza rynku pracy, plan rozwoju (roadmapa) i kreator CV gotowego pod ATS.',
    disambiguatingDescription:
      'Polska platforma kariery oparta na AI, działająca w serwisie vocare.pl, dla osób szukających pracy, zmieniających branżę i planujących rozwój zawodowy w Polsce.',
    logo: {
      '@type': 'ImageObject',
      url: toAbsoluteUrl(SITE_LOGO.path),
      width: SITE_LOGO.width,
      height: SITE_LOGO.height,
    },
    email: SERVICE_PROVIDER.email,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: SERVICE_PROVIDER.email,
      availableLanguage: ['pl'],
    },
    areaServed: { '@type': 'Country', name: 'Polska' },
    sameAs: [...SOCIAL_PROFILE_URLS],
  };
}

/** WebSite: Google bierze z niej nazwę serwisu wyświetlaną w wynikach wyszukiwania. */
export function buildWebSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': SCHEMA_IDS.website(),
    name: SITE_NAME,
    alternateName: 'vocare.pl',
    url: homeUrl(),
    inLanguage: 'pl-PL',
    publisher: { '@id': SCHEMA_IDS.organization() },
  };
}

/** Blog: defined once on /blog, category pages and posts refer to it by `@id`. */
export function buildBlogJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': SCHEMA_IDS.blog(),
    name: 'Blog Vocare',
    url: toAbsoluteUrl('/blog'),
    inLanguage: 'pl-PL',
    publisher: organizationRef(),
    isPartOf: { '@type': 'WebSite', '@id': SCHEMA_IDS.website(), name: SITE_NAME, url: homeUrl() },
  };
}

/** BreadcrumbList for the marketing pages: Vocare › page. */
export function buildPageBreadcrumbJsonLd(name: string, path: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: SITE_NAME, item: homeUrl() },
      { '@type': 'ListItem', position: 2, name, item: toAbsoluteUrl(path) },
    ],
  };
}
