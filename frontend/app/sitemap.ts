import type { MetadataRoute } from 'next';

import env from '@/lib/env/client';

import { ArticleMetadata } from '../features/blog/types';
import { getArticlesMetadata } from '../features/blog/utils/blogUtils';
import { ARTICLES_FOLDER, BLOG_CATEGORIES } from '../features/blog/utils/constants';

type RouteConfig = {
  path: string;
  /**
   * Date of the last change to the page's content (copy, sections, prices), not of every deploy.
   * Update it by hand together with such a change: Google uses `lastmod` only while it stays
   * truthful. `changefreq` and `priority` are not set, Google ignores both.
   */
  lastModified: string;
};

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = env.NEXT_PUBLIC_APP_URL;
  const articles = getArticlesMetadata(ARTICLES_FOLDER);

  const appRoutes: RouteConfig[] = [
    // No trailing slash: the canonical and og:url of the home page are the bare origin
    { path: '', lastModified: '2026-11-17' },
    { path: '/assistant', lastModified: '2026-11-16' },
    { path: '/market-analysis', lastModified: '2026-10-27' },
    { path: '/resume-creator', lastModified: '2026-10-27' },
    { path: '/roadmap', lastModified: '2026-10-27' },
    { path: '/pricing', lastModified: '2026-11-16' },
    { path: '/salary-calculator', lastModified: '2026-11-16' },
    { path: '/privacy-policy', lastModified: '2026-10-27' },
    { path: '/terms-of-service', lastModified: '2026-11-01' },
  ];

  const staticRoutes: MetadataRoute.Sitemap = appRoutes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: route.lastModified,
  }));

  const articleRoutes: MetadataRoute.Sitemap = articles.map((article: ArticleMetadata) => ({
    url: `${baseUrl}/blog/${encodeURIComponent(article.category)}/${encodeURIComponent(article.slug)}`,
    lastModified: article.updatedAt ?? article.date,
  }));

  const newestDate = (list: ArticleMetadata[]) =>
    list
      .map((article) => article.updatedAt ?? article.date)
      .sort((a, b) => b.getTime() - a.getTime())[0];

  // The blog index changes whenever any post does
  const blogLastModified = newestDate(articles);
  const blogRoute: MetadataRoute.Sitemap = blogLastModified
    ? [{ url: `${baseUrl}/blog`, lastModified: blogLastModified }]
    : [{ url: `${baseUrl}/blog` }];

  // Empty categories render notFound(), so they must not land in the sitemap
  const categoryRoutes: MetadataRoute.Sitemap = Object.keys(BLOG_CATEGORIES).flatMap((category) => {
    const lastModified = newestDate(articles.filter((article) => article.category === category));

    if (!lastModified) return [];

    return { url: `${baseUrl}/blog/${encodeURIComponent(category)}`, lastModified };
  });

  return [...staticRoutes, ...blogRoute, ...categoryRoutes, ...articleRoutes];
}
