/**
 * 性能预算管理器
 * 监控和管理应用性能预算
 */

export interface PerformanceBudget {
  /** 包体积限制（字节） */
  bundleSize?: number
  /** 初始加载时间限制（毫秒） */
  initialLoadTime?: number
  /** 内存使用限制（字节） */
  memoryUsage?: number
  /** FPS 最低限制 */
  minFps?: number
  /** DOM 节点数量限制 */
  domNodes?: number
  /** 网络请求数量限制 */
  networkRequests?: number
  /** 网络请求总大小限制（字节） */
  networkSize?: number
}

export interface PerformanceMetric {
  name: string
  value: number
  limit: number
  unit: string
  exceeded: boolean
  percentage: number
}

export type BudgetExceededCallback = (metric: PerformanceMetric) => void
export type DegradationCallback = (level: 'warning' | 'critical', metrics: PerformanceMetric[]) => void

// 🚀 新增：性能降级配置
export interface DegradationConfig {
  warningThreshold: number   // 警告阈值（百分比）
  criticalThreshold: number  // 严重阈值（百分比）
  autoDegrade?: boolean      // 自动降级
  onDegrade?: DegradationCallback
}

export class PerformanceBudgetManager {
  private budget: PerformanceBudget
  private onExceeded?: BudgetExceededCallback
  private metrics: Map<string, PerformanceMetric> = new Map()
  private monitoring = false
  private observer?: PerformanceObserver
  private animationFrameId?: number

  // 🚀 新增：实时检查和降级
  private degradationConfig?: DegradationConfig
  private checkTimer?: number
  private violationHistory: Array<{
    metric: string
    timestamp: number
    value: number
    limit: number
  }> = []
  private readonly MAX_VIOLATION_HISTORY = 100

  // 🚀 新增：性能趋势跟踪
  private metricHistory = new Map<string, Array<{ value: number; timestamp: number }>>()
  private readonly METRIC_HISTORY_SIZE = 20

  constructor(
    budget: PerformanceBudget,
    onExceeded?: BudgetExceededCallback,
    degradationConfig?: DegradationConfig
  ) {
    this.budget = budget
    this.onExceeded = onExceeded
    this.degradationConfig = degradationConfig
    this.initializeMetrics()
  }

  /**
   * 初始化指标
   */
  private initializeMetrics(): void {
    if (this.budget.bundleSize) {
      this.metrics.set('bundleSize', {
        name: 'Bundle Size',
        value: 0,
        limit: this.budget.bundleSize,
        unit: 'bytes',
        exceeded: false,
        percentage: 0
      })
    }

    if (this.budget.initialLoadTime) {
      this.metrics.set('initialLoadTime', {
        name: 'Initial Load Time',
        value: 0,
        limit: this.budget.initialLoadTime,
        unit: 'ms',
        exceeded: false,
        percentage: 0
      })
    }

    if (this.budget.memoryUsage) {
      this.metrics.set('memoryUsage', {
        name: 'Memory Usage',
        value: 0,
        limit: this.budget.memoryUsage,
        unit: 'bytes',
        exceeded: false,
        percentage: 0
      })
    }

    if (this.budget.minFps) {
      this.metrics.set('fps', {
        name: 'FPS',
        value: 60,
        limit: this.budget.minFps,
        unit: 'fps',
        exceeded: false,
        percentage: 100
      })
    }

    if (this.budget.domNodes) {
      this.metrics.set('domNodes', {
        name: 'DOM Nodes',
        value: 0,
        limit: this.budget.domNodes,
        unit: 'nodes',
        exceeded: false,
        percentage: 0
      })
    }

    if (this.budget.networkRequests) {
      this.metrics.set('networkRequests', {
        name: 'Network Requests',
        value: 0,
        limit: this.budget.networkRequests,
        unit: 'requests',
        exceeded: false,
        percentage: 0
      })
    }

    if (this.budget.networkSize) {
      this.metrics.set('networkSize', {
        name: 'Network Size',
        value: 0,
        limit: this.budget.networkSize,
        unit: 'bytes',
        exceeded: false,
        percentage: 0
      })
    }
  }

  /**
   * 开始监控
   */
  startMonitoring(): void {
    if (this.monitoring) return
    this.monitoring = true

    // 监控页面加载性能
    this.monitorLoadPerformance()

    // 监控内存使用
    this.monitorMemory()

    // 监控 FPS
    this.monitorFPS()

    // 监控 DOM 节点
    this.monitorDOMNodes()

    // 监控网络请求
    this.monitorNetwork()

    // 🚀 启动实时检查
    this.startRealtimeCheck()
  }

