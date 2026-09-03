/**
 * Single source of truth for identity + contact details.
 * Feeds page metadata, the header, the footer, sitemap/robots/manifest, and the
 * contact form's mailto fallback.
 */
export const site = {
  name: 'Youssef El Aasar',

  // Matches the title on the CV. Deliberately not "Software Engineer" alone —
  // "Technical Consultant" is what says client-facing, which is the whole point
  // of the site.
  title: 'Software Engineer & Technical Consultant',

  tagline:
    'London-based software engineer working client-facing — building and deploying production systems across the full stack and cloud platforms.',

  location: 'London, UK',

  // Published on the CV at /CV.pdf, which is linked from the homepage, so this
  // address is already public. Used for the mailto fallback when the contact
  // form's API call fails.
  email: 'yelaasar02@gmail.com',

  // TODO(youssef): set once the Vercel project is named.
  // metadataBase and sitemap.ts both read this.
  url: 'https://yelaasar.vercel.app',

  socials: {
    github: 'https://github.com/yelaasar',
    linkedin: 'https://www.linkedin.com/in/youssefelaasar',
  },
} as const
