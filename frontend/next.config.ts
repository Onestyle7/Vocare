import type { NextConfig } from 'next';
import path from 'path';

// Short links for social profile bios. Instagram and Facebook show the raw URL on the profile,
// so the UTM-tagged address lives here, and GA4 reads the source after the redirect.
const SOCIAL_BIO_LINKS = [
  { path: '/ig', utmSource: 'instagram' },
  { path: '/fb', utmSource: 'facebook' },
  { path: '/tiktok', utmSource: 'tiktok' },
  { path: '/linkedin', utmSource: 'linkedin' },
];

const nextConfig: NextConfig = {
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  transpilePackages: ['gsap', 'lenis'],
  reactStrictMode: true,
  turbopack: {
    root: path.join(__dirname, '..'),
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL!,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    // Order matters: Next.js applies the first matching rule, so the per-post
    // rules below must stay ahead of the category-wide ones. Their destinations
    // already use the new lowercase categories so no request is redirected twice.
    return [
      // Blog posts merged during the 2026-09-02 cannibalization cleanup.
      // Keep these permanent (301) so backlinks/search rankings transfer to the surviving post.
      {
        source: '/blog/CV/wzor-cv',
        destination: '/blog/cv/cv-wzor',
        permanent: true,
      },
      {
        source: '/blog/CV/jak-napisac-cv',
        destination: '/blog/cv/jak-zrobic-cv',
        permanent: true,
      },
      {
        source: '/blog/rynek-pracy/zawody-przyszlosci',
        destination: '/blog/rynek-pracy/zawody-przyszlosci-2026',
        permanent: true,
      },
      {
        source: '/blog/Job/szukanie-pracy',
        destination: '/blog/praca/jak-znalezc-prace',
        permanent: true,
      },

      // NOTE: the 2026-09-22 category rename (CV -> cv, Job -> praca,
      // Kariera -> kariera) is NOT handled here. `source` matching is
      // case-insensitive, so '/blog/CV/:slug' also matches '/blog/cv/:slug'
      // and every cv/ and kariera/ post would redirect to itself forever.
      // It lives in proxy.ts instead, which compares the segment exactly.

      // Temporary (307), so browsers don't cache the target and the UTM tags can change later
      // without touching the links in the profiles.
      ...SOCIAL_BIO_LINKS.map(({ path, utmSource }) => ({
        source: path,
        destination: `/?utm_source=${utmSource}&utm_medium=organic_social&utm_campaign=bio`,
        permanent: false,
      })),
    ];
  },
};

export default nextConfig;
