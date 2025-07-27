# 性能优化

性能是现代应用程序的关键指标之一。@ldesign/engine 提供了多种性能优化策略和工具，帮助您构建高性能的应用程序。本章将详细介绍如何优化引擎的性能，包括内存管理、事件优化、状态优化、插件优化等方面。

## 性能监控

### 基础性能监控

```typescript
import { Engine } from '@ldesign/engine'

// 启用性能监控
const engine = new Engine({
  name: 'my-app',
  version: '1.0.0',
  performance: {
    monitoring: {
      enabled: true,

      // 监控指标
      metrics: {
        memory: true,
        cpu: true,
        events: true,
        state: true,
        plugins: true
      },

      // 采样率（0-1）
      sampleRate: 0.1,

      // 报告间隔（毫秒）
      reportInterval: 30000,

      // 性能预算
      budgets: {
        memoryUsage: 50 * 1024 * 1024, // 50MB
        eventProcessingTime: 100, // 100ms
        stateUpdateTime: 50, // 50ms
        pluginInitTime: 1000 // 1s
      }
    }
  }
})

// 监听性能事件
engine.on('performance:budget-exceeded', (metric) => {
  console.warn('性能预算超出:', metric)
  // {
  //   name: 'memoryUsage',
  //   current: 52428800,
  //   budget: 52428800,
  //   exceeded: 2428800
  // }
})

engine.on('performance:report', (report) => {
  console.log('性能报告:', report)
  // {
  //   timestamp: 1234567890,
  //   memory: { used: 45000000, total: 67108864 },
  //   events: { processed: 1234, avgTime: 2.5 },
  //   state: { updates: 567, avgTime: 1.2 },
  //   plugins: { active: 5, avgInitTime: 234 }
  // }
})
```

### 高级性能分析

```typescript
// 性能分析器
class PerformanceProfiler {
  private measurements = new Map<string, PerformanceMeasurement[]>()
  private observers = new Map<string, PerformanceObserver>()

  constructor(private engine: Engine) {
    this.setupPerformanceObservers()
  }

  // 开始性能测量
  startMeasurement(name: string, detail?: any): string {
    const id = `${name}_${Date.now()}_${Math.random()}`

    performance.mark(`${id}_start`)

    return id
  }

  // 结束性能测量
  endMeasurement(id: string): PerformanceMeasurement {
    const endMark = `${id}_end`
    const startMark = `${id}_start`

    performance.mark(endMark)
    performance.measure(id, startMark, endMark)

    const entry = performance.getEntriesByName(id)[0] as PerformanceMeasure
    const measurement: PerformanceMeasurement = {
      id,
      name: id.split('_')[0],
      duration: entry.duration,
      startTime: entry.startTime,
      endTime: entry.startTime + entry.duration,
      timestamp: Date.now()
    }

    // 存储测量结果
    const measurements = this.measurements.get(measurement.name) || []
    measurements.push(measurement)

    // 只保留最近1000个测量
    if (measurements.length > 1000) {
      measurements.splice(0, measurements.length - 1000)
    }

    this.measurements.set(measurement.name, measurements)

    // 清理性能标记
    performance.clearMarks(startMark)
    performance.clearMarks(endMark)
    performance.clearMeasures(id)

    return measurement
  }

  // 测量函数执行时间
  measureFunction<T>(
    name: string,
    fn: () => T,
    context?: any
  ): { result: T, measurement: PerformanceMeasurement } {
    const id = this.startMeasurement(name, context)

    try {
      const result = fn()
      const measurement = this.endMeasurement(id)

      return { result, measurement }
    }
 catch (error) {
      this.endMeasurement(id)
      throw error
    }
  }

  // 测量异步函数执行时间
  async measureAsyncFunction<T>(
    name: string,
    fn: () => Promise<T>,
    context?: any
  ): Promise<{ result: T, measurement: PerformanceMeasurement }> {
    const id = this.startMeasurement(name, context)

    try {
      const result = await fn()
      const measurement = this.endMeasurement(id)

      return { result, measurement }
    }
 catch (error) {
      this.endMeasurement(id)
      throw error
    }
  }

  // 获取性能统计
  getStats(name: string): PerformanceStats | null {
    const measurements = this.measurements.get(name)
    if (!measurements || measurements.length === 0) {
      return null
    }

    const durations = measurements.map(m => m.duration)
    const sorted = durations.sort((a, b) => a - b)

    return {
      name,
      count: measurements.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      avg: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      recent: measurements.slice(-10).map(m => m.duration)
    }
  }

  // 获取所有性能统计
  getAllStats(): PerformanceStats[] {
    return Array.from(this.measurements.keys())
      .map(name => this.getStats(name))
      .filter(stats => stats !== null) as PerformanceStats[]
  }

  private setupPerformanceObservers(): void {
    // 观察长任务
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // 超过50ms的任务
            this.engine.emit('performance:long-task', {
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name
            })
          }
        }
      })

      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] })
        this.observers.set('longtask', longTaskObserver)
      }
 catch (error) {
        console.warn('Long task observer not supported')
      }
    }

    // 观察导航性能
    if (performance.getEntriesByType) {
      const navigationEntries = performance.getEntriesByType('navigation')
      if (navigationEntries.length > 0) {
        const nav = navigationEntries[0] as PerformanceNavigationTiming

        this.engine.emit('performance:navigation', {
          domContentLoaded: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
          loadComplete: nav.loadEventEnd - nav.loadEventStart,
          firstPaint: this.getFirstPaint(),
          firstContentfulPaint: this.getFirstContentfulPaint()
        })
      }
    }
  }

  private getFirstPaint(): number {
    const paintEntries = performance.getEntriesByType('paint')
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint')
    return firstPaint ? firstPaint.startTime : 0
  }

  private getFirstContentfulPaint(): number {
    const paintEntries = performance.getEntriesByType('paint')
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')
    return fcp ? fcp.startTime : 0
  }

  // 清理资源
  dispose(): void {
    this.observers.forEach(observer => observer.disconnect())
    this.observers.clear()
    this.measurements.clear()
  }
}

// 使用性能分析器
const profiler = new PerformanceProfiler(engine)

// 测量插件初始化时间
engine.onPluginRegister(async (plugin) => {
  const { measurement } = await profiler.measureAsyncFunction(
    'plugin-init',
    () => plugin.initialize?.()
  )

  if (measurement.duration > 1000) {
    console.warn(`插件 ${plugin.name} 初始化时间过长: ${measurement.duration}ms`)
  }
})

// 测量状态更新时间
const originalSetState = engine.setState
engine.setState = function (path: string, value: any, options?: any) {
  const { result, measurement } = profiler.measureFunction(
    'state-update',
    () => originalSetState.call(this, path, value, options)
  )

  if (measurement.duration > 50) {
    console.warn(`状态更新 ${path} 时间过长: ${measurement.duration}ms`)
  }

  return result
}
```

