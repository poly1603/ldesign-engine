/**
 * 事件管理器单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createEventManager } from '../../src/events/event-manager'

describe('EventManager', () => {
  let eventManager: ReturnType<typeof createEventManager>

  beforeEach(() => {
    eventManager = createEventManager()
  })

  describe('基础功能', () => {
    it('应该能监听和触发事件', () => {
      const handler = vi.fn()
      eventManager.on('test-event', handler)
      eventManager.emit('test-event', { data: 'test' })

      expect(handler).toHaveBeenCalledWith({ data: 'test' })
    })

    it('应该支持一次性监听', () => {
      const handler = vi.fn()
      eventManager.once('test-event', handler)

      eventManager.emit('test-event', 'data1')
      eventManager.emit('test-event', 'data2')

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith('data1')
    })

    it('应该能移除监听器', () => {
      const handler = vi.fn()
      eventManager.on('test-event', handler)
      eventManager.off('test-event', handler)
      eventManager.emit('test-event', 'data')

      expect(handler).not.toHaveBeenCalled()
    })

    it('应该能移除所有监听器', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      eventManager.on('test-event', handler1)
      eventManager.on('test-event', handler2)
      eventManager.off('test-event')
      eventManager.emit('test-event', 'data')

      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).not.toHaveBeenCalled()
    })
  })

  describe('优先级', () => {
    it('应该按优先级顺序执行', () => {
      const order: number[] = []

      eventManager.on('test', () => order.push(1), 0)   // 默认
      eventManager.on('test', () => order.push(2), 100) // 高
      eventManager.on('test', () => order.push(3), -100) // 低

      eventManager.emit('test', null)

      expect(order).toEqual([2, 1, 3]) // 高 → 默认 → 低
    })
  })

  describe('命名空间', () => {
    it('应该支持事件命名空间', () => {
      const handler = vi.fn()
      const userEvents = eventManager.namespace('user')

      userEvents.on('login', handler)
      userEvents.emit('login', { id: 1 })

      expect(handler).toHaveBeenCalledWith({ id: 1 })
    })

    it('应该能清空命名空间', () => {
      const handler = vi.fn()
      const userEvents = eventManager.namespace('user')

      userEvents.on('login', handler)
      userEvents.on('logout', handler)
      userEvents.clear()

      userEvents.emit('login', {})
      userEvents.emit('logout', {})

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('批量操作', () => {
    it('应该支持批量添加监听器', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      eventManager.addListeners([
        { event: 'event1', handler: handler1 },
        { event: 'event2', handler: handler2 }
      ])

      eventManager.emit('event1', null)
      eventManager.emit('event2', null)

      expect(handler1).toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
    })
  })

  describe('事件管道', () => {
    it('应该支持事件转换', () => {
      const handler = vi.fn()

      eventManager.pipe('source', 'target', (data: any) => {
        return { transformed: data }
      })

      eventManager.on('target', handler)
      eventManager.emit('source', 'original')

      expect(handler).toHaveBeenCalledWith({ transformed: 'original' })
    })
  })

  describe('条件监听', () => {
    it('应该支持条件触发', () => {
      const handler = vi.fn()

      eventManager.onWhen(
        'test',
        (data: any) => data.valid === true,
        handler
      )

      eventManager.emit('test', { valid: false })
      expect(handler).not.toHaveBeenCalled()

      eventManager.emit('test', { valid: true })
      expect(handler).toHaveBeenCalled()
    })
  })

  describe('性能', () => {
    it('单监听器触发应该很快', () => {
      const handler = vi.fn()
      eventManager.on('fast-event', handler)

      const start = performance.now()
      for (let i = 0; i < 10000; i++) {
        eventManager.emit('fast-event', null)
      }
      const duration = performance.now() - start

      // 10000次触发应该在50ms内
      expect(duration).toBeLessThan(50)
      expect(handler).toHaveBeenCalledTimes(10000)
    })

    it('优先级桶应该优于排序', () => {
      // 添加多个不同优先级的监听器
      for (let i = 0; i < 10; i++) {
        eventManager.on('priority-test', vi.fn(), i * 10)
      }

      const start = performance.now()
      for (let i = 0; i < 1000; i++) {
        eventManager.emit('priority-test', null)
      }
      const duration = performance.now() - start

      // 1000次触发应该在20ms内（优先级桶优化）
      expect(duration).toBeLessThan(20)
    })
  })

  describe('统计信息', () => {
    it('应该能获取统计信息', () => {
      eventManager.on('event1', vi.fn())
      eventManager.on('event1', vi.fn())
      eventManager.on('event2', vi.fn())

      const stats = eventManager.getStats()

      expect(stats.totalEvents).toBe(2)
      expect(stats.totalListeners).toBe(3)
      expect(stats.events).toHaveProperty('event1', 2)
      expect(stats.events).toHaveProperty('event2', 1)
    })
  })
})

