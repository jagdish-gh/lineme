import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "lh3.googleusercontent.com",
        pathname: "/a/**",
        protocol: "https"
      }
    ]
  },
  outputFileTracingRoot: process.cwd()
};

export default withNextIntl(nextConfig);
