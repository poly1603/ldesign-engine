import type { Engine, PerformanceMonitor, Plugin } from '../types'

/**
 * 性能指标接口
 */
interface PerformanceMetric {
  name: string
  startTime: number
  endTime?: number
  duration?: number
  type: 'timing' | 'memory' | 'custom'
  data?: any
}

/**
 * 内存使用信息
 */
interface MemoryInfo {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
  timestamp: number
}

/**
 * 性能监控器实现
 */
export class PerformanceMonitorImpl implements PerformanceMonitor {
  private metrics = new Map<string, PerformanceMetric>()
  private marks = new Map<string, number>()
  private memorySnapshots: MemoryInfo[] = []
  private observers: PerformanceObserver[] = []
  private config: {
    enabled: boolean
    trackMemory: boolean
    trackTiming: boolean
    sampleRate: number
    maxMetrics: number
  }

  constructor(config: any = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      trackMemory: config.trackMemory ?? false,
      trackTiming: config.trackTiming ?? true,
      sampleRate: config.sampleRate ?? 1.0,
      maxMetrics: config.maxMetrics ?? 1000,
    }

    if (this.config.enabled) {
      this.setupPerformanceObservers()
      if (this.config.trackMemory) {
        this.startMemoryTracking()
      }
    }
  }

  /**
   * 开始性能计时
   */
  start(name: string): void {
    if (!this.config.enabled || !this.shouldSample()) {
      return
    }

    const startTime = performance.now()
    this.marks.set(name, startTime)

    const metric: PerformanceMetric = {
      name,
      startTime,
      type: 'timing',
    }

    this.addMetric(name, metric)
  }

  /**
   * 结束性能计时
   */
  end(name: string): number {
    if (!this.config.enabled) {
      return 0
    }

    const endTime = performance.now()
    const startTime = this.marks.get(name)

    if (startTime === undefined) {
      console.warn(`Performance timing '${name}' was not started`)
      return 0
    }

    const duration = endTime - startTime
    const metric = this.metrics.get(name)

    if (metric) {
      metric.endTime = endTime
      metric.duration = duration
    }

    this.marks.delete(name)
    return duration
  }

  /**
   * 创建性能标记
   */
  mark(name: string): void {
    if (!this.config.enabled || !this.shouldSample()) {
      return
    }

    const timestamp = performance.now()

    if (typeof performance.mark === 'function') {
      performance.mark(name)
    }

    this.marks.set(name, timestamp)
  }

  /**
   * 测量性能
   */
  measure(name: string, startMark?: string, endMark?: string): number {
    if (!this.config.enabled) {
      return 0
    }

    let startTime: number
    let endTime: number

    if (startMark) {
      startTime = this.marks.get(startMark) ?? 0
    }
 else {
      startTime = 0
    }

    if (endMark) {
      endTime = this.marks.get(endMark) ?? performance.now()
    }
 else {
      endTime = performance.now()
    }

    const duration = endTime - startTime

    if (typeof performance.measure === 'function' && startMark && endMark) {
      try {
        performance.measure(name, startMark, endMark)
      }
 catch (error) {
        console.warn(`Failed to create performance measure '${name}':`, error)
      }
    }

    const metric: PerformanceMetric = {
      name,
      startTime,
      endTime,
      duration,
      type: 'timing',
    }

    this.addMetric(name, metric)
    return duration
  }

  /**
   * 获取所有性能指标
   */
  getMetrics(): Record<string, any> {
    const result: Record<string, any> = {}

    // 计时指标
    const timingMetrics: Record<string, any> = {}
    const memoryMetrics: Record<string, any> = {}
    const customMetrics: Record<string, any> = {}

    for (const [name, metric] of this.metrics) {
      const data = {
        startTime: metric.startTime,
        endTime: metric.endTime,
        duration: metric.duration,
        data: metric.data,
      }

      switch (metric.type) {
        case 'timing':
          timingMetrics[name] = data
          break
        case 'memory':
          memoryMetrics[name] = data
          break
        case 'custom':
          customMetrics[name] = data
          break
      }
    }

    result.timing = timingMetrics
    result.memory = memoryMetrics
    result.custom = customMetrics

    // 添加内存快照
    if (this.memorySnapshots.length > 0) {
      result.memorySnapshots = this.memorySnapshots
    }

    // 添加浏览器性能指标
    if (typeof performance.getEntriesByType === 'function') {
      result.navigation = performance.getEntriesByType('navigation')
      result.resource = performance.getEntriesByType('resource')
      result.paint = performance.getEntriesByType('paint')
    }

    return result
  }

  /**
   * 清除所有指标
   */
  clear(): void {
    this.metrics.clear()
    this.marks.clear()
    this.memorySnapshots.length = 0

    if (typeof performance.clearMarks === 'function') {
      performance.clearMarks()
    }

    if (typeof performance.clearMeasures === 'function') {
      performance.clearMeasures()
    }
  }

  /**
   * 添加自定义指标
   */
  addCustomMetric(name: string, data: any): void {
    if (!this.config.enabled) {
      return
    }

    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      type: 'custom',
      data,
    }

    this.addMetric(name, metric)
  }

  /**
   * 获取内存使用情况
   */
  getMemoryUsage(): MemoryInfo | null {
    if (!this.config.trackMemory) {
      return null
    }

    if (typeof (performance as any).memory === 'object') {
      const memory = (performance as any).memory
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        timestamp: performance.now(),
      }
    }

    return null
  }

  /**
   * 获取性能摘要
   */
  getSummary(): {
    totalMetrics: number
    timingMetrics: number
    memorySnapshots: number
    averageDuration: number
    longestDuration: { name: string, duration: number } | null
  } {
    const timingMetrics = Array.from(this.metrics.values())
      .filter(m => m.type === 'timing' && m.duration !== undefined)

    const durations = timingMetrics.map(m => m.duration!)
    const averageDuration = durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0

    const longestMetric = timingMetrics.reduce((longest, current) => {
      if (!longest || (current.duration! > longest.duration!)) {
        return current
      }
      return longest
    }, null as PerformanceMetric | null)

    return {
      totalMetrics: this.metrics.size,
      timingMetrics: timingMetrics.length,
      memorySnapshots: this.memorySnapshots.length,
      averageDuration,
      longestDuration: longestMetric
? {
        name: longestMetric.name,
        duration: longestMetric.duration!,
      }
: null,
    }
  }

  /**
   * 添加指标
   */
  private addMetric(name: string, metric: PerformanceMetric): void {
    // 检查指标数量限制
    if (this.metrics.size >= this.config.maxMetrics) {
      // 删除最旧的指标
      const oldestKey = this.metrics.keys().next().value
      if (oldestKey) {
        this.metrics.delete(oldestKey)
      }
    }

    this.metrics.set(name, metric)
  }

  /**
   * 是否应该采样
   */
  private shouldSample(): boolean {
    return Math.random() < this.config.sampleRate
  }

  /**
   * 设置性能观察器
   */
  private setupPerformanceObservers(): void {
    if (typeof PerformanceObserver === 'undefined') {
      return
    }

    try {
      // 观察导航时间
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.addCustomMetric(`navigation:${entry.name}`, {
            type: entry.entryType,
            startTime: entry.startTime,
            duration: entry.duration,
          })
        }
      })
      navObserver.observe({ entryTypes: ['navigation'] })
      this.observers.push(navObserver)

      // 观察资源加载时间
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.addCustomMetric(`resource:${entry.name}`, {
            type: entry.entryType,
            startTime: entry.startTime,
            duration: entry.duration,
          })
        }
      })
      resourceObserver.observe({ entryTypes: ['resource'] })
      this.observers.push(resourceObserver)
    }
 catch (error) {
      console.warn('Failed to setup performance observers:', error)
    }
  }

  /**
   * 开始内存跟踪
   */
  private startMemoryTracking(): void {
    const trackMemory = () => {
      const memoryInfo = this.getMemoryUsage()
      if (memoryInfo) {
        this.memorySnapshots.push(memoryInfo)

        // 限制快照数量
        if (this.memorySnapshots.length > 100) {
          this.memorySnapshots.shift()
        }
      }
    }

    // 每5秒记录一次内存使用情况
    setInterval(trackMemory, 5000)

    // 立即记录一次
    trackMemory()
  }

  /**
   * 销毁性能监控器
   */
  destroy(): void {
    this.clear()

    // 断开性能观察器
    this.observers.forEach((observer) => {
      try {
        observer.disconnect()
      }
 catch (error) {
        console.warn('Error disconnecting performance observer:', error)
      }
    })
    this.observers.length = 0
  }
}

