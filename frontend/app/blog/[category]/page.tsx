import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import ArticleCard from '@/features/blog/components/ArticleCard';
import PageWithBackButton from '@/features/blog/components/PageWIthBackButton';
import { getArticlesMetadata, toAbsoluteUrl } from '@/features/blog/utils/blogUtils';
import {
  ARTICLES_FOLDER,
  BLOG_CATEGORIES,
  isBlogCategorySlug,
} from '@/features/blog/utils/constants';

type CategoryProps = {
  params: Promise<{ category: string }>;
};

/**
 * Only the four known category hubs exist.
 *
 * KNOWN LIMITATION: this currently has no effect. `app/layout.tsx` awaits
 * `cookies()`, which opts every route in the app into dynamic rendering, so
 * nothing here is prerendered and Next.js never gets to reject an unknown
 * param itself. Unknown categories therefore fall through to `notFound()`
 * below and are served with HTTP 200 - a soft 404. The same root cause makes
 * a bad post slug return 200 as well. Kept so the route is correct once the
 * root layout stops forcing dynamic rendering.
 */
export const dynamicParams = false;

export async function generateStaticParams() {
  return Object.keys(BLOG_CATEGORIES).map((category) => ({ category }));
}

export async function generateMetadata({ params }: CategoryProps): Promise<Metadata> {
  const { category } = await params;
  if (!isBlogCategorySlug(category)) return {};

  const { label, heading, description } = BLOG_CATEGORIES[category];
  const canonicalPath = `/blog/${category}`;

  return {
    title: `${label} - poradniki i artykuły`,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: 'website',
      title: `${heading} | Vocare`,
      description,
      url: toAbsoluteUrl(canonicalPath),
      siteName: 'Vocare',
      locale: 'pl_PL',
      images: [
        {
          url: toAbsoluteUrl('/metadata/og-image.png'),
          width: 1200,
          height: 630,
          alt: heading,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${heading} | Vocare`,
      description,
      images: [toAbsoluteUrl('/metadata/og-image.png')],
    },
  };
}

export default async function BlogCategoryPage({ params }: CategoryProps) {
  const { category } = await params;
  if (!isBlogCategorySlug(category)) notFound();

  const { label, heading, description } = BLOG_CATEGORIES[category];
  const articles = getArticlesMetadata(ARTICLES_FOLDER)
    .filter((article) => article.category === category)
    .sort((a, b) => (b.updatedAt ?? b.date).getTime() - (a.updatedAt ?? a.date).getTime());

  if (articles.length === 0) notFound();

  const canonicalPath = `/blog/${category}`;
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Blog', item: toAbsoluteUrl('/blog') },
      { '@type': 'ListItem', position: 2, name: label, item: toAbsoluteUrl(canonicalPath) },
    ],
  };
  const collectionLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: heading,
    description,
    url: toAbsoluteUrl(canonicalPath),
    inLanguage: 'pl-PL',
    isPartOf: {
      '@type': 'Blog',
      name: 'Blog Vocare',
      url: toAbsoluteUrl('/blog'),
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: articles.length,
      itemListElement: articles.map((article, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: article.title,
        url: toAbsoluteUrl(`/blog/${article.category}/${article.slug}`),
      })),
    },
  };

  return (
    <PageWithBackButton backButtonHref="/blog">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }}
      />

      <section className="font-poppins py-10 text-center md:py-16">
        <nav aria-label="Ścieżka nawigacji" className="text-muted-foreground mb-6 text-sm">
          <Link href="/blog" className="hover:text-foreground transition-colors">
            Blog
          </Link>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <span className="text-foreground">{label}</span>
        </nav>

        <h1 className="text-4xl font-bold text-balance md:text-5xl">{heading}</h1>
        <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg text-balance md:mt-6">
          {description}
        </p>
        <p className="text-muted-foreground mt-4 text-sm">
          {articles.length}{' '}
          {articles.length === 1 ? 'artykuł' : articles.length < 5 ? 'artykuły' : 'artykułów'}
        </p>
      </section>

      <section className="mx-auto grid max-w-275 grid-cols-[repeat(auto-fill,minmax(320px,1fr))] items-stretch gap-7 pb-16">
        {articles.map((article) => (
          <Link
            href={`/blog/${article.category}/${article.slug}`}
            key={article.slug}
            className="block h-full w-full"
          >
            <ArticleCard article={article} />
          </Link>
        ))}
      </section>
    </PageWithBackButton>
  );
}
