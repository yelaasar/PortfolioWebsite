import { site } from '@/content/site'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <section id="footer" className={styles.container}>
      <p>
        {/* Was a hardcoded "© 2024", which had been wrong for two years.
            This page is statically prerendered, so the year is baked at build
            time — it stays correct as long as the site is redeployed at least
            once a year, which Vercel does on every push. */}
        &copy; {new Date().getFullYear()} {site.name}. <br />
        All rights reserved.
      </p>
    </section>
  )
}
