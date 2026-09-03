/** requestAnimationFrame driver. Owns no game state — it only supplies time. */
export class Loop {
  private frameId: number | null = null
  private lastFrameMs = 0

  constructor(private readonly onFrame: (deltaMs: number, nowMs: number) => void) {}

  get running(): boolean {
    return this.frameId !== null
  }

  start(): void {
    if (this.running) return
    this.lastFrameMs = performance.now()
    this.tick(this.lastFrameMs)
  }

  stop(): void {
    if (this.frameId !== null) cancelAnimationFrame(this.frameId)
    this.frameId = null
  }

  private tick = (nowMs: number): void => {
    this.frameId = requestAnimationFrame(this.tick)
    // A backgrounded tab pauses rAF, so the first frame back can carry a delta
    // of many seconds. Clamping stops that from teleporting the round clock.
    const deltaMs = Math.min(nowMs - this.lastFrameMs, 100)
    this.lastFrameMs = nowMs
    this.onFrame(deltaMs, nowMs)
  }
}
