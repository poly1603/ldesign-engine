/**
 * 插件安装并发控制修复测试
 * 
 * 测试并发安装互斥
 * 测试同一插件并发安装
 * 测试安装失败清理
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPluginManager } from '../src/plugin/plugin-manager'
import type { Plugin, PluginContext, PluginManager } from '../src/types'

describe('插件安装并发控制修复测试', () => {
  let pluginManager: PluginManager
  let context: PluginContext

  beforeEach(() => {
    context = {
      engine: {} as any,
      config: { debug: false },
    }
    pluginManager = createPluginManager(context)
  })

  describe('并发安装互斥', () => {
    it('应该阻止同一插件的并发安装', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: vi.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, 100))
        }),
      }

      // 同时发起两次安装
      const install1 = pluginManager.use(plugin)
      const install2 = pluginManager.use(plugin)

      // 第一次应该成功
      await expect(install1).resolves.toBeUndefined()
      
      // 第二次应该等待第一次完成后直接返回
      await expect(install2).resolves.toBeUndefined()

      // install 方法应该只被调用一次
      expect(plugin.install).toHaveBeenCalledTimes(1)
    })

    it('并发安装时第二次调用应该等待第一次完成', async () => {
      const installOrder: number[] = []

      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: vi.fn(async () => {
          installOrder.push(1)
          await new Promise(resolve => setTimeout(resolve, 50))
          installOrder.push(2)
        }),
      }

      const install1 = pluginManager.use(plugin).then(() => {
        installOrder.push(3)
      })

      await new Promise(resolve => setTimeout(resolve, 10))

      const install2 = pluginManager.use(plugin).then(() => {
        installOrder.push(4)
      })

      await Promise.all([install1, install2])

      // 顺序应该是：开始安装(1) -> 完成安装(2) -> 第一次use完成(3) -> 第二次use完成(4)
      expect(installOrder).toEqual([1, 2, 3, 4])
    })

    it('不同插件可以并发安装', async () => {
      const plugin1: Plugin = {
        name: 'plugin-1',
        version: '1.0.0',
        install: vi.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, 50))
        }),
      }

      const plugin2: Plugin = {
        name: 'plugin-2',
        version: '1.0.0',
        install: vi.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, 50))
        }),
      }

      const startTime = Date.now()

      await Promise.all([
        pluginManager.use(plugin1),
        pluginManager.use(plugin2),
      ])

      const duration = Date.now() - startTime

      // 并发安装应该比顺序安装快
      expect(duration).toBeLessThan(100)
      expect(plugin1.install).toHaveBeenCalledTimes(1)
      expect(plugin2.install).toHaveBeenCalledTimes(1)
    })

    it('安装完成后互斥锁应该被释放', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: vi.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, 50))
        }),
      }

      // 第一次安装
      await pluginManager.use(plugin)
      
      // 清除插件以便重新安装
      pluginManager.clear()

      // 第二次安装应该能够正常进行
      await expect(pluginManager.use(plugin)).resolves.toBeUndefined()
      
      expect(plugin.install).toHaveBeenCalledTimes(2)
    })
  })

  describe('安装失败时的并发控制', () => {
    it('安装失败后应该释放互斥锁', async () => {
      let shouldFail = true

      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: vi.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, 50))
          if (shouldFail) {
            throw new Error('Installation failed')
          }
        }),
      }

      // 第一次安装失败
      await expect(pluginManager.use(plugin)).rejects.toThrow('Installation failed')

      // 第二次安装应该能够进行
      shouldFail = false
      await expect(pluginManager.use(plugin)).resolves.toBeUndefined()

      expect(plugin.install).toHaveBeenCalledTimes(2)
    })

    it('安装失败时并发请求也应该失败', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: vi.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, 100))
          throw new Error('Installation failed')
        }),
      }

      const install1 = pluginManager.use(plugin)
      const install2 = pluginManager.use(plugin)

      await expect(install1).rejects.toThrow('Installation failed')
      await expect(install2).rejects.toThrow('Installation failed')
    })

    it('部分安装后失败应该清理状态', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: vi.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, 50))
          throw new Error('Installation failed')
        }),
      }

      await expect(pluginManager.use(plugin)).rejects.toThrow()

      // 插件不应该被标记为已安装
      expect(pluginManager.has('test-plugin')).toBe(false)
    })
  })

  describe('依赖安装的并发控制', () => {
    it('应该正确处理依赖链的并发安装', async () => {
      const depPlugin: Plugin = {
        name: 'dep-plugin',
        version: '1.0.0',
        install: vi.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, 50))
        }),
      }

      const mainPlugin: Plugin = {
        name: 'main-plugin',
        version: '1.0.0',
        dependencies: ['dep-plugin'],
        install: vi.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, 50))
        }),
      }

      // 先安装依赖
      await pluginManager.use(depPlugin)

      // 并发安装主插件（两次）
      const install1 = pluginManager.use(mainPlugin)
      const install2 = pluginManager.use(mainPlugin)

      await Promise.all([install1, install2])

      expect(mainPlugin.install).toHaveBeenCalledTimes(1)
    })

    it('并发安装时依赖检查应该正确工作', async () => {
      const mainPlugin: Plugin = {
        name: 'main-plugin',
        version: '1.0.0',
        dependencies: ['missing-dep'],
        install: vi.fn(),
      }

      const install1 = pluginManager.use(mainPlugin)
      const install2 = pluginManager.use(mainPlugin)

      await expect(install1).rejects.toThrow('missing-dep')
      await expect(install2).rejects.toThrow('missing-dep')
    })

    it('应该避免循环依赖的死锁', async () => {
      // 注意：这个测试检查循环依赖检测，而不是并发控制本身
      const plugin1: Plugin = {
        name: 'plugin-1',
        version: '1.0.0',
        dependencies: ['plugin-2'],
        install: vi.fn(),
      }

      const plugin2: Plugin = {
        name: 'plugin-2',
        version: '1.0.0',
        dependencies: ['plugin-1'],
        install: vi.fn(),
      }

      // 尝试安装循环依赖的插件应该失败
      await expect(pluginManager.use(plugin1)).rejects.toThrow()
      await expect(pluginManager.use(plugin2)).rejects.toThrow()
    })
  })

  describe('高并发场景', () => {
    it('应该处理大量并发安装请求', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: vi.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, 100))
        }),
      }

      // 发起100个并发请求
      const promises = Array.from({ length: 100 }, () =>
        pluginManager.use(plugin)
      )

      await Promise.all(promises)

      // install 应该只被调用一次
      expect(plugin.install).toHaveBeenCalledTimes(1)
      expect(pluginManager.has('test-plugin')).toBe(true)
    })

    it('多个插件的高并发安装应该正确工作', async () => {
      const plugins = Array.from({ length: 10 }, (_, i) => ({
        name: `plugin-${i}`,
        version: '1.0.0',
        install: vi.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, 10))
        }),
      }))

      const startTime = Date.now()

      await Promise.all(
        plugins.flatMap(plugin =>
          Array.from({ length: 10 }, () => pluginManager.use(plugin))
        )
      )

      const duration = Date.now() - startTime

      // 每个插件应该只被安装一次
      plugins.forEach(plugin => {
        expect(plugin.install).toHaveBeenCalledTimes(1)
        expect(pluginManager.has(plugin.name)).toBe(true)
      })

      // 总时间应该远小于顺序安装
      expect(duration).toBeLessThan(200)
    })

    it('并发安装不应该导致内存泄漏', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: vi.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, 10))
        }),
      }

      // 发起1000个并发请求
      await Promise.all(
        Array.from({ length: 1000 }, () => pluginManager.use(plugin))
      )

      // 验证只有一个插件实例
      expect(pluginManager.size()).toBe(1)
      expect(plugin.install).toHaveBeenCalledTimes(1)
    })
  })

  describe('边界情况', () => {
    it('已安装插件的并发请求应该立即返回', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: vi.fn(),
      }

      await pluginManager.use(plugin)

      const startTime = Date.now()
      
      await Promise.all([
        pluginManager.use(plugin),
        pluginManager.use(plugin),
        pluginManager.use(plugin),
      ])

      const duration = Date.now() - startTime

      // 应该立即返回（小于10ms）
      expect(duration).toBeLessThan(10)
      expect(plugin.install).toHaveBeenCalledTimes(1)
    })

    it('安装过程中查询插件应该返回 false', async () => {
      let isInstalledDuringInstall: boolean | undefined

      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: vi.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, 50))
          isInstalledDuringInstall = pluginManager.has('test-plugin')
        }),
      }

      await pluginManager.use(plugin)

      // 安装过程中应该还未标记为已安装
      expect(isInstalledDuringInstall).toBe(false)
      
      // 安装完成后应该已安装
      expect(pluginManager.has('test-plugin')).toBe(true)
    })

    it('同步错误应该正确传播', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: vi.fn(() => {
          throw new Error('Sync error')
        }),
      }

      const install1 = pluginManager.use(plugin)
      const install2 = pluginManager.use(plugin)

      await expect(install1).rejects.toThrow('Sync error')
      await expect(install2).rejects.toThrow('Sync error')
    })

    it('空插件名应该被正确处理', async () => {
      const plugin: Plugin = {
        name: '',
        version: '1.0.0',
        install: vi.fn(),
      }

      await pluginManager.use(plugin)
      
      // 应该能够通过空名称获取
      expect(pluginManager.has('')).toBe(true)
    })
  })

  describe('性能测试', () => {
    it('互斥锁不应显著影响单次安装性能', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: vi.fn(),
      }

      const startTime = Date.now()
      await pluginManager.use(plugin)
      const duration = Date.now() - startTime

      // 单次安装应该在10ms内完成
      expect(duration).toBeLessThan(10)
    })

    it('大量顺序安装应该高效完成', async () => {
      const plugins = Array.from({ length: 100 }, (_, i) => ({
        name: `plugin-${i}`,
        version: '1.0.0',
        install: vi.fn(),
      }))

      const startTime = Date.now()

      for (const plugin of plugins) {
        await pluginManager.use(plugin)
      }

      const duration = Date.now() - startTime

      // 100个插件顺序安装应该在100ms内完成
      expect(duration).toBeLessThan(100)
      expect(pluginManager.size()).toBe(100)
    })

    it('互斥锁清理应该及时', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: vi.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, 50))
        }),
      }

      await pluginManager.use(plugin)

      // 安装完成后立即尝试重新安装（需要先清除）
      pluginManager.clear()

      const startTime = Date.now()
      await pluginManager.use(plugin)
      const duration = Date.now() - startTime

      // 应该能够立即获取锁并开始安装
      expect(duration).toBeGreaterThanOrEqual(50)
      expect(duration).toBeLessThan(70)
    })
  })

  describe('错误恢复', () => {
    it('安装失败后应该能够重试', async () => {
      let attempts = 0

      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: vi.fn(async () => {
          attempts++
          if (attempts < 3) {
            throw new Error(`Attempt ${attempts} failed`)
          }
        }),
      }

      // 前两次失败
      await expect(pluginManager.use(plugin)).rejects.toThrow('Attempt 1 failed')
      await expect(pluginManager.use(plugin)).rejects.toThrow('Attempt 2 failed')
      
      // 第三次成功
      await expect(pluginManager.use(plugin)).resolves.toBeUndefined()

      expect(attempts).toBe(3)
      expect(pluginManager.has('test-plugin')).toBe(true)
    })

    it('并发请求在失败后应该都能重试', async () => {
      let shouldFail = true

      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: vi.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, 50))
          if (shouldFail) {
            throw new Error('Installation failed')
          }
        }),
      }

      // 并发安装失败
      const install1 = pluginManager.use(plugin)
      const install2 = pluginManager.use(plugin)

      await expect(install1).rejects.toThrow()
      await expect(install2).rejects.toThrow()

      // 重试应该成功
      shouldFail = false
      await expect(pluginManager.use(plugin)).resolves.toBeUndefined()

      expect(pluginManager.has('test-plugin')).toBe(true)
    })
  })
})