/**
 * 性能监控插件
 */
export const performancePlugin: Plugin = {
  name: 'performance',
  install(engine: Engine, options: any = {}) {
    const monitor = new PerformanceMonitorImpl(options)

    // 注入性能监控器
    engine.provide('performance', monitor)

    // 监控引擎生命周期
    engine.addMiddleware('beforeMount', async (_context, next) => {
      monitor.start('engine:mount')
      await next()
    })

    engine.addMiddleware('mounted', async (_context, next) => {
      monitor.end('engine:mount')
      await next()
    })

    engine.addMiddleware('beforeUnmount', async (_context, next) => {
      monitor.start('engine:unmount')
      await next()
    })

    engine.addMiddleware('unmounted', async (_context, next) => {
      monitor.end('engine:unmount')
      await next()
    })

    // 添加性能API到引擎
    Object.assign(engine, {
      startTiming: (name: string) => monitor.start(name),
      endTiming: (name: string) => monitor.end(name),
      markPerformance: (name: string) => monitor.mark(name),
      measurePerformance: (name: string, start?: string, end?: string) =>
        monitor.measure(name, start, end),
      getPerformanceMetrics: () => monitor.getMetrics(),
      getPerformanceSummary: () => monitor.getSummary(),
    })
  },

  uninstall(engine: Engine) {
    const monitor = engine.inject<PerformanceMonitorImpl>('performance')
    if (monitor) {
      monitor.destroy()
    }
  },
}
