import type { Metadata } from 'next';

import { toAbsoluteUrl } from '@/features/blog/utils/blogUtils';

import { OG_IMAGE, SITE_NAME } from '../constants/seo';

export interface BuildMarketingMetadataProps {
  path: string;
  title: string;
  description: string;
  ogAlt: string;
  ogImagePath?: string;
  /** Pomija szablon „%s | Vocare” – dla strony głównej, której title już zawiera nazwę. */
  absoluteTitle?: boolean;
}

export function buildMarketingMetadata({
  path,
  title,
  description,
  ogAlt,
  ogImagePath = OG_IMAGE.path,
  absoluteTitle = false,
}: BuildMarketingMetadataProps): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} | ${SITE_NAME}`;
  const ogImageUrl = toAbsoluteUrl(ogImagePath);

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: 'pl_PL',
      url: path,
      title: fullTitle,
      description,
      images: [
        {
          url: ogImageUrl,
          width: OG_IMAGE.width,
          height: OG_IMAGE.height,
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
