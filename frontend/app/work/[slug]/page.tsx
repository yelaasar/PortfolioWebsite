import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { caseStudies, getCaseStudy } from '@/content/caseStudies'
import { isTodo } from '@/content/types'
import styles from './caseStudy.module.css'

// Next 15+ makes route params a Promise. Most examples online are still on the
// Next 14 shape and will not type-check here.
type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return caseStudies.map((study) => ({ slug: study.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const study = getCaseStudy(slug)
  if (!study) return {}
  return {
    title: study.title,
    description: study.description,
    alternates: { canonical: `/work/${study.slug}` },
    openGraph: {
      title: study.title,
      description: study.description,
      url: `/work/${study.slug}`,
    },
  }
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params
  const study = getCaseStudy(slug)
  if (!study) notFound()

  return (
    <article className={styles.container}>
      <h1 className="sectionTitle">
        <Todo>{study.title}</Todo>
      </h1>

      <div className={styles.body}>
        <dl className={styles.meta}>
          {study.client && (
            <div>
              <dt>Client</dt>
              <dd>
                <Todo>{study.client}</Todo>
              </dd>
            </div>
          )}
          <div>
            <dt>Period</dt>
            <dd>
              <Todo>{study.period}</Todo>
            </dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>
              <Todo>{study.role}</Todo>
            </dd>
          </div>
          <div>
            <dt>Stack</dt>
            <dd>
              {study.stack.map((item) => (
                <span key={item} className={styles.stackItem}>
                  <Todo>{item}</Todo>
                </span>
              ))}
            </dd>
          </div>
        </dl>

        <Section title="Problem">
          <p>
            <Todo>{study.problem}</Todo>
          </p>
        </Section>

        <Section title="Approach">
          <ul>
            {study.approach.map((item) => (
              <li key={item}>
                <Todo>{item}</Todo>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Outcome">
          <ul>
            {study.outcome.map((item) => (
              <li key={item}>
                <Todo>{item}</Todo>
              </li>
            ))}
          </ul>
        </Section>

        {study.metrics.length > 0 && (
          <Section title="By the numbers">
            <ul>
              {study.metrics.map((item) => (
                <li key={item}>
                  <Todo>{item}</Todo>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* The music generator's artifacts are committed under public/ and are
            pre-rendered — the live inference endpoint is retired, so there is
            nothing to call. */}
        {study.slug === 'music-generator' && (
          <Section title="Sample output">
            <p>
              The live inference endpoint has been retired — an always-warm GPU is
              not worth it for a portfolio demo. The sample below is unedited
              model output.
            </p>
            <audio controls src="/case-studies/music-generator/song.mp3" className={styles.audio}>
              Your browser does not support the audio element.
            </audio>
            {/* Plain <img>: a static file in public/ with no import to give it
                intrinsic dimensions. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/case-studies/music-generator/song.png"
              alt="Piano-roll visualisation of the generated MIDI"
              className={styles.pianoRoll}
            />
          </Section>
        )}

        {study.links && study.links.length > 0 && (
          <Section title="Links">
            <ul>
              {study.links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    {...(link.href.startsWith('http')
                      ? { target: '_blank', rel: 'noopener noreferrer' }
                      : {})}
                  >
                    <Todo>{link.label}</Todo>
                  </a>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <p className={styles.back}>
          <Link href="/#work">← Back to work</Link>
        </p>
      </div>

      <Image src={study.image} alt="" className={styles.cover} />
    </article>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={styles.section}>
      <h2>{title}</h2>
      {children}
    </section>
  )
}

function Todo({ children }: { children: string }) {
  if (!isTodo(children)) return <>{children}</>
  return <mark className={styles.todo}>{children}</mark>
}
