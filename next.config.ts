import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  async rewrites() {
    return [
      {
        source: '/widget/:path*',
        destination: '/widget/:path*',
      },
    ]
  },
};

export default nextConfig;
