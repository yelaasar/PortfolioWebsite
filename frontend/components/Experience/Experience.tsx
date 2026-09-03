import Link from 'next/link'
import { experience } from '@/content/experience'
import { isTodo, type ExperienceEntry } from '@/content/types'
import styles from './Experience.module.css'

const KIND_LABEL: Record<ExperienceEntry['kind'], string> = {
  consulting: 'Consulting',
  employment: 'Employment',
  education: 'Education',
}

export default function Experience() {
  return (
    <section id="experience" className={styles.container}>
      <h1 className="sectionTitle">Experience</h1>
      <div className={styles.entries}>
        {experience.map((entry) => (
          <Entry key={`${entry.org}-${entry.role}`} entry={entry} />
        ))}
      </div>
    </section>
  )
}

function Entry({ entry }: { entry: ExperienceEntry }) {
  return (
    <article className={styles.entry}>
      <header className={styles.head}>
        <h2 className={styles.role}>
          <Todo>{entry.role}</Todo>
        </h2>
        <p className={styles.org}>
          <Todo>{entry.org}</Todo>
          <span className={styles.kind}>{KIND_LABEL[entry.kind]}</span>
        </p>
        <p className={styles.period}>
          <Todo>{entry.start}</Todo> — <Todo>{entry.end}</Todo>
        </p>
      </header>

      <p className={styles.summary}>
        <Todo>{entry.summary}</Todo>
      </p>

      {entry.highlights.length > 0 && (
        <ul className={styles.highlights}>
          {entry.highlights.map((highlight) => (
            <li key={highlight}>
              <Todo>{highlight}</Todo>
            </li>
          ))}
        </ul>
      )}

      {entry.stack.length > 0 && (
        <p className={styles.stack}>
          {entry.stack.map((item) => (
            <span key={item} className={styles.stackItem}>
              <Todo>{item}</Todo>
            </span>
          ))}
        </p>
      )}

      {/* The join key doing its job: a CV row that clicks through to evidence. */}
      {entry.caseStudySlug && (
        <p className={styles.caseStudyLink}>
          <Link href={`/work/${entry.caseStudySlug}`}>Read the case study →</Link>
        </p>
      )}
    </article>
  )
}

/**
 * Renders placeholder copy in a way that is impossible to miss on the page.
 * A silent empty string would let an unfinished entry ship looking finished.
 */
function Todo({ children }: { children: string }) {
  if (!isTodo(children)) return <>{children}</>
  return <mark className={styles.todo}>{children}</mark>
}
