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
      // The Projects section became Work in Phase 5. The heading reads
      // "Projects" again, but the routes deliberately did not follow — do
      // not "fix" this redirect to point the other way without also moving
      // the pages, or /projects and /work redirect into each other.
      { source: '/projects', destination: '/#work', permanent: true },
    ]
  },
}

export default nextConfig
