'use client'

import cta from '@/components/ui/CTAButton.module.css'
import { DEFAULT_CONFIG } from '../engine/types'
import type { GameSnapshot } from '../engine/types'
import styles from './aim-trainer.module.css'

const ROUND_SECONDS = Math.round(DEFAULT_CONFIG.roundDurationMs / 1000)
/** Below this the clock turns red. */
const URGENT_MS = 5_000

interface HudProps {
  snapshot: GameSnapshot
  ready: boolean
  onStart: () => void
}

/**
 * Plain DOM over the canvas. The score used to be drawn inside the scene with
 * drei's <Text>, which meant shipping a text-geometry library and a font fetch
 * to render six characters that HTML renders for free.
 */
export default function Hud({ snapshot, ready, onStart }: HudProps) {
  const { phase } = snapshot

  if (!ready) return <p className={styles.loading}>Loading…</p>

  if (phase === 'running') {
    return (
      <div className={styles.statusBar}>
        <Stat label="Score" value={snapshot.score.toString()} />
        <Stat label="Accuracy" value={formatAccuracy(snapshot.accuracy)} />
        <Stat
          label="Time"
          value={formatSeconds(snapshot.timeLeftMs)}
          urgent={snapshot.timeLeftMs <= URGENT_MS}
        />
      </div>
    )
  }

  return (
    <div className={styles.panel}>
      {phase === 'idle' ? (
        <>
          <h1>Aim Trainer</h1>
          <p>
            Click the targets. They move when hit and after a moment on their own.
            You get {ROUND_SECONDS} seconds — misses count against your accuracy.
          </p>
        </>
      ) : (
        <>
          <h1>Round over</h1>
          <dl className={styles.results}>
            <dt>Score</dt>
            <dd>{snapshot.score}</dd>
            <dt>Hits</dt>
            <dd>{snapshot.hits}</dd>
            <dt>Misses</dt>
            <dd>{snapshot.misses}</dd>
            <dt>Accuracy</dt>
            <dd>{formatAccuracy(snapshot.accuracy)}</dd>
            <dt>Avg. reaction</dt>
            <dd>{snapshot.avgReactionMs}ms</dd>
          </dl>
        </>
      )}
      <button type="button" className={cta.cta} onClick={onStart}>
        {phase === 'idle' ? 'Start' : 'Play again'}
      </button>
    </div>
  )
}

function Stat({ label, value, urgent }: { label: string; value: string; urgent?: boolean }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <span className={`${styles.statValue} ${urgent ? styles.urgent : ''}`}>{value}</span>
    </div>
  )
}

const formatAccuracy = (accuracy: number) => `${Math.round(accuracy * 100)}%`
const formatSeconds = (ms: number) => `${(ms / 1000).toFixed(1)}s`
