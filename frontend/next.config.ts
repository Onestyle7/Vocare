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
    // Blog posts merged during the 2026-09-02 cannibalization cleanup.
    // Keep these permanent (301) so backlinks/search rankings transfer to the surviving post.
    return [
      {
        source: '/blog/CV/wzor-cv',
        destination: '/blog/CV/cv-wzor',
        permanent: true,
      },
      {
        source: '/blog/CV/jak-napisac-cv',
        destination: '/blog/CV/jak-zrobic-cv',
        permanent: true,
      },
      {
        source: '/blog/rynek-pracy/zawody-przyszlosci',
        destination: '/blog/rynek-pracy/zawody-przyszlosci-2026',
        permanent: true,
      },
      {
        source: '/blog/Job/szukanie-pracy',
        destination: '/blog/Job/jak-znalezc-prace',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
