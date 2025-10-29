/**
 * Svelte 类型定义
 * 
 * @module types
 */

import type { CoreEngine } from '@ldesign/engine-core'
import type { SvelteApp, SvelteComponent } from '../adapter'

/**
 * Svelte 引擎类型
 */
export interface SvelteEngine extends CoreEngine {
  /** 框架类型 */
  readonly framework: 'svelte'
}

/**
 * Svelte 引擎应用类型
 */
export type { SvelteApp, SvelteComponent }

/**
 * Svelte 组件 Props 类型
 */
export interface SvelteEngineProps {
  /** 引擎实例 */
  engine?: CoreEngine
}

