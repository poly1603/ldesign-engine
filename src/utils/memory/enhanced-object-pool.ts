/**
 * 增强版对象池系统
 * 
 * 提供更高效的对象复用机制，显著减少GC压力和内存分配
 * 
 * 主要改进：
 * 1. 自适应池大小 - 根据使用模式自动调整
 * 2. 预热机制 - 提前创建常用对象
 * 3. 分级存储 - 热数据和冷数据分离
 * 4. 智能清理 - 基于使用频率的清理策略
 */

import type { Logger } from '../../types'

/**
 * 池化对象接口
 */
export interface PoolableObject {
  __poolId?: string
  __lastUsed?: number
  __useCount?: number
  reset(): void
}

/**
 * 对象池配置
 */
export interface PoolConfig {
  /** 初始池大小 */
  initialSize?: number
  /** 最大池大小 */
  maxSize?: number
  /** 最小池大小 */
  minSize?: number
  /** 增长因子 */
  growthFactor?: number
  /** 收缩因子 */
  shrinkFactor?: number
  /** 清理间隔（毫秒） */
  cleanupInterval?: number
  /** 对象最大闲置时间（毫秒） */
  maxIdleTime?: number
  /** 是否启用预热 */
  enableWarmup?: boolean
  /** 预热百分比 */
  warmupPercentage?: number
}

/**
 * 池统计信息
 */
export interface PoolStats {
  /** 当前池大小 */
  size: number
  /** 已创建对象总数 */
  created: number
  /** 已获取对象总数 */
  acquired: number
  /** 已释放对象总数 */
  released: number
  /** 重用次数 */
  reused: number
  /** 重用率 */
  reuseRate: number
  /** 命中率 */
  hitRate: number
  /** 平均使用时间 */
  avgUseTime: number
  /** 内存占用估算 */
  estimatedMemory: number
}

/**
 * 增强版对象池
 */
export class EnhancedObjectPool<T extends PoolableObject> {
  private factory: () => T
  private resetter: (obj: T) => void
  private config: Required<PoolConfig>

  // 分级存储
  private hotPool: T[] = []      // 热数据池（频繁使用）
  private coldPool: T[] = []     // 冷数据池（偶尔使用）
  private inUse = new Map<string, T>()  // 使用中的对象

  // 统计信息
  private stats = {
    created: 0,
    acquired: 0,
    released: 0,
    reused: 0,
    totalUseTime: 0,
    hits: 0,
    misses: 0
  }

  // 清理定时器
  private cleanupTimer?: number

  // 对象大小估算
  private objectSize = 0

  constructor(
    factory: () => T,
    resetter: (obj: T) => void,
    config: PoolConfig = {}
  ) {
    this.factory = factory
    this.resetter = resetter

    // 合并默认配置
    this.config = {
      initialSize: config.initialSize ?? 5,
      maxSize: config.maxSize ?? 50,
      minSize: config.minSize ?? 2,
      growthFactor: config.growthFactor ?? 1.5,
      shrinkFactor: config.shrinkFactor ?? 0.7,
      cleanupInterval: config.cleanupInterval ?? 30000,
      maxIdleTime: config.maxIdleTime ?? 60000,
      enableWarmup: config.enableWarmup ?? true,
      warmupPercentage: config.warmupPercentage ?? 0.3
    }

    // 预热
    if (this.config.enableWarmup) {
      this.warmup()
    }

    // 启动清理
    this.startCleanup()

    // 估算对象大小
    this.estimateObjectSize()
  }

  /**
   * 获取对象
   */
  acquire(): T {
    const startTime = Date.now()
    let obj: T | undefined

    // 优先从热池获取
    if (this.hotPool.length > 0) {
      obj = this.hotPool.pop()!
      this.stats.hits++
    }
    // 其次从冷池获取
    else if (this.coldPool.length > 0) {
      obj = this.coldPool.pop()!
      this.stats.hits++
    }
    // 创建新对象
    else {
      obj = this.factory()
      obj.__poolId = this.generateId()
      this.stats.created++
      this.stats.misses++

      // 动态扩展池大小
      this.adjustPoolSize()
    }

    // 更新对象元数据
    obj.__lastUsed = Date.now()
    obj.__useCount = (obj.__useCount ?? 0) + 1

    // 记录使用中
    this.inUse.set(obj.__poolId!, obj)

    this.stats.acquired++
    if (this.stats.created < this.stats.acquired) {
      this.stats.reused++
    }

    return obj
  }

  /**
   * 释放对象
   */
  release(obj: T): void {
    if (!obj.__poolId || !this.inUse.has(obj.__poolId)) {
      console.warn('Attempting to release object not from this pool')
      return
    }

    // 计算使用时间
    const useTime = Date.now() - (obj.__lastUsed ?? Date.now())
    this.stats.totalUseTime += useTime

    // 从使用中移除
    this.inUse.delete(obj.__poolId)

    // 重置对象
    this.resetter(obj)

    // 根据使用频率决定放入哪个池
    const useCount = obj.__useCount ?? 0
    const totalSize = this.hotPool.length + this.coldPool.length

    if (totalSize >= this.config.maxSize) {
      // 池已满，不保留
      return
    }

    if (useCount > 5 || useTime < 1000) {
      // 频繁使用或快速释放，放入热池
      this.hotPool.push(obj)
    } else {
      // 不频繁使用，放入冷池
      this.coldPool.push(obj)
    }

    this.stats.released++
  }

  /**
   * 预热池
   */
  private warmup(): void {
    const warmupSize = Math.floor(this.config.initialSize * this.config.warmupPercentage)

    for (let i = 0; i < warmupSize; i++) {
      const obj = this.factory()
      obj.__poolId = this.generateId()
      obj.__lastUsed = Date.now()
      obj.__useCount = 0
      this.coldPool.push(obj)
      this.stats.created++
    }
  }

