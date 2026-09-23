/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['framer-motion'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
    serverActions: {
      allowedOrigins: ['*'],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    const backendPort = process.env.BACKEND_PORT || process.env.PORT || '3001';
    return [
      {
        source: '/v1/:path*',
        destination: `http://127.0.0.1:${backendPort}/v1/:path*`,
      },
      {
        source: '/api/docs/:path*',
        destination: `http://127.0.0.1:${backendPort}/api/docs/:path*`,
      },
    ];
  },
};

export default nextConfig;
