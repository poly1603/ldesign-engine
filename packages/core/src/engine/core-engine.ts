/**
 * 核心引擎实现
 *
 * 提供框架无关的应用引擎核心功能,整合插件、中间件、生命周期、事件和状态管理
 *
 * @module core-engine
 */

import type {
  CoreEngine,
  CoreEngineConfig,
  PluginManager,
  MiddlewareManager,
  LifecycleManager,
  EventManager,
  StateManager,
  Plugin,
} from '../types'
import type { PluginAPIRegistry } from '../plugin/plugin-api-registry'
import type { PerformanceMonitor } from '../performance'
import { createPluginManager } from '../plugin'
import { createMiddlewareManager } from '../middleware'
import { createLifecycleManager } from '../lifecycle'
import { createEventManager } from '../event'
import { createStateManager } from '../state'
import { createPluginAPIRegistry } from '../plugin/plugin-api-registry'
import { createPerformanceMonitor } from '../performance'

/**
 * 核心引擎实现类
 *
 * 这是整个引擎系统的核心,负责:
 * - 管理各个子系统(插件、中间件、生命周期、事件、状态)
 * - 提供统一的初始化和销毁流程
 * - 协调各个子系统之间的交互
 *
 * 架构设计:
 * ```
 * CoreEngine
 * ├── PluginManager        - 插件系统
 * ├── MiddlewareManager    - 中间件系统
 * ├── LifecycleManager     - 生命周期管理
 * ├── EventManager         - 事件系统
 * ├── StateManager         - 状态管理
 * ├── PluginAPIRegistry    - 插件 API 注册表
 * └── PerformanceMonitor   - 性能监控
 * ```
 *
 * @example
 * ```typescript
 * // 创建引擎
 * const engine = new EngineCoreImpl({
 *   name: 'My App',
 *   debug: true
 * })
 *
 * // 初始化
 * await engine.init()
 *
 * // 使用插件
 * await engine.use(myPlugin)
 *
 * // 使用状态
 * engine.state.set('user', { name: 'Alice' })
 *
 * // 监听事件
 * engine.events.on('login', (user) => {
 *   console.log('User logged in:', user)
 * })
 *
 * // 销毁引擎
 * await engine.destroy()
 * ```
 */
export class EngineCoreImpl implements CoreEngine {
  /** 引擎配置 */
  readonly config: CoreEngineConfig

  /** 插件管理器 - 管理所有插件的安装、卸载和依赖 */
  readonly plugins: PluginManager

  /** 中间件管理器 - 管理中间件链的执行 */
  readonly middleware: MiddlewareManager

  /** 生命周期管理器 - 管理应用生命周期钩子 */
  readonly lifecycle: LifecycleManager

  /** 事件管理器 - 提供发布-订阅模式的事件系统 */
  readonly events: EventManager

  /** 状态管理器 - 管理全局状态 */
  readonly state: StateManager

  /** 插件 API 注册表 - 提供类型安全的插件间通信 */
  readonly api: PluginAPIRegistry

  /** 性能监控管理器 - 提供性能监控和统计功能 */
  readonly performance: PerformanceMonitor

  /** 初始化状态标志 */
  private initialized = false

  /**
   * 构造函数
   *
   * 初始化所有子系统管理器
   *
   * @param config - 引擎配置
   */
  constructor(config: CoreEngineConfig = {}) {
    // 合并默认配置
    this.config = {
      name: 'LDesign Engine',
      debug: false,
      ...config,
    }

    // 创建各个管理器
    // 注意: 创建顺序很重要,某些管理器可能依赖其他管理器
    this.middleware = createMiddlewareManager()
    this.lifecycle = createLifecycleManager()
    this.events = createEventManager()
    this.state = createStateManager()
    this.api = createPluginAPIRegistry({ debug: this.config.debug })
    this.performance = createPerformanceMonitor({
      enabled: this.config.debug ?? false,
      debug: this.config.debug,
    })

    // 插件管理器需要引擎上下文,所以最后创建
    this.plugins = createPluginManager({
      engine: this,
      config: this.config,
    })

    if (this.config.debug) {
      console.log('[Engine] Core engine created:', this.config.name)
    }
  }

