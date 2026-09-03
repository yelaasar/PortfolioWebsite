import Image, { type StaticImageData } from 'next/image'
import styles from './Skills.module.css'
import tick from '@/assets/tick.svg'

export default function Skills() {
  return (
    <section id="skills" className={styles.container}>
      <h1 className="sectionTitle">Skills</h1>
      <div className={styles.skillContainer}>
        <SkillsList icon={tick} name="Machine Learning" />
        <SkillsList icon={tick} name="Artificial Intelligence" />
        <SkillsList icon={tick} name="Web Development" />
      </div>
      <hr />
      <div className={styles.skillContainer}>
        <SkillsList icon={tick} name="Python" />
        <SkillsList icon={tick} name="SQL" />
        <SkillsList icon={tick} name="JavaScript" />
        <SkillsList icon={tick} name="HTML" />
        <SkillsList icon={tick} name="CSS" />
        <SkillsList icon={tick} name="Java" />
        <SkillsList icon={tick} name="MatLab" />
      </div>
      <hr />
      <div className={styles.skillContainer}>
        <SkillsList icon={tick} name="PyTorch" />
        <SkillsList icon={tick} name="NumPy" />
        <SkillsList icon={tick} name="Pandas" />
        <SkillsList icon={tick} name="Scikit-Learn" />
        <SkillsList icon={tick} name="MatPlotLib" />
        <SkillsList icon={tick} name="Django" />
        <SkillsList icon={tick} name="React" />
      </div>
    </section>
  )
}

function SkillsList({ icon, name }: { icon: StaticImageData; name: string }) {
  return (
    <span>
      <Image src={icon} alt="" />
      <p>{name}</p>
    </span>
  )
}