## 内存优化

### 内存监控和管理

```typescript
// 内存管理器
class MemoryManager {
  private memoryUsage = new Map<string, number>()
  private gcCallbacks = new Set<() => void>()
  private monitoringInterval: number | null = null

  constructor(private engine: Engine) {
    this.startMonitoring()
    this.setupGCDetection()
  }

  // 开始内存监控
  private startMonitoring(): void {
    this.monitoringInterval = window.setInterval(() => {
      this.checkMemoryUsage()
    }, 10000) // 每10秒检查一次
  }

  // 检查内存使用情况
  private checkMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      const usage = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      }

      // 计算内存使用率
      const usagePercent = (usage.used / usage.limit) * 100

      this.engine.emit('memory:usage', {
        ...usage,
        usagePercent,
        timestamp: Date.now()
      })

      // 内存使用率过高时触发警告
      if (usagePercent > 80) {
        this.engine.emit('memory:high-usage', {
          ...usage,
          usagePercent
        })

        // 尝试垃圾回收
        this.requestGarbageCollection()
      }
    }
  }

  // 请求垃圾回收
  private requestGarbageCollection(): void {
    // 触发垃圾回收回调
    this.gcCallbacks.forEach((callback) => {
      try {
        callback()
      }
 catch (error) {
        console.error('垃圾回收回调执行失败:', error)
      }
    })

    // 强制垃圾回收（仅在开发环境）
    if (process.env.NODE_ENV === 'development' && 'gc' in window) {
      (window as any).gc()
    }
  }

  // 注册垃圾回收回调
  onGarbageCollection(callback: () => void): () => void {
    this.gcCallbacks.add(callback)

    return () => {
      this.gcCallbacks.delete(callback)
    }
  }

  // 设置垃圾回收检测
  private setupGCDetection(): void {
    // 使用 WeakRef 检测垃圾回收
    if ('WeakRef' in window) {
      const gcDetector = new WeakRef({})

      const checkGC = () => {
        if (gcDetector.deref() === undefined) {
          this.engine.emit('memory:gc-detected', {
            timestamp: Date.now()
          })
          return
        }

        setTimeout(checkGC, 1000)
      }

      checkGC()
    }
  }

  // 获取内存使用情况
  getMemoryUsage(): MemoryUsage | null {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        usagePercent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      }
    }

    return null
  }

  // 清理资源
  dispose(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }

    this.gcCallbacks.clear()
    this.memoryUsage.clear()
  }
}

// 使用内存管理器
const memoryManager = new MemoryManager(engine)

// 监听内存事件
engine.on('memory:high-usage', (usage) => {
  console.warn('内存使用率过高:', usage)

  // 清理缓存
  engine.clearCache()

  // 清理临时状态
  engine.clearTempState()

  // 通知插件清理资源
  engine.emit('cleanup:memory')
})

// 注册垃圾回收回调
memoryManager.onGarbageCollection(() => {
  console.log('检测到垃圾回收')

  // 清理弱引用
  engine.cleanupWeakReferences()

  // 清理事件监听器
  engine.cleanupEventListeners()
})
```

### 内存泄漏检测

