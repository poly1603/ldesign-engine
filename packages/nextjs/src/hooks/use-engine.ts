/**
 * Next.js Hooks for Engine Integration
 */

'use client'

import { useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { createContext } from 'react'
import type { Engine } from '@ldesign/engine-core'

export const EngineContext = createContext<Engine | null>(null)

export function useEngine(): Engine {
  const engine = useContext(EngineContext)
  if (!engine) {
    throw new Error('Engine context not found')
  }
  return engine
}

export function useEngineState<T>(path: string, initialValue?: T): [T, (value: T) => void] {
  const engine = useEngine()
  const [state, setState] = useState<T>(() => {
    const value = engine.state.get<T>(path)
    return value !== undefined ? value : (initialValue as T)
  })
  
  useEffect(() => {
    const unwatch = engine.state.watch<T>(path, (newValue) => {
      setState(newValue)
    })
    return unwatch
  }, [engine, path])
  
  const updateState = useCallback((value: T) => {
    engine.state.set(path, value)
  }, [engine, path])
  
  return [state, updateState]
}

export function useEngineEvent<T = any>(
  eventName: string,
  handler: (data: T) => void | Promise<void>,
  deps: any[] = []
): void {
  const engine = useEngine()
  
  useEffect(() => {
    const unsubscribe = engine.events.on<T>(eventName, handler)
    return unsubscribe
  }, [engine, eventName, ...deps])
}

export function useEngineCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { ttl?: number }
): { data: T | undefined; loading: boolean; error: Error | null; refetch: () => Promise<void> } {
  const engine = useEngine()
  const [data, setData] = useState<T | undefined>(() => engine.cache.get<T>(key))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  const fetch = useCallback(async () => {
    const cached = engine.cache.get<T>(key)
    if (cached !== undefined) {
      setData(cached)
      return
    }
    
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      engine.cache.set(key, result, options?.ttl)
      setData(result)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [engine, key, fetcher, options?.ttl])
  
  useEffect(() => {
    fetch()
  }, [fetch])
  
  return { data, loading, error, refetch: fetch }
}

export function useEngineComputed<T>(getter: () => T, deps: string[]): T {
  const engine = useEngine()
  const [computed, setComputed] = useState<T>(getter)
  
  useEffect(() => {
    const unwatchers = deps.map(dep =>
      engine.state.watch(dep, () => {
        setComputed(getter())
      })
    )
    return () => unwatchers.forEach(unwatch => unwatch())
  }, [engine, ...deps])
  
  return computed
}

export function useEngineAction<T extends (...args: any[]) => any>(action: T): T {
  const engine = useEngine()
  return useCallback(action, [engine]) as T
}

export function useEnginePlugin(pluginName: string): any {
  const engine = useEngine()
  return useMemo(() => engine.plugins.get(pluginName), [engine, pluginName])
}

