/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 16 genera AGENTS.md/CLAUDE.md automáticamente en cada `next dev`; no los necesitamos aquí.
  agentRules: false,
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
