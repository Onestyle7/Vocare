import { ArticleMetadata } from '../types';

/**
 * /blog used to render every post (709 KB of HTML, 129 images) and `?page=2` returned the same
 * document. The listing is now split into static pages: /blog, /blog/strona/2, /blog/strona/3…
 */
export const BLOG_PAGE_SIZE = 24;

export const BLOG_PAGE_PATH = '/blog/strona';

/** Newest first, so fresh posts are on /blog and one link away from the home page. */
export function sortForListing(articles: ArticleMetadata[]) {
  return [...articles].sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function getTotalPages(articleCount: number) {
  return Math.max(1, Math.ceil(articleCount / BLOG_PAGE_SIZE));
}

export function getPageItems<T>(items: T[], page: number) {
  const start = (page - 1) * BLOG_PAGE_SIZE;
  return items.slice(start, start + BLOG_PAGE_SIZE);
}

export function getBlogPageHref(page: number) {
  return page <= 1 ? '/blog' : `${BLOG_PAGE_PATH}/${page}`;
}

/** Fields the search and the cards need, without anything else from the frontmatter. */
export type ArticleSearchItem = Pick<
  ArticleMetadata,
  | 'slug'
  | 'category'
  | 'title'
  | 'description'
  | 'tags'
  | 'coverImage'
  | 'estimatedReadTime'
  | 'date'
>;

export function toSearchItem(article: ArticleMetadata): ArticleSearchItem {
  const { slug, category, title, description, tags, coverImage, estimatedReadTime, date } = article;
  return { slug, category, title, description, tags, coverImage, estimatedReadTime, date };
}
