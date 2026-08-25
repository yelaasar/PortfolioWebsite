/**
 * Single source of truth for identity + contact details.
 * Feeds page metadata, the footer, and the contact route's recipient.
 */
export const site = {
  name: 'Youssef El Aasar',

  // TODO(youssef): replace with your freelance positioning line.
  // This is the first thing a prospect reads — it should say what you do
  // for whom, not what you studied.
  title: 'Machine Learning & Web Engineer',
  tagline:
    'I build and ship machine learning and web systems for teams that need them working, not demoed.',

  // TODO(youssef): the address you want shown publicly / used for the mailto
  // fallback when the contact form fails. Not necessarily the inbox that
  // receives leads — that is CONTACT_TO_EMAIL in the environment.
  email: 'youssef@example.com',

  // TODO(youssef): set once the Vercel project is named.
  // metadataBase and sitemap.ts both read this.
  url: 'https://yelaasar.vercel.app',

  socials: {
    github: 'https://github.com/yelaasar',
    linkedin: 'https://www.linkedin.com/in/youssefelaasar',
  },
} as const