```typescript
// 内存泄漏检测器
class MemoryLeakDetector {
  private objectCounts = new Map<string, number>()
  private snapshots: MemorySnapshot[] = []
  private detectionInterval: number | null = null

  constructor(private engine: Engine) {
    this.startDetection()
  }

  // 开始泄漏检测
  private startDetection(): void {
    this.detectionInterval = window.setInterval(() => {
      this.takeSnapshot()
      this.analyzeLeaks()
    }, 60000) // 每分钟检测一次
  }

  // 拍摄内存快照
  private takeSnapshot(): void {
    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      objects: this.countObjects(),
      memory: this.getMemoryUsage()
    }

    this.snapshots.push(snapshot)

    // 只保留最近10个快照
    if (this.snapshots.length > 10) {
      this.snapshots.shift()
    }
  }

  // 统计对象数量
  private countObjects(): Record<string, number> {
    const counts: Record<string, number> = {}

    // 统计引擎内部对象
    counts.plugins = engine.getPlugins().length
    counts.eventListeners = engine.getEventListenerCount()
    counts.stateWatchers = engine.getStateWatcherCount()
    counts.middlewares = engine.getMiddlewareCount()

    // 统计DOM节点（如果在浏览器环境）
    if (typeof document !== 'undefined') {
      counts.domNodes = document.querySelectorAll('*').length
    }

    return counts
  }

  // 获取内存使用情况
  private getMemoryUsage(): MemoryUsage | null {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        usagePercent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      }
    }

    return null
  }

  // 分析内存泄漏
  private analyzeLeaks(): void {
    if (this.snapshots.length < 3) {
      return // 需要至少3个快照才能分析趋势
    }

    const recent = this.snapshots.slice(-3)
    const leaks: MemoryLeak[] = []

    // 检查对象数量增长
    Object.keys(recent[0].objects).forEach((objectType) => {
      const counts = recent.map(s => s.objects[objectType] || 0)
      const growth = counts[2] - counts[0]
      const growthRate = growth / counts[0]

      if (growth > 10 && growthRate > 0.5) { // 增长超过10个且增长率超过50%
        leaks.push({
          type: 'object-growth',
          objectType,
          growth,
          growthRate,
          severity: growthRate > 1 ? 'high' : 'medium'
        })
      }
    })

    // 检查内存增长
    if (recent[0].memory && recent[2].memory) {
      const memoryGrowth = recent[2].memory.used - recent[0].memory.used
      const memoryGrowthRate = memoryGrowth / recent[0].memory.used

      if (memoryGrowth > 5 * 1024 * 1024 && memoryGrowthRate > 0.2) { // 增长超过5MB且增长率超过20%
        leaks.push({
          type: 'memory-growth',
          growth: memoryGrowth,
          growthRate: memoryGrowthRate,
          severity: memoryGrowthRate > 0.5 ? 'high' : 'medium'
        })
      }
    }

    // 报告泄漏
    if (leaks.length > 0) {
      this.engine.emit('memory:leak-detected', {
        leaks,
        snapshots: recent,
        timestamp: Date.now()
      })
    }
  }

  // 获取泄漏报告
  getLeakReport(): MemoryLeakReport {
    return {
      snapshots: this.snapshots,
      trends: this.calculateTrends(),
      recommendations: this.generateRecommendations()
    }
  }

  private calculateTrends(): MemoryTrend[] {
    if (this.snapshots.length < 2) {
      return []
    }

    const trends: MemoryTrend[] = []
    const first = this.snapshots[0]
    const last = this.snapshots[this.snapshots.length - 1]

    // 内存趋势
    if (first.memory && last.memory) {
      trends.push({
        metric: 'memory',
        direction: last.memory.used > first.memory.used ? 'increasing' : 'decreasing',
        change: last.memory.used - first.memory.used,
        changePercent: ((last.memory.used - first.memory.used) / first.memory.used) * 100
      })
    }

    // 对象数量趋势
    Object.keys(first.objects).forEach((objectType) => {
      const firstCount = first.objects[objectType] || 0
      const lastCount = last.objects[objectType] || 0

      if (firstCount > 0) {
        trends.push({
          metric: objectType,
          direction: lastCount > firstCount ? 'increasing' : 'decreasing',
          change: lastCount - firstCount,
          changePercent: ((lastCount - firstCount) / firstCount) * 100
        })
      }
    })

    return trends
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = []
    const trends = this.calculateTrends()

    trends.forEach((trend) => {
      if (trend.direction === 'increasing' && trend.changePercent > 50) {
        switch (trend.metric) {
          case 'eventListeners':
            recommendations.push('检查事件监听器是否正确移除')
            break
          case 'stateWatchers':
            recommendations.push('检查状态监听器是否正确清理')
            break
          case 'plugins':
            recommendations.push('检查插件是否重复注册')
            break
          case 'domNodes':
            recommendations.push('检查DOM节点是否正确清理')
            break
          case 'memory':
            recommendations.push('检查是否存在循环引用或大对象未释放')
            break
        }
      }
    })

    return recommendations
  }

  // 清理资源
  dispose(): void {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval)
      this.detectionInterval = null
    }

    this.snapshots = []
    this.objectCounts.clear()
  }
}

// 使用内存泄漏检测器
const leakDetector = new MemoryLeakDetector(engine)

// 监听泄漏检测事件
engine.on('memory:leak-detected', (data) => {
  console.warn('检测到内存泄漏:', data)

  // 生成详细报告
  const report = leakDetector.getLeakReport()
  console.log('内存泄漏报告:', report)

  // 发送到监控服务
  sendMemoryLeakReport(report)
})
```

## 事件系统优化

### 事件性能优化

