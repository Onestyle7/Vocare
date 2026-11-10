import type { Metadata } from 'next';

import SearchView from '@/features/blog/components/SearchView';
import { PromoBar } from '@/features/marketing/components/PromoSticky';

import { getArticlesMetadata, toAbsoluteUrl } from '../../features/blog/utils/blogUtils';
import { ARTICLES_FOLDER } from '../../features/blog/utils/constants';

export const metadata: Metadata = {
  title: 'Blog o karierze, CV i rynku pracy',
  description:
    'Blog Vocare z praktycznymi poradami kariery, trendami rynku pracy, AI w rekrutacji i wskazówkami, jak rozwijać kompetencje zawodowe.',
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    type: 'website',
    title: 'Blog o karierze, CV i rynku pracy | Vocare',
    description:
      'Blog Vocare z praktycznymi poradami kariery, trendami rynku pracy, AI w rekrutacji i wskazówkami, jak rozwijać kompetencje zawodowe.',
    url: '/blog',
    siteName: 'Vocare',
    locale: 'pl_PL',
    images: [
      {
        url: toAbsoluteUrl('/metadata/og-image.png'),
        width: 1200,
        height: 630,
        alt: 'Vocare Blog',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog o karierze, CV i rynku pracy | Vocare',
    description:
      'Blog Vocare z praktycznymi poradami kariery, trendami rynku pracy, AI w rekrutacji i wskazówkami, jak rozwijać kompetencje zawodowe.',
    images: [toAbsoluteUrl('/metadata/og-image.png')],
  },
};

export default function BlogPage() {
  const articlesMetadata = getArticlesMetadata(ARTICLES_FOLDER);
  return (
    <section className="py-10 text-center md:py-20">
      <h1 className="text-4xl font-bold text-balance md:text-6xl">
        Odkryj swój <br /> <span className="text-muted-foreground">potencjał z Vocare</span>
      </h1>
      <p className="text-muted-foreground mt-4 text-xl text-balance md:mt-8">
        Wiedza, trendy rynkowe i porady zawodowe w jednym miejscu
      </p>
      <SearchView articlesMetadata={articlesMetadata} />
      <PromoBar variant="cv" />
    </section>
  );
}
