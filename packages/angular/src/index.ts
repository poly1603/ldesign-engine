/**
 * @ldesign/engine-angular
 *
 * Angular adapter for @ldesign/engine-core
 */

// 引擎应用导出
export * from './engine-app'

// 模块导出
export * from './module'

// 服务导出
export * from './services'
export { EngineService, ENGINE_TOKEN, provideEngine } from './services/engine.service'

// 适配器导出
export * from './adapters'

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


