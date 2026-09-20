import type { NextConfig } from "next";

const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:8000';

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'abroad-glancing-specked.ngrok-free.dev',
    '*.ngrok-free.dev',
    '*.ngrok-free.app',
    '*.ngrok.app',
    'localhost:3007',
    'localhost:3008',
  ],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl.replace(/\/+$/, '')}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

