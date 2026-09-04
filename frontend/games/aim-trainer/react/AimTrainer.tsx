'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import Hud from './Hud'
import { ROUND_LENGTHS_MS } from './roundLengths'
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
  // The duration the CURRENT round actually ran at — separate from `durationMs`
  // above, which is the picker's pending selection for the *next* round. They
  // usually match, but not once the results screen lets you browse a different
  // board before saving: the just-played score must still file under the
  // board it was earned on, not whichever one is on screen when you hit Save.
  const [playedDurationMs, setPlayedDurationMs] = useState(durationMs)

  const handleStart = (ms: number) => {
    setPlayedDurationMs(ms)
    start(ms)
  }

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
            onStart={handleStart}
            playedDurationMs={playedDurationMs}
          />
        </div>
      </div>
    </section>
  )
}
