import type { ExperienceEntry } from './types'
import { caseStudies } from './caseStudies'

/**
 * The CV, newest first. Source: CV.pdf and the Aldemis consultant profile.
 *
 * `caseStudySlug` is what makes this a funnel rather than a list: a row with
 * one set links through to its case study.
 *
 * Client names are omitted throughout — the engagements run through Aldemis and
 * the consultant profile is marked confidential. Sector is named instead, which
 * is what a prospect actually needs to judge relevance.
 */
export const experience: ExperienceEntry[] = [
  {
    role: 'Software Engineer / Technical Consultant',
    org: 'Aldemis',
    start: 'May 2025',
    end: 'Present',
    kind: 'consulting',
    summary:
      'Client-facing delivery across four projects in transport and fintech — building, maintaining and deploying production systems end to end, from backend services through frontend delivery to cloud infrastructure.',
    highlights: [
      'Restored and redeployed a dormant banking application on .NET and AWS, resolving the deployment and infrastructure faults that had left it unrunnable, and returning the platform to a stable state.',
      'Assumed sole responsibility for a live Django, PostgreSQL and AWS accounting platform after the previous engineering team departed — shipping new features on Lambda, EC2 and RDS while maintaining operational continuity until a new team was onboarded.',
      'Building software for a startup client in .NET and Next.js across Azure and GCP, working end to end from backend services through to the deployed environment.',
      'Trusted with production ownership early: both the banking and accounting engagements were inherited systems with no handover from the previous team.',
    ],
    stack: ['.NET', 'Next.js', 'Python', 'Django', 'PostgreSQL', 'AWS', 'Azure', 'GCP'],
    caseStudySlug: 'banking-platform-recovery',
  },

  {
    role: 'Full-stack Software Engineer',
    org: 'Freelance',
    start: 'Nov 2024',
    end: 'May 2025',
    kind: 'consulting',
    summary:
      'Independent full-stack delivery for clients, taking projects from empty repository to deployed product across web and mobile.',
    highlights: [
      'Built and deployed a full-stack application in Next.js with TypeScript and Tailwind CSS, backed by Supabase and managed PostgreSQL on Vercel.',
      'Implemented a RESTful API for edge functions and automated the CI/CD pipeline covering build, test and deployment.',
      'Developed a mobile application in Flutter on an AWS serverless backend built with AWS CDK in Python, integrating third-party APIs.',
      'Ran delivery independently through Jira and Git — scoping, sequencing and shipping without an engineering team around me.',
    ],
    stack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Supabase', 'PostgreSQL', 'Flutter', 'AWS CDK'],
    caseStudySlug: 'freelance-fullstack-delivery',
  },

  {
    role: 'System Development Intern',
    org: 'Etisalat',
    start: 'Jun 2023',
    end: 'Aug 2023',
    kind: 'employment',
    summary:
      'Internal tooling and process automation for a telecommunications operator.',
    highlights: [
      'Developed and maintained internal web applications in C# with ASP.NET MVC.',
      'Automated manual business processes using UiPath, replacing repetitive operational tasks with scripted workflows.',
    ],
    stack: ['C#', 'ASP.NET MVC', 'UiPath'],
  },

  {
    role: 'MEng Computer Science — First-Class Honours',
    org: 'University of Surrey',
    start: 'Sep 2021',
    end: 'Jun 2025',
    kind: 'education',
    summary:
      'Integrated master’s in Computer Science, graduating with first-class honours. Coursework in machine learning, data science, statistics and probability.',
    highlights: [
      'Dissertation: a transformer-based model for generating retro video game music, owning the pipeline end to end from data collection and cleaning through training and hyperparameter tuning.',
      'Master’s project: data-driven analysis of the UK electricity transmission system and the electrification of heating, delivered with a cross-disciplinary engineering team.',
    ],
    stack: ['Python', 'PyTorch', 'Transformers', 'MATLAB'],
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
