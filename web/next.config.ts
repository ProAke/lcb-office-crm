import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // อนุญาตให้ dev server รับ request จาก preview domain ของ sandbox
  allowedDevOrigins: ["*.e2b.app", "localhost", "127.0.0.1"],

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
