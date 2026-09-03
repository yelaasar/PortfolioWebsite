import type { Metadata } from 'next'
import Link from 'next/link'
import styles from '@/components/MusicGenerator/MusicGenerator.module.css'

export const metadata: Metadata = {
  title: 'Music Generator',
  description:
    'A small Mistral model fine-tuned on MIDI token streams to generate short piano pieces.',
}

// Static in Phase 2. Phase 5 makes this read content/caseStudies.ts and adds
// the full problem/approach/outcome structure.
export default function MusicGeneratorPage() {
  return (
    <section>
      <h1 className="sectionTitle">Music Generator</h1>

      <div className={styles.info}>
        <p>
          A small Mistral model fine-tuned on MIDI token streams, generating
          short piano pieces. Generated tokens are decoded back to MIDI, then
          rendered as a piano roll and synthesised to audio.
        </p>
        <p>
          The live inference endpoint has been retired — an always-warm GPU is
          not worth it for a portfolio demo. The sample below is unedited model
          output.
        </p>

        <audio controls src="/case-studies/music-generator/song.mp3">
          Your browser does not support the audio element.
        </audio>

        {/* Plain <img>, not next/image: this is a static file in public/ with
            no import to give it intrinsic dimensions. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/case-studies/music-generator/song.png"
          alt="Piano-roll visualisation of the generated MIDI"
        />

        <p>
          <Link href="/">← Back</Link>
        </p>
      </div>
    </section>
  )
}
