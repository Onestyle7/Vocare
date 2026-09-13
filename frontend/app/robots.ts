import type { MetadataRoute } from 'next';

import env from '@/lib/env/client';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/api/',
          '/resume/',
          '/roadmap/',
          '/sign-in',
          '/sign-up',
          '/forgot-password',
          '/reset-password',
          '/maintenance',
          '/preferences',
        ],
      },
    ],
    sitemap: `${env.NEXT_PUBLIC_APP_URL}/sitemap.xml`,
    host: env.NEXT_PUBLIC_APP_URL,
  };
}
