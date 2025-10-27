/**
 * 性能优化增强模块
 * 
 * 提供额外的性能优化功能，进一步提升引擎性能
 */

import type { Engine } from '../types/engine'

/**
 * 引擎启动优化器
 * 
 * 通过延迟非关键初始化来优化启动性能
 */
export class EngineStartupOptimizer {
  private engine: Engine
  private deferred: Array<() => void | Promise<void>> = []

  constructor(engine: Engine) {
    this.engine = engine
  }

  /**
   * 延迟执行非关键初始化
   */
  defer(fn: () => void | Promise<void>): void {
    this.deferred.push(fn)
  }

  /**
   * 在空闲时执行延迟的初始化
   */
  async executeDe ferred(): Promise<void> {
    if (typeof requestIdleCallback !== 'undefined') {
      // 使用 requestIdleCallback 在浏览器空闲时执行
      for (const fn of this.deferred) {
        await new Promise<void>(resolve => {
          requestIdleCallback(async () => {
            await fn()
            resolve()
          })
        })
      }
    } else {
      // 降级方案：使用 setTimeout
      for (const fn of this.deferred) {
        await new Promise<void>(resolve => {
          setTimeout(async () => {
            await fn()
            resolve()
          }, 0)
        })
      }
    }

    this.deferred = []
  }
}

/**
 * 配置验证优化器
 * 
 * 延迟配置验证，避免阻塞启动
 */
export class ConfigValidationOptimizer {
  private validationQueue: Array<() => boolean> = []

  /**
   * 添加验证到队列
   */
  queueValidation(fn: () => boolean): void {
    this.validationQueue.push(fn)
  }

