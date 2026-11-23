// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SOCIAL_PROFILE_URLS } from '../constants/seo';
import {
  buildBlogJsonLd,
  buildOrganizationJsonLd,
  buildPageBreadcrumbJsonLd,
  buildWebSiteJsonLd,
  organizationRef,
  SCHEMA_IDS,
} from '../utils/structuredData';

describe('structured data', () => {
  const baseUrl = 'https://vocare.pl';

  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', baseUrl);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should build Organization with a square logo and social profiles', () => {
    const organization = buildOrganizationJsonLd();

    expect(organization['@type']).toBe('Organization');
    // Same as the home page canonical and og:url
    expect(organization.url).toBe(baseUrl);
    expect(organization.logo).toEqual({
      '@type': 'ImageObject',
      url: `${baseUrl}/metadata/logo.png`,
      width: 512,
      height: 512,
    });
    expect(organization.sameAs).toEqual([...SOCIAL_PROFILE_URLS]);
  });

  it('should tell Vocare apart from other entities of the same name by country and domain', () => {
    const organization = buildOrganizationJsonLd();

    expect(organization.disambiguatingDescription).toMatch(/vocare\.pl/);
    expect(organization.disambiguatingDescription).toMatch(/Polsce/);
    expect(organization.areaServed).toEqual({ '@type': 'Country', name: 'Polska' });
    expect(organization).not.toHaveProperty('legalName');
  });

  it('should build WebSite with the site name shown in search results', () => {
    const website = buildWebSiteJsonLd();

    expect(website['@type']).toBe('WebSite');
    expect(website.name).toBe('Vocare');
    expect(website.url).toBe(baseUrl);
  });

  it('should link every entity to one organization @id', () => {
    const organizationId = `${baseUrl}/#organization`;

    expect(SCHEMA_IDS.organization()).toBe(organizationId);
    expect(buildOrganizationJsonLd()['@id']).toBe(organizationId);
    expect(buildWebSiteJsonLd().publisher).toEqual({ '@id': organizationId });
    expect(buildBlogJsonLd().publisher['@id']).toBe(organizationId);
    expect(organizationRef()['@id']).toBe(organizationId);
  });

  it('should give the inline organization reference a name and logo', () => {
    // Google resolves @id within one page only, so posts need these inline
    const reference = organizationRef();

    expect(reference.name).toBe('Vocare');
    expect(reference.logo.url).toBe(`${baseUrl}/metadata/logo.png`);
  });

  it('should build a two-level breadcrumb for marketing pages', () => {
    expect(buildPageBreadcrumbJsonLd('Cennik', '/pricing').itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Vocare', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Cennik', item: `${baseUrl}/pricing` },
    ]);
  });
});
