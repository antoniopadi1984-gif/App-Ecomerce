import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  serverExternalPackages: ['@prisma/client', 'prisma'],
  async redirects() {
    return [
      {
        source: '/marketing/research',
        destination: '/dashboard/productos',
        permanent: true,
      },
      {
        source: '/marketing/creative',
        destination: '/dashboard/productos',
        permanent: true,
      },
      {
        source: '/marketing/creative-lab',
        destination: '/dashboard/productos',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
