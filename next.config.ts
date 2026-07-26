import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: ["3001-irlvhn7kl17irgigjyz01-3c2d8d14.us2.manus.computer", "3001-iwbont4wvzt4mrblluhj8-3bbc26d5.us2.manus.computer"],
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
