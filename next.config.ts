import type { NextConfig } from "next";

const API_ORIGIN = process.env.API_ORIGIN || "https://axiom-backend-dwlc.onrender.com";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["pdfjs-dist"],
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
  async rewrites() {
    return [
      {
        source: "/api/:path((?!teachers(?:/|$)|contents(?:/|$)).*)",
        destination: `${API_ORIGIN}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
