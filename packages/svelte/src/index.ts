/**
 * @ldesign/engine-svelte
 * 
 * Svelte adapter for @ldesign/engine-core
 */

// 核心导出
export { SvelteEngineImpl, createEngineApp, ENGINE_CONTEXT_KEY } from './engine-app'

// 适配器导出
export * from './adapter'

// 状态管理导出
export * from './stores'

// 组件导出
export * from './components'

// 类型导出
export type * from './types'

// 版本
export const version = '0.2.0'

