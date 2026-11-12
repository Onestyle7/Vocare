import './globals.css';

// import SmoothScrollProvider from '@/components/SupportComponents/SmoothScrollProvider';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import Script from 'next/script';

import { CookieBanner } from '@/components/SupportComponents/CookieBanner';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { AuthProvider } from '@/features/auth/components/AuthProvider';
import { OAuthRegistrationTracker } from '@/features/auth/components/OAuthRegistrationTracker';
import env from '@/lib/env/client';
import { getGoogleAnalyticsScript } from '@/lib/utils/google-analytics';
import { getMetaPixelScript } from '@/lib/utils/meta-pixel';
import { getTikTokPixelScript } from '@/lib/utils/tiktok-pixel';

import { toAbsoluteUrl } from '../features/blog/utils/blogUtils';

const sizmoPro = localFont({
  src: [
    {
      path: '../public/fonts/SizmoPro-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../public/fonts/SizmoPro-LightOblique.woff2',
      weight: '300',
      style: 'italic',
    },
    {
      path: '../public/fonts/SizmoPro.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/SizmoPro-Oblique.woff2',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../public/fonts/SizmoPro-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/SizmoPro-MediumOblique.woff2',
      weight: '500',
      style: 'italic',
    },
    {
      path: '../public/fonts/SizmoPro-Demibold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../public/fonts/SizmoPro-DemiboldOblique.woff2',
      weight: '600',
      style: 'italic',
    },
    {
      path: '../public/fonts/SizmoPro-Bold.woff2',
      weight: '800',
      style: 'normal',
    },
    {
      path: '../public/fonts/SizmoPro-BoldOblique.woff2',
      weight: '800',
      style: 'italic',
    },
  ],
  variable: '--font-sizmo-pro',
});

const spaceGrotesk = localFont({
  src: [
    { path: '../public/fonts/grotesk/SpaceGrotesk-Light.ttf', weight: '300', style: 'normal' },
    { path: '../public/fonts/grotesk/SpaceGrotesk-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../public/fonts/grotesk/SpaceGrotesk-Medium.ttf', weight: '500', style: 'normal' },
    { path: '../public/fonts/grotesk/SpaceGrotesk-SemiBold.ttf', weight: '600', style: 'normal' },
    { path: '../public/fonts/grotesk/SpaceGrotesk-Bold.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: {
    default: 'Vocare',
    template: '%s | Vocare',
  },
  description:
    'Vocare pomaga odkryć Twoją ścieżkę kariery z AI. Sprawdź mocne strony, analizuj rynek i podejmuj trafne decyzje zawodowe na podstawie danych.',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    url: env.NEXT_PUBLIC_APP_URL,
    title: 'Vocare',
    description:
      'Vocare pomaga odkryć Twoją ścieżkę kariery z AI. Sprawdź mocne strony, analizuj rynek i podejmuj trafne decyzje zawodowe na podstawie danych.',
    siteName: 'Vocare',
    locale: 'pl_PL',
    images: [
      {
        url: toAbsoluteUrl('/metadata/og-image.png'),
        width: 1200,
        height: 630,
        alt: 'Vocare',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vocare',
    description:
      'Vocare pomaga odkryć Twoją ścieżkę kariery z AI. Sprawdź mocne strony, analizuj rynek i podejmuj trafne decyzje zawodowe na podstawie danych.',
    images: [toAbsoluteUrl('/metadata/og-image.png')],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = env.NEXT_PUBLIC_GA_ID;
  const tiktokPixelId = env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;
  const metaPixelId = env.NEXT_PUBLIC_META_PIXEL_ID;

  return (
    <html lang="pl" suppressHydrationWarning>
      <head>
        {gaId ? (
          <Script
            id="google-analytics"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{ __html: getGoogleAnalyticsScript(gaId) }}
          />
        ) : null}
        {tiktokPixelId ? (
          <Script
            id="tiktok-pixel"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{ __html: getTikTokPixelScript(tiktokPixelId) }}
          />
        ) : null}
        {metaPixelId ? (
          <Script
            id="meta-pixel"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{ __html: getMetaPixelScript(metaPixelId) }}
          />
        ) : null}
      </head>
      <body
        className={`${sizmoPro.className} ${spaceGrotesk.variable} h-full antialiased selection:bg-[#915EFF]`}
      >
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="dark">
            {children}
            <CookieBanner />
            <OAuthRegistrationTracker />
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
