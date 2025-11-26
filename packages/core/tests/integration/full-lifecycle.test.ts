/**
 * 完整生命周期集成测试
 *
 * 测试引擎从启动到销毁的完整生命周期流程
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createEventManager } from '../../src/event/event-manager'
import { createStateManager } from '../../src/state/state-manager'
import { createLifecycleManager } from '../../src/lifecycle/lifecycle-manager'
import { createPluginManager } from '../../src/plugin/plugin-manager'
import { CoreMiddlewareManager } from '../../src/middleware/middleware-manager'
import type {
  EventManager,
  StateManager,
  LifecycleManager,
  PluginManager,
  MiddlewareManager,
  Plugin,
  PluginContext,
  Middleware,
} from '../../src/types'

describe('完整生命周期集成测试', () => {
  let events: EventManager
  let state: StateManager
  let lifecycle: LifecycleManager
  let plugins: PluginManager
  let middleware: MiddlewareManager
  let context: PluginContext
  let executionLog: string[]

  beforeEach(() => {
    executionLog = []
    events = createEventManager()
    state = createStateManager()
    lifecycle = createLifecycleManager()
    middleware = new CoreMiddlewareManager()

    context = {
      engine: {
        events,
        state,
        lifecycle,
        middleware,
      } as any,
      config: { debug: false },
    }

    plugins = createPluginManager(context)
  })

  describe('基础生命周期流程', () => {
    it('应该按正确顺序执行完整的生命周期', async () => {
      lifecycle.on('beforeInit', () => { executionLog.push('beforeInit') })
      lifecycle.on('init', () => { executionLog.push('init') })
      lifecycle.on('afterInit', () => { executionLog.push('afterInit') })
      lifecycle.on('beforeMount', () => { executionLog.push('beforeMount') })
      lifecycle.on('mounted', () => { executionLog.push('mounted') })
      lifecycle.on('beforeUnmount', () => { executionLog.push('beforeUnmount') })
      lifecycle.on('unmounted', () => { executionLog.push('unmounted') })

      await lifecycle.trigger('beforeInit')
      await lifecycle.trigger('init')
      await lifecycle.trigger('afterInit')
      await lifecycle.trigger('beforeMount')
      await lifecycle.trigger('mounted')
      await lifecycle.trigger('beforeUnmount')
      await lifecycle.trigger('unmounted')

      expect(executionLog).toEqual([
        'beforeInit',
        'init',
        'afterInit',
        'beforeMount',
        'mounted',
        'beforeUnmount',
        'unmounted',
      ])
    })

    it('应该在生命周期的各个阶段正确更新状态', async () => {
      lifecycle.on('beforeInit', () => state.set('phase', 'beforeInit'))
      lifecycle.on('init', () => {
        state.set('phase', 'init')
        state.set('initialized', true)
      })
      lifecycle.on('mounted', () => {
        state.set('phase', 'mounted')
        state.set('ready', true)
      })

      await lifecycle.trigger('beforeInit')
      expect(state.get('phase')).toBe('beforeInit')

      await lifecycle.trigger('init')
      expect(state.get('phase')).toBe('init')
      expect(state.get('initialized')).toBe(true)

      await lifecycle.trigger('mounted')
      expect(state.get('phase')).toBe('mounted')
      expect(state.get('ready')).toBe(true)
    })

    it('应该在生命周期的各个阶段触发事件', async () => {
      const eventLog: string[] = []

      events.on('lifecycle:init', () => { eventLog.push('event:init') })
      events.on('lifecycle:mounted', () => { eventLog.push('event:mounted') })

      lifecycle.on('init', () => events.emit('lifecycle:init'))
      lifecycle.on('mounted', () => events.emit('lifecycle:mounted'))

      await lifecycle.trigger('init')
      await lifecycle.trigger('mounted')

      expect(eventLog).toEqual(['event:init', 'event:mounted'])
    })
  })

  describe('插件生命周期集成', () => {
    it('应该在正确的生命周期阶段初始化插件', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        async install(ctx) {
          executionLog.push('plugin:install')
          ctx.engine.lifecycle.on('init', () => {
            executionLog.push('plugin:init')
            ctx.engine.state.set('plugin:ready', true)
          })
        },
      }

      await plugins.use(plugin)
      await lifecycle.trigger('init')

      expect(executionLog).toContain('plugin:install')
      expect(executionLog).toContain('plugin:init')
      expect(state.get('plugin:ready')).toBe(true)
    })

    it('应该正确处理插件的卸载生命周期', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        async install(ctx) {
          ctx.engine.state.set('plugin:active', true)
        },
        async uninstall(ctx) {
          executionLog.push('plugin:uninstall')
          ctx.engine.state.set('plugin:active', false)
        },
      }

      await plugins.use(plugin)
      expect(state.get('plugin:active')).toBe(true)

      await plugins.uninstall('test-plugin')
      expect(executionLog).toContain('plugin:uninstall')
      expect(state.get('plugin:active')).toBe(false)
    })

    it('应该协调多个插件的生命周期', async () => {
      const plugin1: Plugin = {
        name: 'plugin-1',
        version: '1.0.0',
        async install(ctx) {
          ctx.engine.lifecycle.on('init', () => {
            executionLog.push('plugin1:init')
            ctx.engine.state.set('plugin1:ready', true)
          })
        },
      }

      const plugin2: Plugin = {
        name: 'plugin-2',
        version: '1.0.0',
        dependencies: ['plugin-1'],
        async install(ctx) {
          ctx.engine.lifecycle.on('init', () => {
            executionLog.push('plugin2:init')
            ctx.engine.state.set('plugin2:ready', true)
          })
        },
      }

      await plugins.use(plugin1)
      await plugins.use(plugin2)
      await lifecycle.trigger('init')

      expect(executionLog).toContain('plugin1:init')
      expect(executionLog).toContain('plugin2:init')
      expect(state.get('plugin1:ready')).toBe(true)
      expect(state.get('plugin2:ready')).toBe(true)
    })
  })

  describe('中间件生命周期集成', () => {
    it('应该在生命周期钩子中执行中间件', async () => {
      const logMiddleware: Middleware = {
        name: 'log',
        priority: 100,
        async execute(ctx, next) {
          executionLog.push('middleware:before')
          await next()
          executionLog.push('middleware:after')
        },
      }

      middleware.use(logMiddleware)

      lifecycle.on('init', async () => {
        executionLog.push('lifecycle:start')
        await middleware.execute({ data: {}, metadata: {} })
        executionLog.push('lifecycle:end')
      })

      await lifecycle.trigger('init')

      expect(executionLog).toEqual([
        'lifecycle:start',
        'middleware:before',
        'middleware:after',
        'lifecycle:end',
      ])
    })

    it('应该在中间件中访问生命周期状态', async () => {
      const stateMiddleware: Middleware = {
        name: 'state',
        priority: 100,
        async execute(ctx, next) {
          const phase = state.get('phase')
          executionLog.push(`middleware:phase:${phase}`)
          await next()
        },
      }

      middleware.use(stateMiddleware)
      lifecycle.on('init', () => state.set('phase', 'init'))
      lifecycle.on('mounted', async () => {
        await middleware.execute({ data: {}, metadata: {} })
      })

      await lifecycle.trigger('init')
      await lifecycle.trigger('mounted')

      expect(executionLog).toContain('middleware:phase:init')
    })
  })

  describe('事件驱动的生命周期', () => {
    it('应该通过事件触发生命周期转换', async () => {
      events.on('app:init', async () => {
        await lifecycle.trigger('init')
        executionLog.push('lifecycle:init')
      })

      await events.emit('app:init')
      expect(executionLog).toContain('lifecycle:init')
    })

    it('应该在生命周期钩子中触发级联事件', async () => {
      const cascadeLog: string[] = []

      events.on('init:complete', () => {
        cascadeLog.push('init:complete')
        events.emit('load:data')
      })

      events.on('load:data', () => {
        cascadeLog.push('load:data')
      })

      lifecycle.on('init', () => events.emit('init:complete'))

      await lifecycle.trigger('init')

      expect(cascadeLog).toEqual(['init:complete', 'load:data'])
    })
  })

  describe('完整应用生命周期场景', () => {
    it('应该完整模拟应用从启动到销毁的流程', async () => {
      const lifecycleLog: string[] = []

      const appPlugin: Plugin = {
        name: 'app',
        version: '1.0.0',
        async install(ctx) {
          ctx.engine.lifecycle.on('init', () => {
            lifecycleLog.push('app:init')
            ctx.engine.state.set('app:status', 'initialized')
          })

          ctx.engine.lifecycle.on('mounted', () => {
            lifecycleLog.push('app:mounted')
            ctx.engine.state.set('app:status', 'ready')
          })

          ctx.engine.lifecycle.on('unmounted', () => {
            lifecycleLog.push('app:unmounted')
          })
        },
        async uninstall(ctx) {
          lifecycleLog.push('app:cleanup')
        },
      }

      await plugins.use(appPlugin)
      await lifecycle.trigger('init')
      await lifecycle.trigger('mounted')
      await lifecycle.trigger('unmounted')
      await plugins.uninstall('app')

      expect(lifecycleLog).toEqual([
        'app:init',
        'app:mounted',
        'app:unmounted',
        'app:cleanup',
      ])
    })

    it('应该处理生命周期中的错误并继续执行', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

      lifecycle.on('init', () => {
        executionLog.push('init:handler1')
        throw new Error('Init error')
      })

      lifecycle.on('init', () => {
        executionLog.push('init:handler2')
      })

      await lifecycle.trigger('init')

      expect(executionLog).toContain('init:handler1')
      expect(executionLog).toContain('init:handler2')
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })
  })
})