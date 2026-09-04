/** Points for landing a hit at all, before the speed bonus. */
const BASE_POINTS = 100
/** A hit at or under this reaction time earns the full bonus. */
const FAST_REACTION_MS = 150
/** A hit slower than this earns none of it. */
const SLOW_REACTION_MS = 900
const MAX_SPEED_BONUS = 100

/**
 * Pure bookkeeping — no three, no DOM. Score rewards speed so it says something
 * the raw hit count does not; the old version's "counter" was just `hits`.
 */
export class ScoreSystem {
  private _score = 0
  private _hits = 0
  private _misses = 0
  private reactionTotalMs = 0

  get score(): number {
    return this._score
  }

  get hits(): number {
    return this._hits
  }

  get misses(): number {
    return this._misses
  }

  /** Share of clicks that found a target. 1 before the first click. */
  get accuracy(): number {
    const clicks = this._hits + this._misses
    return clicks === 0 ? 1 : this._hits / clicks
  }

  get avgReactionMs(): number {
    return this._hits === 0 ? 0 : Math.round(this.reactionTotalMs / this._hits)
  }

  recordHit(reactionMs: number): void {
    this._hits += 1
    this.reactionTotalMs += reactionMs
    this._score += BASE_POINTS + speedBonus(reactionMs)
  }

  recordMiss(): void {
    this._misses += 1
  }

  reset(): void {
    this._score = 0
    this._hits = 0
    this._misses = 0
    this.reactionTotalMs = 0
  }
}

/** Linear falloff between the fast and slow thresholds. */
function speedBonus(reactionMs: number): number {
  const span = SLOW_REACTION_MS - FAST_REACTION_MS
  const slowness = (reactionMs - FAST_REACTION_MS) / span
  const clamped = Math.min(Math.max(slowness, 0), 1)
  return Math.round(MAX_SPEED_BONUS * (1 - clamped))
}

/**
 * The most a single hit can ever be worth — a max-speed hit earns the full
 * bonus on top of the base. Exported so anything checking a *reported* score
 * for plausibility (the leaderboard API route, which cannot otherwise see how
 * this class computes points) shares the same constants instead of guessing
 * at them from outside.
 */
export function maxScoreForHits(hits: number): number {
  return hits * (BASE_POINTS + MAX_SPEED_BONUS)
}
