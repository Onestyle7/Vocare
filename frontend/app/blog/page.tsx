import React from 'react';
import SearchView from './_components/SearchView';
import type { Metadata } from 'next';
import { getArticlesMetadata, toAbsoluteUrl } from './_utils/blogUtils';
import { ARTICLES_FOLDER } from './_utils/constants';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Blog Vocare z praktycznymi poradami kariery, trendami rynku pracy, AI w rekrutacji i wskazowkami jak rozwijac kompetencje zawodowe.',
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    type: 'website',
    title: 'Vocare Blog',
    description:
      'Blog Vocare z praktycznymi poradami kariery, trendami rynku pracy, AI w rekrutacji i wskazowkami jak rozwijac kompetencje zawodowe.',
    url: '/blog',
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
    title: 'Vocare Blog',
    description:
      'Blog Vocare z praktycznymi poradami kariery, trendami rynku pracy, AI w rekrutacji i wskazowkami jak rozwijac kompetencje zawodowe.',
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
    </section>
  );
}
