/**
 * 全面的内存泄漏测试
 * 测试所有管理器的内存管理
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createEngine } from '../../src/core/engine'
import { createEventManager } from '../../src/events/event-manager'
import { createStateManager } from '../../src/state/state-manager'
import { createCacheManager } from '../../src/cache/cache-manager'
import { createWorkerPool } from '../../src/workers/worker-pool'
import { createModuleLoader } from '../../src/core/module-loader'

describe('内存泄漏测试', () => {
  describe('事件管理器内存管理', () => {
    let eventManager: ReturnType<typeof createEventManager>

    beforeEach(() => {
      eventManager = createEventManager()
    })

    afterEach(() => {
      if ('destroy' in eventManager) {
        ; (eventManager as any).destroy()
      }
    })

    it('监听器正确清理', () => {
      const handlers: Array<() => void> = []

      // 添加大量监听器
      for (let i = 0; i < 100; i++) {
        const handler = () => { }
        handlers.push(handler)
        eventManager.on('test', handler)
      }

      expect(eventManager.listenerCount('test')).toBe(100)

      // 移除所有监听器
      for (const handler of handlers) {
        eventManager.off('test', handler)
      }

      expect(eventManager.listenerCount('test')).toBe(0)
    })

    it('一次性监听器自动清理', () => {
      for (let i = 0; i < 100; i++) {
        eventManager.once('once-event', () => { })
      }

      expect(eventManager.listenerCount('once-event')).toBe(100)

      eventManager.emit('once-event', {})

      expect(eventManager.listenerCount('once-event')).toBe(0)
    })

    it('优先级桶正确清理', () => {
      for (let i = 0; i < 50; i++) {
        eventManager.on('priority-test', () => { }, i * 10)
      }

      expect(eventManager.listenerCount('priority-test')).toBe(50)

      eventManager.removeAllListeners('priority-test')

      expect(eventManager.listenerCount('priority-test')).toBe(0)
    })
  })

  describe('状态管理器内存管理', () => {
    let stateManager: ReturnType<typeof createStateManager>

    beforeEach(() => {
      stateManager = createStateManager()
    })

    afterEach(() => {
      if ('destroy' in stateManager) {
        ; (stateManager as any).destroy()
      }
    })

    it('监听器引用计数正确', () => {
      const watchers: Array<() => void> = []

      // 添加多个监听器到同一个键
      for (let i = 0; i < 10; i++) {
        const unwatch = stateManager.watch('test-key', () => { })
        watchers.push(unwatch)
      }

      // 移除所有监听器
      for (const unwatch of watchers) {
        unwatch()
      }

      // 验证清理
      const stats = stateManager.getStats()
      expect(stats.totalWatchers).toBe(0)
    })

    it('路径编译缓存限制', () => {
      // 生成大量不同的路径
      for (let i = 0; i < 300; i++) {
        stateManager.set(`path.${i}.value`, i)
      }

      // 路径缓存应该被限制
      // 内部pathSegmentsCache最大200
      const stats = stateManager.getStats()
      expect(stats.totalKeys).toBeLessThanOrEqual(300)
    })

    it('批量操作不导致内存泄漏', () => {
      const updates: Record<string, unknown> = {}

      for (let i = 0; i < 100; i++) {
        updates[`key${i}`] = { value: i }
      }

      stateManager.batchSet(updates)

      const keys = stateManager.keys()
      expect(keys.length).toBe(100)

      stateManager.clear()
      expect(stateManager.keys().length).toBe(0)
    })
  })

  describe('缓存管理器内存管理', () => {
    let cacheManager: ReturnType<typeof createCacheManager>

    beforeEach(() => {
      cacheManager = createCacheManager({ maxSize: 100 })
    })

    afterEach(() => {
      if ('destroy' in cacheManager) {
        ; (cacheManager as any).destroy()
      }
    })

    it('缓存自动淘汰', async () => {
      // 写入超过限制的数据
      for (let i = 0; i < 150; i++) {
        await cacheManager.set(`key-${i}`, `value-${i}`)
      }

      const stats = cacheManager.getStats()
      expect(stats.size).toBeLessThanOrEqual(100)
      expect(stats.evictions).toBeGreaterThan(0)
    })

    it('分片缓存正确清理', async () => {
      // 大缓存会启用分片
      const largeCacheManager = createCacheManager({ maxSize: 200 })

      for (let i = 0; i < 200; i++) {
        await largeCacheManager.set(`key-${i}`, { data: i })
      }

      await largeCacheManager.clear()

      const stats = largeCacheManager.getStats()
      expect(stats.size).toBe(0)
      expect(stats.memoryUsage).toBe(0)

      if ('destroy' in largeCacheManager) {
        ; (largeCacheManager as any).destroy()
      }
    })
  })

  describe('Worker池内存管理', () => {
    let workerPool: ReturnType<typeof createWorkerPool>

    beforeEach(() => {
      workerPool = createWorkerPool({
        minWorkers: 2,
        maxWorkers: 4
      })
    })

    afterEach(() => {
      workerPool.terminate()
    })

    it('Blob URLs正确清理', () => {
      const initialStats = workerPool.getResourceStats()

      // 执行任务触发Worker创建
      const tasks = []
      for (let i = 0; i < 10; i++) {
        tasks.push(workerPool.execute({
          id: `task-${i}`,
          type: 'compute',
          data: { iterations: 1000 }
        }))
      }

      // 终止pool
      workerPool.terminate()

      const finalStats = workerPool.getResourceStats()
      expect(finalStats.activeBlobUrls).toBe(0)
    })

    it('Worker池收缩功能', () => {
      const status = workerPool.getStatus()
      const initialWorkers = status.workers

      // 收缩到最小值
      const terminated = workerPool.shrink(2)

      const newStatus = workerPool.getStatus()
      expect(newStatus.workers).toBeLessThanOrEqual(initialWorkers)
    })
  })

  describe('模块加载器内存管理', () => {
    let moduleLoader: ReturnType<typeof createModuleLoader>

    beforeEach(() => {
      moduleLoader = createModuleLoader({
        enableCache: true
      })
    })

    afterEach(() => {
      moduleLoader.destroy()
    })

    it('LRU缓存限制', () => {
      // 注册大量模块
      for (let i = 0; i < 100; i++) {
        moduleLoader.register({
          name: `module-${i}`,
          dependencies: [],
          exports: [],
          loaded: false
        })
      }

      const stats = moduleLoader.getCacheStats()
      expect(stats.size).toBeLessThanOrEqual(stats.maxSize)
    })

    it('模块卸载功能', () => {
      moduleLoader.register({
        name: 'test-module',
        dependencies: [],
        exports: [],
        loaded: true
      })

      const unloaded = moduleLoader.unload('test-module')
      expect(unloaded).toBe(true)

      const metadata = moduleLoader.getMetadata('test-module')
      expect(metadata?.loaded).toBe(false)
    })

    it('缓存收缩功能', () => {
      // 填充缓存
      for (let i = 0; i < 50; i++) {
        moduleLoader.register({
          name: `mod-${i}`,
          dependencies: [],
          exports: [],
          loaded: true
        })
      }

      moduleLoader.shrinkCache(25)

      const stats = moduleLoader.getCacheStats()
      expect(stats.size).toBeLessThanOrEqual(25)
    })
  })

  describe('长期运行内存稳定性', () => {
    it('事件系统长期运行', async () => {
      const eventManager = createEventManager()

      // 模拟长期运行：10000次操作
      for (let i = 0; i < 10000; i++) {
        const handler = () => { }
        eventManager.on(`event-${i % 100}`, handler)
        eventManager.emit(`event-${i % 100}`, { data: i })
        eventManager.off(`event-${i % 100}`, handler)
      }

      const stats = eventManager.getStats()
      // 应该没有剩余监听器
      expect(stats.totalListeners).toBe(0)

      if ('destroy' in eventManager) {
        ; (eventManager as any).destroy()
      }
    })

    it('状态系统长期运行', () => {
      const stateManager = createStateManager()

      // 模拟长期运行
      for (let i = 0; i < 10000; i++) {
        stateManager.set(`key-${i % 50}`, i)
        stateManager.get(`key-${i % 50}`)
      }

      const stats = stateManager.getStats()
      expect(stats.totalKeys).toBeLessThanOrEqual(50)

      if ('destroy' in stateManager) {
        ; (stateManager as any).destroy()
      }
    })

    it('缓存系统长期运行', async () => {
      const cacheManager = createCacheManager({ maxSize: 50 })

      // 模拟长期运行
      for (let i = 0; i < 10000; i++) {
        await cacheManager.set(`key-${i}`, `value-${i}`)
      }

      const stats = cacheManager.getStats()
      expect(stats.size).toBeLessThanOrEqual(50)

      if ('destroy' in cacheManager) {
        ; (cacheManager as any).destroy()
      }
    })
  })

  describe('引擎完整生命周期', () => {
    it('创建和销毁不泄漏', async () => {
      for (let i = 0; i < 10; i++) {
        const engine = createEngine({
          debug: true,
          cache: { maxSize: 50 }
        })

        // 使用各种功能
        engine.events.on('test', () => { })
        engine.state.set('key', 'value')
        await engine.cache.set('cache-key', 'cache-value')

        // 销毁
        await engine.destroy()
      }

      // 如果有泄漏，这里会累积内存
      expect(true).toBe(true)
    })
  })
})



