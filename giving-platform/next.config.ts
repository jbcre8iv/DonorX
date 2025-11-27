import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable Turbopack due to PostCSS compatibility issues
  turbopack: {
    // Empty config still enables webpack by default for build
  },
  experimental: {
    // Use webpack for builds until Turbopack PostCSS issues are resolved
  },
};

export default nextConfig;
