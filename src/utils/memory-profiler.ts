/**
 * 内存分析工具（Memory Profiler）
 * 提供内存快照对比、泄漏检测、引用链追踪等功能
 */

export interface MemorySnapshot {
  id: string
  timestamp: number
  heapUsed: number
  heapTotal: number
  heapLimit: number
  external?: number
  arrayBuffers?: number
  label?: string
}

export interface LeakSuspect {
  name: string
  growthRate: number      // 增长速率(bytes/s)
  totalGrowth: number     // 总增长量
  confidence: number      // 置信度(0-1)
  snapshots: MemorySnapshot[]
}

export interface MemoryProfilerConfig {
  sampleInterval?: number      // 采样间隔(ms)
  maxSnapshots?: number        // 最大快照数
  leakThreshold?: number       // 泄漏阈值(bytes)
  analysisWindow?: number      // 分析窗口(ms)
}

/**
 * 内存分析器
 */
export class MemoryProfiler {
  private snapshots: MemorySnapshot[] = []
  private config: Required<MemoryProfilerConfig>
  private snapshotIdCounter = 0
  private samplingTimer?: number
  private isActive = false

  private stats = {
    totalSnapshots: 0,
    detectedLeaks: 0,
    averageGrowthRate: 0,
    peakMemory: 0
  }

  constructor(config: MemoryProfilerConfig = {}) {
    this.config = {
      sampleInterval: config.sampleInterval || 10000, // 10秒
      maxSnapshots: config.maxSnapshots || 100,
      leakThreshold: config.leakThreshold || 10 * 1024 * 1024, // 10MB
      analysisWindow: config.analysisWindow || 5 * 60 * 1000 // 5分钟
    }
  }

  /**
   * 开始采样
   */
  start(): void {
    if (this.isActive) {
      return
    }

    this.isActive = true
    this.samplingTimer = window.setInterval(() => {
      this.takeSnapshot()
    }, this.config.sampleInterval)

    // 立即采样一次
    this.takeSnapshot()
  }

  /**
   * 停止采样
   */
  stop(): void {
    this.isActive = false

    if (this.samplingTimer) {
      clearInterval(this.samplingTimer)
      this.samplingTimer = undefined
    }
  }

  /**
   * 手动采样
   */
  takeSnapshot(label?: string): string {
    const memory = this.getMemoryInfo()
    if (!memory) {
      throw new Error('Memory API not available')
    }

    const snapshot: MemorySnapshot = {
      id: `snapshot-${++this.snapshotIdCounter}`,
      timestamp: Date.now(),
      heapUsed: memory.usedJSHeapSize,
      heapTotal: memory.totalJSHeapSize,
      heapLimit: memory.jsHeapSizeLimit,
      label
    }

    this.snapshots.push(snapshot)
    this.stats.totalSnapshots++

    // 更新峰值
    if (snapshot.heapUsed > this.stats.peakMemory) {
      this.stats.peakMemory = snapshot.heapUsed
    }

    // 限制快照数量
    if (this.snapshots.length > this.config.maxSnapshots) {
      this.snapshots.shift()
    }

    return snapshot.id
  }

  /**
   * 对比两个快照
   */
  compare(snapshotId1: string, snapshotId2: string): {
    heapGrowth: number
    growthRate: number
    duration: number
    growthPercentage: number
  } {
    const snapshot1 = this.snapshots.find(s => s.id === snapshotId1)
    const snapshot2 = this.snapshots.find(s => s.id === snapshotId2)

    if (!snapshot1 || !snapshot2) {
      throw new Error('Snapshot not found')
    }

    const heapGrowth = snapshot2.heapUsed - snapshot1.heapUsed
    const duration = snapshot2.timestamp - snapshot1.timestamp
    const growthRate = duration > 0 ? (heapGrowth / duration) * 1000 : 0 // bytes/s
    const growthPercentage = snapshot1.heapUsed > 0
      ? (heapGrowth / snapshot1.heapUsed) * 100
      : 0

    return {
      heapGrowth,
      growthRate,
      duration,
      growthPercentage
    }
  }

