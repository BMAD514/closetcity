/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  // Keep TypeScript errors as failures to catch real issues
  typescript: { ignoreBuildErrors: false },
};

module.exports = nextConfig;

