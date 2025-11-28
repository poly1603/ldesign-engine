/**
 * 懒加载超时处理修复测试
 * 
 * 测试超时后定时器清理
 * 测试成功加载时定时器清理
 * 测试超时错误信息
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { LazyPluginLoader } from '../src/plugin/lazy-plugin-loader'
import type { Plugin, PluginLoader } from '../src/plugin/lazy-plugin-loader'

describe('懒加载超时处理修复测试', () => {
  let loader: LazyPluginLoader

  beforeEach(() => {
    vi.useFakeTimers()
    loader = new LazyPluginLoader({
      timeout: 1000,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
    loader.destroy()
  })

  describe('超时后定时器清理', () => {
    it('加载超时后应该清理定时器', async () => {
      const pluginLoader: PluginLoader = {
        load: vi.fn(async () => {
          // 模拟永不完成的加载
          await new Promise(() => {})
          return { name: 'test', version: '1.0.0', install: vi.fn() }
        }),
      }

      loader.register('test-plugin', pluginLoader)

      const loadPromise = loader.load('test-plugin')

      // 推进时间到超时
      await vi.advanceTimersByTimeAsync(1000)

      await expect(loadPromise).rejects.toThrow('timeout')

      // 不应该有剩余的定时器
      expect(vi.getTimerCount()).toBe(0)
    })

    it('多个插件超时后都应该清理定时器', async () => {
      const plugin1Loader: PluginLoader = {
        load: vi.fn(async () => {
          await new Promise(() => {})
          return { name: 'plugin1', version: '1.0.0', install: vi.fn() }
        }),
      }

      const plugin2Loader: PluginLoader = {
        load: vi.fn(async () => {
          await new Promise(() => {})
          return { name: 'plugin2', version: '1.0.0', install: vi.fn() }
        }),
      }

      loader.register('plugin-1', plugin1Loader)
      loader.register('plugin-2', plugin2Loader)

      const load1 = loader.load('plugin-1')
      const load2 = loader.load('plugin-2')

      await vi.advanceTimersByTimeAsync(1000)

      await expect(load1).rejects.toThrow('timeout')
      await expect(load2).rejects.toThrow('timeout')

      expect(vi.getTimerCount()).toBe(0)
    })
  })

  describe('成功加载时定时器清理', () => {
    it('加载成功后应该清理定时器', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: vi.fn(),
      }

      const pluginLoader: PluginLoader = {
        load: vi.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, 100))
          return plugin
        }),
      }

      loader.register('test-plugin', pluginLoader)

      const loadPromise = loader.load('test-plugin')

      // 推进时间100ms（成功加载）
      await vi.advanceTimersByTimeAsync(100)

      const result = await loadPromise

      expect(result).toBe(plugin)
      expect(vi.getTimerCount()).toBe(0)
    })

    it('快速加载完成应该立即清理定时器', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: vi.fn(),
      }

      const pluginLoader: PluginLoader = {
        load: vi.fn(async () => plugin),
      }

      loader.register('test-plugin', pluginLoader)

      await loader.load('test-plugin')

      expect(vi.getTimerCount()).toBe(0)
    })
  })

  describe('超时错误信息', () => {
    it('超时错误应该包含插件名称', async () => {
      const pluginLoader: PluginLoader = {
        load: vi.fn(async () => {
          await new Promise(() => {})
          return { name: 'test', version: '1.0.0', install: vi.fn() }
        }),
      }

      loader.register('my-plugin', pluginLoader)

      const loadPromise = loader.load('my-plugin')

      await vi.advanceTimersByTimeAsync(1000)

      await expect(loadPromise).rejects.toThrow('my-plugin')
    })

    it('超时错误应该包含超时时间', async () => {
      const pluginLoader: PluginLoader = {
        load: vi.fn(async () => {
          await new Promise(() => {})
          return { name: 'test', version: '1.0.0', install: vi.fn() }
        }),
      }

      loader.register('test-plugin', pluginLoader)

      const loadPromise = loader.load('test-plugin')

      await vi.advanceTimersByTimeAsync(1000)

      await expect(loadPromise).rejects.toThrow('1000ms')
    })

    it('超时错误应该更新加载状态', async () => {
      const pluginLoader: PluginLoader = {
        load: vi.fn(async () => {
          await new Promise(() => {})
          return { name: 'test', version: '1.0.0', install: vi.fn() }
        }),
      }

      loader.register('test-plugin', pluginLoader)

      const loadPromise = loader.load('test-plugin')

      await vi.advanceTimersByTimeAsync(1000)

      await expect(loadPromise).rejects.toThrow()

      const loadInfo = loader.getLoadInfo('test-plugin')
      expect(loadInfo?.state).toBe('error')
      expect(loadInfo?.error).toBeDefined()
    })
  })

  describe('加载失败时定时器清理', () => {
    it('加载失败后应该清理定时器', async () => {
      const pluginLoader: PluginLoader = {
        load: vi.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, 100))
          throw new Error('Load failed')
        }),
      }

      loader.register('test-plugin', pluginLoader)

      const loadPromise = loader.load('test-plugin')

      await vi.advanceTimersByTimeAsync(100)

      await expect(loadPromise).rejects.toThrow('Load failed')

      expect(vi.getTimerCount()).toBe(0)
    })

    it('同步错误应该清理定时器', async () => {
      const pluginLoader: PluginLoader = {
        load: vi.fn(() => {
          throw new Error('Sync error')
        }) as any,
      }

      loader.register('test-plugin', pluginLoader)

      await expect(loader.load('test-plugin')).rejects.toThrow('Sync error')

      expect(vi.getTimerCount()).toBe(0)
    })
  })

  describe('边界情况', () => {
    it('零超时应该立即失败', async () => {
      const loaderWithZeroTimeout = new LazyPluginLoader({
        timeout: 0,
      })

      const pluginLoader: PluginLoader = {
        load: vi.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, 100))
          return { name: 'test', version: '1.0.0', install: vi.fn() }
        }),
      }

      loaderWithZeroTimeout.register('test-plugin', pluginLoader)

      const loadPromise = loaderWithZeroTimeout.load('test-plugin')

      await vi.advanceTimersByTimeAsync(0)

      await expect(loadPromise).rejects.toThrow('timeout')

      loaderWithZeroTimeout.destroy()
    })

    it('非常大的超时值应该正常工作', async () => {
      const loaderWithLargeTimeout = new LazyPluginLoader({
        timeout: 1000000,
      })

      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: vi.fn(),
      }

      const pluginLoader: PluginLoader = {
        load: vi.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, 100))
          return plugin
        }),
      }

      loaderWithLargeTimeout.register('test-plugin', pluginLoader)

      const loadPromise = loaderWithLargeTimeout.load('test-plugin')

      await vi.advanceTimersByTimeAsync(100)

      const result = await loadPromise

      expect(result).toBe(plugin)
      expect(vi.getTimerCount()).toBe(0)

      loaderWithLargeTimeout.destroy()
    })
  })

  describe('并发加载时的定时器管理', () => {
    it('多个插件并发加载时应该正确管理定时器', async () => {
      const plugin1: Plugin = {
        name: 'plugin1',
        version: '1.0.0',
        install: vi.fn(),
      }

      const plugin2: Plugin = {
        name: 'plugin2',
        version: '1.0.0',
        install: vi.fn(),
      }

      const plugin1Loader: PluginLoader = {
        load: vi.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, 200))
          return plugin1
        }),
      }

      const plugin2Loader: PluginLoader = {
        load: vi.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, 300))
          return plugin2
        }),
      }

      loader.register('plugin-1', plugin1Loader)
      loader.register('plugin-2', plugin2Loader)

      const load1 = loader.load('plugin-1')
      const load2 = loader.load('plugin-2')

      // 第一个插件完成
      await vi.advanceTimersByTimeAsync(200)
      await expect(load1).resolves.toBe(plugin1)

      // 第二个插件完成
      await vi.advanceTimersByTimeAsync(100)
      await expect(load2).resolves.toBe(plugin2)

      // 所有定时器都应该被清理
      expect(vi.getTimerCount()).toBe(0)
    })
  })

  describe('性能测试', () => {
    it('大量插件加载应该正确管理定时器', async () => {
      const plugins = Array.from({ length: 100 }, (_, i) => ({
        name: `plugin-${i}`,
        version: '1.0.0',
        install: vi.fn(),
      }))

      plugins.forEach((plugin, i) => {
        loader.register(`plugin-${i}`, {
          load: async () => {
            await new Promise(resolve => setTimeout(resolve, 10))
            return plugin
          },
        })
      })

      const promises = plugins.map((_, i) => loader.load(`plugin-${i}`))

      await vi.advanceTimersByTimeAsync(10)

      await Promise.all(promises)

      // 所有定时器都应该被清理
      expect(vi.getTimerCount()).toBe(0)
    })
  })
})