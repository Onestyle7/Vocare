'use client';

import Fuse from 'fuse.js';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { FUSE_OPTIONS } from '../_utils/constants';
import { ArticleMetadata } from '../_utils/types';
import ArticleCard from './ArticleCard';
import SearchBar from './SearchBar';

export default function SearchView({ articlesMetadata }: { articlesMetadata: ArticleMetadata[] }) {
  const [searchValue, setSearchValue] = useState('');
  const fuse = useMemo(() => new Fuse(articlesMetadata, FUSE_OPTIONS), [articlesMetadata]);

  const searchResultElements = () => {
    const results = searchValue
      ? fuse.search(searchValue).map(({ item }) => item)
      : articlesMetadata;

    return results.length > 0 ? (
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
    );
  };

  return (
    <>
      <SearchBar className="my-8 md:my-15" value={searchValue} onChange={setSearchValue} />
      <section className="mx-auto grid max-w-275 grid-cols-[repeat(auto-fill,minmax(320px,1fr))] items-stretch gap-7">
        {searchResultElements()}
      </section>
    </>
  );
}
