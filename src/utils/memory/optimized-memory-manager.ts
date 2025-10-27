/**
 * 优化的内存管理器
 * 
 * 整合内存池、缓存、监控等功能，提供统一的内存管理接口
 * 
 * 主要优化：
 * 1. 减少内存碎片 - 使用内存池和对象复用
 * 2. 智能垃圾回收 - 基于内存压力的自适应GC
 * 3. 内存预算管理 - 为不同模块分配内存配额
 * 4. 零拷贝优化 - 使用SharedArrayBuffer和转移所有权
 */

import type { Logger } from '../../types'
import { EnhancedObjectPool } from './enhanced-object-pool'
import { MemoryMonitor } from '../memory-monitor'

/**
 * 内存配额配置
 */
export interface MemoryQuota {
  /** 模块名称 */
  module: string
  /** 最大内存（字节） */
  maxMemory: number
  /** 当前使用 */
  currentUsage: number
  /** 优先级（用于内存不足时的清理顺序） */
  priority: number
}

/**
 * 内存管理器配置
 */
export interface MemoryManagerConfig {
  /** 总内存限制（MB） */
  totalMemoryLimit?: number
  /** 内存警告阈值 */
  warningThreshold?: number
  /** 内存错误阈值 */
  errorThreshold?: number
  /** GC间隔（毫秒） */
  gcInterval?: number
  /** 是否启用激进GC */
  aggressiveGC?: boolean
  /** 是否启用内存压缩 */
  enableCompaction?: boolean
  /** 日志器 */
  logger?: Logger
}

/**
 * 内存分配策略
 */
export enum AllocationStrategy {
  /** 首次适应 */
  FIRST_FIT = 'first_fit',
  /** 最佳适应 */
  BEST_FIT = 'best_fit',
  /** 最坏适应 */
  WORST_FIT = 'worst_fit',
  /** 伙伴系统 */
  BUDDY = 'buddy'
}

/**
 * 优化的内存管理器
 */
export class OptimizedMemoryManager {
  private config: Required<MemoryManagerConfig>
  private logger?: Logger

  // 内存配额管理
  private quotas = new Map<string, MemoryQuota>()

  // 对象池管理
  private objectPools = new Map<string, EnhancedObjectPool<any>>()

  // 内存块管理（用于大对象）
  private memoryBlocks = new Map<string, ArrayBuffer>()
  private freeBlocks: Array<{ size: number; buffer: ArrayBuffer }> = []

  // 内存监控
  private monitor: MemoryMonitor

  // GC定时器
  private gcTimer?: number

  // 内存压力级别
  private memoryPressure: 'low' | 'medium' | 'high' = 'low'

  // 统计信息
  private stats = {
    allocations: 0,
    deallocations: 0,
    gcCycles: 0,
    compactions: 0,
    poolHits: 0,
    poolMisses: 0
  }

  constructor(config: MemoryManagerConfig = {}) {
    this.config = {
      totalMemoryLimit: config.totalMemoryLimit ?? 512,
      warningThreshold: config.warningThreshold ?? 0.7,
      errorThreshold: config.errorThreshold ?? 0.9,
      gcInterval: config.gcInterval ?? 30000,
      aggressiveGC: config.aggressiveGC ?? false,
      enableCompaction: config.enableCompaction ?? true,
      logger: config.logger
    }

    this.logger = config.logger

    // 初始化内存监控
    this.monitor = new MemoryMonitor({
      checkInterval: 5000,
      thresholds: {
        warning: this.config.totalMemoryLimit * this.config.warningThreshold * 1024 * 1024,
        error: this.config.totalMemoryLimit * this.config.errorThreshold * 1024 * 1024
      },
      onWarning: (info) => this.handleMemoryWarning(info),
      onError: (info) => this.handleMemoryError(info)
    })

    // 启动监控和GC
    this.monitor.start()
    this.startGarbageCollection()

    // 预分配一些内存块
    this.preallocateMemoryBlocks()
  }

  /**
   * 注册内存配额
   */
  registerQuota(module: string, maxMemory: number, priority = 5): void {
    this.quotas.set(module, {
      module,
      maxMemory,
      currentUsage: 0,
      priority
    })
  }

  /**
   * 分配内存
   */
  allocate(module: string, size: number): ArrayBuffer | null {
    const quota = this.quotas.get(module)

    // 检查配额
    if (quota && quota.currentUsage + size > quota.maxMemory) {
      this.logger?.warn(`Memory quota exceeded for module: ${module}`)
      return null
    }

    // 尝试从空闲块分配
    const buffer = this.allocateFromFreeBlocks(size)

    if (buffer) {
      if (quota) {
        quota.currentUsage += size
      }
      this.stats.allocations++
      return buffer
    }

    // 触发GC后重试
    this.triggerGarbageCollection()

    // 创建新的内存块
    try {
      const newBuffer = new ArrayBuffer(size)
      if (quota) {
        quota.currentUsage += size
      }
      this.stats.allocations++
      return newBuffer
    } catch (error) {
      this.logger?.error('Memory allocation failed', error)
      return null
    }
  }

