type Listener<T> = (payload: T) => void

/**
 * Minimal typed pub/sub. Systems talk through this rather than holding
 * references to one another, which keeps each one independently testable and
 * leaves Game.ts as the only place that knows the full wiring.
 */
export class Emitter<Events extends Record<string, unknown>> {
  private listeners = new Map<keyof Events, Set<Listener<never>>>()

  on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): () => void {
    let set = this.listeners.get(event)
    if (!set) {
      set = new Set()
      this.listeners.set(event, set)
    }
    set.add(listener as Listener<never>)
    return () => {
      set.delete(listener as Listener<never>)
    }
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    const set = this.listeners.get(event)
    if (!set) return
    // Copy first: a listener that unsubscribes itself would otherwise mutate
    // the set mid-iteration.
    for (const listener of [...set]) (listener as Listener<Events[K]>)(payload)
  }

  clear(): void {
    this.listeners.clear()
  }
}
