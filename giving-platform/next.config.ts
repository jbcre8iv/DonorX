import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Disable Turbopack due to PostCSS compatibility issues
  turbopack: {
    // Empty config still enables webpack by default for build
  },
  experimental: {
    // Use webpack for builds until Turbopack PostCSS issues are resolved
  },
  webpack: (config, { isServer }) => {
    // Fix for @react-pdf/renderer bidi-js ESM issue
    // The library expects a default export but bidi-js only provides named exports
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        // Force bidi-js to use UMD version which has default export
        "bidi-js": path.resolve(process.cwd(), "node_modules/bidi-js/dist/bidi.js"),
      };
    }
    return config;
  },
};

export default nextConfig;
