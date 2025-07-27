import type { App, ComponentPublicInstance } from 'vue'

/**
 * 引擎状态枚举
 */
export enum EngineState {
  CREATED = 'created',
  MOUNTING = 'mounting',
  MOUNTED = 'mounted',
  UNMOUNTING = 'unmounting',
  UNMOUNTED = 'unmounted',
  DESTROYING = 'destroying',
  DESTROYED = 'destroyed',
  ERROR = 'error',
}

/**
 * 生命周期钩子类型
 */
export type LifecycleHook =
  | 'beforeCreate'
  | 'created'
  | 'beforeMount'
  | 'mounted'
  | 'beforeUpdate'
  | 'updated'
  | 'beforeUnmount'
  | 'unmounted'

/**
 * 配置监听器类型
 */
export type ConfigWatcher = (newValue: any, oldValue: any) => void

/**
 * 取消监听函数类型
 */
export type UnwatchFn = () => void

/**
 * 事件处理器类型
 */
export type EventHandler = (...args: any[]) => void

/**
 * 取消订阅函数类型
 */
export type UnsubscribeFn = () => void

/**
 * 中间件上下文
 */
export interface MiddlewareContext {
  engine: Engine
  hook: LifecycleHook
  data?: any
}

/**
 * 中间件函数类型
 */
export type MiddlewareFunction = (
  context: MiddlewareContext,
  next: () => Promise<void>
) => Promise<void>

/**
 * 插件接口
 */
export interface Plugin {
  name: string
  install: (engine: Engine, options?: any) => void | Promise<void>
  uninstall?: (engine: Engine) => void | Promise<void>
  dependencies?: string[]
  priority?: number
}

/**
 * 错误处理器类型
 */
export type ErrorHandler = (error: Error, context?: any) => void

/**
 * 性能监控配置
 */
export interface PerformanceConfig {
  enabled?: boolean
  trackMemory?: boolean
  trackTiming?: boolean
  sampleRate?: number
}

/**
 * 开发模式配置
 */
export interface DevConfig {
  enabled?: boolean
  verbose?: boolean
  showWarnings?: boolean
  enableHotReload?: boolean
}

/**
 * 引擎配置接口
 */
export interface EngineConfig {
  // 基础配置
  name?: string
  version?: string
  debug?: boolean

  // 性能配置
  performance?: PerformanceConfig

  // 开发配置
  dev?: DevConfig

  // 错误处理
  errorHandler?: ErrorHandler

  // 自定义配置
  [key: string]: any
}

/**
 * 插件安装信息
 */
export interface PluginInfo {
  plugin: Plugin
  options?: any
  installed: boolean
  installTime?: number
}

/**
 * 事件发射器接口
 */
export interface EventEmitter {
  emit: (event: string, ...args: any[]) => void
  on: (event: string, handler: EventHandler) => UnsubscribeFn
  off: (event: string, handler?: EventHandler) => void
  once: (event: string, handler: EventHandler) => UnsubscribeFn
  removeAllListeners: (event?: string) => void
}

/**
 * 依赖注入容器接口
 */
export interface DIContainer {
  provide: (key: string | symbol, value: any) => void
  inject: <T>(key: string | symbol) => T | undefined
  has: (key: string | symbol) => boolean
  remove: (key: string | symbol) => boolean
}

/**
 * 中间件管理器接口
 */
export interface MiddlewareManager {
  add: (hook: LifecycleHook, middleware: MiddlewareFunction) => void
  remove: (hook: LifecycleHook, middleware: MiddlewareFunction) => void
  execute: (hook: LifecycleHook, context: MiddlewareContext) => Promise<void>
  clear: (hook?: LifecycleHook) => void
}

/**
 * 配置管理器接口
 */
export interface ConfigManager {
  get: <T>(key: string) => T | undefined
  set: (key: string, value: any) => void
  update: (updates: Partial<EngineConfig>) => void
  watch: (key: string, callback: ConfigWatcher) => UnwatchFn
  unwatch: (key: string, callback?: ConfigWatcher) => void
  validate: (config: Partial<EngineConfig>) => boolean
  merge: (config: Partial<EngineConfig>) => void
}

/**
 * 插件管理器接口
 */
