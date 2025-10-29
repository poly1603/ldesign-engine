/**
 * Nuxt.js Composables for Engine Integration
 */

import { ref, computed, onMounted, onUnmounted, inject, provide } from 'vue'
import type { Ref, ComputedRef, InjectionKey } from 'vue'
import type { Engine } from '@ldesign/engine-core'

export const EngineKey: InjectionKey<Engine> = Symbol('engine')

export function provideEngine(engine: Engine): void {
  provide(EngineKey, engine)
}

export function useEngine(): Engine {
  const engine = inject(EngineKey)
  if (!engine) {
    throw new Error('Engine not provided')
  }
  return engine
}

export function useEngineState<T>(path: string, initialValue?: T): Ref<T> {
  const engine = useEngine()
  const state = ref<T>(engine.state.get<T>(path) ?? initialValue) as Ref<T>
  
  onMounted(() => {
    const unwatch = engine.state.watch<T>(path, (newValue) => {
      state.value = newValue
    })
    
    onUnmounted(() => {
      unwatch()
    })
  })
  
  return state
}

export function useEngineEvent<T = any>(
  eventName: string,
  handler: (data: T) => void | Promise<void>
): void {
  const engine = useEngine()
  
  onMounted(() => {
    const unsubscribe = engine.events.on<T>(eventName, handler)
    
    onUnmounted(() => {
      unsubscribe()
    })
  })
}

export function useEngineCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { ttl?: number }
): {
  data: Ref<T | undefined>
  loading: Ref<boolean>
  error: Ref<Error | null>
  refetch: () => Promise<void>
} {
  const engine = useEngine()
  const data = ref<T | undefined>(engine.cache.get<T>(key))
  const loading = ref(false)
  const error = ref<Error | null>(null)
  
  const fetch = async () => {
    const cached = engine.cache.get<T>(key)
    if (cached !== undefined) {
      data.value = cached
      return
    }
    
    loading.value = true
    error.value = null
    try {
      const result = await fetcher()
      engine.cache.set(key, result, options?.ttl)
      data.value = result
    } catch (err) {
      error.value = err as Error
    } finally {
      loading.value = false
    }
  }
  
  onMounted(() => {
    fetch()
  })
  
  return { data, loading, error, refetch: fetch }
}

export function useEngineComputed<T>(getter: () => T, deps: string[]): ComputedRef<T> {
  const engine = useEngine()
  const trigger = ref(0)
  
  onMounted(() => {
    const unwatchers = deps.map(dep =>
      engine.state.watch(dep, () => {
        trigger.value++
      })
    )
    
    onUnmounted(() => {
      unwatchers.forEach(unwatch => unwatch())
    })
  })
  
  return computed(() => {
    trigger.value
    return getter()
  })
}

export function useEnginePlugin(pluginName: string): any {
  const engine = useEngine()
  return computed(() => engine.plugins.get(pluginName))
}

