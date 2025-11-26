/**
 * PluginManager 单元测试
 * 
 * 测试覆盖:
 * - 插件注册和卸载
 * - 依赖检查
 * - 循环依赖检测
 * - 生命周期管理
 * - 热重载功能
 * - 错误处理
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CorePluginManager } from '../src/plugin/plugin-manager'
import type { Plugin, PluginContext } from '../src/types'

describe('PluginManager', () => {
  let pluginManager: CorePluginManager
  let mockContext: PluginContext

  beforeEach(() => {
    // 创建模拟上下文
    mockContext = {
      engine: {} as any,
      config: { debug: false },
      container: undefined,
    }

    pluginManager = new CorePluginManager(mockContext)
  })

  describe('基本功能', () => {
    it('应该成功注册插件', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: vi.fn(),
      }

      await pluginManager.use(plugin)

      expect(pluginManager.has('test-plugin')).toBe(true)
      expect(pluginManager.get('test-plugin')).toBe(plugin)
      expect(plugin.install).toHaveBeenCalledWith(mockContext, undefined)
    })

    it('应该支持插件选项', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        install: vi.fn(),
      }

      const options = { key: 'value' }
      await pluginManager.use(plugin, options)

      expect(plugin.install).toHaveBeenCalledWith(mockContext, options)
    })

    it('应该跳过已安装的插件', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        install: vi.fn(),
      }

      await pluginManager.use(plugin)
      await pluginManager.use(plugin) // 第二次安装

      expect(plugin.install).toHaveBeenCalledTimes(1)
    })

    it('应该返回所有插件', async () => {
      const plugin1: Plugin = {
        name: 'plugin-1',
        install: vi.fn(),
      }

      const plugin2: Plugin = {
        name: 'plugin-2',
        install: vi.fn(),
      }

      await pluginManager.use(plugin1)
      await pluginManager.use(plugin2)

      const allPlugins = pluginManager.getAll()
      expect(allPlugins).toHaveLength(2)
      expect(allPlugins).toContain(plugin1)
      expect(allPlugins).toContain(plugin2)
    })

    it('应该正确返回插件数量', async () => {
      expect(pluginManager.size()).toBe(0)

      await pluginManager.use({ name: 'plugin-1', install: vi.fn() })
      expect(pluginManager.size()).toBe(1)

      await pluginManager.use({ name: 'plugin-2', install: vi.fn() })
      expect(pluginManager.size()).toBe(2)
    })

    it('应该能清空所有插件', async () => {
      await pluginManager.use({ name: 'plugin-1', install: vi.fn() })
      await pluginManager.use({ name: 'plugin-2', install: vi.fn() })

      pluginManager.clear()

      expect(pluginManager.size()).toBe(0)
      expect(pluginManager.has('plugin-1')).toBe(false)
      expect(pluginManager.has('plugin-2')).toBe(false)
    })
  })

  describe('依赖管理', () => {
    it('应该检查并满足插件依赖', async () => {
      const basePlugin: Plugin = {
        name: 'base-plugin',
        install: vi.fn(),
      }

      const dependentPlugin: Plugin = {
        name: 'dependent-plugin',
        dependencies: ['base-plugin'],
        install: vi.fn(),
      }

      // 先安装基础插件
      await pluginManager.use(basePlugin)

      // 再安装依赖插件
      await pluginManager.use(dependentPlugin)

      expect(pluginManager.has('base-plugin')).toBe(true)
      expect(pluginManager.has('dependent-plugin')).toBe(true)
    })

    it('应该在缺少依赖时抛出错误', async () => {
      const dependentPlugin: Plugin = {
        name: 'dependent-plugin',
        dependencies: ['missing-plugin'],
        install: vi.fn(),
      }

      await expect(pluginManager.use(dependentPlugin)).rejects.toThrow(
        'requires the following dependencies: missing-plugin'
      )

      expect(pluginManager.has('dependent-plugin')).toBe(false)
    })

    it('应该检测循环依赖', async () => {
      // 创建第一个插件，在安装时会尝试安装自己，触发循环依赖检测
      const plugin: Plugin = {
        name: 'circular-plugin',
        install: async () => {
          // 在安装过程中尝试再次安装自己，这应该触发循环依赖检测
          await pluginManager.use(plugin)
        },
      }

      await expect(pluginManager.use(plugin)).rejects.toThrow(
        'Circular dependency detected'
      )
    })

    it('应该获取插件依赖树', async () => {
      const plugin1: Plugin = {
        name: 'plugin-1',
        install: vi.fn(),
      }

      const plugin2: Plugin = {
        name: 'plugin-2',
        dependencies: ['plugin-1'],
        install: vi.fn(),
      }

      const plugin3: Plugin = {
        name: 'plugin-3',
        dependencies: ['plugin-2'],
        install: vi.fn(),
      }

      await pluginManager.use(plugin1)
      await pluginManager.use(plugin2)
      await pluginManager.use(plugin3)

      const tree = pluginManager.getDependencyTree('plugin-3')

      expect(tree).toEqual({
        'plugin-3': ['plugin-2'],
        'plugin-2': ['plugin-1'],
        'plugin-1': [],
      })
    })
  })

  describe('插件卸载', () => {
    it('应该成功卸载插件', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        install: vi.fn(),
        uninstall: vi.fn(),
      }

      await pluginManager.use(plugin)
      const result = await pluginManager.uninstall('test-plugin')

      expect(result).toBe(true)
      expect(plugin.uninstall).toHaveBeenCalledWith(mockContext)
      expect(pluginManager.has('test-plugin')).toBe(false)
    })

    it('应该在插件不存在时返回 false', async () => {
      const result = await pluginManager.uninstall('non-existent-plugin')

      expect(result).toBe(false)
    })

    it('应该阻止卸载被依赖的插件', async () => {
      const basePlugin: Plugin = {
        name: 'base-plugin',
        install: vi.fn(),
      }

      const dependentPlugin: Plugin = {
        name: 'dependent-plugin',
        dependencies: ['base-plugin'],
        install: vi.fn(),
      }

      await pluginManager.use(basePlugin)
      await pluginManager.use(dependentPlugin)

      await expect(pluginManager.uninstall('base-plugin')).rejects.toThrow(
        'It is required by: dependent-plugin'
      )

      expect(pluginManager.has('base-plugin')).toBe(true)
    })

    it('应该支持强制卸载', async () => {
      const basePlugin: Plugin = {
        name: 'base-plugin',
        install: vi.fn(),
        uninstall: vi.fn(),
      }

      const dependentPlugin: Plugin = {
        name: 'dependent-plugin',
        dependencies: ['base-plugin'],
        install: vi.fn(),
      }

      await pluginManager.use(basePlugin)
      await pluginManager.use(dependentPlugin)

      const result = await pluginManager.uninstall('base-plugin', true) // 强制卸载

      expect(result).toBe(true)
      expect(pluginManager.has('base-plugin')).toBe(false)
      expect(pluginManager.has('dependent-plugin')).toBe(true) // 依赖插件仍存在
    })

    it('应该在卸载失败时抛出错误', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        install: vi.fn(),
        uninstall: vi.fn(() => {
          throw new Error('Uninstall failed')
        }),
      }

      await pluginManager.use(plugin)

      await expect(pluginManager.uninstall('test-plugin')).rejects.toThrow('Uninstall failed')
    })
  })

  describe('热重载功能', () => {
    it('应该支持插件热重载', async () => {
      const oldPlugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: vi.fn(),
        uninstall: vi.fn(),
      }

      const newPlugin: Plugin = {
        name: 'test-plugin',
        version: '2.0.0',
        install: vi.fn(),
        uninstall: vi.fn(),
      }

      const options = { key: 'value' }

      // 安装旧版本
      await pluginManager.use(oldPlugin, options)

      // 热重载到新版本
      const result = await pluginManager.hotReload('test-plugin', newPlugin)

      expect(result).toBe(true)
      expect(oldPlugin.uninstall).toHaveBeenCalledWith(mockContext)
      expect(newPlugin.install).toHaveBeenCalledWith(mockContext, options)
      expect(pluginManager.get('test-plugin')).toBe(newPlugin)
    })

    it('应该在插件不存在时作为新插件安装', async () => {
      const plugin: Plugin = {
        name: 'new-plugin',
        install: vi.fn(),
      }

      const result = await pluginManager.hotReload('new-plugin', plugin)

      expect(result).toBe(true)
      expect(plugin.install).toHaveBeenCalled()
      expect(pluginManager.has('new-plugin')).toBe(true)
    })

    it('应该触发热重载监听器', async () => {
      const oldPlugin: Plugin = {
        name: 'test-plugin',
        install: vi.fn(),
        uninstall: vi.fn(),
      }

      const newPlugin: Plugin = {
        name: 'test-plugin',
        install: vi.fn(),
        uninstall: vi.fn(),
      }

      const listener = vi.fn()

      await pluginManager.use(oldPlugin)
      pluginManager.onHotReload('test-plugin', listener)

      await pluginManager.hotReload('test-plugin', newPlugin)

      expect(listener).toHaveBeenCalled()
    })

    it('应该支持取消热重载监听', async () => {
      const listener = vi.fn()
      const unsubscribe = pluginManager.onHotReload('test-plugin', listener)

      unsubscribe()

      const oldPlugin: Plugin = {
        name: 'test-plugin',
        install: vi.fn(),
        uninstall: vi.fn(),
      }

      const newPlugin: Plugin = {
        name: 'test-plugin',
        install: vi.fn(),
        uninstall: vi.fn(),
      }

      await pluginManager.use(oldPlugin)
      await pluginManager.hotReload('test-plugin', newPlugin)

      expect(listener).not.toHaveBeenCalled()
    })

    it('应该检查插件是否支持热重载', async () => {
      const hotReloadablePlugin: Plugin = {
        name: 'hot-plugin',
        install: vi.fn(),
        uninstall: vi.fn(),
      }

      const nonHotReloadablePlugin: Plugin = {
        name: 'non-hot-plugin',
        install: vi.fn(),
      }

      await pluginManager.use(hotReloadablePlugin)
      await pluginManager.use(nonHotReloadablePlugin)

      expect(pluginManager.isHotReloadable('hot-plugin')).toBe(true)
      expect(pluginManager.isHotReloadable('non-hot-plugin')).toBe(false)
      expect(pluginManager.isHotReloadable('non-existent')).toBe(false)
    })

    it('应该在热重载失败时回滚', async () => {
      const oldPlugin: Plugin = {
        name: 'test-plugin',
        install: vi.fn(),
        uninstall: vi.fn(),
      }

      const newPlugin: Plugin = {
        name: 'test-plugin',
        install: vi.fn(() => {
          throw new Error('Installation failed')
        }),
        uninstall: vi.fn(),
      }

      await pluginManager.use(oldPlugin)

      await expect(pluginManager.hotReload('test-plugin', newPlugin)).rejects.toThrow(
        'Installation failed'
      )

      // 应该尝试回滚到旧版本
      expect(oldPlugin.install).toHaveBeenCalledTimes(2) // 初始安装 + 回滚
    })
  })

  describe('错误处理', () => {
    it('应该捕获并抛出插件安装错误', async () => {
      const plugin: Plugin = {
        name: 'error-plugin',
        install: vi.fn(() => {
          throw new Error('Installation error')
        }),
      }

      await expect(pluginManager.use(plugin)).rejects.toThrow('Installation error')

      expect(pluginManager.has('error-plugin')).toBe(false)
    })

    it('应该在安装失败后清理状态', async () => {
      const plugin: Plugin = {
        name: 'failing-plugin',
        install: vi.fn(() => {
          throw new Error('Install failed')
        }),
      }

      await expect(pluginManager.use(plugin)).rejects.toThrow()

      // 再次尝试安装应该不会因为循环依赖检测而失败
      await expect(pluginManager.use(plugin)).rejects.toThrow('Install failed')
    })

    it('应该处理异步插件安装错误', async () => {
      const plugin: Plugin = {
        name: 'async-error-plugin',
        install: vi.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, 10))
          throw new Error('Async installation error')
        }),
      }

      await expect(pluginManager.use(plugin)).rejects.toThrow('Async installation error')
    })
  })

  describe('自定义上下文', () => {
    it('应该支持自定义插件上下文', async () => {
      const plugin: Plugin = {
        name: 'custom-context-plugin',
        install: vi.fn(),
      }

      const customContext: Partial<PluginContext> = {
        config: { debug: true, customProperty: 'custom-value' },
      }

      await pluginManager.use(plugin, undefined, customContext)

      expect(plugin.install).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockContext,
          config: expect.objectContaining({
            debug: true,
            customProperty: 'custom-value',
          }),
        }),
        undefined
      )
    })
  })

  describe('调试模式', () => {
    it('应该在调试模式下输出日志', async () => {
      const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => { })
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => { })

      mockContext.config = { debug: true }
      const debugPluginManager = new CorePluginManager(mockContext)

      const plugin: Plugin = {
        name: 'debug-plugin',
        version: '1.0.0',
        install: vi.fn(),
      }

      await debugPluginManager.use(plugin)

      expect(consoleLog).toHaveBeenCalledWith(
        expect.stringContaining('debug-plugin')
      )

      // 尝试重复安装
      await debugPluginManager.use(plugin)

      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('already installed')
      )

      consoleLog.mockRestore()
      consoleWarn.mockRestore()
    })
  })
})