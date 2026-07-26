import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  devIndicators: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "**.cloudflarestorage.com" },
      { protocol: "https", hostname: "**.manuscdn.com" },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/dev-uploads/:path*",
        destination: "http://localhost:3001/static/:path*",
      },
    ];
  },
};

export default nextConfig;
