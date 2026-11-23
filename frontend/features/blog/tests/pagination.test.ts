import { describe, expect, it } from 'vitest';

import type { ArticleMetadata } from '../types';
import {
  BLOG_PAGE_SIZE,
  getBlogPageHref,
  getPageItems,
  getTotalPages,
  sortForListing,
  toSearchItem,
} from '../utils/pagination';

const article = (slug: string, date: string): ArticleMetadata => ({
  slug,
  title: slug,
  description: `${slug} description`,
  estimatedReadTime: 5,
  category: 'cv',
  author: 'Vocare',
  coverImage: '/images/blog/x.webp',
  date: new Date(date),
  updatedAt: new Date('2026-11-01'),
  tags: ['cv'],
});

describe('blog pagination', () => {
  it('splits 127 posts into 6 pages, the last one partial', () => {
    const items = Array.from({ length: 127 }, (_, index) => index);

    expect(getTotalPages(127)).toBe(6);
    expect(getPageItems(items, 1)).toHaveLength(BLOG_PAGE_SIZE);
    expect(getPageItems(items, 6)).toEqual(items.slice(120));
    expect(getPageItems(items, 7)).toEqual([]);
  });

  it('keeps at least one page for an empty blog', () => {
    expect(getTotalPages(0)).toBe(1);
  });

  it('links page 1 to /blog, not to a duplicate of it', () => {
    expect(getBlogPageHref(1)).toBe('/blog');
    expect(getBlogPageHref(2)).toBe('/blog/strona/2');
  });

  it('lists the newest posts first without mutating the input', () => {
    const input = [article('old', '2026-01-01'), article('new', '2026-10-01')];

    expect(sortForListing(input).map(({ slug }) => slug)).toEqual(['new', 'old']);
    expect(input[0].slug).toBe('old');
  });

  it('sends only the fields the search and cards need', () => {
    const item = toSearchItem(article('cv', '2026-01-01'));

    expect(Object.keys(item).sort()).toEqual(
      [
        'category',
        'coverImage',
        'date',
        'description',
        'estimatedReadTime',
        'slug',
        'tags',
        'title',
      ].sort()
    );
  });
});
