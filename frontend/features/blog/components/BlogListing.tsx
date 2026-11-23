import Link from 'next/link';

import { cn } from '@/lib/utils';

import { ArticleMetadata } from '../types';
import {
  getBlogPageHref,
  getPageItems,
  getTotalPages,
  sortForListing,
  toSearchItem,
} from '../utils/pagination';
import ArticleCard from './ArticleCard';
import SearchView from './SearchView';

const PRIORITY_CARDS = 3;

/** One page of the blog listing, server-rendered, with the search over all posts on top. */
export default function BlogListing({
  articles,
  page,
}: {
  articles: ArticleMetadata[];
  page: number;
}) {
  const sorted = sortForListing(articles);
  const totalPages = getTotalPages(sorted.length);
  const pageItems = getPageItems(sorted, page);

  return (
    <SearchView>
      <section className="mx-auto grid max-w-275 grid-cols-[repeat(auto-fill,minmax(320px,1fr))] items-stretch gap-7">
        {pageItems.map((article, index) => (
          <Link
            href={`/blog/${article.category}/${article.slug}`}
            key={article.slug}
            className="block h-full w-full"
          >
            <ArticleCard article={toSearchItem(article)} priority={index < PRIORITY_CARDS} />
          </Link>
        ))}
      </section>
      <BlogPagination page={page} totalPages={totalPages} />
    </SearchView>
  );
}

function BlogPagination({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  const linkClass =
    'font-poppins inline-flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-sm duration-200';

  return (
    <nav
      aria-label="Strony bloga"
      className="mt-12 flex flex-wrap items-center justify-center gap-2"
    >
      {page > 1 && (
        <Link href={getBlogPageHref(page - 1)} className={cn(linkClass, 'hover:border-[#818fff]')}>
          &larr; Poprzednia
        </Link>
      )}
      {pages.map((number) =>
        number === page ? (
          <span
            key={number}
            aria-current="page"
            className={cn(linkClass, 'border-[#818fff] bg-[#818fff]/15 text-[#F1F4FF]')}
          >
            {number}
          </span>
        ) : (
          <Link
            key={number}
            href={getBlogPageHref(number)}
            className={cn(linkClass, 'text-muted-foreground hover:border-[#818fff]')}
            aria-label={`Strona ${number}`}
          >
            {number}
          </Link>
        )
      )}
      {page < totalPages && (
        <Link href={getBlogPageHref(page + 1)} className={cn(linkClass, 'hover:border-[#818fff]')}>
          Następna &rarr;
        </Link>
      )}
    </nav>
  );
}
