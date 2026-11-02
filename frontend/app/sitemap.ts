import type { MetadataRoute } from 'next';

import env from '@/lib/env/client';

import { ArticleMetadata } from '../features/blog/types';
import { getArticlesMetadata } from '../features/blog/utils/blogUtils';
import { ARTICLES_FOLDER, BLOG_CATEGORIES } from '../features/blog/utils/constants';

type RouteConfig = {
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;
  priority: number;
};

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = env.NEXT_PUBLIC_APP_URL;
  const articles = getArticlesMetadata(ARTICLES_FOLDER);

  const appRoutes: RouteConfig[] = [
    { path: '/', changeFrequency: 'weekly', priority: 1 },
    { path: '/assistant', changeFrequency: 'weekly', priority: 0.8 },
    { path: '/market-analysis', changeFrequency: 'weekly', priority: 0.8 },
    { path: '/resume-creator', changeFrequency: 'weekly', priority: 0.8 },
    { path: '/roadmap', changeFrequency: 'weekly', priority: 0.8 },
    { path: '/pricing', changeFrequency: 'weekly', priority: 0.8 },
    { path: '/salary-calculator', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/privacy-policy', changeFrequency: 'yearly', priority: 0.6 },
    { path: '/terms-of-service', changeFrequency: 'yearly', priority: 0.6 },
    { path: '/blog', changeFrequency: 'weekly', priority: 0.9 },
  ];

  const staticRoutes: MetadataRoute.Sitemap = appRoutes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const articleRoutes: MetadataRoute.Sitemap = articles.map((article: ArticleMetadata) => ({
    url: `${baseUrl}/blog/${encodeURIComponent(article.category)}/${encodeURIComponent(article.slug)}`,
    lastModified: article.updatedAt ?? article.date,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  // Empty categories render notFound(), so they must not land in the sitemap
  const categoryRoutes: MetadataRoute.Sitemap = Object.keys(BLOG_CATEGORIES).flatMap((category) => {
    const lastModified = articles
      .filter((article) => article.category === category)
      .map((article) => article.updatedAt ?? article.date)
      .sort((a, b) => b.getTime() - a.getTime())[0];

    if (!lastModified) return [];

    return {
      url: `${baseUrl}/blog/${encodeURIComponent(category)}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    };
  });

  return [...staticRoutes, ...categoryRoutes, ...articleRoutes];
}
