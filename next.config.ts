import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "bfnnsqxlngsrnyqxbrpb.supabase.co",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/plans",
        destination: "/",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
