/**
 * 性能监控管理器
 * 
 * 提供内置的性能监控和统计功能
 * 
 * @module performance-monitor
 */

/**
 * 性能指标数据
 */
export interface PerformanceMetric {
  /** 指标名称 */
  name: string
  /** 开始时间戳 */
  startTime: number
  /** 结束时间戳 */
  endTime?: number
  /** 持续时间（毫秒） */
  duration?: number
  /** 额外元数据 */
  metadata?: Record<string, unknown>
}

/**
 * 性能统计数据
 */
export interface PerformanceStats {
  /** 指标名称 */
  name: string
  /** 调用次数 */
  count: number
  /** 总耗时（毫秒） */
  totalDuration: number
  /** 平均耗时（毫秒） */
  avgDuration: number
  /** 最小耗时（毫秒） */
  minDuration: number
  /** 最大耗时（毫秒） */
  maxDuration: number
  /** 最后一次调用时间 */
  lastCallTime: number
}

/**
 * 性能监控配置
 */
export interface PerformanceMonitorConfig {
  /** 是否启用监控 */
  enabled?: boolean
  /** 是否启用调试模式 */
  debug?: boolean
  /** 最大保存的指标数量 */
  maxMetrics?: number
  /** 性能警告阈值（毫秒） */
  warningThreshold?: number
  /** 是否自动清理过期指标 */
  autoCleanup?: boolean
  /** 清理间隔（毫秒） */
  cleanupInterval?: number
}

/**
 * 性能监控管理器接口
 */
export interface PerformanceMonitor {
  /** 开始性能测量 */
  start(name: string, metadata?: Record<string, unknown>): void
  /** 结束性能测量 */
  end(name: string): number | undefined
  /** 测量异步函数性能 */
  measure<T>(name: string, fn: () => Promise<T>): Promise<T>
  /** 测量同步函数性能 */
  measureSync<T>(name: string, fn: () => T): T
  /** 获取性能统计 */
  getStats(name?: string): PerformanceStats | PerformanceStats[]
  /** 获取所有指标 */
  getMetrics(): PerformanceMetric[]
  /** 清除指标 */
  clear(name?: string): void
  /** 导出性能报告 */
  export(): string
  /** 启用监控 */
  enable(): void
  /** 禁用监控 */
  disable(): void
}

/**
 * 核心性能监控管理器实现
 * 
 * 特性:
 * - 高精度时间测量
 * - 自动统计计算
 * - 内存优化（LRU 缓存）
 * - 性能警告
 * - 支持嵌套测量
 * 
 * @example
 * ```typescript
 * const monitor = createPerformanceMonitor({ enabled: true })
 * 
 * // 手动测量
 * monitor.start('api-call')
 * await fetchData()
 * monitor.end('api-call')
 * 
 * // 自动测量
 * const result = await monitor.measure('process-data', async () => {
 *   return processData()
 * })
 * 
 * // 获取统计
 * const stats = monitor.getStats('api-call')
 * console.log(`平均耗时: ${stats.avgDuration}ms`)
 * ```
 */
export class CorePerformanceMonitor implements PerformanceMonitor {
  /** 配置 */
  private config: Required<PerformanceMonitorConfig>

  /** 性能指标存储 */
  private metrics: PerformanceMetric[] = []

  /** 活跃的测量（未结束的） */
  private activeMetrics = new Map<string, PerformanceMetric>()

  /** 统计缓存 */
  private statsCache = new Map<string, PerformanceStats>()

  /** 清理定时器 */
  private cleanupTimer?: ReturnType<typeof setInterval>

  /**
   * 构造函数
   * 
   * @param config - 性能监控配置
   */
  constructor(config: PerformanceMonitorConfig = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      debug: config.debug ?? false,
      maxMetrics: config.maxMetrics ?? 1000,
      warningThreshold: config.warningThreshold ?? 1000,
      autoCleanup: config.autoCleanup ?? true,
      cleanupInterval: config.cleanupInterval ?? 60000, // 1分钟
    }

