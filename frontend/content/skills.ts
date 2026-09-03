import type { SkillGroup } from './types'

/**
 * Deliberately short. Two rules decide what earns a line:
 *
 * 1. No table stakes. Git, Jira and "agile delivery" are assumed of any
 *    engineer; listing them adds length and subtracts credibility.
 * 2. Nothing implied by something else already here. TypeScript implies
 *    JavaScript, Flutter implies Dart, and Python + PyTorch imply NumPy,
 *    Pandas and Matplotlib.
 *
 * Specific versions and services live in the case studies, where they are
 * attached to something that was actually built — "AWS" here, "Lambda, EC2 and
 * RDS" on the page describing the platform that runs on them.
 */
export const skillGroups: SkillGroup[] = [
  {
    label: 'Languages',
    items: ['C#', 'TypeScript', 'Python', 'SQL'],
  },
  {
    label: 'Frameworks',
    items: ['.NET / ASP.NET MVC', 'Next.js', 'React', 'Django', 'Flutter'],
  },
  {
    label: 'Cloud & Data',
    items: ['AWS', 'Azure', 'GCP', 'PostgreSQL'],
  },
  {
    label: 'Practices',
    items: ['CI/CD', 'Serverless & infrastructure as code', 'AI-assisted development'],
  },
]

/*
 * There was a Machine Learning group here (PyTorch, Transformers). Cut: two
 * items propping up a whole heading, and the music-generator case study makes
 * the point better than a list can — both still appear in its stack, attached
 * to something that was actually built with them.
 */
