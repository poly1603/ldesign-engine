/**
 * PerformanceMonitor 单元测试
 * 
 * 测试性能监控器的所有核心功能
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  PerformanceMonitor,
  createPerformanceMonitor,
  type PerformanceStats,
} from '../src/performance/performance-monitor'

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor

  beforeEach(() => {
    monitor = createPerformanceMonitor()
  })

  afterEach(() => {
    monitor.destroy()
  })

  describe('基本功能', () => {
    it('应该能够创建性能监控器', () => {
      expect(monitor).toBeDefined()
      expect(monitor).toBeInstanceOf(PerformanceMonitor)
    })

    it('应该能够通过工厂函数创建', () => {
      const customMonitor = createPerformanceMonitor({
        maxSamples: 500,
        sampleRate: 0.5,
      })
      expect(customMonitor).toBeInstanceOf(PerformanceMonitor)
      customMonitor.destroy()
    })

    it('应该支持自定义配置', () => {
      const customMonitor = createPerformanceMonitor({
        enabled: false,
        maxSamples: 100,
        sampleRate: 0.1,
        autoCleanup: false,
      })

      // 禁用状态下不应记录指标
      const id = customMonitor.start('test')
      expect(id).toBe('')

      customMonitor.destroy()
    })
  })

  describe('性能测量', () => {
    it('应该能够开始和结束测量', () => {
      const id = monitor.start('test-metric')
      expect(id).toBeTruthy()
      expect(id).toMatch(/^test-metric-\d+$/)

      const duration = monitor.end(id)
      expect(duration).toBeGreaterThanOrEqual(0)
    })

    it('应该能够测量多个独立的指标', () => {
      const id1 = monitor.start('metric-1')
      const id2 = monitor.start('metric-2')

      expect(id1).not.toBe(id2)

      const duration1 = monitor.end(id1)
      const duration2 = monitor.end(id2)

      expect(duration1).toBeGreaterThanOrEqual(0)
      expect(duration2).toBeGreaterThanOrEqual(0)
    })

    it('应该能够为指标添加元数据', () => {
      const metadata = { operation: 'load', size: 1024 }
      const id = monitor.start('with-metadata', metadata)
      monitor.end(id)

      const metrics = monitor.getMetrics('with-metadata')
      expect(metrics).toHaveLength(1)
      expect(metrics[0].metadata).toEqual(metadata)
    })

    it('结束不存在的测量应返回 null', () => {
      const duration = monitor.end('non-existent-id')
      expect(duration).toBeNull()
    })

    it('禁用状态下不应记录测量', () => {
      monitor.disable()

      const id = monitor.start('disabled-test')
      expect(id).toBe('')

      const duration = monitor.end(id)
      expect(duration).toBeNull()

      monitor.enable()
    })
  })

  describe('同步函数测量', () => {
    it('应该能够测量同步函数', () => {
      let executed = false
      const result = monitor.measure('sync-func', () => {
        executed = true
        return 42
      })

      expect(executed).toBe(true)
      expect(result).toBe(42)

      const stats = monitor.getStats('sync-func')
      expect(stats).toBeDefined()
      expect(stats!.count).toBe(1)
    })

    it('应该在函数抛出错误时仍然记录测量', () => {
      const error = new Error('Test error')

      expect(() => {
        monitor.measure('error-func', () => {
          throw error
        })
      }).toThrow(error)

      const stats = monitor.getStats('error-func')
      expect(stats).toBeDefined()
      expect(stats!.count).toBe(1)
    })

    it('应该能够测量多次同步函数调用', () => {
      for (let i = 0; i < 5; i++) {
        monitor.measure('repeated-func', () => i * 2)
      }

      const stats = monitor.getStats('repeated-func')
      expect(stats!.count).toBe(5)
    })
  })

  describe('异步函数测量', () => {
    it('应该能够测量异步函数', async () => {
      const result = await monitor.measureAsync('async-func', async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return 'done'
      })

      expect(result).toBe('done')

      const stats = monitor.getStats('async-func')
      expect(stats).toBeDefined()
      expect(stats!.count).toBe(1)
      expect(stats!.avgDuration).toBeGreaterThanOrEqual(10)
    })

    it('应该在异步函数失败时仍然记录测量', async () => {
      const error = new Error('Async error')

      await expect(async () => {
        await monitor.measureAsync('async-error', async () => {
          await new Promise(resolve => setTimeout(resolve, 5))
          throw error
        })
      }).rejects.toThrow(error)

      const stats = monitor.getStats('async-error')
      expect(stats).toBeDefined()
      expect(stats!.count).toBe(1)
    })

    it('应该能够测量多个并发的异步函数', async () => {
      const promises = Array.from({ length: 3 }, (_, i) =>
        monitor.measureAsync(`concurrent-${i}`, async () => {
          await new Promise(resolve => setTimeout(resolve, 10 + i * 5))
          return i
        })
      )

      const results = await Promise.all(promises)
      expect(results).toEqual([0, 1, 2])

      for (let i = 0; i < 3; i++) {
        const stats = monitor.getStats(`concurrent-${i}`)
        expect(stats!.count).toBe(1)
      }
    })
  })

  describe('统计分析', () => {
    beforeEach(() => {
      // 添加一些测试数据
      for (let i = 0; i < 10; i++) {
        monitor.measure('stats-test', () => {
          // 模拟不同的执行时间
          const start = performance.now()
          while (performance.now() - start < i) {
            // 忙等待
          }
        })
      }
    })

    it('应该能够获取统计信息', () => {
      const stats = monitor.getStats('stats-test')

      expect(stats).toBeDefined()
      expect(stats!.count).toBe(10)
      expect(stats!.totalDuration).toBeGreaterThan(0)
      expect(stats!.avgDuration).toBeGreaterThan(0)
      expect(stats!.minDuration).toBeGreaterThanOrEqual(0)
      expect(stats!.maxDuration).toBeGreaterThanOrEqual(stats!.minDuration)
    })

    it('应该计算正确的平均值', () => {
      const stats = monitor.getStats('stats-test')!

      const expectedAvg = stats.totalDuration / stats.count
      expect(stats.avgDuration).toBeCloseTo(expectedAvg, 2)
    })

    it('应该计算百分位数', () => {
      const stats = monitor.getStats('stats-test')!

      expect(stats.p50).toBeGreaterThanOrEqual(stats.minDuration)
      expect(stats.p50).toBeLessThanOrEqual(stats.maxDuration)

      expect(stats.p95).toBeGreaterThanOrEqual(stats.p50)
      expect(stats.p95).toBeLessThanOrEqual(stats.maxDuration)

      expect(stats.p99).toBeGreaterThanOrEqual(stats.p95)
      expect(stats.p99).toBeLessThanOrEqual(stats.maxDuration)
    })

    it('不存在的指标应返回 null', () => {
      const stats = monitor.getStats('non-existent')
      expect(stats).toBeNull()
    })

    it('应该能够获取所有指标的统计信息', () => {
      monitor.measure('metric-a', () => 1)
      monitor.measure('metric-b', () => 2)

      const allStats = monitor.getAllStats()

      expect(allStats.size).toBeGreaterThanOrEqual(3) // stats-test, metric-a, metric-b
      expect(allStats.has('stats-test')).toBe(true)
      expect(allStats.has('metric-a')).toBe(true)
      expect(allStats.has('metric-b')).toBe(true)
    })
  })

  describe('指标管理', () => {
    it('应该能够获取原始指标数据', () => {
      monitor.measure('raw-test', () => 1)
      monitor.measure('raw-test', () => 2)

      const metrics = monitor.getMetrics('raw-test')
      expect(metrics).toHaveLength(2)
      expect(metrics[0].name).toBe('raw-test')
      expect(metrics[0].duration).toBeGreaterThanOrEqual(0)
    })

    it('应该能够清除指定指标', () => {
      monitor.measure('clear-test', () => 1)

      let stats = monitor.getStats('clear-test')
      expect(stats).toBeDefined()

      monitor.clear('clear-test')

      stats = monitor.getStats('clear-test')
      expect(stats).toBeNull()
    })

    it('应该能够清除所有指标', () => {
      monitor.measure('test-1', () => 1)
      monitor.measure('test-2', () => 2)

      monitor.clearAll()

      expect(monitor.getStats('test-1')).toBeNull()
      expect(monitor.getStats('test-2')).toBeNull()
      expect(monitor.getAllStats().size).toBe(0)
    })

    it('应该限制最大样本数量', () => {
      const limitedMonitor = createPerformanceMonitor({ maxSamples: 5 })

      for (let i = 0; i < 10; i++) {
        limitedMonitor.measure('limited', () => i)
      }

      const metrics = limitedMonitor.getMetrics('limited')
      expect(metrics.length).toBe(5)

      limitedMonitor.destroy()
    })
  })

  describe('采样率', () => {
    it('应该根据采样率记录指标', () => {
      // 使用低采样率
      const sampledMonitor = createPerformanceMonitor({ sampleRate: 0.1 })

      let recordedCount = 0
      for (let i = 0; i < 100; i++) {
        const id = sampledMonitor.start('sampled')
        if (id) {
          sampledMonitor.end(id)
          recordedCount++
        }
      }

      // 应该只记录约 10% 的测量
      expect(recordedCount).toBeLessThan(50)
      expect(recordedCount).toBeGreaterThan(0)

      sampledMonitor.destroy()
    })

    it('采样率为 1 应该记录所有测量', () => {
      const fullMonitor = createPerformanceMonitor({ sampleRate: 1.0 })

      for (let i = 0; i < 10; i++) {
        fullMonitor.measure('full', () => i)
      }

      const stats = fullMonitor.getStats('full')
      expect(stats!.count).toBe(10)

      fullMonitor.destroy()
    })

    it('采样率为 0 应该不记录任何测量', () => {
      const noSampleMonitor = createPerformanceMonitor({ sampleRate: 0 })

      for (let i = 0; i < 10; i++) {
        const id = noSampleMonitor.start('none')
        expect(id).toBe('')
      }

      const stats = noSampleMonitor.getStats('none')
      expect(stats).toBeNull()

      noSampleMonitor.destroy()
    })
  })

  describe('启用/禁用', () => {
    it('应该能够启用和禁用监控', () => {
      monitor.disable()
      monitor.measure('disabled', () => 1)
      expect(monitor.getStats('disabled')).toBeNull()

      monitor.enable()
      monitor.measure('enabled', () => 1)
      expect(monitor.getStats('enabled')).toBeDefined()
    })

    it('禁用后再启用应该继续正常工作', () => {
      monitor.measure('before-disable', () => 1)

      monitor.disable()
      monitor.measure('while-disabled', () => 2)

      monitor.enable()
      monitor.measure('after-enable', () => 3)

      expect(monitor.getStats('before-disable')).toBeDefined()
      expect(monitor.getStats('while-disabled')).toBeNull()
      expect(monitor.getStats('after-enable')).toBeDefined()
    })
  })

  describe('自动清理', () => {
    it('应该能够禁用自动清理', () => {
      const noCleanupMonitor = createPerformanceMonitor({ autoCleanup: false })
      expect(noCleanupMonitor).toBeDefined()
      noCleanupMonitor.destroy()
    })

    it('应该在销毁时停止清理', () => {
      const cleanupMonitor = createPerformanceMonitor({
        autoCleanup: true,
        cleanupInterval: 100,
      })

      cleanupMonitor.destroy()

      // 销毁后不应崩溃
      expect(() => cleanupMonitor.measure('test', () => 1)).not.toThrow()
    })
  })

  describe('边界情况', () => {
    it('应该处理空指标名称', () => {
      const id = monitor.start('')
      expect(id).toBeTruthy()

      const duration = monitor.end(id)
      expect(duration).toBeGreaterThanOrEqual(0)
    })

    it('应该处理重复的 end 调用', () => {
      const id = monitor.start('repeat-end')

      const duration1 = monitor.end(id)
      expect(duration1).toBeGreaterThanOrEqual(0)

      const duration2 = monitor.end(id)
      expect(duration2).toBeNull()
    })

    it('应该处理非常快的操作', () => {
      const id = monitor.start('fast')
      const duration = monitor.end(id)

      expect(duration).toBeGreaterThanOrEqual(0)
      expect(duration).toBeLessThan(10) // 应该少于10ms
    })

    it('应该处理大量并发测量', async () => {
      const promises = Array.from({ length: 100 }, (_, i) =>
        monitor.measureAsync(`concurrent-${i}`, async () => {
          await new Promise(resolve => setTimeout(resolve, 1))
          return i
        })
      )

      const results = await Promise.all(promises)
      expect(results).toHaveLength(100)

      const allStats = monitor.getAllStats()
      expect(allStats.size).toBe(100)
    })

    it('应该处理销毁后的操作', () => {
      monitor.destroy()

      // 销毁后操作不应崩溃
      expect(() => monitor.start('after-destroy')).not.toThrow()
      expect(() => monitor.measure('after-destroy', () => 1)).not.toThrow()
      expect(() => monitor.getStats('test')).not.toThrow()
    })
  })

  describe('性能', () => {
    it('测量操作本身应该很快', () => {
      const iterations = 1000
      const startTime = performance.now()

      for (let i = 0; i < iterations; i++) {
        monitor.measure('perf-test', () => i)
      }

      const totalTime = performance.now() - startTime
      const avgTime = totalTime / iterations

      // 每次测量平均应该少于 1ms
      expect(avgTime).toBeLessThan(1)
    })

    it('应该能够处理大量指标', () => {
      const metricCount = 1000

      for (let i = 0; i < metricCount; i++) {
        monitor.measure(`metric-${i}`, () => i)
      }

      const allStats = monitor.getAllStats()
      expect(allStats.size).toBe(metricCount)
    })

    it('滚动窗口应该限制内存使用', () => {
      const limitedMonitor = createPerformanceMonitor({ maxSamples: 10 })

      for (let i = 0; i < 1000; i++) {
        limitedMonitor.measure('memory-test', () => i)
      }

      const metrics = limitedMonitor.getMetrics('memory-test')
      expect(metrics.length).toBe(10)

      limitedMonitor.destroy()
    })
  })
})