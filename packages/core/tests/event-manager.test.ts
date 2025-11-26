/**
 * EventManager 单元测试
 *
 * 测试覆盖:
 * - 基本事件监听和触发
 * - 一次性监听器
 * - 通配符模式匹配
 * - 异步事件
 * - 事件移除
 * - 内存泄漏防护
 * - 错误隔离
 * - 统计信息
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { createEventManager } from '../src/event/event-manager'
import type { EventManager } from '../src/types'

describe('EventManager', () => {
  let eventManager: EventManager

  beforeEach(() => {
    eventManager = createEventManager()
  })

  afterEach(() => {
    eventManager.clear()
  })

  describe('基本功能', () => {
    it('应该成功监听和触发事件', () => {
      const handler = vi.fn()

      eventManager.on('test', handler)
      eventManager.emit('test', { data: 'hello' })

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith({ data: 'hello' })
    })

    it('应该支持多个监听器', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const handler3 = vi.fn()

      eventManager.on('test', handler1)
      eventManager.on('test', handler2)
      eventManager.on('test', handler3)

      eventManager.emit('test', 'data')

      expect(handler1).toHaveBeenCalledWith('data')
      expect(handler2).toHaveBeenCalledWith('data')
      expect(handler3).toHaveBeenCalledWith('data')
    })

    it('应该正确返回监听器数量', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      expect(eventManager.listenerCount('test')).toBe(0)

      eventManager.on('test', handler1)
      expect(eventManager.listenerCount('test')).toBe(1)

      eventManager.on('test', handler2)
      expect(eventManager.listenerCount('test')).toBe(2)
    })

    it('应该返回所有事件名称', () => {
      eventManager.on('event1', vi.fn())
      eventManager.on('event2', vi.fn())
      eventManager.on('event3', vi.fn())

      const names = eventManager.eventNames()

      expect(names).toHaveLength(3)
      expect(names).toContain('event1')
      expect(names).toContain('event2')
      expect(names).toContain('event3')
    })

    it('应该支持链式调用', () => {
      const handler = vi.fn()

      const unsubscribe = eventManager.on('test', handler)
      eventManager.emit('test')

      expect(handler).toHaveBeenCalledTimes(1)

      unsubscribe()
      eventManager.emit('test')

      expect(handler).toHaveBeenCalledTimes(1) // 仍然是1次
    })
  })

  describe('一次性监听器', () => {
    it('应该只触发一次', () => {
      const handler = vi.fn()

      eventManager.once('test', handler)

      eventManager.emit('test', 'first')
      eventManager.emit('test', 'second')
      eventManager.emit('test', 'third')

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith('first')
    })

    it('应该在触发后自动移除', () => {
      const handler = vi.fn()

      eventManager.once('test', handler)
      expect(eventManager.listenerCount('test')).toBe(1)

      eventManager.emit('test')
      expect(eventManager.listenerCount('test')).toBe(0)
    })

    it('应该支持手动取消', () => {
      const handler = vi.fn()

      const unsubscribe = eventManager.once('test', handler)
      expect(eventManager.listenerCount('test')).toBe(1)

      unsubscribe()
      expect(eventManager.listenerCount('test')).toBe(0)

      eventManager.emit('test')
      expect(handler).not.toHaveBeenCalled()
    })

    it('应该正确清理 once 包装器', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      eventManager.once('test', handler1)
      eventManager.once('test', handler2)

      eventManager.emit('test')

      // 两个监听器都应该被移除
      expect(eventManager.listenerCount('test')).toBe(0)
    })
  })

  describe('通配符模式', () => {
    it('应该支持单层通配符 (*)', () => {
      const handler = vi.fn()

      eventManager.on('user:*', handler)

      eventManager.emit('user:login', { id: 1 })
      eventManager.emit('user:logout', { id: 1 })
      eventManager.emit('user:update', { id: 1 })

      expect(handler).toHaveBeenCalledTimes(3)
    })

    it('应该支持全局通配符 (*)', () => {
      const handler = vi.fn()

      eventManager.on('*', handler)

      eventManager.emit('event1')
      eventManager.emit('event2')
      eventManager.emit('event3')

      expect(handler).toHaveBeenCalledTimes(3)
    })

    it('应该支持多层通配符 (**)', () => {
      const handler = vi.fn()

      eventManager.on('app:**', handler)

      eventManager.emit('app:user:login')
      eventManager.emit('app:admin:logout')
      eventManager.emit('app:data:save:success')

      expect(handler).toHaveBeenCalledTimes(3)
    })

    it('单层通配符不应该匹配多层路径', () => {
      const handler = vi.fn()

      eventManager.on('user:*', handler)

      eventManager.emit('user:profile:update') // 不应该匹配
      eventManager.emit('user:login') // 应该匹配

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('应该同时触发精确匹配和模式匹配', () => {
      const exactHandler = vi.fn()
      const patternHandler = vi.fn()

      eventManager.on('user:login', exactHandler)
      eventManager.on('user:*', patternHandler)

      eventManager.emit('user:login')

      expect(exactHandler).toHaveBeenCalledTimes(1)
      expect(patternHandler).toHaveBeenCalledTimes(1)
    })

    it('应该支持取消通配符监听', () => {
      const handler = vi.fn()

      const unsubscribe = eventManager.on('user:*', handler)

      eventManager.emit('user:login')
      expect(handler).toHaveBeenCalledTimes(1)

      unsubscribe()

      eventManager.emit('user:logout')
      expect(handler).toHaveBeenCalledTimes(1) // 仍然是1次
    })
  })

  describe('事件移除', () => {
    it('应该移除特定的监听器', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      eventManager.on('test', handler1)
      eventManager.on('test', handler2)

      eventManager.off('test', handler1)

      eventManager.emit('test')

      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).toHaveBeenCalledTimes(1)
    })

    it('应该移除事件的所有监听器', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      eventManager.on('test', handler1)
      eventManager.on('test', handler2)

      eventManager.off('test')

      eventManager.emit('test')

      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).not.toHaveBeenCalled()
      expect(eventManager.listenerCount('test')).toBe(0)
    })

    it('应该清空所有事件', () => {
      eventManager.on('event1', vi.fn())
      eventManager.on('event2', vi.fn())
      eventManager.on('event3', vi.fn())

      expect(eventManager.eventNames()).toHaveLength(3)

      eventManager.clear()

      expect(eventManager.eventNames()).toHaveLength(0)
    })

    it('应该正确清理空的事件集合', () => {
      const handler = vi.fn()

      eventManager.on('test', handler)
      eventManager.off('test', handler)

      // 事件应该被完全移除
      expect(eventManager.eventNames()).not.toContain('test')
    })
  })

  describe('异步事件', () => {
    it('应该等待所有异步处理器完成', async () => {
      const results: number[] = []

      eventManager.on('test', async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        results.push(1)
      })

      eventManager.on('test', async () => {
        await new Promise(resolve => setTimeout(resolve, 5))
        results.push(2)
      })

      await eventManager.emitAsync('test')

      expect(results).toHaveLength(2)
      expect(results).toContain(1)
      expect(results).toContain(2)
    })

    it('应该处理异步处理器中的错误', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })
      const successHandler = vi.fn()

      eventManager.on('test', async () => {
        throw new Error('Async error')
      })

      eventManager.on('test', successHandler)

      await eventManager.emitAsync('test')

      expect(consoleSpy).toHaveBeenCalled()
      expect(successHandler).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('应该并行执行异步处理器', async () => {
      const startTime = Date.now()

      eventManager.on('test', async () => {
        await new Promise(resolve => setTimeout(resolve, 50))
      })

      eventManager.on('test', async () => {
        await new Promise(resolve => setTimeout(resolve, 50))
      })

      await eventManager.emitAsync('test')

      const duration = Date.now() - startTime

      // 如果是并行执行，总时间应该接近50ms而不是100ms
      expect(duration).toBeLessThan(80)
    })
  })

  describe('错误隔离', () => {
    it('应该隔离单个处理器的错误', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })
      const handler1 = vi.fn(() => {
        throw new Error('Handler 1 error')
      })
      const handler2 = vi.fn()
      const handler3 = vi.fn()

      eventManager.on('test', handler1)
      eventManager.on('test', handler2)
      eventManager.on('test', handler3)

      expect(() => {
        eventManager.emit('test')
      }).not.toThrow()

      expect(handler1).toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
      expect(handler3).toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('应该隔离模式匹配处理器的错误', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })
      const errorHandler = vi.fn(() => {
        throw new Error('Pattern handler error')
      })
      const successHandler = vi.fn()

      eventManager.on('user:*', errorHandler)
      eventManager.on('user:login', successHandler)

      expect(() => {
        eventManager.emit('user:login')
      }).not.toThrow()

      expect(errorHandler).toHaveBeenCalled()
      expect(successHandler).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('内存泄漏防护', () => {
    it('应该在监听器过多时发出警告', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { })

      eventManager.setMaxListeners(5)

      // 添加6个监听器
      for (let i = 0; i < 6; i++) {
        eventManager.on('test', vi.fn())
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Possible memory leak detected')
      )

      consoleSpy.mockRestore()
    })

    it('应该支持设置最大监听器数量', () => {
      expect(eventManager.getMaxListeners()).toBe(100)

      eventManager.setMaxListeners(50)
      expect(eventManager.getMaxListeners()).toBe(50)
    })

    it('应该清理 once 包装器防止内存泄漏', () => {
      const handler = vi.fn()

      eventManager.once('test', handler)
      eventManager.emit('test')

      // once 包装器应该被清理
      eventManager.off('test', handler) // 这不应该抛出错误
    })
  })

  describe('统计信息', () => {
    it('应该返回正确的统计信息', () => {
      eventManager.on('event1', vi.fn())
      eventManager.on('event1', vi.fn())
      eventManager.on('event2', vi.fn())
      eventManager.on('user:*', vi.fn())

      const stats = eventManager.getStats()

      expect(stats.totalEvents).toBe(2)
      expect(stats.totalListeners).toBe(3)
      expect(stats.totalPatternListeners).toBe(1)
      expect(stats.events).toHaveLength(2)
    })

    it('应该按监听器数量排序事件', () => {
      eventManager.on('event1', vi.fn())
      eventManager.on('event2', vi.fn())
      eventManager.on('event2', vi.fn())
      eventManager.on('event3', vi.fn())
      eventManager.on('event3', vi.fn())
      eventManager.on('event3', vi.fn())

      const stats = eventManager.getStats()

      expect(stats.events[0].name).toBe('event3')
      expect(stats.events[0].listenerCount).toBe(3)
      expect(stats.events[1].name).toBe('event2')
      expect(stats.events[1].listenerCount).toBe(2)
      expect(stats.events[2].name).toBe('event1')
      expect(stats.events[2].listenerCount).toBe(1)
    })

    it('应该在清空后返回空统计', () => {
      eventManager.on('event1', vi.fn())
      eventManager.on('event2', vi.fn())

      eventManager.clear()

      const stats = eventManager.getStats()

      expect(stats.totalEvents).toBe(0)
      expect(stats.totalListeners).toBe(0)
      expect(stats.events).toHaveLength(0)
    })
  })

  describe('边界情况', () => {
    it('应该处理没有监听器的事件', () => {
      expect(() => {
        eventManager.emit('nonexistent')
      }).not.toThrow()
    })

    it('应该处理空的事件名', () => {
      const handler = vi.fn()

      eventManager.on('', handler)
      eventManager.emit('')

      expect(handler).toHaveBeenCalled()
    })

    it('应该处理 undefined payload', () => {
      const handler = vi.fn()

      eventManager.on('test', handler)
      eventManager.emit('test')

      expect(handler).toHaveBeenCalledWith(undefined)
    })

    it('应该处理重复添加同一个处理器', () => {
      const handler = vi.fn()

      eventManager.on('test', handler)
      eventManager.on('test', handler)

      // Set 会自动去重，所以只有一个
      expect(eventManager.listenerCount('test')).toBe(1)

      eventManager.emit('test')
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('应该在遍历时允许移除监听器', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn(() => {
        eventManager.off('test', handler1)
      })

      eventManager.on('test', handler1)
      eventManager.on('test', handler2)

      expect(() => {
        eventManager.emit('test')
      }).not.toThrow()
    })
  })

  describe('性能测试', () => {
    it('应该快速处理大量事件', () => {
      const handler = vi.fn()
      const iterations = 10000

      eventManager.on('test', handler)

      const startTime = Date.now()

      for (let i = 0; i < iterations; i++) {
        eventManager.emit('test', i)
      }

      const duration = Date.now() - startTime

      expect(handler).toHaveBeenCalledTimes(iterations)
      // 10000次事件应该在100ms内完成
      expect(duration).toBeLessThan(100)
    })

    it('应该快速添加和移除监听器', () => {
      const iterations = 1000

      const startTime = Date.now()

      const unsubscribes: Array<() => void> = []

      for (let i = 0; i < iterations; i++) {
        const unsubscribe = eventManager.on(`event${i}`, vi.fn())
        unsubscribes.push(unsubscribe)
      }

      for (const unsubscribe of unsubscribes) {
        unsubscribe()
      }

      const duration = Date.now() - startTime

      // 1000次添加和移除应该在50ms内完成
      expect(duration).toBeLessThan(50)
    })
  })
})