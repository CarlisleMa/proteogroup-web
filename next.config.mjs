/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [],
  },
  async rewrites() {
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      'https://proteogroup-api-production.up.railway.app';
    return {
      // afterFiles: checked after Next.js pages/API routes, so /api/auth and
      // /api/chat still resolve to the local Next.js handlers.
      afterFiles: [
        {
          source: '/api/:path*',
          destination: `${backendUrl}/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
