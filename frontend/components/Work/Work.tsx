import Image from 'next/image'
import Link from 'next/link'
import { featuredCaseStudies } from '@/content/caseStudies'
import type { CaseStudy } from '@/content/types'
import styles from './Work.module.css'

// Was `Projects`, with four hardcoded cards — two of them carrying lorem
// placeholder text that was live on the site. Now driven by content/caseStudies.ts.
//
// The heading reads "Projects" again — "Work" sat next to the Experience
// section and the two read as the same thing ("work experience"). The label
// only: the #work anchor and the /work/<slug> routes are unchanged, because
// they are indexed and next.config.ts already redirects /projects at them.
export default function Work() {
  return (
    <section id="work" className={styles.container}>
      <h1 className="sectionTitle">Projects</h1>
      <div className={styles.projectsContainer}>
        {featuredCaseStudies.map((study) => (
          <WorkCard key={study.slug} study={study} />
        ))}
      </div>
    </section>
  )
}

function WorkCard({ study }: { study: CaseStudy }) {
  return (
    <div>
      <Link href={`/work/${study.slug}`}>
        <h2>{study.title}</h2>
        <Image src={study.image} alt="" />
      </Link>
      <p>{study.description}</p>
    </div>
  )
}
