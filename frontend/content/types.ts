import type { StaticImageData } from 'next/image'

/**
 * Shapes for the CV and case-study content. Everything the site renders comes
 * from these; no component hardcodes copy.
 *
 * `image` is StaticImageData rather than a string so next/image gets intrinsic
 * dimensions from the import, and so the type checker rejects an entry that
 * forgot one.
 */

export type ExperienceKind = 'consulting' | 'employment' | 'education'

export interface ExperienceEntry {
  role: string
  org: string
  /** Human-readable, e.g. 'Mar 2025'. Not parsed — ordering is by array position. */
  start: string
  /** 'Present' for current roles. */
  end: string
  kind: ExperienceKind
  summary: string
  highlights: string[]
  stack: string[]
  /**
   * The join key that turns a CV row into a funnel: when set, the row links
   * through to /work/<slug>. Must match a CaseStudy.slug or the link 404s —
   * assertContentIntegrity() in experience.ts catches that at build time.
   */
  caseStudySlug?: string
}

export interface CaseStudyLink {
  label: string
  href: string
}

export interface CaseStudy {
  /** URL segment. /work/<slug> */
  slug: string
  title: string
  /** Card blurb. Kept short — the detail lives on the case-study page. */
  description: string
  image: StaticImageData
  kind: 'client' | 'personal'
  /** 'Confidential client, <sector>' is fine when under NDA. */
  client?: string
  period: string
  role: string
  stack: string[]
  /** Featured entries render first on the homepage. */
  featured: boolean
  order: number

  /** What they came to you with, in their terms — not what you did. */
  problem: string
  approach: string[]
  outcome: string[]
  /** Each should contain a number. "Improved things" is a description, not evidence. */
  metrics: string[]
  links?: CaseStudyLink[]
}

export interface SkillGroup {
  label: string
  items: string[]
}

/**
 * Marks copy that still needs writing. Rendered visibly rather than silently
 * omitted, so an unfilled entry is impossible to ship without noticing.
 */
export const TODO = (what: string) => `TODO(youssef): ${what}` as const

export const isTodo = (value: string) => value.startsWith('TODO(youssef):')
