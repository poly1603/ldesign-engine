/**
 * 核心引擎类型定义
 */

import type { PluginManager, Plugin } from './plugin'
import type { MiddlewareManager } from './middleware'
import type { LifecycleManager } from './lifecycle'
import type { EventManager } from './event'
import type { StateManager } from './state'
import type { PluginAPIRegistry } from '../plugin/plugin-api-registry'

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
  /** 初始化引擎 */
  init(): Promise<void>
  /** 销毁引擎 */
  destroy(): Promise<void>
  /** 使用插件 */
  use<T = any>(plugin: Plugin<T>, options?: T): Promise<void>
}