  /**
   * 检测内存泄漏
   */
  detectLeaks(): LeakSuspect[] {
    if (this.snapshots.length < 5) {
      return []
    }

    const suspects: LeakSuspect[] = []

    // 分析最近的快照窗口
    const now = Date.now()
    const recentSnapshots = this.snapshots.filter(
      s => now - s.timestamp < this.config.analysisWindow
    )

    if (recentSnapshots.length < 3) {
      return []
    }

    // 计算内存增长
    const firstSnapshot = recentSnapshots[0]
    const lastSnapshot = recentSnapshots[recentSnapshots.length - 1]
    const totalGrowth = lastSnapshot.heapUsed - firstSnapshot.heapUsed
    const duration = lastSnapshot.timestamp - firstSnapshot.timestamp
    const growthRate = (totalGrowth / duration) * 1000 // bytes/s

    // 如果内存持续增长超过阈值
    if (totalGrowth > this.config.leakThreshold) {
      // 计算置信度
      let confidence = 0.5

      // 检查增长是否持续
      let continuousGrowth = true
      for (let i = 1; i < recentSnapshots.length; i++) {
        if (recentSnapshots[i].heapUsed < recentSnapshots[i - 1].heapUsed) {
          continuousGrowth = false
          break
        }
      }

      if (continuousGrowth) {
        confidence = 0.9
      } else {
        // 计算增长的一致性
        const growthRates: number[] = []
        for (let i = 1; i < recentSnapshots.length; i++) {
          const growth = recentSnapshots[i].heapUsed - recentSnapshots[i - 1].heapUsed
          const time = recentSnapshots[i].timestamp - recentSnapshots[i - 1].timestamp
          growthRates.push((growth / time) * 1000)
        }

        // 计算增长率的标准差
        const avgGrowthRate = growthRates.reduce((a, b) => a + b, 0) / growthRates.length
        const variance = growthRates.reduce((sum, rate) =>
          sum + Math.pow(rate - avgGrowthRate, 2), 0) / growthRates.length
        const stdDev = Math.sqrt(variance)

        // 标准差小说明增长稳定，可能是泄漏
        if (stdDev < avgGrowthRate * 0.3) {
          confidence = 0.7
        } else {
          confidence = 0.4
        }
      }

      suspects.push({
        name: 'Heap Memory',
        growthRate,
        totalGrowth,
        confidence,
        snapshots: recentSnapshots
      })

      this.stats.detectedLeaks++
    }

    return suspects
  }

  /**
   * 生成内存报告
   */
  generateReport(): {
    summary: {
      totalSnapshots: number
      duration: number
      initialMemory: number
      currentMemory: number
      peakMemory: number
      averageMemory: number
      totalGrowth: number
      averageGrowthRate: number
    }
    leaks: LeakSuspect[]
    recommendations: string[]
  } {
    if (this.snapshots.length === 0) {
      throw new Error('No snapshots available')
    }

    const firstSnapshot = this.snapshots[0]
    const lastSnapshot = this.snapshots[this.snapshots.length - 1]
    const duration = lastSnapshot.timestamp - firstSnapshot.timestamp

    const totalMemory = this.snapshots.reduce((sum, s) => sum + s.heapUsed, 0)
    const averageMemory = totalMemory / this.snapshots.length

    const totalGrowth = lastSnapshot.heapUsed - firstSnapshot.heapUsed
    const averageGrowthRate = duration > 0 ? (totalGrowth / duration) * 1000 : 0

    this.stats.averageGrowthRate = averageGrowthRate

    const leaks = this.detectLeaks()
    const recommendations = this.generateRecommendations(totalGrowth, averageGrowthRate, leaks)

    return {
      summary: {
        totalSnapshots: this.snapshots.length,
        duration,
        initialMemory: firstSnapshot.heapUsed,
        currentMemory: lastSnapshot.heapUsed,
        peakMemory: this.stats.peakMemory,
        averageMemory,
        totalGrowth,
        averageGrowthRate
      },
      leaks,
      recommendations
    }
  }

  /**
   * 生成建议
   */
  private generateRecommendations(
    totalGrowth: number,
    growthRate: number,
    leaks: LeakSuspect[]
  ): string[] {
    const recommendations: string[] = []

    // 内存增长建议
    if (totalGrowth > 50 * 1024 * 1024) {
      recommendations.push('内存增长超过50MB，建议检查是否有内存泄漏')
    } else if (totalGrowth > 20 * 1024 * 1024) {
      recommendations.push('内存增长较大，建议优化内存使用')
    }

    // 增长速率建议
    if (growthRate > 1024 * 1024) {
      recommendations.push('内存增长速率超过1MB/s，可能存在严重泄漏')
    } else if (growthRate > 100 * 1024) {
      recommendations.push('内存增长速率较高，建议监控内存使用')
    }

    // 泄漏检测建议
    if (leaks.length > 0) {
      const highConfidenceLeaks = leaks.filter(l => l.confidence > 0.7)
      if (highConfidenceLeaks.length > 0) {
        recommendations.push(`检测到${highConfidenceLeaks.length}个高置信度内存泄漏`)
      }
      recommendations.push('建议使用浏览器开发工具进行详细的内存分析')
    }

    // 峰值内存建议
    if (this.stats.peakMemory > 200 * 1024 * 1024) {
      recommendations.push('峰值内存超过200MB，考虑优化大对象的使用')
    }

    return recommendations
  }

