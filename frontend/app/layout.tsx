import './globals.css';

// import SmoothScrollProvider from '@/components/SupportComponents/SmoothScrollProvider';
import { GoogleAnalytics } from '@next/third-parties/google';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { cookies } from 'next/headers';

import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { AuthProvider } from '@/features/auth/components/AuthProvider';
import { TokenBalanceProvider } from '@/features/billing/components/SubscriptionTokenProvider';
import { SubscriptionStatus } from '@/features/billing/dal/api';
import { getTokenSubscriptionStatus } from '@/features/billing/dal/queries';
import env from '@/lib/env/client';

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
    'Vocare pomaga odkryc Twoja sciezke kariery z AI. Sprawdz mocne strony, analizuj rynek i podejmuj trafne decyzje zawodowe na podstawie danych.',
  alternates: {
    canonical: '/',
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
      'Vocare pomaga odkryc Twoja sciezke kariery z AI. Sprawdz mocne strony, analizuj rynek i podejmuj trafne decyzje zawodowe na podstawie danych.',
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
      'Vocare pomaga odkryc Twoja sciezke kariery z AI. Sprawdz mocne strony, analizuj rynek i podejmuj trafne decyzje zawodowe na podstawie danych.',
    images: [toAbsoluteUrl('/metadata/og-image.png')],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = env.NEXT_PUBLIC_GA_ID;
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.has('token');

  let tokenCount = 0;
  let subscribtionStatus: SubscriptionStatus = 'None';
  const [tokenBalanceError, tokenBalanceData] = await getTokenSubscriptionStatus();
  if (!tokenBalanceError) {
    tokenCount = tokenBalanceData.tokenBalance;
    subscribtionStatus = tokenBalanceData.subscriptionStatus;
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${sizmoPro.className} ${spaceGrotesk.variable} h-full antialiased selection:bg-[#915EFF]`}
      >
        <AuthProvider isAuthenticated={isAuthenticated}>
          <TokenBalanceProvider tokenBalance={tokenCount} subscriptionStatus={subscribtionStatus}>
            <ThemeProvider attribute="class" defaultTheme="dark">
              {children}
              <Toaster />
            </ThemeProvider>
          </TokenBalanceProvider>
        </AuthProvider>
      </body>
      {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
    </html>
  );
}
