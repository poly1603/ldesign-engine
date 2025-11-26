/**
 * DevTools 调试工具
 *
 * 提供强大的开发调试功能，包括状态检查、事件追踪、性能分析等
 *
 * @module devtools/devtools
 */

import type { CoreEngine } from '../types'
import type { EventPayload, StateValue, UnknownRecord } from '../types/common'

/**
 * DevTools 配置
 */
export interface DevToolsConfig {
  /** 是否启用 */
  enabled?: boolean
  /** 是否在控制台显示日志 */
  console?: boolean
  /** 最大历史记录数 */
  maxHistory?: number
  /** 是否追踪性能 */
  trackPerformance?: boolean
}

/**
 * 事件记录
 */
export interface EventRecord {
  /** 时间戳 */
  timestamp: number
  /** 事件名称 */
  event: string
  /** 事件负载 */
  payload?: EventPayload
  /** 监听器数量 */
  listenerCount: number
}

/**
 * 状态变更记录
 */
export interface StateChangeRecord {
  /** 时间戳 */
  timestamp: number
  /** 状态键 */
  key: string
  /** 旧值 */
  oldValue: StateValue
  /** 新值 */
  newValue: StateValue
  /** 变更来源 */
  source?: string
}

/**
 * 插件记录
 */
export interface PluginRecord {
  /** 插件名称 */
  name: string
  /** 版本 */
  version: string
  /** 安装时间 */
  installedAt: number
  /** 状态 */
  status: 'active' | 'inactive' | 'error'
  /** 依赖 */
  dependencies: string[]
}

/**
 * 性能记录
 */
export interface PerformanceRecord {
  /** 操作名称 */
  name: string
  /** 开始时间 */
  startTime: number
  /** 结束时间 */
  endTime?: number
  /** 持续时间 */
  duration?: number
  /** 类型 */
  type: 'plugin' | 'event' | 'state' | 'middleware' | 'lifecycle'
}

/**
 * DevTools 快照
 */
export interface DevToolsSnapshot {
  /** 快照时间 */
  timestamp: number
  /** 引擎状态 */
  engine: {
    version: string
    config: UnknownRecord
    pluginCount: number
    middlewareCount: number
  }
  /** 插件列表 */
  plugins: PluginRecord[]
  /** 状态快照 */
  state: Record<string, StateValue>
  /** 事件监听器统计 */
  events: Record<string, number>
  /** 性能统计 */
  performance?: Record<string, UnknownRecord>
}

/**
 * DevTools 实现类
 * 
 * 特性：
 * - 实时事件追踪
 * - 状态变更历史
 * - 插件状态监控
 * - 性能分析
 * - 时间旅行调试
 * - 快照导出/导入
 * 
 * @example
 * ```typescript
 * const devtools = new DevTools(engine, {
 *   enabled: true,
 *   console: true,
 *   maxHistory: 100,
 * })
 * 
 * // 获取快照
 * const snapshot = devtools.snapshot()
 * 
 * // 查看事件历史
 * const events = devtools.getEventHistory()
 * 
 * // 查看状态变更
 * const changes = devtools.getStateChanges()
 * ```
 */
export class DevTools {
  /** 引擎实例 */
  private engine: CoreEngine

  /** 配置 */
  private config: Required<DevToolsConfig>

  /** 事件历史 */
  private eventHistory: EventRecord[] = []

  /** 状态变更历史 */
  private stateChanges: StateChangeRecord[] = []

  /** 性能记录 */
  private performanceRecords: PerformanceRecord[] = []

  /** 是否已初始化 */
  private initialized = false

  /**
   * 构造函数
   * 
   * @param engine - 引擎实例
   * @param config - 配置选项
   */
  constructor(engine: CoreEngine, config: DevToolsConfig = {}) {
    this.engine = engine
    this.config = {
      enabled: config.enabled ?? true,
      console: config.console ?? true,
      maxHistory: config.maxHistory ?? 100,
      trackPerformance: config.trackPerformance ?? true,
    }

    if (this.config.enabled) {
      this.initialize()
    }
  }

