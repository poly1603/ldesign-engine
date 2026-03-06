/**
 * @ldesign/engine-core
 *
 * 框架无关的核心引擎包
 */

// 导出类型
export * from './types'

// 导出常量
export {
  ENGINE_EVENTS,
  I18N_EVENTS,
  ROUTER_EVENTS,
  COLOR_EVENTS,
  SIZE_EVENTS,
  type RouteLocation,
  type ThemeConfig,
} from './constants'

// 导出核心引擎
export * from './engine'

// 导出插件系统
export * from './plugin'

// 导出中间件系统
export * from './middleware'

// 导出生命周期系统
export * from './lifecycle'

// 导出事件系统
export * from './event'

// 导出状态管理系统
export * from './state'

// 导出依赖注入容器
export * from './container'

// 导出配置管理
export * from './config'

// 导出性能监控
export * from './performance'

// 导出开发工具
export * from './devtools'

// 导出 Hooks 系统 (exclude createComputedState — already exported from ./state)
export {
  createStateRef,
  createReadonlyStateRef,
  watchState,
  createAsyncState,
  createDebouncedState,
  createThrottledState,
  onEvent,
  onLifecycle,
  onLifecycleOnce,
  batchUpdates,
  createStateHistory,
} from './hooks/core-hooks'
export * from './hooks/types'

// 导出错误处理系统
export * from './errors'

// 导出工具模块
export { logger, LogLevel } from './utils/logger'
export {
  type Disposable,
  type DisposeCallback,
  CompositeDisposable,
  LeakDetector,
  LazyDisposable,
  RefCountedDisposable,
  ResourceScope,
  createDisposable,
  using,
  usingAll,
  withScope,
} from './utils/disposable'

// 导出内存检测
export * from './memory/memory-leak-detector'

// 导出性能监控系统
export {
  // PerformanceMetric excluded — already exported from ./performance
  PerformanceMonitorSystem,
  type PerformanceAlert,
  type ThresholdConfig,
  type MetricType,
} from './monitor/performance-monitor-system'
export * from './monitor/performance-tracker'

// 引擎版本
export const ENGINE_VERSION = '0.3.0'

