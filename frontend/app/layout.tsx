import type { Metadata } from "next";
import localFont from "next/font/local"; // Zmieniamy import z next/font/google na next/font/local
import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "@/components/ui/sonner";

// Definiujemy czcionkę SizmoPro z wszystkimi wariantami
const sizmoPro = localFont({
  src: [
    {
      path: "../public/fonts/SizmoPro-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/SizmoPro-LightOblique.woff2",
      weight: "300",
      style: "italic",
    },
    {
      path: "../public/fonts/SizmoPro.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/SizmoPro-Oblique.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/fonts/SizmoPro-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/SizmoPro-MediumOblique.woff2",
      weight: "500",
      style: "italic",
    },
    {
      path: "../public/fonts/SizmoPro-Demibold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/SizmoPro-DemiboldOblique.woff2",
      weight: "600",
      style: "italic",
    },
    {
      path: "../public/fonts/SizmoPro-Bold.woff2",
      weight: "800",
      style: "normal",
    },
    {
      path: "../public/fonts/SizmoPro-BoldOblique.woff2",
      weight: "800",
      style: "italic",
    },
  ],
  variable: "--font-sizmo-pro", // Zmienna CSS, którą możemy użyć w Tailwind
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sizmoPro.className} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light">
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}