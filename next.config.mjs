/** @type {import('next').NextConfig} */
const nextConfig = {
  // Quita esto:
  // output: 'export',

  images: {
    unoptimized: true, // opcional, solo si lo necesitas
  },

  reactStrictMode: true,
  // basePath, assetPrefix, etc. si te hacen falta
};

export default nextConfig;