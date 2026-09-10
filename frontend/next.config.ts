import type { NextConfig } from "next";

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
        destination: 'http://127.0.0.1:8000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
