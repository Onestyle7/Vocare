'use client';

import Fuse from 'fuse.js';
import Link from 'next/link';
import { type ReactNode, useEffect, useMemo, useState } from 'react';

import { FUSE_OPTIONS } from '../utils/constants';
import type { ArticleSearchItem } from '../utils/pagination';
import ArticleCard from './ArticleCard';
import SearchBar from './SearchBar';

export const SEARCH_INDEX_URL = '/blog/search-index.json';

type IndexState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; items: ArticleSearchItem[] }
  | { status: 'error' };

/**
 * Search over every post, while the page itself only renders one page of the listing.
 * `children` is the server-rendered page (cards + pagination), shown while the query is empty.
 * The index of all posts is fetched on the first keystroke, not shipped with the page.
 */
export default function SearchView({ children }: { children: ReactNode }) {
  const [searchValue, setSearchValue] = useState('');
  const [index, setIndex] = useState<IndexState>({ status: 'idle' });
  const query = searchValue.trim();

  useEffect(() => {
    if (!query || index.status !== 'idle') return;
    setIndex({ status: 'loading' });
    fetch(SEARCH_INDEX_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`Search index: HTTP ${response.status}`);
        return response.json() as Promise<ArticleSearchItem[]>;
      })
      .then((items) => setIndex({ status: 'ready', items }))
      .catch(() => setIndex({ status: 'error' }));
  }, [query, index.status]);

  const fuse = useMemo(
    () => (index.status === 'ready' ? new Fuse(index.items, FUSE_OPTIONS) : null),
    [index]
  );
  const results = query && fuse ? fuse.search(query).map(({ item }) => item) : [];

  return (
    <>
      <SearchBar className="my-8 md:my-15" value={searchValue} onChange={setSearchValue} />
      {query ? (
        <section
          aria-live="polite"
          className="mx-auto grid max-w-275 grid-cols-[repeat(auto-fill,minmax(320px,1fr))] items-stretch gap-7"
        >
          {index.status === 'error' ? (
            <p className="text-muted-foreground col-span-3 text-lg">
              Nie udało się wczytać wyszukiwarki. Odśwież stronę i spróbuj ponownie.
            </p>
          ) : !fuse ? (
            <p className="text-muted-foreground col-span-3 text-lg">Szukam artykułów…</p>
          ) : results.length > 0 ? (
            results.map((article) => (
              <Link
                href={`/blog/${article.category}/${article.slug}`}
                key={article.slug}
                className="block h-full w-full"
              >
                <ArticleCard article={article} />
              </Link>
            ))
          ) : (
            <p className="text-muted-foreground col-span-3 text-lg">
              Nie znaleziono pasujących artykułów
            </p>
          )}
        </section>
      ) : (
        children
      )}
    </>
  );
}
