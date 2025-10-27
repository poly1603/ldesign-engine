/**
 * 内存性能基准测试
 * 
 * 专门测试内存使用和优化效果
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createEngine } from '../../src'
import { OptimizedMemoryManager } from '../../src/utils/memory/optimized-memory-manager'
import { MemoryLeakDetector } from '../../src/utils/memory-optimizer'
import { EnhancedObjectPool } from '../../src/utils/memory/enhanced-object-pool'

// 内存使用追踪器
class MemoryTracker {
  private snapshots: Array<{
    timestamp: number
    heapUsed: number
    heapTotal: number
    external: number
  }> = []

  private initialMemory?: number

  start(): void {
    if (typeof gc !== 'undefined') {
      gc() // 强制GC以获得准确的基准
    }

    const memory = this.getMemoryUsage()
    this.initialMemory = memory.heapUsed
    this.snapshots = []
    this.takeSnapshot()
  }

  takeSnapshot(): void {
    const memory = this.getMemoryUsage()
    this.snapshots.push({
      timestamp: Date.now(),
      heapUsed: memory.heapUsed,
      heapTotal: memory.heapTotal,
      external: memory.external || 0
    })
  }

  getMemoryUsage(): { heapUsed: number; heapTotal: number; external?: number } {
    if (typeof window !== 'undefined' && (window.performance as any)?.memory) {
      const memory = (window.performance as any).memory
      return {
        heapUsed: memory.usedJSHeapSize,
        heapTotal: memory.totalJSHeapSize,
        external: 0
      }
    }

    // Node.js环境
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage()
      return {
        heapUsed: usage.heapUsed,
        heapTotal: usage.heapTotal,
        external: usage.external
      }
    }

    return { heapUsed: 0, heapTotal: 0, external: 0 }
  }

  getReport(): {
    initialMemory: number
    finalMemory: number
    peakMemory: number
    averageMemory: number
    memoryGrowth: number
    growthPercentage: number
    snapshots: typeof this.snapshots
  } {
    const finalSnapshot = this.snapshots[this.snapshots.length - 1]
    const peakMemory = Math.max(...this.snapshots.map(s => s.heapUsed))
    const averageMemory = this.snapshots.reduce((sum, s) => sum + s.heapUsed, 0) / this.snapshots.length
    const memoryGrowth = finalSnapshot.heapUsed - (this.initialMemory || 0)

    return {
      initialMemory: this.initialMemory || 0,
      finalMemory: finalSnapshot.heapUsed,
      peakMemory,
      averageMemory,
      memoryGrowth,
      growthPercentage: (memoryGrowth / (this.initialMemory || 1)) * 100,
      snapshots: this.snapshots
    }
  }
}

describe('内存性能基准测试', () => {
  let memoryTracker: MemoryTracker

  beforeEach(() => {
    memoryTracker = new MemoryTracker()
  })

  describe('对象池内存效率', () => {
    it('对象池应该显著减少内存分配', async () => {
      interface TestObject {
        id: number
        data: number[]
        text: string
        reset(): void
      }

      // 测试无对象池的情况
      memoryTracker.start()
      const withoutPool: TestObject[] = []

      for (let i = 0; i < 10000; i++) {
        withoutPool.push({
          id: i,
          data: new Array(100).fill(i),
          text: `object-${i}`.repeat(10),
          reset() {
            this.id = 0
            this.data = []
            this.text = ''
          }
        })
      }

      memoryTracker.takeSnapshot()
      const withoutPoolReport = memoryTracker.getReport()

      // 清理
      withoutPool.length = 0
      if (typeof gc !== 'undefined') gc()
      await new Promise(resolve => setTimeout(resolve, 100))

      // 测试使用对象池的情况
      memoryTracker.start()
      const pool = new EnhancedObjectPool<TestObject>(
        () => ({
          id: 0,
          data: [],
          text: '',
          reset() {
            this.id = 0
            this.data = []
            this.text = ''
          }
        }),
        (obj) => obj.reset(),
        { maxSize: 100 }
      )

      for (let i = 0; i < 10000; i++) {
        const obj = pool.acquire()
        obj.id = i
        obj.data = new Array(100).fill(i)
        obj.text = `object-${i}`.repeat(10)
        pool.release(obj)
      }

      memoryTracker.takeSnapshot()
      const withPoolReport = memoryTracker.getReport()

      console.log('对象池内存效率对比:', {
        withoutPool: {
          growth: `${(withoutPoolReport.memoryGrowth / 1024 / 1024).toFixed(2)} MB`,
          percentage: `${withoutPoolReport.growthPercentage.toFixed(2)}%`
        },
        withPool: {
          growth: `${(withPoolReport.memoryGrowth / 1024 / 1024).toFixed(2)} MB`,
          percentage: `${withPoolReport.growthPercentage.toFixed(2)}%`
        },
        improvement: `${((1 - withPoolReport.memoryGrowth / withoutPoolReport.memoryGrowth) * 100).toFixed(2)}%`
      })

      expect(withPoolReport.memoryGrowth).toBeLessThan(withoutPoolReport.memoryGrowth * 0.3)

      pool.destroy()
    })
  })

  describe('内存管理器效率', () => {
    it('内存管理器应该有效控制内存增长', async () => {
      const memoryManager = new OptimizedMemoryManager({
        totalMemoryLimit: 50, // 50MB
        enableCompaction: true
      })

      memoryTracker.start()

      // 注册模块
      memoryManager.registerQuota('module1', 20 * 1024 * 1024)
      memoryManager.registerQuota('module2', 20 * 1024 * 1024)

      // 模拟内存分配和释放
      const buffers: ArrayBuffer[] = []

      for (let cycle = 0; cycle < 5; cycle++) {
        // 分配阶段
        for (let i = 0; i < 100; i++) {
          const buffer = memoryManager.allocate('module1', 100 * 1024) // 100KB
          if (buffer) {
            buffers.push(buffer)
          }
        }

        memoryTracker.takeSnapshot()

        // 释放一半
        const toRelease = buffers.splice(0, Math.floor(buffers.length / 2))
        for (const buffer of toRelease) {
          memoryManager.deallocate('module1', buffer)
        }

        // 触发GC
        memoryManager.triggerGarbageCollection()
        await new Promise(resolve => setTimeout(resolve, 10))

        memoryTracker.takeSnapshot()
      }

      const report = memoryTracker.getReport()
      const stats = memoryManager.getMemoryStats()

      console.log('内存管理器效率:', {
        memoryGrowth: `${(report.memoryGrowth / 1024 / 1024).toFixed(2)} MB`,
        peakMemory: `${(report.peakMemory / 1024 / 1024).toFixed(2)} MB`,
        finalMemory: `${(report.finalMemory / 1024 / 1024).toFixed(2)} MB`,
        allocations: stats.performanceStats.allocations,
        deallocations: stats.performanceStats.deallocations,
        gcCycles: stats.performanceStats.gcCycles
      })

      // 内存增长应该被控制在合理范围内
      expect(report.growthPercentage).toBeLessThan(50)
      expect(stats.performanceStats.gcCycles).toBeGreaterThan(0)

      memoryManager.destroy()
    })
  })

  describe('内存泄漏检测', () => {
    it('应该能够检测潜在的内存泄漏', async () => {
      const detector = new MemoryLeakDetector()
      detector.start()

      // 模拟内存泄漏场景
      const leakyObjects: any[] = []

      for (let i = 0; i < 10; i++) {
        // 创建大对象并保持引用（模拟泄漏）
        const obj = {
          id: i,
          data: new Array(1000).fill(i),
          nested: {
            moreData: new Array(1000).fill(i)
          }
        }
        leakyObjects.push(obj)

        // 追踪对象
        detector.trackObject(`obj-${i}`)

        // 等待一下让检测器工作
        await new Promise(resolve => setTimeout(resolve, 10))
      }

      // 获取报告
      const report = detector.getReport()

      console.log('内存泄漏检测报告:', {
        snapshotCount: report.snapshots.length,
        possibleLeaks: report.possibleLeaks,
        recommendation: report.recommendation
      })

      // 应该检测到对象累积
      expect(report.possibleLeaks.length).toBeGreaterThan(0)

      detector.destroy()
    })
  })

  describe('引擎内存占用', () => {
    it('引擎应该有较低的内存占用', async () => {
      memoryTracker.start()

      // 创建多个引擎实例
      const engines = []

      for (let i = 0; i < 10; i++) {
        const engine = createEngine({
          debug: false,
          cache: { maxSize: 100 },
          performance: { enabled: false }
        })
        engines.push(engine)

        // 执行一些操作
        for (let j = 0; j < 100; j++) {
          engine.state.set(`key${j}`, { value: j })
          engine.cache.set(`cache${j}`, { data: j })
          engine.events.emit('test', { id: j })
        }
      }

      memoryTracker.takeSnapshot()

      // 销毁一半的引擎
      for (let i = 0; i < 5; i++) {
        await engines[i].destroy()
      }

      if (typeof gc !== 'undefined') gc()
      await new Promise(resolve => setTimeout(resolve, 100))

      memoryTracker.takeSnapshot()

      // 销毁剩余的引擎
      for (let i = 5; i < 10; i++) {
        await engines[i].destroy()
      }

      if (typeof gc !== 'undefined') gc()
      await new Promise(resolve => setTimeout(resolve, 100))

      memoryTracker.takeSnapshot()

      const report = memoryTracker.getReport()
      console.log('引擎内存占用:', {
        initialMemory: `${(report.initialMemory / 1024 / 1024).toFixed(2)} MB`,
        after10Engines: `${(report.snapshots[1].heapUsed / 1024 / 1024).toFixed(2)} MB`,
        after5Destroyed: `${(report.snapshots[2].heapUsed / 1024 / 1024).toFixed(2)} MB`,
        afterAllDestroyed: `${(report.finalMemory / 1024 / 1024).toFixed(2)} MB`,
        totalGrowth: `${(report.memoryGrowth / 1024 / 1024).toFixed(2)} MB`
      })

      // 销毁所有引擎后，内存应该基本回到初始水平
      const finalGrowth = report.finalMemory - report.initialMemory
      const acceptableGrowth = 5 * 1024 * 1024 // 5MB容差

      expect(finalGrowth).toBeLessThan(acceptableGrowth)
    })
  })

  describe('缓存内存优化', () => {
    it('缓存压缩应该减少内存占用', async () => {
      const createLargeObject = (id: number) => ({
        id,
        data: new Array(1000).fill(id).map(i => ({
          value: i,
          text: `This is a long text string that will be repeated many times ${i}`,
          nested: {
            more: `More data ${i}`,
            array: new Array(10).fill(i)
          }
        }))
      })

      // 测试未压缩的缓存
      memoryTracker.start()
      const uncompressedCache = createOptimizedCacheManager()

      for (let i = 0; i < 100; i++) {
        await uncompressedCache.set(`key${i}`, createLargeObject(i), {
          compress: false
        })
      }

      memoryTracker.takeSnapshot()
      const uncompressedReport = memoryTracker.getReport()

      await uncompressedCache.destroy()
      if (typeof gc !== 'undefined') gc()
      await new Promise(resolve => setTimeout(resolve, 100))

      // 测试压缩的缓存
      memoryTracker.start()
      const compressedCache = createOptimizedCacheManager()

      for (let i = 0; i < 100; i++) {
        await compressedCache.set(`key${i}`, createLargeObject(i), {
          compress: true
        })
      }

      memoryTracker.takeSnapshot()
      const compressedReport = memoryTracker.getReport()

      const stats = await compressedCache.getStats()

      console.log('缓存压缩效果:', {
        uncompressed: `${(uncompressedReport.memoryGrowth / 1024 / 1024).toFixed(2)} MB`,
        compressed: `${(compressedReport.memoryGrowth / 1024 / 1024).toFixed(2)} MB`,
        compressionRate: `${stats.compressionRate.toFixed(2)}%`,
        memorySaved: `${((1 - compressedReport.memoryGrowth / uncompressedReport.memoryGrowth) * 100).toFixed(2)}%`
      })

      expect(compressedReport.memoryGrowth).toBeLessThan(uncompressedReport.memoryGrowth * 0.7)
      expect(stats.compressionRate).toBeGreaterThan(50)

      await compressedCache.destroy()
    })
  })
})



