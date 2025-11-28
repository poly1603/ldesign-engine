/**
 * 插件热重载竞态条件修复测试
 * 
 * 测试并发热重载被拒绝
 * 测试热重载失败时恢复旧插件
 * 测试热重载成功后状态一致性
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPluginManager } from '../src/plugin/plugin-manager'
import type { Plugin, PluginContext, PluginManager } from '../src/types'

describe('插件热重载竞态条件修复测试', () => {
  let pluginManager: PluginManager
  let context: PluginContext

  beforeEach(() => {
    context = {
      engine: {} as any,
      config: { debug: false },
    }
    pluginManager = createPluginManager(context)
  })

  describe('并发热重载保护', () => {
    it('应该拒绝并发热重载同一插件', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: vi.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, 50))
        }),
        uninstall: vi.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, 50))
        }),
      }

      const newPlugin: Plugin = {
        name: 'test-plugin',
        version: '2.0.0',
        install: vi.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, 50))
        }),
        uninstall: vi.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, 50))
        }),
      }

      // 安装初始插件
      await pluginManager.use(plugin)

      // 同时发起两次热重载
      const reload1 = pluginManager.hotReload('test-plugin', newPlugin)
      const reload2 = pluginManager.hotReload('test-plugin', newPlugin)

      // 第二次应该失败
      await expect(reload1).resolves.toBe(true)
      await expect(reload2).rejects.toThrow('is already being reloaded')
    })

    it('应该允许热重载完成后再次热重载', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: vi.fn(),
        uninstall: vi.fn(),
      }

      const newPlugin1: Plugin = {
        name: 'test-plugin',
        version: '2.0.0',
        install: vi.fn(),
        uninstall: vi.fn(),
      }

      const newPlugin2: Plugin = {
        name: 'test-plugin',
        version: '3.0.0',
        install: vi.fn(),
        uninstall: vi.fn(),
      }

      await pluginManager.use(plugin)

      // 第一次热重载
      await expect(
        pluginManager.hotReload('test-plugin', newPlugin1)
      ).resolves.toBe(true)

      // 第二次热重载（在第一次完成后）
      await expect(
        pluginManager.hotReload('test-plugin', newPlugin2)
      ).resolves.toBe(true)

      // 验证最终版本
      const currentPlugin = pluginManager.get('test-plugin')
      expect(currentPlugin?.version).toBe('3.0.0')
    })

    it('热重载失败后应该清除锁定状态', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: vi.fn(),
        uninstall: vi.fn(),
      }

      const failingPlugin: Plugin = {
        name: 'test-plugin',
        version: '2.0.0',
        install: vi.fn(async () => {
          throw new Error('Installation failed')
        }),
        uninstall: vi.fn(),
      }

      const successPlugin: Plugin = {
        name: 'test-plugin',
        version: '3.0.0',
        install: vi.fn(),
        uninstall: vi.fn(),
      }

      await pluginManager.use(plugin)

      // 热重载失败
      await expect(
        pluginManager.hotReload('test-plugin', failingPlugin)
      ).rejects.toThrow()

      // 应该能够再次尝试热重载
      await expect(
        pluginManager.hotReload('test-plugin', successPlugin)
      ).resolves.toBe(true)
    })
  })

  describe('热重载失败恢复', () => {
    it('安装失败时应该恢复旧插件', async () => {
      const oldPlugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: vi.fn(),
        uninstall: vi.fn(),
      }

      const newPlugin: Plugin = {
        name: 'test-plugin',
        version: '2.0.0',
        install: vi.fn(async () => {
          throw new Error('New plugin installation failed')
        }),
        uninstall: vi.fn(),
      }

      await pluginManager.use(oldPlugin)

      // 热重载失败
      await expect(
        pluginManager.hotReload('test-plugin', newPlugin)
      ).rejects.toThrow('New plugin installation failed')

      // 应该恢复到旧插件
      const currentPlugin = pluginManager.get('test-plugin')
      expect(currentPlugin).toBe(oldPlugin)
      expect(currentPlugin?.version).toBe('1.0.0')
    })

    it('卸载失败时应该保持旧插件不变', async () => {
      const oldPlugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: vi.fn(),
        uninstall: vi.fn(async () => {
          throw new Error('Uninstall failed')
        }),
      }

      const newPlugin: Plugin = {
        name: 'test-plugin',
        version: '2.0.0',
        install: vi.fn(),
        uninstall: vi.fn(),
      }

      await pluginManager.use(oldPlugin)

      // 热重载失败
      await expect(
        pluginManager.hotReload('test-plugin', newPlugin)
      ).rejects.toThrow('Uninstall failed')

      // 应该保持旧插件
      const currentPlugin = pluginManager.get('test-plugin')
      expect(currentPlugin).toBe(oldPlugin)
      expect(currentPlugin?.version).toBe('1.0.0')
    })

    it('失败回滚时应该重新安装旧插件', async () => {
      const oldPlugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: vi.fn(),
        uninstall: vi.fn(),
      }

      const newPlugin: Plugin = {
        name: 'test-plugin',
        version: '2.0.0',
        install: vi.fn(async () => {
          throw new Error('Install failed')
        }),
        uninstall: vi.fn(),
      }

      await pluginManager.use(oldPlugin)
      const installCallsBefore = (oldPlugin.install as any).mock.calls.length

      // 热重载失败
      await expect(
        pluginManager.hotReload('test-plugin', newPlugin)
      ).rejects.toThrow()

      // 应该尝试重新安装旧插件
      const installCallsAfter = (oldPlugin.install as any).mock.calls.length
      expect(installCallsAfter).toBeGreaterThan(installCallsBefore)
    })

    it('回滚失败时应该记录错误但保持插件引用', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

      const oldPlugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: vi.fn()
          .mockResolvedValueOnce(undefined) // 初始安装成功
          .mockRejectedValueOnce(new Error('Rollback install failed')), // 回滚安装失败
        uninstall: vi.fn(),
      }

      const newPlugin: Plugin = {
        name: 'test-plugin',
        version: '2.0.0',
        install: vi.fn(async () => {
          throw new Error('New plugin install failed')
        }),
        uninstall: vi.fn(),
      }

      await pluginManager.use(oldPlugin)

      // 热重载失败
      await expect(
        pluginManager.hotReload('test-plugin', newPlugin)
      ).rejects.toThrow()

      // 应该记录回滚失败
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to rollback'),
        expect.any(Error)
      )

      // 插件引用应该仍然存在
      expect(pluginManager.has('test-plugin')).toBe(true)

      consoleError.mockRestore()
    })
  })

  describe('热重载状态一致性', () => {
    it('热重载成功后应该更新插件引用', async () => {
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

      await pluginManager.use(oldPlugin)

      await pluginManager.hotReload('test-plugin', newPlugin)

      const currentPlugin = pluginManager.get('test-plugin')
      expect(currentPlugin).toBe(newPlugin)
      expect(currentPlugin?.version).toBe('2.0.0')
    })

    it('热重载过程中插件应该被临时移除', async () => {
      let pluginExistsDuringReload: boolean | null = null

      const oldPlugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: vi.fn(),
        uninstall: vi.fn(),
      }

      const newPlugin: Plugin = {
        name: 'test-plugin',
        version: '2.0.0',
        install: vi.fn(async () => {
          // 检查插件是否在安装期间存在于 Map 中
          pluginExistsDuringReload = pluginManager.has('test-plugin')
        }),
        uninstall: vi.fn(),
      }

      await pluginManager.use(oldPlugin)
      await pluginManager.hotReload('test-plugin', newPlugin)

      // 在新插件安装期间，插件应该已被临时移除
      expect(pluginExistsDuringReload).toBe(false)

      // 热重载完成后应该存在
      expect(pluginManager.has('test-plugin')).toBe(true)
    })

    it('热重载应该保留插件选项', async () => {
      const options = { apiKey: 'test-key', timeout: 5000 }
      
      const oldPlugin: Plugin<typeof options> = {
        name: 'test-plugin',
        version: '1.0.0',
        install: vi.fn(),
        uninstall: vi.fn(),
      }

      const newPlugin: Plugin<typeof options> = {
        name: 'test-plugin',
        version: '2.0.0',
        install: vi.fn(),
        uninstall: vi.fn(),
      }

      await pluginManager.use(oldPlugin, options)
      await pluginManager.hotReload('test-plugin', newPlugin)

      // 验证新插件使用了保存的选项
      expect(newPlugin.install).toHaveBeenCalledWith(
        expect.any(Object),
        options
      )
    })

    it('热重载应该触发所有监听器', async () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()

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

      await pluginManager.use(oldPlugin)

      pluginManager.onHotReload('test-plugin', listener1)
      pluginManager.onHotReload('test-plugin', listener2)

      await pluginManager.hotReload('test-plugin', newPlugin)

      expect(listener1).toHaveBeenCalledTimes(1)
      expect(listener2).toHaveBeenCalledTimes(1)
    })

    it('监听器失败不应该影响热重载', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

      const failingListener = vi.fn(() => {
        throw new Error('Listener failed')
      })

      const successListener = vi.fn()

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

      await pluginManager.use(oldPlugin)

      pluginManager.onHotReload('test-plugin', failingListener)
      pluginManager.onHotReload('test-plugin', successListener)

      // 热重载应该成功
      await expect(
        pluginManager.hotReload('test-plugin', newPlugin)
      ).resolves.toBe(true)

      // 两个监听器都应该被调用
      expect(failingListener).toHaveBeenCalled()
      expect(successListener).toHaveBeenCalled()

      // 应该记录监听器错误
      expect(consoleError).toHaveBeenCalled()

      consoleError.mockRestore()
    })
  })

  describe('原子性操作', () => {
    it('热重载过程应该是原子性的', async () => {
      const operations: string[] = []

      const oldPlugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: vi.fn(),
        uninstall: vi.fn(async () => {
          operations.push('uninstall-old')
          await new Promise(resolve => setTimeout(resolve, 10))
        }),
      }

      const newPlugin: Plugin = {
        name: 'test-plugin',
        version: '2.0.0',
        install: vi.fn(async () => {
          operations.push('install-new')
          await new Promise(resolve => setTimeout(resolve, 10))
        }),
        uninstall: vi.fn(),
      }

      await pluginManager.use(oldPlugin)
      await pluginManager.hotReload('test-plugin', newPlugin)

      // 操作应该按顺序执行
      expect(operations).toEqual(['uninstall-old', 'install-new'])
    })

    it('失败时中间状态应该被正确处理', async () => {
      const oldPlugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: vi.fn(),
        uninstall: vi.fn(),
      }

      const newPlugin: Plugin = {
        name: 'test-plugin',
        version: '2.0.0',
        install: vi.fn(async () => {
          // 模拟部分安装后失败
          await new Promise(resolve => setTimeout(resolve, 10))
          throw new Error('Partial installation failed')
        }),
        uninstall: vi.fn(),
      }

      await pluginManager.use(oldPlugin)

      await expect(
        pluginManager.hotReload('test-plugin', newPlugin)
      ).rejects.toThrow()

      // 应该回到初始状态
      const currentPlugin = pluginManager.get('test-plugin')
      expect(currentPlugin).toBe(oldPlugin)
    })
  })

  describe('边界情况', () => {
    it('热重载不存在的插件应该安装新插件', async () => {
      const newPlugin: Plugin = {
        name: 'new-plugin',
        version: '1.0.0',
        install: vi.fn(),
        uninstall: vi.fn(),
      }

      await expect(
        pluginManager.hotReload('new-plugin', newPlugin)
      ).resolves.toBe(true)

      expect(pluginManager.has('new-plugin')).toBe(true)
      expect(newPlugin.install).toHaveBeenCalled()
    })

    it('热重载没有 uninstall 方法的插件应该成功', async () => {
      const oldPlugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: vi.fn(),
        // 没有 uninstall 方法
      }

      const newPlugin: Plugin = {
        name: 'test-plugin',
        version: '2.0.0',
        install: vi.fn(),
        uninstall: vi.fn(),
      }

      await pluginManager.use(oldPlugin)

      await expect(
        pluginManager.hotReload('test-plugin', newPlugin)
      ).resolves.toBe(true)

      const currentPlugin = pluginManager.get('test-plugin')
      expect(currentPlugin).toBe(newPlugin)
    })

    it('异步监听器应该被等待', async () => {
      const asyncListener = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 50))
      })

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

      await pluginManager.use(oldPlugin)
      pluginManager.onHotReload('test-plugin', asyncListener)

      const startTime = Date.now()
      await pluginManager.hotReload('test-plugin', newPlugin)
      const duration = Date.now() - startTime

      expect(asyncListener).toHaveBeenCalled()
      expect(duration).toBeGreaterThanOrEqual(50)
    })
  })

  describe('性能测试', () => {
    it('热重载应该高效完成', async () => {
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

      await pluginManager.use(oldPlugin)

      const startTime = Date.now()
      await pluginManager.hotReload('test-plugin', newPlugin)
      const duration = Date.now() - startTime

      // 热重载应该在 50ms 内完成
      expect(duration).toBeLessThan(50)
    })

    it('大量监听器不应显著影响性能', async () => {
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

      await pluginManager.use(oldPlugin)

      // 注册 100 个监听器
      for (let i = 0; i < 100; i++) {
        pluginManager.onHotReload('test-plugin', vi.fn())
      }

      const startTime = Date.now()
      await pluginManager.hotReload('test-plugin', newPlugin)
      const duration = Date.now() - startTime

      // 100个监听器应该在200ms内完成
      expect(duration).toBeLessThan(200)
    })
  })
})
