/**
 * @ldesign/engine-react
 *
 * React adapter for @ldesign/engine-core
 */

// 核心导出
export { ReactEngineImpl, createEngineApp } from './engine-app'

// 适配器导出 (新增)
export * from './adapter'

// 类型导出
export type * from './types'

// Context & Provider
export { EngineProvider, EngineContext } from './context'
export type { EngineProviderProps } from './context'

// Hooks
export * from './hooks'
export {
  useEngine,
  usePlugin,
  useEngineEvent,
  useEngineState,
  useEngineConfig,
  useEngineLogger,
  useEngineStatus
} from './hooks/use-engine'

// Components
export * from './components'

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

