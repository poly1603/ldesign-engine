/**
 * @ldesign/engine-core
 *
 * 框架无关的核心引擎包
 */

// 导出类型
export * from './types'

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

// 引擎版本
export const ENGINE_VERSION = '0.3.0'

