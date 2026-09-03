import type { MetadataRoute } from 'next'
import { site } from '@/content/site'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} — ${site.title}`,
    short_name: site.name,
    description: site.tagline,
    start_url: '/',
    display: 'standalone',
    background_color: '#141414',
    theme_color: '#141414',
  }
}
