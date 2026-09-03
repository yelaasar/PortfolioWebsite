import type { CaseStudy } from './types'
import { TODO } from './types'
import musicGeneratorImage from '@/assets/music_generator_icon.jpeg'

/**
 * Case studies. `featured` entries render on the homepage; every entry gets a
 * page at /work/<slug>.
 *
 * TODO(youssef): all four cards currently share one cover image. Distinct
 * covers are the single cheapest visual upgrade here — see docs/BLOCKERS.md #4.
 */
export const caseStudies: CaseStudy[] = [
  {
    slug: 'music-generator',
    title: 'Music Generator',
    description:
      'A small language model fine-tuned on MIDI token streams to generate short piano pieces.',
    image: musicGeneratorImage,
    kind: 'personal',
    period: '2024',
    role: 'Sole author — data, training, inference and web delivery',
    stack: ['Python', 'PyTorch', 'Transformers', 'MidiTok', 'Django', 'React'],
    featured: true,
    order: 1,

    problem:
      'Symbolic music generation is usually demonstrated with large models and heavy inference. I wanted to know how small a model could get and still produce piano output that holds together over a couple of minutes.',
    approach: [
      'Encoded a MIDI corpus into token streams with MidiTok using a REMI tokenizer, trained to a 12,500-token vocabulary.',
      'Fine-tuned a causal language model on the token streams for 16 epochs.',
      'Sampled with a temperature of 0.9 and a floor on sequence length, so short degenerate outputs are discarded rather than returned.',
      'Decoded generated tokens back to MIDI, rendered a piano roll with pretty_midi and matplotlib, and synthesised audio for playback in the browser.',
    ],
    outcome: [
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
    slug: 'aim-trainer',
    title: 'Aim Trainer',
    description: 'A browser aim-training game built with react-three-fiber.',
    image: musicGeneratorImage,
    kind: 'personal',
    period: '2024',
    role: 'Sole author',
    stack: ['TypeScript', 'React', 'react-three-fiber', 'three.js'],
    featured: true,
    order: 2,

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
    metrics: [TODO('a number here if you want this to read as a case study rather than a demo')],
    links: [{ label: 'Play it', href: '/labs/aim-trainer' }],
  },

  {
    // TODO(youssef): this is a shape to copy, not a real engagement.
    // Replace it with actual client work — see docs/BLOCKERS.md #4.
    slug: 'client-engagement',
    title: TODO('the engagement name'),
    description: TODO('one line a prospect can scan — the result, not the task'),
    image: musicGeneratorImage,
    kind: 'client',
    client: TODO('client name, or "Confidential client, <sector>"'),
    period: TODO('e.g. Mar 2025 – Aug 2025'),
    role: TODO('what you were responsible for'),
    stack: [TODO('the stack you actually used')],
    featured: false,
    order: 3,

    problem: TODO("what they came to you with, in their words — not what you did"),
    approach: [
      TODO('what you did, concretely'),
      TODO('3–5 bullets is the right length'),
    ],
    outcome: [TODO('what changed for them')],
    metrics: [
      TODO(
        'AN OUTCOME WITH A NUMBER. "cut a 40-minute nightly job to 6" beats "improved performance"',
      ),
    ],
  },
]

/** Homepage order: featured first, then by `order`. */
export const featuredCaseStudies = caseStudies
  .filter((study) => study.featured)
  .sort((a, b) => a.order - b.order)

export const getCaseStudy = (slug: string) => caseStudies.find((study) => study.slug === slug)
