import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import BlogListing from '@/features/blog/components/BlogListing';
import { getArticlesMetadata } from '@/features/blog/utils/blogUtils';
import { ARTICLES_FOLDER } from '@/features/blog/utils/constants';
import { BLOG_PAGE_PATH, getTotalPages } from '@/features/blog/utils/pagination';
import { PromoBar } from '@/features/marketing/components/PromoSticky';

type Props = { params: Promise<{ page: string }> };

// Only pages 2..N exist. Page 1 is /blog, so /blog/strona/1 and pages past the end 404
export const dynamicParams = false;

export function generateStaticParams() {
  const totalPages = getTotalPages(getArticlesMetadata(ARTICLES_FOLDER).length);
  return Array.from({ length: totalPages - 1 }, (_, index) => ({ page: String(index + 2) }));
}

function parsePage(raw: string) {
  return /^\d+$/.test(raw) ? Number(raw) : NaN;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = parsePage((await params).page);
  const title = `Blog o karierze, CV i rynku pracy – strona ${page}`;
  const description = `Artykuły Vocare o karierze, CV i rynku pracy – strona ${page}. Porady zawodowe, trendy rynku pracy i wskazówki, jak rozwijać kompetencje.`;

  return {
    title,
    description,
    // Each page is its own listing, so it is canonical to itself, not to /blog
    alternates: { canonical: `${BLOG_PAGE_PATH}/${page}` },
    openGraph: {
      type: 'website',
      title: `${title} | Vocare`,
      description,
      url: `${BLOG_PAGE_PATH}/${page}`,
    },
  };
}

export default async function BlogListingPage({ params }: Props) {
  const page = parsePage((await params).page);
  const articles = getArticlesMetadata(ARTICLES_FOLDER);
  if (!Number.isInteger(page) || page < 2 || page > getTotalPages(articles.length)) notFound();

  return (
    <section className="py-10 text-center md:py-20">
      <h1 className="font-poppins text-4xl font-medium text-balance md:text-6xl">
        Blog Vocare <span className="text-muted-foreground">– strona {page}</span>
      </h1>
      <p className="text-muted-foreground font-poppins mt-4 text-xl font-extralight text-balance md:mt-8">
        Wiedza, trendy rynkowe i porady zawodowe w jednym miejscu
      </p>
      <BlogListing articles={articles} page={page} />
      <PromoBar variant="cv" />
    </section>
  );
}