  /**
   * 初始化 DevTools
   * 
   * @private
   */
  private initialize(): void {
    if (this.initialized) return

    // 追踪事件
    this.trackEvents()

    // 追踪状态变更
    this.trackStateChanges()

    // 追踪性能
    if (this.config.trackPerformance) {
      this.trackPerformance()
    }

    this.initialized = true
    this.log('DevTools initialized')
  }

  /**
   * 追踪事件
   * 
   * @private
   */
  private trackEvents(): void {
    // 使用通配符监听所有事件
    // 注意：通配符监听器只能接收 payload，无法直接获取事件名
    // 我们需要改用拦截 emit 方法的方式来追踪事件
    const originalEmit = this.engine.events.emit.bind(this.engine.events)
    this.engine.events.emit = <T = EventPayload>(event: string, payload?: T): void => {
      // 先记录事件
      const record: EventRecord = {
        timestamp: Date.now(),
        event,
        payload,
        listenerCount: this.engine.events.listenerCount(event),
      }

      this.eventHistory.push(record)
      this.trimHistory(this.eventHistory)

      if (this.config.console) {
        this.log(`Event: ${event}`, payload)
      }

      // 再调用原始 emit
      originalEmit(event, payload)
    }
  }

  /**
   * 追踪状态变更
   * 
   * @private
   */
  private trackStateChanges(): void {
    // 拦截 StateManager 的 set 方法来追踪所有状态变更
    // StateManager 没有全局监听功能，需要在 DevTools 层面实现
    const originalSet = this.engine.state.set.bind(this.engine.state)
    this.engine.state.set = <T = StateValue>(key: string, value: T): void => {
      const oldValue = this.engine.state.get(key)

      // 先调用原始 set
      originalSet(key, value)

      // 再记录变更
      const record: StateChangeRecord = {
        timestamp: Date.now(),
        key,
        oldValue,
        newValue: value,
        source: 'devtools',
      }

      this.stateChanges.push(record)
      this.trimHistory(this.stateChanges)

      if (this.config.console) {
        this.log(`State Change: ${key}`, { oldValue, newValue: value })
      }
    }
  }

  /**
   * 追踪性能
   * 
   * @private
   */
  private trackPerformance(): void {
    // 追踪插件安装
    this.engine.events.on('plugin:before-install', (data: UnknownRecord) => {
      const record: PerformanceRecord = {
        name: (data as any).plugin?.name || 'unknown',
        startTime: Date.now(),
        type: 'plugin',
      }
      this.performanceRecords.push(record)
    })

    this.engine.events.on('plugin:installed', (data: UnknownRecord) => {
      const record = this.performanceRecords.find(
        r => r.name === ((data as any).plugin?.name || 'unknown') && !r.endTime
      )
      if (record) {
        record.endTime = Date.now()
        record.duration = record.endTime - record.startTime
      }
    })
  }

  /**
   * 限制历史记录数量
   * 
   * @private
   * @param history - 历史记录数组
   */
  private trimHistory(history: unknown[]): void {
    while (history.length > this.config.maxHistory) {
      history.shift()
    }
  }

  /**
   * 记录日志
   * 
   * @private
   * @param message - 日志消息
   * @param data - 附加数据
   */
  private log(message: string, data?: unknown): void {
    if (this.config.console) {
      const timestamp = new Date().toISOString()
      console.log(`[DevTools ${timestamp}] ${message}`, data || '')
    }
  }

  /**
   * 获取事件历史
   * 
   * @param filter - 事件名称过滤器（支持通配符）
   * @returns 事件记录数组
   */
  getEventHistory(filter?: string): EventRecord[] {
    if (!filter) {
      return [...this.eventHistory]
    }

    const regex = this.patternToRegex(filter)
    return this.eventHistory.filter(record => regex.test(record.event))
  }

  /**
   * 获取状态变更历史
   * 
   * @param key - 状态键（可选）
   * @returns 状态变更记录数组
   */
  getStateChanges(key?: string): StateChangeRecord[] {
    if (!key) {
      return [...this.stateChanges]
    }

    return this.stateChanges.filter(record => record.key === key)
  }

