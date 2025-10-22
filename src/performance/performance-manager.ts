import type { Engine } from '../types'

// 性能指标类型
export interface PerformanceMetrics {
  // 基础指标
  timestamp: number
  duration: number

  // 内存指标
  memory?: {
    used: number
    total: number
    limit: number
  }

  // 网络指标
  network?: {
    latency: number
    bandwidth: number
    connectionType?: string
    requests?: number
    totalSize?: number
    averageTime?: number
  }

  // 渲染指标
  rendering?: {
    fps: number
    droppedFrames: number
    renderTime: number
    frameTime?: number
  }

  // 自定义指标
  custom?: Record<string, number>
}

// 性能事件类型
export enum PerformanceEventType {
  NAVIGATION = 'navigation',
  RESOURCE_LOAD = 'resource_load',
  USER_INTERACTION = 'user_interaction',
  COMPONENT_RENDER = 'component_render',
  API_CALL = 'api_call',
  NETWORK = 'network',
  RENDER = 'render',
  CUSTOM = 'custom',
}

// 性能事件
export interface PerformanceEvent {
  id: string
  type: PerformanceEventType
  name: string
  startTime: number
  endTime?: number
  duration?: number
  metadata?: Record<string, unknown>
  metrics?: Partial<PerformanceMetrics>
}

// 性能阈值配置
export interface PerformanceThresholds {
  // 响应时间阈值（毫秒）
  responseTime?: {
    good: number
    poor: number
  }

  // FPS阈值
  fps?: {
    good: number
    poor: number
  }

  // 内存使用阈值（MB）
  memory?: {
    warning: number
    critical: number
  }

  // 包大小阈值（KB）
  bundleSize?: {
    warning: number
    critical: number
  }
}

// 性能报告
export interface PerformanceReport {
  summary: {
    totalEvents: number
    averageResponseTime: number
    averageFPS: number
    memoryUsage: number
    timeRange: {
      start: number
      end: number
    }
  }

  events: PerformanceEvent[]
  metrics: PerformanceMetrics[]
  violations: PerformanceViolation[]
  recommendations: string[]
}

// 性能违规
export interface PerformanceViolation {
  type: 'threshold' | 'memory_leak' | 'slow_operation'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  details: unknown
  timestamp: number
}

// 性能管理器接口
export interface PerformanceManager {
  // 事件追踪
  startEvent: (
    type: PerformanceEventType,
    name: string,
    metadata?: Record<string, unknown>
  ) => string
  endEvent: (id: string, metadata?: Record<string, unknown>) => void
  recordEvent: (event: Omit<PerformanceEvent, 'id'>) => string

  // 指标收集
  collectMetrics: () => PerformanceMetrics
  recordMetrics: (metrics: Partial<PerformanceMetrics>) => void

  // 监控管理
  startMonitoring: () => void
  stopMonitoring: () => void
  isMonitoring: () => boolean

  // 数据获取
  getEvents: (filter?: Partial<PerformanceEvent>) => PerformanceEvent[]
  getMetrics: (timeRange?: {
    start: number
    end: number
  }) => PerformanceMetrics[]
  getReport: (timeRange?: { start: number; end: number }) => PerformanceReport

  // 阈值管理
  setThresholds: (thresholds: Partial<PerformanceThresholds>) => void
  getThresholds: () => PerformanceThresholds

  // 事件监听
  onViolation: (callback: (violation: PerformanceViolation) => void) => void
  onMetrics: (callback: (metrics: PerformanceMetrics) => void) => void

  // 数据清理
  clearData: (olderThan?: number) => void
  exportData: () => string
  importData: (data: string) => void
}

// 增强的内存监控器 - 支持自适应采样和泄漏检测
class MemoryMonitor {
  private callback?: (memory: PerformanceMetrics['memory']) => void
  private intervalId?: NodeJS.Timeout
  private baseInterval = 30000 // 基础采样间隔30秒
  private currentInterval = 30000
  private memoryHistory: Array<{ timestamp: number; used: number }> = []
  private maxHistorySize = 50 // 保留最近50个样本
  private leakThreshold = 10 * 1024 * 1024 // 10MB增长视为潜在泄漏

