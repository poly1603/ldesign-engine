/**
 * @ldesign/engine-svelte
 * 
 * Svelte adapter for LDesign Engine
 * 
 * @packageDocumentation
 */

// 导出适配�?export { SvelteAdapter, createSvelteAdapter } from './adapters/svelte-adapter'

// 导出应用创建工具
export { createEngineApp, createEngineAppSync } from './core/engine-app'
export type { SvelteEngineAppConfig } from './core/engine-app'

// 导出 Svelte stores 集成
export {
  setEngineContext,
  getEngineContext,
  createEngineState,
  createEngineStateReadonly,
  createComputedState,
  createEventListener,
  createLifecycleHook,
  createPluginStore,
  emitEngineEvent,
  emitEngineEventAsync,
  executeMiddleware,
} from './stores'

// 导出辅助函数
export { getEngine } from './utils/helpers'

// 重新导出核心功能
export * from '@ldesign/engine-core'

