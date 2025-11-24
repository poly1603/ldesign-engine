/**
 * 核心引擎类型定义
 */

import type { PluginManager, Plugin } from './plugin'
import type { MiddlewareManager } from './middleware'
import type { LifecycleManager } from './lifecycle'
import type { EventManager } from './event'
import type { StateManager } from './state'
import type { PluginAPIRegistry } from '../plugin/plugin-api-registry'
import type { PerformanceMonitor } from '../performance'

/**
 * 引擎配置
 */
export interface CoreEngineConfig {
  /** 应用名称 */
  name?: string
  /** 调试模式 */
  debug?: boolean
  /** 自定义配置 */
  [key: string]: any
}

/**
 * 引擎统计信息
 */
export interface EngineStats {
  /** 已安装的插件数量 */
  plugins: number
  /** 注册的中间件数量 */
  middleware: number
  /** 注册的事件数量 */
  events: number
  /** 状态键数量 */
  states: number
  /** 生命周期钩子数量 */
  hooks: number
  /** 注册的 API 数量 */
  apis: number
}

/**
 * 健康检查结果
 */
export interface HealthCheckResult {
  /** 是否健康 */
  healthy: boolean
  /** 是否已初始化 */
  initialized: boolean
  /** 问题列表 */
  issues: string[]
  /** 统计信息 */
  stats: EngineStats
}

/**
 * 核心引擎接口
 */
export interface CoreEngine {
  /** 配置 */
  readonly config: CoreEngineConfig
  /** 插件管理器 */
  readonly plugins: PluginManager
  /** 中间件管理器 */
  readonly middleware: MiddlewareManager
  /** 生命周期管理器 */
  readonly lifecycle: LifecycleManager
  /** 事件管理器 */
  readonly events: EventManager
  /** 状态管理器 */
  readonly state: StateManager
  /** 插件 API 注册表 */
  readonly api: PluginAPIRegistry
  /** 性能监控管理器 */
  readonly performance: PerformanceMonitor

  /** 初始化引擎 */
  init(): Promise<void>
  /** 销毁引擎 */
  destroy(): Promise<void>
  /** 使用插件 */
  use<T = any>(plugin: Plugin<T>, options?: T): Promise<void>
  /** 检查是否已初始化 */
  isInitialized(): boolean
  /** 获取统计信息 */
  getStats(): EngineStats
  /** 健康检查 */
  healthCheck(): HealthCheckResult
  /** 测量异步操作性能 */
  measure<T>(name: string, fn: () => Promise<T>): Promise<T>
  /** 测量同步操作性能 */
  measureSync<T>(name: string, fn: () => T): T
}

