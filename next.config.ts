import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb',
    },
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-popover', '@radix-ui/react-select', '@radix-ui/react-tooltip', 'framer-motion', 'recharts'],
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  serverExternalPackages: ['@prisma/client', 'prisma'],
  async redirects() {
    return [
      { source: '/research/:path*', destination: '/investigacion/research', permanent: true },
      { source: '/marketing/research-docs', destination: '/investigacion/research', permanent: true },
      { source: '/marketing/avatar', destination: '/investigacion/research', permanent: true },
      { source: '/marketing/video-lab', destination: '/centro-creativo/video-lab', permanent: true },
      { source: '/marketing/copy-hub', destination: '/centro-creativo/copy-hub', permanent: true },
      { source: '/marketing/static-ads', destination: '/centro-creativo/static-ads', permanent: true },
      { source: '/marketing/landing-lab', destination: '/centro-creativo/landing-lab', permanent: true },
      { source: '/marketing/avatars-lab', destination: '/centro-creativo/avatars-lab', permanent: true },
      { source: '/marketing/product-brain', destination: '/centro-creativo/product-brain', permanent: true },
      { source: '/marketing/branding', destination: '/centro-creativo/branding', permanent: true },
      { source: '/marketing/contents', destination: '/centro-creativo/contents', permanent: true },
      { source: '/marketing/creative-library', destination: '/centro-creativo/creative-library', permanent: true },
      { source: '/logistics/:path*', destination: '/operaciones/logistics/:path*', permanent: true },
      { source: '/pedidos/:path*', destination: '/operaciones/pedidos/:path*', permanent: true },
      { source: '/finances/:path*', destination: '/operaciones/finances/:path*', permanent: true },
      { source: '/customers/:path*', destination: '/crm-forense', permanent: true },
      { source: '/settings/:path*', destination: '/sistema/settings', permanent: true },
      { source: '/system/:path*', destination: '/sistema/settings', permanent: true },
      { source: '/connections', destination: '/sistema/settings', permanent: true },
      { source: '/rendimiento', destination: '/mando', permanent: true },
      { source: '/eagle-eye', destination: '/mando', permanent: true },
      { source: '/analytics/:path*', destination: '/crm-forense', permanent: true },
      { source: '/analiticas', destination: '/crm-forense', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Requested-With' },
        ],
      },
    ];
  },
};

// Aumentar límite body para rutas API
const nextConfigWithSize = {
    ...nextConfig,
};

// @ts-ignore
nextConfigWithSize.experimental = {
    ...nextConfig.experimental,
    serverActions: { bodySizeLimit: '500mb' },
};

export default nextConfigWithSize;
