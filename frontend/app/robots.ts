import type { MetadataRoute } from 'next';

import env from '@/lib/env/client';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: `${env.NEXT_PUBLIC_APP_URL}/sitemap.xml`,
    // No `host`: it was a Yandex-only directive, Google and Bing ignore it
  };
}
