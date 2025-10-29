/**
 * Preact Hooks for Engine Integration
 * 
 * @packageDocumentation
 */

import { useContext, useState, useEffect, useMemo, useCallback } from 'preact/hooks'
import { createContext } from 'preact'
import type { Engine } from '@ldesign/engine-core'

/**
 * Engine Context
 */
export const EngineContext = createContext<Engine | null>(null)

/**
 * 使用引擎实例
 */
export function useEngine(): Engine {
  const engine = useContext(EngineContext)
  if (!engine) {
    throw new Error('Engine context not found. Wrap your app with EngineProvider.')
  }
  return engine
}

/**
 * 使用引擎状态
 */
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
    setState(value)
  }, [engine, path])
  
  return [state, updateState]
}

/**
 * 使用引擎事件
 */
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

/**
 * 使用引擎缓存
 */
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

/**
 * 使用引擎计算属性
 */
export function useEngineComputed<T>(
  getter: () => T,
  deps: string[]
): T {
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

/**
 * 使用引擎动作
 */
export function useEngineAction<T extends (...args: any[]) => any>(
  action: T
): T {
  const engine = useEngine()
  return useCallback(action, [engine]) as T
}

/**
 * 使用引擎插件
 */
export function useEnginePlugin(pluginName: string): any {
  const engine = useEngine()
  return useMemo(() => engine.plugins.get(pluginName), [engine, pluginName])
}

/**
 * 使用引擎批量状态
 */
export function useEngineBatchState<T extends Record<string, any>>(
  paths: Record<keyof T, string>
): T {
  const engine = useEngine()
  const [state, setState] = useState<T>(() => {
    const initial = {} as T
    Object.entries(paths).forEach(([key, path]) => {
      initial[key as keyof T] = engine.state.get(path as string)
    })
    return initial
  })
  
  useEffect(() => {
    const unwatchers = Object.entries(paths).map(([key, path]) =>
      engine.state.watch(path as string, (newValue) => {
        setState(prev => ({ ...prev, [key]: newValue }))
      })
    )
    return () => unwatchers.forEach(unwatch => unwatch())
  }, [engine, JSON.stringify(paths)])
  
  return state
}