  start(
    callback: (memory: PerformanceMetrics['memory']) => void,
    interval = 30000
  ): void {
    this.callback = callback
    this.baseInterval = interval
    this.currentInterval = interval
    this.startAdaptiveMonitoring()
  }

  /**
   * 自适应监控 - 根据内存压力调整采样频率
   */
  private startAdaptiveMonitoring(): void {
    const sample = () => {
      const memory = this.getMemoryInfo()
      if (memory && this.callback) {
        this.callback(memory)

        // 记录内存历史
        this.memoryHistory.push({
          timestamp: Date.now(),
          used: memory.used
        })

        // 限制历史大小
        if (this.memoryHistory.length > this.maxHistorySize) {
          this.memoryHistory.shift()
        }

        // 检测内存泄漏
        this.detectMemoryLeak()

        // 自适应调整采样间隔
        this.adjustSamplingInterval(memory)
      }

      // 使用当前间隔重新调度
      if (this.intervalId) {
        clearTimeout(this.intervalId)
      }
      this.intervalId = setTimeout(sample, this.currentInterval) as any
    }

    sample()
  }

  /**
   * 根据内存使用情况调整采样间隔
   */
  private adjustSamplingInterval(memory: NonNullable<PerformanceMetrics['memory']>): void {
    const usagePercent = memory.used / memory.limit

    if (usagePercent > 0.8) {
      // 高内存压力：每5秒采样
      this.currentInterval = 5000
    } else if (usagePercent > 0.6) {
      // 中等压力：每15秒采样
      this.currentInterval = 15000
    } else {
      // 正常：使用基础间隔
      this.currentInterval = this.baseInterval
    }
  }

  /**
   * 检测内存泄漏
   */
  private detectMemoryLeak(): void {
    if (this.memoryHistory.length < 10) {
      return // 样本不足
    }

    // 检查最近10个样本的内存增长趋势
    const recentSamples = this.memoryHistory.slice(-10)
    const firstSample = recentSamples[0]
    const lastSample = recentSamples[recentSamples.length - 1]

    const growthRate = lastSample.used - firstSample.used
    const timeDiff = lastSample.timestamp - firstSample.timestamp

    // 如果在短时间内内存持续增长超过阈值，发出警告
    if (growthRate > this.leakThreshold && timeDiff < 5 * 60 * 1000) {
      console.warn('[MemoryMonitor] Potential memory leak detected', {
        growth: `${(growthRate / 1024 / 1024).toFixed(2)}MB`,
        duration: `${(timeDiff / 1000).toFixed(0)}s`,
        rate: `${((growthRate / timeDiff) * 1000 / 1024).toFixed(2)}KB/s`
      })

      // 触发自定义事件
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('memory-leak-warning', {
          detail: { growth: growthRate, duration: timeDiff }
        }))
      }
    }
  }

  /**
   * 获取内存趋势
   */
  getMemoryTrend(): {
    average: number
    peak: number
    current: number
    trend: 'increasing' | 'stable' | 'decreasing'
  } | null {
    if (this.memoryHistory.length < 5) {
      return null
    }

    const recent = this.memoryHistory.slice(-10)
    const average = recent.reduce((sum, s) => sum + s.used, 0) / recent.length
    const peak = Math.max(...recent.map(s => s.used))
    const current = recent[recent.length - 1].used

    // 简单的趋势分析
    const firstHalf = recent.slice(0, Math.floor(recent.length / 2))
    const secondHalf = recent.slice(Math.floor(recent.length / 2))
    const firstAvg = firstHalf.reduce((sum, s) => sum + s.used, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, s) => sum + s.used, 0) / secondHalf.length

    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable'
    const diff = secondAvg - firstAvg
    if (diff > 1024 * 1024) { // 1MB差异
      trend = 'increasing'
    } else if (diff < -1024 * 1024) {
      trend = 'decreasing'
    }

    return { average, peak, current, trend }
  }

  stop(): void {
    if (this.intervalId) {
      clearTimeout(this.intervalId)
      this.intervalId = undefined
    }
    this.callback = undefined
    this.memoryHistory = []
  }

  private getMemoryInfo(): PerformanceMetrics['memory'] | undefined {
    if (
      typeof globalThis !== 'undefined' &&
      typeof globalThis.performance !== 'undefined' &&
      'memory' in (globalThis.performance as Performance)
    ) {
      const memory = (globalThis.performance as Performance & { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory
      if (!memory) return undefined
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
      }
    }
    return undefined
  }
}