  /**
   * 初始化引擎
   *
   * 初始化流程:
   * 1. 检查是否已初始化
   * 2. 触发 beforeInit 生命周期钩子
   * 3. 触发 init 生命周期钩子
   * 4. 标记为已初始化
   * 5. 触发 afterInit 生命周期钩子
   *
   * @throws 如果初始化过程中发生错误
   *
   * @example
   * ```typescript
   * const engine = createCoreEngine()
   *
   * // 注册初始化钩子
   * engine.lifecycle.on('beforeInit', () => {
   *   console.log('Preparing to initialize...')
   * })
   *
   * // 初始化引擎
   * await engine.init()
   * ```
   */
  async init(): Promise<void> {
    // 防止重复初始化
    if (this.initialized) {
      if (this.config.debug) {
        console.warn('[Engine] Already initialized, skipping...')
      }
      return
    }

    if (this.config.debug) {
      console.log('[Engine] Initializing...')
    }

    try {
      // 触发初始化前钩子
      await this.lifecycle.trigger('beforeInit')

      // 触发初始化钩子
      await this.lifecycle.trigger('init')

      // 标记为已初始化
      this.initialized = true

      // 触发初始化后钩子
      await this.lifecycle.trigger('afterInit')

      if (this.config.debug) {
        console.log('[Engine] Initialized successfully')
        this.logStats()
      }
    } catch (error) {
      console.error('[Engine] Initialization failed:', error)
      throw error
    }
  }

  /**
   * 销毁引擎
   *
   * 销毁流程:
   * 1. 检查是否已初始化
   * 2. 触发 beforeDestroy 生命周期钩子
   * 3. 清理所有管理器
   * 4. 标记为未初始化
   * 5. 触发 destroyed 生命周期钩子
   *
   * 内存优化: 彻底清理所有资源,防止内存泄漏
   *
   * @example
   * ```typescript
   * // 注册销毁钩子
   * engine.lifecycle.on('beforeDestroy', () => {
   *   console.log('Cleaning up resources...')
   * })
   *
   * // 销毁引擎
   * await engine.destroy()
   * ```
   */
  async destroy(): Promise<void> {
    if (!this.initialized) {
      if (this.config.debug) {
        console.warn('[Engine] Not initialized, nothing to destroy')
      }
      return
    }

    if (this.config.debug) {
      console.log('[Engine] Destroying...')
    }

    try {
      // 触发销毁前钩子
      await this.lifecycle.trigger('beforeDestroy')

      // 清理所有管理器
      // 注意: 清理顺序与创建顺序相反
      this.plugins.clear()
      this.middleware.clear()
      this.events.clear()
      this.state.clear()
      this.api.clear()

      // 最后清理生命周期管理器
      // 注意: 在触发 destroyed 钩子之前不能清理
      const lifecycleManager = this.lifecycle

      // 标记为未初始化
      this.initialized = false

      // 触发销毁后钩子
      await lifecycleManager.trigger('destroyed')

      // 清理生命周期管理器
      lifecycleManager.clear()

      if (this.config.debug) {
        console.log('[Engine] Destroyed successfully')
      }
    } catch (error) {
      console.error('[Engine] Destruction failed:', error)
      throw error
    }
  }

  /**
   * 使用插件
   *
   * 这是 plugins.use() 的快捷方法
   *
   * @param plugin - 插件对象
   * @param options - 插件选项
   *
   * @example
   * ```typescript
   * await engine.use({
   *   name: 'logger',
   *   version: '1.0.0',
   *   install(ctx) {
   *     ctx.engine.events.on('*', (event, data) => {
   *       console.log('Event:', event, data)
   *     })
   *   }
   * })
   * ```
   */
  async use<T = unknown>(plugin: Plugin<T>, options?: T): Promise<void> {
    await this.plugins.use(plugin, options)
  }

