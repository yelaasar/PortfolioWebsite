// Deliberately free of any `three` import. The React layer imports these types
// statically while the engine itself is loaded lazily, so anything reachable
// from here would land in the bundle that was supposed to stay lean.

export type GamePhase = 'idle' | 'running' | 'ended'

export interface GameConfig {
  /** Default round length, used when `start()` is called with no override. */
  roundDurationMs: number
  /** How many targets are alive at once. */
  targetCount: number
  /** Granularity the round clock is reported at — see `snapshot()` in Game.ts. */
  clockResolutionMs: number
}

export const DEFAULT_CONFIG: GameConfig = {
  roundDurationMs: 30_000,
  targetCount: 3,
  clockResolutionMs: 100,
}

/** Everything the UI is allowed to know. Plain data, cheap to compare. */
export interface GameSnapshot {
  phase: GamePhase
  score: number
  hits: number
  misses: number
  /** 0..1 over clicks taken. 1 before the first click. */
  accuracy: number
  avgReactionMs: number
  timeLeftMs: number
}

export interface GameHandle {
  /** idle | ended -> running, from a clean slate. `durationMs` overrides the config default for this round only. */
  start(durationMs?: number): void
  /** Abandon a round in progress. */
  stop(): void
  /** Returns an unsubscribe function. Fires immediately with current state. */
  subscribe(listener: (snapshot: GameSnapshot) => void): () => void
  /** Stops the loop, releases GPU resources, detaches the canvas. */
  dispose(): void
}