// FPS监控器
class FPSMonitor {
  private callback?: (fps: number) => void
  private animationId?: number
  private frameCount = 0
  private lastTime = 0
  private fps = 0

  start(callback: (fps: number) => void): void {
    this.callback = callback
    this.frameCount = 0
    this.lastTime = globalThis.performance?.now() || Date.now()
    this.measureFPS()
  }

  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = undefined
    }
    this.callback = undefined
  }

  private measureFPS(): void {
    if (!this.callback) return

    this.frameCount++
    const currentTime = globalThis.performance?.now() || Date.now()

    if (currentTime - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime))
      this.frameCount = 0
      this.lastTime = currentTime
      this.callback(this.fps)
    }

    this.animationId = requestAnimationFrame(() => this.measureFPS())
  }

  getFPS(): number {
    return this.fps
  }
}

// 🚀 新增：滑动窗口数据结构
class SlidingWindow<T> {
  private data: T[] = []
  private maxSize: number
  private aggregated?: T

  constructor(maxSize: number) {
    this.maxSize = maxSize
  }

  push(item: T): void {
    this.data.push(item)
    if (this.data.length > this.maxSize) {
      this.data.shift()
    }
    this.aggregated = undefined // 清除聚合缓存
  }

  get(index: number): T | undefined {
    return this.data[index]
  }

  getAll(): T[] {
    return [...this.data]
  }

  size(): number {
    return this.data.length
  }

  clear(): void {
    this.data = []
    this.aggregated = undefined
  }

  // 聚合数据（避免重复计算）
  aggregate(aggregator: (items: T[]) => T): T {
    if (!this.aggregated) {
      this.aggregated = aggregator(this.data)
    }
    return this.aggregated
  }
}

// 性能管理器实现
export class PerformanceManagerImpl implements PerformanceManager {
  private events = new Map<string, PerformanceEvent>()

  // 🚀 使用滑动窗口存储指标，自动淘汰旧数据
  private metricsWindow: SlidingWindow<PerformanceMetrics>
  private readonly MAX_METRICS_WINDOW = 100 // 滑动窗口大小

  private thresholds: PerformanceThresholds
  private violationCallbacks: ((violation: PerformanceViolation) => void)[] = []
  private metricsCallbacks: ((metrics: PerformanceMetrics) => void)[] = []
  private monitoring = false
  private fpsMonitor = new FPSMonitor()
  private memoryMonitor = new MemoryMonitor()
  private performanceObserver?: PerformanceObserver
  private engine?: Engine
  private eventIdCounter = 0
  private maxEvents = 50 // 限制最大事件数量
  private destroyed = false

  // 🚀 数据聚合缓存
  private aggregatedMetrics?: {
    averageResponseTime: number
    averageFPS: number
    averageMemory: number
    timestamp: number
  }
  private readonly AGGREGATION_CACHE_TTL = 5000 // 5秒

  constructor(thresholds: PerformanceThresholds = {}, engine?: Engine) {
    this.engine = engine
    this.metricsWindow = new SlidingWindow(this.MAX_METRICS_WINDOW)
    this.thresholds = {
      responseTime: { good: 100, poor: 1000 },
      fps: { good: 55, poor: 30 },
      memory: { warning: 100, critical: 200 },
      bundleSize: { warning: 500, critical: 1000 },
      ...thresholds,
    }
  }

  startEvent(
    type: PerformanceEventType,
    name: string,
    metadata?: Record<string, unknown>
  ): string {
    const id = `perf_${++this.eventIdCounter}_${Date.now()}`
    const event: PerformanceEvent = {
      id,
      type,
      name,
      startTime: globalThis.performance.now(),
      metadata,
    }

    this.events.set(id, event)

    // 限制事件数量
    if (this.events.size > this.maxEvents) {
      const oldestKey = this.events.keys().next().value
      if (oldestKey) {
        this.events.delete(oldestKey)
      }
    }

    return id
  }