  /**
   * 检查引擎是否已初始化
   *
   * @returns 是否已初始化
   *
   * @example
   * ```typescript
   * if (engine.isInitialized()) {
   *   console.log('Engine is ready')
   * }
   * ```
   */
  isInitialized(): boolean {
    return this.initialized
  }

  /**
   * 获取引擎统计信息
   *
   * 返回各个管理器的状态统计
   *
   * @returns 统计信息对象
   *
   * @example
   * ```typescript
   * const stats = engine.getStats()
   * console.log('已安装插件数:', stats.plugins)
   * console.log('注册的中间件数:', stats.middleware)
   * ```
   */
  getStats(): {
    plugins: number
    middleware: number
    events: number
    states: number
    hooks: number
    apis: number
  } {
    return {
      plugins: this.plugins.size(),
      middleware: this.middleware.size(),
      events: this.events.eventNames().length,
      states: this.state.keys().length,
      hooks: this.lifecycle.getHookNames().length,
      apis: this.api.size(),
    }
  }

  /**
   * 健康检查
   *
   * 检查引擎各个子系统的健康状态
   *
   * @returns 健康检查结果
   *
   * @example
   * ```typescript
   * const health = engine.healthCheck()
   * if (health.healthy) {
   *   console.log('引擎运行正常')
   * } else {
   *   console.error('引擎异常:', health.issues)
   * }
   * ```
   */
  healthCheck(): {
    healthy: boolean
    initialized: boolean
    issues: string[]
    stats: ReturnType<typeof this.getStats>
  } {
    const issues: string[] = []

    // 检查初始化状态
    if (!this.initialized) {
      issues.push('引擎未初始化')
    }

    // 检查性能监控
    if (this.performance) {
      const perfStats = this.performance.getStats()
      if (Array.isArray(perfStats)) {
        // 检查是否有性能警告
        const slowOps = perfStats.filter(s => s.avgDuration > 1000)
        if (slowOps.length > 0) {
          issues.push(`检测到 ${slowOps.length} 个慢操作 (平均耗时 >1s)`)
        }
      }
    }

    return {
      healthy: issues.length === 0,
      initialized: this.initialized,
      issues,
      stats: this.getStats(),
    }
  }

  /**
   * 测量异步操作性能
   *
   * 这是 performance.measure() 的快捷方法
   *
   * @param name - 操作名称
   * @param fn - 异步函数
   * @returns 函数执行结果
   *
   * @example
   * ```typescript
   * const result = await engine.measure('fetchData', async () => {
   *   return await fetch('/api/data')
   * })
   * ```
   */
  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    return this.performance.measure(name, fn)
  }

  /**
   * 测量同步操作性能
   *
   * 这是 performance.measureSync() 的快捷方法
   *
   * @param name - 操作名称
   * @param fn - 同步函数
   * @returns 函数执行结果
   *
   * @example
   * ```typescript
   * const result = engine.measureSync('calculate', () => {
   *   return heavyCalculation()
   * })
   * ```
   */
  measureSync<T>(name: string, fn: () => T): T {
    return this.performance.measureSync(name, fn)
  }

  /**
   * 打印引擎统计信息 (内部方法)
   *
   * 用于调试,显示各个管理器的状态
   *
   * @private
   */
  private logStats(): void {
    console.log('[Engine] Stats:', this.getStats())
  }
}

/**
 * 创建核心引擎实例
 *
 * 这是创建引擎的推荐方式
 *
 * @param config - 引擎配置
 * @returns 核心引擎实例
 *
 * @example
 * ```typescript
 * import { createCoreEngine } from '@ldesign/engine-core'
 *
 * // 创建引擎
 * const engine = createCoreEngine({
 *   name: 'My App',
 *   debug: true,
 * })
 *
 * // 初始化引擎
 * await engine.init()
 *
 * // 使用引擎功能
 * engine.state.set('count', 0)
 * engine.events.emit('app:ready')
 *
 * // 销毁引擎
 * await engine.destroy()
 * ```
 */
export function createCoreEngine(config?: CoreEngineConfig): CoreEngine {
  return new EngineCoreImpl(config)
}

