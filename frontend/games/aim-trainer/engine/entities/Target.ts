import { Mesh } from 'three'
import type { BufferGeometry, Material } from 'three'

/**
 * One clickable box. Geometry and both materials are owned by Game and shared
 * across every instance — the r3f version created a fresh pair per mesh, which
 * is affordable at three targets and is not at a few hundred.
 */
export class Target {
  readonly mesh: Mesh
  /** When this target last appeared, for reaction-time scoring. */
  spawnedAt = 0

  constructor(
    geometry: BufferGeometry,
    private readonly idleMaterial: Material,
    private readonly hoverMaterial: Material,
  ) {
    this.mesh = new Mesh(geometry, idleMaterial)
    this.mesh.visible = false
  }

  get visible(): boolean {
    return this.mesh.visible
  }

  placeAt(x: number, y: number, nowMs: number): void {
    this.mesh.position.set(x, y, 0)
    this.mesh.visible = true
    this.mesh.material = this.idleMaterial
    this.spawnedAt = nowMs
  }

  hide(): void {
    this.mesh.visible = false
    this.mesh.material = this.idleMaterial
  }

  setHovered(hovered: boolean): void {
    this.mesh.material = hovered ? this.hoverMaterial : this.idleMaterial
  }

  ageMs(nowMs: number): number {
    return nowMs - this.spawnedAt
  }
}
