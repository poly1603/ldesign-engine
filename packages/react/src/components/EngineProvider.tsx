/**
 * Engine Provider Component
 */

import { createContext, type ReactNode } from 'react'
import type { ReactEngine } from '../types'

/**
 * Engine Context
 */
export const EngineContext = createContext<ReactEngine | null>(null)

/**
 * Engine Provider Props
 */
export interface EngineProviderProps {
  engine: ReactEngine
  children: ReactNode
}

/**
 * Engine Provider Component
 */
export function EngineProvider({ engine, children }: EngineProviderProps) {
  return <EngineContext.Provider value={engine}>{children}</EngineContext.Provider>
}

