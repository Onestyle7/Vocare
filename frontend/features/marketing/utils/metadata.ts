import type { Metadata } from 'next';

import { toAbsoluteUrl } from '@/features/blog/utils/blogUtils';

export interface BuildMarketingMetadataProps {
  path: string;
  title: string;
  description: string;
  ogAlt: string;
  ogImagePath?: string;
}

export function buildMarketingMetadata({
  path,
  title,
  description,
  ogAlt,
  ogImagePath = '/metadata/og-image.png',
}: BuildMarketingMetadataProps): Metadata {
  const fullTitle = `${title} | Vocare`;
  const ogImageUrl = toAbsoluteUrl(ogImagePath);

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: 'website',
      siteName: 'Vocare',
      locale: 'pl_PL',
      url: path,
      title: fullTitle,
      description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: ogAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImageUrl],
    },
  };
}
