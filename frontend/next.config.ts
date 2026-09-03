import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Old CRA routes, including the GitHub Pages /PortfolioWebsite prefix.
      { source: '/music-generator', destination: '/work/music-generator', permanent: true },
      { source: '/aim-trainer', destination: '/labs/aim-trainer', permanent: true },
      { source: '/PortfolioWebsite', destination: '/', permanent: true },
      { source: '/PortfolioWebsite/music-generator', destination: '/work/music-generator', permanent: true },
      { source: '/PortfolioWebsite/aim-trainer', destination: '/labs/aim-trainer', permanent: true },
      // The Projects section became Work in Phase 5.
      { source: '/projects', destination: '/#work', permanent: true },
    ]
  },
}

export default nextConfig
