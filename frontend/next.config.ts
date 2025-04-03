import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '', // Zostaw puste, jeśli nie używasz niestandardowego portu
        pathname: '/**', // Dopuszcza wszystkie ścieżki na tej domenie
      },
    ],
  },
};

export default nextConfig;
