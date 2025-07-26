import type { EngineConfig, Engine, CreateEngine } from './types'
import { EngineImpl } from './engine'

/**
 * 创建引擎实例的工厂函数
 * @param config 可选的引擎配置
 * @returns 引擎实例
 */
export const createEngine: CreateEngine = (config?: EngineConfig): Engine => {
  return new EngineImpl(config)
}

// 导出所有类型
export type {
  // 核心类型
  Engine,
  EngineConfig,
  EngineState,
  CreateEngine,

  // 插件系统
  Plugin,
  PluginInfo,
  PluginManager,

  // 中间件系统
  LifecycleHook,
  MiddlewareFunction,
  MiddlewareContext,
  MiddlewareManager,

  // 事件系统
  EventHandler,
  UnsubscribeFn,
  EventEmitter,

  // 配置系统
  ConfigWatcher,
  UnwatchFn,
  ConfigManager,

  // 依赖注入
  DIContainer,

  // 性能监控
  PerformanceConfig,
  PerformanceMonitor,

  // 开发配置
  DevConfig,

  // 错误处理
  ErrorHandler
} from './types'

// 导出常量
// export { SYSTEM_EVENTS, DEFAULT_CONFIG } from './types'

// 导出错误类
export {
  EngineError,
  PluginError,
  MiddlewareError,
  ConfigError
} from './types'

// 导出核心实现类（用于扩展）
export { EngineImpl } from './engine'
export { EventEmitterImpl } from './event-emitter'
export { ConfigManagerImpl } from './config-manager'
export { DIContainerImpl } from './di-container'
export { MiddlewareManagerImpl } from './middleware-manager'
export { PluginManagerImpl } from './plugin-manager'

// 导出内置插件
export { performancePlugin } from './plugins/performance'
export { errorHandlerPlugin } from './plugins/error-handler'

// 默认导出工厂函数
export default createEngine

/**
 * 版本信息
 */
export const version = '1.0.0'

/**
 * 引擎信息
 */
export const engineInfo = {
  name: '@ldesign/engine',
  version,
  description: 'A lightweight Vue 3 based application engine',
  author: 'LDesign Team',
  license: 'MIT'
} as const
