/**
 * @ldesign/engine-solid
 * 
 * Solid.js adapter for @ldesign/engine-core
 */

// 核心导出
export { SolidEngineImpl, createEngineApp } from './engine-app'

// 适配器导出
export * from './adapter'

// Signals
export {
  setEngine,
  getEngine,
  useEngine,
  usePlugin,
  useEngineState,
  useEngineConfig,
  useEngineEvent,
  useEngineEventSignal,
  useEngineLogger,
  useEngineStatus
} from './signals'

// Hooks 导出
export * from './hooks'

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

