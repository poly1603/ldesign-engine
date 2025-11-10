/**
 * Preact 辅助函数
 */

import type { CoreEngine } from '@ldesign/engine-core'

/**
 * 获取引擎实例
 * 
 * 在 Preact 组件中使用此 hook 来访问引擎
 * 
 * @returns 引擎实例
 * @throws 如果引擎未找到则抛出错误
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const engine = useEngine()
 *   
 *   useEffect(() => {
 *     const count = engine.state.get('count')
 *     console.log('Count:', count)
 *   }, [])
 *   
 *   return <div>My Component</div>
 * }
 * ```
 */
export function useEngine(): CoreEngine {
  const engine = (window as any).__ldesignEngine as CoreEngine
  if (!engine) {
    throw new Error('LDesign Engine not found. Make sure you have called createEngineApp.')
  }
  return engine
}



