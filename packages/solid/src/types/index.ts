/**
 * Solid 类型定义
 * 
 * @module types
 */

import type { CoreEngine } from '@ldesign/engine-core'
import type { SolidApp, SolidComponent } from '../adapter'

/**
 * Solid 引擎类型
 */
export interface SolidEngine extends CoreEngine {
  /** 框架类型 */
  readonly framework: 'solid'
}

/**
 * Solid 引擎应用类型
 */
export type { SolidApp, SolidComponent }

