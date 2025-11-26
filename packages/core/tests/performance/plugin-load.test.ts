/**
 * 插件加载性能基准测试
 * 
 * 测试大量插件加载、初始化和卸载的性能表现
 */

import { bench, describe } from 'vitest'
import { createEventManager } from '../../src/event/event-manager'
import { createStateManager } from '../../src/state/state-manager'
import { createLifecycleManager } from '../../src/lifecycle/lifecycle-manager'
import { createPluginManager } from '../../src/plugin/plugin-manager'
import type { Plugin, PluginContext } from '../../src/types'

describe('插件加载性能基准测试', () => {
  function createTestContext(): PluginContext {
    const events = createEventManager()
    const state = createStateManager()
    const lifecycle = createLifecycleManager()

    return {
      engine: {
        events,
        state,
        lifecycle,
      } as any,
      config: { debug: false },
    }
  }

  function createTestPlugin(name: string): Plugin {
    return {
      name,
      version: '1.0.0',
      async install(ctx) {
        ctx.engine.state.set(`${name}:installed`, true)
        ctx.engine.lifecycle.on('init', () => {
          ctx.engine.state.set(`${name}:initialized`, true)
        })
      },
      async uninstall(ctx) {
        ctx.engine.state.set(`${name}:installed`, false)
      },
    }
  }

  bench('加载 10 个插件', async () => {
    const context = createTestContext()
    const pluginManager = createPluginManager(context)

    for (let i = 0; i < 10; i++) {
      await pluginManager.use(createTestPlugin(`plugin-${i}`))
    }
  })

  bench('加载 50 个插件', async () => {
    const context = createTestContext()
    const pluginManager = createPluginManager(context)

    for (let i = 0; i < 50; i++) {
      await pluginManager.use(createTestPlugin(`plugin-${i}`))
    }
  })

  bench('加载 100 个插件', async () => {
    const context = createTestContext()
    const pluginManager = createPluginManager(context)

    for (let i = 0; i < 100; i++) {
      await pluginManager.use(createTestPlugin(`plugin-${i}`))
    }
  })

  bench('加载和卸载 50 个插件', async () => {
    const context = createTestContext()
    const pluginManager = createPluginManager(context)

    // 加载
    const plugins: Plugin[] = []
    for (let i = 0; i < 50; i++) {
      const plugin = createTestPlugin(`plugin-${i}`)
      plugins.push(plugin)
      await pluginManager.use(plugin)
    }

    // 卸载
    for (const plugin of plugins) {
      await pluginManager.uninstall(plugin.name)
    }
  })

  bench('带依赖的插件加载（10层深度）', async () => {
    const context = createTestContext()
    const pluginManager = createPluginManager(context)

    // 创建依赖链: plugin-0 <- plugin-1 <- ... <- plugin-9
    for (let i = 0; i < 10; i++) {
      const dependencies = i > 0 ? [`plugin-${i - 1}`] : []
      await pluginManager.use({
        name: `plugin-${i}`,
        version: '1.0.0',
        dependencies,
        async install(ctx) {
          ctx.engine.state.set(`plugin-${i}:ready`, true)
        },
      })
    }
  })

  bench('并发加载 20 个插件', async () => {
    const context = createTestContext()
    const pluginManager = createPluginManager(context)

    const promises = []
    for (let i = 0; i < 20; i++) {
      promises.push(pluginManager.use(createTestPlugin(`plugin-${i}`)))
    }

    await Promise.all(promises)
  })

  bench('插件热重载（50次）', async () => {
    const context = createTestContext()
    const pluginManager = createPluginManager(context)

    for (let i = 0; i < 50; i++) {
      const plugin = createTestPlugin('hot-reload-plugin')
      await pluginManager.use(plugin)
      await pluginManager.uninstall(plugin.name)
    }
  })

  bench('复杂插件加载（带生命周期钩子）', async () => {
    const context = createTestContext()
    const pluginManager = createPluginManager(context)

    for (let i = 0; i < 20; i++) {
      await pluginManager.use({
        name: `complex-plugin-${i}`,
        version: '1.0.0',
        async install(ctx) {
          // 注册多个生命周期钩子
          ctx.engine.lifecycle.on('init', () => {
            ctx.engine.state.set(`plugin-${i}:init`, true)
          })
          ctx.engine.lifecycle.on('mounted', () => {
            ctx.engine.state.set(`plugin-${i}:mounted`, true)
          })
          ctx.engine.lifecycle.on('beforeUnmount', () => {
            ctx.engine.state.set(`plugin-${i}:cleanup`, true)
          })

          // 注册事件监听
          ctx.engine.events.on(`plugin-${i}:event`, () => {
            ctx.engine.state.set(`plugin-${i}:event-handled`, true)
          })
        },
      })
    }

    // 触发生命周期
    await context.engine.lifecycle.trigger('init')
    await context.engine.lifecycle.trigger('mounted')
  })
})