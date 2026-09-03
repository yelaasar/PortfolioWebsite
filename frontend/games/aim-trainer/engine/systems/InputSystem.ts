import { Raycaster, Vector2 } from 'three'
import type { Camera, Object3D } from 'three'
import type { Target } from '../entities/Target'

interface InputHandlers {
  onHit(target: Target): void
  onMiss(): void
}

/**
 * Turns pointer events into hits and misses.
 *
 * This replaces r3f's per-mesh `onClick` / `onPointerOver` props. The important
 * gain is not the raycast itself but that a click on empty space is now an
 * event we can count — under r3f only the meshes heard about clicks, so a miss
 * was literally unobservable.
 */
export class InputSystem {
  private readonly raycaster = new Raycaster()
  private readonly pointer = new Vector2()
  private readonly byMesh = new Map<Object3D, Target>()
  private hovered: Target | null = null
  private enabled = false

  constructor(
    private readonly element: HTMLElement,
    private readonly camera: Camera,
    private readonly targets: readonly Target[],
    private readonly handlers: InputHandlers,
  ) {
    for (const target of targets) this.byMesh.set(target.mesh, target)
    element.addEventListener('pointerdown', this.handlePointerDown)
    element.addEventListener('pointermove', this.handlePointerMove)
    element.addEventListener('pointerleave', this.handlePointerLeave)
  }

  /** Clicks only count during a round; hover stays live so the scene feels alive. */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (!enabled) this.setHovered(null)
  }

  dispose(): void {
    this.element.removeEventListener('pointerdown', this.handlePointerDown)
    this.element.removeEventListener('pointermove', this.handlePointerMove)
    this.element.removeEventListener('pointerleave', this.handlePointerLeave)
    this.setHovered(null)
  }

  private handlePointerDown = (event: PointerEvent): void => {
    if (!this.enabled) return
    const target = this.pick(event)
    if (target) this.handlers.onHit(target)
    else this.handlers.onMiss()
  }

  private handlePointerMove = (event: PointerEvent): void => {
    this.setHovered(this.enabled ? this.pick(event) : null)
  }

  private handlePointerLeave = (): void => {
    this.setHovered(null)
  }

  private setHovered(target: Target | null): void {
    if (this.hovered === target) return
    this.hovered?.setHovered(false)
    this.hovered = target
    target?.setHovered(true)
  }

  private pick(event: PointerEvent): Target | null {
    const rect = this.element.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return null

    this.pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    )
    this.raycaster.setFromCamera(this.pointer, this.camera)

    // Three's raycaster does not skip invisible meshes, and a hidden target is
    // not a target — filter before testing rather than after.
    const meshes = this.targets.filter((target) => target.visible).map((target) => target.mesh)
    const hit = this.raycaster.intersectObjects(meshes, false)[0]
    return hit ? (this.byMesh.get(hit.object) ?? null) : null
  }
}