```typescript
// 事件性能优化器
class EventPerformanceOptimizer {
  private eventStats = new Map<string, EventStats>()
  private throttledEvents = new Map<string, number>()
  private debouncedEvents = new Map<string, number>()

  constructor(private engine: Engine) {
    this.setupEventOptimization()
  }

  private setupEventOptimization(): void {
    // 包装事件发射器
    const originalEmit = this.engine.emit
    this.engine.emit = (eventName: string, ...args: any[]) => {
      const startTime = performance.now()

      // 检查是否需要节流
      if (this.shouldThrottle(eventName)) {
        return false
      }

      // 执行原始事件发射
      const result = originalEmit.call(this.engine, eventName, ...args)

      // 记录性能统计
      const duration = performance.now() - startTime
      this.recordEventStats(eventName, duration)

      return result
    }

    // 包装事件监听器
    const originalOn = this.engine.on
    this.engine.on = (eventName: string, listener: Function) => {
      const wrappedListener = (...args: any[]) => {
        const startTime = performance.now()

        try {
          const result = listener(...args)

          // 记录监听器执行时间
          const duration = performance.now() - startTime
          this.recordListenerStats(eventName, duration)

          return result
        }
 catch (error) {
          const duration = performance.now() - startTime
          this.recordListenerStats(eventName, duration, error)
          throw error
        }
      }

      return originalOn.call(this.engine, eventName, wrappedListener)
    }
  }

  // 检查是否需要节流
  private shouldThrottle(eventName: string): boolean {
    const now = Date.now()
    const lastEmit = this.throttledEvents.get(eventName)

    // 高频事件节流配置
    const throttleConfig = {
      'scroll': 16, // 60fps
      'resize': 16,
      'mousemove': 16,
      'touchmove': 16,
      'state:change': 10,
      'ui:update': 10
    }

    const throttleDelay = throttleConfig[eventName]
    if (!throttleDelay) {
      return false
    }

    if (lastEmit && now - lastEmit < throttleDelay) {
      return true
    }

    this.throttledEvents.set(eventName, now)
    return false
  }

  // 记录事件统计
  private recordEventStats(eventName: string, duration: number): void {
    const stats = this.eventStats.get(eventName) || {
      name: eventName,
      count: 0,
      totalDuration: 0,
      avgDuration: 0,
      maxDuration: 0,
      minDuration: Infinity,
      recentDurations: []
    }

    stats.count++
    stats.totalDuration += duration
    stats.avgDuration = stats.totalDuration / stats.count
    stats.maxDuration = Math.max(stats.maxDuration, duration)
    stats.minDuration = Math.min(stats.minDuration, duration)

    stats.recentDurations.push(duration)
    if (stats.recentDurations.length > 100) {
      stats.recentDurations.shift()
    }

    this.eventStats.set(eventName, stats)

    // 检查性能问题
    if (duration > 50) { // 超过50ms
      this.engine.emit('performance:slow-event', {
        eventName,
        duration,
        threshold: 50
      })
    }
  }

  // 记录监听器统计
  private recordListenerStats(eventName: string, duration: number, error?: Error): void {
    if (duration > 100) { // 监听器执行超过100ms
      this.engine.emit('performance:slow-listener', {
        eventName,
        duration,
        error: error?.message,
        threshold: 100
      })
    }
  }

  // 获取事件性能报告
  getEventPerformanceReport(): EventPerformanceReport {
    const events = Array.from(this.eventStats.values())

    return {
      totalEvents: events.reduce((sum, e) => sum + e.count, 0),
      slowEvents: events.filter(e => e.avgDuration > 10),
      topEvents: events
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      performanceIssues: this.detectPerformanceIssues(events)
    }
  }

  private detectPerformanceIssues(events: EventStats[]): PerformanceIssue[] {
    const issues: PerformanceIssue[] = []

    events.forEach((event) => {
      // 检查平均执行时间过长
      if (event.avgDuration > 20) {
        issues.push({
          type: 'slow-event',
          eventName: event.name,
          severity: event.avgDuration > 50 ? 'high' : 'medium',
          description: `事件 ${event.name} 平均执行时间 ${event.avgDuration.toFixed(2)}ms`,
          recommendation: '考虑优化事件处理逻辑或使用异步处理'
        })
      }

      // 检查事件频率过高
      if (event.count > 1000) {
        const recentCount = event.recentDurations.length
        if (recentCount > 50) { // 最近100次中有50次以上
          issues.push({
            type: 'high-frequency-event',
            eventName: event.name,
            severity: 'medium',
            description: `事件 ${event.name} 触发频率过高 (${event.count} 次)`,
            recommendation: '考虑使用节流或防抖优化'
          })
        }
      }
    })

    return issues
  }

  // 优化事件处理
  optimizeEvent(eventName: string, options: EventOptimizationOptions): void {
    if (options.throttle) {
      this.throttledEvents.set(eventName, 0)
    }

    if (options.debounce) {
      this.setupDebounce(eventName, options.debounce)
    }

    if (options.async) {
      this.makeEventAsync(eventName)
    }
  }

  private setupDebounce(eventName: string, delay: number): void {
    const originalEmit = this.engine.emit
    let timeoutId: number | null = null

    this.engine.emit = (name: string, ...args: any[]) => {
      if (name === eventName) {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }

        timeoutId = window.setTimeout(() => {
          originalEmit.call(this.engine, name, ...args)
          timeoutId = null
        }, delay)

        return true
      }

      return originalEmit.call(this.engine, name, ...args)
    }
  }

  private makeEventAsync(eventName: string): void {
    const originalEmit = this.engine.emit

    this.engine.emit = (name: string, ...args: any[]) => {
      if (name === eventName) {
        // 使用 setTimeout 使事件异步
        setTimeout(() => {
          originalEmit.call(this.engine, name, ...args)
        }, 0)

        return true
      }

      return originalEmit.call(this.engine, name, ...args)
    }
  }
}

// 使用事件性能优化器
const eventOptimizer = new EventPerformanceOptimizer(engine)

// 优化高频事件
eventOptimizer.optimizeEvent('scroll', { throttle: 16 })
eventOptimizer.optimizeEvent('resize', { throttle: 16 })
eventOptimizer.optimizeEvent('search:input', { debounce: 300 })
eventOptimizer.optimizeEvent('data:process', { async: true })

// 监听性能问题
engine.on('performance:slow-event', (data) => {
  console.warn('慢事件检测:', data)
})

engine.on('performance:slow-listener', (data) => {
  console.warn('慢监听器检测:', data)
})

// 定期生成性能报告
setInterval(() => {
  const report = eventOptimizer.getEventPerformanceReport()
  console.log('事件性能报告:', report)
}, 60000) // 每分钟
```

## 状态优化

### 状态更新优化

