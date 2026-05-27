import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig = {
  outputFileTracingRoot: process.cwd()
};

export default withNextIntl(nextConfig);
