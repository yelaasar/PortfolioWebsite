import { Game } from './engine/Game'
import type { GameConfig, GameHandle } from './engine/types'

/**
 * The seam.
 *
 * This module is the entire public surface of the game: hand it an element and
 * it takes over, hand back the handle and it lets go. Nothing outside
 * `games/aim-trainer/` should reach into `engine/` or `react/` directly — that
 * discipline is what keeps this directory liftable into its own repo, where the
 * host would be an iframe or a standalone page rather than a Next route.
 */
export function createGame(
  container: HTMLElement,
  config?: Partial<GameConfig>,
): GameHandle {
  return new Game(container, config)
}

export { DEFAULT_CONFIG } from './engine/types'
export type { GameConfig, GameHandle, GamePhase, GameSnapshot } from './engine/types'