```typescript
// 状态性能优化器
class StatePerformanceOptimizer {
  private updateQueue: StateUpdate[] = []
  private batchTimeout: number | null = null
  private updateStats = new Map<string, StateUpdateStats>()

  constructor(private engine: Engine) {
    this.setupStateOptimization()
  }

  private setupStateOptimization(): void {
    // 包装状态设置方法
    const originalSetState = this.engine.setState
    this.engine.setState = (path: string, value: any, options?: any) => {
      const startTime = performance.now()

      // 检查是否需要批量更新
      if (options?.batch !== false) {
        this.queueUpdate(path, value, options)
        return
      }

      // 执行原始状态设置
      const result = originalSetState.call(this.engine, path, value, options)

      // 记录性能统计
      const duration = performance.now() - startTime
      this.recordUpdateStats(path, duration)

      return result
    }

    // 包装批量更新方法
    const originalUpdateState = this.engine.updateState
    this.engine.updateState = (updates: Record<string, any>, options?: any) => {
      const startTime = performance.now()

      // 优化更新顺序
      const optimizedUpdates = this.optimizeUpdateOrder(updates)

      // 执行原始批量更新
      const result = originalUpdateState.call(this.engine, optimizedUpdates, options)

      // 记录性能统计
      const duration = performance.now() - startTime
      Object.keys(updates).forEach((path) => {
        this.recordUpdateStats(path, duration / Object.keys(updates).length)
      })

      return result
    }
  }

  // 队列更新
  private queueUpdate(path: string, value: any, options?: any): void {
    this.updateQueue.push({ path, value, options, timestamp: Date.now() })

    // 设置批量处理超时
    if (!this.batchTimeout) {
      this.batchTimeout = window.setTimeout(() => {
        this.processBatchUpdates()
      }, 16) // 下一个动画帧
    }
  }

  // 处理批量更新
  private processBatchUpdates(): void {
    if (this.updateQueue.length === 0) {
      this.batchTimeout = null
      return
    }

    const updates = this.updateQueue.splice(0)
    this.batchTimeout = null

    // 合并相同路径的更新
    const mergedUpdates = this.mergeUpdates(updates)

    // 优化更新顺序
    const optimizedUpdates = this.optimizeUpdateOrder(mergedUpdates)

    // 执行批量更新
    const startTime = performance.now()
    this.engine.updateState(optimizedUpdates, { batch: false })
    const duration = performance.now() - startTime

    // 记录批量更新统计
    this.engine.emit('performance:batch-update', {
      updateCount: Object.keys(optimizedUpdates).length,
      duration,
      efficiency: Object.keys(optimizedUpdates).length / updates.length
    })
  }

  // 合并更新
  private mergeUpdates(updates: StateUpdate[]): Record<string, any> {
    const merged: Record<string, any> = {}

    updates.forEach((update) => {
      // 只保留最后一次更新
      merged[update.path] = update.value
    })

    return merged
  }

  // 优化更新顺序
  private optimizeUpdateOrder(updates: Record<string, any>): Record<string, any> {
    const paths = Object.keys(updates)

    // 按路径深度排序，先更新父级状态
    const sortedPaths = paths.sort((a, b) => {
      const depthA = a.split('.').length
      const depthB = b.split('.').length
      return depthA - depthB
    })

    const optimized: Record<string, any> = {}
    sortedPaths.forEach((path) => {
      optimized[path] = updates[path]
    })

    return optimized
  }

  // 记录更新统计
  private recordUpdateStats(path: string, duration: number): void {
    const stats = this.updateStats.get(path) || {
      path,
      count: 0,
      totalDuration: 0,
      avgDuration: 0,
      maxDuration: 0,
      minDuration: Infinity,
      recentDurations: []
    }

    stats.count++
    stats.totalDuration += duration
    stats.avgDuration = stats.totalDuration / stats.count
    stats.maxDuration = Math.max(stats.maxDuration, duration)
    stats.minDuration = Math.min(stats.minDuration, duration)

    stats.recentDurations.push(duration)
    if (stats.recentDurations.length > 50) {
      stats.recentDurations.shift()
    }

    this.updateStats.set(path, stats)

    // 检查性能问题
    if (duration > 20) { // 超过20ms
      this.engine.emit('performance:slow-state-update', {
        path,
        duration,
        threshold: 20
      })
    }
  }

  // 获取状态性能报告
  getStatePerformanceReport(): StatePerformanceReport {
    const states = Array.from(this.updateStats.values())

    return {
      totalUpdates: states.reduce((sum, s) => sum + s.count, 0),
      slowUpdates: states.filter(s => s.avgDuration > 5),
      frequentUpdates: states
        .filter(s => s.count > 100)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      optimizationSuggestions: this.generateOptimizationSuggestions(states)
    }
  }

  private generateOptimizationSuggestions(states: StateUpdateStats[]): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = []

    states.forEach((state) => {
      // 检查频繁更新的状态
      if (state.count > 500) {
        suggestions.push({
          type: 'frequent-updates',
          path: state.path,
          description: `状态 ${state.path} 更新过于频繁 (${state.count} 次)`,
          recommendation: '考虑使用防抖或节流，或者重新设计状态结构'
        })
      }

      // 检查慢更新的状态
      if (state.avgDuration > 10) {
        suggestions.push({
          type: 'slow-updates',
          path: state.path,
          description: `状态 ${state.path} 更新耗时过长 (平均 ${state.avgDuration.toFixed(2)}ms)`,
          recommendation: '检查状态验证逻辑和监听器，考虑异步处理'
        })
      }
    })

    return suggestions
  }
}

// 使用状态性能优化器
const stateOptimizer = new StatePerformanceOptimizer(engine)

// 监听性能问题
engine.on('performance:slow-state-update', (data) => {
  console.warn('慢状态更新检测:', data)
})

engine.on('performance:batch-update', (data) => {
  console.log('批量更新性能:', data)
})

// 定期生成性能报告
setInterval(() => {
  const report = stateOptimizer.getStatePerformanceReport()
  console.log('状态性能报告:', report)
}, 60000) // 每分钟
```

## 插件优化

### 插件懒加载

