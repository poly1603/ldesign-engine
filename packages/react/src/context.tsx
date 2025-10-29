/**
 * React Context for @ldesign/engine
 */

import { createContext, ReactNode } from 'react'
import type { CoreEngine } from '@ldesign/engine-core'

/**
 * 引擎上下文
 */
export const EngineContext = createContext<CoreEngine | null>(null)

/**
 * EngineProvider Props
 */
export interface EngineProviderProps {
  /**
   * 引擎实例
   */
  engine: CoreEngine
  
  /**
   * 子组件
   */
  children: ReactNode
}

/**
 * 引擎上下文提供者
 * 
 * @param props - Provider 属性
 * @returns React 元素
 * 
 * @example
 * ```tsx
 * import { createEngine } from '@ldesign/engine-core'
 * import { EngineProvider } from '@ldesign/engine-react'
 * 
 * const engine = createEngine({
 *   // engine config
 * })
 * 
 * function App() {
 *   return (
 *     <EngineProvider engine={engine}>
 *       <YourApp />
 *     </EngineProvider>
 *   )
 * }
 * ```
 */
export function EngineProvider({ engine, children }: EngineProviderProps) {
  return (
    <EngineContext.Provider value={engine}>
      {children}
    </EngineContext.Provider>
  )
}
