'use client'

import { useEffect, useState } from 'react'
import cta from '@/components/ui/CTAButton.module.css'
import styles from './aim-trainer.module.css'
import { ROUND_LENGTHS_MS } from './roundLengths'

const NAME_STORAGE_KEY = 'aimTrainerName'
const MAX_NAME_LENGTH = 20
const GENERIC_SAVE_ERROR = "Couldn't save — try again."
/**
 * The two ways the API route reports "the leaderboard isn't fully set up" —
 * distinct codes server-side (frontend/app/api/leaderboard/route.ts) so
 * whoever's deploying it can tell which env var is missing from the Vercel
 * logs. Client-side, "retrying" is equally useless for either, so both map to
 * the same message here rather than "try again."
 */
const NOT_CONFIGURED_ERRORS = new Set(['supabase_not_configured', 'ip_hash_secret_not_configured'])
const NOT_CONFIGURED_SAVE_ERROR = "Leaderboard isn't fully set up yet."

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
 * result rather than coming from the displayed board, because the tabs below
 * can switch the display independently of what the round was actually played
 * at.
 */
export interface RoundResult {
  score: number
  hits: number
  misses: number
  avgReactionMs: number
  roundDurationMs: number
}

interface LeaderboardProps {
  /** Board to show initially — after mount the tabs own the choice. */
  durationMs: number
  result?: RoundResult
}

/**
 * Self-contained: fetches its own list, and — only when mounted with a
 * `result` (i.e. on the results screen, not idle) — owns the name-entry form
 * and the submit. Nothing above it needs to know a leaderboard exists.
 */
export default function Leaderboard({ durationMs, result }: LeaderboardProps) {
  const [boardDurationMs, setBoardDurationMs] = useState(durationMs)
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null)
  const [configured, setConfigured] = useState(true)
  const [name, setName] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState(GENERIC_SAVE_ERROR)
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

  // A round just ended: snap the tabs to the board that score belongs to, so
  // the player is looking at the list their save will land on. Keyed on the
  // duration, not `result` itself — the parent builds a fresh result object
  // every render while the results screen is up.
  const resultDurationMs = result?.roundDurationMs
  useEffect(() => {
    if (resultDurationMs !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing to a prop change, not derivable during render
      setBoardDurationMs(resultDurationMs)
    }
  }, [resultDurationMs])

  useEffect(() => {
    let cancelled = false

    // Drop the previous board's rows immediately so switching tabs shows
    // "Loading…" rather than the old list pretending to be the new one.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting stale async state
    setEntries(null)

    fetch(`/api/leaderboard?duration=${boardDurationMs}`)
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
  }, [boardDurationMs, refreshKey])

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
        let code: string | undefined
        try {
          code = (await res.json()).error
        } catch {
          // Body wasn't JSON (or was empty) — fall through to the generic message.
        }
        setErrorMessage(
          code && NOT_CONFIGURED_ERRORS.has(code) ? NOT_CONFIGURED_SAVE_ERROR : GENERIC_SAVE_ERROR,
        )
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
      // A thrown fetch is a network failure, never a *_not_configured response
      // (those resolve normally with a non-ok status) — always the generic
      // message here, overwriting whatever an earlier attempt might have set.
      setErrorMessage(GENERIC_SAVE_ERROR)
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
      {status === 'error' && <p className={styles.saveError}>{errorMessage}</p>}

      <h2 className={styles.leaderboardTitle}>Leaderboard</h2>
      <div className={styles.leaderboardTabs} role="tablist" aria-label="Leaderboard round length">
        {ROUND_LENGTHS_MS.map((ms) => (
          <button
            key={ms}
            type="button"
            role="tab"
            aria-selected={ms === boardDurationMs}
            className={ms === boardDurationMs ? styles.leaderboardTabSelected : undefined}
            onClick={() => setBoardDurationMs(ms)}
          >
            {ms / 1000}s
          </button>
        ))}
      </div>
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
