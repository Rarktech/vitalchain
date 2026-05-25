/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@mysten/dapp-kit', '@mysten/sui', '@mysten/zklogin'],
  turbopack: {},
};

export default nextConfig;
