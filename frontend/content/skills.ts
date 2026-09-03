import type { SkillGroup } from './types'

/**
 * Was three unlabelled <div>s in Skills.tsx separated by anonymous red <hr>s,
 * so a reader could see the grouping but not what any group meant. The labels
 * are the point of moving this into data.
 */
export const skillGroups: SkillGroup[] = [
  {
    label: 'Domains',
    items: ['Machine Learning', 'Artificial Intelligence', 'Web Development'],
  },
  {
    label: 'Languages',
    // TypeScript added — this site is written in it.
    items: ['Python', 'TypeScript', 'JavaScript', 'SQL', 'Java', 'HTML', 'CSS', 'MATLAB'],
  },
  {
    label: 'Tools & Frameworks',
    // Next.js added for the same reason. Django kept: retiring the backend in
    // this repo does not unlearn it.
    items: [
      'PyTorch',
      'NumPy',
      'Pandas',
      'Scikit-Learn',
      'Matplotlib',
      'React',
      'Next.js',
      'Django',
    ],
  },
]
