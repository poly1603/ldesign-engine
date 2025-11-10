/**
 * Qwik 辅助函数
 */

import type { CoreEngine } from '@ldesign/engine-core'

/**
 * 获取引擎实例
 * 
 * 在 Qwik 组件中使用此函数来访问引擎
 * 
 * @returns 引擎实例
 * @throws 如果引擎未找到则抛出错误
 * 
 * @example
 * ```tsx
 * import { component$ } from '@builder.io/qwik'
 * import { getEngine } from '@ldesign/engine-qwik'
 * 
 * export default component$(() => {
 *   const engine = getEngine()
 *   
 *   return <div>Engine: {engine.config.name}</div>
 * })
 * ```
 */
export function getEngine(): CoreEngine {
  const engine = (window as any).__ldesignEngine as CoreEngine
  if (!engine) {
    throw new Error('LDesign Engine not found. Make sure you have called createEngineApp.')
  }
  return engine
}

