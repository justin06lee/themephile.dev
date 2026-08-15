import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // GitHub avatars are the only remote images on the site. `unoptimized` is
    // set at each call site too: these are 14–16px, already served from a CDN,
    // and running them through the optimizer would cost more than it saves.
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
};

export default nextConfig;