```typescript
// 插件懒加载管理器
class PluginLazyLoader {
  private lazyPlugins = new Map<string, LazyPluginConfig>()
  private loadedPlugins = new Set<string>()
  private loadingPromises = new Map<string, Promise<any>>()

  constructor(private engine: Engine) {
    this.setupLazyLoading()
  }

  // 注册懒加载插件
  registerLazyPlugin(config: LazyPluginConfig): void {
    this.lazyPlugins.set(config.name, config)

    // 注册插件占位符
    this.engine.registerPlugin({
      name: config.name,
      version: config.version,
      lazy: true,

      // 代理方法调用
      [Symbol.for('proxy')]: new Proxy({}, {
        get: (target, prop) => {
          if (typeof prop === 'string') {
            return (...args: any[]) => this.loadAndCall(config.name, prop, ...args)
          }
        }
      })
    })
  }

  // 加载并调用插件方法
  private async loadAndCall(pluginName: string, method: string, ...args: any[]): Promise<any> {
    const plugin = await this.loadPlugin(pluginName)

    if (plugin && typeof plugin[method] === 'function') {
      return plugin[method](...args)
    }

    throw new Error(`插件 ${pluginName} 不存在方法 ${method}`)
  }

  // 加载插件
  async loadPlugin(pluginName: string): Promise<any> {
    if (this.loadedPlugins.has(pluginName)) {
      return this.engine.getPlugin(pluginName)
    }

    // 检查是否正在加载
    if (this.loadingPromises.has(pluginName)) {
      return this.loadingPromises.get(pluginName)
    }

    const config = this.lazyPlugins.get(pluginName)
    if (!config) {
      throw new Error(`未找到懒加载插件配置: ${pluginName}`)
    }

    // 开始加载
    const loadingPromise = this.doLoadPlugin(config)
    this.loadingPromises.set(pluginName, loadingPromise)

    try {
      const plugin = await loadingPromise
      this.loadedPlugins.add(pluginName)
      this.loadingPromises.delete(pluginName)

      // 替换占位符插件
      this.engine.replacePlugin(pluginName, plugin)

      return plugin
    }
 catch (error) {
      this.loadingPromises.delete(pluginName)
      throw error
    }
  }

  // 执行插件加载
  private async doLoadPlugin(config: LazyPluginConfig): Promise<any> {
    const startTime = performance.now()

    try {
      let plugin: any

      if (config.loader) {
        // 使用自定义加载器
        plugin = await config.loader()
      }
 else if (config.url) {
        // 从URL加载
        plugin = await this.loadFromUrl(config.url)
      }
 else if (config.module) {
        // 动态导入模块
        const module = await import(config.module)
        plugin = module.default || module
      }
 else {
        throw new Error(`插件 ${config.name} 缺少加载配置`)
      }

      // 初始化插件
      if (plugin.initialize) {
        await plugin.initialize()
      }

      const loadTime = performance.now() - startTime

      this.engine.emit('plugin:lazy-loaded', {
        name: config.name,
        loadTime,
        size: this.estimatePluginSize(plugin)
      })

      return plugin
    }
 catch (error) {
      const loadTime = performance.now() - startTime

      this.engine.emit('plugin:lazy-load-failed', {
        name: config.name,
        error: error.message,
        loadTime
      })

      throw error
    }
  }

  // 从URL加载插件
  private async loadFromUrl(url: string): Promise<any> {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`加载插件失败: ${response.status} ${response.statusText}`)
    }

    const code = await response.text()

    // 创建沙箱环境
    const sandbox = {
      console,
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      fetch,
      URL,
      URLSearchParams
    }

    // 执行插件代码
    const func = new Function(...Object.keys(sandbox), code)
    return func(...Object.values(sandbox))
  }

  // 估算插件大小
  private estimatePluginSize(plugin: any): number {
    try {
      return JSON.stringify(plugin).length
    }
 catch {
      return 0
    }
  }

  // 预加载插件
  async preloadPlugin(pluginName: string): Promise<void> {
    const config = this.lazyPlugins.get(pluginName)
    if (!config || this.loadedPlugins.has(pluginName)) {
      return
    }

    // 在空闲时间预加载
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        this.loadPlugin(pluginName).catch((error) => {
          console.warn(`预加载插件 ${pluginName} 失败:`, error)
        })
      })
    }
 else {
      setTimeout(() => {
        this.loadPlugin(pluginName).catch((error) => {
          console.warn(`预加载插件 ${pluginName} 失败:`, error)
        })
      }, 0)
    }
  }

  // 卸载插件
  unloadPlugin(pluginName: string): void {
    if (this.loadedPlugins.has(pluginName)) {
      const plugin = this.engine.getPlugin(pluginName)

      // 清理插件资源
      if (plugin && plugin.dispose) {
        plugin.dispose()
      }

      // 移除插件
      this.engine.unregisterPlugin(pluginName)
      this.loadedPlugins.delete(pluginName)

      this.engine.emit('plugin:unloaded', {
        name: pluginName,
        timestamp: Date.now()
      })
    }
  }

  // 获取加载统计
  getLoadingStats(): PluginLoadingStats {
    const totalPlugins = this.lazyPlugins.size
    const loadedCount = this.loadedPlugins.size
    const loadingCount = this.loadingPromises.size

    return {
      total: totalPlugins,
      loaded: loadedCount,
      loading: loadingCount,
      pending: totalPlugins - loadedCount - loadingCount,
      loadedPlugins: Array.from(this.loadedPlugins),
      pendingPlugins: Array.from(this.lazyPlugins.keys())
        .filter(name => !this.loadedPlugins.has(name) && !this.loadingPromises.has(name))
    }
  }
}

// 使用插件懒加载
const lazyLoader = new PluginLazyLoader(engine)

// 注册懒加载插件
lazyLoader.registerLazyPlugin({
  name: 'chart-plugin',
  version: '1.0.0',
  module: './plugins/chart-plugin.js',
  preload: false
})

lazyLoader.registerLazyPlugin({
  name: 'analytics-plugin',
  version: '1.0.0',
  url: 'https://cdn.example.com/analytics-plugin.js',
  preload: true
})

lazyLoader.registerLazyPlugin({
  name: 'custom-plugin',
  version: '1.0.0',
  loader: async () => {
    // 自定义加载逻辑
    const module = await import('./plugins/custom-plugin')
    return new module.CustomPlugin()
  }
})

// 监听插件加载事件
engine.on('plugin:lazy-loaded', (data) => {
  console.log(`插件 ${data.name} 加载完成，耗时 ${data.loadTime}ms，大小 ${data.size} 字节`)
})

engine.on('plugin:lazy-load-failed', (data) => {
  console.error(`插件 ${data.name} 加载失败:`, data.error)
})

// 预加载重要插件
lazyLoader.preloadPlugin('analytics-plugin')

// 获取加载统计
setInterval(() => {
  const stats = lazyLoader.getLoadingStats()
  console.log('插件加载统计:', stats)
}, 30000) // 每30秒
```

## 最佳实践

### 1. 性能监控策略

```typescript
// 性能监控策略
const PERFORMANCE_STRATEGIES = {
  development: {
    monitoring: true,
    profiling: true,
    memoryTracking: true,
    eventTracking: true,
    reportInterval: 10000 // 10秒
  },

  staging: {
    monitoring: true,
    profiling: false,
    memoryTracking: true,
    eventTracking: false,
    reportInterval: 30000 // 30秒
  },

  production: {
    monitoring: true,
    profiling: false,
    memoryTracking: false,
    eventTracking: false,
    reportInterval: 60000 // 1分钟
  }
}

// 根据环境配置性能监控
const environment = process.env.NODE_ENV || 'development'
const strategy = PERFORMANCE_STRATEGIES[environment]

engine.configurePerformance({
  monitoring: strategy.monitoring,
  profiling: strategy.profiling,
  memoryTracking: strategy.memoryTracking,
  eventTracking: strategy.eventTracking,
  reportInterval: strategy.reportInterval
})
```

### 2. 性能预算管理

