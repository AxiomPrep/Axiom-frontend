import type { NextConfig } from "next";

const API_ORIGIN = process.env.API_ORIGIN || "https://axiom-backend-dwlc.onrender.com";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["xlsx"],
  transpilePackages: ["pdfjs-dist"],
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
  async redirects() {
    return [{ source: "/mentorship", destination: "/subscription", permanent: false }];
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
