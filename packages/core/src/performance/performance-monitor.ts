/**
 * 性能监控器
 * 
 * 提供完整的性能追踪、统计和分析功能
 * 
 * @module performance/performance-monitor
 */

/**
 * 性能指标数据
 */
export interface PerformanceMetric {
  /** 指标名称 */
  name: string
  /** 开始时间 */
  startTime: number
  /** 结束时间 */
  endTime?: number
  /** 持续时间（毫秒） */
  duration?: number
  /** 元数据 */
  metadata?: Record<string, any>
}

/**
 * 性能统计数据
 */
export interface PerformanceStats {
  /** 调用次数 */
  count: number
  /** 总耗时 */
  totalDuration: number
  /** 平均耗时 */
  avgDuration: number
  /** 最小耗时 */
  minDuration: number
  /** 最大耗时 */
  maxDuration: number
  /** P50 耗时 */
  p50: number
  /** P95 耗时 */
  p95: number
  /** P99 耗时 */
  p99: number
}

/**
 * 性能监控配置
 */
export interface PerformanceMonitorConfig {
  /** 是否启用 */
  enabled?: boolean
  /** 最大保留样本数 */
  maxSamples?: number
  /** 采样率 (0-1) */
  sampleRate?: number
  /** 是否自动清理 */
  autoCleanup?: boolean
  /** 清理间隔(毫秒) */
  cleanupInterval?: number
  /** 是否启用警告 */
  enableWarnings?: boolean
  /** 慢操作阈值(毫秒) */
  slowOperationThreshold?: number
  /** 是否调试模式 */
  debug?: boolean
}

/**
 * 性能监控器实现类
 * 
 * 特性：
 * - 高精度时间测量（performance.now()）
 * - 自动统计分析（平均值、百分位数）
 * - 内存友好（滚动窗口）
 * - 低开销（采样支持）
 * - 实时监控（事件通知）
 * 
 * @example
 * ```typescript
 * const monitor = new PerformanceMonitor({ maxSamples: 1000 })
 * 
 * // 开始测量
 * const id = monitor.start('plugin-load')
 * 
 * // ... 执行操作 ...
 * 
 * // 结束测量
 * monitor.end(id)
 * 
 * // 获取统计
 * const stats = monitor.getStats('plugin-load')
 * console.log(`Average: ${stats.avgDuration}ms`)
 * ```
 */
export class PerformanceMonitor {
  /** 配置 */
  private config: Required<PerformanceMonitorConfig>

  /** 正在进行的测量 */
  private activeMetrics = new Map<string, PerformanceMetric>()

  /** 已完成的测量（按名称分组） */
  private completedMetrics = new Map<string, PerformanceMetric[]>()

  /** 清理定时器 */
  private cleanupTimer?: NodeJS.Timeout

  /** 指标ID计数器 */
  private metricIdCounter = 0

  /**
   * 构造函数
   * 
   * @param config - 配置选项
   */
  constructor(config: PerformanceMonitorConfig = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      maxSamples: config.maxSamples ?? 1000,
      sampleRate: config.sampleRate ?? 1.0,
      autoCleanup: config.autoCleanup ?? true,
      cleanupInterval: config.cleanupInterval ?? 60000, // 1分钟
      enableWarnings: config.enableWarnings ?? true,
      slowOperationThreshold: config.slowOperationThreshold ?? 1000, // 1秒
      debug: config.debug ?? false,
    }

