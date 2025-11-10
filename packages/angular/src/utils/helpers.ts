/**
 * Angular 引擎辅助函数
 */

import { inject } from '@angular/core'
import type { CoreEngine } from '@ldesign/engine-core'
import { EngineService } from '../services/engine.service'

/**
 * 使用引擎
 * 
 * 在组件中获取引擎实例的辅助函数
 * 
 * @returns 引擎实例
 * 
 * @example
 * ```typescript
 * import { Component, OnInit } from '@angular/core'
 * import { useEngine } from '@ldesign/engine-angular'
 * 
 * @Component({
 *   selector: 'app-my-component',
 *   standalone: true,
 *   template: '<div>{{ engine.state.get('count') }}</div>',
 * })
 * export class MyComponent implements OnInit {
 *   engine = useEngine()
 * 
 *   ngOnInit() {
 *     this.engine.state.set('count', 0)
 *   }
 * }
 * ```
 */
export function useEngine(): CoreEngine {
  const engineService = inject(EngineService)
  const engine = engineService.getEngine()
  
  if (!engine) {
    throw new Error('Engine not found. Make sure you have called createEngineApp.')
  }
  
  return engine
}