  endEvent(id: string, metadata?: Record<string, unknown>): void {
    const event = this.events.get(id)
    if (!event) {
      this.engine?.logger?.warn(`Performance event ${id} not found`)
      return
    }

    const endTime = globalThis.performance.now()
    const duration = endTime - event.startTime

    event.endTime = endTime
    event.duration = duration

    if (metadata) {
      event.metadata = { ...event.metadata, ...metadata }
    }

    // 检查阈值违规
    this.checkThresholdViolations(event)

    // 触发事件完成回调
    if (this.engine?.events) {
      this.engine.events.emit('performance:event', event)
    }
  }

  recordEvent(event: Omit<PerformanceEvent, 'id'>): string {
    const id = `perf_${++this.eventIdCounter}_${Date.now()}`
    const fullEvent: PerformanceEvent = {
      ...event,
      id,
    }

    this.events.set(id, fullEvent)

    // 检查阈值违规
    this.checkThresholdViolations(fullEvent)

    return id
  }

  collectMetrics(): PerformanceMetrics {
    const timestamp = Date.now()
    const metrics: PerformanceMetrics = {
      timestamp,
      duration: 0, // 将在后续更新
    }

    // 收集内存信息
    if (
      typeof globalThis !== 'undefined' &&
      typeof globalThis.performance !== 'undefined' &&
      'memory' in (globalThis.performance as Performance)
    ) {
      const memory = (globalThis.performance as Performance & { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory
      if (!memory) return metrics
      metrics.memory = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
      }
    }

    // 收集网络信息
    if (
      typeof globalThis.performance !== 'undefined' &&
      globalThis.performance.getEntriesByType
    ) {
      const networkEntries =
        globalThis.performance.getEntriesByType('navigation')
      if (networkEntries.length > 0) {
        const entry = networkEntries[0] as PerformanceNavigationTiming
        metrics.network = {
          latency: entry.responseStart - entry.requestStart,
          bandwidth: entry.transferSize ? (entry.transferSize / (entry.responseEnd - entry.responseStart)) * 1000 : 0,
          requests: 1,
          totalSize: entry.transferSize || 0,
          averageTime: entry.loadEventEnd - entry.loadEventStart,
        }
      }
    }

    return metrics
  }

  recordMetrics(metrics: Partial<PerformanceMetrics>): void {
    if (this.destroyed) return

    const fullMetrics: PerformanceMetrics = {
      timestamp: Date.now(),
      duration: 0,
      ...metrics,
    }

    // 🚀 使用滑动窗口自动淘汰旧数据
    this.metricsWindow.push(fullMetrics)

    // 🚀 清除聚合缓存
    this.aggregatedMetrics = undefined

    // 检查指标违规
    this.checkMetricsViolations(fullMetrics)

    // 触发指标回调
    this.metricsCallbacks.forEach(callback => {
      try {
        callback(fullMetrics)
      } catch (error) {
        this.engine?.logger?.error('Error in metrics callback', error)
      }
    })
  }

  startMonitoring(): void {
    if (this.monitoring) {
      return
    }

    this.monitoring = true

    // 启动FPS监控
    if (typeof requestAnimationFrame !== 'undefined') {
      this.fpsMonitor.start(fps => {
        this.recordMetrics({
          rendering: {
            fps,
            frameTime: 1000 / fps,
            droppedFrames: fps < 30 ? 1 : 0,
            renderTime: 1000 / fps,
          },
        })
      })
    }

    // 启动内存监控
    this.memoryMonitor.start(memory => {
      this.recordMetrics({ memory })
    })

    // 监听性能观察者API
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        this.performanceObserver = new PerformanceObserver(list => {
          if (this.destroyed) return
          for (const entry of list.getEntries()) {
            this.handlePerformanceEntry(entry)
          }
        })

        this.performanceObserver.observe({
          entryTypes: ['navigation', 'resource', 'measure', 'mark'],
        })
      } catch (error) {
        this.engine?.logger?.warn('PerformanceObserver not supported', error)
      }
    }