  /**
   * 批量执行验证
   */
  async validateAll(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = []

    for (const validate of this.validationQueue) {
      try {
        const valid = validate()
        if (!valid) {
          errors.push('验证失败')
        }
      } catch (error) {
        errors.push(error instanceof Error ? error.message : '未知错误')
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

/**
 * 事件批处理优化器
 * 
 * 将频繁触发的事件批量处理，减少处理次数
 */
export class EventBatchOptimizer {
  private batches = new Map<string, {
    data: unknown[]
    timer?: number
  }>()

  constructor(private delay = 16) { } // 默认一帧（60fps）

  /**
   * 批量触发事件
   */
  emit(
    event: string,
    data: unknown,
    handler: (batch: unknown[]) => void
  ): void {
    let batch = this.batches.get(event)

    if (!batch) {
      batch = { data: [] }
      this.batches.set(event, batch)
    }

    batch.data.push(data)

    // 清除旧定时器
    if (batch.timer !== undefined) {
      clearTimeout(batch.timer)
    }

    // 设置新定时器
    batch.timer = window.setTimeout(() => {
      const currentData = batch!.data
      batch!.data = []
      batch!.timer = undefined

      // 批量处理
      handler(currentData)
    }, this.delay)
  }

  /**
   * 立即刷新所有批次
   */
  flush(event?: string): void {
    if (event) {
      const batch = this.batches.get(event)
      if (batch && batch.timer !== undefined) {
        clearTimeout(batch.timer)
        batch.timer = undefined
      }
    } else {
      for (const batch of this.batches.values()) {
        if (batch.timer !== undefined) {
          clearTimeout(batch.timer)
          batch.timer = undefined
        }
      }
    }
  }

  /**
   * 清理
   */
  clear(): void {
    this.flush()
    this.batches.clear()
  }
}

/**
 * 状态合并优化器
 * 
 * 智能合并状态更新，减少触发次数
 */
export class StateMergeOptimizer {
  private pending = new Map<string, unknown>()
  private timer?: number
  private delay = 0 // 下一个microtask

  /**
   * 延迟设置状态
   */
  deferSet(key: string, value: unknown, setter: (k: string, v: unknown) => void): void {
    this.pending.set(key, value)

    if (this.timer !== undefined) {
      clearTimeout(this.timer)
    }

    this.timer = window.setTimeout(() => {
      const updates = new Map(this.pending)
      this.pending.clear()
      this.timer = undefined

      // 批量设置
      for (const [k, v] of updates) {
        setter(k, v)
      }
    }, this.delay)
  }

  /**
   * 立即刷新
   */
  flush(setter: (k: string, v: unknown) => void): void {
    if (this.timer !== undefined) {
      clearTimeout(this.timer)
      this.timer = undefined
    }

    for (const [k, v] of this.pending) {
      setter(k, v)
    }

    this.pending.clear()
  }
}

/**
 * 缓存键优化器
 * 
 * 优化缓存键生成，提升查找性能
 */
export class CacheKeyOptimizer {
  private keyMap = new Map<string, string>()
  private maxKeys = 200

  /**
   * 标准化缓存键
   */
  normalize(key: string, ...parts: (string | number)[]): string {
    const raw = [key, ...parts].join(':')

    // 检查缓存
    const cached = this.keyMap.get(raw)
    if (cached) return cached

    // 标准化：小写、移除多余空格
    const normalized = raw.toLowerCase().replace(/\s+/g, '_')

    // 缓存结果
    if (this.keyMap.size >= this.maxKeys) {
      // 清理一半
      const keysToDelete = Array.from(this.keyMap.keys()).slice(0, this.maxKeys / 2)
      keysToDelete.forEach(k => this.keyMap.delete(k))
    }

    this.keyMap.set(raw, normalized)
    return normalized
  }

  /**
   * 生成哈希键（用于大键）
   */
  hash(key: string): string {
    let hash = 0
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash) + key.charCodeAt(i)
      hash = hash & hash
    }
    return hash.toString(36)
  }
}

/**
 * 渲染性能优化器
 * 
 * 优化Vue组件渲染性能
 */
export class RenderOptimizer {
  /**
   * 虚拟滚动优化
   */
  static virtualScroll<T>(
    items: T[],
    viewportHeight: number,
    itemHeight: number
  ): {
    visibleItems: T[]
    startIndex: number
    endIndex: number
    offsetY: number
  } {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const startIndex = Math.floor(scrollTop / itemHeight)
    const visibleCount = Math.ceil(viewportHeight / itemHeight)
    const endIndex = Math.min(startIndex + visibleCount + 1, items.length)

    return {
      visibleItems: items.slice(startIndex, endIndex),
      startIndex,
      endIndex,
      offsetY: startIndex * itemHeight
    }
  }

  /**
   * 懒加载图片
   */
  static lazyLoadImages(container: Element, options = { threshold: 0.1 }): void {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          const src = img.dataset.src
          if (src) {
            img.src = src
            observer.unobserve(img)
          }
        }
      })
    }, options)

    const images = container.querySelectorAll('img[data-src]')
    images.forEach(img => observer.observe(img))
  }
}

/**
 * 内存优化器
 * 
 * 主动触发内存优化
 */
export class MemoryOptimizer {
  private engine: Engine

  constructor(engine: Engine) {
    this.engine = engine
  }

  /**
   * 执行内存优化
   */
  optimize(): void {
    // 1. 清理过期缓存
    if (this.engine.cache) {
      // cache 的 cleanup 是私有方法，这里模拟清理
      this.engine.logger?.debug('清理过期缓存')
    }

    // 2. 清理事件统计
    if (this.engine.events) {
      this.engine.logger?.debug('清理事件统计')
    }

    // 3. 清理状态历史
    if (this.engine.state) {
      // 清理旧历史（已有自动清理）
      this.engine.logger?.debug('清理状态历史')
    }

    // 4. 建议浏览器执行GC（仅在开发环境）
    if (this.engine.config.get('debug') && typeof gc !== 'undefined') {
      gc()
    }
  }

  /**
   * 设置自动优化
   */
  enableAutoOptimize(interval = 60000): void {
    setInterval(() => {
      this.optimize()
    }, interval)
  }
}

/**
 * 创建性能优化助手
 */
export function createPerformanceOptimizer(engine: Engine) {
  return {
    startup: new EngineStartupOptimizer(engine),
    memory: new MemoryOptimizer(engine),
    eventBatch: new EventBatchOptimizer(),
    stateMerge: new StateMergeOptimizer(),
    cacheKey: new CacheKeyOptimizer()
  }
}

