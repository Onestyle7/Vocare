import type { MetadataRoute } from 'next';

import env from '@/lib/env/client';

import { getArticlesMetadata } from './blog/_utils/blogUtils';
import { ARTICLES_FOLDER } from './blog/_utils/constants';
import { ArticleMetadata } from './blog/_utils/types';

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
    { path: '/pricing', changeFrequency: 'weekly', priority: 0.8 },
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
    lastModified: article.date,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...articleRoutes];
}
