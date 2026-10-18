// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildMarketingMetadata } from '../utils/metadata';

describe('buildMarketingMetadata', () => {
  const baseUrl = 'https://vocare.pl';

  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', baseUrl);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should build complete metadata with openGraph siteName, locale, type and canonical', () => {
    const metadata = buildMarketingMetadata({
      path: '/assistant',
      title: 'Inteligentny Asystent Kariery AI',
      description: 'Opis asystenta kariery.',
      ogAlt: 'Podgląd Asystenta - Vocare',
    });

    expect(metadata.title).toBe('Inteligentny Asystent Kariery AI');
    expect(metadata.description).toBe('Opis asystenta kariery.');
    expect(metadata.alternates?.canonical).toBe('/assistant');

    expect(metadata.openGraph).toEqual({
      type: 'website',
      siteName: 'Vocare',
      locale: 'pl_PL',
      url: '/assistant',
      title: 'Inteligentny Asystent Kariery AI | Vocare',
      description: 'Opis asystenta kariery.',
      images: [
        {
          url: `${baseUrl}/metadata/og-image.png`,
          width: 1200,
          height: 630,
          alt: 'Podgląd Asystenta - Vocare',
        },
      ],
    });

    expect(metadata.twitter).toEqual({
      card: 'summary_large_image',
      title: 'Inteligentny Asystent Kariery AI | Vocare',
      description: 'Opis asystenta kariery.',
      images: [`${baseUrl}/metadata/og-image.png`],
    });
  });

  it('should allow custom ogImagePath', () => {
    const metadata = buildMarketingMetadata({
      path: '/custom',
      title: 'Custom Page',
      description: 'Custom Description',
      ogAlt: 'Custom Alt',
      ogImagePath: '/images/custom-og.png',
    });

    const ogImages = metadata.openGraph?.images as Array<{ url: string }>;
    expect(ogImages[0].url).toBe(`${baseUrl}/images/custom-og.png`);
  });

  it('should skip the title template and keep the full title in openGraph when absoluteTitle is set', () => {
    const metadata = buildMarketingMetadata({
      path: '/',
      title: 'Vocare – AI doradca kariery',
      description: 'Opis strony głównej.',
      ogAlt: 'Vocare',
      absoluteTitle: true,
    });

    expect(metadata.title).toEqual({ absolute: 'Vocare – AI doradca kariery' });
    expect(metadata.openGraph?.title).toBe('Vocare – AI doradca kariery');
    expect(metadata.twitter?.title).toBe('Vocare – AI doradca kariery');
  });
});