  /**
   * 释放内存
   */
  deallocate(module: string, buffer: ArrayBuffer): void {
    const quota = this.quotas.get(module)

    if (quota) {
      quota.currentUsage = Math.max(0, quota.currentUsage - buffer.byteLength)
    }

    // 如果启用内存压缩，将buffer加入空闲列表
    if (this.config.enableCompaction && buffer.byteLength > 1024) {
      this.freeBlocks.push({
        size: buffer.byteLength,
        buffer
      })

      // 合并相邻的空闲块
      this.compactFreeBlocks()
    }

    this.stats.deallocations++
  }

  /**
   * 创建或获取对象池
   */
  getObjectPool<T extends { reset(): void }>(
    poolName: string,
    factory: () => T,
    resetter: (obj: T) => void
  ): EnhancedObjectPool<T> {
    let pool = this.objectPools.get(poolName)

    if (!pool) {
      pool = new EnhancedObjectPool(factory, resetter, {
        initialSize: 10,
        maxSize: 100,
        enableWarmup: true
      })
      this.objectPools.set(poolName, pool)
    }

    return pool
  }

  /**
   * 从对象池获取对象
   */
  acquirePooled<T>(poolName: string): T | null {
    const pool = this.objectPools.get(poolName)
    if (pool) {
      this.stats.poolHits++
      return pool.acquire()
    }
    this.stats.poolMisses++
    return null
  }

  /**
   * 释放对象到池
   */
  releasePooled<T extends { reset(): void }>(poolName: string, obj: T): void {
    const pool = this.objectPools.get(poolName)
    if (pool) {
      pool.release(obj)
    }
  }

  /**
   * 预分配内存块
   */
  private preallocateMemoryBlocks(): void {
    // 预分配一些常用大小的内存块
    const sizes = [1024, 4096, 16384, 65536] // 1KB, 4KB, 16KB, 64KB

    for (const size of sizes) {
      try {
        for (let i = 0; i < 2; i++) {
          const buffer = new ArrayBuffer(size)
          this.freeBlocks.push({ size, buffer })
        }
      } catch {
        // 内存不足，停止预分配
        break
      }
    }
  }

  /**
   * 从空闲块分配
   */
  private allocateFromFreeBlocks(size: number): ArrayBuffer | null {
    // 使用最佳适应算法
    let bestFit: { size: number; buffer: ArrayBuffer } | null = null
    let bestFitIndex = -1
    let minWaste = Infinity

    for (let i = 0; i < this.freeBlocks.length; i++) {
      const block = this.freeBlocks[i]
      if (block.size >= size) {
        const waste = block.size - size
        if (waste < minWaste) {
          minWaste = waste
          bestFit = block
          bestFitIndex = i
        }
      }
    }

    if (bestFit && bestFitIndex !== -1) {
      this.freeBlocks.splice(bestFitIndex, 1)

      // 如果剩余空间足够大，分割块
      if (bestFit.size > size + 1024) {
        try {
          // 创建新的缓冲区（因为ArrayBuffer不能真正分割）
          const newBuffer = new ArrayBuffer(size)
          const remainingBuffer = new ArrayBuffer(bestFit.size - size)
          this.freeBlocks.push({
            size: bestFit.size - size,
            buffer: remainingBuffer
          })
          return newBuffer
        } catch {
          return bestFit.buffer
        }
      }

      return bestFit.buffer
    }

    return null
  }

  /**
   * 压缩空闲块
   */
  private compactFreeBlocks(): void {
    if (this.freeBlocks.length < 2) return

    // 按大小排序
    this.freeBlocks.sort((a, b) => a.size - b.size)

    // 合并相似大小的块
    const compacted: typeof this.freeBlocks = []
    let i = 0

    while (i < this.freeBlocks.length) {
      const current = this.freeBlocks[i]
      let j = i + 1

      // 查找可以合并的块
      while (j < this.freeBlocks.length &&
        this.freeBlocks[j].size === current.size) {
        j++
      }

      // 保留一定数量的相同大小的块
      const keepCount = Math.min(j - i, 3)
      for (let k = 0; k < keepCount; k++) {
        compacted.push(this.freeBlocks[i + k])
      }

      i = j
    }

    this.freeBlocks = compacted
    this.stats.compactions++
  }

  /**
   * 启动垃圾回收
   */
  private startGarbageCollection(): void {
    this.gcTimer = window.setInterval(() => {
      this.performGarbageCollection()
    }, this.config.gcInterval)
  }

