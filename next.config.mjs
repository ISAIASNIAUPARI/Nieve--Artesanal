/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 16 genera AGENTS.md/CLAUDE.md automáticamente en cada `next dev`; no los necesitamos aquí.
  agentRules: false,
  // Estos paquetes cargan un binario/WASM propio en tiempo de ejecución buscándolo
  // relativo a su propia carpeta en node_modules (ej. draco3dgltf busca su .wasm
  // así) — si Next los empaqueta dentro del chunk de la ruta (comportamiento por
  // defecto), esa búsqueda se rompe porque el código ya no vive en esa carpeta.
  // serverExternalPackages los deja como require()/import reales, resueltos por
  // Node normalmente desde node_modules — confirmado necesario en local: sin
  // esto, app/api/admin/optimize-3d/route.ts fallaba con ENOENT buscando
  // draco_decoder_gltf.wasm en una ruta que Next inventó al empaquetar.
  serverExternalPackages: ['@gltf-transform/core', '@gltf-transform/extensions', '@gltf-transform/functions', 'draco3dgltf', 'sharp'],
  images: {
    // Las imágenes del sitio se sirven desde Cloudinary (ver content/*.json).
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/foewxv45/**',
      },
    ],
  },
}

export default nextConfig
