// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Genera HTML estático en /out
  output: 'export',

  // Requerido si usas next/image en export estático
  images: {
    unoptimized: true,
  },

  // ----------------- Opcionales (descomenta si los necesitas) -----------------
  // Si sirves bajo un subpath (por ejemplo, midominio.com/app)
  // basePath: '/app',
  // assetPrefix: '/app/',

  // Útil para S3/CloudFront y algunos hostings estáticos
  // trailingSlash: true,

  // Recomendado en desarrollo
  // reactStrictMode: true,

  // Si necesitas ignorar errores para no frenar el build (no recomendado en prod)
  // eslint: { ignoreDuringBuilds: true },
  // typescript: { ignoreBuildErrors: true },
  // ----------------------------------------------------------------------------
};

export default nextConfig;