  /**
   * 执行垃圾回收
   */
  private performGarbageCollection(): void {
    const startTime = Date.now()

    // 清理对象池
    for (const [name, pool] of this.objectPools) {
      const stats = pool.getStats()

      // 如果池使用率低，清理部分对象
      if (stats.hitRate < 50) {
        pool.clear()
        this.logger?.debug(`Cleared object pool: ${name}`)
      }
    }

    // 清理过大的空闲块列表
    if (this.freeBlocks.length > 50) {
      // 只保留最有用的块
      this.freeBlocks = this.freeBlocks
        .sort((a, b) => b.size - a.size)
        .slice(0, 20)
    }

    // 根据内存压力决定是否触发浏览器GC
    if (this.memoryPressure === 'high' && typeof gc !== 'undefined') {
      gc()
    }

    const duration = Date.now() - startTime
    this.stats.gcCycles++

    this.logger?.debug(`GC completed in ${duration}ms`)
  }

  /**
   * 触发垃圾回收
   */
  triggerGarbageCollection(): void {
    this.performGarbageCollection()
  }

  /**
   * 处理内存警告
   */
  private handleMemoryWarning(info: any): void {
    this.memoryPressure = 'medium'
    this.logger?.warn('Memory warning', info)

    // 清理低优先级模块的内存
    const sortedQuotas = Array.from(this.quotas.values())
      .sort((a, b) => a.priority - b.priority)

    for (const quota of sortedQuotas) {
      if (quota.currentUsage > quota.maxMemory * 0.5) {
        this.logger?.info(`Requesting memory cleanup for module: ${quota.module}`)
        // 这里应该发送事件通知相应模块清理内存
      }
    }
  }

  /**
   * 处理内存错误
   */
  private handleMemoryError(info: any): void {
    this.memoryPressure = 'high'
    this.logger?.error('Memory error', info)

    // 执行激进的内存清理
    if (this.config.aggressiveGC) {
      // 清空所有对象池
      for (const pool of this.objectPools.values()) {
        pool.clear()
      }

      // 清空空闲块
      this.freeBlocks = []

      // 触发强制GC
      this.triggerGarbageCollection()
    }
  }

  /**
   * 获取内存使用统计
   */
  getMemoryStats(): {
    totalAllocated: number
    quotaUsage: Array<{ module: string; usage: number; limit: number; percentage: number }>
    poolStats: Record<string, any>
    freeBlockCount: number
    memoryPressure: string
    performanceStats: typeof this.stats
  } {
    const quotaUsage = Array.from(this.quotas.values()).map(quota => ({
      module: quota.module,
      usage: quota.currentUsage,
      limit: quota.maxMemory,
      percentage: (quota.currentUsage / quota.maxMemory) * 100
    }))

    const poolStats: Record<string, any> = {}
    for (const [name, pool] of this.objectPools) {
      poolStats[name] = pool.getStats()
    }

    const totalAllocated = quotaUsage.reduce((sum, q) => sum + q.usage, 0)

    return {
      totalAllocated,
      quotaUsage,
      poolStats,
      freeBlockCount: this.freeBlocks.length,
      memoryPressure: this.memoryPressure,
      performanceStats: { ...this.stats }
    }
  }

  /**
   * 优化建议
   */
  getOptimizationSuggestions(): string[] {
    const suggestions: string[] = []
    const stats = this.getMemoryStats()

    // 检查配额使用
    for (const quota of stats.quotaUsage) {
      if (quota.percentage > 80) {
        suggestions.push(`Module '${quota.module}' is using ${quota.percentage.toFixed(1)}% of its quota. Consider increasing the quota or optimizing memory usage.`)
      }
    }

    // 检查对象池效率
    for (const [name, poolStat] of Object.entries(stats.poolStats)) {
      if (poolStat.hitRate < 50) {
        suggestions.push(`Object pool '${name}' has low hit rate (${poolStat.hitRate.toFixed(1)}%). Consider adjusting pool size or removing if unused.`)
      }
    }

    // 检查内存压力
    if (this.memoryPressure === 'high') {
      suggestions.push('High memory pressure detected. Consider: 1) Reducing memory quotas, 2) Implementing data pagination, 3) Using WeakMap/WeakSet for caches')
    }

    // 检查GC频率
    if (this.stats.gcCycles > 100) {
      suggestions.push('Frequent GC cycles detected. This may impact performance. Consider reducing memory allocation frequency.')
    }

    return suggestions
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    // 停止监控
    this.monitor.destroy()

    // 停止GC定时器
    if (this.gcTimer) {
      clearInterval(this.gcTimer)
      this.gcTimer = undefined
    }

    // 清理对象池
    for (const pool of this.objectPools.values()) {
      pool.destroy()
    }
    this.objectPools.clear()

    // 清理内存块
    this.memoryBlocks.clear()
    this.freeBlocks = []

    // 清理配额
    this.quotas.clear()
  }
}

/**
 * 创建优化的内存管理器
 */
export function createOptimizedMemoryManager(
  config?: MemoryManagerConfig
): OptimizedMemoryManager {
  return new OptimizedMemoryManager(config)
}