```typescript
// 性能预算配置
const PERFORMANCE_BUDGETS = {
  // 内存预算
  memory: {
    total: 100 * 1024 * 1024, // 100MB
    plugins: 20 * 1024 * 1024, // 20MB
    state: 10 * 1024 * 1024, // 10MB
    events: 5 * 1024 * 1024 // 5MB
  },

  // 时间预算
  timing: {
    pluginInit: 1000, // 1秒
    eventProcessing: 50, // 50ms
    stateUpdate: 20, // 20ms
    rendering: 16 // 16ms (60fps)
  },

  // 数量预算
  counts: {
    plugins: 50,
    eventListeners: 1000,
    stateWatchers: 500,
    middlewares: 20
  }
}

// 设置性能预算
engine.setPerformanceBudgets(PERFORMANCE_BUDGETS)

// 监听预算超出事件
engine.on('performance:budget-exceeded', (budget) => {
  console.warn(`性能预算超出: ${budget.category}.${budget.metric}`, budget)

  // 根据超出类型采取措施
  switch (budget.category) {
    case 'memory':
      engine.emit('cleanup:memory')
      break
    case 'timing':
      engine.emit('optimize:performance')
      break
    case 'counts':
      engine.emit('cleanup:resources')
      break
  }
})
```

### 3. 性能优化检查清单

```typescript
// 性能优化检查清单
class PerformanceChecklist {
  static async runChecks(engine: Engine): Promise<PerformanceCheckResult[]> {
    const results: PerformanceCheckResult[] = []

    // 检查内存使用
    results.push(await this.checkMemoryUsage(engine))

    // 检查事件性能
    results.push(await this.checkEventPerformance(engine))

    // 检查状态性能
    results.push(await this.checkStatePerformance(engine))

    // 检查插件性能
    results.push(await this.checkPluginPerformance(engine))

    // 检查资源清理
    results.push(await this.checkResourceCleanup(engine))

    return results
  }

  private static async checkMemoryUsage(engine: Engine): Promise<PerformanceCheckResult> {
    const memoryUsage = engine.getMemoryUsage()

    if (!memoryUsage) {
      return {
        name: 'memory-usage',
        status: 'warning',
        message: '无法获取内存使用信息',
        recommendations: ['在支持的浏览器中运行以获取内存信息']
      }
    }

    if (memoryUsage.usagePercent > 80) {
      return {
        name: 'memory-usage',
        status: 'error',
        message: `内存使用率过高: ${memoryUsage.usagePercent.toFixed(1)}%`,
        recommendations: [
          '清理不必要的缓存',
          '移除未使用的事件监听器',
          '检查内存泄漏',
          '考虑使用懒加载'
        ]
      }
    }

    return {
      name: 'memory-usage',
      status: 'success',
      message: `内存使用正常: ${memoryUsage.usagePercent.toFixed(1)}%`
    }
  }

  private static async checkEventPerformance(engine: Engine): Promise<PerformanceCheckResult> {
    const eventStats = engine.getEventStats()
    const slowEvents = eventStats.filter(e => e.avgDuration > 20)

    if (slowEvents.length > 0) {
      return {
        name: 'event-performance',
        status: 'warning',
        message: `发现 ${slowEvents.length} 个慢事件`,
        recommendations: [
          '优化事件处理逻辑',
          '使用异步处理',
          '考虑事件节流或防抖',
          '减少事件监听器数量'
        ],
        details: slowEvents.map(e => `${e.name}: ${e.avgDuration.toFixed(2)}ms`)
      }
    }

    return {
      name: 'event-performance',
      status: 'success',
      message: '事件性能正常'
    }
  }

  private static async checkStatePerformance(engine: Engine): Promise<PerformanceCheckResult> {
    const stateStats = engine.getStateStats()
    const slowUpdates = stateStats.filter(s => s.avgDuration > 10)

    if (slowUpdates.length > 0) {
      return {
        name: 'state-performance',
        status: 'warning',
        message: `发现 ${slowUpdates.length} 个慢状态更新`,
        recommendations: [
          '优化状态验证逻辑',
          '减少状态监听器',
          '使用批量更新',
          '考虑状态结构重构'
        ],
        details: slowUpdates.map(s => `${s.path}: ${s.avgDuration.toFixed(2)}ms`)
      }
    }

    return {
      name: 'state-performance',
      status: 'success',
      message: '状态性能正常'
    }
  }

  private static async checkPluginPerformance(engine: Engine): Promise<PerformanceCheckResult> {
    const plugins = engine.getPlugins()
    const slowPlugins = plugins.filter(p => p.initTime > 1000)

    if (slowPlugins.length > 0) {
      return {
        name: 'plugin-performance',
        status: 'warning',
        message: `发现 ${slowPlugins.length} 个慢插件`,
        recommendations: [
          '使用懒加载',
          '优化插件初始化',
          '减少插件依赖',
          '考虑插件拆分'
        ],
        details: slowPlugins.map(p => `${p.name}: ${p.initTime}ms`)
      }
    }

    return {
      name: 'plugin-performance',
      status: 'success',
      message: '插件性能正常'
    }
  }

  private static async checkResourceCleanup(engine: Engine): Promise<PerformanceCheckResult> {
    const issues: string[] = []

    // 检查事件监听器数量
    const listenerCount = engine.getEventListenerCount()
    if (listenerCount > 1000) {
      issues.push(`事件监听器过多: ${listenerCount}`)
    }

    // 检查状态监听器数量
    const stateWatcherCount = engine.getStateWatcherCount()
    if (stateWatcherCount > 500) {
      issues.push(`状态监听器过多: ${stateWatcherCount}`)
    }

    // 检查插件数量
    const pluginCount = engine.getPlugins().length
    if (pluginCount > 50) {
      issues.push(`插件过多: ${pluginCount}`)
    }

    if (issues.length > 0) {
      return {
        name: 'resource-cleanup',
        status: 'warning',
        message: '发现资源清理问题',
        recommendations: [
          '定期清理未使用的监听器',
          '移除不必要的插件',
          '实现自动资源清理',
          '使用弱引用避免内存泄漏'
        ],
        details: issues
      }
    }

    return {
      name: 'resource-cleanup',
      status: 'success',
      message: '资源清理正常'
    }
  }
}

// 使用性能检查清单
setInterval(async () => {
  const results = await PerformanceChecklist.runChecks(engine)

  results.forEach((result) => {
    if (result.status === 'error') {
      console.error(`性能检查失败: ${result.name}`, result)
    }
 else if (result.status === 'warning') {
      console.warn(`性能检查警告: ${result.name}`, result)
    }
 else {
      console.log(`性能检查通过: ${result.name}`, result.message)
    }
  })
}, 300000) // 每5分钟检查一次
```

