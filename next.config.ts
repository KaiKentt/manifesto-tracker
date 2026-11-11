import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      // The tracker is the homepage again; keep old links and bookmarks working.
      { source: "/tracker", destination: "/", permanent: true },
      { source: "/ms/tracker", destination: "/ms", permanent: true },
      // The investor pitch is English only.
      { source: "/ms/pitch", destination: "/pitch", permanent: true },
    ];
  },
};

export default nextConfig;
