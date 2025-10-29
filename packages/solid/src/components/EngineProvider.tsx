/**
 * Solid Engine Provider Component
 * 
 * 提供引擎上下文
 * 
 * @module components/EngineProvider
 */

import { type JSX } from 'solid-js'
import type { CoreEngine } from '@ldesign/engine-core'
import { EngineContext } from '../hooks/useEngine'

/**
 * EngineProvider Props
 */
export interface EngineProviderProps {
  /** 引擎实例 */
  engine: CoreEngine
  /** 子组件 */
  children: JSX.Element
}

/**
 * Engine Provider 组件
 * 
 * 提供引擎上下文给子组件
 * 
 * @example
 * ```tsx
 * import { EngineProvider } from '@ldesign/engine-solid'
 * import { createCoreEngine } from '@ldesign/engine-core'
 * 
 * const engine = createCoreEngine({ name: 'my-app' })
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
export function EngineProvider(props: EngineProviderProps): JSX.Element {
  return (
    <EngineContext.Provider value={props.engine}>
      {props.children}
    </EngineContext.Provider>
  )
}

