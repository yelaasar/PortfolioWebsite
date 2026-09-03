import Image, { type StaticImageData } from 'next/image'
import styles from './Projects.module.css'
import Project1Image from '@/assets/music_generator_icon.jpeg'

// Content stays hardcoded here on purpose — it becomes data-driven from
// content/caseStudies.ts in Phase 5, along with the rename to Work and the
// rewrite of the placeholder descriptions below.
export default function Projects() {
  return (
    <section id="projects" className={styles.container}>
      <h1 className="sectionTitle">Projects</h1>
      <div className={styles.projectsContainer}>
        <Project
          title="Music Generator"
          link="/work/music-generator"
          image={Project1Image}
          description="Click to generate some music!"
          openInSamePage
        />
        <Project
          title="Aim Trainer"
          link="/labs/aim-trainer"
          image={Project1Image}
          description="Click to play the game!"
          openInSamePage
        />
        <Project
          title="Portfolio Website"
          link="https://www.github.com/yelaasar/PortfolioWebsite"
          image={Project1Image}
          description="Description of Project 2 dsffnjdsnfdsnfjods fjdsnfjosdnf jisd fjosndfosd fjsof dsfnodsf"
        />
        <Project
          title="Electricity"
          link="https://github.com/yelaasar/Electricity"
          image={Project1Image}
          description="Description of Project 2 dsffnjdsnfdsnfjods fjdsnfjosdnf jisd fjosndfosd fjsof dsfnodsf"
        />
      </div>
    </section>
  )
}

function Project({
  title,
  link,
  image,
  description,
  openInSamePage = false,
}: {
  title: string
  link: string
  image: StaticImageData
  description: string
  openInSamePage?: boolean
}) {
  const external = openInSamePage
    ? {}
    : { target: '_blank', rel: 'noopener noreferrer' }

  return (
    <div>
      <a href={link} {...external}>
        <h2>{title}</h2>
        <Image src={image} alt="" />
      </a>
      <p>{description}</p>
    </div>
  )
}
