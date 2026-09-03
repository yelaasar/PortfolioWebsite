import type { GamePhase } from '../types'

/**
 * The phase state machine and round clock. Pure — no three, no DOM, no clock of
 * its own. It reports transitions rather than acting on them; Game.ts decides
 * what a transition means for the scene.
 *
 * The clock is driven by the frame delta rather than measured against an
 * absolute deadline, which matters because the loop is rAF-based: a browser
 * stops issuing frames to a hidden tab, so a wall-clock deadline would burn
 * through the round while the player is looking at something else and hand them
 * a finished game on return. Counting down per frame pauses the round instead,
 * and the Loop's delta clamp keeps the first frame back from lurching.
 */
export class RoundSystem {
  private _phase: GamePhase = 'idle'
  private remainingMs: number

  constructor(
    private readonly durationMs: number,
    private readonly onPhaseChange: (phase: GamePhase) => void,
  ) {
    this.remainingMs = durationMs
  }

  get phase(): GamePhase {
    return this._phase
  }

  get timeLeftMs(): number {
    return this._phase === 'idle' ? this.durationMs : this.remainingMs
  }

  start(): void {
    this.remainingMs = this.durationMs
    this.setPhase('running')
  }

  /** Abandon a round in progress; a round that never started stays idle. */
  stop(): void {
    if (this._phase !== 'running') return
    this.remainingMs = 0
    this.setPhase('ended')
  }

  /** Advances the clock and ends the round when it runs out. */
  update(deltaMs: number): void {
    if (this._phase !== 'running') return
    this.remainingMs = Math.max(this.remainingMs - deltaMs, 0)
    if (this.remainingMs === 0) this.setPhase('ended')
  }

  private setPhase(phase: GamePhase): void {
    if (this._phase === phase) return
    this._phase = phase
    this.onPhaseChange(phase)
  }
}
