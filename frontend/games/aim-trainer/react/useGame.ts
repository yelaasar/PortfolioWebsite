'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_CONFIG } from '../engine/types'
import type { GameHandle, GameSnapshot } from '../engine/types'

/** What the UI shows before the engine has finished loading. */
const INITIAL_SNAPSHOT: GameSnapshot = {
  phase: 'idle',
  score: 0,
  hits: 0,
  misses: 0,
  accuracy: 1,
  avgReactionMs: 0,
  timeLeftMs: DEFAULT_CONFIG.roundDurationMs,
}

interface UseGame {
  snapshot: GameSnapshot
  ready: boolean
  start: () => void
  stop: () => void
}

/**
 * Owns the engine's lifetime and translates its snapshots into React state.
 *
 * This is the only file that bridges the two worlds, and it is deliberately the
 * whole bridge: no component below it knows the engine exists.
 */
export function useGame(containerRef: React.RefObject<HTMLElement | null>): UseGame {
  const [snapshot, setSnapshot] = useState(INITIAL_SNAPSHOT)
  const [ready, setReady] = useState(false)
  const handleRef = useRef<GameHandle | null>(null)

  useEffect(() => {
    let cancelled = false
    let unsubscribe: (() => void) | undefined

    // Importing here rather than at module scope is what keeps `three` out of
    // the server bundle and off every other route — it replaces the
    // `dynamic(..., { ssr: false })` wrapper component the old version needed.
    import('../index').then(({ createGame }) => {
      const container = containerRef.current
      // StrictMode runs effects twice in dev, so this promise can settle after
      // the cleanup has already run. Creating a game now would leak a renderer
      // nothing holds a reference to.
      if (cancelled || !container) return

      const game = createGame(container)
      handleRef.current = game
      unsubscribe = game.subscribe(setSnapshot)
      setReady(true)
    })

    return () => {
      cancelled = true
      unsubscribe?.()
      handleRef.current?.dispose()
      handleRef.current = null
      setReady(false)
    }
  }, [containerRef])

  const start = useCallback(() => handleRef.current?.start(), [])
  const stop = useCallback(() => handleRef.current?.stop(), [])

  return { snapshot, ready, start, stop }
}
