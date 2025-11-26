/**
 * 并发测试套件
 * 测试引擎在并发场景下的行为
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CorePluginManager } from '../src/plugin/plugin-manager'
import { CoreEventManager } from '../src/event/event-manager'
import { CoreStateManager } from '../src/state/state-manager'
import { CoreMiddlewareManager } from '../src/middleware/middleware-manager'
import { CoreLifecycleManager } from '../src/lifecycle/lifecycle-manager'
import type { Plugin, Middleware, PluginContext } from '../src/types'

describe('并发测试', () => {
  let pluginManager: CorePluginManager
  let eventManager: CoreEventManager
  let stateManager: CoreStateManager
  let middlewareManager: CoreMiddlewareManager
  let lifecycleManager: CoreLifecycleManager
  let mockContext: PluginContext

  beforeEach(() => {
    // 创建模拟上下文
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

  describe('并发插件操作', () => {
    it('应该处理并发插件安装', async () => {
      const plugins: Plugin[] = Array.from({ length: 10 }, (_, i) => ({
        name: `plugin-${i}`,
        version: '1.0.0',
        install: vi.fn(),
      }))

      // 并发安装所有插件
      const results = await Promise.allSettled(
        plugins.map(plugin => pluginManager.use(plugin))
      )

      // 所有插件应该成功安装
      results.forEach(result => {
        expect(result.status).toBe('fulfilled')
      })

      // 验证所有插件都已安装
      plugins.forEach(plugin => {
        expect(pluginManager.has(plugin.name)).toBe(true)
      })
    })

    it('应该处理相同插件的多次并发安装', async () => {
      const plugin: Plugin = {
        name: 'duplicate-plugin',
        version: '1.0.0',
        install: vi.fn(),
      }

      // 并发安装同一个插件10次
      const results = await Promise.allSettled(
        Array.from({ length: 10 }, () => pluginManager.use(plugin))
      )

      // 第一次应该成功，其余应该被跳过
      expect(results[0].status).toBe('fulfilled')
      expect(pluginManager.has(plugin.name)).toBe(true)

      // install 应该只被调用一次
      expect(plugin.install).toHaveBeenCalledTimes(1)
    })
  })

  describe('并发事件操作', () => {
    it('应该处理并发事件监听', () => {
      const handlers = Array.from({ length: 100 }, () => vi.fn())

      // 并发注册100个监听器
      handlers.forEach(handler => {
        eventManager.on('test:event', handler)
      })

      // 触发事件
      eventManager.emit('test:event', { data: 'test' })

      // 所有监听器都应该被调用
      handlers.forEach(handler => {
        expect(handler).toHaveBeenCalledTimes(1)
      })
    })

    it('应该处理并发事件触发', async () => {
      const callCounts = new Map<number, number>()
      let totalCalls = 0

      eventManager.on('test:concurrent', (data: { id: number }) => {
        totalCalls++
        callCounts.set(data.id, (callCounts.get(data.id) || 0) + 1)
      })

      // 并发触发100个事件
      const promises = Array.from({ length: 100 }, (_, i) =>
        Promise.resolve().then(() => {
          eventManager.emit('test:concurrent', { id: i })
        })
      )

      await Promise.all(promises)

      // 等待所有异步操作完成
      await new Promise(resolve => setTimeout(resolve, 50))

      // 应该收到100个事件
      expect(totalCalls).toBe(100)
      expect(callCounts.size).toBe(100)
    })

    it('应该处理高频事件触发', async () => {
      let callCount = 0
      eventManager.on('test:highfreq', () => {
        callCount++
      })

      // 快速触发1000个事件
      for (let i = 0; i < 1000; i++) {
        eventManager.emit('test:highfreq')
      }

      // 等待处理完成
      await new Promise(resolve => setTimeout(resolve, 50))

      expect(callCount).toBe(1000)
    })
  })

  describe('并发状态操作', () => {
    it('应该处理并发状态写入', async () => {
      // 并发写入100个不同的状态
      await Promise.all(
        Array.from({ length: 100 }, (_, i) =>
          Promise.resolve().then(() => {
            stateManager.set(`key-${i}`, `value-${i}`)
          })
        )
      )

      // 验证所有状态都已设置
      for (let i = 0; i < 100; i++) {
        expect(stateManager.get(`key-${i}`)).toBe(`value-${i}`)
      }
    })

    it('应该处理同一状态的并发读写', async () => {
      stateManager.set('counter', 0)
      const results: number[] = []

      // 并发读取和递增
      await Promise.all(
        Array.from({ length: 100 }, () =>
          Promise.resolve().then(() => {
            const current = stateManager.get('counter') as number
            results.push(current)
            stateManager.set('counter', current + 1)
          })
        )
      )

      // 最终值应该是递增的（可能不是100，因为存在竞态）
      const finalValue = stateManager.get('counter') as number
      expect(finalValue).toBeGreaterThan(0)
      expect(finalValue).toBeLessThanOrEqual(100)
    })

    it('应该处理并发状态监听', () => {
      const watchers = Array.from({ length: 50 }, () => vi.fn())

      // 并发注册监听器
      watchers.forEach(watcher => {
        stateManager.watch('test-key', watcher)
      })

      // 更新状态
      stateManager.set('test-key', 'new-value')

      // 所有监听器都应该被调用
      watchers.forEach(watcher => {
        expect(watcher).toHaveBeenCalledWith('new-value', undefined)
      })
    })

    it('应该处理批量状态操作的并发', async () => {
      // 并发执行多个批量操作
      await Promise.all([
        Promise.resolve().then(() => {
          stateManager.set('batch1-key1', 'value1')
          stateManager.set('batch1-key2', 'value2')
        }),
        Promise.resolve().then(() => {
          stateManager.set('batch2-key1', 'value1')
          stateManager.set('batch2-key2', 'value2')
        }),
        Promise.resolve().then(() => {
          stateManager.set('batch3-key1', 'value1')
          stateManager.set('batch3-key2', 'value2')
        }),
      ])

      // 验证所有批量操作都成功
      expect(stateManager.get('batch1-key1')).toBe('value1')
      expect(stateManager.get('batch2-key1')).toBe('value1')
      expect(stateManager.get('batch3-key1')).toBe('value1')
    })
  })

  describe('并发中间件操作', () => {
    it('应该处理并发中间件注册', () => {
      const middlewares: Middleware[] = Array.from({ length: 20 }, (_, i) => ({
        name: `middleware-${i}`,
        execute: vi.fn(async (_ctx, next) => next()),
      }))

      // 并发注册所有中间件
      middlewares.forEach(middleware => {
        middlewareManager.use(middleware)
      })

      // 验证所有中间件都已注册
      expect(middlewareManager.getAll().length).toBe(20)
    })

    it('应该处理并发中间件执行', async () => {
      let executionCount = 0
      const middleware: Middleware = {
        name: 'concurrent-middleware',
        execute: async (_ctx, next) => {
          executionCount++
          await new Promise(resolve => setTimeout(resolve, 10))
          await next()
        },
      }

      middlewareManager.use(middleware)

      // 并发执行中间件链10次
      await Promise.all(
        Array.from({ length: 10 }, () =>
          middlewareManager.execute({
            data: {},
          })
        )
      )

      // 中间件应该被执行10次
      expect(executionCount).toBe(10)
    })
  })

  describe('并发生命周期操作', () => {
    it('应该处理并发生命周期钩子注册', () => {
      const hooks = Array.from({ length: 30 }, () => vi.fn())

      // 并发注册钩子
      hooks.forEach(hook => {
        lifecycleManager.on('beforeMount', hook)
      })

      // 触发钩子
      lifecycleManager.trigger('beforeMount')

      // 所有钩子都应该被调用
      hooks.forEach(hook => {
        expect(hook).toHaveBeenCalledTimes(1)
      })
    })

    it('应该处理并发生命周期钩子触发', async () => {
      let triggerCount = 0

      lifecycleManager.on('mounted', () => {
        triggerCount++
      })

      // 并发触发钩子
      await Promise.all(
        Array.from({ length: 10 }, () =>
          lifecycleManager.trigger('mounted')
        )
      )

      // 钩子应该被触发10次
      expect(triggerCount).toBe(10)
    })
  })

  describe('竞态条件处理', () => {
    it('应该处理插件安装和状态访问的竞态', async () => {
      const plugin: Plugin = {
        name: 'race-plugin',
        version: '1.0.0',
        install() {
          stateManager.set('plugin-data', 'installed')
        },
      }

      // 并发执行插件安装和状态访问
      await Promise.all([
        pluginManager.use(plugin),
        new Promise(resolve => {
          setTimeout(() => {
            resolve(stateManager.get('plugin-data'))
          }, 5)
        }),
      ])

      // 状态应该最终被设置
      expect(stateManager.get('plugin-data')).toBe('installed')
    })

    it('应该处理事件监听和触发的竞态', async () => {
      let eventReceived = false

      // 并发执行事件监听和触发
      await Promise.all([
        new Promise<void>(resolve => {
          eventManager.on('race:event', () => {
            eventReceived = true
          })
          resolve()
        }),
        new Promise<void>(resolve => {
          setTimeout(() => {
            eventManager.emit('race:event')
            resolve()
          }, 5)
        }),
      ])

      // 等待事件处理
      await new Promise(resolve => setTimeout(resolve, 20))

      // 事件应该被接收
      expect(eventReceived).toBe(true)
    })

    it('应该处理状态更新和监听器触发的竞态', async () => {
      const updates: number[] = []

      // 注册监听器
      stateManager.watch('counter', (newValue) => {
        updates.push(newValue as number)
      })

      // 快速连续更新状态
      for (let i = 0; i < 100; i++) {
        stateManager.set('counter', i)
      }

      // 等待所有监听器执行完成
      await new Promise(resolve => setTimeout(resolve, 50))

      // 应该收到所有更新
      expect(updates.length).toBe(100)
      expect(updates[updates.length - 1]).toBe(99)
    })
  })

  describe('死锁和循环依赖检测', () => {
    it('应该避免插件依赖死锁', async () => {
      const pluginA: Plugin = {
        name: 'plugin-a',
        version: '1.0.0',
        dependencies: ['plugin-b'],
        install: vi.fn(),
      }

      const pluginB: Plugin = {
        name: 'plugin-b',
        version: '1.0.0',
        dependencies: ['plugin-a'],
        install: vi.fn(),
      }

      // 尝试安装循环依赖的插件
      await expect(pluginManager.use(pluginA)).rejects.toThrow()
      await expect(pluginManager.use(pluginB)).rejects.toThrow()
    })
  })

  describe('资源竞争', () => {
    it('应该处理共享资源的并发访问', async () => {
      // 模拟共享资源（计数器）
      stateManager.set('shared-counter', 0)
      const increments: number[] = []

      // 并发递增共享计数器
      await Promise.all(
        Array.from({ length: 100 }, async () => {
          const current = stateManager.get('shared-counter') as number
          await new Promise(resolve => setTimeout(resolve, 1))
          const newValue = current + 1
          stateManager.set('shared-counter', newValue)
          increments.push(newValue)
        })
      )

      // 由于竞态条件，最终值可能不是100
      const finalValue = stateManager.get('shared-counter') as number
      expect(finalValue).toBeGreaterThan(0)
      expect(finalValue).toBeLessThanOrEqual(100)
    })

    it('应该处理并发状态访问', async () => {
      // 设置初始状态
      stateManager.set('test-value', 'initial')

      // 并发读取状态
      const results = await Promise.all(
        Array.from({ length: 50 }, () =>
          Promise.resolve().then(() => {
            return stateManager.get('test-value')
          })
        )
      )

      // 所有调用都应该成功
      results.forEach((result: string | undefined) => {
        expect(result).toBe('initial')
      })
    })
  })
})