  /**
   * 调整池大小
   */
  private adjustPoolSize(): void {
    const hitRate = this.getHitRate()
    const currentSize = this.hotPool.length + this.coldPool.length

    // 命中率低，考虑扩展
    if (hitRate < 0.7 && currentSize < this.config.maxSize) {
      const growSize = Math.floor(currentSize * (this.config.growthFactor - 1))
      const actualGrow = Math.min(growSize, this.config.maxSize - currentSize)

      for (let i = 0; i < actualGrow; i++) {
        const obj = this.factory()
        obj.__poolId = this.generateId()
        obj.__lastUsed = Date.now()
        obj.__useCount = 0
        this.coldPool.push(obj)
        this.stats.created++
      }
    }
  }

  /**
   * 启动定期清理
   */
  private startCleanup(): void {
    this.cleanupTimer = window.setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)
  }

  /**
   * 清理过期对象
   */
  private cleanup(): void {
    const now = Date.now()
    const maxIdleTime = this.config.maxIdleTime

    // 清理冷池中的过期对象
    this.coldPool = this.coldPool.filter(obj => {
      const idleTime = now - (obj.__lastUsed ?? now)
      return idleTime < maxIdleTime
    })

    // 如果池太大，收缩到合适大小
    const currentSize = this.hotPool.length + this.coldPool.length
    if (currentSize > this.config.minSize * 2) {
      const targetSize = Math.floor(currentSize * this.config.shrinkFactor)
      const removeCount = currentSize - Math.max(targetSize, this.config.minSize)

      // 优先从冷池移除
      const coldRemove = Math.min(removeCount, this.coldPool.length)
      this.coldPool.splice(0, coldRemove)

      // 如果还需要移除，从热池移除
      const hotRemove = removeCount - coldRemove
      if (hotRemove > 0) {
        this.hotPool.splice(0, hotRemove)
      }
    }

    // 定期将部分热池对象降级到冷池
    if (this.hotPool.length > 10) {
      const demoteCount = Math.floor(this.hotPool.length * 0.2)
      const demoted = this.hotPool.splice(0, demoteCount)
      this.coldPool.push(...demoted)
    }
  }

  /**
   * 估算对象大小
   */
  private estimateObjectSize(): void {
    try {
      const sample = this.factory()
      this.objectSize = this.roughSizeOfObject(sample)
    } catch {
      this.objectSize = 100 // 默认100字节
    }
  }

  /**
   * 粗略估算对象大小
   */
  private roughSizeOfObject(obj: any): number {
    const objectList: any[] = []
    const stack = [obj]
    let bytes = 0

    while (stack.length) {
      const value = stack.pop()

      if (typeof value === 'boolean') {
        bytes += 4
      } else if (typeof value === 'string') {
        bytes += value.length * 2
      } else if (typeof value === 'number') {
        bytes += 8
      } else if (typeof value === 'object' && value !== null) {
        if (objectList.indexOf(value) === -1) {
          objectList.push(value)
          bytes += 32 // 对象开销

          for (const key in value) {
            bytes += key.length * 2
            stack.push(value[key])
          }
        }
      }
    }

    return bytes
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 获取命中率
   */
  private getHitRate(): number {
    const total = this.stats.hits + this.stats.misses
    return total > 0 ? this.stats.hits / total : 0
  }

  /**
   * 获取统计信息
   */
  getStats(): PoolStats {
    const total = this.stats.acquired
    const avgUseTime = this.stats.released > 0
      ? this.stats.totalUseTime / this.stats.released
      : 0

    return {
      size: this.hotPool.length + this.coldPool.length,
      created: this.stats.created,
      acquired: this.stats.acquired,
      released: this.stats.released,
      reused: this.stats.reused,
      reuseRate: total > 0 ? (this.stats.reused / total) * 100 : 0,
      hitRate: this.getHitRate() * 100,
      avgUseTime,
      estimatedMemory: (this.hotPool.length + this.coldPool.length + this.inUse.size) * this.objectSize
    }
  }

  /**
   * 清空池
   */
  clear(): void {
    // 清理所有对象
    const allObjects = [...this.hotPool, ...this.coldPool]
    for (const obj of allObjects) {
      if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
          if (key !== '__poolId' && key !== '__lastUsed' && key !== '__useCount') {
            try {
              delete (obj as any)[key]
            } catch { }
          }
        }
      }
    }

    this.hotPool = []
    this.coldPool = []
    this.inUse.clear()

    // 重置统计
    this.stats = {
      created: 0,
      acquired: 0,
      released: 0,
      reused: 0,
      totalUseTime: 0,
      hits: 0,
      misses: 0
    }
  }

  /**
   * 销毁池
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = undefined
    }

    this.clear()
  }
}

/**
 * 创建增强版对象池
 */
export function createEnhancedObjectPool<T extends PoolableObject>(
  factory: () => T,
  resetter: (obj: T) => void,
  config?: PoolConfig
): EnhancedObjectPool<T> {
  return new EnhancedObjectPool(factory, resetter, config)
}

/**
 * 池化装饰器
 */
export function Pooled<T extends PoolableObject>(
  poolFactory: () => EnhancedObjectPool<T>
) {
  let pool: EnhancedObjectPool<T> | undefined

  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      if (!pool) {
        pool = poolFactory()
      }

      const obj = pool.acquire()

      try {
        const result = await originalMethod.call(this, obj, ...args)
        return result
      } finally {
        pool.release(obj)
      }
    }

    return descriptor
  }
}



