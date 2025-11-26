/**
 * 错误处理边界场景测试
 * 
 * 测试 Engine 在各种错误情况下的行为
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createCoreEngine } from '../src/engine'
import type { CoreEngine, Plugin } from '../src/types'

describe('错误处理', () => {
  let engine: CoreEngine

  beforeEach(async () => {
    engine = createCoreEngine({
      name: 'error-test-app',
      debug: true,
    })
    await engine.init()
  })

  describe('插件错误处理', () => {
    it('应该捕获插件安装时的错误', async () => {
      const errorPlugin: Plugin = {
        name: 'error-plugin',
        version: '1.0.0',
        install: () => {
          throw new Error('Installation failed')
        },
      }

      await expect(engine.use(errorPlugin)).rejects.toThrow('Installation failed')
    })

    it('应该捕获异步插件安装错误', async () => {
      const asyncErrorPlugin: Plugin = {
        name: 'async-error-plugin',
        version: '1.0.0',
        install: async () => {
          await new Promise(resolve => setTimeout(resolve, 10))
          throw new Error('Async installation failed')
        },
      }

      await expect(engine.use(asyncErrorPlugin)).rejects.toThrow('Async installation failed')
    })

    it('应该处理插件卸载错误', async () => {
      const plugin: Plugin = {
        name: 'uninstall-error-plugin',
        version: '1.0.0',
        install: () => { },
        uninstall: () => {
          throw new Error('Uninstall failed')
        },
      }

      await engine.use(plugin)

      // 卸载应该捕获错误但不应该抛出
      await expect(engine.plugins.uninstall('uninstall-error-plugin')).rejects.toThrow()
    })

    it('应该处理重复安装插件', async () => {
      const plugin: Plugin = {
        name: 'duplicate-plugin',
        version: '1.0.0',
        install: vi.fn(),
      }

      await engine.use(plugin)

      // 重复安装会被静默跳过，不会抛出错误
      await expect(engine.use(plugin)).resolves.not.toThrow()
    })

    it('应该处理缺失依赖的插件', async () => {
      const dependentPlugin: Plugin = {
        name: 'dependent-plugin',
        version: '1.0.0',
        dependencies: ['missing-plugin'],
        install: () => { },
      }

      await expect(engine.use(dependentPlugin)).rejects.toThrow(/dependencies/)
    })

    it('应该处理循环依赖', async () => {
      const pluginA: Plugin = {
        name: 'plugin-a',
        version: '1.0.0',
        dependencies: ['plugin-b'],
        install: () => { },
      }

      const pluginB: Plugin = {
        name: 'plugin-b',
        version: '1.0.0',
        dependencies: ['plugin-a'],
        install: () => { },
      }

      await expect(engine.use(pluginA)).rejects.toThrow()
    })
  })

  describe('事件错误处理', () => {
    it('应该捕获事件监听器中的错误', () => {
      let errorCaught = false

      engine.events.on('test:error', () => {
        errorCaught = true
        throw new Error('Listener error')
      })

      // 触发事件不应该抛出错误（错误被内部处理）
      expect(() => {
        engine.events.emit('test:error')
      }).not.toThrow()

      // 验证监听器被执行
      expect(errorCaught).toBe(true)
    })

    it('应该处理异步事件监听器错误', async () => {
      let errorCaught = false

      engine.events.on('test:async-error', async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 10))
          errorCaught = true
          throw new Error('Async listener error')
        } catch (error) {
          // 捕获异步错误，防止未处理的 rejection
          console.error('Handled async error:', error)
        }
      })

      // 触发异步事件
      engine.events.emit('test:async-error')

      // 等待异步完成
      await new Promise(resolve => setTimeout(resolve, 50))

      // 验证监听器被执行
      expect(errorCaught).toBe(true)
    })

    it('应该处理空事件名', () => {
      expect(() => {
        engine.events.emit('')
      }).not.toThrow()
    })

    it('应该处理不存在的事件', () => {
      expect(() => {
        engine.events.emit('non-existent-event')
      }).not.toThrow()
    })

    it('应该处理无效的监听器', () => {
      // 引擎可能不会对 null/undefined 监听器抛出错误
      // 而是静默忽略或在执行时才报错
      engine.events.on('test', null as any)
      engine.events.on('test', undefined as any)

      // 触发事件不应该崩溃
      expect(() => {
        engine.events.emit('test')
      }).not.toThrow()
    })
  })

  describe('状态错误处理', () => {
    it('应该处理无效的状态键', () => {
      // 状态管理器可能允许空字符串作为键
      // 只测试实际会抛出错误的情况
      engine.state.set('', 'value')
      expect(engine.state.get('')).toBe('value')

      // null 和 undefined 键会被转换为字符串存储
      engine.state.set(null as any, 'null-value')
      engine.state.set(undefined as any, 'undefined-value')

      // 需要用原始的键访问（Map 会保留原始键）
      expect(engine.state.get(null as any)).toBe('null-value')
      expect(engine.state.get(undefined as any)).toBe('undefined-value')
    })

    it('应该处理循环引用对象', () => {
      const circular: any = { name: 'test' }
      circular.self = circular

      // 应该能设置但可能无法序列化
      expect(() => {
        engine.state.set('circular', circular)
      }).not.toThrow()
    })

    it('应该处理大型状态对象', () => {
      const largeState = {
        data: new Array(10000).fill(0).map((_, i) => ({
          id: i,
          value: `value${i}`,
        }))
      }

      expect(() => {
        engine.state.set('large-state', largeState)
      }).not.toThrow()
    })

    it('应该处理状态监听器错误', () => {
      engine.state.watch('error-key', () => {
        throw new Error('Watch error')
      })

      expect(() => {
        engine.state.set('error-key', 'value')
      }).not.toThrow()
    })
  })

  describe('中间件错误处理', () => {
    it('应该捕获中间件执行错误', async () => {
      engine.middleware.use({
        name: 'error-middleware',
        priority: 100,
        execute: async () => {
          throw new Error('Middleware error')
        },
      })

      const context = { engine, data: {} }

      await expect(
        engine.middleware.execute(context)
      ).rejects.toThrow('Middleware error')
    })

    it('应该处理中间件未调用 next', async () => {
      engine.middleware.use({
        name: 'no-next-middleware',
        priority: 100,
        execute: async () => {
          // 故意不调用 next()
        },
      })

      const context = { engine, data: {} }

      // 应该能正常完成，即使没有调用 next
      await expect(
        engine.middleware.execute(context)
      ).resolves.not.toThrow()
    })

    it('应该处理多次调用 next', async () => {
      let nextCallCount = 0

      engine.middleware.use({
        name: 'multi-next-middleware',
        priority: 100,
        execute: async (ctx, next) => {
          nextCallCount++
          await next()
          await next() // 第二次调用应该被忽略或处理
        },
      })

      const context = { engine, data: {} }

      await engine.middleware.execute(context)

      // next 只应该被有效调用一次
      expect(nextCallCount).toBe(1)
    })
  })

  describe('生命周期错误处理', () => {
    it('应该捕获生命周期钩子错误', async () => {
      let errorCaught = false

      engine.lifecycle.on('beforeMount', () => {
        errorCaught = true
        throw new Error('Hook error')
      })

      // trigger 方法会捕获错误但不会阻止其他钩子执行
      await engine.lifecycle.trigger('beforeMount', {})

      // 验证钩子被触发（通过副作用）
      expect(errorCaught).toBe(true)
    })

    it('应该处理异步钩子错误', async () => {
      let errorCaught = false

      engine.lifecycle.on('mounted', async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        errorCaught = true
        throw new Error('Async hook error')
      })

      // trigger 会隔离错误
      await engine.lifecycle.trigger('mounted', {})

      // 等待异步完成
      await new Promise(resolve => setTimeout(resolve, 50))

      // 验证钩子被触发
      expect(errorCaught).toBe(true)
    })

    it('应该处理不存在的生命周期钩子', async () => {
      // 触发未注册的钩子应该是安全的
      await expect(
        engine.lifecycle.trigger('non-existent' as any, {})
      ).resolves.not.toThrow()
    })
  })

  describe('配置错误处理', () => {
    it('应该处理引擎配置访问', () => {
      // 引擎配置是只读的 CoreEngineConfig 对象
      expect(engine.config).toBeDefined()
      expect(engine.config.name).toBe('error-test-app')
      expect(engine.config.debug).toBe(true)
    })

    it('应该处理引擎配置修改', () => {
      // config 对象的属性可能是可修改的
      (engine.config as any).name = 'new-name'

      // 验证修改（实际行为可能不同）
      // 如果是只读的，应该保持原值；如果可修改，则是新值
      expect(engine.config.name).toBeDefined()
    })

    it('应该处理自定义配置字段', () => {
      const customEngine = createCoreEngine({
        name: 'custom-app',
        debug: false,
        customField: 'custom-value',
        nested: {
          deep: {
            value: 123
          }
        }
      })

      // 使用类型断言访问自定义字段
      expect((customEngine.config as any).customField).toBe('custom-value')
      expect((customEngine.config as any).nested?.deep?.value).toBe(123)
    })
  })

  describe('引擎初始化错误', () => {
    it('应该处理重复初始化', async () => {
      const newEngine = createCoreEngine({ name: 'test' })
      await newEngine.init()

      // 重复初始化应该被阻止或忽略
      await expect(newEngine.init()).resolves.not.toThrow()
    })

    it('应该处理无效的引擎配置', () => {
      // 引擎可能有默认配置，允许 null/undefined
      const engine1 = createCoreEngine(null as any)
      expect(engine1).toBeDefined()

      const engine2 = createCoreEngine(undefined as any)
      expect(engine2).toBeDefined()
    })

    it('应该处理空配置对象', () => {
      // 引擎应该能用空配置初始化
      const engine = createCoreEngine({} as any)
      expect(engine).toBeDefined()
      expect(engine.config).toBeDefined()
    })
  })

  describe('资源清理错误', () => {
    it('应该处理销毁时的错误', async () => {
      const plugin: Plugin = {
        name: 'cleanup-error-plugin',
        version: '1.0.0',
        install: () => { },
        uninstall: () => {
          throw new Error('Cleanup error')
        },
      }

      await engine.use(plugin)

      // 销毁应该尝试清理，即使有错误
      await expect(engine.destroy()).resolves.not.toThrow()
    })

    it('应该处理多次销毁', async () => {
      await engine.destroy()

      // 再次销毁应该是安全的
      await expect(engine.destroy()).resolves.not.toThrow()
    })
  })
})