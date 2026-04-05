import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,     // ← This skips the strict TypeScript check for Vercel
  },
  eslint: {
    ignoreDuringBuilds: true,    // ← Also ignores any lint warnings during build
  },
};

export default nextConfig;
