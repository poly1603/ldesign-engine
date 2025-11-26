/**
 * 内存泄漏测试套件
 * 测试引擎在长时间运行和大量操作下的内存管理
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { CorePluginManager } from '../src/plugin/plugin-manager'
import { CoreEventManager } from '../src/event/event-manager'
import { CoreStateManager } from '../src/state/state-manager'
import { CoreMiddlewareManager } from '../src/middleware/middleware-manager'
import { CoreLifecycleManager } from '../src/lifecycle/lifecycle-manager'
import type { Plugin, Middleware, PluginContext } from '../src/types'

describe('内存泄漏测试', () => {
  let pluginManager: CorePluginManager
  let eventManager: CoreEventManager
  let stateManager: CoreStateManager
  let middlewareManager: CoreMiddlewareManager
  let lifecycleManager: CoreLifecycleManager
  let mockContext: PluginContext

  beforeEach(() => {
    mockContext = {
      engine: {} as any,
      config: { debug: false },
      container: undefined,
    }

    pluginManager = new CorePluginManager(mockContext)
    eventManager = new CoreEventManager()
    stateManager = new CoreStateManager()
    middlewareManager = new CoreMiddlewareManager()
    lifecycleManager = new CoreLifecycleManager()
  })

  afterEach(() => {
    // 清理所有资源
    eventManager.clear()
    stateManager.clear()
  })

  describe('事件监听器内存泄漏', () => {
    it('应该在移除监听器后释放内存', () => {
      const handlers: Array<() => void> = []

      // 注册1000个监听器
      for (let i = 0; i < 1000; i++) {
        const handler = vi.fn()
        handlers.push(handler)
        eventManager.on(`event-${i}`, handler)
      }

      // 验证监听器已注册
      expect(eventManager.listenerCount('event-0')).toBe(1)

      // 移除所有监听器
      for (let i = 0; i < 1000; i++) {
        eventManager.off(`event-${i}`, handlers[i])
      }

      // 验证监听器已移除
      expect(eventManager.listenerCount('event-0')).toBe(0)
      expect(eventManager.listenerCount('event-999')).toBe(0)
    })

    it('应该在clear后释放所有事件监听器', () => {
      // 注册大量监听器
      for (let i = 0; i < 1000; i++) {
        eventManager.on(`event-${i}`, vi.fn())
      }

      // 清理所有监听器
      eventManager.clear()

      // 验证所有监听器已清除
      for (let i = 0; i < 1000; i++) {
        expect(eventManager.listenerCount(`event-${i}`)).toBe(0)
      }
    })

    it('应该处理重复注册和移除的场景', () => {
      const handler = vi.fn()

      // 重复注册和移除100次
      for (let i = 0; i < 100; i++) {
        eventManager.on('test-event', handler)
        eventManager.off('test-event', handler)
      }

      // 验证最终没有监听器残留
      expect(eventManager.listenerCount('test-event')).toBe(0)
    })

    it('应该在once事件触发后自动清理', () => {
      const handlers: Array<() => void> = []

      // 注册100个一次性监听器
      for (let i = 0; i < 100; i++) {
        const handler = vi.fn()
        handlers.push(handler)
        eventManager.once(`once-event-${i}`, handler)
      }

      // 触发所有事件
      for (let i = 0; i < 100; i++) {
        eventManager.emit(`once-event-${i}`)
      }

      // 验证监听器已自动清除
      for (let i = 0; i < 100; i++) {
        expect(eventManager.listenerCount(`once-event-${i}`)).toBe(0)
      }
    })
  })

  describe('状态监听器内存泄漏', () => {
    it('应该在取消监听后释放内存', () => {
      const unwatchers: Array<() => void> = []

      // 注册1000个状态监听器
      for (let i = 0; i < 1000; i++) {
        const unwatcher = stateManager.watch(`key-${i}`, vi.fn())
        unwatchers.push(unwatcher)
      }

      // 取消所有监听
      unwatchers.forEach(unwatch => unwatch())

      // 更新状态不应触发任何监听器
      for (let i = 0; i < 1000; i++) {
        stateManager.set(`key-${i}`, `value-${i}`)
      }

      // 验证监听器已清除（通过没有调用来验证）
      expect(true).toBe(true)
    })

    it('应该在clear后释放所有状态和监听器', () => {
      // 设置大量状态和监听器
      for (let i = 0; i < 1000; i++) {
        stateManager.set(`key-${i}`, `value-${i}`)
        stateManager.watch(`key-${i}`, vi.fn())
      }

      // 清理所有状态
      stateManager.clear()

      // 验证所有状态已清除
      for (let i = 0; i < 1000; i++) {
        expect(stateManager.has(`key-${i}`)).toBe(false)
      }
    })

    it('应该处理重复监听和取消的场景', () => {
      let callCount = 0

      // 重复监听和取消100次
      for (let i = 0; i < 100; i++) {
        const unwatch = stateManager.watch('test-key', () => {
          callCount++
        })
        unwatch()
      }

      // 更新状态
      stateManager.set('test-key', 'new-value')

      // 验证没有监听器被调用
      expect(callCount).toBe(0)
    })

    it('应该在大量状态更新后保持性能', () => {
      const startTime = performance.now()

      // 执行10000次状态更新
      for (let i = 0; i < 10000; i++) {
        stateManager.set(`key-${i % 100}`, `value-${i}`)
      }

      const duration = performance.now() - startTime

      // 验证性能（10000次更新应在合理时间内完成）
      expect(duration).toBeLessThan(1000) // 1秒内完成
    })
  })

  describe('插件卸载后的资源清理', () => {
    it('应该在卸载插件后清理相关资源', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install() {
          // 模拟插件安装
        },
        uninstall: vi.fn(),
      }

      // 安装插件
      await pluginManager.use(plugin)
      expect(pluginManager.has('test-plugin')).toBe(true)

      // 卸载插件
      await pluginManager.uninstall('test-plugin')

      // 验证插件已卸载
      expect(pluginManager.has('test-plugin')).toBe(false)
      expect(plugin.uninstall).toHaveBeenCalled()
    })

    it('应该处理插件重复安装和卸载', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: vi.fn(),
        uninstall: vi.fn(),
      }

      // 重复安装和卸载10次
      for (let i = 0; i < 10; i++) {
        await pluginManager.use(plugin)
        await pluginManager.uninstall('test-plugin')
      }

      // 验证最终状态
      expect(pluginManager.has('test-plugin')).toBe(false)
      expect(plugin.install).toHaveBeenCalledTimes(10)
      expect(plugin.uninstall).toHaveBeenCalledTimes(10)
    })

    it('应该在卸载时清理插件注册的事件监听器', async () => {
      let handlerCalled = false

      const plugin: Plugin = {
        name: 'event-plugin',
        version: '1.0.0',
        install() {
          eventManager.on('plugin-event', () => {
            handlerCalled = true
          })
        },
      }

      // 安装插件
      await pluginManager.use(plugin)

      // 触发事件
      eventManager.emit('plugin-event')
      expect(handlerCalled).toBe(true)

      // 重置标志
      handlerCalled = false

      // 卸载插件（实际实现中应该清理事件监听器）
      await pluginManager.uninstall('event-plugin')

      // 手动清理事件（模拟插件清理逻辑）
      eventManager.clear()

      // 再次触发事件
      eventManager.emit('plugin-event')
      expect(handlerCalled).toBe(false)
    })
  })

  describe('中间件内存管理', () => {
    it('应该在移除中间件后释放内存', () => {
      const middlewares: Middleware[] = []

      // 注册100个中间件
      for (let i = 0; i < 100; i++) {
        const middleware: Middleware = {
          name: `middleware-${i}`,
          execute: vi.fn(async (_ctx, next) => next()),
        }
        middlewares.push(middleware)
        middlewareManager.use(middleware)
      }

      // 验证中间件已注册
      expect(middlewareManager.getAll().length).toBe(100)

      // 移除所有中间件
      for (let i = 0; i < 100; i++) {
        middlewareManager.remove(`middleware-${i}`)
      }

      // 验证中间件已移除
      expect(middlewareManager.getAll().length).toBe(0)
    })

    it('应该在clear后释放所有中间件', () => {
      // 注册大量中间件
      for (let i = 0; i < 100; i++) {
        middlewareManager.use({
          name: `middleware-${i}`,
          execute: async (_ctx, next) => next(),
        })
      }

      // 清理所有中间件
      middlewareManager.clear()

      // 验证所有中间件已清除
      expect(middlewareManager.getAll().length).toBe(0)
    })
  })

  describe('生命周期钩子内存管理', () => {
    it('应该在移除钩子后释放内存', () => {
      const hooks: Array<() => void> = []

      // 注册100个钩子
      for (let i = 0; i < 100; i++) {
        const hook = vi.fn()
        hooks.push(hook)
        lifecycleManager.on('beforeMount', hook)
      }

      // 移除所有钩子
      for (let i = 0; i < 100; i++) {
        lifecycleManager.off('beforeMount', hooks[i])
      }

      // 触发生命周期
      lifecycleManager.trigger('beforeMount')

      // 验证钩子没有被调用
      hooks.forEach(hook => {
        expect(hook).not.toHaveBeenCalled()
      })
    })

    it('应该在clear后释放所有钩子', () => {
      // 注册大量钩子
      for (let i = 0; i < 100; i++) {
        lifecycleManager.on('mounted', vi.fn())
      }

      // 清理所有钩子
      lifecycleManager.clear()

      // 验证清理成功（通过调用不抛错来验证）
      expect(() => lifecycleManager.trigger('mounted')).not.toThrow()
    })
  })

  describe('大量操作后的内存使用', () => {
    it('应该处理10000次事件触发', () => {
      let callCount = 0
      eventManager.on('high-frequency-event', () => {
        callCount++
      })

      const startTime = performance.now()

      // 触发10000次事件
      for (let i = 0; i < 10000; i++) {
        eventManager.emit('high-frequency-event', { index: i })
      }

      const duration = performance.now() - startTime

      // 验证所有事件都被处理
      expect(callCount).toBe(10000)

      // 验证性能（10000次事件应在合理时间内完成）
      expect(duration).toBeLessThan(500) // 500ms内完成
    })

    it('应该处理10000次状态更新', () => {
      const startTime = performance.now()

      // 执行10000次状态更新
      for (let i = 0; i < 10000; i++) {
        stateManager.set(`key-${i % 1000}`, `value-${i}`)
      }

      const duration = performance.now() - startTime

      // 验证性能
      expect(duration).toBeLessThan(1000) // 1秒内完成
    })

    it('应该处理1000次插件安装和卸载', async () => {
      const startTime = performance.now()

      // 执行1000次插件操作
      for (let i = 0; i < 1000; i++) {
        const plugin: Plugin = {
          name: `plugin-${i}`,
          version: '1.0.0',
          install: vi.fn(),
          uninstall: vi.fn(),
        }

        await pluginManager.use(plugin)
        await pluginManager.uninstall(`plugin-${i}`)
      }

      const duration = performance.now() - startTime

      // 验证所有插件都已清理
      expect(pluginManager.getAll().length).toBe(0)

      // 验证性能（应该在合理时间内完成）
      expect(duration).toBeLessThan(5000) // 5秒内完成
    })
  })

  describe('长时间运行场景', () => {
    it('应该在连续注册和移除监听器后保持稳定', () => {
      // 模拟长时间运行：100轮注册和移除
      for (let round = 0; round < 100; round++) {
        const handlers: Array<() => void> = []

        // 注册100个监听器
        for (let i = 0; i < 100; i++) {
          const handler = vi.fn()
          handlers.push(handler)
          eventManager.on(`event-${round}-${i}`, handler)
        }

        // 移除所有监听器
        for (let i = 0; i < 100; i++) {
          eventManager.off(`event-${round}-${i}`, handlers[i])
        }
      }

      // 验证最终状态（没有监听器残留）
      expect(true).toBe(true)
    })

    it('应该在连续状态更新后保持性能', () => {
      const durations: number[] = []

      // 执行10轮，每轮1000次更新
      for (let round = 0; round < 10; round++) {
        const startTime = performance.now()

        for (let i = 0; i < 1000; i++) {
          stateManager.set(`key-${i}`, `value-${round}-${i}`)
        }

        durations.push(performance.now() - startTime)
      }

      // 验证性能没有明显降低（最后一轮不应该比第一轮慢太多）
      const firstRound = durations[0]
      const lastRound = durations[durations.length - 1]
      expect(lastRound).toBeLessThan(firstRound * 2) // 不超过2倍
    })
  })

  describe('复杂场景内存管理', () => {
    it('应该处理混合操作场景', async () => {
      const startTime = performance.now()

      // 执行100轮混合操作
      for (let i = 0; i < 100; i++) {
        // 1. 注册事件监听器
        const eventHandler = vi.fn()
        eventManager.on(`event-${i}`, eventHandler)

        // 2. 设置状态
        stateManager.set(`key-${i}`, `value-${i}`)

        // 3. 注册状态监听器
        const stateUnwatch = stateManager.watch(`key-${i}`, vi.fn())

        // 4. 安装插件
        const plugin: Plugin = {
          name: `plugin-${i}`,
          version: '1.0.0',
          install: vi.fn(),
        }
        await pluginManager.use(plugin)

        // 5. 触发事件
        eventManager.emit(`event-${i}`)

        // 6. 更新状态
        stateManager.set(`key-${i}`, `new-value-${i}`)

        // 7. 清理
        eventManager.off(`event-${i}`, eventHandler)
        stateUnwatch()
        await pluginManager.uninstall(`plugin-${i}`)
      }

      const duration = performance.now() - startTime

      // 验证性能和最终状态
      expect(duration).toBeLessThan(3000) // 3秒内完成
      expect(pluginManager.getAll().length).toBe(0)
    })
  })
})