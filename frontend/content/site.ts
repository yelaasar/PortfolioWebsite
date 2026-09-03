/**
 * Single source of truth for identity + contact details.
 * Feeds page metadata, the footer, and the contact route's recipient.
 */
export const site = {
  name: 'Youssef El Aasar',

  // Rendered as the <h2> under your name and in every page title.
  // Was "Masters Computer Science Student" hardcoded in Home.tsx — no longer
  // true as of 2026.
  //
  // TODO(youssef): optional sharpening. "Software Engineer" is accurate but
  // describes a job, not an offer. A freelance positioning line says what you
  // do for whom — e.g. "Software Engineer — ML systems for small teams".
  title: 'Software Engineer',
  tagline:
    'I build and ship machine learning and web systems for teams that need them working, not demoed.',

  // TODO(youssef): BLOCKER — see docs/BLOCKERS.md #1.
  // This is the address the contact form falls back to when the API fails.
  // While it points at example.com that fallback is itself broken, so a lead
  // hitting an error is lost. Not necessarily the inbox that receives leads —
  // that is CONTACT_TO_EMAIL in the environment, which stays private.
  email: 'youssef@example.com',

  // TODO(youssef): set once the Vercel project is named.
  // metadataBase and sitemap.ts both read this.
  url: 'https://yelaasar.vercel.app',

  socials: {
    github: 'https://github.com/yelaasar',
    linkedin: 'https://www.linkedin.com/in/youssefelaasar',
  },
} as const
