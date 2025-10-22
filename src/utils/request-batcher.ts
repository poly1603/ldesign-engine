/**
 * 请求合并与批处理（DataLoader 模式）
 * 自动合并相同请求，批处理优化
 */

import type { CacheManager } from '../cache/cache-manager'

export interface BatcherConfig<K, V> {
  batchFn: (keys: K[]) => Promise<V[]>
  maxBatchSize?: number
  batchScheduler?: (callback: () => void) => void
  cacheKeyFn?: (key: K) => string
  cache?: CacheManager<V>
  cacheTTL?: number
}

interface BatchRequest<K, V> {
  key: K
  resolve: (value: V | PromiseLike<V>) => void
  reject: (reason?: any) => void
}

/**
 * DataLoader - 批量加载数据，自动去重和缓存
 */
export class DataLoader<K = any, V = any> {
  private config: Required<Omit<BatcherConfig<K, V>, 'cache' | 'cacheTTL'>> & {
    cache?: CacheManager<V>
    cacheTTL?: number
  }
  private queue: BatchRequest<K, V>[] = []
  private scheduled = false
  private stats = {
    totalRequests: 0,
    batchedRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalBatches: 0,
    averageBatchSize: 0
  }

  constructor(config: BatcherConfig<K, V>) {
    this.config = {
      batchFn: config.batchFn,
      maxBatchSize: config.maxBatchSize || 100,
      batchScheduler: config.batchScheduler || ((cb) => setTimeout(cb, 0)),
      cacheKeyFn: config.cacheKeyFn || ((key) => String(key)),
      cache: config.cache,
      cacheTTL: config.cacheTTL
    }
  }

  /**
   * 加载单个值
   */
  async load(key: K): Promise<V> {
    this.stats.totalRequests++

    // 检查缓存
    if (this.config.cache) {
      const cacheKey = this.config.cacheKeyFn(key)
      const cached = await this.config.cache.get(cacheKey)

      if (cached !== undefined) {
        this.stats.cacheHits++
        return cached as V
      }
      this.stats.cacheMisses++
    }

    // 返回Promise，加入批处理队列
    return new Promise<V>((resolve, reject) => {
      this.queue.push({ key, resolve, reject })

      // 调度批处理
      if (!this.scheduled) {
        this.scheduled = true
        this.config.batchScheduler(() => {
          this.processBatch()
        })
      }
    })
  }

  /**
   * 加载多个值
   */
  async loadMany(keys: K[]): Promise<V[]> {
    return Promise.all(keys.map(key => this.load(key)))
  }

  /**
   * 处理批次
   */
  private async processBatch(): Promise<void> {
    this.scheduled = false

    if (this.queue.length === 0) {
      return
    }

    // 取出当前队列
    const batch = this.queue.splice(0, this.config.maxBatchSize)
    this.stats.batchedRequests += batch.length
    this.stats.totalBatches++

    // 更新平均批次大小
    this.stats.averageBatchSize =
      (this.stats.averageBatchSize * (this.stats.totalBatches - 1) + batch.length) /
      this.stats.totalBatches

    // 提取所有键（去重）
    const uniqueKeys: K[] = []
    const keyToRequests = new Map<string, BatchRequest<K, V>[]>()

    for (const request of batch) {
      const cacheKey = this.config.cacheKeyFn(request.key)

      if (!keyToRequests.has(cacheKey)) {
        uniqueKeys.push(request.key)
        keyToRequests.set(cacheKey, [])
      }

      keyToRequests.get(cacheKey)!.push(request)
    }

    try {
      // 批量加载
      const results = await this.config.batchFn(uniqueKeys)

      // 分发结果
      for (let i = 0; i < uniqueKeys.length; i++) {
        const key = uniqueKeys[i]
        const cacheKey = this.config.cacheKeyFn(key)
        const result = results[i]
        const requests = keyToRequests.get(cacheKey) || []

        // 缓存结果
        if (this.config.cache && result !== undefined) {
          await this.config.cache.set(cacheKey, result, this.config.cacheTTL)
        }

        // 解析所有相同key的请求
        for (const request of requests) {
          request.resolve(result)
        }
      }
    } catch (error) {
      // 批量失败，拒绝所有请求
      for (const request of batch) {
        request.reject(error)
      }
    }

    // 如果还有剩余请求，继续处理
    if (this.queue.length > 0) {
      this.config.batchScheduler(() => {
        this.processBatch()
      })
    }
  }

  /**
   * 清除缓存
   */
  async clearCache(): Promise<void> {
    if (this.config.cache) {
      await this.config.cache.clear()
    }
  }