    this.engine?.logger?.info('Performance monitoring started')
  }

  stopMonitoring(): void {
    if (!this.monitoring) {
      return
    }

    this.monitoring = false
    this.fpsMonitor.stop()
    this.memoryMonitor.stop()

    if (this.performanceObserver) {
      this.performanceObserver.disconnect()
      this.performanceObserver = undefined
    }

    this.engine?.logger?.info('Performance monitoring stopped')
  }

  isMonitoring(): boolean {
    return this.monitoring
  }

  getEvents(filter?: Partial<PerformanceEvent>): PerformanceEvent[] {
    let events = Array.from(this.events.values())

    if (filter) {
      events = events.filter(event => {
        return Object.entries(filter).every(([key, value]) => {
          return event[key as keyof PerformanceEvent] === value
        })
      })
    }

    return events.sort((a, b) => a.startTime - b.startTime)
  }

  getMetrics(timeRange?: { start: number; end: number }): PerformanceMetrics[] {
    // 🚀 从滑动窗口获取数据
    let metrics = this.metricsWindow.getAll()

    if (timeRange) {
      metrics = metrics.filter(
        metric =>
          metric.timestamp >= timeRange.start &&
          metric.timestamp <= timeRange.end
      )
    }

    return metrics.sort((a, b) => a.timestamp - b.timestamp)
  }

  getReport(timeRange?: { start: number; end: number }): PerformanceReport {
    const events = this.getEvents()
    const metrics = this.getMetrics(timeRange)

    // 计算摘要
    const completedEvents = events.filter(e => e.duration !== undefined)
    const totalResponseTime = completedEvents.reduce(
      (sum, e) => sum + (e.duration || 0),
      0
    )
    const averageResponseTime =
      completedEvents.length > 0
        ? totalResponseTime / completedEvents.length
        : 0

    const fpsMetrics = metrics.filter(m => m.rendering?.fps)
    const averageFPS =
      fpsMetrics.length > 0
        ? fpsMetrics.reduce((sum, m) => sum + (m.rendering?.fps || 0), 0) /
        fpsMetrics.length
        : 0

    const latestMemory = metrics.filter(m => m.memory).pop()
    const memoryUsage = latestMemory?.memory?.used || 0

    const timeStart =
      timeRange?.start ||
      (events.length > 0
        ? Math.min(...events.map(e => e.startTime))
        : Date.now())
    const timeEnd = timeRange?.end || Date.now()

    return {
      summary: {
        totalEvents: events.length,
        averageResponseTime,
        averageFPS,
        memoryUsage,
        timeRange: {
          start: timeStart,
          end: timeEnd,
        },
      },
      events,
      metrics,
      violations: this.getViolations(timeRange),
      recommendations: this.generateRecommendations(events, metrics),
    }
  }

  setThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds }
  }

  getThresholds(): PerformanceThresholds {
    return { ...this.thresholds }
  }

  onViolation(callback: (violation: PerformanceViolation) => void): void {
    this.violationCallbacks.push(callback)
  }

  onMetrics(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.metricsCallbacks.push(callback)

    // 返回取消订阅函数
    return () => {
      const index = this.metricsCallbacks.indexOf(callback)
      if (index > -1) {
        this.metricsCallbacks.splice(index, 1)
      }
    }
  }

  clearData(olderThan?: number): void {
    const cutoff = olderThan || Date.now() - 24 * 60 * 60 * 1000 // 默认24小时

    // 清理事件
    for (const [id, event] of this.events.entries()) {
      if (event.startTime < cutoff) {
        this.events.delete(id)
      }
    }

    // 清理指标
    this.metrics = this.metrics.filter(metric => metric.timestamp >= cutoff)
  }

  exportData(): string {
    return JSON.stringify({
      events: Array.from(this.events.values()),
      metrics: this.metrics,
      thresholds: this.thresholds,
    })
  }

  importData(data: string): void {
    try {
      const parsed = JSON.parse(data)

      if (parsed.events) {
        this.events.clear()
        parsed.events.forEach((event: PerformanceEvent) => {
          this.events.set(event.id, event)
        })
      }

      if (parsed.metrics) {
        this.metrics = parsed.metrics
      }

      if (parsed.thresholds) {
        this.thresholds = { ...this.thresholds, ...parsed.thresholds }
      }
    } catch (error) {
      this.engine?.logger?.error('Failed to import performance data', error)
    }
  }

  private handlePerformanceEntry(entry: PerformanceEntry): void {
    const eventType = this.getEventTypeFromEntry(entry)

    this.recordEvent({
      type: eventType,
      name: entry.name,
      startTime: entry.startTime,
      endTime: entry.startTime + entry.duration,
      duration: entry.duration,
      metadata: {
        entryType: entry.entryType,
        ...this.getEntryMetadata(entry),
      },
    })
  }

  private getEventTypeFromEntry(entry: PerformanceEntry): PerformanceEventType {
    switch (entry.entryType) {
      case 'navigation':
        return PerformanceEventType.NAVIGATION
      case 'resource':
        return PerformanceEventType.RESOURCE_LOAD
      case 'measure':
      case 'mark':
        return PerformanceEventType.CUSTOM
      default:
        return PerformanceEventType.CUSTOM
    }
  }

  private getEntryMetadata(entry: PerformanceEntry): Record<string, unknown> {
    const metadata: Record<string, unknown> = {}

    const anyEntry = entry as unknown as { transferSize?: number; decodedBodySize?: number }
    if (typeof anyEntry.transferSize === 'number') {
      metadata.transferSize = anyEntry.transferSize
    }

    if (typeof anyEntry.decodedBodySize === 'number') {
      metadata.decodedBodySize = anyEntry.decodedBodySize
    }

    return metadata
  }

  private checkThresholdViolations(event: PerformanceEvent): void {
    if (!event.duration) return

    const { responseTime } = this.thresholds

    if (responseTime && event.duration > responseTime.poor) {
      this.reportViolation({
        type: 'threshold',
        severity: 'high',
        message: `Slow operation detected: ${event.name
          } took ${event.duration.toFixed(2)}ms`,
        details: { event, threshold: responseTime.poor },
        timestamp: Date.now(),
      })
    }
  }

  private checkMetricsViolations(metrics: PerformanceMetrics): void {
    // 检查内存使用
    if (metrics.memory && this.thresholds.memory) {
      const memoryMB = metrics.memory.used / (1024 * 1024)

      if (memoryMB > this.thresholds.memory.critical) {
        this.reportViolation({
          type: 'memory_leak',
          severity: 'critical',
          message: `Critical memory usage: ${memoryMB.toFixed(2)}MB`,
          details: {
            memory: metrics.memory,
            threshold: this.thresholds.memory.critical,
          },
          timestamp: Date.now(),
        })
      } else if (memoryMB > this.thresholds.memory.warning) {
        this.reportViolation({
          type: 'memory_leak',
          severity: 'medium',
          message: `High memory usage: ${memoryMB.toFixed(2)}MB`,
          details: {
            memory: metrics.memory,
            threshold: this.thresholds.memory.warning,
          },
          timestamp: Date.now(),
        })
      }
    }

    // 检查FPS
    if (metrics.rendering?.fps && this.thresholds.fps) {
      if (metrics.rendering.fps < this.thresholds.fps.poor) {
        this.reportViolation({
          type: 'threshold',
          severity: 'medium',
          message: `Low FPS detected: ${metrics.rendering.fps}`,
          details: {
            fps: metrics.rendering.fps,
            threshold: this.thresholds.fps.poor,
          },
          timestamp: Date.now(),
        })
      }
    }
  }

  private reportViolation(violation: PerformanceViolation): void {
    this.violationCallbacks.forEach(callback => {
      try {
        callback(violation)
      } catch (error) {
        this.engine?.logger?.error('Error in violation callback', error)
      }
    })

    if (this.engine?.events) {
      this.engine.events.emit('performance:violation', violation)
    }
  }

  private getViolations(_timeRange?: {
    start: number
    end: number
  }): PerformanceViolation[] {
    // 这里应该从存储中获取违规记录
    // 为简化实现，返回空数组
    return []
  }

  private generateRecommendations(
    events: PerformanceEvent[],
    metrics: PerformanceMetrics[]
  ): string[] {
    const recommendations: string[] = []

    // 分析慢操作
    const slowEvents = events.filter(e => e.duration && e.duration > 1000)
    if (slowEvents.length > 0) {
      recommendations.push(`发现 ${slowEvents.length} 个慢操作，建议优化性能`)

      // 分析最慢的操作
      const slowestEvent = slowEvents.reduce((prev, current) =>
        (prev.duration || 0) > (current.duration || 0) ? prev : current
      )
      recommendations.push(
        `最慢操作: ${slowestEvent.name} (${slowestEvent.duration}ms)`
      )
    }

    // 分析内存使用和泄漏
    const memoryMetrics = metrics.filter(m => m.memory)
    if (memoryMetrics.length > 0) {
      // 如果有多个指标，分析内存增长
      if (memoryMetrics.length > 1) {
        const firstMemory = memoryMetrics[0].memory?.used || 0
        const lastMemory =
          memoryMetrics[memoryMetrics.length - 1].memory?.used || 0
        const memoryGrowth = lastMemory - firstMemory
        const memoryGrowthMB = memoryGrowth / (1024 * 1024)

        if (memoryGrowthMB > 50) {
          recommendations.push(
            `检测到内存增长 ${memoryGrowthMB.toFixed(2)}MB，可能存在内存泄漏`
          )
        }
      }

      // 分析平均内存使用
      const avgMemory =
        memoryMetrics.reduce((sum, m) => sum + (m.memory?.used || 0), 0) /
        memoryMetrics.length
      const memoryMB = avgMemory / (1024 * 1024)

      if (memoryMB > 100) {
        recommendations.push(
          `平均内存使用 ${memoryMB.toFixed(2)}MB，建议优化内存使用`
        )
      } else if (memoryMB > 50) {
        recommendations.push(
          `内存使用较高 ${memoryMB.toFixed(2)}MB，建议监控内存使用情况`
        )
      }
    }

    // 分析FPS和渲染性能
    const fpsMetrics = metrics.filter(m => m.rendering?.fps)
    if (fpsMetrics.length > 0) {
      const avgFPS =
        fpsMetrics.reduce((sum, m) => sum + (m.rendering?.fps || 0), 0) /
        fpsMetrics.length
      const minFPS = Math.min(...fpsMetrics.map(m => m.rendering?.fps || 60))

      if (avgFPS < 30) {
        recommendations.push(`平均FPS ${avgFPS.toFixed(1)}，建议优化渲染性能`)
      }

      if (minFPS < 20) {
        recommendations.push(`最低FPS ${minFPS}，存在严重卡顿`)
      }

      // 检查掉帧情况
      const droppedFrames = fpsMetrics.reduce(
        (sum, m) => sum + (m.rendering?.droppedFrames || 0),
        0
      )
      if (droppedFrames > fpsMetrics.length * 0.1) {
        recommendations.push(
          `掉帧率 ${((droppedFrames / fpsMetrics.length) * 100).toFixed(
            1
          )}%，建议优化动画`
        )
      }
    }

    // 分析网络性能
    const networkEvents = events.filter(
      e => e.type === PerformanceEventType.NETWORK
    )
    if (networkEvents.length > 0) {
      const avgResponseTime =
        networkEvents.reduce((sum, e) => sum + (e.duration || 0), 0) /
        networkEvents.length
      if (avgResponseTime > 2000) {
        recommendations.push(
          `网络请求平均响应时间 ${avgResponseTime.toFixed(
            0
          )}ms，建议优化网络性能`
        )
      }
    }

    // 分析组件渲染性能
    const renderEvents = events.filter(
      e => e.type === PerformanceEventType.RENDER
    )
    if (renderEvents.length > 0) {
      const slowRenders = renderEvents.filter(e => (e.duration || 0) > 16) // 超过一帧时间
      if (slowRenders.length > renderEvents.length * 0.2) {
        recommendations.push(
          `${((slowRenders.length / renderEvents.length) * 100).toFixed(
            1
          )}% 的渲染超过16ms，建议优化组件`
        )
      }
    }

    return recommendations
  }

  // 添加缺失的方法
  updateThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.setThresholds(thresholds)
  }

  generateReport(timeRange?: {
    start: number
    end: number
  }): PerformanceReport {
    return this.getReport(timeRange)
  }

  mark(name: string): void {
    if (
      typeof globalThis.performance !== 'undefined' &&
      globalThis.performance.mark
    ) {
      globalThis.performance.mark(name)
    }
  }

  measure(name: string, startMark?: string, endMark?: string): void {
    if (
      typeof globalThis.performance !== 'undefined' &&
      globalThis.performance.measure
    ) {
      try {
        globalThis.performance.measure(name, startMark, endMark)
      } catch (error) {
        // 如果标记不存在，忽略错误
        this.engine?.logger?.warn(`Performance measure failed: ${error}`)
      }
    }
  }

  getMarks(): PerformanceEntry[] {
    if (
      typeof globalThis.performance !== 'undefined' &&
      globalThis.performance.getEntriesByType
    ) {
      return globalThis.performance.getEntriesByType('mark')
    }
    return []
  }

  getMeasures(): PerformanceEntry[] {
    if (
      typeof globalThis.performance !== 'undefined' &&
      globalThis.performance.getEntriesByType
    ) {
      return globalThis.performance.getEntriesByType('measure')
    }
    return []
  }

  clearEvents(): void {
    this.events.clear()
  }

  clearMetrics(): void {
    // 🚀 清空滑动窗口
    this.metricsWindow.clear()
    this.aggregatedMetrics = undefined
  }

  clearMarks(): void {
    if (
      typeof globalThis.performance !== 'undefined' &&
      globalThis.performance.clearMarks
    ) {
      globalThis.performance.clearMarks()
    }
  }

  clearMeasures(): void {
    if (
      typeof globalThis.performance !== 'undefined' &&
      globalThis.performance.clearMeasures
    ) {
      globalThis.performance.clearMeasures()
    }
  }

  /**
   * 获取内存趋势分析
   */
  getMemoryTrend(): {
    average: number
    peak: number
    current: number
    trend: 'increasing' | 'stable' | 'decreasing'
  } | null {
    return this.memoryMonitor.getMemoryTrend()
  }

  /**
   * 获取内存信息（立即）
   */
  getMemoryInfo(): PerformanceMetrics['memory'] | undefined {
    if (
      typeof globalThis !== 'undefined' &&
      typeof globalThis.performance !== 'undefined' &&
      'memory' in (globalThis.performance as Performance)
    ) {
      const memory = (globalThis.performance as Performance & { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory
      if (!memory) return undefined
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
      }
    }
    return undefined
  }

  // 销毁方法 - 清理所有资源
  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true

    // 停止监控
    this.stopMonitoring()

    // 清理性能观察器
    if (this.performanceObserver) {
      this.performanceObserver.disconnect()
      this.performanceObserver = undefined
    }

    // 清理监视器
    this.fpsMonitor.stop()
    this.memoryMonitor.stop()

    // 清理数据
    this.events.clear()

    // 🚀 清空滑动窗口和聚合缓存
    this.metricsWindow.clear()
    this.aggregatedMetrics = undefined

    this.violationCallbacks = []
    this.metricsCallbacks = []

    // 清理性能标记
    this.clearMarks()
    this.clearMeasures()

    this.engine?.logger?.info('Performance manager destroyed')
  }
}

