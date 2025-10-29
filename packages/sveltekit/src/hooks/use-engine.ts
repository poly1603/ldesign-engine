import { getContext, setContext, onMount, onDestroy } from 'svelte'
import { writable, derived } from 'svelte/store'
import type { Writable, Readable } from 'svelte/store'
import type { Engine } from '@ldesign/engine-core'

const ENGINE_KEY = Symbol('engine')

export function setEngineContext(engine: Engine): void {
  setContext(ENGINE_KEY, engine)
}

export function getEngine(): Engine {
  const engine = getContext<Engine>(ENGINE_KEY)
  if (!engine) throw new Error('Engine context not found')
  return engine
}

export function useEngineState<T>(path: string, initialValue?: T): Writable<T> {
  const engine = getEngine()
  const store = writable<T>(engine.state.get<T>(path) ?? (initialValue as T))
  
  onMount(() => {
    const unwatch = engine.state.watch<T>(path, (value) => store.set(value))
    onDestroy(unwatch)
  })
  
  return store
}

export function useEngineEvent<T = any>(eventName: string, handler: (data: T) => void | Promise<void>): void {
  const engine = getEngine()
  onMount(() => {
    const unsubscribe = engine.events.on<T>(eventName, handler)
    onDestroy(unsubscribe)
  })
}

export function useEngineCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { ttl?: number }
): {
  data: Writable<T | undefined>
  loading: Writable<boolean>
  error: Writable<Error | null>
  refetch: () => Promise<void>
} {
  const engine = getEngine()
  const data = writable<T | undefined>(engine.cache.get<T>(key))
  const loading = writable(false)
  const error = writable<Error | null>(null)

  const fetch = async () => {
    const cached = engine.cache.get<T>(key)
    if (cached !== undefined) {
      data.set(cached)
      return
    }

    loading.set(true)
    error.set(null)
    try {
      const result = await fetcher()
      engine.cache.set(key, result, options?.ttl)
      data.set(result)
    } catch (err) {
      error.set(err as Error)
    } finally {
      loading.set(false)
    }
  }

  onMount(() => {
    fetch()
  })

  return { data, loading, error, refetch: fetch }
}

export function useEngineComputed<T>(getter: () => T, deps: string[]): Readable<T> {
  const engine = getEngine()
  const store = writable<T>(getter())

  onMount(() => {
    const unwatchers = deps.map(dep =>
      engine.state.watch(dep, () => store.set(getter()))
    )
    onDestroy(() => unwatchers.forEach(unwatch => unwatch()))
  })

  return { subscribe: store.subscribe }
}

