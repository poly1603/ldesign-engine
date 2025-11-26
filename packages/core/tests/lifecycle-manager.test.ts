/**
 * LifecycleManager 单元测试
 *
 * 测试生命周期钩子管理系统
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createLifecycleManager } from '../src/lifecycle/lifecycle-manager'
import type { LifecycleManager, LifecycleHook, LifecycleHandler } from '../src/types'

describe('LifecycleManager', () => {
  let lifecycleManager: LifecycleManager

  beforeEach(() => {
    lifecycleManager = createLifecycleManager()
  })

  afterEach(() => {
    lifecycleManager.clear()
    vi.clearAllMocks()
  })

  // ===========================
  // 1. 基本功能测试 (7个)
  // ===========================
  describe('基本功能', () => {
    it('应该注册钩子处理器', () => {
      const handler = vi.fn()

      lifecycleManager.on('mounted', handler)

      const handlers = lifecycleManager.getHandlers('mounted')
      expect(handlers).toHaveLength(1)
      expect(handlers[0]).toBe(handler)
    })

    it('应该注册多个处理器到同一个钩子', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const handler3 = vi.fn()

      lifecycleManager.on('mounted', handler1)
      lifecycleManager.on('mounted', handler2)
      lifecycleManager.on('mounted', handler3)

      const handlers = lifecycleManager.getHandlers('mounted')
      expect(handlers).toHaveLength(3)
      expect(handlers).toContain(handler1)
      expect(handlers).toContain(handler2)
      expect(handlers).toContain(handler3)
    })

    it('应该获取处理器列表', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      lifecycleManager.on('init', handler1)
      lifecycleManager.on('init', handler2)

      const handlers = lifecycleManager.getHandlers('init')
      expect(handlers).toEqual([handler1, handler2])
    })

    it('获取不存在的钩子应该返回空数组', () => {
      const handlers = lifecycleManager.getHandlers('mounted')
      expect(handlers).toEqual([])
    })

    it('应该获取处理器数量', () => {
      lifecycleManager.on('mounted', vi.fn())
      lifecycleManager.on('mounted', vi.fn())
      lifecycleManager.on('mounted', vi.fn())

      expect(lifecycleManager.getHandlerCount('mounted')).toBe(3)
    })

    it('不存在的钩子处理器数量应该为 0', () => {
      expect(lifecycleManager.getHandlerCount('nonexistent' as LifecycleHook)).toBe(0)
    })

    it('应该移除特定处理器', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      lifecycleManager.on('mounted', handler1)
      lifecycleManager.on('mounted', handler2)

      expect(lifecycleManager.getHandlerCount('mounted')).toBe(2)

      lifecycleManager.off('mounted', handler1)

      expect(lifecycleManager.getHandlerCount('mounted')).toBe(1)
      expect(lifecycleManager.getHandlers('mounted')).toEqual([handler2])
    })

    it('应该移除钩子的所有处理器', () => {
      lifecycleManager.on('mounted', vi.fn())
      lifecycleManager.on('mounted', vi.fn())
      lifecycleManager.on('mounted', vi.fn())

      expect(lifecycleManager.getHandlerCount('mounted')).toBe(3)

      lifecycleManager.off('mounted')

      expect(lifecycleManager.getHandlerCount('mounted')).toBe(0)
      expect(lifecycleManager.getHandlers('mounted')).toEqual([])
    })

    it('应该清空所有钩子', () => {
      lifecycleManager.on('init', vi.fn())
      lifecycleManager.on('mounted', vi.fn())
      lifecycleManager.on('updated', vi.fn())

      expect(lifecycleManager.getHookNames()).toHaveLength(3)

      lifecycleManager.clear()

      expect(lifecycleManager.getHookNames()).toHaveLength(0)
      expect(lifecycleManager.getHandlerCount('init')).toBe(0)
      expect(lifecycleManager.getHandlerCount('mounted')).toBe(0)
    })

    it('应该获取所有注册的钩子名称', () => {
      lifecycleManager.on('init', vi.fn())
      lifecycleManager.on('mounted', vi.fn())
      lifecycleManager.on('updated', vi.fn())

      const hookNames = lifecycleManager.getHookNames()
      expect(hookNames).toHaveLength(3)
      expect(hookNames).toContain('init')
      expect(hookNames).toContain('mounted')
      expect(hookNames).toContain('updated')
    })
  })

  // ===========================
  // 2. 钩子触发测试 (5个)
  // ===========================
  describe('钩子触发', () => {
    it('应该触发钩子执行处理器', async () => {
      const handler = vi.fn()

      lifecycleManager.on('mounted', handler)
      await lifecycleManager.trigger('mounted')

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('应该触发多个处理器', async () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const handler3 = vi.fn()

      lifecycleManager.on('mounted', handler1)
      lifecycleManager.on('mounted', handler2)
      lifecycleManager.on('mounted', handler3)

      await lifecycleManager.trigger('mounted')

      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)
      expect(handler3).toHaveBeenCalledTimes(1)
    })

    it('应该传递参数给处理器', async () => {
      const handler = vi.fn()

      lifecycleManager.on('beforeUpdate', handler)
      await lifecycleManager.trigger('beforeUpdate', 'arg1', 'arg2', 123)

      expect(handler).toHaveBeenCalledWith('arg1', 'arg2', 123)
    })

    it('应该支持异步处理器', async () => {
      const order: string[] = []

      lifecycleManager.on('mounted', async () => {
        order.push('start')
        await new Promise(resolve => setTimeout(resolve, 10))
        order.push('end')
      })

      await lifecycleManager.trigger('mounted')

      expect(order).toEqual(['start', 'end'])
    })

    it('应该记录触发次数', async () => {
      lifecycleManager.on('mounted', vi.fn())

      expect(lifecycleManager.getTriggerCount('mounted')).toBe(0)

      await lifecycleManager.trigger('mounted')
      expect(lifecycleManager.getTriggerCount('mounted')).toBe(1)

      await lifecycleManager.trigger('mounted')
      expect(lifecycleManager.getTriggerCount('mounted')).toBe(2)

      await lifecycleManager.trigger('mounted')
      expect(lifecycleManager.getTriggerCount('mounted')).toBe(3)
    })

    it('触发不存在的钩子应该正常返回', async () => {
      await expect(
        lifecycleManager.trigger('mounted')
      ).resolves.toBeUndefined()
    })

    it('未触发过的钩子触发次数应该为 0', () => {
      expect(lifecycleManager.getTriggerCount('mounted')).toBe(0)
    })
  })

  // ===========================
  // 3. 一次性钩子测试 (5个)
  // ===========================
  describe('一次性钩子', () => {
    it('once 钩子应该只执行一次', async () => {
      const handler = vi.fn()

      lifecycleManager.once('init', handler)

      await lifecycleManager.trigger('init')
      await lifecycleManager.trigger('init')
      await lifecycleManager.trigger('init')

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('once 钩子执行后应该自动移除', async () => {
      const handler = vi.fn()

      lifecycleManager.once('init', handler)
      expect(lifecycleManager.getHandlerCount('init')).toBe(1)

      await lifecycleManager.trigger('init')
      expect(lifecycleManager.getHandlerCount('init')).toBe(0)
    })

    it('应该手动移除 once 钩子', () => {
      const handler = vi.fn()

      lifecycleManager.once('init', handler)
      expect(lifecycleManager.getHandlerCount('init')).toBe(1)

      lifecycleManager.off('init', handler)
      expect(lifecycleManager.getHandlerCount('init')).toBe(0)
    })

    it('多个 once 钩子应该独立工作', async () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const handler3 = vi.fn()

      lifecycleManager.once('init', handler1)
      lifecycleManager.once('init', handler2)
      lifecycleManager.once('init', handler3)

      expect(lifecycleManager.getHandlerCount('init')).toBe(3)

      await lifecycleManager.trigger('init')

      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)
      expect(handler3).toHaveBeenCalledTimes(1)
      expect(lifecycleManager.getHandlerCount('init')).toBe(0)
    })

    it('once 和普通钩子应该可以混合使用', async () => {
      const onceHandler = vi.fn()
      const normalHandler = vi.fn()

      lifecycleManager.once('mounted', onceHandler)
      lifecycleManager.on('mounted', normalHandler)

      expect(lifecycleManager.getHandlerCount('mounted')).toBe(2)

      await lifecycleManager.trigger('mounted')
      expect(onceHandler).toHaveBeenCalledTimes(1)
      expect(normalHandler).toHaveBeenCalledTimes(1)
      expect(lifecycleManager.getHandlerCount('mounted')).toBe(1)

      await lifecycleManager.trigger('mounted')
      expect(onceHandler).toHaveBeenCalledTimes(1) // 仍然是 1
      expect(normalHandler).toHaveBeenCalledTimes(2) // 增加到 2
    })
  })

  // ===========================
  // 4. 错误处理测试 (4个)
  // ===========================
  describe('错误处理', () => {
    it('处理器错误应该被隔离', async () => {
      const handler1 = vi.fn(() => {
        throw new Error('Handler 1 error')
      })
      const handler2 = vi.fn()
      const handler3 = vi.fn()

      lifecycleManager.on('mounted', handler1)
      lifecycleManager.on('mounted', handler2)
      lifecycleManager.on('mounted', handler3)

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

      await lifecycleManager.trigger('mounted')

      // handler1 抛出错误，但 handler2 和 handler3 仍然执行
      expect(handler1).toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
      expect(handler3).toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('异步处理器错误应该被捕获', async () => {
      const handler = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        throw new Error('Async error')
      })

      lifecycleManager.on('mounted', handler)

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

      await lifecycleManager.trigger('mounted')

      expect(handler).toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('多个错误应该都被记录', async () => {
      const handler1 = vi.fn(() => {
        throw new Error('Error 1')
      })
      const handler2 = vi.fn(() => {
        throw new Error('Error 2')
      })
      const handler3 = vi.fn(() => {
        throw new Error('Error 3')
      })

      lifecycleManager.on('mounted', handler1)
      lifecycleManager.on('mounted', handler2)
      lifecycleManager.on('mounted', handler3)

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

      await lifecycleManager.trigger('mounted')

      // 应该记录所有错误
      expect(consoleErrorSpy.mock.calls.length).toBeGreaterThanOrEqual(3)

      consoleErrorSpy.mockRestore()
    })

    it('once 钩子出错后应该仍然被移除', async () => {
      const handler = vi.fn(() => {
        throw new Error('Once handler error')
      })

      lifecycleManager.once('init', handler)
      expect(lifecycleManager.getHandlerCount('init')).toBe(1)

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

      await lifecycleManager.trigger('init')

      // 即使出错，once 钩子也应该被移除
      expect(lifecycleManager.getHandlerCount('init')).toBe(0)

      consoleErrorSpy.mockRestore()
    })
  })

  // ===========================
  // 5. 并发和性能测试 (3个)
  // ===========================
  describe('并发和性能', () => {
    it('应该并行执行所有处理器', async () => {
      const delays = [50, 30, 40]
      const order: number[] = []

      delays.forEach((delay, index) => {
        lifecycleManager.on('mounted', async () => {
          await new Promise(resolve => setTimeout(resolve, delay))
          order.push(index)
        })
      })

      const start = performance.now()
      await lifecycleManager.trigger('mounted')
      const duration = performance.now() - start

      // 并行执行应该接近最长延迟（50ms），而不是总和（120ms）
      expect(duration).toBeLessThan(80) // 50ms + 30ms 容差
      expect(order).toHaveLength(3)
    })

    it('应该快速处理大量处理器', async () => {
      const handlerCount = 100

      for (let i = 0; i < handlerCount; i++) {
        lifecycleManager.on('mounted', vi.fn())
      }

      const start = performance.now()
      await lifecycleManager.trigger('mounted')
      const duration = performance.now() - start

      // 100个简单处理器应该在 50ms 内完成
      expect(duration).toBeLessThan(50)
    })

    it('触发过程中修改钩子集合不应该影响当前执行', async () => {
      const executedHandlers: number[] = []

      const handler1 = vi.fn(async () => {
        executedHandlers.push(1)
        // 在执行过程中添加新处理器
        lifecycleManager.on('mounted', handler3)
      })

      const handler2 = vi.fn(async () => {
        executedHandlers.push(2)
      })

      const handler3 = vi.fn(async () => {
        executedHandlers.push(3)
      })

      lifecycleManager.on('mounted', handler1)
      lifecycleManager.on('mounted', handler2)

      await lifecycleManager.trigger('mounted')

      // handler3 不应该在第一次触发中执行
      expect(executedHandlers).toEqual([1, 2])
      expect(handler3).not.toHaveBeenCalled()

      // 第二次触发应该包含 handler3
      await lifecycleManager.trigger('mounted')
      expect(handler3).toHaveBeenCalled()
    })
  })

  // ===========================
  // 6. 边界情况测试 (3个)
  // ===========================
  describe('边界情况', () => {
    it('移除不存在的处理器不应该报错', () => {
      const handler = vi.fn()

      expect(() => {
        lifecycleManager.off('mounted', handler)
      }).not.toThrow()
    })

    it('移除不存在的钩子不应该报错', () => {
      expect(() => {
        lifecycleManager.off('nonexistent' as LifecycleHook)
      }).not.toThrow()
    })

    it('clear 后触发计数应该被重置', async () => {
      lifecycleManager.on('mounted', vi.fn())

      await lifecycleManager.trigger('mounted')
      await lifecycleManager.trigger('mounted')

      expect(lifecycleManager.getTriggerCount('mounted')).toBe(2)

      lifecycleManager.clear()

      expect(lifecycleManager.getTriggerCount('mounted')).toBe(0)
    })
  })
})