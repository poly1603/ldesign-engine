/**
 * 事件系统性能优化测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { createEventManager } from '../src/event'

describe('事件系统性能优化', () => {
  let eventManager: ReturnType<typeof createEventManager>

  beforeEach(() => {
    eventManager = createEventManager()
  })

  describe('批量事件触发', () => {
    it('应该支持批量触发多个事件', () => {
      const received: string[] = []

      eventManager.on('event1', () => { received.push('event1') })
      eventManager.on('event2', () => { received.push('event2') })
      eventManager.on('event3', () => { received.push('event3') })

      eventManager.emitBatch([
        { event: 'event1' },
        { event: 'event2' },
        { event: 'event3' },
      ])

      expect(received).toEqual(['event1', 'event2', 'event3'])
    })

    it('应该支持批量触发带数据的事件', () => {
      const received: any[] = []

      eventManager.on('user:login', (data) => { received.push(data) })
      eventManager.on('user:logout', (data) => { received.push(data) })

      eventManager.emitBatch([
        { event: 'user:login', payload: { id: 1, name: 'Alice' } },
        { event: 'user:logout', payload: { id: 1 } },
      ])

      expect(received).toHaveLength(2)
      expect(received[0]).toEqual({ id: 1, name: 'Alice' })
      expect(received[1]).toEqual({ id: 1 })
    })

    it('应该支持异步批量触发', async () => {
      const received: string[] = []

      eventManager.on('async1', async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        received.push('async1')
      })
      eventManager.on('async2', async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        received.push('async2')
      })

      await eventManager.emitBatchAsync([
        { event: 'async1' },
        { event: 'async2' },
      ])

      expect(received).toHaveLength(2)
    })

    it('批量触发应该比单独触发更快', () => {
      const events = Array.from({ length: 1000 }, (_, i) => ({
        event: `test-${i % 10}`,
        payload: { index: i },
      }))

      // 注册监听器
      for (let i = 0; i < 10; i++) {
        eventManager.on(`test-${i}`, () => {})
      }

      // 测试单独触发
      const start1 = performance.now()
      events.forEach(({ event, payload }) => {
        eventManager.emit(event, payload)
      })
      const time1 = performance.now() - start1

      // 测试批量触发
      const start2 = performance.now()
      eventManager.emitBatch(events)
      const time2 = performance.now() - start2

      // 批量触发应该更快或相当
      expect(time2).toBeLessThanOrEqual(time1 * 1.2) // 允许20%的误差
    })
  })

  describe('通配符匹配缓存', () => {
    it('应该缓存通配符正则表达式', () => {
      let callCount = 0

      // 注册通配符监听器
      eventManager.on('user:*', () => {
        callCount++
      })

      // 多次触发相同模式的事件
      for (let i = 0; i < 100; i++) {
        eventManager.emit('user:login', { id: i })
      }

      expect(callCount).toBe(100)

      // 验证缓存工作 - 通过触发多次相同事件，如果没有缓存会更慢
      const start = performance.now()
      for (let i = 0; i < 1000; i++) {
        eventManager.emit('user:action', {})
      }
      const time = performance.now() - start

      // 应该很快完成（小于100ms）
      expect(time).toBeLessThan(100)
    })

    it('应该正确匹配多个通配符模式', () => {
      const received: string[] = []

      eventManager.on('user:*', () => { received.push('user:*') })
      eventManager.on('*:login', () => { received.push('*:login') })
      eventManager.on('*', () => { received.push('*') })

      eventManager.emit('user:login')

      expect(received).toContain('user:*')
      expect(received).toContain('*:login')
      expect(received).toContain('*')
    })
  })

  describe('内存优化', () => {
    it('应该正确清理空的事件集合', () => {
      const handler = () => {}

      // 添加和移除多个事件
      for (let i = 0; i < 100; i++) {
        const event = `temp-event-${i}`
        eventManager.on(event, handler)
        eventManager.off(event, handler)
      }

      // 获取事件统计
      const stats = eventManager.getStats()

      // 应该没有残留的空事件
      expect(stats.totalEvents).toBe(0)
    })

    it('应该支持大量事件注册和清理', () => {
      const handlers = Array.from({ length: 1000 }, () => () => {})

      // 注册大量监听器
      handlers.forEach((handler, i) => {
        eventManager.on(`event-${i % 10}`, handler)
      })

      const stats1 = eventManager.getStats()
      expect(stats1.totalListeners).toBe(1000)

      // 清理所有
      eventManager.clear()

      const stats2 = eventManager.getStats()
      expect(stats2.totalListeners).toBe(0)
      expect(stats2.totalEvents).toBe(0)
    })
  })

  describe('性能基准测试', () => {
    it('大量事件触发性能测试', () => {
      let count = 0
      eventManager.on('test', () => { count++ })

      const start = performance.now()
      for (let i = 0; i < 10000; i++) {
        eventManager.emit('test')
      }
      const time = performance.now() - start

      expect(count).toBe(10000)
      expect(time).toBeLessThan(100) // 应该在100ms内完成
    })

    it('大量监听器性能测试', () => {
      // 注册1000个监听器
      let count = 0
      for (let i = 0; i < 1000; i++) {
        eventManager.on('test', () => { count++ })
      }

      const start = performance.now()
      eventManager.emit('test')
      const time = performance.now() - start

      expect(count).toBe(1000)
      expect(time).toBeLessThan(50) // 应该在50ms内完成
    })

    it('通配符性能测试', () => {
      let count = 0

      // 注册多个通配符监听器
      eventManager.on('user:*', () => { count++ })
      eventManager.on('user:profile:*', () => { count++ })
      eventManager.on('*', () => { count++ })

      const start = performance.now()
      for (let i = 0; i < 1000; i++) {
        eventManager.emit('user:profile:update', { id: i })
      }
      const time = performance.now() - start

      expect(count).toBe(3000) // 每次触发3个监听器
      expect(time).toBeLessThan(100) // 应该在100ms内完成
    })
  })

  describe('错误处理', () => {
    it('批量触发时单个事件错误不应影响其他事件', () => {
      const received: string[] = []

      eventManager.on('event1', () => { received.push('event1') })
      eventManager.on('event2', () => {
        throw new Error('Test error')
      })
      eventManager.on('event3', () => { received.push('event3') })

      // 不应该抛出错误
      expect(() => {
        eventManager.emitBatch([
          { event: 'event1' },
          { event: 'event2' },
          { event: 'event3' },
        ])
      }).not.toThrow()

      // event1 和 event3 应该正常触发
      expect(received).toContain('event1')
      expect(received).toContain('event3')
    })
  })
})