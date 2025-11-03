/**
 * @ldesign/engine-svelte
 * 
 * Svelte adapter for @ldesign/engine-core
 */

// 核心导出
export { SvelteEngineImpl, createEngineApp, ENGINE_CONTEXT_KEY } from './engine-app'

// 适配器导出
export * from './adapter'

// Stores
export {
  setEngine,
  getEngine,
  engineStore,
  createPluginStore,
  createEngineStateStore,
  createEngineConfigStore,
  createEngineEventStore,
  createEngineStatusStore
} from './stores'

// 组件导出
export * from './components'

// 类型导出
export type * from './types'

// Re-export core types
export type {
  CoreEngine,
  Plugin,
  PluginContext,
  EngineConfig,
  Logger,
  EventBus,
  StateManager,
  ConfigManager
} from '@ldesign/engine-core'

// 版本
export const version = '0.2.0'

