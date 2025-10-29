import { useContext, useState, useEffect, useCallback } from 'react'
import { createContext } from 'react'
import type { Engine } from '@ldesign/engine-core'

export const EngineContext = createContext<Engine | null>(null)

export function useEngine(): Engine {
  const engine = useContext(EngineContext)
  if (!engine) throw new Error('Engine context not found')
  return engine
}

export function useEngineState<T>(path: string, initialValue?: T): [T, (value: T) => void] {
  const engine = useEngine()
  const [state, setState] = useState<T>(() => engine.state.get<T>(path) ?? (initialValue as T))
  
  useEffect(() => {
    const unwatch = engine.state.watch<T>(path, setState)
    return unwatch
  }, [engine, path])
  
  const updateState = useCallback((value: T) => {
    engine.state.set(path, value)
  }, [engine, path])
  
  return [state, updateState]
}

export function useEngineEvent<T = any>(eventName: string, handler: (data: T) => void | Promise<void>): void {
  const engine = useEngine()
  useEffect(() => engine.events.on<T>(eventName, handler), [engine, eventName, handler])
}

