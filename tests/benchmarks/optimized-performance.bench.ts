/**
 * 优化后的性能基准测试
 * 对比优化前后的性能提升
 */

import { beforeEach, bench, describe } from 'vitest'
import { createEngine } from '../../src/core/engine'
import { createEventManager } from '../../src/events/event-manager'
import { createStateManager } from '../../src/state/state-manager'
import { createCacheManager } from '../../src/cache/cache-manager'
import { createPluginManager } from '../../src/plugins/plugin-manager'

describe('优化后性能基准测试', () => {
  describe('事件管理器 - 优先级桶优化', () => {
    let eventManager: ReturnType<typeof createEventManager>

    beforeEach(() => {
      eventManager = createEventManager()
    })

    bench('emit事件 - 无优先级（快速路径）', () => {
      eventManager.on('test', () => { })
      for (let i = 0; i < 1000; i++) {
        eventManager.emit('test', { data: i })
      }
    })

    bench('emit事件 - 单个监听器（快速路径）', () => {
      eventManager.on('single', () => { })
      for (let i = 0; i < 1000; i++) {
        eventManager.emit('single', { data: i })
      }
    })

    bench('emit事件 - 多优先级（优先级桶）', () => {
      eventManager.on('multi', () => { }, 0)
      eventManager.on('multi', () => { }, 100)
      eventManager.on('multi', () => { }, 200)

      for (let i = 0; i < 1000; i++) {
        eventManager.emit('multi', { data: i })
      }
    })

    bench('添加/移除监听器', () => {
      for (let i = 0; i < 100; i++) {
        const handler = () => { }
        eventManager.on('dynamic', handler, i % 3 * 100)
        eventManager.off('dynamic', handler)
      }
    })
  })

  describe('状态管理器 - 路径编译缓存', () => {
    let stateManager: ReturnType<typeof createStateManager>

    beforeEach(() => {
      stateManager = createStateManager()
    })

    bench('get - 单层路径（快速路径）', () => {
      stateManager.set('key', 'value')
      for (let i = 0; i < 1000; i++) {
        stateManager.get('key')
      }
    })

    bench('get - 多层路径（路径编译缓存）', () => {
      stateManager.set('user.profile.name', 'John')
      for (let i = 0; i < 1000; i++) {
        stateManager.get('user.profile.name')
      }
    })

    bench('set - 多层路径（路径编译缓存）', () => {
      for (let i = 0; i < 1000; i++) {
        stateManager.set('user.profile.age', i)
      }
    })

    bench('批量操作 - batchSet', () => {
      stateManager.batchSet({
        'user.name': 'Alice',
        'user.age': 30,
        'user.email': 'alice@example.com',
        'settings.theme': 'dark',
        'settings.lang': 'zh-CN'
      })
    })

    bench('批量操作 - batchGet', () => {
      stateManager.set('a', 1)
      stateManager.set('b', 2)
      stateManager.set('c', 3)

      for (let i = 0; i < 100; i++) {
        stateManager.batchGet(['a', 'b', 'c'])
      }
    })
  })

  describe('缓存管理器 - 大小估算优化', () => {
    let cacheManager: ReturnType<typeof createCacheManager>

    beforeEach(() => {
      cacheManager = createCacheManager({ maxSize: 100 })
    })

    bench('set - 基本类型（类型预估表）', async () => {
      for (let i = 0; i < 100; i++) {
        await cacheManager.set(`key-${i}`, i)
      }
    })

    bench('set - 字符串（分级预估）', async () => {
      for (let i = 0; i < 100; i++) {
        await cacheManager.set(`str-${i}`, 'short string')
      }
    })

    bench('set - 小对象（快速估算）', async () => {
      for (let i = 0; i < 100; i++) {
        await cacheManager.set(`obj-${i}`, { id: i, name: 'test', value: i * 2 })
      }
    })

    bench('set - 数组（采样估算）', async () => {
      const arr = new Array(100).fill(0).map((_, i) => ({ id: i }))
      for (let i = 0; i < 50; i++) {
        await cacheManager.set(`arr-${i}`, arr)
      }
    })
  })

  describe('插件管理器 - 依赖校验缓存', () => {
    let pluginManager: ReturnType<typeof createPluginManager>

    beforeEach(() => {
      const engine = new (await import('../../src/core/engine')).EngineImpl()
      pluginManager = createPluginManager(engine)
    })

    bench('注册插件 - 无依赖', async () => {
      for (let i = 0; i < 20; i++) {
        await pluginManager.register({
          name: `plugin-${i}`,
          install: () => { }
        })
      }
    })

    bench('注册插件 - 有依赖（缓存校验）', async () => {
      // 先注册依赖
      await pluginManager.register({
        name: 'dep1',
        install: () => { }
      })
      await pluginManager.register({
        name: 'dep2',
        install: () => { }
      })

      // 注册依赖这些的插件
      for (let i = 0; i < 10; i++) {
        await pluginManager.register({
          name: `child-${i}`,
          dependencies: ['dep1', 'dep2'],
          install: () => { }
        })
      }
    })

    bench('拓扑排序 - 复杂依赖图', () => {
      const plugins = [
        { name: 'a', install: () => { } },
        { name: 'b', dependencies: ['a'], install: () => { } },
        { name: 'c', dependencies: ['a'], install: () => { } },
        { name: 'd', dependencies: ['b', 'c'], install: () => { } },
        { name: 'e', dependencies: ['d'], install: () => { } }
      ]

      for (let i = 0; i < 100; i++) {
        pluginManager.resolveDependencies(plugins)
      }
    })
  })

  describe('引擎初始化 - 懒加载优化', () => {
    bench('创建引擎 - 仅核心管理器', () => {
      for (let i = 0; i < 100; i++) {
        const engine = createEngine({ debug: false })
        // 不访问任何懒加载管理器
      }
    })

    bench('创建引擎 + 访问单个管理器', () => {
      for (let i = 0; i < 100; i++) {
        const engine = createEngine({ debug: false })
        engine.events.on('test', () => { })
      }
    })

    bench('创建引擎 + 访问所有管理器', () => {
      for (let i = 0; i < 50; i++) {
        const engine = createEngine({ debug: false })
        engine.events
        engine.state
        engine.cache
        engine.performance
        engine.security
        engine.plugins
        engine.middleware
      }
    })
  })
})



