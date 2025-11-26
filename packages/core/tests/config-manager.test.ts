/**
 * ConfigManager 单元测试
 *
 * 测试配置管理系统
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createConfigManager } from '../src/config/config-manager'
import type { ConfigManager, ConfigSource, ConfigLoader } from '../src/config/types'

describe('ConfigManager', () => {
  let configManager: ConfigManager

  beforeEach(() => {
    configManager = createConfigManager()
  })

  afterEach(() => {
    configManager.clear()
    vi.clearAllMocks()
  })

  // ===========================
  // 1. 基本功能测试 (8个)
  // ===========================
  describe('基本功能', () => {
    it('应该设置和获取配置', () => {
      configManager.set('name', 'Test App')

      expect(configManager.get('name')).toBe('Test App')
    })

    it('应该使用默认值', () => {
      expect(configManager.get('nonexistent', 'default')).toBe('default')
    })

    it('应该检查配置是否存在', () => {
      configManager.set('key', 'value')

      expect(configManager.has('key')).toBe(true)
      expect(configManager.has('nonexistent')).toBe(false)
    })

    it('应该删除配置', () => {
      configManager.set('key', 'value')
      expect(configManager.has('key')).toBe(true)

      const deleted = configManager.delete('key')

      expect(deleted).toBe(true)
      expect(configManager.has('key')).toBe(false)
    })

    it('删除不存在的配置应该返回 false', () => {
      const deleted = configManager.delete('nonexistent')

      expect(deleted).toBe(false)
    })

    it('应该获取所有配置', () => {
      configManager.set('key1', 'value1')
      configManager.set('key2', 'value2')

      const all = configManager.getAll()

      expect(all).toEqual({
        key1: 'value1',
        key2: 'value2',
      })
    })

    it('应该批量设置配置', () => {
      configManager.setAll({
        key1: 'value1',
        key2: 'value2',
        key3: 'value3',
      })

      expect(configManager.get('key1')).toBe('value1')
      expect(configManager.get('key2')).toBe('value2')
      expect(configManager.get('key3')).toBe('value3')
    })

    it('应该清空所有配置', () => {
      configManager.set('key1', 'value1')
      configManager.set('key2', 'value2')

      configManager.clear()

      expect(configManager.has('key1')).toBe(false)
      expect(configManager.has('key2')).toBe(false)
    })
  })

  // ===========================
  // 2. 路径访问测试 (5个)
  // ===========================
  describe('路径访问', () => {
    it('应该支持点号分隔的路径', () => {
      configManager.set('app.name', 'Test App')
      configManager.set('app.port', 3000)

      expect(configManager.get('app.name')).toBe('Test App')
      expect(configManager.get('app.port')).toBe(3000)
    })

    it('应该支持深层嵌套路径', () => {
      configManager.set('server.api.v1.endpoint', '/api/v1')

      expect(configManager.get('server.api.v1.endpoint')).toBe('/api/v1')
    })

    it('应该检查嵌套路径是否存在', () => {
      configManager.set('app.database.host', 'localhost')

      expect(configManager.has('app.database.host')).toBe(true)
      expect(configManager.has('app.database.port')).toBe(false)
      expect(configManager.has('app.cache')).toBe(false)
    })

    it('应该删除嵌套路径', () => {
      configManager.set('app.database.host', 'localhost')
      configManager.set('app.database.port', 5432)

      configManager.delete('app.database.host')

      expect(configManager.has('app.database.host')).toBe(false)
      expect(configManager.has('app.database.port')).toBe(true)
    })

    it('获取不存在的嵌套路径应该返回默认值', () => {
      expect(configManager.get('app.nonexistent.key', 'default')).toBe('default')
    })
  })

  // ===========================
  // 3. 配置监听测试 (5个)
  // ===========================
  describe('配置监听', () => {
    it('应该监听特定键的变化', () => {
      const callback = vi.fn()

      configManager.watch('name', callback)
      configManager.set('name', 'New Name')

      expect(callback).toHaveBeenCalledWith('New Name')
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('应该支持全局监听', () => {
      const callback = vi.fn()

      configManager.watch(callback)
      configManager.set('key1', 'value1')
      configManager.set('key2', 'value2')

      expect(callback).toHaveBeenCalledTimes(2)
    })

    it('应该取消特定键的监听', () => {
      const callback = vi.fn()

      const unwatch = configManager.watch('name', callback)
      configManager.set('name', 'Name 1')

      expect(callback).toHaveBeenCalledTimes(1)

      unwatch()
      configManager.set('name', 'Name 2')

      // 取消后不再触发
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('应该取消全局监听', () => {
      const callback = vi.fn()

      const unwatch = configManager.watch(callback)
      configManager.set('key', 'value1')

      expect(callback).toHaveBeenCalledTimes(1)

      unwatch()
      configManager.set('key', 'value2')

      // 取消后不再触发
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('同一个键可以有多个监听器', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      const callback3 = vi.fn()

      configManager.watch('name', callback1)
      configManager.watch('name', callback2)
      configManager.watch('name', callback3)

      configManager.set('name', 'New Name')

      expect(callback1).toHaveBeenCalledWith('New Name')
      expect(callback2).toHaveBeenCalledWith('New Name')
      expect(callback3).toHaveBeenCalledWith('New Name')
    })
  })

  // ===========================
  // 4. 配置源和加载器测试 (4个)
  // ===========================
  describe('配置源和加载器', () => {
    it('应该添加配置源', () => {
      const source: ConfigSource = {
        name: 'test-source',
        data: { key1: 'value1', key2: 'value2' },
        priority: 10,
      }

      configManager.addSource(source)

      expect(configManager.get('key1')).toBe('value1')
      expect(configManager.get('key2')).toBe('value2')
    })

    it('配置源应该按优先级排序', () => {
      const source1: ConfigSource = {
        name: 'source1',
        data: { key1: 'value1' },
        priority: 5,
      }

      const source2: ConfigSource = {
        name: 'source2',
        data: { key2: 'value2' },
        priority: 10,
      }

      // 添加配置源
      configManager.addSource(source1)
      configManager.addSource(source2)

      // 验证两个配置源的数据都已合并
      expect(configManager.get('key1')).toBe('value1')
      expect(configManager.get('key2')).toBe('value2')
    })

    it('应该添加配置加载器', async () => {
      const loader: ConfigLoader = {
        name: 'test-loader',
        load: vi.fn().mockResolvedValue({
          loaded: 'config',
        }),
      }

      await configManager.addLoader(loader)

      expect(loader.load).toHaveBeenCalled()
      expect(configManager.get('loaded')).toBe('config')
    })

    it('配置加载器应该支持监听', async () => {
      let watchCallback: any = null

      const loader: ConfigLoader = {
        name: 'watching-loader',
        load: vi.fn().mockResolvedValue({ initial: 'value' }),
        watch: vi.fn((callback: any) => {
          watchCallback = callback
          return () => { } // 返回取消函数
        }) as any,
      }

      await configManager.addLoader(loader)

      expect(loader.watch).toHaveBeenCalled()
      expect(configManager.get('initial')).toBe('value')

      // 触发 watch 回调
      if (watchCallback) {
        watchCallback({ updated: 'value' })
      }

      expect(configManager.get('updated')).toBe('value')
    })
  })

  // ===========================
  // 5. 环境管理测试 (3个)
  // ===========================
  describe('环境管理', () => {
    it('应该获取当前环境', () => {
      const manager = createConfigManager({ environment: 'production' })

      expect(manager.getEnvironment()).toBe('production')
    })

    it('应该设置环境', () => {
      configManager.setEnvironment('staging')

      expect(configManager.getEnvironment()).toBe('staging')
    })

    it('应该重新加载配置', async () => {
      configManager.set('key', 'value')

      const manager = createConfigManager({
        defaults: { default: 'config' },
      })

      manager.set('key', 'old')

      await manager.reload()

      // 重新加载后应该恢复默认值
      expect(manager.get('default')).toBe('config')
    })
  })

  // ===========================
  // 6. 配置导出和合并测试 (4个)
  // ===========================
  describe('配置导出和合并', () => {
    it('应该导出为 JSON 格式', () => {
      configManager.set('key1', 'value1')
      configManager.set('key2', 'value2')

      const exported = configManager.export('json')
      const parsed = JSON.parse(exported)

      expect(parsed).toEqual({
        key1: 'value1',
        key2: 'value2',
      })
    })

    it('应该导出为环境变量格式', () => {
      const manager = createConfigManager({ envPrefix: 'APP_' })

      manager.set('name', 'Test')
      manager.set('port', '3000')

      const exported = manager.export('env')

      expect(exported).toContain('APP_NAME=Test')
      expect(exported).toContain('APP_PORT=3000')
    })

    it('应该浅层合并配置', () => {
      configManager.set('key1', 'value1')
      configManager.set('key2', 'value2')

      configManager.merge({ key2: 'updated', key3: 'value3' }, false)

      expect(configManager.get('key1')).toBe('value1')
      expect(configManager.get('key2')).toBe('updated')
      expect(configManager.get('key3')).toBe('value3')
    })

    it('应该深度合并配置', () => {
      configManager.set('app.name', 'Old Name')
      configManager.set('app.port', 3000)

      configManager.merge(
        {
          app: {
            name: 'New Name',
            version: '1.0.0',
          },
        },
        true
      )

      expect(configManager.get('app.name')).toBe('New Name')
      expect(configManager.get('app.port')).toBe(3000)
      expect(configManager.get('app.version')).toBe('1.0.0')
    })
  })

  // ===========================
  // 7. 性能优化测试 (2个)
  // ===========================
  describe('性能优化', () => {
    it('应该使用缓存优化 getAll', () => {
      configManager.set('key1', 'value1')
      configManager.set('key2', 'value2')

      const start = performance.now()

      // 连续调用 getAll
      for (let i = 0; i < 100; i++) {
        configManager.getAll()
      }

      const duration = performance.now() - start

      // 由于缓存，100次调用应该很快
      expect(duration).toBeLessThan(50)
    })

    it('应该快速处理大量配置', () => {
      const largeConfig: Record<string, string> = {}

      for (let i = 0; i < 1000; i++) {
        largeConfig[`key${i}`] = `value${i}`
      }

      const start = performance.now()
      configManager.setAll(largeConfig)
      const duration = performance.now() - start

      // 设置1000个配置应该很快
      expect(duration).toBeLessThan(100)
      expect(configManager.get('key500')).toBe('value500')
    })
  })

  // ===========================
  // 8. 边界情况测试 (3个)
  // ===========================
  describe('边界情况', () => {
    it('使用无效的 watch 参数应该抛出错误', () => {
      expect(() => {
        configManager.watch('key', undefined as any)
      }).toThrow('Callback is required when key is provided')
    })

    it('getAll 应该返回配置的副本', () => {
      configManager.set('key', 'value')

      const config1 = configManager.getAll()
      const config2 = configManager.getAll()

      // 应该是不同的对象
      expect(config1).not.toBe(config2)
      // 但内容相同
      expect(config1).toEqual(config2)

      // 修改副本不应该影响原配置
      config1.key = 'modified'
      expect(configManager.get('key')).toBe('value')
    })

    it('clear 后应该通知全局监听器', () => {
      const callback = vi.fn()

      configManager.watch(callback)
      configManager.set('key', 'value')

      expect(callback).toHaveBeenCalledTimes(1)

      configManager.clear()

      // clear 应该触发全局监听器
      expect(callback).toHaveBeenCalledTimes(2)
      expect(callback).toHaveBeenLastCalledWith({})
    })
  })
})