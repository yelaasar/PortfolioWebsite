import type { Metadata, Viewport } from 'next'
import { site } from '@/content/site'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    // Leads with "YE" so the tab reads as it did on the old site, where the
    // title was exactly that. The rest carries the keywords a search result
    // and a shared link need.
    default: `${site.shortName} — ${site.title}`,
    template: `%s | ${site.shortName}`,
  },
  description: site.tagline,
  openGraph: {
    type: 'website',
    siteName: site.name,
    // Full name here, not the YE mark: a social card is seen cold by someone
    // who has no idea what "YE" stands for.
    title: `${site.name} — ${site.title}`,
    description: site.tagline,
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.name} — ${site.title}`,
    description: site.tagline,
  },
  alternates: { canonical: '/' },
}

export const viewport: Viewport = {
  themeColor: '#141414',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
