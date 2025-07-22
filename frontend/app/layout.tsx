import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { GoogleOAuthProvider } from '@react-oauth/google';

import { TokenBalanceProvider } from '@/lib/contexts/TokenBalanceContext';
// import SmoothScrollProvider from '@/components/SupportComponents/SmoothScrollProvider';

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
  title: 'Vocare',
  description:
    'Vocare is your AI-powered career advisor that helps you discover personalized career paths, long-term goals, and next steps based on your unique skills and profile. Make smarter career decisions with AI-driven guidance.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
  if (!googleClientId) {
    throw new Error('NEXT_PUBLIC_GOOGLE_CLIENT_ID not set');
  }
  return (
    <html lang="en" suppressHydrationWarning className="">
      <body className={`${sizmoPro.className} h-full antialiased selection:bg-[#915EFF]`}>
        {/* <SmoothScrollProvider> */}
        <GoogleOAuthProvider clientId={googleClientId}>
          <TokenBalanceProvider>
            <ThemeProvider attribute="class" defaultTheme="dark">
              {children}
              <Toaster />
            </ThemeProvider>
          </TokenBalanceProvider>
        </GoogleOAuthProvider>
        {/* </SmoothScrollProvider> */}
      </body>
    </html>
  );
}