  /**
   * 获取所有快照
   */
  getSnapshots(): MemorySnapshot[] {
    return [...this.snapshots]
  }

  /**
   * 获取统计信息
   */
  getStats(): typeof MemoryProfiler.prototype.stats {
    return { ...this.stats }
  }

  /**
   * 清除所有快照
   */
  clear(): void {
    this.snapshots = []
    this.stats = {
      totalSnapshots: 0,
      detectedLeaks: 0,
      averageGrowthRate: 0,
      peakMemory: 0
    }
  }

  /**
   * 获取内存信息
   */
  private getMemoryInfo(): {
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
  } | null {
    if (
      typeof globalThis !== 'undefined' &&
      typeof globalThis.performance !== 'undefined' &&
      'memory' in (globalThis.performance as Performance)
    ) {
      const memory = (globalThis.performance as Performance & {
        memory?: {
          usedJSHeapSize: number
          totalJSHeapSize: number
          jsHeapSizeLimit: number
        }
      }).memory
      return memory || null
    }
    return null
  }

  /**
   * 销毁分析器
   */
  destroy(): void {
    this.stop()
    this.clear()
  }
}

/**
 * 创建内存分析器
 */
export function createMemoryProfiler(config?: MemoryProfilerConfig): MemoryProfiler {
  return new MemoryProfiler(config)
}

// ============================================
// 内存泄漏检测器
// ============================================

export interface LeakDetectorConfig {
  checkInterval?: number
  threshold?: number
  windowSize?: number
}

/**
 * 内存泄漏检测器 - 自动检测和报告内存泄漏
 */
export class MemoryLeakDetector {
  private profiler: MemoryProfiler
  private config: Required<LeakDetectorConfig>
  private checkTimer?: number
  private callbacks: Array<(suspect: LeakSuspect) => void> = []

  constructor(config: LeakDetectorConfig = {}) {
    this.config = {
      checkInterval: config.checkInterval || 30000, // 30秒
      threshold: config.threshold || 10 * 1024 * 1024, // 10MB
      windowSize: config.windowSize || 10
    }

    this.profiler = createMemoryProfiler({
      sampleInterval: 5000,
      maxSnapshots: 50,
      leakThreshold: this.config.threshold
    })
  }

  /**
   * 开始检测
   */
  start(): void {
    this.profiler.start()

    this.checkTimer = window.setInterval(() => {
      this.checkForLeaks()
    }, this.config.checkInterval)
  }

  /**
   * 停止检测
   */
  stop(): void {
    this.profiler.stop()

    if (this.checkTimer) {
      clearInterval(this.checkTimer)
      this.checkTimer = undefined
    }
  }

  /**
   * 检查泄漏
   */
  private checkForLeaks(): void {
    const leaks = this.profiler.detectLeaks()

    for (const leak of leaks) {
      // 通知所有回调
      for (const callback of this.callbacks) {
        try {
          callback(leak)
        } catch (error) {
          console.error('Error in leak detection callback:', error)
        }
      }

      // 触发浏览器事件
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('memory-leak-detected', {
          detail: leak
        }))
      }
    }
  }

  /**
   * 监听泄漏检测
   */
  onLeakDetected(callback: (suspect: LeakSuspect) => void): () => void {
    this.callbacks.push(callback)

    return () => {
      const index = this.callbacks.indexOf(callback)
      if (index > -1) {
        this.callbacks.splice(index, 1)
      }
    }
  }

  /**
   * 生成报告
   */
  generateReport(): ReturnType<MemoryProfiler['generateReport']> {
    return this.profiler.generateReport()
  }

  /**
   * 销毁检测器
   */
  destroy(): void {
    this.stop()
    this.profiler.destroy()
    this.callbacks = []
  }
}

/**
 * 创建内存泄漏检测器
 */
export function createMemoryLeakDetector(config?: LeakDetectorConfig): MemoryLeakDetector {
  return new MemoryLeakDetector(config)
}