### 4. 性能优化工具

```typescript
// 性能优化工具集
class PerformanceOptimizer {
  constructor(private engine: Engine) {}

  // 自动优化
  async autoOptimize(): Promise<OptimizationResult> {
    const results: OptimizationAction[] = []

    // 优化事件系统
    results.push(...await this.optimizeEvents())

    // 优化状态管理
    results.push(...await this.optimizeState())

    // 优化插件
    results.push(...await this.optimizePlugins())

    // 清理资源
    results.push(...await this.cleanupResources())

    return {
      timestamp: Date.now(),
      actions: results,
      totalOptimizations: results.length,
      estimatedImprovement: this.calculateImprovement(results)
    }
  }

  private async optimizeEvents(): Promise<OptimizationAction[]> {
    const actions: OptimizationAction[] = []
    const eventStats = this.engine.getEventStats()

    // 优化高频事件
    const highFrequencyEvents = eventStats.filter(e => e.count > 1000)
    highFrequencyEvents.forEach((event) => {
      if (!event.name.includes('throttled')) {
        this.engine.throttleEvent(event.name, 16)
        actions.push({
          type: 'throttle-event',
          target: event.name,
          description: `为高频事件 ${event.name} 添加节流`,
          impact: 'medium'
        })
      }
    })

    // 移除无用的事件监听器
    const unusedListeners = this.engine.getUnusedEventListeners()
    unusedListeners.forEach((listener) => {
      this.engine.removeEventListener(listener.eventName, listener.id)
      actions.push({
        type: 'remove-listener',
        target: listener.eventName,
        description: `移除未使用的事件监听器`,
        impact: 'low'
      })
    })

    return actions
  }

  private async optimizeState(): Promise<OptimizationAction[]> {
    const actions: OptimizationAction[] = []
    const stateStats = this.engine.getStateStats()

    // 启用批量更新
    const frequentUpdates = stateStats.filter(s => s.count > 100)
    frequentUpdates.forEach((state) => {
      this.engine.enableBatchUpdates(state.path)
      actions.push({
        type: 'enable-batch-updates',
        target: state.path,
        description: `为频繁更新的状态 ${state.path} 启用批量更新`,
        impact: 'medium'
      })
    })

    // 清理临时状态
    const tempStates = this.engine.getTempStates()
    if (tempStates.length > 0) {
      this.engine.clearTempStates()
      actions.push({
        type: 'clear-temp-state',
        target: 'temp-states',
        description: `清理 ${tempStates.length} 个临时状态`,
        impact: 'low'
      })
    }

    return actions
  }

  private async optimizePlugins(): Promise<OptimizationAction[]> {
    const actions: OptimizationAction[] = []
    const plugins = this.engine.getPlugins()

    // 启用插件懒加载
    const heavyPlugins = plugins.filter(p => p.size > 100 * 1024) // 大于100KB
    heavyPlugins.forEach((plugin) => {
      if (!plugin.lazy) {
        this.engine.enableLazyLoading(plugin.name)
        actions.push({
          type: 'enable-lazy-loading',
          target: plugin.name,
          description: `为大型插件 ${plugin.name} 启用懒加载`,
          impact: 'high'
        })
      }
    })

    // 卸载未使用的插件
    const unusedPlugins = plugins.filter(p => p.lastUsed < Date.now() - 24 * 60 * 60 * 1000) // 24小时未使用
    unusedPlugins.forEach((plugin) => {
      this.engine.unloadPlugin(plugin.name)
      actions.push({
        type: 'unload-plugin',
        target: plugin.name,
        description: `卸载未使用的插件 ${plugin.name}`,
        impact: 'medium'
      })
    })

    return actions
  }

  private async cleanupResources(): Promise<OptimizationAction[]> {
    const actions: OptimizationAction[] = []

    // 清理缓存
    const cacheSize = this.engine.getCacheSize()
    if (cacheSize > 10 * 1024 * 1024) { // 大于10MB
      this.engine.clearCache()
      actions.push({
        type: 'clear-cache',
        target: 'cache',
        description: `清理 ${(cacheSize / 1024 / 1024).toFixed(2)}MB 缓存`,
        impact: 'medium'
      })
    }

    // 触发垃圾回收
    if ('gc' in window && process.env.NODE_ENV === 'development') {
      (window as any).gc()
      actions.push({
        type: 'garbage-collection',
        target: 'memory',
        description: '触发垃圾回收',
        impact: 'low'
      })
    }

    return actions
  }

  private calculateImprovement(actions: OptimizationAction[]): number {
    const impactWeights = {
      low: 1,
      medium: 3,
      high: 5
    }

    return actions.reduce((total, action) => {
      return total + impactWeights[action.impact]
    }, 0)
  }
}

// 使用性能优化工具
const optimizer = new PerformanceOptimizer(engine)

// 定期自动优化
setInterval(async () => {
  const result = await optimizer.autoOptimize()

  if (result.totalOptimizations > 0) {
    console.log('自动优化完成:', result)

    // 通知用户
    engine.emit('performance:optimized', {
      optimizations: result.totalOptimizations,
      improvement: result.estimatedImprovement
    })
  }
}, 600000) // 每10分钟

// 手动触发优化
engine.on('performance:optimize-request', async () => {
  const result = await optimizer.autoOptimize()
  console.log('手动优化完成:', result)
})
```

## 下一步

现在您已经掌握了性能优化的技巧，可以继续学习：

- [测试](/guide/testing) - 学习如何测试性能优化
- [部署](/guide/deployment) - 了解生产环境部署优化
- [调试](/guide/debugging) - 掌握性能调试技巧
- [API 参考](/api/performance) - 查看完整的性能 API 文档
- [示例](/examples/performance-patterns) - 查看更多性能优化示例
