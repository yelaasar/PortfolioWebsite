import Image from 'next/image'
import { skillGroups } from '@/content/skills'
import tick from '@/assets/tick.svg'
import styles from './Skills.module.css'

export default function Skills() {
  return (
    <section id="skills" className={styles.container}>
      <h1 className="sectionTitle">Skills</h1>
      {skillGroups.map((group) => (
        <div key={group.label} className={styles.group}>
          {/* Was an anonymous red <hr> between unlabelled blocks — you could
              see the grouping but not what any group meant. */}
          <h2 className={styles.groupLabel}>{group.label}</h2>
          <div className={styles.skillContainer}>
            {group.items.map((name) => (
              <SkillsList key={name} name={name} />
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}

// `icon` was previously passed at every call site and was always `tick`.
function SkillsList({ name }: { name: string }) {
  return (
    <span>
      <Image src={tick} alt="" />
      <p>{name}</p>
    </span>
  )
}
