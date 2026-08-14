import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  transpilePackages: ["@jeffgo10/panorama-viewer"],
  async redirects() {
    return [
      { source: "/properties", destination: "/tours", permanent: true },
      { source: "/properties/new", destination: "/tours/new", permanent: true },
      { source: "/properties/new/edit", destination: "/tours/new/edit", permanent: true },
      { source: "/properties/:id/edit", destination: "/tours/:id/edit", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "54321",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "54321",
      },
    ],
  },
};

export default nextConfig;

initOpenNextCloudflareForDev();