// 创建性能管理器
export function createPerformanceManager(
  thresholds?: PerformanceThresholds,
  engine?: Engine
): PerformanceManager {
  return new PerformanceManagerImpl(thresholds, engine)
}

// 性能装饰器
export function performance(name?: string) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value
    const ctorName = (target as { constructor?: { name?: string } }).constructor?.name ?? 'UnknownTarget'
    const eventName = name || `${ctorName}.${propertyKey}`

    descriptor.value = async function (...args: unknown[]) {
      const manager = getGlobalPerformanceManager()
      const eventId = manager.startEvent(PerformanceEventType.CUSTOM, eventName)

      try {
        const result = await originalMethod.apply(this, args)
        manager.endEvent(eventId)
        return result
      } catch (error) {
        manager.endEvent(eventId, {
          error: error instanceof Error ? error.message : String(error),
        })
        throw error
      }
    }

    return descriptor
  }
}

// 全局性能管理器
let globalPerformanceManager: PerformanceManager | undefined

export function getGlobalPerformanceManager(): PerformanceManager {
  if (!globalPerformanceManager) {
    globalPerformanceManager = createPerformanceManager()
  }
  return globalPerformanceManager
}

export function setGlobalPerformanceManager(manager: PerformanceManager): void {
  globalPerformanceManager = manager
}
