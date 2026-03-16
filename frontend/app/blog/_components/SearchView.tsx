'use client';

import { useMemo, useState } from 'react';
import { ArticleMetadata } from '../_utils/types';
import SearchBar from './SearchBar';
import Fuse from 'fuse.js';
import ArticleCard from './ArticleCard';
import { FUSE_OPTIONS } from '../_utils/constants';
import Link from 'next/link';

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
      <p className="text-muted-foreground col-span-3 text-lg">Not found any matching articles</p>
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