  /**
   * 清除特定键的缓存
   */
  async prime(key: K, value: V): Promise<void> {
    if (this.config.cache) {
      const cacheKey = this.config.cacheKeyFn(key)
      await this.config.cache.set(cacheKey, value, this.config.cacheTTL)
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): typeof DataLoader.prototype.stats {
    return { ...this.stats }
  }

  /**
   * 重置统计
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      batchedRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalBatches: 0,
      averageBatchSize: 0
    }
  }
}

/**
 * 创建 DataLoader 实例
 */
export function createDataLoader<K = any, V = any>(
  config: BatcherConfig<K, V>
): DataLoader<K, V> {
  return new DataLoader(config)
}

// ============================================
// 请求合并器（Request Merger）
// ============================================

export interface RequestMergerConfig {
  mergeWindow?: number    // 合并时间窗口（ms）
  maxBatchSize?: number   // 最大批次大小
}

/**
 * 请求合并器 - 合并相同的请求
 */
export class RequestMerger<T = any> {
  private pendingRequests = new Map<string, {
    promise: Promise<T>
    resolve: (value: T) => void
    reject: (error: any) => void
    timestamp: number
  }>()
  private config: Required<RequestMergerConfig>

  constructor(config: RequestMergerConfig = {}) {
    this.config = {
      mergeWindow: config.mergeWindow || 10,
      maxBatchSize: config.maxBatchSize || 100
    }
  }

  /**
   * 合并执行请求
   */
  async execute(
    key: string,
    fn: () => Promise<T>
  ): Promise<T> {
    // 检查是否已有相同的pending请求
    const pending = this.pendingRequests.get(key)
    if (pending) {
      // 检查是否在合并窗口内
      if (Date.now() - pending.timestamp < this.config.mergeWindow) {
        return pending.promise
      }
    }

    // 创建新的请求Promise
    let resolve!: (value: T) => void
    let reject!: (error: any) => void

    const promise = new Promise<T>((res, rej) => {
      resolve = res
      reject = rej
    })

    this.pendingRequests.set(key, {
      promise,
      resolve,
      reject,
      timestamp: Date.now()
    })

    // 执行请求
    try {
      const result = await fn()
      resolve(result)
      return result
    } catch (error) {
      reject(error)
      throw error
    } finally {
      // 清理
      this.pendingRequests.delete(key)
    }
  }

  /**
   * 清除所有pending请求
   */
  clear(): void {
    // 拒绝所有pending请求
    for (const [, pending] of this.pendingRequests) {
      pending.reject(new Error('Request merger cleared'))
    }
    this.pendingRequests.clear()
  }

  /**
   * 获取pending数量
   */
  getPendingCount(): number {
    return this.pendingRequests.size
  }
}

/**
 * 创建请求合并器
 */
export function createRequestMerger<T = any>(
  config?: RequestMergerConfig
): RequestMerger<T> {
  return new RequestMerger<T>(config)
}

// ============================================
// 批处理调度器（Batch Scheduler）
// ============================================

export interface BatchSchedulerConfig<T, R> {
  processFn: (items: T[]) => Promise<R[]>
  maxBatchSize?: number
  maxWaitTime?: number    // 最大等待时间（ms）
  minBatchSize?: number   // 最小批次大小
}

/**
 * 批处理调度器
 */
export class BatchScheduler<T = any, R = any> {
  private queue: Array<{
    item: T
    resolve: (result: R) => void
    reject: (error: any) => void
    addedAt: number
  }> = []
  private timer?: number
  private config: Required<BatchSchedulerConfig<T, R>>
  private processing = false

  constructor(config: BatchSchedulerConfig<T, R>) {
    this.config = {
      processFn: config.processFn,
      maxBatchSize: config.maxBatchSize || 100,
      maxWaitTime: config.maxWaitTime || 10,
      minBatchSize: config.minBatchSize || 1
    }
  }

  /**
   * 添加项到批处理队列
   */
  async add(item: T): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      this.queue.push({
        item,
        resolve,
        reject,
        addedAt: Date.now()
      })

      // 如果达到最大批次大小，立即处理
      if (this.queue.length >= this.config.maxBatchSize) {
        this.flush()
      } else if (!this.timer) {
        // 否则设置定时器
        this.timer = window.setTimeout(() => {
          this.flush()
        }, this.config.maxWaitTime)
      }
    })
  }

  /**
   * 立即处理当前批次
   */
  async flush(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return
    }

    // 清除定时器
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = undefined
    }

    this.processing = true

    // 取出批次
    const batch = this.queue.splice(0, this.config.maxBatchSize)
    const items = batch.map(b => b.item)

    try {
      const results = await this.config.processFn(items)

      // 分发结果
      for (let i = 0; i < batch.length; i++) {
        batch[i].resolve(results[i])
      }
    } catch (error) {
      // 批次失败，拒绝所有
      for (const item of batch) {
        item.reject(error)
      }
    } finally {
      this.processing = false

      // 如果还有剩余项，继续处理
      if (this.queue.length >= this.config.minBatchSize) {
        this.flush()
      }
    }
  }

  /**
   * 获取队列大小
   */
  getQueueSize(): number {
    return this.queue.length
  }

  /**
   * 清空队列
   */
  clear(): void {
    // 拒绝所有pending项
    for (const item of this.queue) {
      item.reject(new Error('Batch scheduler cleared'))
    }
    this.queue = []

    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = undefined
    }
  }

  /**
   * 销毁调度器
   */
  destroy(): void {
    this.clear()
  }
}

/**
 * 创建批处理调度器
 */
export function createBatchScheduler<T = any, R = any>(
  config: BatchSchedulerConfig<T, R>
): BatchScheduler<T, R> {
  return new BatchScheduler(config)
}

// ============================================
// 使用示例
// ============================================

/**
 * 示例：批量加载用户数据
 */
export class UserService {
  private userLoader: DataLoader<string, User>

  constructor(cache?: CacheManager<User>) {
    this.userLoader = createDataLoader({
      batchFn: async (userIds: string[]) => {
        // 批量从API获取用户
        const response = await fetch('/api/users', {
          method: 'POST',
          body: JSON.stringify({ ids: userIds }),
          headers: { 'Content-Type': 'application/json' }
        })
        return response.json()
      },
      maxBatchSize: 50,
      cache,
      cacheTTL: 60000, // 1分钟缓存
      cacheKeyFn: (userId) => `user:${userId}`
    })
  }

  async getUser(userId: string): Promise<User> {
    return this.userLoader.load(userId)
  }

  async getUsers(userIds: string[]): Promise<User[]> {
    return this.userLoader.loadMany(userIds)
  }
}

interface User {
  id: string
  name: string
  email: string
}



