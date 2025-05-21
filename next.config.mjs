/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  swcMinify: false,
  transpilePackages: ["geist"],
  staticPageGenerationTimeout: 60 * 10,
  distDir: process.env.NEXT_PUBLIC_CHAIN ? `out/${process.env.NEXT_PUBLIC_CHAIN}` : '.next',
  webpack: (config) => {
    config.experiments = {
      layers: true,
    };
    return config;
  },
};

export default nextConfig;
