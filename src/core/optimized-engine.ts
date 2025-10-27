/**
 * 优化版引擎核心
 * 
 * 集成所有优化后的组件，提供极致性能体验
 */

import type { EngineConfig, Engine } from '../types'
import { EngineImpl } from './engine'

/**
 * 优化配置
 */
export interface OptimizationConfig {
  /** 启用内存优化 */
  enableMemoryOptimization?: boolean
  /** 启用性能分析 */
  enableProfiling?: boolean
  /** 启用激进优化 */
  enableAggressiveOptimization?: boolean
  /** 内存限制（MB） */
  memoryLimit?: number
  /** 批处理延迟 */
  batchDelay?: number
}

/**
 * 创建优化版引擎
 */
export function createOptimizedEngine(
  config: EngineConfig & { optimization?: OptimizationConfig } = {}
): Engine {
  const optimization = config.optimization || {}

  // 动态导入优化组件
  const createOptimizedComponents = async () => {
    const [
      { createOptimizedMemoryManager },
      { createOptimizedCacheManager },
      { createOptimizedEventManager },
      { createOptimizedStateManager },
      { createObjectPoolManager }
    ] = await Promise.all([
      import('../utils/memory/optimized-memory-manager'),
      import('../cache/optimized-cache-manager'),
      import('../events/optimized-event-manager'),
      import('../state/optimized-state-manager'),
      import('./object-pools')
    ])

    return {
      createOptimizedMemoryManager,
      createOptimizedCacheManager,
      createOptimizedEventManager,
      createOptimizedStateManager,
      createObjectPoolManager
    }
  }

  // 创建基础引擎
  const engine = new OptimizedEngineImpl(config)

  // 异步初始化优化组件
  if (optimization.enableMemoryOptimization !== false) {
    createOptimizedComponents().then(components => {
      const memoryManager = components.createOptimizedMemoryManager({
        totalMemoryLimit: optimization.memoryLimit || 512,
        aggressiveGC: optimization.enableAggressiveOptimization || false,
        logger: engine.logger
      })

      const poolManager = components.createObjectPoolManager()

        // 注入优化管理器
        (engine as any).__memoryManager = memoryManager
          (engine as any).__poolManager = poolManager

      // 设置内存配额
      memoryManager.registerQuota('cache', 100 * 1024 * 1024, 8)
      memoryManager.registerQuota('state', 50 * 1024 * 1024, 7)
      memoryManager.registerQuota('events', 20 * 1024 * 1024, 6)
    })
  }

  return engine
}

/**
 * 优化版引擎实现
 */
class OptimizedEngineImpl extends EngineImpl {
  private __memoryManager?: any
  private __poolManager?: any

  constructor(config: EngineConfig) {
    super(config)

    // 设置优化钩子
    this.setupOptimizationHooks()
  }

  /**
   * 设置优化钩子
   */
  private setupOptimizationHooks(): void {
    // 定期执行内存优化
    if (this.__memoryManager) {
      setInterval(() => {
        const stats = this.__memoryManager!.getMemoryStats()

        // 根据内存压力调整策略
        if (stats.memoryPressure === 'high') {
          this.logger.warn('High memory pressure detected, triggering optimization')

          // 清理缓存
          if ('shrink' in this.cache) {
            (this.cache as any).shrink(0.5)
          }

          // 触发GC
          this.__memoryManager!.triggerGarbageCollection()
        }
      }, 30000) // 每30秒检查一次
    }
  }

  /**
   * 获取优化统计
   */
  getOptimizationStats(): {
    memory?: any
    pools?: any
    suggestions: string[]
  } {
    const stats: any = {
      suggestions: []
    }

    if (this.__memoryManager) {
      stats.memory = this.__memoryManager.getMemoryStats()
      stats.suggestions.push(...this.__memoryManager.getOptimizationSuggestions())
    }

    if (this.__poolManager) {
      stats.pools = this.__poolManager.getAllStats()
    }

    // 添加基于当前状态的建议
    const cacheStats = 'getStats' in this.cache
      ? (this.cache as any).getStats()
      : null

    if (cacheStats?.hitRate < 70) {
      stats.suggestions.push('Cache hit rate is low. Consider adjusting cache size or TTL.')
    }

    const eventStats = 'getStats' in this.events
      ? (this.events as any).getStats()
      : null

    if (eventStats?.listenerCount > 1000) {
      stats.suggestions.push('High number of event listeners. Consider using event namespaces or cleanup.')
    }

    return stats
  }

