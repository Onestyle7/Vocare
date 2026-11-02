// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SOCIAL_PROFILE_URLS } from '../constants/seo';
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from '../utils/structuredData';

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
    expect(organization.url).toBe(`${baseUrl}/`);
    expect(organization.logo).toEqual({
      '@type': 'ImageObject',
      url: `${baseUrl}/metadata/logo.png`,
      width: 512,
      height: 512,
    });
    expect(organization.sameAs).toEqual([...SOCIAL_PROFILE_URLS]);
  });

  it('should build WebSite with the site name shown in search results', () => {
    const website = buildWebSiteJsonLd();

    expect(website['@type']).toBe('WebSite');
    expect(website.name).toBe('Vocare');
    expect(website.url).toBe(`${baseUrl}/`);
  });
});
