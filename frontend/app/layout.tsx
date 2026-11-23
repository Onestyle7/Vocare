import './globals.css';

// import SmoothScrollProvider from '@/components/SupportComponents/SmoothScrollProvider';
import type { Metadata } from 'next';
import { IBM_Plex_Mono, Poppins } from 'next/font/google';
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
  display: 'swap',
  // `preload` applies to every file of a localFont call, there is no per-face
  // switch. With it on, all 10 faces were preloaded on every page, while the
  // public pages render at most 3 of them and none above the fold on the
  // landing pages (those use Poppins). Faces now load when a page uses them.
  preload: false,
});

const spaceGrotesk = localFont({
  src: [
    { path: '../public/fonts/grotesk/SpaceGrotesk-Light.woff2', weight: '300', style: 'normal' },
    { path: '../public/fonts/grotesk/SpaceGrotesk-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/grotesk/SpaceGrotesk-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/grotesk/SpaceGrotesk-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/grotesk/SpaceGrotesk-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-grotesk',
  display: 'swap',
  // Same reasoning as sizmoPro. The .ttf files stay in the folder because the
  // legal PDF renderer (features/marketing/pdf) reads them from disk.
  preload: false,
});

// Poppins and IBM Plex Mono used to come from three render-blocking `@import`s
// of fonts.googleapis.com in globals.css (about 0.8 s of LCP on mobile). next/font
// self-hosts them and inlines the @font-face, so nothing blocks the first paint.
// Inter was imported there too but no class or style ever used it.
const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700', '800'],
  subsets: ['latin', 'latin-ext'],
  variable: '--font-poppins',
  display: 'swap',
});

// Only `ibm-plex-mono-regular` is used, and only inside the dashboard.
const ibmPlexMono = IBM_Plex_Mono({
  weight: '400',
  subsets: ['latin', 'latin-ext'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: {
    default: 'Vocare',
    template: '%s | Vocare',
  },
  description:
    'Vocare pomaga odkryć Twoją ścieżkę kariery z AI. Sprawdź mocne strony, analizuj rynek i podejmuj trafne decyzje zawodowe na podstawie danych.',
  // site.webmanifest and the touch icon existed in /public but nothing linked to them
  manifest: '/site.webmanifest',
  icons: {
    apple: '/metadata/apple-touch-icon.png',
  },
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
        className={`${sizmoPro.className} ${spaceGrotesk.variable} ${poppins.variable} ${ibmPlexMono.variable} h-full antialiased selection:bg-[#915EFF]`}
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
