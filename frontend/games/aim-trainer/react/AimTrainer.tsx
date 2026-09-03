'use client'

import { useRef } from 'react'
import Hud from './Hud'
import { useGame } from './useGame'
import styles from './aim-trainer.module.css'

/**
 * The host. Its whole job is to own a div, hand it to the engine and paint the
 * HUD on top — every rule of the game lives on the other side of `useGame`.
 */
export default function AimTrainer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { snapshot, ready, start } = useGame(containerRef)

  return (
    <section className={styles.page}>
      <div className={styles.stage}>
        <div ref={containerRef} className={styles.canvas} />
        <div className={styles.overlay}>
          <Hud snapshot={snapshot} ready={ready} onStart={start} />
        </div>
      </div>
    </section>
  )
}
