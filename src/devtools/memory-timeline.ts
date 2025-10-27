/**
 * 内存时间线
 * 
 * 追踪和可视化应用的内存使用情况，帮助发现内存泄漏
 */

/**
 * 内存快照
 */
export interface MemorySnapshot {
  /** 时间戳 */
  timestamp: number
  /** 已使用内存（字节） */
  usedJSHeapSize: number
  /** 总堆大小 */
  totalJSHeapSize: number
  /** 堆大小限制 */
  jsHeapSizeLimit: number
  /** 使用百分比 */
  usagePercent: number
  /** 标签（可选） */
  label?: string
}

/**
 * 内存趋势
 */
export interface MemoryTrend {
  /** 增长率（%/秒） */
  growthRate: number
  /** 是否稳定 */
  stable: boolean
  /** 预警级别 */
  warning: 'none' | 'low' | 'medium' | 'high' | 'critical'
}

/**
 * 内存时间线管理器
 */
export class MemoryTimeline {
  private snapshots: MemorySnapshot[] = []
  private maxSnapshots = 1000
  private recording = false
  private intervalId?: number
  private snapshotInterval = 1000 // 1秒采样一次

  /**
   * 开始记录
   */
  start(interval = 1000): void {
    if (this.recording) {
      console.warn('内存时间线已在记录中')
      return
    }

    if (typeof window === 'undefined' || !performance.memory) {
      console.error('当前环境不支持内存监控')
      return
    }

    this.recording = true
    this.snapshotInterval = interval
    this.snapshots = []

    // 立即采集一次
    this.takeSnapshot()

    // 定期采集
    this.intervalId = window.setInterval(() => {
      this.takeSnapshot()
    }, interval)
  }

  /**
   * 停止记录
   */
  stop(): void {
    if (!this.recording) return

    this.recording = false

    if (this.intervalId !== undefined) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }
  }

  /**
   * 采集快照
   */
  takeSnapshot(label?: string): MemorySnapshot {
    if (typeof window === 'undefined' || !performance.memory) {
      throw new Error('当前环境不支持内存监控')
    }

    const memory = performance.memory
    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usagePercent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
      label
    }

    this.snapshots.push(snapshot)

    // 限制快照数量
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift()
    }

    return snapshot
  }

  /**
   * 获取所有快照
   */
  getSnapshots(): MemorySnapshot[] {
    return [...this.snapshots]
  }

  /**
   * 获取最新快照
   */
  getLatest(): MemorySnapshot | undefined {
    return this.snapshots[this.snapshots.length - 1]
  }

  /**
   * 分析内存趋势
   */
  analyzeTrend(recentCount = 10): MemoryTrend {
    const recent = this.snapshots.slice(-recentCount)
    
    if (recent.length < 2) {
      return {
        growthRate: 0,
        stable: true,
        warning: 'none'
      }
    }

    // 计算增长率
    const first = recent[0]
    const last = recent[recent.length - 1]
    const timeDiff = (last.timestamp - first.timestamp) / 1000 // 转为秒
    const memoryDiff = last.usedJSHeapSize - first.usedJSHeapSize
    const growthRate = (memoryDiff / first.usedJSHeapSize) * 100 / timeDiff

    // 判断是否稳定（增长率<1%/秒）
    const stable = Math.abs(growthRate) < 1

    // 判断预警级别
    let warning: MemoryTrend['warning'] = 'none'
    const usagePercent = last.usagePercent

    if (usagePercent > 90) warning = 'critical'
    else if (usagePercent > 80) warning = 'high'
    else if (usagePercent > 70) warning = 'medium'
    else if (usagePercent > 60 || growthRate > 5) warning = 'low'

    return { growthRate, stable, warning }
  }

  /**
   * 检测内存泄漏
   */
  detectLeaks(windowSize = 30): {
    suspected: boolean
    reason: string
    evidence: {
      steadyGrowth: boolean
      highUsage: boolean
      growthRate: number
    }
  } {
    const recent = this.snapshots.slice(-windowSize)

    if (recent.length < windowSize) {
      return {
        suspected: false,
        reason: '数据不足',
        evidence: { steadyGrowth: false, highUsage: false, growthRate: 0 }
      }
    }

    // 检查是否持续增长
    let increases = 0
    for (let i = 1; i < recent.length; i++) {
      if (recent[i].usedJSHeapSize > recent[i - 1].usedJSHeapSize) {
        increases++
      }
    }

    const steadyGrowth = increases > windowSize * 0.8 // 80%时间在增长

    // 检查内存使用率
    const latest = recent[recent.length - 1]
    const highUsage = latest.usagePercent > 70

    // 计算增长率
    const trend = this.analyzeTrend(windowSize)
    const growthRate = trend.growthRate

    const suspected = steadyGrowth && (highUsage || growthRate > 3)

    return {
      suspected,
      reason: suspected
        ? `检测到可疑内存泄漏：${steadyGrowth ? '持续增长' : ''}${highUsage ? ' 高内存使用' : ''}${growthRate > 3 ? ` 快速增长(${growthRate.toFixed(2)}%/s)` : ''}`
        : '未检测到明显泄漏',
      evidence: { steadyGrowth, highUsage, growthRate }
    }
  }

  /**
   * 生成图表数据
   */
  generateChartData(): {
    labels: string[]
    datasets: Array<{
      label: string
      data: number[]
    }>
  } {
    const labels = this.snapshots.map(s => 
      new Date(s.timestamp).toLocaleTimeString()
    )

    const usedMemoryMB = this.snapshots.map(s => 
      s.usedJSHeapSize / 1024 / 1024
    )

    const totalMemoryMB = this.snapshots.map(s => 
      s.totalJSHeapSize / 1024 / 1024
    )

    return {
      labels,
      datasets: [
        {
          label: '已使用内存 (MB)',
          data: usedMemoryMB
        },
        {
          label: '总内存 (MB)',
          data: totalMemoryMB
        }
      ]
    }
  }

  /**
   * 导出数据
   */
  export(): string {
    return JSON.stringify({
      snapshots: this.snapshots,
      trend: this.analyzeTrend(),
      leakDetection: this.detectLeaks(),
      chartData: this.generateChartData()
    }, null, 2)
  }

  /**
   * 清空数据
   */
  clear(): void {
    this.snapshots = []
    this.functionStats.clear()
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.stop()
    this.clear()
  }
}

/**
 * 创建内存时间线
 */
export function createMemoryTimeline(): MemoryTimeline {
  return new MemoryTimeline()
}


