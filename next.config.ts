import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const appRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Keep Turbopack inside this app. The parent folder has no node_modules.
  outputFileTracingRoot: appRoot,
  turbopack: {
    root: appRoot,
    resolveAlias: {
      tailwindcss: path.join(appRoot, "node_modules", "tailwindcss"),
    },
  },
  async redirects() {
    return [{ source: "/library", destination: "/search", permanent: true }];
  },
};

export default nextConfig;