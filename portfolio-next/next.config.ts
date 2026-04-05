import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
  async redirects() {
    return [
      {
        source: "/blog/comment-jai-construit-recoltiq",
        destination: "/blog/recoltiq-pourquoi-jai-code-pour-mon-pere",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
