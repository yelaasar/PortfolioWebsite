import type { MetadataRoute } from 'next'
import { caseStudies } from '@/content/caseStudies'
import { isTodo } from '@/content/types'
import { site } from '@/content/site'

export default function sitemap(): MetadataRoute.Sitemap {
  // Placeholder studies still build and still render (so they are easy to find
  // and finish), but must not be advertised to search engines — a TODO page in
  // the index is worse than no page.
  const published = caseStudies.filter((study) => !isTodo(study.title))

  return [
    { url: site.url, changeFrequency: 'monthly', priority: 1 },
    { url: `${site.url}/labs/aim-trainer`, changeFrequency: 'yearly', priority: 0.3 },
    ...published.map((study) => ({
      url: `${site.url}/work/${study.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ]
}
