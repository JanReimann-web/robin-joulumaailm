/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com'],
    formats: ['image/avif', 'image/webp'],
  },
  // JÃµudluse optimeerimine
  compress: true,
  poweredByHeader: false,
  // Suurte failide toetus (videod)
  experimental: {
    serverComponentsExternalPackages: ['ffmpeg-static'],
    outputFileTracingIncludes: {
      '/api/lists/media/process-video': [
        './node_modules/ffmpeg-static/**/*',
      ],
    },
    serverActions: {
      bodySizeLimit: '200mb',
    },
  },
  // GitHub Pages jaoks (kui vaja)
  output: process.env.NODE_ENV === 'production' && process.env.GITHUB_PAGES === 'true' ? 'export' : undefined,
  basePath: process.env.GITHUB_PAGES === 'true' ? '/robin-joulumaailm' : '',
  skipTrailingSlashRedirect: true,
  trailingSlash: true,
}

module.exports = nextConfig
