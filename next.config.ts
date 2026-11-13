import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  async headers() {
    const appStoreOrigin = process.env.JUBELIO_APP_STORE_ORIGIN ?? "https://app-store.jubelio.com";
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `frame-ancestors 'self' ${appStoreOrigin}`,
          },
        ],
      },
    ];
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
