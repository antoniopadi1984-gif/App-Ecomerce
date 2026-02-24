import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-popover', '@radix-ui/react-select', '@radix-ui/react-tooltip', 'framer-motion', 'recharts'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
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
