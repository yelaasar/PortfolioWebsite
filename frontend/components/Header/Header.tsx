import styles from './Header.module.css'

// Real anchors rather than the old <span onClick={scrollIntoView}>: smooth
// scrolling now comes from `scroll-behavior` in globals.css, which keeps this
// a server component and makes the links focusable and keyboard-operable.
const links = [
  { href: '#home', label: 'Home' },
  { href: '#projects', label: 'Projects' },
  { href: '#skills', label: 'Skills' },
  { href: '#contact', label: 'Contact' },
]

export default function Header() {
  return (
    <section id="header">
      <nav className={styles.container}>
        {links.map(({ href, label }) => (
          <a key={href} href={href}>
            {label}
          </a>
        ))}
      </nav>
    </section>
  )
}
