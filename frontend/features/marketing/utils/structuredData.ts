import { toAbsoluteUrl } from '@/features/blog/utils/blogUtils';

import { SERVICE_PROVIDER } from '../constants/legal';
import { SITE_LOGO, SITE_NAME, SOCIAL_PROFILE_URLS } from '../constants/seo';

/**
 * Organization: Google bierze z niej logo i powiązania z profilami (`sameAs`).
 * Bez `legalName` – Usługodawca prowadzi działalność nierejestrowaną jako osoba fizyczna.
 */
export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: toAbsoluteUrl('/'),
    logo: {
      '@type': 'ImageObject',
      url: toAbsoluteUrl(SITE_LOGO.path),
      width: SITE_LOGO.width,
      height: SITE_LOGO.height,
    },
    email: SERVICE_PROVIDER.email,
    sameAs: [...SOCIAL_PROFILE_URLS],
  };
}

/** WebSite: Google bierze z niej nazwę serwisu wyświetlaną w wynikach wyszukiwania. */
export function buildWebSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    alternateName: 'vocare.pl',
    url: toAbsoluteUrl('/'),
    inLanguage: 'pl-PL',
  };
}
