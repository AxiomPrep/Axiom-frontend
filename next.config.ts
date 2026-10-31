import type { NextConfig } from "next";

const API_ORIGIN = process.env.API_ORIGIN || process.env.NEXT_PUBLIC_API_ORIGIN || "https://afkjjeskssmtnzvmnkoe.supabase.co/functions/v1";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  transpilePackages: ["pdfjs-dist"],
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
  async redirects() {
    return [
      { source: "/", destination: "/mentors", permanent: false },
      { source: "/mentorship", destination: "/subscription", permanent: false },
    ];
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