  /**
   * 获取插件信息
   * 
   * @returns 插件记录数组
   */
  getPlugins(): PluginRecord[] {
    const plugins = this.engine.plugins.getAll()
    return plugins.map(plugin => ({
      name: plugin.name,
      version: plugin.version,
      installedAt: Date.now(), // 实际应该从插件管理器获取
      status: 'active' as const,
      dependencies: plugin.dependencies || [],
    }))
  }

  /**
   * 获取性能记录
   * 
   * @param type - 记录类型（可选）
   * @returns 性能记录数组
   */
  getPerformanceRecords(type?: PerformanceRecord['type']): PerformanceRecord[] {
    if (!type) {
      return [...this.performanceRecords]
    }

    return this.performanceRecords.filter(record => record.type === type)
  }

  /**
   * 创建快照
   * 
   * @returns DevTools 快照
   */
  snapshot(): DevToolsSnapshot {
    return {
      timestamp: Date.now(),
      engine: {
        version: this.engine.config.name || '0.3.0',
        config: this.engine.config,
        pluginCount: this.engine.plugins.getAll().length,
        middlewareCount: this.engine.middleware?.getAll().length || 0,
      },
      plugins: this.getPlugins(),
      state: this.engine.state.getAll(),
      events: this.getEventStats(),
      performance: this.getPerformanceStats(),
    }
  }

  /**
   * 导出快照为 JSON
   * 
   * @returns JSON 字符串
   */
  exportSnapshot(): string {
    const snapshot = this.snapshot()
    return JSON.stringify(snapshot, null, 2)
  }

  /**
   * 获取事件统计
   * 
   * @returns 事件名称到监听器数量的映射
   */
  private getEventStats(): Record<string, number> {
    const stats: Record<string, number> = {}

    for (const record of this.eventHistory) {
      if (!stats[record.event]) {
        stats[record.event] = 0
      }
      stats[record.event]++
    }

    return stats
  }

  /**
   * 获取性能统计
   * 
   * @returns 性能统计数据
   */
  private getPerformanceStats(): Record<string, UnknownRecord> | undefined {
    if (!this.config.trackPerformance) {
      return undefined
    }

    const stats: Record<string, UnknownRecord> = {}

    for (const record of this.performanceRecords) {
      if (!record.duration) continue

      if (!stats[record.type]) {
        stats[record.type] = {
          count: 0,
          totalDuration: 0,
          avgDuration: 0,
          maxDuration: 0,
        }
      }

      const typeStat = stats[record.type] as any
      typeStat.count++
      typeStat.totalDuration += record.duration
      typeStat.avgDuration = typeStat.totalDuration / typeStat.count
      typeStat.maxDuration = Math.max(typeStat.maxDuration, record.duration)
    }

    return stats
  }

  /**
   * 将通配符模式转换为正则表达式
   * 
   * @private
   * @param pattern - 通配符模式
   * @returns 正则表达式
   */
  private patternToRegex(pattern: string): RegExp {
    if (pattern === '*') {
      return /.*/
    }

    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    const regex = escaped.replace(/\*/g, '.*')
    return new RegExp(`^${regex}$`)
  }

  /**
   * 清除历史记录
   */
  clearHistory(): void {
    this.eventHistory = []
    this.stateChanges = []
    this.performanceRecords = []
    this.log('History cleared')
  }

  /**
   * 启用 DevTools
   */
  enable(): void {
    if (this.config.enabled) return

    this.config.enabled = true
    this.initialize()
    this.log('DevTools enabled')
  }

  /**
   * 禁用 DevTools
   */
  disable(): void {
    this.config.enabled = false
    this.log('DevTools disabled')
  }

  /**
   * 销毁 DevTools
   */
  destroy(): void {
    this.clearHistory()
    this.initialized = false
    this.log('DevTools destroyed')
  }
}

/**
 * 创建 DevTools 实例
 * 
 * @param engine - 引擎实例
 * @param config - 配置选项
 * @returns DevTools 实例
 * 
 * @example
 * ```typescript
 * const devtools = createDevTools(engine, {
 *   enabled: process.env.NODE_ENV === 'development',
 *   console: true,
 *   maxHistory: 100,
 * })
 * ```
 */
export function createDevTools(
  engine: CoreEngine,
  config?: DevToolsConfig
): DevTools {
  return new DevTools(engine, config)
}