  /**
   * 停止监控
   */
  stopMonitoring(): void {
    this.monitoring = false

    if (this.observer) {
      this.observer.disconnect()
      this.observer = undefined
    }

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = undefined
    }

    // 🚀 停止实时检查
    if (this.checkTimer) {
      clearInterval(this.checkTimer)
      this.checkTimer = undefined
    }
  }

  /**
   * 监控加载性能
   */
  private monitorLoadPerformance(): void {
    if (typeof window === 'undefined') return

    // 使用 Navigation Timing API
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing
      const loadTime = timing.loadEventEnd - timing.navigationStart

      if (loadTime > 0 && this.metrics.has('initialLoadTime')) {
        this.updateMetric('initialLoadTime', loadTime)
      }
    }

    // 监控资源加载
    if (window.performance && window.performance.getEntriesByType) {
      const resources = window.performance.getEntriesByType('resource')
      let totalSize = 0

      resources.forEach(resource => {
        if ('transferSize' in resource) {
          totalSize += (resource as unknown as { transferSize: number }).transferSize
        }
      })

      if (this.metrics.has('bundleSize')) {
        this.updateMetric('bundleSize', totalSize)
      }
    }
  }

  /**
   * 监控内存使用
   */
  private monitorMemory(): void {
    if (typeof window === 'undefined') return

    // 检查是否支持 memory API
    if ('memory' in performance) {
      const checkMemory = () => {
        if (!this.monitoring) return

        const memory = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory
        if (memory && this.metrics.has('memoryUsage')) {
          this.updateMetric('memoryUsage', memory.usedJSHeapSize)
        }

        // 每秒检查一次
        setTimeout(() => checkMemory(), 1000)
      }

      checkMemory()
    }
  }

  /**
   * 监控 FPS
   */
  private monitorFPS(): void {
    if (typeof window === 'undefined') return

    let lastTime = performance.now()
    let frameCount = 0
    let fps = 60

    const measureFPS = () => {
      if (!this.monitoring) return

      const currentTime = performance.now()
      frameCount++

      if (currentTime >= lastTime + 1000) {
        fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
        frameCount = 0
        lastTime = currentTime

        if (this.metrics.has('fps')) {
          const metric = this.metrics.get('fps')
          if (metric) {
            metric.value = fps
            metric.exceeded = fps < metric.limit
            metric.percentage = (fps / 60) * 100

            if (metric.exceeded && this.onExceeded) {
              this.onExceeded(metric)
            }
          }
        }
      }

      this.animationFrameId = requestAnimationFrame(measureFPS)
    }

    measureFPS()
  }

  /**
   * 监控 DOM 节点数量
   */
  private monitorDOMNodes(): void {
    if (typeof window === 'undefined') return

    const checkDOMNodes = () => {
      if (!this.monitoring) return

      const nodeCount = document.getElementsByTagName('*').length

      if (this.metrics.has('domNodes')) {
        this.updateMetric('domNodes', nodeCount)
      }

      // 每秒检查一次
      setTimeout(() => checkDOMNodes(), 1000)
    }

    checkDOMNodes()
  }

  /**
   * 监控网络请求
   */
  private monitorNetwork(): void {
    if (typeof window === 'undefined') return

    let requestCount = 0
    let totalSize = 0

    // 使用 PerformanceObserver 监控网络请求
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            requestCount++

            if ('transferSize' in entry) {
              totalSize += (entry as unknown as { transferSize: number }).transferSize
            }

            if (this.metrics.has('networkRequests')) {
              this.updateMetric('networkRequests', requestCount)
            }

            if (this.metrics.has('networkSize')) {
              this.updateMetric('networkSize', totalSize)
            }
          }
        }
      })

      this.observer.observe({ entryTypes: ['resource'] })
    }
  }

  /**
   * 更新指标 - 🚀 增强版：添加历史跟踪和降级检查
   */
  private updateMetric(name: string, value: number): void {
    const metric = this.metrics.get(name)
    if (!metric) return

    metric.value = value
    metric.percentage = (value / metric.limit) * 100

    const wasExceeded = metric.exceeded
    metric.exceeded = metric.name === 'FPS'
      ? value < metric.limit
      : value > metric.limit

    // 🚀 记录指标历史
    if (!this.metricHistory.has(name)) {
      this.metricHistory.set(name, [])
    }
    const history = this.metricHistory.get(name)!
    history.push({ value, timestamp: Date.now() })

    // 限制历史大小
    if (history.length > this.METRIC_HISTORY_SIZE) {
      history.shift()
    }

    // 🚀 记录违规历史
    if (metric.exceeded) {
      this.violationHistory.push({
        metric: name,
        timestamp: Date.now(),
        value,
        limit: metric.limit
      })

      // 限制违规历史大小
      if (this.violationHistory.length > this.MAX_VIOLATION_HISTORY) {
        this.violationHistory.shift()
      }
    }

    // 如果首次超出预算，触发回调
    if (!wasExceeded && metric.exceeded && this.onExceeded) {
      this.onExceeded(metric)
    }

    // 🚀 检查是否需要降级
    this.checkDegradation()
  }

  /**
   * 🚀 新增：启动实时检查
   */
  private startRealtimeCheck(): void {
    this.checkTimer = window.setInterval(() => {
      this.performRealtimeCheck()
    }, 5000) // 每5秒检查一次
  }

  /**
   * 🚀 新增：执行实时检查
   */
  private performRealtimeCheck(): void {
    const exceeded = this.getExceededMetrics()

    // 分析趋势
    for (const metric of this.metrics.values()) {
      const history = this.metricHistory.get(metric.name)
      if (!history || history.length < 3) {
        continue
      }

      // 检查趋势
      const recent = history.slice(-3)
      const trend = this.analyzeTrend(recent)

      // 如果趋势恶化，发出警告
      if (trend === 'worsening' && metric.percentage > 80) {
        console.warn(`Performance metric "${metric.name}" is trending worse`, {
          current: metric.percentage.toFixed(1) + '%',
          history: recent.map(h => h.value)
        })
      }
    }
  }

  /**
   * 🚀 新增：分析指标趋势
   */
  private analyzeTrend(
    history: Array<{ value: number; timestamp: number }>
  ): 'improving' | 'stable' | 'worsening' {
    if (history.length < 2) {
      return 'stable'
    }

    const first = history[0].value
    const last = history[history.length - 1].value
    const change = ((last - first) / first) * 100

    if (Math.abs(change) < 5) {
      return 'stable'
    }

    return change > 0 ? 'worsening' : 'improving'
  }

  /**
   * 🚀 新增：检查性能降级
   */
  private checkDegradation(): void {
    if (!this.degradationConfig) {
      return
    }

    const metrics = Array.from(this.metrics.values())
    const warningMetrics = metrics.filter(
      m => m.percentage >= this.degradationConfig!.warningThreshold &&
        m.percentage < this.degradationConfig!.criticalThreshold
    )
    const criticalMetrics = metrics.filter(
      m => m.percentage >= this.degradationConfig!.criticalThreshold
    )

    // 警告级别降级
    if (warningMetrics.length > 0 && this.degradationConfig.onDegrade) {
      this.degradationConfig.onDegrade('warning', warningMetrics)
    }

    // 严重级别降级
    if (criticalMetrics.length > 0) {
      if (this.degradationConfig.onDegrade) {
        this.degradationConfig.onDegrade('critical', criticalMetrics)
      }

      // 自动降级
      if (this.degradationConfig.autoDegrade) {
        this.performAutoDegradation(criticalMetrics)
      }
    }
  }

  /**
   * 🚀 新增：执行自动降级
   */
  private performAutoDegradation(metrics: PerformanceMetric[]): void {
    console.warn('Performance budget critically exceeded, auto-degrading', {
      metrics: metrics.map(m => ({ name: m.name, percentage: m.percentage.toFixed(1) }))
    })

    // 触发浏览器事件，让应用层处理降级
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('performance-degrade', {
        detail: {
          level: 'critical',
          metrics
        }
      }))
    }
  }

  /**
   * 🚀 新增：获取违规历史
   */
  getViolationHistory(): typeof PerformanceBudgetManager.prototype.violationHistory {
    return [...this.violationHistory]
  }

  /**
   * 🚀 新增：获取指标趋势
   */
  getMetricTrend(metricName: string): {
    trend: 'improving' | 'stable' | 'worsening'
    history: Array<{ value: number; timestamp: number }>
    prediction: number
  } | null {
    const history = this.metricHistory.get(metricName)
    if (!history || history.length < 3) {
      return null
    }

    const trend = this.analyzeTrend(history)

    // 简单的线性预测
    const recent = history.slice(-3)
    const avgChange = (recent[recent.length - 1].value - recent[0].value) / recent.length
    const prediction = history[history.length - 1].value + avgChange

    return {
      trend,
      history: [...history],
      prediction: Math.max(0, prediction)
    }
  }

  /**
   * 手动检查特定指标
   */
  checkMetric(name: string, value: number): PerformanceMetric | null {
    if (!this.metrics.has(name)) return null

    this.updateMetric(name, value)
    return this.metrics.get(name) || null
  }

  /**
   * 获取所有指标
   */
  getAllMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values())
  }

  /**
   * 获取超出预算的指标
   */
  getExceededMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values()).filter(m => m.exceeded)
  }

  /**
   * 获取性能报告
   */
  getReport(): {
    passed: boolean
    metrics: PerformanceMetric[]
    exceeded: PerformanceMetric[]
    summary: string
  } {
    const metrics = this.getAllMetrics()
    const exceeded = this.getExceededMetrics()
    const passed = exceeded.length === 0

    const summary = passed
      ? '✅ 所有性能指标都在预算范围内'
      : `⚠️ ${exceeded.length} 个性能指标超出预算: ${exceeded.map(m => m.name).join(', ')}`

    return {
      passed,
      metrics,
      exceeded,
      summary
    }
  }

  /**
   * 重置指标
   */
  reset(): void {
    this.stopMonitoring()
    this.metrics.clear()
    this.initializeMetrics()
  }

  /**
   * 更新预算
   */
  updateBudget(budget: Partial<PerformanceBudget>): void {
    this.budget = { ...this.budget, ...budget }
    this.reset()
  }

  /**
   * 🚀 新增：生成可视化数据（用于图表渲染）
   */
  getVisualizationData(): {
    metrics: Array<{
      name: string
      value: number
      limit: number
      percentage: number
      status: 'good' | 'warning' | 'critical'
    }>
    timeline: Array<{
      timestamp: number
      metrics: Record<string, number>
    }>
    violations: typeof PerformanceBudgetManager.prototype.violationHistory
  } {
    const metrics = Array.from(this.metrics.values()).map(m => ({
      name: m.name,
      value: m.value,
      limit: m.limit,
      percentage: m.percentage,
      status: m.percentage < 80 ? 'good' as const
        : m.percentage < 100 ? 'warning' as const
          : 'critical' as const
    }))

    // 构建时间线数据
    const timeline: Array<{ timestamp: number; metrics: Record<string, number> }> = []
    const maxHistoryLength = Math.max(
      ...Array.from(this.metricHistory.values()).map(h => h.length)
    )

    for (let i = 0; i < maxHistoryLength; i++) {
      const dataPoint: { timestamp: number; metrics: Record<string, number> } = {
        timestamp: 0,
        metrics: {}
      }

      for (const [name, history] of this.metricHistory.entries()) {
        if (i < history.length) {
          dataPoint.timestamp = history[i].timestamp
          dataPoint.metrics[name] = history[i].value
        }
      }

      if (dataPoint.timestamp > 0) {
        timeline.push(dataPoint)
      }
    }

    return {
      metrics,
      timeline,
      violations: this.violationHistory
    }
  }

  /**
   * 🚀 新增：导出报告为JSON
   */
  exportReport(): string {
    const report = this.getReport()
    const visualization = this.getVisualizationData()
    const trends: Record<string, ReturnType<typeof this.getMetricTrend>> = {}

    for (const metricName of this.metrics.keys()) {
      trends[metricName] = this.getMetricTrend(metricName)
    }

    return JSON.stringify({
      report,
      visualization,
      trends,
      exportedAt: Date.now()
    }, null, 2)
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.stopMonitoring()
    this.metrics.clear()
    this.metricHistory.clear()
    this.violationHistory = []
  }
}

/**
 * 🚀 创建性能预算管理器
 */
export function createPerformanceBudgetManager(
  budget: PerformanceBudget,
  onExceeded?: BudgetExceededCallback,
  degradationConfig?: DegradationConfig
): PerformanceBudgetManager {
  return new PerformanceBudgetManager(budget, onExceeded, degradationConfig)
}

