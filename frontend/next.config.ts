import type { NextConfig } from 'next';
import path from 'path';

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
    ];
  },
};

export default nextConfig;
