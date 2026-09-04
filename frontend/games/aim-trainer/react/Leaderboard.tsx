'use client'

import { useEffect, useState } from 'react'
import cta from '@/components/ui/CTAButton.module.css'
import styles from './aim-trainer.module.css'

const NAME_STORAGE_KEY = 'aimTrainerName'
const MAX_NAME_LENGTH = 20

interface LeaderboardEntry {
  name: string
  score: number
  hits: number
  misses: number
  avgReactionMs: number
}

/**
 * What just happened, when this mounts on the results screen. Absent on idle.
 * `roundDurationMs` is the board this score is saved to — it travels with the
 * result rather than coming from `durationMs` below, because `durationMs` is
 * "which board is currently being *displayed*" and can change (the picker is
 * still live on the results screen) independently of what the round was
 * actually played at.
 */
export interface RoundResult {
  score: number
  hits: number
  misses: number
  avgReactionMs: number
  roundDurationMs: number
}

interface LeaderboardProps {
  /** Which board to display. */
  durationMs: number
  result?: RoundResult
}

/**
 * Self-contained: fetches its own list, and — only when mounted with a
 * `result` (i.e. on the results screen, not idle) — owns the name-entry form
 * and the submit. Nothing above it needs to know a leaderboard exists.
 */
export default function Leaderboard({ durationMs, result }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null)
  const [configured, setConfigured] = useState(true)
  const [name, setName] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    // localStorage doesn't exist during SSR, so this can't be a lazy useState
    // initializer without mismatching the server-rendered markup — reading it
    // in an effect, client-only, after mount is the correct place for it.
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- see above
      setName(localStorage.getItem(NAME_STORAGE_KEY) ?? '')
    } catch {
      // Private browsing / storage disabled — the form still works, it just
      // won't remember a name between visits.
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    fetch(`/api/leaderboard?duration=${durationMs}`)
      .then((res) => res.json())
      .then((data: { configured: boolean; entries: LeaderboardEntry[] }) => {
        if (cancelled) return
        setConfigured(data.configured)
        setEntries(data.entries)
      })
      .catch(() => {
        if (!cancelled) setEntries([])
      })

    return () => {
      cancelled = true
    }
  }, [durationMs, refreshKey])

  if (!configured) return null

  async function handleSave() {
    if (!result) return
    const trimmed = name.trim()
    if (trimmed === '') return

    setStatus('saving')
    try {
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmed,
          score: result.score,
          hits: result.hits,
          misses: result.misses,
          avgReactionMs: result.avgReactionMs,
          roundDurationMs: result.roundDurationMs,
        }),
      })
      if (!res.ok) {
        setStatus('error')
        return
      }
      try {
        localStorage.setItem(NAME_STORAGE_KEY, trimmed)
      } catch {
        // Same as above — saving the score itself doesn't depend on this.
      }
      setStatus('saved')
      setRefreshKey((k) => k + 1)
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className={styles.leaderboard}>
      {result && status !== 'saved' && (
        <div className={styles.saveRow}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={MAX_NAME_LENGTH}
            placeholder="Your name"
            aria-label="Your name"
            disabled={status === 'saving'}
          />
          <button
            type="button"
            className={cta.cta}
            onClick={handleSave}
            disabled={status === 'saving' || name.trim() === ''}
          >
            {status === 'saving' ? 'Saving…' : 'Save score'}
          </button>
        </div>
      )}
      {status === 'saved' && <p className={styles.saved}>Saved!</p>}
      {status === 'error' && <p className={styles.saveError}>Couldn&apos;t save — try again.</p>}

      <h2 className={styles.leaderboardTitle}>Leaderboard — {durationMs / 1000}s</h2>
      {entries === null ? (
        <p className={styles.loading}>Loading…</p>
      ) : entries.length === 0 ? (
        <p className={styles.leaderboardEmpty}>No scores yet — be the first.</p>
      ) : (
        <ol className={styles.leaderboardList}>
          {entries.map((entry, index) => (
            <li key={index}>
              <span className={styles.leaderboardRank}>{index + 1}</span>
              <span className={styles.leaderboardName}>{entry.name}</span>
              <span className={styles.leaderboardScore}>{entry.score}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