export interface PluginManager {
  use: (plugin: Plugin, options?: any) => Promise<void>
  unuse: (pluginName: string) => Promise<void>
  has: (pluginName: string) => boolean
  get: (pluginName: string) => PluginInfo | undefined
  list: () => PluginInfo[]
  clear: () => Promise<void>
}

/**
 * 性能监控器接口
 */
export interface PerformanceMonitor {
  start: (name: string) => void
  end: (name: string) => number
  mark: (name: string) => void
  measure: (name: string, startMark?: string, endMark?: string) => number
  getMetrics: () => Record<string, any>
  clear: () => void
}

/**
 * 引擎核心接口
 */
export interface Engine {
  // 核心方法
  mount: (selector: string | Element) => Promise<ComponentPublicInstance>
  unmount: () => Promise<void>
  destroy: () => Promise<void>

  // 配置管理
  getConfig: <T>(key: string) => T | undefined
  setConfig: (key: string, value: any) => void
  updateConfig: (updates: Partial<EngineConfig>) => void
  watchConfig: (key: string, callback: ConfigWatcher) => UnwatchFn

  // 插件系统
  use: (plugin: Plugin, options?: any) => Promise<Engine>
  unuse: (pluginName: string) => Promise<Engine>
  hasPlugin: (pluginName: string) => boolean

  // 中间件系统
  addMiddleware: (hook: LifecycleHook, middleware: MiddlewareFunction) => void
  removeMiddleware: (hook: LifecycleHook, middleware: MiddlewareFunction) => void

  // 事件系统
  emit: (event: string, ...args: any[]) => void
  on: (event: string, handler: EventHandler) => UnsubscribeFn
  off: (event: string, handler?: EventHandler) => void
  once: (event: string, handler: EventHandler) => UnsubscribeFn

  // 依赖注入
  provide: (key: string | symbol, value: any) => void
  inject: <T>(key: string | symbol) => T | undefined

  // 状态查询
  readonly state: EngineState
  readonly app: App | null
  readonly config: Readonly<EngineConfig>
  readonly version: string
  readonly name: string
}

/**
 * 工厂函数类型
 */
export type CreateEngine = (config?: EngineConfig) => Engine

/**
 * 系统事件常量
 */
export const SYSTEM_EVENTS = {
  ENGINE_CREATED: 'engine:created',
  ENGINE_MOUNTED: 'engine:mounted',
  ENGINE_UNMOUNTED: 'engine:unmounted',
  ENGINE_DESTROYED: 'engine:destroyed',
  ENGINE_ERROR: 'engine:error',
  PLUGIN_INSTALLED: 'plugin:installed',
  PLUGIN_UNINSTALLED: 'plugin:uninstalled',
  PLUGIN_ERROR: 'plugin:error',
  MIDDLEWARE_ERROR: 'middleware:error',
  CONFIG_CHANGED: 'config:changed',
} as const

/**
 * 默认配置
 */
export const DEFAULT_CONFIG: EngineConfig = {
  name: 'LDesignEngine',
  version: '1.0.0',
  debug: false,
  performance: {
    enabled: false,
    trackMemory: false,
    trackTiming: false,
    sampleRate: 1.0,
  },
  dev: {
    enabled: false,
    verbose: false,
    showWarnings: true,
    enableHotReload: false,
  },
}

/**
 * 错误类型
 */
export class EngineError extends Error {
  constructor(
    message: string,
    public code?: string,
    public context?: any,
  ) {
    super(message)
    this.name = 'EngineError'
  }
}

export class PluginError extends EngineError {
  constructor(
    message: string,
    public pluginName: string,
    context?: any,
  ) {
    super(message, 'PLUGIN_ERROR', context)
    this.name = 'PluginError'
  }
}

export class MiddlewareError extends EngineError {
  constructor(
    message: string,
    public hook: LifecycleHook,
    context?: any,
  ) {
    super(message, 'MIDDLEWARE_ERROR', context)
    this.name = 'MiddlewareError'
  }
}

export class ConfigError extends EngineError {
  constructor(
    message: string,
    public key: string,
    context?: any,
  ) {
    super(message, 'CONFIG_ERROR', context)
    this.name = 'ConfigError'
  }
}
