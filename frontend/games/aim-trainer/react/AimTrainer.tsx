'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import Hud, { ROUND_LENGTHS_MS } from './Hud'
import { useGame } from './useGame'
import styles from './aim-trainer.module.css'

/**
 * The host. Its whole job is to own a div, hand it to the engine and paint the
 * HUD on top — every rule of the game lives on the other side of `useGame`.
 */
export default function AimTrainer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { snapshot, ready, start } = useGame(containerRef)
  const [durationMs, setDurationMs] = useState(ROUND_LENGTHS_MS[1])

  return (
    <section className={styles.page}>
      <p className={styles.back}>
        <Link href="/">← Back to site</Link>
      </p>
      <div className={styles.stage}>
        <div ref={containerRef} className={styles.canvas} />
        <div className={styles.overlay}>
          <Hud
            snapshot={snapshot}
            ready={ready}
            selectedDurationMs={durationMs}
            onSelectDuration={setDurationMs}
            onStart={start}
          />
        </div>
      </div>
    </section>
  )
}
