// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Genera HTML estático en /out
  output: 'export',

  // Requerido si usas next/image en export estático
  images: {
    unoptimized: true,
  },

  // Opción para añadir / al final de cada ruta
  trailingSlash: true,

  // ----------------- Opcionales (descomenta si los necesitas) -----------------
  // basePath: '/app',
  // assetPrefix: '/app/',
  // reactStrictMode: true,
  // eslint: { ignoreDuringBuilds: true },
  // typescript: { ignoreBuildErrors: true },
};

export default nextConfig;