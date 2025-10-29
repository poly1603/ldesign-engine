/**
 * React Hook - useEngine
 */

import { useContext } from 'react'
import { EngineContext } from '../components/EngineProvider'
import type { ReactEngine } from '../types'

/**
 * 使用引擎
 */
export function useEngine(): ReactEngine {
  const engine = useContext(EngineContext)

  if (!engine) {
    throw new Error('Engine not found. Make sure to wrap your app with EngineProvider.')
  }

  return engine
}

