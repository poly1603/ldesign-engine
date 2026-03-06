/**
 * 日志演示插件
 *
 * 展示中间件和事件系统用法
 */

import { definePlugin } from '@ldesign/engine-core'

export interface LogEntry {
  timestamp: number
  level: 'info' | 'warn' | 'error'
  message: string
  data?: unknown
}

export const loggerPlugin = definePlugin({
  name: 'logger',
  version: '1.0.0',

  install(context) {
    const { engine } = context

    // 初始化日志状态
    engine.state.set('logger:entries', [] as LogEntry[])
    engine.state.set('logger:maxEntries', 50)

    // 日志方法
    const log = (level: LogEntry['level'], message: string, data?: unknown) => {
      const entries = engine.state.get<LogEntry[]>('logger:entries') ?? []
      const maxEntries = engine.state.get<number>('logger:maxEntries') ?? 50
      const entry: LogEntry = { timestamp: Date.now(), level, message, data }

      const updated = [...entries, entry].slice(-maxEntries)
      engine.state.set('logger:entries', updated)
      engine.events.emit('logger:entry', entry)
    }

    // 注册日志 API（必须包含 name 和 version 字段）
    engine.api.register({
      name: 'logger',
      version: '1.0.0',
      log,
      info(message: string, data?: unknown) {
        log('info', message, data)
      },
      warn(message: string, data?: unknown) {
        log('warn', message, data)
      },
      error(message: string, data?: unknown) {
        log('error', message, data)
      },
      clear() {
        engine.state.set('logger:entries', [])
        engine.events.emit('logger:cleared', {})
      },
    })

    // 注册中间件 - 记录所有中间件通过的操作
    engine.middleware.use({
      name: 'logger-middleware',
      priority: 999,
      async execute(ctx, next) {
        const start = performance.now()
        ;(engine.api as any).get('logger')?.info(`Middleware started`, ctx.data)
        await next()
        const duration = (performance.now() - start).toFixed(2)
        ;(engine.api as any).get('logger')?.info(`Middleware completed in ${duration}ms`)
      },
    })

    console.log('[LoggerPlugin] Installed')
  },

  uninstall(context) {
    const { engine } = context
    engine.state.delete('logger:entries')
    engine.state.delete('logger:maxEntries')
    console.log('[LoggerPlugin] Uninstalled')
  },
})
