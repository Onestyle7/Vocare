import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { Toaster } from '@/components/ui/sonner';

import { TokenBalanceProvider } from '@/lib/contexts/TokenBalanceContext';
// import SmoothScrollProvider from '@/components/SupportComponents/SmoothScrollProvider';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vocare.pl';
const METADATA_BASE = (() => {
  try {
    return new URL(BASE_URL);
  } catch {
    return new URL('https://vocare.pl');
  }
})();


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

// const notch = localFont({
//   src: [
//      {
//       path: '../public/fonts/Notch/FormulaCondensed Regular.otf',
//     },
//   ]
// })

export const metadata: Metadata = {
  metadataBase: METADATA_BASE,
  title: {
    default: 'Vocare - AI Career Advisor',
    template: '%s | Vocare',
  },
  applicationName: 'Vocare',
  description:
    'Turn your profile into clear career recommendations, live market insights, and an ATS-ready resume. Start for free.',
  keywords: [
    'AI career advisor',
    'job market insights',
    'ATS resume builder',
    'career planning for graduates',
    'youth employment support',
    'personalized job search',
  ],
  category: 'Career Development',
  creator: 'Vocare Team',
  publisher: 'Vocare',
  authors: [{ name: 'Vocare Team', url: BASE_URL }],
  alternates: {
    canonical: BASE_URL,
    languages: {
      'en-US': `${BASE_URL}/`,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  openGraph: {
    type: 'website',
    url: BASE_URL,
    siteName: 'Vocare',
    locale: 'en_US',
    title: 'Vocare - AI Career Advisor, Market Insights & ATS Resume',
    description:
      'Get a personalized career plan with success probability, salary bands, market trends, and an ATS-ready resume.',
    images: [
      {
        url: `${BASE_URL}/metadata/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Vocare - AI Career Advisor preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vocare - AI Career Advisor, Market Insights & ATS Resume',
    description:
      'Personalized career recommendations, market insights, and an ATS-ready resume.',
    images: [`${BASE_URL}/metadata/og-image.png`],
  },
  icons: {
    icon: [
      { url: '/metadata/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/metadata/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/metadata/favicon.ico' },
    ],
    apple: [{ url: '/metadata/apple-touch-icon.png', sizes: '180x180' }],
    shortcut: ['/metadata/favicon.ico'],
    other: [
      {
        rel: 'mask-icon',
        url: '/metadata/safari-pinned-tab.svg',
        color: '#0B0F19',
      },
    ],
  },
  manifest: '/metadata/site.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Vocare',
  },
  other: {
    'msapplication-TileColor': '#0B0F19',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0B0F19',
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="">
      <body className={`${sizmoPro.className} h-full antialiased selection:bg-[#915EFF]`}>
        {/* <SmoothScrollProvider> */}
        <TokenBalanceProvider>
          <ThemeProvider attribute="class" defaultTheme="dark">
            {children}
            <Toaster />
          </ThemeProvider>
        </TokenBalanceProvider>
        {/* </SmoothScrollProvider> */}
      </body>
    </html>
  );
}
