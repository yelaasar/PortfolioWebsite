import Link from 'next/link'

export default function NotFound() {
  return (
    <section style={{ padding: '10dvh 1rem' }}>
      <h1 className="sectionTitle">404</h1>
      <p>That page does not exist.</p>
      <p>
        <Link href="/">← Back home</Link>
      </p>
    </section>
  )
}
