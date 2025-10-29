/**
 * Solid Engine Hook
 * 
 * 提供访问引擎实例的 Hook
 * 
 * @module hooks/useEngine
 */

import { useContext, createContext, type Context } from 'solid-js'
import type { CoreEngine } from '@ldesign/engine-core'

/**
 * 引擎上下文
 */
export const EngineContext: Context<CoreEngine | undefined> = createContext<CoreEngine | undefined>()

/**
 * 获取引擎实例
 * 
 * 与 React/Vue 的 useEngine() 完全一致
 * 
 * @returns 引擎实例
 * 
 * @example
 * ```tsx
 * import { useEngine } from '@ldesign/engine-solid'
 * 
 * function MyComponent() {
 *   const engine = useEngine()
 *   console.log('Engine:', engine)
 * 
 *   return <div>Engine loaded</div>
 * }
 * ```
 */
export function useEngine(): CoreEngine {
  const engine = useContext(EngineContext)

  if (!engine) {
    throw new Error('Engine not found. Make sure to wrap your app with EngineProvider.')
  }

  return engine
}

