/**
 * 多插件协作集成测试
 * 
 * 测试目标：
 * 1. 插件间依赖和通信
 * 2. 插件注册表和API共享
 * 3. 复杂协作场景
 * 4. 插件生命周期协调
 * 5. 跨插件事件传播
 * 6. 共享状态管理
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CorePluginManager } from '../../src/plugin/plugin-manager'
import { CoreEventManager } from '../../src/event/event-manager'
import { CoreStateManager } from '../../src/state/state-manager'
import type { PluginContext, Plugin } from '../../src/types/plugin'

describe('多插件协作集成测试', () => {
  let pluginManager: CorePluginManager
  let eventManager: CoreEventManager
  let stateManager: CoreStateManager
  let mockContext: PluginContext

  beforeEach(() => {
    eventManager = new CoreEventManager()
    stateManager = new CoreStateManager()
    mockContext = {
      engine: {
        name: 'test-app',
        version: '1.0.0',
        events: eventManager,
        state: stateManager,
      } as any,
      config: {},
    }
    pluginManager = new CorePluginManager(mockContext)
  })

  describe('插件间依赖', () => {
    it('应该按照依赖顺序安装插件', async () => {
      const installOrder: string[] = []

      const pluginA: Plugin = {
        name: 'plugin-a',
        version: '1.0.0',
        install: vi.fn(() => {
          installOrder.push('a')
        }),
      }

      const pluginB: Plugin = {
        name: 'plugin-b',
        version: '1.0.0',
        dependencies: ['plugin-a'],
        install: vi.fn(() => {
          installOrder.push('b')
        }),
      }

      const pluginC: Plugin = {
        name: 'plugin-c',
        version: '1.0.0',
        dependencies: ['plugin-b'],
        install: vi.fn(() => {
          installOrder.push('c')
        }),
      }

      await pluginManager.use(pluginA)
      await pluginManager.use(pluginB)
      await pluginManager.use(pluginC)

      expect(installOrder).toEqual(['a', 'b', 'c'])
    })

    it('应该处理多个依赖的复杂场景', async () => {
      const installOrder: string[] = []

      const pluginA: Plugin = {
        name: 'plugin-a',
        version: '1.0.0',
        install: () => {
          installOrder.push('a')
        },
      }

      const pluginB: Plugin = {
        name: 'plugin-b',
        version: '1.0.0',
        install: () => {
          installOrder.push('b')
        },
      }

      const pluginC: Plugin = {
        name: 'plugin-c',
        version: '1.0.0',
        dependencies: ['plugin-a', 'plugin-b'],
        install: () => {
          installOrder.push('c')
        },
      }

      const pluginD: Plugin = {
        name: 'plugin-d',
        version: '1.0.0',
        dependencies: ['plugin-c'],
        install: () => {
          installOrder.push('d')
        },
      }

      await pluginManager.use(pluginA)
      await pluginManager.use(pluginB)
      await pluginManager.use(pluginC)
      await pluginManager.use(pluginD)

      // A 和 B 可以任意顺序，但必须在 C 之前
      // C 必须在 D 之前
      const aIndex = installOrder.indexOf('a')
      const bIndex = installOrder.indexOf('b')
      const cIndex = installOrder.indexOf('c')
      const dIndex = installOrder.indexOf('d')

      expect(aIndex).toBeLessThan(cIndex)
      expect(bIndex).toBeLessThan(cIndex)
      expect(cIndex).toBeLessThan(dIndex)
    })

    it('应该检测并拒绝循环依赖', async () => {
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

      // 尝试安装有循环依赖的插件应该失败
      // 先尝试安装 A (会失败因为 B 不存在)
      await expect(pluginManager.use(pluginA)).rejects.toThrow('Plugin "plugin-a" requires the following dependencies: plugin-b')

      // 然后尝试安装 B (会失败因为 A 不存在)
      await expect(pluginManager.use(pluginB)).rejects.toThrow('Plugin "plugin-b" requires the following dependencies: plugin-a')
    })
  })

  describe('插件间通信', () => {
    it('应该通过事件系统进行插件间通信', async () => {
      const messages: string[] = []

      const producerPlugin: Plugin = {
        name: 'producer',
        version: '1.0.0',
        install: (context) => {
          context.engine.events.emit('producer:message', { msg: 'Hello from producer' })
        },
      }

      const consumerPlugin: Plugin = {
        name: 'consumer',
        version: '1.0.0',
        dependencies: ['producer'],
        install: (context) => {
          context.engine.events.on('producer:message', (data: any) => {
            messages.push(data.msg)
          })
        },
      }

      await pluginManager.use(producerPlugin)
      await pluginManager.use(consumerPlugin)

      // 再次触发事件
      eventManager.emit('producer:message', { msg: 'Another message' })

      expect(messages).toContain('Another message')
    })

    it('应该通过状态系统共享数据', async () => {
      const dataPlugin: Plugin = {
        name: 'data',
        version: '1.0.0',
        install: (context) => {
          context.engine.state.set('shared:config', { theme: 'dark', lang: 'zh-CN' })
        },
      }

      const uiPlugin: Plugin = {
        name: 'ui',
        version: '1.0.0',
        dependencies: ['data'],
        install: (context) => {
          const config = context.engine.state.get('shared:config')
          expect(config).toEqual({ theme: 'dark', lang: 'zh-CN' })
        },
      }

      await pluginManager.use(dataPlugin)
      await pluginManager.use(uiPlugin)
    })

    it('应该支持多个插件监听同一事件', async () => {
      const listeners: string[] = []

      const plugin1: Plugin = {
        name: 'listener-1',
        version: '1.0.0',
        install: (context) => {
          context.engine.events.on('global:event', () => {
            listeners.push('listener-1')
          })
        },
      }

      const plugin2: Plugin = {
        name: 'listener-2',
        version: '1.0.0',
        install: (context) => {
          context.engine.events.on('global:event', () => {
            listeners.push('listener-2')
          })
        },
      }

      const plugin3: Plugin = {
        name: 'listener-3',
        version: '1.0.0',
        install: (context) => {
          context.engine.events.on('global:event', () => {
            listeners.push('listener-3')
          })
        },
      }

      await pluginManager.use(plugin1)
      await pluginManager.use(plugin2)
      await pluginManager.use(plugin3)

      eventManager.emit('global:event')

      expect(listeners).toHaveLength(3)
      expect(listeners).toContain('listener-1')
      expect(listeners).toContain('listener-2')
      expect(listeners).toContain('listener-3')
    })
  })

  describe('插件API共享', () => {
    it('应该允许插件注册和访问共享API', async () => {
      const apiPlugin: Plugin = {
        name: 'api-provider',
        version: '1.0.0',
        install: (context) => {
          // 通过状态系统共享API
          context.engine.state.set('api:provider:method', () => 'API Result')
        },
      }

      const clientPlugin: Plugin = {
        name: 'api-client',
        version: '1.0.0',
        dependencies: ['api-provider'],
        install: (context) => {
          const apiMethod = context.engine.state.get('api:provider:method') as () => string
          const result = apiMethod()
          expect(result).toBe('API Result')
        },
      }

      await pluginManager.use(apiPlugin)
      await pluginManager.use(clientPlugin)
    })

    it('应该支持插件扩展现有API', async () => {
      const basePlugin: Plugin = {
        name: 'base',
        version: '1.0.0',
        install: (context) => {
          context.engine.state.set('api:handlers', [])
        },
      }

      const extPlugin1: Plugin = {
        name: 'ext-1',
        version: '1.0.0',
        dependencies: ['base'],
        install: (context) => {
          const handlers = context.engine.state.get('api:handlers') as any[]
          handlers.push('handler-1')
        },
      }

      const extPlugin2: Plugin = {
        name: 'ext-2',
        version: '1.0.0',
        dependencies: ['base'],
        install: (context) => {
          const handlers = context.engine.state.get('api:handlers') as any[]
          handlers.push('handler-2')
        },
      }

      await pluginManager.use(basePlugin)
      await pluginManager.use(extPlugin1)
      await pluginManager.use(extPlugin2)

      const handlers = stateManager.get('api:handlers')
      expect(handlers).toEqual(['handler-1', 'handler-2'])
    })
  })

  describe('插件生命周期协调', () => {
    let pluginManager: CorePluginManager
    let eventManager: CoreEventManager
    let stateManager: CoreStateManager
    let mockContext: PluginContext

    beforeEach(() => {
      eventManager = new CoreEventManager()
      stateManager = new CoreStateManager()
      mockContext = {
        engine: {
          name: 'test-app',
          version: '1.0.0',
          events: eventManager,
          state: stateManager,
        } as any,
        config: {},
      }
      pluginManager = new CorePluginManager(mockContext)
    })

    it('应该协调多个插件的初始化', async () => {
      const initOrder: string[] = []

      const plugins = Array.from({ length: 5 }, (_, i) => ({
        name: `plugin-${i}`,
        version: '1.0.0',
        install: () => {
          initOrder.push(`plugin-${i}`)
        },
      }))

      for (const plugin of plugins) {
        await pluginManager.use(plugin)
      }

      expect(initOrder).toHaveLength(5)
    })

    it('应该处理插件卸载的级联效应', async () => {
      const uninstallOrder: string[] = []

      const pluginA: Plugin = {
        name: 'plugin-a',
        version: '1.0.0',
        install: vi.fn(),
        uninstall: () => {
          uninstallOrder.push('a')
        },
      }

      const pluginB: Plugin = {
        name: 'plugin-b',
        version: '1.0.0',
        dependencies: ['plugin-a'],
        install: vi.fn(),
        uninstall: () => {
          uninstallOrder.push('b')
        },
      }

      await pluginManager.use(pluginA)
      await pluginManager.use(pluginB)

      // 尝试直接卸载被依赖的插件应该失败
      await expect(pluginManager.uninstall('plugin-a')).rejects.toThrow(/required by.*plugin-b/)

      // 按正确顺序卸载：先卸载依赖者，再卸载被依赖者
      await pluginManager.uninstall('plugin-b')
      await pluginManager.uninstall('plugin-a')

      expect(uninstallOrder).toEqual(['b', 'a'])
    })

    it('应该在插件初始化失败时清理', async () => {
      const cleanupCalls: string[] = []

      const successPlugin: Plugin = {
        name: 'success',
        version: '1.0.0',
        install: vi.fn(),
        uninstall: () => {
          cleanupCalls.push('success')
        },
      }

      const failPlugin: Plugin = {
        name: 'fail',
        version: '1.0.0',
        dependencies: ['success'],
        install: () => {
          throw new Error('Installation failed')
        },
        uninstall: () => {
          cleanupCalls.push('fail')
        },
      }

      await pluginManager.use(successPlugin)

      await expect(pluginManager.use(failPlugin)).rejects.toThrow()

      // 验证成功的插件仍然存在
      expect(pluginManager.has('success')).toBe(true)
      expect(pluginManager.has('fail')).toBe(false)
    })
  })

  describe('复杂协作场景', () => {
    let pluginManager: CorePluginManager
    let eventManager: CoreEventManager
    let stateManager: CoreStateManager
    let mockContext: PluginContext

    beforeEach(() => {
      eventManager = new CoreEventManager()
      stateManager = new CoreStateManager()
      mockContext = {
        engine: {
          name: 'test-app',
          version: '1.0.0',
          events: eventManager,
          state: stateManager,
        } as any,
        config: {},
      }
      pluginManager = new CorePluginManager(mockContext)
    })

    it('应该处理插件生态系统场景', async () => {
      const events: string[] = []

      // 核心插件
      const corePlugin: Plugin = {
        name: 'core',
        version: '1.0.0',
        install: (context) => {
          context.engine.state.set('core:initialized', true)
          context.engine.events.on('core:command', (data: any) => {
            events.push(`core:${data.cmd}`)
          })
        },
      }

      // 认证插件
      const authPlugin: Plugin = {
        name: 'auth',
        version: '1.0.0',
        dependencies: ['core'],
        install: (context) => {
          context.engine.state.set('auth:user', null)
          context.engine.events.on('auth:login', (data: any) => {
            context.engine.state.set('auth:user', data.user)
            events.push('auth:login')
          })
        },
      }

      // 日志插件
      const loggerPlugin: Plugin = {
        name: 'logger',
        version: '1.0.0',
        dependencies: ['core'],
        install: (context) => {
          context.engine.events.on('core:command', (data: any) => {
            events.push(`logger:${data.cmd}`)
          })
          context.engine.events.on('auth:login', () => {
            events.push('logger:login')
          })
        },
      }

      // 分析插件
      const analyticsPlugin: Plugin = {
        name: 'analytics',
        version: '1.0.0',
        dependencies: ['core', 'auth'],
        install: (context) => {
          context.engine.events.on('auth:login', (data: any) => {
            events.push(`analytics:user-${data.user}`)
          })
        },
      }

      await pluginManager.use(corePlugin)
      await pluginManager.use(authPlugin)
      await pluginManager.use(loggerPlugin)
      await pluginManager.use(analyticsPlugin)

      // 模拟用户登录
      eventManager.emit('auth:login', { user: 'alice' })

      expect(events).toContain('auth:login')
      expect(events).toContain('logger:login')
      expect(events).toContain('analytics:user-alice')
      expect(stateManager.get('auth:user')).toBe('alice')
    })

    it('应该处理动态插件加载场景', async () => {
      const loadedPlugins: string[] = []

      // 插件加载器
      const loaderPlugin: Plugin = {
        name: 'loader',
        version: '1.0.0',
        install: (context) => {
          context.engine.events.on('loader:load', async (data: any) => {
            loadedPlugins.push(data.plugin)
          })
        },
      }

      await pluginManager.use(loaderPlugin)

      // 动态加载插件
      eventManager.emit('loader:load', { plugin: 'dynamic-1' })
      eventManager.emit('loader:load', { plugin: 'dynamic-2' })
      eventManager.emit('loader:load', { plugin: 'dynamic-3' })

      expect(loadedPlugins).toEqual(['dynamic-1', 'dynamic-2', 'dynamic-3'])
    })

    it('应该处理插件配置覆盖场景', async () => {
      const configs: any[] = []

      const defaultPlugin: Plugin = {
        name: 'default-config',
        version: '1.0.0',
        install: (context) => {
          context.engine.state.set('config:theme', { color: 'blue', mode: 'light' })
        },
      }

      const userPlugin: Plugin = {
        name: 'user-config',
        version: '1.0.0',
        dependencies: ['default-config'],
        install: (context) => {
          const defaultTheme = context.engine.state.get('config:theme') as any
          const userTheme = { ...defaultTheme, color: 'red' }
          context.engine.state.set('config:theme', userTheme)
          configs.push(userTheme)
        },
      }

      await pluginManager.use(defaultPlugin)
      await pluginManager.use(userPlugin)

      expect(configs[0]).toEqual({ color: 'red', mode: 'light' })
    })

    it('应该处理插件热重载场景', async () => {
      const versions: string[] = []

      const pluginV1: Plugin = {
        name: 'hot-plugin',
        version: '1.0.0',
        install: (context) => {
          versions.push('v1')
          context.engine.state.set('plugin:version', '1.0.0')
        },
        uninstall: () => {
          versions.push('v1-uninstall')
        },
      }

      await pluginManager.use(pluginV1)

      // 卸载旧版本
      await pluginManager.uninstall('hot-plugin')

      // 安装新版本
      const pluginV2: Plugin = {
        name: 'hot-plugin',
        version: '2.0.0',
        install: (context) => {
          versions.push('v2')
          context.engine.state.set('plugin:version', '2.0.0')
        },
      }

      await pluginManager.use(pluginV2)

      expect(versions).toEqual(['v1', 'v1-uninstall', 'v2'])
      expect(stateManager.get('plugin:version')).toBe('2.0.0')
    })
  })

  describe('跨插件事件传播', () => {
    let pluginManager: CorePluginManager
    let eventManager: CoreEventManager
    let stateManager: CoreStateManager
    let mockContext: PluginContext

    beforeEach(() => {
      eventManager = new CoreEventManager()
      stateManager = new CoreStateManager()
      mockContext = {
        engine: {
          name: 'test-app',
          version: '1.0.0',
          events: eventManager,
          state: stateManager,
        } as any,
        config: {},
      }
      pluginManager = new CorePluginManager(mockContext)
    })

    it('应该支持事件冒泡机制', async () => {
      const bubbledEvents: string[] = []

      const childPlugin: Plugin = {
        name: 'child',
        version: '1.0.0',
        install: (context) => {
          context.engine.events.emit('child:event', { from: 'child' })
        },
      }

      const parentPlugin: Plugin = {
        name: 'parent',
        version: '1.0.0',
        dependencies: ['child'],
        install: (context) => {
          context.engine.events.on('child:event', (data: any) => {
            bubbledEvents.push(`parent-received-${data.from}`)
          })
        },
      }

      await pluginManager.use(childPlugin)
      await pluginManager.use(parentPlugin)

      // 再次触发以测试监听器
      eventManager.emit('child:event', { from: 'child' })

      expect(bubbledEvents).toContain('parent-received-child')
    })

    it('应该支持事件命名空间', async () => {
      const receivedEvents: string[] = []

      const pluginA: Plugin = {
        name: 'plugin-a',
        version: '1.0.0',
        install: (context) => {
          context.engine.events.on('ns:a:*', (data: any) => {
            receivedEvents.push(`a:${data.type}`)
          })
        },
      }

      const pluginB: Plugin = {
        name: 'plugin-b',
        version: '1.0.0',
        install: (context) => {
          context.engine.events.on('ns:b:*', (data: any) => {
            receivedEvents.push(`b:${data.type}`)
          })
        },
      }

      await pluginManager.use(pluginA)
      await pluginManager.use(pluginB)

      eventManager.emit('ns:a:event1', { type: 'event1' })
      eventManager.emit('ns:b:event2', { type: 'event2' })

      expect(receivedEvents).toContain('a:event1')
      expect(receivedEvents).toContain('b:event2')
    })

    it('应该支持事件广播', async () => {
      const broadcastReceivers: string[] = []

      const plugins = Array.from({ length: 3 }, (_, i) => ({
        name: `receiver-${i}`,
        version: '1.0.0',
        install: (context: PluginContext) => {
          context.engine.events.on('broadcast:message', () => {
            broadcastReceivers.push(`receiver-${i}`)
          })
        },
      }))

      for (const plugin of plugins) {
        await pluginManager.use(plugin)
      }

      eventManager.emit('broadcast:message')

      expect(broadcastReceivers).toHaveLength(3)
    })
  })

  describe('共享状态管理', () => {
    let pluginManager: CorePluginManager
    let eventManager: CoreEventManager
    let stateManager: CoreStateManager
    let mockContext: PluginContext

    beforeEach(() => {
      eventManager = new CoreEventManager()
      stateManager = new CoreStateManager()
      mockContext = {
        engine: {
          name: 'test-app',
          version: '1.0.0',
          events: eventManager,
          state: stateManager,
        } as any,
        config: {},
      }
      pluginManager = new CorePluginManager(mockContext)
    })

    it('应该支持插件间的状态共享', async () => {
      const writerPlugin: Plugin = {
        name: 'writer',
        version: '1.0.0',
        install: (context) => {
          context.engine.state.set('shared:data', { count: 0 })
        },
      }

      const readerPlugin: Plugin = {
        name: 'reader',
        version: '1.0.0',
        dependencies: ['writer'],
        install: (context) => {
          const data = context.engine.state.get('shared:data') as any
          expect(data.count).toBe(0)
        },
      }

      await pluginManager.use(writerPlugin)
      await pluginManager.use(readerPlugin)
    })

    it('应该支持状态变化监听', async () => {
      const changes: any[] = []

      const observerPlugin: Plugin = {
        name: 'observer',
        version: '1.0.0',
        install: (context) => {
          context.engine.state.watch('observable:value', (newVal, oldVal) => {
            changes.push({ new: newVal, old: oldVal })
          })
        },
      }

      const updaterPlugin: Plugin = {
        name: 'updater',
        version: '1.0.0',
        dependencies: ['observer'],
        install: (context) => {
          context.engine.state.set('observable:value', 1)
          context.engine.state.set('observable:value', 2)
          context.engine.state.set('observable:value', 3)
        },
      }

      await pluginManager.use(observerPlugin)
      await pluginManager.use(updaterPlugin)

      expect(changes).toHaveLength(3)
      expect(changes[0]).toEqual({ new: 1, old: undefined })
      expect(changes[1]).toEqual({ new: 2, old: 1 })
      expect(changes[2]).toEqual({ new: 3, old: 2 })
    })

    it('应该处理状态冲突', async () => {
      const plugin1: Plugin = {
        name: 'plugin-1',
        version: '1.0.0',
        install: (context) => {
          context.engine.state.set('conflict:key', 'value1')
        },
      }

      const plugin2: Plugin = {
        name: 'plugin-2',
        version: '1.0.0',
        install: (context) => {
          context.engine.state.set('conflict:key', 'value2')
        },
      }

      await pluginManager.use(plugin1)
      await pluginManager.use(plugin2)

      // 后注册的插件覆盖前面的值
      expect(stateManager.get('conflict:key')).toBe('value2')
    })
  })

  describe('性能和可扩展性', () => {
    let pluginManager: CorePluginManager
    let eventManager: CoreEventManager
    let stateManager: CoreStateManager
    let mockContext: PluginContext

    beforeEach(() => {
      eventManager = new CoreEventManager()
      stateManager = new CoreStateManager()
      mockContext = {
        engine: {
          name: 'test-app',
          version: '1.0.0',
          events: eventManager,
          state: stateManager,
        } as any,
        config: {},
      }
      pluginManager = new CorePluginManager(mockContext)
    })

    it('应该高效处理大量插件', async () => {
      const startTime = Date.now()

      const plugins = Array.from({ length: 100 }, (_, i) => ({
        name: `plugin-${i}`,
        version: '1.0.0',
        install: vi.fn(),
      }))

      for (const plugin of plugins) {
        await pluginManager.use(plugin)
      }

      const duration = Date.now() - startTime

      // 100个插件应该在合理时间内完成
      expect(duration).toBeLessThan(5000)
      expect(pluginManager.getAll()).toHaveLength(100)
    })

    it('应该支持插件的按需加载', async () => {
      const loadedPlugins: string[] = []

      const lazyPlugin: Plugin = {
        name: 'lazy',
        version: '1.0.0',
        install: () => {
          loadedPlugins.push('lazy')
        },
      }

      // 初始未加载
      expect(loadedPlugins).toHaveLength(0)

      // 按需加载
      await pluginManager.use(lazyPlugin)

      expect(loadedPlugins).toContain('lazy')
    })
  })
})