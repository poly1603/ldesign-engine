/**
 * 核心引擎测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { createCoreEngine } from '../engine'
import { definePlugin } from '../plugin'
import { defineMiddleware } from '../middleware'

describe('CoreEngine', () => {
  let engine: ReturnType<typeof createCoreEngine>

  beforeEach(() => {
    engine = createCoreEngine({
      name: 'Test Engine',
      debug: false,
    })
  })

  describe('初始化', () => {
    it('应该成功创建引擎实例', () => {
      expect(engine).toBeDefined()
      expect(engine.config.name).toBe('Test Engine')
    })

    it('应该成功初始化引擎', async () => {
      await engine.init()
      expect(engine).toBeDefined()
    })

    it('应该触发初始化生命周期钩子', async () => {
      const hooks: string[] = []

      engine.lifecycle.on('beforeInit', () => hooks.push('beforeInit'))
      engine.lifecycle.on('init', () => hooks.push('init'))
      engine.lifecycle.on('afterInit', () => hooks.push('afterInit'))

      await engine.init()

      expect(hooks).toEqual(['beforeInit', 'init', 'afterInit'])
    })
  })

  describe('插件系统', () => {
    it('应该成功注册插件', async () => {
      const plugin = definePlugin({
        name: 'test-plugin',
        version: '1.0.0',
        install(context) {
          context.engine.state.set('pluginInstalled', true)
        },
      })

      await engine.init()
      await engine.use(plugin)

      expect(engine.plugins.has('test-plugin')).toBe(true)
      expect(engine.state.get('pluginInstalled')).toBe(true)
    })

    it('应该支持插件依赖', async () => {
      const basePlugin = definePlugin({
        name: 'base-plugin',
        install() {},
      })

      const dependentPlugin = definePlugin({
        name: 'dependent-plugin',
        dependencies: ['base-plugin'],
        install() {},
      })

      await engine.init()
      await engine.use(basePlugin)
      await engine.use(dependentPlugin)

      expect(engine.plugins.has('base-plugin')).toBe(true)
      expect(engine.plugins.has('dependent-plugin')).toBe(true)
    })

    it('应该在缺少依赖时抛出错误', async () => {
      const dependentPlugin = definePlugin({
        name: 'dependent-plugin',
        dependencies: ['missing-plugin'],
        install() {},
      })

      await engine.init()

      await expect(engine.use(dependentPlugin)).rejects.toThrow()
    })
  })

  describe('中间件系统', () => {
    it('应该成功注册中间件', () => {
      const middleware = defineMiddleware({
        name: 'test-middleware',
        execute: async (context, next) => {
          await next()
        },
      })

      engine.middleware.use(middleware)

      expect(engine.middleware.get('test-middleware')).toBeDefined()
      expect(engine.middleware.size()).toBe(1)
    })

    it('应该按优先级执行中间件', async () => {
      const order: number[] = []

      const middleware1 = defineMiddleware({
        name: 'middleware-1',
        priority: 1,
        execute: async (context, next) => {
          order.push(1)
          await next()
        },
      })

      const middleware2 = defineMiddleware({
        name: 'middleware-2',
        priority: 2,
        execute: async (context, next) => {
          order.push(2)
          await next()
        },
      })

      engine.middleware.use(middleware1)
      engine.middleware.use(middleware2)

      await engine.middleware.execute({ data: {} })

      expect(order).toEqual([2, 1]) // 优先级高的先执行
    })

    it('应该支持中间件错误处理', async () => {
      let errorHandled = false

      const middleware = defineMiddleware({
        name: 'error-middleware',
        execute: async () => {
          throw new Error('Test error')
        },
        onError: async (error) => {
          errorHandled = true
          expect(error.message).toBe('Test error')
        },
      })

      engine.middleware.use(middleware)

      await engine.middleware.execute({ data: {} })

      expect(errorHandled).toBe(true)
    })
  })

  describe('生命周期系统', () => {
    it('应该成功注册生命周期钩子', () => {
      const handler = () => {}
      engine.lifecycle.on('mounted', handler)

      expect(engine.lifecycle.getHandlers('mounted')).toContain(handler)
    })

    it('应该成功触发生命周期钩子', async () => {
      let called = false

      engine.lifecycle.on('mounted', () => {
        called = true
      })

      await engine.lifecycle.trigger('mounted')

      expect(called).toBe(true)
    })

    it('应该支持一次性钩子', async () => {
      let callCount = 0

      engine.lifecycle.once('mounted', () => {
        callCount++
      })

      await engine.lifecycle.trigger('mounted')
      await engine.lifecycle.trigger('mounted')

      expect(callCount).toBe(1)
    })

    it('应该支持移除钩子', async () => {
      let called = false
      const handler = () => {
        called = true
      }

      engine.lifecycle.on('mounted', handler)
      engine.lifecycle.off('mounted', handler)

      await engine.lifecycle.trigger('mounted')

      expect(called).toBe(false)
    })
  })

  describe('事件系统', () => {
    it('应该成功触发和监听事件', () => {
      let received: any = null

      engine.events.on('test-event', (payload) => {
        received = payload
      })

      engine.events.emit('test-event', { data: 'hello' })

      expect(received).toEqual({ data: 'hello' })
    })

    it('应该支持一次性监听', () => {
      let callCount = 0

      engine.events.once('test-event', () => {
        callCount++
      })

      engine.events.emit('test-event')
      engine.events.emit('test-event')

      expect(callCount).toBe(1)
    })

    it('应该支持移除监听器', () => {
      let called = false
      const handler = () => {
        called = true
      }

      engine.events.on('test-event', handler)
      engine.events.off('test-event', handler)
      engine.events.emit('test-event')

      expect(called).toBe(false)
    })

    it('应该返回正确的监听器数量', () => {
      engine.events.on('test-event', () => {})
      engine.events.on('test-event', () => {})

      expect(engine.events.listenerCount('test-event')).toBe(2)
    })
  })

  describe('状态管理', () => {
    it('应该成功设置和获取状态', () => {
      engine.state.set('count', 0)
      expect(engine.state.get('count')).toBe(0)
    })

    it('应该支持状态监听', () => {
      let newValue: any = null
      let oldValue: any = null

      engine.state.watch('count', (nv, ov) => {
        newValue = nv
        oldValue = ov
      })

      engine.state.set('count', 0)
      engine.state.set('count', 1)

      expect(newValue).toBe(1)
      expect(oldValue).toBe(0)
    })

    it('应该支持检查状态是否存在', () => {
      engine.state.set('count', 0)
      expect(engine.state.has('count')).toBe(true)
      expect(engine.state.has('missing')).toBe(false)
    })

    it('应该支持删除状态', () => {
      engine.state.set('count', 0)
      expect(engine.state.delete('count')).toBe(true)
      expect(engine.state.has('count')).toBe(false)
    })

    it('应该支持获取所有状态键', () => {
      engine.state.set('key1', 'value1')
      engine.state.set('key2', 'value2')

      const keys = engine.state.keys()
      expect(keys).toContain('key1')
      expect(keys).toContain('key2')
    })

    it('应该支持获取所有状态', () => {
      engine.state.set('key1', 'value1')
      engine.state.set('key2', 'value2')

      const all = engine.state.getAll()
      expect(all).toEqual({
        key1: 'value1',
        key2: 'value2',
      })
    })
  })

  describe('销毁', () => {
    it('应该成功销毁引擎', async () => {
      await engine.init()
      await engine.destroy()

      expect(engine.plugins.getAll()).toHaveLength(0)
      expect(engine.middleware.size()).toBe(0)
      expect(engine.state.keys()).toHaveLength(0)
    })

    it('应该触发销毁生命周期钩子', async () => {
      const hooks: string[] = []

      engine.lifecycle.on('beforeDestroy', () => hooks.push('beforeDestroy'))
      engine.lifecycle.on('destroyed', () => hooks.push('destroyed'))

      await engine.init()
      await engine.destroy()

      expect(hooks).toEqual(['beforeDestroy', 'destroyed'])
    })
  })
})

