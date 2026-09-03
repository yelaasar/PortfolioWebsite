import { ImageResponse } from 'next/og'
import { site } from '@/content/site'

// layout.tsx declares twitter.card = 'summary_large_image' but had no image
// behind it, so links unfurled blank. This file covers every route at once.
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = `${site.name} — ${site.title}`

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          backgroundColor: '#141414',
          fontFamily: 'monospace',
        }}
      >
        <div style={{ fontSize: 82, color: '#a52a2a', textTransform: 'uppercase' }}>
          {site.name}
        </div>
        <div style={{ fontSize: 44, color: '#ffffff', marginTop: 16 }}>{site.title}</div>
        <div style={{ fontSize: 26, color: '#bbbbbb', marginTop: 32, maxWidth: 900 }}>
          {site.tagline}
        </div>
      </div>
    ),
    size,
  )
}
