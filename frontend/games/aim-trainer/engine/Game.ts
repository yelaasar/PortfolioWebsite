import {
  AmbientLight,
  BoxGeometry,
  MeshStandardMaterial,
  PerspectiveCamera,
  PointLight,
  Scene,
  SpotLight,
  WebGLRenderer,
} from 'three'
import { Loop } from './Loop'
import { Target } from './entities/Target'
import { InputSystem } from './systems/InputSystem'
import { RoundSystem } from './systems/RoundSystem'
import { ScoreSystem } from './systems/ScoreSystem'
import { SpawnSystem } from './systems/SpawnSystem'
import { DEFAULT_CONFIG } from './types'
import type { GameConfig, GameHandle, GamePhase, GameSnapshot } from './types'

/** Matches the r3f default camera the scene was originally framed against. */
const FIELD_OF_VIEW = 75
const CAMERA_DISTANCE = 5

const IDLE_COLOR = 0xa52a2a
const HOVER_COLOR = 0xff6b6b

/**
 * Owns the renderer, the scene and the systems, and is the only thing that
 * knows how they fit together. Nothing in here imports React: the whole point
 * of this class is that a host only needs to hand it a DOM element.
 */
export class Game implements GameHandle {
  private readonly config: GameConfig
  private readonly renderer: WebGLRenderer
  private readonly scene = new Scene()
  private readonly camera: PerspectiveCamera
  private readonly geometry = new BoxGeometry(1, 1, 0.5)
  private readonly idleMaterial = new MeshStandardMaterial({ color: IDLE_COLOR })
  private readonly hoverMaterial = new MeshStandardMaterial({ color: HOVER_COLOR })
  private readonly loop: Loop
  private readonly spawn: SpawnSystem
  private readonly score = new ScoreSystem()
  private readonly round: RoundSystem
  private readonly input: InputSystem
  private readonly resizeObserver: ResizeObserver
  private readonly subscribers = new Set<(snapshot: GameSnapshot) => void>()
  private lastSnapshot: GameSnapshot
  private disposed = false

  constructor(
    private readonly container: HTMLElement,
    config: Partial<GameConfig> = {},
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config }

    this.renderer = new WebGLRenderer({ antialias: true, alpha: true })
    // Uncapped DPR on a 3x display triples the fragment cost for no visible
    // gain on shapes this simple.
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.domElement.style.display = 'block'
    this.renderer.domElement.style.touchAction = 'none'
    container.appendChild(this.renderer.domElement)

    this.camera = new PerspectiveCamera(FIELD_OF_VIEW, 1, 0.1, 1000)
    this.camera.position.z = CAMERA_DISTANCE

    this.addLights()

    const targets = Array.from(
      { length: this.config.targetCount },
      () => new Target(this.geometry, this.idleMaterial, this.hoverMaterial),
    )
    this.spawn = new SpawnSystem(this.scene, targets, this.config.targetLifetimeMs)
    this.round = new RoundSystem(this.config.roundDurationMs, this.handlePhaseChange)
    this.input = new InputSystem(this.renderer.domElement, this.camera, targets, {
      onHit: this.handleHit,
      onMiss: this.handleMiss,
    })

    this.resize()
    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(container)

    this.lastSnapshot = this.snapshot()
    this.loop = new Loop(this.frame)
    this.loop.start()
  }

  start(): void {
    if (this.disposed || this.round.phase === 'running') return
    this.round.start()
  }

  stop(): void {
    if (this.disposed) return
    this.round.stop()
  }

  subscribe(listener: (snapshot: GameSnapshot) => void): () => void {
    this.subscribers.add(listener)
    listener(this.lastSnapshot)
    return () => {
      this.subscribers.delete(listener)
    }
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true

    this.loop.stop()
    this.resizeObserver.disconnect()
    this.input.dispose()
    this.spawn.dispose()
    this.subscribers.clear()

    this.geometry.dispose()
    this.idleMaterial.dispose()
    this.hoverMaterial.dispose()

    // A browser tolerates only a handful of live WebGL contexts, and client-side
    // navigation away from the page would otherwise leak one per visit.
    this.renderer.forceContextLoss()
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }

  private addLights(): void {
    this.scene.add(new AmbientLight(0xffffff, Math.PI / 2))

    const spot = new SpotLight(0xffffff, Math.PI)
    spot.position.set(100, 100, 100)
    spot.angle = 0.15
    spot.penumbra = 1
    spot.decay = 0
    this.scene.add(spot)

    const point = new PointLight(0xffffff, Math.PI)
    point.position.set(-100, -100, -100)
    point.decay = 0
    this.scene.add(point)
  }

  private frame = (deltaMs: number, nowMs: number): void => {
    this.round.update(deltaMs)
    if (this.round.phase === 'running') this.spawn.update(nowMs)
    this.renderer.render(this.scene, this.camera)
    this.publish()
  }

  private handleHit = (target: Target): void => {
    const nowMs = performance.now()
    this.score.recordHit(target.ageMs(nowMs))
    this.spawn.relocate(target, nowMs)
  }

  private handleMiss = (): void => {
    this.score.recordMiss()
  }

  private handlePhaseChange = (phase: GamePhase): void => {
    if (phase === 'running') {
      this.score.reset()
      this.spawn.reset(performance.now())
    } else {
      this.spawn.hideAll()
    }
    this.input.setEnabled(phase === 'running')
  }

  private resize(): void {
    const { clientWidth, clientHeight } = this.container
    if (clientWidth === 0 || clientHeight === 0) return

    this.camera.aspect = clientWidth / clientHeight
    this.camera.updateProjectionMatrix()
    // Let three write the CSS size too. Skipping it (`updateStyle: false`)
    // leaves the canvas laid out at its device-pixel dimensions, so on a 2x
    // display the scene renders at twice the container's size and only the
    // top-left quarter of it is visible.
    this.renderer.setSize(clientWidth, clientHeight)

    // Spawn inside what the camera can actually see at z = 0, so the playfield
    // tracks the window instead of assuming one aspect ratio.
    const halfHeight = Math.tan((FIELD_OF_VIEW * Math.PI) / 360) * CAMERA_DISTANCE
    this.spawn.setBounds(halfHeight * this.camera.aspect, halfHeight)
  }

  private snapshot(): GameSnapshot {
    const { clockResolutionMs } = this.config
    return {
      phase: this.round.phase,
      score: this.score.score,
      hits: this.score.hits,
      misses: this.score.misses,
      accuracy: this.score.accuracy,
      avgReactionMs: this.score.avgReactionMs,
      // Quantising the clock is what throttles subscribers: the snapshot is
      // only unequal ~10x a second, so React re-renders at that rate and not
      // once per frame.
      timeLeftMs: Math.ceil(this.round.timeLeftMs / clockResolutionMs) * clockResolutionMs,
    }
  }

  private publish(): void {
    const next = this.snapshot()
    if (shallowEqual(next, this.lastSnapshot)) return
    this.lastSnapshot = next
    for (const listener of [...this.subscribers]) listener(next)
  }
}

function shallowEqual(a: GameSnapshot, b: GameSnapshot): boolean {
  return (Object.keys(a) as (keyof GameSnapshot)[]).every((key) => a[key] === b[key])
}
