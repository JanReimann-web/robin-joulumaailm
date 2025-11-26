/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com'],
    formats: ['image/avif', 'image/webp'],
  },
  // Jõudluse optimeerimine
  compress: true,
  poweredByHeader: false,
  // Suurte failide toetus (videod)
  experimental: {
    serverActions: {
      bodySizeLimit: '200mb',
    },
  },
  // GitHub Pages jaoks (kui vaja)
  output: process.env.NODE_ENV === 'production' && process.env.GITHUB_PAGES === 'true' ? 'export' : undefined,
  basePath: process.env.GITHUB_PAGES === 'true' ? '/robin-joulumaailm' : '',
  trailingSlash: true,
}

module.exports = nextConfig

