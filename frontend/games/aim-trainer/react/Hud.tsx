'use client'

import cta from '@/components/ui/CTAButton.module.css'
import type { GameSnapshot } from '../engine/types'
import styles from './aim-trainer.module.css'
import Leaderboard from './Leaderboard'
import { ROUND_LENGTHS_MS } from './roundLengths'

/** Below this the clock turns red. */
const URGENT_MS = 5_000

interface HudProps {
  snapshot: GameSnapshot
  ready: boolean
  selectedDurationMs: number
  onSelectDuration: (durationMs: number) => void
  onStart: (durationMs: number) => void
  /** The duration the round that just ended was actually played at. */
  playedDurationMs: number
}

/**
 * Plain DOM over the canvas. The score used to be drawn inside the scene with
 * drei's <Text>, which meant shipping a text-geometry library and a font fetch
 * to render six characters that HTML renders for free.
 */
export default function Hud({
  snapshot,
  ready,
  selectedDurationMs,
  onSelectDuration,
  onStart,
  playedDurationMs,
}: HudProps) {
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
    <div className={styles.screens}>
      <div className={styles.panel}>
        {phase === 'idle' ? (
          <>
            <h1>Aim Trainer</h1>
            <p>
              Click the targets. They only move when you hit them — you get{' '}
              {Math.round(selectedDurationMs / 1000)} seconds, and misses count against
              your accuracy.
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
        <div className={styles.durationPicker}>
          {ROUND_LENGTHS_MS.map((ms) => (
            <button
              key={ms}
              type="button"
              className={ms === selectedDurationMs ? styles.durationOptionSelected : undefined}
              onClick={() => onSelectDuration(ms)}
            >
              {ms / 1000}s
            </button>
          ))}
        </div>
        <button type="button" className={cta.cta} onClick={() => onStart(selectedDurationMs)}>
          {phase === 'idle' ? 'Start' : 'Play again'}
        </button>
      </div>
      <Leaderboard
        durationMs={selectedDurationMs}
        result={
          phase === 'ended'
            ? {
                score: snapshot.score,
                hits: snapshot.hits,
                misses: snapshot.misses,
                avgReactionMs: snapshot.avgReactionMs,
                roundDurationMs: playedDurationMs,
              }
            : undefined
        }
      />
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
