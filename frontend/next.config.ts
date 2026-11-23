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

// Report-Only on purpose: violations are logged in the browser console and
// nothing is blocked. Review the console on the landing pages, the dashboard
// and the Stripe checkout return before promoting this to an enforced
// `Content-Security-Policy`.
const contentSecurityPolicyReportOnly = [
  "default-src 'self'",
  // React and Turbopack evaluate strings in development only.
  // The TikTok and Meta pixel SDKs load only after advertising consent (lib/utils/*-pixel.ts).
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'production' ? '' : " 'unsafe-eval'"} https://www.googletagmanager.com https://analytics.tiktok.com https://connect.facebook.net`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  // Pixel events go to TikTok and Meta; the 3D scene on the sign-in pages comes from Spline.
  `connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL ?? ''} https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://analytics.tiktok.com https://www.facebook.com https://prod.spline.design`,
  "frame-src 'self' https://checkout.stripe.com https://js.stripe.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.stripe.com",
  "object-src 'none'",
].join('; ');

const securityHeaders = [
  // Vercel already sends max-age=63072000; this adds the subdomains. `preload` is left out on
  // purpose: it is a request to be hard-coded into browsers, which is hard to undo.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  // The site uses none of these. Clipboard (footer "copy link") is not affected, and `payment`
  // stays allowed for Apple Pay / Google Pay in Stripe frames.
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), usb=(), browsing-topics=()',
  },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Content-Security-Policy-Report-Only', value: contentSecurityPolicyReportOnly },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
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
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
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
