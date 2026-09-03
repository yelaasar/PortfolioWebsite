import Image from 'next/image'
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
        <h1 className="sectionTitle">
          Youssef
          <br />
          El Aasar
        </h1>
        <h2>Masters Computer Science Student</h2>
        <span>
          <a
            href="https://www.linkedin.com/in/youssefelaasar"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image src={linkedinIcon} alt="LinkedIn" />
          </a>
          <a
            href="https://www.github.com/theglassofwater"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image src={gitIcon} alt="GitHub" />
          </a>
        </span>
        <p className={styles.description}>
          Curious programmer with a passion for learning and problem solving.
        </p>
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
