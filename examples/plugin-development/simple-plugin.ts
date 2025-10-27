/**
 * 简单插件开发示例
 * 
 * 学习目标：
 * - 了解插件的基本结构
 * - 学习如何注册和使用插件
 * - 掌握插件的生命周期
 */

import { createEngine } from '@ldesign/engine'
import type { Plugin, Engine } from '@ldesign/engine'

// ============================================
// 1. 最简单的插件
// ============================================

const simplePlugin: Plugin = {
  name: 'simple-plugin',
  version: '1.0.0',

  install(engine: Engine) {
    console.log('简单插件已安装')

    // 可以访问引擎的所有 API
    engine.logger.info('这是一个简单插件')
  }
}

// ============================================
// 2. 带配置的插件
// ============================================

interface GreetPluginOptions {
  message?: string
  showTimestamp?: boolean
}

function createGreetPlugin(options: GreetPluginOptions = {}): Plugin {
  const { message = 'Hello', showTimestamp = false } = options

  return {
    name: 'greet-plugin',
    version: '1.0.0',

    install(engine: Engine) {
      // 添加自定义方法到引擎
      (engine as any).greet = (name: string) => {
        const timestamp = showTimestamp ? ` [${new Date().toISOString()}]` : ''
        const greeting = `${message}, ${name}!${timestamp}`
        engine.logger.info(greeting)
        return greeting
      }
    },

    uninstall(engine: Engine) {
      // 清理资源
      delete (engine as any).greet
      engine.logger.info('问候插件已卸载')
    }
  }
}

// ============================================
// 3. 功能增强插件
// ============================================

const eventLoggerPlugin: Plugin = {
  name: 'event-logger',
  version: '1.0.0',

  install(engine: Engine) {
    // 监听所有事件并记录
    const originalEmit = engine.events.emit.bind(engine.events)

    engine.events.emit = (event: string, ...args: any[]) => {
      engine.logger.debug(`[Event] ${event}`, args)
      return originalEmit(event, ...args)
    }

    engine.logger.info('事件日志插件已启用')
  }
}

// ============================================
// 4. 状态管理插件
// ============================================

interface CounterPluginState {
  count: number
  history: number[]
}

const counterPlugin: Plugin = {
  name: 'counter-plugin',
  version: '1.0.0',

  install(engine: Engine) {
    // 注册状态模块
    engine.state.set('counter', {
      count: 0,
      history: []
    } as CounterPluginState)

      // 添加方法
      (engine as any).counter = {
      increment() {
        const state = engine.state.get<CounterPluginState>('counter')!
        const newCount = state.count + 1

        engine.state.set('counter', {
          count: newCount,
          history: [...state.history, newCount]
        })

        engine.events.emit('counter:changed', newCount)
      },

      decrement() {
        const state = engine.state.get<CounterPluginState>('counter')!
        const newCount = state.count - 1

        engine.state.set('counter', {
          count: newCount,
          history: [...state.history, newCount]
        })

        engine.events.emit('counter:changed', newCount)
      },

      reset() {
        engine.state.set('counter', {
          count: 0,
          history: []
        })

        engine.events.emit('counter:reset')
      },

      getCount(): number {
        const state = engine.state.get<CounterPluginState>('counter')
        return state?.count ?? 0
      },

      getHistory(): number[] {
        const state = engine.state.get<CounterPluginState>('counter')
        return state?.history ?? []
      }
    }

    engine.logger.info('计数器插件已安装')
  },

  uninstall(engine: Engine) {
    // 清理状态
    engine.state.remove('counter')
    delete (engine as any).counter

    engine.logger.info('计数器插件已卸载')
  }
}

// ============================================
// 5. 缓存增强插件
// ============================================

const cacheStatsPlugin: Plugin = {
  name: 'cache-stats',
  version: '1.0.0',

  install(engine: Engine) {
    const stats = {
      hits: 0,
      misses: 0,
      sets: 0
    }

    // 拦截缓存方法
    const originalGet = engine.cache.get.bind(engine.cache)
    const originalSet = engine.cache.set.bind(engine.cache)

    engine.cache.get = async (key: string) => {
      const value = await originalGet(key)
      if (value !== undefined) {
        stats.hits++
      } else {
        stats.misses++
      }
      return value
    }

    engine.cache.set = async (key: string, value: any, ttl?: number) => {
      stats.sets++
      return await originalSet(key, value, ttl)
    }

    // 添加统计方法
    (engine as any).getCacheStats = () => ({
      ...stats,
      hitRate: stats.hits / (stats.hits + stats.misses) || 0
    })

    // 定期输出统计
    const interval = setInterval(() => {
      const rate = (stats.hits / (stats.hits + stats.misses) * 100).toFixed(2)
      engine.logger.info(`缓存统计: 命中 ${stats.hits}, 未命中 ${stats.misses}, 命中率 ${rate}%`)
    }, 30000) // 每30秒

      // 保存 interval 以便清理
      ; (engine as any)._cacheStatsInterval = interval

    engine.logger.info('缓存统计插件已启用')
  },

  uninstall(engine: Engine) {
    // 清理定时器
    const interval = (engine as any)._cacheStatsInterval
    if (interval) {
      clearInterval(interval)
    }

    delete (engine as any).getCacheStats
    delete (engine as any)._cacheStatsInterval

    engine.logger.info('缓存统计插件已卸载')
  }
}

// ============================================
// 使用示例
// ============================================

async function main() {
  const engine = createEngine({
    debug: true
  })

  // 使用简单插件
  engine.use(simplePlugin)

  // 使用带配置的插件
  engine.use(createGreetPlugin({
    message: 'Welcome',
    showTimestamp: true
  }))

    // 使用问候功能
    ; (engine as any).greet('Alice')

  // 使用事件日志插件
  engine.use(eventLoggerPlugin)

  // 触发事件（会被记录）
  engine.events.emit('test:event', { data: 'test' })

  // 使用计数器插件
  engine.use(counterPlugin)

  // 使用计数器
  const counter = (engine as any).counter
  counter.increment()
  counter.increment()
  counter.decrement()

  console.log('当前计数:', counter.getCount())
  console.log('历史记录:', counter.getHistory())

  // 使用缓存统计插件
  engine.use(cacheStatsPlugin)

  // 测试缓存
  await engine.cache.set('user:1', { name: 'Alice' })
  await engine.cache.get('user:1') // 命中
  await engine.cache.get('user:2') // 未命中
  await engine.cache.get('user:1') // 命中

  // 查看统计
  const stats = (engine as any).getCacheStats()
  console.log('缓存统计:', stats)
}

// 运行示例
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export {
  simplePlugin,
  createGreetPlugin,
  eventLoggerPlugin,
  counterPlugin,
  cacheStatsPlugin
}


