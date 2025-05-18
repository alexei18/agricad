import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      { // Add this block for Leaflet icons
        protocol: 'https',
        hostname: 'unpkg.com',
        port: '',
        pathname: '/leaflet@1.9.4/dist/images/**',
      },
    ],
  },
  // --- ADAUGĂ ACEST BLOC ---
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Poți ajusta valoarea (ex: '10mb', '20mb') dacă 5MB nu e suficient
    },
  },
  // --- Sfârșitul blocului adăugat ---
};

export default nextConfig;