    if (this.config.autoCleanup) {
      this.startAutoCleanup()
    }
  }

  /**
   * 开始性能测量
   * 
   * @param name - 指标名称
   * @param metadata - 元数据
   * @returns 指标ID
   */
  start(name: string, metadata?: Record<string, any>): string {
    if (!this.config.enabled) {
      return ''
    }

    // 采样检查
    if (Math.random() > this.config.sampleRate) {
      return ''
    }

    const id = `${name}-${++this.metricIdCounter}`
    const metric: PerformanceMetric = {
      name,
      startTime: this.now(),
      metadata,
    }

    this.activeMetrics.set(id, metric)
    return id
  }

  /**
   * 结束性能测量
   * 
   * @param id - 指标ID
   * @returns 持续时间（毫秒）
   */
  end(id: string): number | null {
    if (!this.config.enabled || !id) {
      return null
    }

    const metric = this.activeMetrics.get(id)
    if (!metric) {
      return null
    }

    // 计算持续时间
    metric.endTime = this.now()
    metric.duration = metric.endTime - metric.startTime

    // 移除活动指标
    this.activeMetrics.delete(id)

    // 存储完成的指标
    this.storeMetric(metric)

    // 性能警告
    if (
      this.config.enableWarnings &&
      metric.duration > this.config.slowOperationThreshold!
    ) {
      console.warn(
        `[PerformanceMonitor] Slow operation detected: "${metric.name}" took ${metric.duration.toFixed(2)}ms`
      )
    }

    // 调试输出
    if (this.config.debug) {
      console.log(
        `[PerformanceMonitor] ${metric.name}: ${metric.duration.toFixed(2)}ms`
      )
    }

    return metric.duration
  }

  /**
   * 测量函数执行时间
   * 
   * @param name - 指标名称
   * @param fn - 要测量的函数
   * @returns 函数执行结果
   */
  measure<T>(name: string, fn: () => T): T {
    const id = this.start(name)
    try {
      return fn()
    } finally {
      this.end(id)
    }
  }

  /**
   * 测量异步函数执行时间
   * 
   * @param name - 指标名称
   * @param fn - 要测量的异步函数
   * @returns 函数执行结果
   */
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const id = this.start(name)
    try {
      return await fn()
    } finally {
      this.end(id)
    }
  }

  /**
   * 获取指标统计信息
   * 
   * @param name - 指标名称
   * @returns 统计数据
   */
  getStats(name: string): PerformanceStats | null {
    const metrics = this.completedMetrics.get(name)
    if (!metrics || metrics.length === 0) {
      return null
    }

    const durations = metrics
      .map(m => m.duration!)
      .filter(d => d !== undefined)
      .sort((a, b) => a - b)

    if (durations.length === 0) {
      return null
    }

    const totalDuration = durations.reduce((sum, d) => sum + d, 0)

    return {
      count: durations.length,
      totalDuration,
      avgDuration: totalDuration / durations.length,
      minDuration: durations[0],
      maxDuration: durations[durations.length - 1],
      p50: this.percentile(durations, 0.5),
      p95: this.percentile(durations, 0.95),
      p99: this.percentile(durations, 0.99),
    }
  }

  /**
   * 获取所有指标的统计信息
   * 
   * @returns 指标名称到统计数据的映射
   */
  getAllStats(): Map<string, PerformanceStats> {
    const allStats = new Map<string, PerformanceStats>()

    for (const name of this.completedMetrics.keys()) {
      const stats = this.getStats(name)
      if (stats) {
        allStats.set(name, stats)
      }
    }

    return allStats
  }

  /**
   * 获取慢操作报告
   * 
   * @param threshold - 阈值(毫秒)
   * @returns 慢操作列表
   */
  getSlowOperations(threshold?: number): Array<{
    name: string
    avgDuration: number
    maxDuration: number
    count: number
  }> {
    const slowThreshold = threshold ?? this.config.slowOperationThreshold ?? 1000
    const result: Array<{
      name: string
      avgDuration: number
      maxDuration: number
      count: number
    }> = []

    for (const name of this.completedMetrics.keys()) {
      const stats = this.getStats(name)
      if (stats && stats.avgDuration > slowThreshold) {
        result.push({
          name,
          avgDuration: stats.avgDuration,
          maxDuration: stats.maxDuration,
          count: stats.count,
        })
      }
    }

    // 按平均耗时排序
    return result.sort((a, b) => b.avgDuration - a.avgDuration)
  }

  /**
   * 获取性能总览
   * 
   * @returns 性能总览信息
   */
  getPerformanceOverview(): {
    totalMetrics: number
    totalOperations: number
    slowOperations: number
    avgDuration: number
    topSlowest: Array<{ name: string; avgDuration: number }>
  } {
    const allStats = Array.from(this.getAllStats().entries())
    let totalOps = 0
    let totalDuration = 0
    let slowOps = 0

    for (const [_, stats] of allStats) {
      totalOps += stats.count
      totalDuration += stats.totalDuration
      if (stats.avgDuration > (this.config.slowOperationThreshold ?? 1000)) {
        slowOps++
      }
    }

    const topSlowest = allStats
      .sort((a, b) => b[1].avgDuration - a[1].avgDuration)
      .slice(0, 10)
      .map(([name, stats]) => ({
        name,
        avgDuration: stats.avgDuration,
      }))

    return {
      totalMetrics: allStats.length,
      totalOperations: totalOps,
      slowOperations: slowOps,
      avgDuration: totalOps > 0 ? totalDuration / totalOps : 0,
      topSlowest,
    }
  }

  /**
   * 获取原始指标数据
   * 
   * @param name - 指标名称
   * @returns 指标数组
   */
  getMetrics(name: string): PerformanceMetric[] {
    return this.completedMetrics.get(name) || []
  }

  /**
   * 清除指定指标的数据
   * 
   * @param name - 指标名称
   */
  clear(name: string): void {
    this.completedMetrics.delete(name)
  }

  /**
   * 清除所有指标数据
   */
  clearAll(): void {
    this.completedMetrics.clear()
    this.activeMetrics.clear()
  }

  /**
   * 启用监控
   */
  enable(): void {
    this.config.enabled = true
  }

  /**
   * 禁用监控
   */
  disable(): void {
    this.config.enabled = false
  }

  /**
   * 销毁监控器
   */
  destroy(): void {
    this.stopAutoCleanup()
    this.clearAll()
  }

  /**
   * 存储完成的指标
   * 
   * @private
   * @param metric - 指标数据
   */
  private storeMetric(metric: PerformanceMetric): void {
    const { name } = metric
    let metrics = this.completedMetrics.get(name)

    if (!metrics) {
      metrics = []
      this.completedMetrics.set(name, metrics)
    }

    // 添加新指标
    metrics.push(metric)

    // 限制样本数量（滚动窗口）
    if (metrics.length > this.config.maxSamples) {
      metrics.shift()
    }
  }

  /**
   * 计算百分位数
   * 
   * @private
   * @param sortedValues - 已排序的值数组
   * @param percentile - 百分位（0-1）
   * @returns 百分位值
   */
  private percentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) {
      return 0
    }

    const index = Math.ceil(sortedValues.length * percentile) - 1
    return sortedValues[Math.max(0, index)]
  }

  /**
   * 获取高精度时间戳
   * 
   * @private
   * @returns 时间戳（毫秒）
   */
  private now(): number {
    if (typeof performance !== 'undefined' && performance.now) {
      return performance.now()
    }
    return Date.now()
  }

  /**
   * 启动自动清理
   * 
   * @private
   */
  private startAutoCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)
  }

  /**
   * 停止自动清理
   * 
   * @private
   */
  private stopAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = undefined
    }
  }

  /**
   * 清理过期的指标数据
   * 
   * @private
   */
  private cleanup(): void {
    // 清理长时间未完成的活动指标
    const now = this.now()
    const timeout = 5 * 60 * 1000 // 5分钟

    for (const [id, metric] of this.activeMetrics.entries()) {
      if (now - metric.startTime > timeout) {
        this.activeMetrics.delete(id)
      }
    }
  }
}

/**
 * 创建性能监控器
 * 
 * @param config - 配置选项
 * @returns 性能监控器实例
 * 
 * @example
 * ```typescript
 * const monitor = createPerformanceMonitor({
 *   maxSamples: 1000,
 *   sampleRate: 0.1 // 10% 采样
 * })
 * ```
 */
export function createPerformanceMonitor(
  config?: PerformanceMonitorConfig
): PerformanceMonitor {
  return new PerformanceMonitor(config)
}