    // 启动自动清理
    if (this.config.autoCleanup) {
      this.startAutoCleanup()
    }
  }

  /**
   * 开始性能测量
   *
   * @param name - 指标名称
   * @param metadata - 额外元数据
   *
   * @example
   * ```typescript
   * monitor.start('database-query', { query: 'SELECT * FROM users' })
   * ```
   */
  start(name: string, metadata?: Record<string, unknown>): void {
    if (!this.config.enabled) {
      return
    }

    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata,
    }

    this.activeMetrics.set(name, metric)

    if (this.config.debug) {
      console.log(`[Performance] Started measuring: ${name}`)
    }
  }

  /**
   * 结束性能测量
   *
   * @param name - 指标名称
   * @returns 持续时间（毫秒），如果未找到对应的开始测量则返回 undefined
   *
   * @example
   * ```typescript
   * monitor.start('api-call')
   * await fetchData()
   * const duration = monitor.end('api-call')
   * console.log(`耗时: ${duration}ms`)
   * ```
   */
  end(name: string): number | undefined {
    if (!this.config.enabled) {
      return undefined
    }

    const metric = this.activeMetrics.get(name)
    if (!metric) {
      if (this.config.debug) {
        console.warn(`[Performance] No active measurement found for: ${name}`)
      }
      return undefined
    }

    // 计算持续时间
    metric.endTime = performance.now()
    metric.duration = metric.endTime - metric.startTime

    // 移除活跃测量
    this.activeMetrics.delete(name)

    // 保存指标
    this.addMetric(metric)

    // 性能警告
    if (metric.duration > this.config.warningThreshold) {
      console.warn(
        `[Performance] Slow operation detected: ${name} took ${metric.duration.toFixed(2)}ms`
      )
    }

    if (this.config.debug) {
      console.log(`[Performance] Finished measuring: ${name} (${metric.duration.toFixed(2)}ms)`)
    }

    return metric.duration
  }

  /**
   * 测量异步函数性能
   *
   * @param name - 指标名称
   * @param fn - 异步函数
   * @returns 函数执行结果
   *
   * @example
   * ```typescript
   * const users = await monitor.measure('fetch-users', async () => {
   *   return await api.getUsers()
   * })
   * ```
   */
  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    if (!this.config.enabled) {
      return fn()
    }

    this.start(name)
    try {
      const result = await fn()
      this.end(name)
      return result
    }
    catch (error) {
      this.end(name)
      throw error
    }
  }

  /**
   * 测量同步函数性能
   *
   * @param name - 指标名称
   * @param fn - 同步函数
   * @returns 函数执行结果
   *
   * @example
   * ```typescript
   * const result = monitor.measureSync('calculate', () => {
   *   return heavyCalculation()
   * })
   * ```
   */
  measureSync<T>(name: string, fn: () => T): T {
    if (!this.config.enabled) {
      return fn()
    }

    this.start(name)
    try {
      const result = fn()
      this.end(name)
      return result
    }
    catch (error) {
      this.end(name)
      throw error
    }
  }

  /**
   * 获取性能统计
   *
   * @param name - 指标名称，不传则返回所有统计
   * @returns 性能统计数据
   *
   * @example
   * ```typescript
   * // 获取单个指标统计
   * const stats = monitor.getStats('api-call')
   * console.log(`平均耗时: ${stats.avgDuration}ms`)
   *
   * // 获取所有统计
   * const allStats = monitor.getStats()
   * ```
   */
  getStats(name?: string): PerformanceStats | PerformanceStats[] {
    if (name) {
      // 返回单个指标统计
      const cached = this.statsCache.get(name)
      if (cached) {
        return cached
      }

      const stats = this.calculateStats(name)
      this.statsCache.set(name, stats)
      return stats
    }

    // 返回所有指标统计
    const allNames = new Set(this.metrics.map(m => m.name))
    return Array.from(allNames).map(n => this.getStats(n) as PerformanceStats)
  }

  /**
   * 获取所有指标
   *
   * @returns 性能指标数组
   *
   * @example
   * ```typescript
   * const metrics = monitor.getMetrics()
   * console.log(`共记录 ${metrics.length} 条指标`)
   * ```
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  /**
   * 清除指标
   *
   * @param name - 指标名称，不传则清除所有
   *
   * @example
   * ```typescript
   * // 清除特定指标
   * monitor.clear('api-call')
   *
   * // 清除所有指标
   * monitor.clear()
   * ```
   */
  clear(name?: string): void {
    if (name) {
      // 清除特定指标
      this.metrics = this.metrics.filter(m => m.name !== name)
      this.statsCache.delete(name)
    }
    else {
      // 清除所有指标
      this.metrics = []
      this.statsCache.clear()
      this.activeMetrics.clear()
    }

    if (this.config.debug) {
      console.log(`[Performance] Cleared metrics${name ? `: ${name}` : ''}`)
    }
  }

  /**
   * 导出性能报告
   *
   * @returns JSON 格式的性能报告
   *
   * @example
   * ```typescript
   * const report = monitor.export()
   * console.log(report)
   * // 或保存到文件
   * fs.writeFileSync('performance-report.json', report)
   * ```
   */
  export(): string {
    const stats = this.getStats() as PerformanceStats[]
    const report = {
      timestamp: Date.now(),
      config: this.config,
      stats,
      totalMetrics: this.metrics.length,
      activeMetrics: this.activeMetrics.size,
    }

    return JSON.stringify(report, null, 2)
  }

  /**
   * 启用监控
   *
   * @example
   * ```typescript
   * monitor.enable()
   * ```
   */
  enable(): void {
    this.config.enabled = true
    if (this.config.debug) {
      console.log('[Performance] Monitoring enabled')
    }
  }

  /**
   * 禁用监控
   *
   * @example
   * ```typescript
   * monitor.disable()
   * ```
   */
  disable(): void {
    this.config.enabled = false
    if (this.config.debug) {
      console.log('[Performance] Monitoring disabled')
    }
  }

  /**
   * 添加指标到存储
   *
   * 使用 LRU 策略，当超过最大数量时删除最旧的指标
   *
   * @param metric - 性能指标
   */
  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric)

    // LRU 缓存策略：超过最大数量时删除最旧的
    if (this.metrics.length > this.config.maxMetrics) {
      const removed = this.metrics.shift()
      if (removed) {
        // 清除对应的统计缓存
        this.statsCache.delete(removed.name)
      }
    }

    // 清除统计缓存，下次获取时重新计算
    this.statsCache.delete(metric.name)
  }

  /**
   * 计算指标统计
   *
   * @param name - 指标名称
   * @returns 统计数据
   */
  private calculateStats(name: string): PerformanceStats {
    const metrics = this.metrics.filter(m => m.name === name && m.duration !== undefined)

    if (metrics.length === 0) {
      return {
        name,
        count: 0,
        totalDuration: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        lastCallTime: 0,
      }
    }

    const durations = metrics.map(m => m.duration!)
    const totalDuration = durations.reduce((sum, d) => sum + d, 0)

    return {
      name,
      count: metrics.length,
      totalDuration,
      avgDuration: totalDuration / metrics.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      lastCallTime: metrics[metrics.length - 1].endTime || 0,
    }
  }

  /**
   * 启动自动清理定时器
   */
  private startAutoCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      const now = performance.now()
      const threshold = 5 * 60 * 1000 // 5分钟

      // 清理超过5分钟的指标
      const before = this.metrics.length
      this.metrics = this.metrics.filter((m) => {
        const age = now - (m.endTime || m.startTime)
        return age < threshold
      })

      const removed = before - this.metrics.length
      if (removed > 0 && this.config.debug) {
        console.log(`[Performance] Auto cleanup removed ${removed} old metrics`)
      }

      // 清除统计缓存
      this.statsCache.clear()
    }, this.config.cleanupInterval)
  }

  /**
   * 停止自动清理
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = undefined
    }

    this.clear()

    if (this.config.debug) {
      console.log('[Performance] Monitor destroyed')
    }
  }
}

/**
 * 创建性能监控管理器实例
 *
 * @param config - 性能监控配置
 * @returns 性能监控管理器实例
 *
 * @example
 * ```typescript
 * import { createPerformanceMonitor } from '@ldesign/engine-core'
 *
 * const monitor = createPerformanceMonitor({
 *   enabled: true,
 *   debug: true,
 *   warningThreshold: 500,
 * })
 *
 * // 使用监控
 * await monitor.measure('api-call', async () => {
 *   return await fetchData()
 * })
 * ```
 */
export function createPerformanceMonitor(
  config?: PerformanceMonitorConfig
): PerformanceMonitor {
  return new CorePerformanceMonitor(config)
}
