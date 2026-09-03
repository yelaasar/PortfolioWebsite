import type { CaseStudy } from './types'
import { TODO } from './types'
import musicGeneratorImage from '@/assets/music_generator_icon.jpeg'

/**
 * Case studies. `featured` entries render on the homepage; every entry gets a
 * page at /work/<slug>.
 *
 * Client engagements are anonymised by sector. They run through Aldemis and the
 * consultant profile describing them is marked confidential, so no client is
 * named and no figure appears here that is not already in Youssef's own CV.
 *
 * Where a number would strengthen a case study but exists in neither source
 * document, it is left as a visible TODO rather than estimated. An invented
 * metric on a page whose whole job is credibility is worse than a missing one.
 *
 * TODO(youssef): every card shares one cover image. Distinct covers are the
 * cheapest visual upgrade available here — see docs/BLOCKERS.md #4.
 */
export const caseStudies: CaseStudy[] = [
  {
    slug: 'banking-platform-recovery',
    title: 'Recovering a Dormant Banking Platform',
    description:
      'Took a banking application that no longer ran and returned it to a stable, deployed state.',
    image: musicGeneratorImage,
    kind: 'client',
    client: 'Confidential client, banking',
    period: '2025',
    role: 'Software Engineer / Technical Consultant, via Aldemis',
    stack: ['.NET', 'AWS', 'CI/CD'],
    featured: true,
    order: 1,

    problem:
      'A banking application built on .NET and AWS had gone dormant. It could not be deployed, and the infrastructure and deployment faults blocking it had not been diagnosed. The platform was inherited with no handover from the team that built it.',
    approach: [
      'Worked backwards from a non-running system to identify what had broken between the codebase and its cloud environment.',
      'Resolved the deployment failures and the underlying AWS infrastructure issues holding the platform down.',
      'Redeployed the application and verified it back to a stable, operational state.',
    ],
    outcome: [
      'The platform runs and deploys again, rather than existing only as a repository.',
      'Recovered without the original engineering team, from a cold start on an unfamiliar codebase.',
    ],
    metrics: [
      TODO('how long it had been dormant, and how long recovery took — both are strong numbers'),
    ],
  },

  {
    slug: 'accounting-platform-continuity',
    title: 'Keeping an Accounting Platform Running',
    description:
      'Assumed sole engineering responsibility for a live accounting system after its team departed.',
    image: musicGeneratorImage,
    kind: 'client',
    client: 'Confidential client, fintech',
    period: '2025',
    role: 'Software Engineer / Technical Consultant, via Aldemis',
    stack: ['Python', 'Django', 'PostgreSQL', 'AWS (Lambda, EC2, RDS)'],
    featured: true,
    order: 2,

    problem:
      'The engineering team responsible for a live Django, PostgreSQL and AWS accounting platform left. The system was in production and had to keep serving users while ownership was reconstructed from the outside.',
    approach: [
      'Took over an unfamiliar production codebase with no handover from the departing team.',
      'Maintained operational continuity of the live system throughout the transition.',
      'Continued shipping new features rather than freezing the platform, working across Lambda, EC2 and RDS.',
      'Held the system until a new engineering team was onboarded, then handed over.',
    ],
    outcome: [
      'No interruption to a production accounting platform through a full loss of its engineering team.',
      'Feature delivery continued during the handover period instead of stalling.',
      'The platform was transferred to an incoming team as a going concern.',
    ],
    metrics: [
      TODO('how many months you held it solo, and how many features shipped in that window'),
    ],
  },

  {
    slug: 'freelance-fullstack-delivery',
    title: 'Full-stack Delivery, Web and Mobile',
    description:
      'Independent delivery of a web application and a mobile app, from empty repository to production.',
    image: musicGeneratorImage,
    kind: 'client',
    client: 'Confidential clients, freelance',
    period: 'Nov 2024 – May 2025',
    role: 'Full-stack Software Engineer',
    stack: [
      'Next.js',
      'TypeScript',
      'Tailwind CSS',
      'Supabase',
      'PostgreSQL',
      'Vercel',
      'Flutter',
      'AWS CDK',
    ],
    featured: true,
    order: 3,

    problem:
      'Clients needed working products shipped without an engineering team to build them — covering architecture, implementation, infrastructure and release.',
    approach: [
      'Built and deployed a full-stack application in Next.js with TypeScript and Tailwind CSS, backed by Supabase with managed PostgreSQL, hosted on Vercel.',
      'Implemented a RESTful API for edge functions and automated a CI/CD pipeline covering build, test and deployment.',
      'Developed a mobile application in Flutter against an AWS serverless backend built with AWS CDK in Python, integrating third-party APIs.',
      'Ran delivery end to end through Jira and Git — scoping, sequencing and shipping solo.',
    ],
    outcome: [
      'Two products delivered to production across different platforms and cloud providers.',
      'Infrastructure defined as code and releases automated, so neither depended on me being present.',
    ],
    metrics: [TODO('anything measurable: users, load, delivery time, cost saved')],
  },

  {
    slug: 'music-generator',
    title: 'Music Generator',
    description:
      'A transformer-based model that generates retro video game music, built as an MEng dissertation.',
    image: musicGeneratorImage,
    kind: 'personal',
    period: '2024 – 2025',
    role: 'Sole author — data, training, inference and web delivery',
    stack: ['Python', 'PyTorch', 'Transformers', 'MidiTok', 'Django', 'React'],
    featured: true,
    order: 4,

    problem:
      'Symbolic music generation is usually demonstrated with large models and heavy inference. The dissertation asked how small a model could get and still produce retro video game music that holds together over a couple of minutes.',
    approach: [
      'Owned the pipeline end to end, from data collection and cleaning through to training and hyperparameter tuning.',
      'Encoded a MIDI corpus into token streams with MidiTok using a REMI tokenizer, trained to a 12,500-token vocabulary.',
      'Fine-tuned a causal transformer on the token streams for 16 epochs.',
      'Sampled at a temperature of 0.9 with a floor on sequence length, so degenerate short outputs are discarded rather than returned.',
      'Decoded generated tokens back to MIDI, rendered a piano roll with pretty_midi and matplotlib, and synthesised audio for playback in the browser.',
    ],
    outcome: [
      'Awarded as part of a first-class MEng.',
      'End-to-end pipeline from prompt to playable audio and a piano-roll visualisation.',
      'The generation code survives as a standalone CLI in ml/music-generator/ — it never depended on the web framework that used to wrap it.',
    ],
    metrics: [
      '12,500-token REMI vocabulary',
      '16 epochs of fine-tuning',
      '~200 tokens per generated piece, roughly 60 seconds of audio',
    ],
    links: [
      {
        label: 'Generation code',
        href: 'https://github.com/yelaasar/PortfolioWebsite/tree/main/ml/music-generator',
      },
    ],
  },

  {
    slug: 'electricity-analysis',
    title: 'UK Electricity Transmission Analysis',
    description:
      'Data-driven analysis of the UK transmission system and the electrification of heating.',
    image: musicGeneratorImage,
    kind: 'personal',
    period: '2024 – 2025',
    role: 'Engineer on a cross-disciplinary team',
    stack: ['Python', 'Pandas', 'NumPy', 'Matplotlib'],
    featured: false,
    order: 5,

    problem:
      'Electrifying domestic heating shifts load onto a transmission system that was not planned around it. The project examined what that shift does to the UK network.',
    approach: [
      'Analysed UK electricity transmission data against heating-electrification scenarios.',
      'Worked in a cross-disciplinary engineering team, translating between the software and the domain sides of the problem.',
    ],
    outcome: [TODO('what the analysis concluded — the finding is the interesting part')],
    metrics: [TODO('scale of the dataset, or a headline figure from the conclusion')],
    links: [{ label: 'Repository', href: 'https://github.com/yelaasar/Electricity' }],
  },

  {
    slug: 'aim-trainer',
    title: 'Aim Trainer',
    description: 'A browser aim-training game built with react-three-fiber.',
    image: musicGeneratorImage,
    kind: 'personal',
    period: '2024',
    role: 'Sole author',
    stack: ['TypeScript', 'React', 'react-three-fiber', 'three.js'],
    featured: false,
    order: 6,

    problem:
      'An excuse to work with a real-time 3D render loop in React, where the constraint is that state updates must not fight the animation frame.',
    approach: [
      'Rendered targets as three.js meshes inside a react-three-fiber canvas.',
      'Repositioned each target on click and tracked the score in React state.',
      'Anchored the score readout to the camera viewport so it stays on screen at any aspect ratio.',
    ],
    outcome: [
      'Runs entirely client-side with no backend.',
      'Loaded as a dynamic import so three.js stays out of the homepage bundle.',
    ],
    metrics: [],
    links: [{ label: 'Play it', href: '/labs/aim-trainer' }],
  },
]

/** Homepage order: featured first, then by `order`. */
export const featuredCaseStudies = caseStudies
  .filter((study) => study.featured)
  .sort((a, b) => a.order - b.order)

export const getCaseStudy = (slug: string) => caseStudies.find((study) => study.slug === slug)