  /**
   * 执行性能基准测试
   */
  async runBenchmark(): Promise<{
    results: Record<string, any>
    summary: string
  }> {
    const results: Record<string, any> = {}

    // 缓存性能测试
    const cacheStart = performance.now()
    for (let i = 0; i < 10000; i++) {
      await this.cache.set(`bench-${i}`, { data: i })
      await this.cache.get(`bench-${i}`)
    }
    results.cache = {
      operations: 20000,
      time: performance.now() - cacheStart,
      opsPerSecond: 20000 / ((performance.now() - cacheStart) / 1000)
    }

    // 状态管理性能测试
    const stateStart = performance.now()
    for (let i = 0; i < 10000; i++) {
      this.state.set(`bench.item.${i}`, { value: i })
      this.state.get(`bench.item.${i}`)
    }
    results.state = {
      operations: 20000,
      time: performance.now() - stateStart,
      opsPerSecond: 20000 / ((performance.now() - stateStart) / 1000)
    }

    // 事件系统性能测试
    let eventCount = 0
    this.events.on('bench-event', () => { eventCount++ })

    const eventStart = performance.now()
    for (let i = 0; i < 10000; i++) {
      this.events.emit('bench-event', { id: i })
    }
    results.events = {
      operations: 10000,
      time: performance.now() - eventStart,
      opsPerSecond: 10000 / ((performance.now() - eventStart) / 1000),
      handled: eventCount
    }

    // 清理测试数据
    await this.cache.clear()
    this.state.clear()
    this.events.removeAllListeners('bench-event')

    // 生成总结
    const summary = `
Performance Benchmark Results:
- Cache: ${results.cache.opsPerSecond.toFixed(0)} ops/sec
- State: ${results.state.opsPerSecond.toFixed(0)} ops/sec  
- Events: ${results.events.opsPerSecond.toFixed(0)} ops/sec
    `.trim()

    return { results, summary }
  }

  /**
   * 优化的销毁方法
   */
  async destroy(): Promise<void> {
    // 销毁优化管理器
    if (this.__memoryManager) {
      this.__memoryManager.destroy()
    }

    if (this.__poolManager) {
      this.__poolManager.destroy()
    }

    // 调用父类销毁
    await super.destroy()
  }
}

/**
 * 性能监控装饰器
 */
export function Monitored(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value

  descriptor.value = async function (...args: any[]) {
    const start = performance.now()
    const memBefore = getMemoryUsage()

    try {
      const result = await originalMethod.apply(this, args)

      const duration = performance.now() - start
      const memAfter = getMemoryUsage()
      const memDelta = memAfter - memBefore

      if (duration > 10 || memDelta > 1024 * 1024) {
        console.log(`[Performance] ${propertyKey}: ${duration.toFixed(2)}ms, Δmem: ${(memDelta / 1024).toFixed(2)}KB`)
      }

      return result
    } catch (error) {
      console.error(`[Performance] ${propertyKey} failed:`, error)
      throw error
    }
  }

  return descriptor
}

function getMemoryUsage(): number {
  if (typeof window !== 'undefined' && (window.performance as any)?.memory) {
    return (window.performance as any).memory.usedJSHeapSize
  }

  if (typeof process !== 'undefined' && process.memoryUsage) {
    return process.memoryUsage().heapUsed
  }

  return 0
}

/**
 * 内存限制装饰器
 */
export function MemoryLimit(maxBytes: number) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const memBefore = getMemoryUsage()

      const result = await originalMethod.apply(this, args)

      const memAfter = getMemoryUsage()
      const memUsed = memAfter - memBefore

      if (memUsed > maxBytes) {
        console.warn(`[Memory] ${propertyKey} exceeded limit: used ${(memUsed / 1024 / 1024).toFixed(2)}MB, limit ${(maxBytes / 1024 / 1024).toFixed(2)}MB`)

        // 触发清理
        if (typeof gc !== 'undefined') {
          gc()
        }
      }

      return result
    }

    return descriptor
  }
}
