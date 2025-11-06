/**
 * Lit 引擎辅助函数
 */

import type { CoreEngine } from '@ldesign/engine-core'

/**
 * 使用引擎
 * 
 * 在组件中获取引擎实例的辅助函数
 * 
 * @returns 引擎实例
 * 
 * @example
 * ```typescript
 * import { LitElement, html } from 'lit'
 * import { useEngine } from '@ldesign/engine-lit'
 * 
 * export class MyComponent extends LitElement {
 *   engine = useEngine()
 * 
 *   render() {
 *     return html`
 *       <div>Count: ${this.engine.state.get('count')}</div>
 *     `
 *   }
 * }
 * ```
 */
export function useEngine(): CoreEngine {
  const engine = (window as any).__ldesignEngine as CoreEngine | undefined
  
  if (!engine) {
    throw new Error('Engine not found. Make sure you have called createEngineApp.')
  }
  
  return engine
}




