import type { Scene } from 'three'
import { Target } from '../entities/Target'

/** Half of a target's footprint, plus a little air, in world units. */
const TARGET_RADIUS = 0.75

/**
 * Owns the pool of targets and decides where and when they appear.
 *
 * Positions are derived from bounds the camera hands down rather than the
 * hardcoded ±6 / ±3 the r3f version used: those constants only framed correctly
 * at one aspect ratio, and targets fell off-screen at every other window size.
 */
export class SpawnSystem {
  readonly targets: readonly Target[]
  private halfWidth = 1
  private halfHeight = 1

  constructor(
    private readonly scene: Scene,
    targets: Target[],
    private readonly lifetimeMs: number,
  ) {
    this.targets = targets
    for (const target of targets) scene.add(target.mesh)
  }

  setBounds(halfWidth: number, halfHeight: number): void {
    // Inset so a target is never clipped by the edge of the canvas.
    this.halfWidth = Math.max(halfWidth - TARGET_RADIUS, 0)
    this.halfHeight = Math.max(halfHeight - TARGET_RADIUS, 0)
  }

  reset(nowMs: number): void {
    for (const target of this.targets) this.relocate(target, nowMs)
  }

  hideAll(): void {
    for (const target of this.targets) target.hide()
  }

  /** Relocates targets that have outlived `lifetimeMs`. */
  update(nowMs: number): void {
    if (this.lifetimeMs <= 0) return
    for (const target of this.targets) {
      if (target.visible && target.ageMs(nowMs) >= this.lifetimeMs) {
        this.relocate(target, nowMs)
      }
    }
  }

  /**
   * Moves a target somewhere new, preferring a spot that does not overlap the
   * others. Overlap is only a nuisance (two boxes stacked read as one), so a
   * handful of attempts then giving up beats looping until it fits.
   */
  relocate(target: Target, nowMs: number): void {
    let x = 0
    let y = 0
    for (let attempt = 0; attempt < 12; attempt++) {
      x = randomBetween(-this.halfWidth, this.halfWidth)
      y = randomBetween(-this.halfHeight, this.halfHeight)
      if (!this.overlapsOthers(target, x, y)) break
    }
    target.placeAt(x, y, nowMs)
  }

  private overlapsOthers(self: Target, x: number, y: number): boolean {
    const minDistanceSq = (TARGET_RADIUS * 2) ** 2
    return this.targets.some((other) => {
      if (other === self || !other.visible) return false
      const dx = other.mesh.position.x - x
      const dy = other.mesh.position.y - y
      return dx * dx + dy * dy < minDistanceSq
    })
  }

  dispose(): void {
    for (const target of this.targets) this.scene.remove(target.mesh)
  }
}

const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min
