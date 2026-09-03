import Image from 'next/image'
import { site } from '@/content/site'
import styles from './Home.module.css'
import cta from '@/components/ui/CTAButton.module.css'
import gitIcon from '@/assets/github_icon.svg'
import linkedinIcon from '@/assets/linkedin_icon.svg'
import programmingGif from '@/assets/programming_gif.gif'

export default function Home() {
  return (
    <section id="home" className={styles.container}>
      <div>
        {/* unoptimized: the optimizer would serve a single still frame and
            freeze the animation. */}
        <Image
          className={styles.profilePicture}
          src={programmingGif}
          alt=""
          unoptimized
          priority
        />
      </div>
      <div className={styles.info}>
        {/* Split on the first space to keep the original two-line stack
            (given name above family name) now that the name comes from data
            rather than a hardcoded <br />. */}
        <h1 className="sectionTitle">
          {site.name.split(' ')[0]}
          <br />
          {site.name.split(' ').slice(1).join(' ')}
        </h1>
        <h2>{site.title}</h2>
        <span>
          <a
            href={site.socials.linkedin}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image src={linkedinIcon} alt="LinkedIn" />
          </a>
          <a
            href={site.socials.github}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image src={gitIcon} alt="GitHub" />
          </a>
        </span>
        <p className={styles.description}>{site.tagline}</p>
        {/* Was a <button> nested inside an <a>, which is invalid HTML. */}
        <a
          className={`${cta.cta} ${styles.cv}`}
          href="/CV.pdf"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open CV
        </a>
      </div>
    </section>
  )
}
