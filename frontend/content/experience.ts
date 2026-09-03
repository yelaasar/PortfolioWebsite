import type { ExperienceEntry } from './types'
import { TODO } from './types'
import { caseStudies } from './caseStudies'

/**
 * The CV. Rendered newest-first in the order written here.
 *
 * `caseStudySlug` is what makes this a funnel rather than a list: a row with
 * one set links through to its case study.
 */
export const experience: ExperienceEntry[] = [
  {
    // TODO(youssef): your current role — see docs/BLOCKERS.md #4.
    role: 'Software Engineer',
    org: TODO('employer'),
    start: TODO('e.g. Sep 2025'),
    end: 'Present',
    kind: 'employment',
    summary: TODO('one line: what you build and who for'),
    highlights: [
      TODO('something you shipped, with its effect'),
      TODO('something you own or led'),
    ],
    stack: [TODO('the stack')],
  },

  {
    // TODO(youssef): the consulting work you mentioned. This is the row that
    // matters most — it is the only evidence on the site that you have done
    // client-facing work. Duplicate this block per engagement.
    role: TODO('your role on the engagement'),
    org: TODO('client name, or "Confidential client, <sector>"'),
    start: TODO('e.g. Mar 2025'),
    end: TODO('e.g. Aug 2025'),
    kind: 'consulting',
    summary: TODO('the problem they hired you to solve'),
    highlights: [
      TODO('what you did'),
      TODO('an outcome containing a number'),
    ],
    stack: [TODO('the stack')],
    caseStudySlug: 'client-engagement',
  },

  {
    role: 'MSc Computer Science',
    org: 'University of Surrey',
    start: TODO('start year'),
    end: TODO('end year'),
    kind: 'education',
    summary:
      'Machine learning and artificial intelligence, alongside software engineering fundamentals.',
    highlights: [
      'Built a symbolic music generation model as an independent project.',
    ],
    stack: ['Python', 'PyTorch', 'MATLAB'],
    caseStudySlug: 'music-generator',
  },
]

/**
 * A caseStudySlug with no matching CaseStudy renders a link that 404s — the
 * kind of break nothing surfaces until someone clicks it. Runs at module load,
 * so `next build` fails instead of shipping the dead link.
 */
function assertContentIntegrity() {
  const slugs = new Set(caseStudies.map((study) => study.slug))
  for (const entry of experience) {
    if (entry.caseStudySlug && !slugs.has(entry.caseStudySlug)) {
      throw new Error(
        `experience.ts: "${entry.role} @ ${entry.org}" links to case study ` +
          `"${entry.caseStudySlug}", which does not exist in caseStudies.ts. ` +
          `Known slugs: ${[...slugs].join(', ')}`,
      )
    }
  }
}

assertContentIntegrity()
