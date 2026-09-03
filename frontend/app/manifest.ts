import type { MetadataRoute } from 'next'
import { site } from '@/content/site'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} — ${site.title}`,
    // The old site's manifest short_name. Kept: it is what shows under a
    // home-screen icon, where the full name does not fit.
    short_name: 'YE',
    description: site.tagline,
    start_url: '/',
    display: 'standalone',
    background_color: '#141414',
    theme_color: '#141414',
    icons: [
      { src: '/YE-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/YE-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
