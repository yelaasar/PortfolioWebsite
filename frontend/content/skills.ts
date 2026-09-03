import type { SkillGroup } from './types'

/**
 * Grouped as on the consultant profile, which leads with the commercial stack
 * rather than the academic one. The previous list was ML-first (PyTorch, NumPy,
 * Pandas, Scikit-Learn) — accurate for the dissertation, misleading about what
 * the client work actually is.
 */
export const skillGroups: SkillGroup[] = [
  {
    label: 'Languages',
    items: ['C#', 'TypeScript', 'JavaScript', 'Python', 'Dart', 'SQL'],
  },
  {
    label: 'Frameworks',
    items: [
      '.NET / ASP.NET MVC',
      'Next.js',
      'React',
      'Django',
      'Flutter',
      'Tailwind CSS',
    ],
  },
  {
    label: 'Data & Cloud',
    items: [
      'PostgreSQL',
      'Supabase',
      'AWS (Lambda, EC2, RDS, CDK)',
      'Azure',
      'GCP',
      'Vercel',
      'RESTful APIs',
      'Serverless & edge functions',
    ],
  },
  {
    label: 'Tools & Practices',
    items: [
      'Git',
      'CI/CD pipelines',
      'Jira',
      'Agile delivery',
      'AI-assisted development',
      'UiPath',
    ],
  },
  {
    label: 'Machine Learning',
    items: ['PyTorch', 'Transformers', 'NumPy', 'Pandas', 'Scikit-Learn', 'Matplotlib'],
  },
]
